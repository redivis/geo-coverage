export default function (geojson) {
	let minLat = 90;
	let maxLat = -90;
	let minLong = 180;
	let maxLong = -180;
	geojson.features.forEach((feature) => {
		if (!feature.geometry) return;
		feature.geometry.coordinates.forEach((polygon) => {
			if (feature.geometry.type === 'MultiPolygon') {
				polygon.forEach((ring) => {
					ring.forEach((coord) => {
						if (coord[0] < minLong) minLong = coord[0];
						if (coord[1] < minLat) minLat = coord[1];
						if (coord[0] > maxLong) maxLong = coord[0];
						if (coord[1] > maxLat) maxLat = coord[1];
					});
				});
			} else {
				polygon.forEach((coord) => {
					if (coord[0] < minLong) minLong = coord[0];
					if (coord[1] < minLat) minLat = coord[1];
					if (coord[0] > maxLong) maxLong = coord[0];
					if (coord[1] > maxLat) maxLat = coord[1];
				});
			}
		});
	});
	if (minLong < -180) minLong = -180;
	if (maxLong > 180) maxLong = 179.9;
	if (minLat < -90) minLat = -90;
	if (maxLat > 90) maxLat = 90;
	return [minLong, maxLat, maxLong, minLat];
}
