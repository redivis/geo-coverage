import getBBox from '@turf/bbox';

// For contiguous US
const minLong = -124.848974;
const minLat = 24.396308;
const maxLong = -66.885444;
const maxLat = 49.384358;

export default function (boundary, regions, roads) {
	if (boundary.features[0].geometry?.geometries) {
		boundary.features[0].geometry.geometries = boundary.features[0].geometry.geometries.filter((geometry) => {
			if (geometry.type !== 'MultiPolygon') {
				return false;
			}
			geometry.coordinates = geometry.coordinates
				.map((polygons, i) => {
					return polygons
						.map((polygon) => {
							return polygon.filter(([long, lat]) => {
								return long > minLong && long < maxLong && lat > minLat && lat < maxLat;
							});
						})
						.filter((polygon) => polygon.length);
				})
				.filter((polygons) => polygons.length);
			return true;
		});
	} else if (boundary.features[0].geometry?.coordinates) {
		boundary.features[0].geometry.coordinates = boundary.features[0].geometry.coordinates
			.map((polygons, i) => {
				return polygons
					.map((polygon) => {
						return polygon.filter(([long, lat]) => {
							return long > minLong && long < maxLong && lat > minLat && lat < maxLat;
						});
					})
					.filter((polygon) => polygon.length);
			})
			.filter((polygons) => polygons.length);
	}

	regions.features = regions.features.filter((feature) => {
		const bbox = getBBox(feature);
		return bbox[0] > minLong && bbox[1] > minLat && bbox[2] < maxLong && bbox[3] < maxLat;
	});

	for (const feature of roads.features) {
		feature.geometry.geometries = feature.geometry.geometries.filter((geometry) => {
			const bbox = getBBox(geometry);
			return bbox[0] > minLong && bbox[1] > minLat && bbox[2] < maxLong && bbox[3] < maxLat;
		});
	}

	return [boundary, regions, roads];
}
