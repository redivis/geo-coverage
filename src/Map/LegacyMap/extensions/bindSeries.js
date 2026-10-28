import FuzzySet from 'fuzzyset.js';

import binarySearch from '../helpers/binarySearch';
import synonymsMap from '../helpers/synonyms';
import { draw as drawPoints } from './points';

export default function (collection, geoData) {
	if (!this.points) this.points = [];
	const that = this;
	this.collection = collection;
	const series = collection.series;
	let longitudeIndicator;
	let latitudeIndicator;
	let idIndicators;

	if (geoData.longitudeIndicator) {
		longitudeIndicator = collection.getIndicator(geoData.longitudeIndicator);
		latitudeIndicator = collection.getIndicator(geoData.latitudeIndicator);
	}
	if (geoData.idIndicators) {
		idIndicators = geoData.idIndicators
			.map((val) => {
				return collection.getIndicator(val);
			})
			.filter((val) => val);
	}

	const coordinates = [];
	this.points.length = 0;
	if (this.unboundPoints) this.unboundPoints.length = 0;
	else this.unboundPoints = [];
	let index = 0;
	const points = this.points;
	const matchedFeatures = [];
	const ids = [];
	series.forEach((s, i) => {
		const obj = { serie: s, features: [] };

		if (latitudeIndicator && longitudeIndicator) {
			obj.lat = latitudeIndicator.getDatum(s).value;
			obj.long = longitudeIndicator.getDatum(s).value;
			if ((!obj.lat || !obj.long) && !idIndicators) {
				return;
			}
		}

		if (idIndicators && idIndicators.length) {
			obj.id = idIndicators.reduce((str, indicator) => {
				return (str.length ? `${str}, ` : str) + indicator.getDatum(s).value;
			}, '');
		} else {
			obj.id = s.value;
		}

		obj.index = index++;
		coordinates.push(obj);
	});

	let layer = this.regions || this.boundary;

	const featureIdMap = {};
	const features = layer ? layer.features : [];

	features.forEach((feature) => {
		if (!feature.points) {
			feature.series = [];
			feature.points = [];
		}
		feature.series.length = 0;
		feature.points.length = 0;
		if (feature.properties && feature.properties.GEO_ID === '0400000US22') {
			// shim for US map
			feature.elem.style.display = 'none';
		}
		if (feature.id || geoData.idProperty) {
			let id;
			if (geoData.idProperty) {
				if (geoData.idProperty instanceof Array) {
					id = feature.properties;
					geoData.idProperty.forEach((prop) => {
						if (id) {
							id = id[prop];
						}
					});
					if (!id) {
						feature.elem.style.display = 'none';
						// console.log(feature);
					}
				} else {
					id = feature.properties[geoData.idProperty];
				}
				if (id) {
					feature.name = id;
				}
			} else {
				id = feature.id;
			}
			if (id !== undefined) {
				ids.push(String(id));
				featureIdMap[id] = feature;
			}
		}

		for (const k in feature.properties) {
			const mappedVal = synonymsMap[feature.properties[k]];
			if (featureIdMap[feature.properties[k]] === false) {
				continue;
			}
			if (featureIdMap[feature.properties[k]]) {
				featureIdMap[feature.properties[k]] = false;
			} else {
				featureIdMap[feature.properties[k]] = feature;
			}
			if (!mappedVal) {
				continue;
			}

			featureIdMap[mappedVal] = feature;
			// feature.name = mappedVal;
		}
	});

	// if (latitudeIndicator && longitudeIndicator) {
	// 	const sortedLong = [].concat(coordinates).sort((a, b) => {
	// 		return a.long - b.long;
	// 	});
	// 	const sortedLat = [].concat(coordinates).sort((a, b) => {
	// 		return a.lat - b.lat;
	// 	});
	// 	features.forEach((feature) => {
	// 		feature.matched = false;
	// 		//TODO: Smarter algorithm that handles holes
	// 		let bbox = feature.geometry.coordinates[0].bbox;
	// 		feature.bbox = bbox;
	// 		let validX = {};
	// 		let validY = {};
	// 		if (feature.geometry.type === 'MultiPolygon') {
	// 			feature.bbox = feature.geometry.coordinates[0][0].bbox;
	// 			if (!feature.bbox) return;
	// 			feature.geometry.coordinates.forEach((polygon) => {
	// 				bbox = polygon[0].bbox;
	// 				const tempX = findPoints([bbox[0], bbox[2]], sortedLong, isInHorizontalBox);
	// 				const tempY = findPoints([bbox[3], bbox[1]], sortedLat, isInVerticalBox);
	// 				for (const index in tempX) {
	// 					validX[index] = true;
	// 				}
	// 				for (const index in tempY) {
	// 					validY[index] = true;
	// 				}
	// 			});
	// 		} else {
	// 			if (!feature.bbox) return;
	//
	// 			validX = findPoints([bbox[0], bbox[2]], sortedLong, isInHorizontalBox);
	// 			validY = findPoints([bbox[3], bbox[1]], sortedLat, isInVerticalBox);
	// 		}
	//
	// 		let found = false;
	// 		for (const i in validX) {
	// 			if (validY[i]) {
	// 				coordinates[i].features.push(feature);
	// 				found = true;
	// 			}
	// 		}
	// 	});
	// }
	const fuzzySet = new FuzzySet(ids);

	coordinates.forEach((point) => {
		let feature = featureIdMap[point.id];
		if (!feature) feature = featureIdMap[synonymsMap[point.id]];
		// Row values are typed (e.g., numeric ids), but FuzzySet only accepts strings
		if (!feature && point.features.length === 0 && point.id !== null && point.id !== undefined) {
			const match = fuzzySet.get(String(point.id));
			if (match && match.length) {
				feature = featureIdMap[match[0][1]];
			}
		}
		if (feature && feature.elem) {
			feature.points.push(point);
			const coords = that.projection.invert([feature.elem.getBBox().x, feature.elem.getBBox().y]);
			point.x = coords[0];
			point.y = coords[1];
			points.push(point);
			if (!feature.name) {
				feature.name = feature.properties.name || feature.properties.NAME;
			}
			feature.series.push(point.serie);
			if (!feature.matched) {
				matchedFeatures.push(feature);
				feature.matched = true;
			}
		} else if (point.features.length === 1) {
			feature = point.features[0];
			feature.points.push(point);

			points.push(point);
			feature.series.push(point.serie);
			if (!feature.matched) {
				matchedFeatures.push(feature);
				feature.matched = true;
			}
		} else if (point.features.length > 1) {
			if (idIndicators) {
				const possibleFeatures = [];
				const name = String(point.serie.value).split('_')[0];
				for (let i = 0, length = point.features.length; i < length; i++) {
					if (
						point.features[i].properties.name.indexOf(name) > -1 ||
						(point.features[i].parent && point.features[i].parent.properties.name.indexOf(name) > -1)
					) {
						possibleFeatures.push(point.features[i]);
					}
				}
				if (possibleFeatures.length === 1) {
					feature = possibleFeatures[0];
				} else if (possibleFeatures.length > 0) {
					point.features = possibleFeatures;
				}
			}
			if (!feature) feature = pointInPolygon(point);
			if (!feature) {
				this.unboundPoints.push(point);
				return;
			}
			feature.series.push(point.serie);
			feature.points.push(point);
			points.push(point);
			if (!feature.matched) {
				matchedFeatures.push(feature);
				feature.matched = true;
			}
		} else {
			this.unboundPoints.push(point);
		}
		point.features.length = 0;
	});

	this.points = this.points.filter((point) => {
		return point.long !== undefined && point.lat !== undefined;
	});

	[].concat(this.points, this.unboundPoints).forEach((point) => {
		const proj = that.projection([point.long, point.lat]);
		if (proj) {
			point.x = proj[0];
			point.y = proj[1];
		}
	});

	drawPoints(this, this.points);

	return matchedFeatures;
}

