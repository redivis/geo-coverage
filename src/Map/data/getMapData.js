import redivis from 'redivis';
import getBBox from '@turf/bbox';

import * as cache from '../../helpers/cache';
import mapRasterLoader from './mapRasterLoader';
import filterUnitedStates from './filterUnitedStates';

// OpenStreetMap administrative boundaries and roads, hosted on Redivis. See ./README.md for how they were derived.
//   They're pinned to a version, so query results can be cached indefinitely.
const ADMIN_TABLE = '`demo.open_street_map:3s4c:v1_0.admin:fr0h`';
const ROADS_TABLE = '`demo.open_street_map:3s4c:v1_0.roads:y9mg`';

// Concurrent requests for the same query share one run
const pendingQueries = new Map();

/**
 * @param queryInfo
 *    region: STR,
 *    subregion: STR, // optional
 *    [roads] : ARRAY(STR IN [motorway, trunk, primary, secondary, tertiary, unclassified, residential])
 * @returns {Promise.<*>}
 */
export default async function getMapData(queryInfo) {
	if (!queryInfo?.region) {
		throw new Error(`Invalid query info:\n${JSON.stringify(queryInfo)}`);
	}

	const promises = [
		executeQuery(getBoundaryQuery(queryInfo)),
		executeQuery(getSubregionsQuery(queryInfo)),
		queryInfo.roads?.length ? executeQuery(getRoadsQuery(queryInfo)) : [],
	];

	let [boundary, regions, roads] = await Promise.all(promises);

	if (!boundary.length) {
		throw new Error(`No boundary was found for ${queryInfo.subregion || queryInfo.region}`);
	}

	boundary = {
		type: 'FeatureCollection',
		features: [{ type: 'Feature', geometry: JSON.parse(boundary[0].geojson) }],
	};
	regions = {
		type: 'FeatureCollection',
		features: regions.map(({ name, geojson }) => {
			return { type: 'Feature', geometry: JSON.parse(geojson), properties: { name } };
		}),
	};

	const roadTypesMap = new Map();
	for (const { speed, type, geojson } of roads) {
		const geometry = JSON.parse(geojson);
		if (geometry.type === 'Point') {
			continue;
		}

		const key = speed || type;
		if (roadTypesMap.has(key)) {
			roadTypesMap.get(key).geometry.geometries.push(geometry);
		} else {
			const properties = { type };
			if (speed) {
				properties.speed = speed;
			}
			roadTypesMap.set(key, {
				type: 'Feature',
				properties,
				geometry: {
					type: 'GeometryCollection',
					geometries: [geometry],
				},
			});
		}
	}

	roads = { type: 'FeatureCollection', features: [...roadTypesMap.values()] };

	if (queryInfo.region === 'United States' && !queryInfo.subregion) {
		[boundary, regions, roads] = filterUnitedStates(boundary, regions, roads);
	}

	let bbox = getBBox(boundary);
	// [minLong, maxLat, maxLong, minLat]
	bbox = [bbox[0], bbox[3], bbox[2], bbox[1]];

	const raster = await mapRasterLoader(bbox, 'population_density');

	return {
		boundary,
		regions,
		roads,
		bbox,
		raster,
	};
}

async function executeQuery(query) {
	if (!pendingQueries.has(query)) {
		pendingQueries.set(
			query,
			runQuery(query).finally(() => pendingQueries.delete(query)),
		);
	}
	return pendingQueries.get(query);
}

async function runQuery(query) {
	const cachedRows = await cache.get(query);
	if (cachedRows) {
		return cachedRows;
	}
	const rows = await redivis.query(query).toRowsArray();
	await cache.set(query, rows);
	return rows;
}

// The area to analyze: the country, or one of its first-level subdivisions (e.g., a state or province)
function getAreaCte({ region, subregion }) {
	const countryCte = `
		country AS (
			SELECT geometry, simplified_geometry
			FROM ${ADMIN_TABLE}
			WHERE admin_level = 2
				AND COALESCE(name_en, name) = ${toSqlString(region)}
		)`;
	if (!subregion) {
		return `WITH ${countryCte}, area AS (SELECT * FROM country)`;
	}
	return `
		WITH ${countryCte},
		area AS (
			SELECT admin.geometry, admin.simplified_geometry
			FROM ${ADMIN_TABLE} admin, country
			WHERE admin.admin_level = 4
				AND ST_CONTAINS(country.geometry, admin.geometry)
				AND COALESCE(admin.name_en, admin.name) = ${toSqlString(subregion)}
		)`;
}

function getBoundaryQuery(queryInfo) {
	return `
		${getAreaCte(queryInfo)}
		SELECT ST_ASGEOJSON(simplified_geometry) AS geojson
		FROM area
	`;
}

// The subdivisions within the area, e.g. the states of a country, or the counties of a state
function getSubregionsQuery(queryInfo) {
	return `
		${getAreaCte(queryInfo)}
		SELECT COALESCE(admin.name_en, admin.name) AS name, ST_ASGEOJSON(admin.simplified_geometry) AS geojson
		FROM ${ADMIN_TABLE} admin, area
		WHERE admin.admin_level = ${queryInfo.subregion ? 6 : 4}
			AND ST_CONTAINS(area.geometry, admin.geometry)
			AND ST_NUMPOINTS(admin.simplified_geometry) > 1
	`;
}

function getRoadsQuery(queryInfo) {
	// Whole countries are matched against their simplified boundary, which is much faster to intersect
	const areaGeometry = queryInfo.subregion ? 'area.geometry' : 'area.simplified_geometry';
	return `
		${getAreaCte(queryInfo)}
		SELECT
			ST_ASGEOJSON(roads.simplified_geometry) AS geojson,
			roads.road_type AS type,
			roads.road_speed AS speed
		FROM ${ROADS_TABLE} roads, area
		WHERE roads.road_type IN (${queryInfo.roads.map(toSqlString).join(', ')})
			AND ST_DWITHIN(${areaGeometry}, roads.simplified_geometry, 0)
			AND ST_NUMPOINTS(roads.simplified_geometry) > 1
	`;
}

// Region names can contain quotes (e.g. "Côte d'Ivoire")
function toSqlString(value) {
	return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
