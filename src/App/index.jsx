import { useCallback, useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { authorize, deauthorize, isAuthorized } from 'redivis';

import Header from '../Header';
import Map from '../Map';
import Settings from '../Settings';

import getTables from 'helpers/getTables';
import getCollection from 'helpers/getCollection';
import getMapData from '../Map/data/getMapData';
import useDebouncedResource from 'helpers/useDebouncedResource';

import styles from './styles.css';

const INPUT_TIMEOUT_MS = 1000;
const MAP_TIMEOUT_MS = 1000;

const DEFAULT_OWNER = 'Demo';
const DEFAULT_PARENT_ENTITY = 'geospatial_coverage_analysis';
const DEFAULT_TABLE = 'california_hospitals';
const DEFAULT_REGION = 'United States';
const DEFAULT_SUBREGION = 'California';
const DEFAULT_LATITUDE_INDICATOR = '';
const DEFAULT_LONGITUDE_INDICATOR = '';
const DEFAULT_ROADS = ['motorway', 'trunk', 'primary'];

const DEFAULT_COVERAGE_TRAVEL_TIME = '120';
const DEFAULT_RESOLUTION = '1024';
const DEFAULT_SHOW_POINTS = true;
const DEFAULT_HIDE_ROADS = false;
const DEFAULT_USE_OSM_ROAD_SPEED = true;
const DEFAULT_SHOW_POPULATION_DENSITY = false;
const DEFAULT_HAS_DISCRETE_COLOR_SCALE = false;
const DEFAULT_COLOR_SCALE_BUCKET_COUNT = '9';
const DEFAULT_POINT_RADIUS = '2';
const DEFAULT_COLOR_SCALE = [];

const latRegex = /lat/i;
const longRegex = /lo?ng/i;
const latLongTypes = new Set(['float', 'string']);

function guessLatAndLongIndicators(collection) {
	let latitude = '';
	let longitude = '';
	for (const variable of collection.variables) {
		if (!latitude && latRegex.test(variable.name) && latLongTypes.has(variable.type)) {
			latitude = variable.name;
		}
		if (!longitude && longRegex.test(variable.name) && latLongTypes.has(variable.type)) {
			longitude = variable.name;
		}
		if (latitude && longitude) {
			break;
		}
	}
	return { latitude, longitude };
}

const theme = createTheme({
	palette: {
		primary: {
			light: '#a88bc9',
			main: '#7f3b97',
			dark: '#5e1e75',
			contrastText: '#ffffff',
		},
		secondary: {
			light: '#d4d3db',
			main: '#4d4c54',
			dark: '#353538',
			contrastText: '#ffffff',
		},
	},
	shape: {
		borderRadius: 2,
	},
});

export default function App() {
	// null until we know whether there are cached credentials
	const [isUserAuthorized, setIsUserAuthorized] = useState(null);

	const updateIsUserAuthorized = useCallback(async () => {
		setIsUserAuthorized(await isAuthorized());
	}, []);

	useEffect(() => {
		isAuthorized().then(setIsUserAuthorized);
	}, []);

	const handleAuthorize = useCallback(async () => {
		try {
			await authorize();
		} catch (e) {
			// e.g., the user closed the sign-in window
			console.error(e);
		}
		updateIsUserAuthorized();
	}, [updateIsUserAuthorized]);

	const handleDeauthorize = useCallback(async () => {
		await deauthorize();
		updateIsUserAuthorized();
	}, [updateIsUserAuthorized]);

	const [owner, setOwner] = useState(DEFAULT_OWNER);
	const [parentEntity, setParentEntity] = useState(DEFAULT_PARENT_ENTITY);
	const [table, setTable] = useState(DEFAULT_TABLE);

	const [region, setRegion] = useState(DEFAULT_REGION);
	const [subregion, setSubregion] = useState(DEFAULT_SUBREGION);
	const [latitudeIndicator, setLatitudeIndicator] = useState(DEFAULT_LATITUDE_INDICATOR);
	const [longitudeIndicator, setLongitudeIndicator] = useState(DEFAULT_LONGITUDE_INDICATOR);
	const [roads, setRoads] = useState(DEFAULT_ROADS);

	// Tables and their data are refetched when the user signs in or out, since that may change what they can access
	const {
		data: tables,
		isFetching: isFetchingTables,
		error: tablesError,
	} = useDebouncedResource(() => getTables(`${owner}.${parentEntity}`), [owner, parentEntity, isUserAuthorized], {
		delay: INPUT_TIMEOUT_MS,
		enabled: !!(owner && parentEntity),
	});

	const {
		data: collection,
		isFetching: isFetchingCollection,
		error: collectionError,
	} = useDebouncedResource(
		() => getCollection(`${owner}.${parentEntity}.${table}`),
		[owner, parentEntity, table, isUserAuthorized],
		{
			delay: INPUT_TIMEOUT_MS,
			enabled: !!(owner && parentEntity && table),
			onSuccess: (nextCollection) => {
				const { latitude, longitude } = guessLatAndLongIndicators(nextCollection);
				if (latitude) {
					setLatitudeIndicator(latitude);
				}
				if (longitude) {
					setLongitudeIndicator(longitude);
				}
			},
		},
	);

	// Map data comes from Redivis queries, which require the user to be signed in
	const {
		data: mapData,
		isFetching: isFetchingMap,
		error: mapDataError,
	} = useDebouncedResource(() => getMapData({ region, subregion, roads: [...roads] }), [region, subregion, roads], {
		delay: MAP_TIMEOUT_MS,
		enabled: isUserAuthorized === true,
	});

	const [coverageTravelTime, setCoverageTravelTime] = useState(DEFAULT_COVERAGE_TRAVEL_TIME);
	const [colorScaleBucketCount, setColorScaleBucketCount] = useState(DEFAULT_COLOR_SCALE_BUCKET_COUNT);

	const [resolution, setResolution] = useState(DEFAULT_RESOLUTION);
	const [hideRoads, setHideRoads] = useState(DEFAULT_HIDE_ROADS);
	const [useOsmRoadSpeed, setUseOsmRoadSpeed] = useState(DEFAULT_USE_OSM_ROAD_SPEED);
	const [showPoints, setShowPoints] = useState(DEFAULT_SHOW_POINTS);
	const [showPopulationDensity, setShowPopulationDensity] = useState(DEFAULT_SHOW_POPULATION_DENSITY);
	const [hasDiscreteColorScale, setHasDiscreteColorScale] = useState(DEFAULT_HAS_DISCRETE_COLOR_SCALE);
	const [pointRadius, setPointRadius] = useState(DEFAULT_POINT_RADIUS);
	const [colorScale] = useState(DEFAULT_COLOR_SCALE);

	return (
		<ThemeProvider theme={theme}>
			<div className={styles.appWrapper}>
				<Header
					title={'Geospatial coverage analyzer'}
					isUserAuthorized={!!isUserAuthorized}
					onAuthorize={handleAuthorize}
					onDeauthorize={handleDeauthorize}
				/>
				<div className={styles.bodyWrapper}>
					<div className={styles.mapWrapper}>
						<div className={styles.settings}>
							<Settings
								owner={owner}
								setOwner={setOwner}
								parentEntity={parentEntity}
								setParentEntity={setParentEntity}
								table={table}
								setTable={setTable}
								region={region}
								setRegion={setRegion}
								subregion={subregion}
								setSubregion={setSubregion}
								latitudeIndicator={latitudeIndicator}
								setLatitudeIndicator={setLatitudeIndicator}
								longitudeIndicator={longitudeIndicator}
								setLongitudeIndicator={setLongitudeIndicator}
								roads={roads}
								setRoads={setRoads}
								coverageTravelTime={coverageTravelTime}
								setCoverageTravelTime={setCoverageTravelTime}
								colorScaleBucketCount={colorScaleBucketCount}
								setColorScaleBucketCount={setColorScaleBucketCount}
								resolution={resolution}
								setResolution={setResolution}
								hideRoads={hideRoads}
								setHideRoads={setHideRoads}
								useOsmRoadSpeed={useOsmRoadSpeed}
								setUseOsmRoadSpeed={setUseOsmRoadSpeed}
								showPoints={showPoints}
								setShowPoints={setShowPoints}
								showPopulationDensity={showPopulationDensity}
								setShowPopulationDensity={setShowPopulationDensity}
								hasDiscreteColorScale={hasDiscreteColorScale}
								setHasDiscreteColorScale={setHasDiscreteColorScale}
								pointRadius={pointRadius}
								setPointRadius={setPointRadius}
								tables={tables || []}
								isFetchingTables={isFetchingTables}
								tablesError={tablesError}
								collection={collection}
								isFetchingCollection={isFetchingCollection}
								collectionError={collectionError}
								isFetchingMap={isFetchingMap}
								mapDataError={mapDataError}
							/>
						</div>
						<div className={styles.map}>
							<Map
								collection={collection}
								mapData={mapData}
								isUserAuthorized={isUserAuthorized}
								onAuthorize={handleAuthorize}
								latitudeIndicator={latitudeIndicator}
								longitudeIndicator={longitudeIndicator}
								coverageTravelTime={coverageTravelTime}
								colorScaleBucketCount={colorScaleBucketCount}
								resolution={resolution}
								hideRoads={hideRoads}
								useOsmRoadSpeed={useOsmRoadSpeed}
								showPoints={showPoints}
								showPopulationDensity={showPopulationDensity}
								hasDiscreteColorScale={hasDiscreteColorScale}
								pointRadius={pointRadius}
								colorScale={colorScale}
							/>
						</div>
					</div>
				</div>
			</div>
		</ThemeProvider>
	);
}