function isInHorizontalBox(point, domain) {
	if (domain[0] < 0 && domain[1] < 0) {
		if (point.long > domain[0] && point.long < domain[1]) return 0;
		else if (point.long < domain[0]) return -1;
		else return 1;
	} else if (domain[0] < 0 && domain[1] > 0) {
		if (point.long > domain[0] && point.long < domain[1]) return 0;
		else if (point.long > domain[1]) return 1;
		else return -1;
	} else if (domain[0] > 0 && domain[1] < 0) {
		if (point.long > domain[0] && point.long > domain[1]) return 0;
		else if (point.long < domain[1]) return -1;
		else return 1;
	} else {
		if (point.long > domain[0] && point.long < domain[1]) return 0;
		else if (point.long > domain[1]) return 1;
		else return -1;
	}
}

function isInVerticalBox(point, domain) {
	if (domain[0] < 0 && domain[1] < 0) {
		if (point.lat < domain[0] && point.lat > domain[1]) return 0;
		else if (point.lat > domain[0]) return 1;
		else return -1;
	} else if (domain[0] > 0 && domain[1] < 0) {
		if (point.lat < domain[0] && point.lat > domain[1]) return 0;
		else if (point.lat < domain[1]) return -1;
		else return 1;
	} else {
		if (point.lat < domain[0] && point.lat > domain[1]) return 0;
		else if (point.lat < domain[1]) return -1;
		else return 1;
	}
}

function pointInPolygon(point) {
	let found;
	point.features.forEach((feature) => {
		if (!feature.geometry) return;

		feature.geometry.coordinates.forEach((coords) => {
			if (feature.geometry.type === 'MultiPolygon') {
				coords = coords.reduce((a, b) => {
					return a.concat(b);
				}, []);
			}

			let xi;
			let xj;
			let i;
			let intersect;
			let yi;
			let yj;
			let j;
			const x = point.long;
			const y = point.lat;
			let inside = false;
			for (i = 0, j = coords.length - 1; i < coords.length; j = i++) {
				xi = coords[i][0];
				yi = coords[i][1];
				xj = coords[j][0];
				yj = coords[j][1];
				intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
				if (intersect) {
					inside = !inside;
				}
			}
			if (inside) {
				if (found) {
					const foundArea = Math.abs((found.bbox[2] - found.bbox[0]) * (found.bbox[3] - found.bbox[1]));
					const newArea = Math.abs((feature.bbox[2] - feature.bbox[0]) * (feature.bbox[3] - feature.bbox[1]));
					if (newArea < foundArea) {
						found = feature;
					}
				} else {
					found = feature;
				}
			}
		});
	});

	return found;
}

function findPoints(domain, arr, domainFn) {
	const hash = {};
	let leftIndex = binarySearch(arr, domain, domainFn);
	let rightIndex = leftIndex;

	if (leftIndex === -1) return hash;
	hash[arr[leftIndex].index] = true;
	if (arr.length === 1) return hash;
	if (leftIndex === 0) leftIndex = arr.length;
	if (rightIndex === arr.length - 1) rightIndex = -1;

	while (domainFn(arr[--leftIndex], domain) === 0 && leftIndex !== rightIndex) {
		hash[arr[leftIndex].index] = true;
		if (leftIndex === 0) leftIndex = arr.length;
	}
	while (domainFn(arr[++rightIndex], domain) === 0 && leftIndex !== rightIndex) {
		hash[arr[rightIndex].index] = true;
		if (rightIndex === arr.length - 1) rightIndex = -1;
	}
	return hash;
}
