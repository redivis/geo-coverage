import { select as d3Select, geoPath as d3GeoPath } from 'd3';
import colorbrewer from 'colorbrewer';
import styles from './styles.css';
import colorScale from './helpers/colorScale';
import drawFeatures from './helpers/drawFeatures';
import zoom from './helpers/zoom';
import bindTooltips from './helpers/bindTooltips';
import cleanPolygon from './helpers/cleanPolygon';
import getGreatCircle from './helpers/getGreatCircle';
import getProjection from './helpers/getProjection';
import Legend from './extensions/legend';
import scale from './extensions/scale';
import * as points from './extensions/points';
import bindSeries from './extensions/bindSeries';
import resize from './extensions/resize';
import * as coverageAnalysis from './extensions/coverageAnalysis';

export const onZoomCallbacks = new WeakMap();
export const onFeatureClickCallbacks = new WeakMap();
export const onFeatureHoverCallbacks = new WeakMap();
export const onPointClickCallbacks = new WeakMap();
export const onPointHoverCallbacks = new WeakMap();

export default class Map {
	constructor(
		{ boundary, regions, roads, raster, bbox },
		{ hideRoads, useOsmRoadSpeed, colorScaleBucketCount = 9 },
		container,
	) {
		const width = 800;
		const height = 600;
		const projection = getProjection(bbox, width, height);
		const svg = d3Select(container).append('svg').attr('id', 'map_svg').attr('width', width).attr('height', height);
		const g = (this.g = svg.insert('g', ':first-child').attr('class', styles.layerGroup));

		g.append('g').attr('class', styles.points);

		onZoomCallbacks.set(this, []);
		onFeatureClickCallbacks.set(this, []);
		onFeatureHoverCallbacks.set(this, []);
		onPointClickCallbacks.set(this, []);
		onPointHoverCallbacks.set(this, []);

		this.colorScale = colorScale(
			[].concat(colorbrewer.RdYlBu[Math.min(Math.max(colorScaleBucketCount, 3), 9)]).reverse(),
		);
		this.raster = raster;
		this.projection = projection;
		this.svg = svg;
		this.roads = roads;
		this.regions = [];
		this.width = width;
		this.useOsmRoadSpeed = useOsmRoadSpeed;
		this.height = height;
		this.bbox = bbox;
		this.widthKilometers = getGreatCircle(
			(this.bbox[3] + this.bbox[1]) / 2,
			this.bbox[0],
			(this.bbox[3] + this.bbox[1]) / 2,
			this.bbox[2],
		);

		this.defs = svg.append('defs');
		this.legend = new Legend(this);
		this.path = d3GeoPath().projection(projection);

		zoom(this);
		scale(this);
		bindTooltips(this);

		boundary.layerName = 'boundary';
		regions.layerName = 'regions';
		roads.layerName = 'roads';
		this.boundary = boundary;
		this.regions = regions;

		this.layers = [boundary, regions];
		if (!hideRoads) {
			this.layers.push(roads);
		}

		// let layer;
		//
		// if (topology.objects) {
		// 	for (const k in topology.objects) {
		// 		// if (!topology.objects[k].geometries || !topology.objects[k].geometries.length) continue;
		// 		if (k.indexOf('road') > -1) {
		// 			layer = topojson.mesh(topology, topology.objects[k]);
		// 		} else {
		// 			layer = topojson.feature(topology, topology.objects[k]);
		// 		}
		// 		layers.push(layer);
		// 		layer.layerName = k;
		// 		if (k === 'boundary') {
		// 			this.boundary = layer;
		// 			layer.layerType = 'boundary';
		// 		} else if (k.indexOf('road') > -1) {
		// 			this.roads.push(layer);
		// 			layer.layerType = 'road';
		// 		} else {
		// 			this.regions.push(layer);
		// 			layer.layerType = 'region';
		// 		}
		// 	}
		// 	if (layers.length === 1 && layer.layerType !== 'region') {
		// 		layer.layerType = 'region';
		// 		this.regions.push(layer);
		// 	}
		// } else {
		// 	layers.push(topology);
		// 	topology.layerType = 'region';
		// 	this.boundary = topology;
		// }
		//
		// layers.sort((a, b) => {
		// 	if (a.layerType === 'boundary') return -1;
		// 	if (a.layerType === 'road') return 1;
		// 	if (b.layerType === 'boundary') return 1;
		// 	if (b.layerType === 'road') return -1;
		// 	return a.layerName.localeCompare(b.layerName);
		// });
		//
		this.layers.forEach((layer) => {
			if (layer.type !== 'FeatureCollection') return;
			layer.features.forEach((feature, i) => {
				if (feature.geometry.type === 'Polygon') {
					cleanPolygon(feature.geometry.coordinates);
				} else if (feature.geometry.type === 'MultiPolygon') {
					feature.geometry.coordinates.forEach((rings) => {
						cleanPolygon(rings);
					});
				} else if (feature.geometry.type === 'GeometryCollection') {
					feature.geometry.geometries.forEach((geometry) => {
						if (geometry.type === 'Polygon') {
							cleanPolygon(geometry.coordinates);
						} else if (geometry.type === 'MultiPolygon') {
							geometry.coordinates.forEach((rings) => {
								cleanPolygon(rings);
							});
						}
					});
				}
			});
		});

		drawFeatures(this, g);
	}

	onZoom(cb) {
		onZoomCallbacks.get(this).push(cb);
	}

	onFeatureClick(cb) {
		onFeatureClickCallbacks.get(this).push(cb);
	}

	onFeatureHover(onEnter, onLeave) {
		onFeatureHoverCallbacks.get(this).push([onEnter, onLeave]);
	}

	onPointClick(cb) {
		onPointClickCallbacks.get(this).push(cb);
	}

	onPointHover(onEnter, onLeave) {
		onPointHoverCallbacks.get(this).push([onEnter, onLeave]);
	}

	setColorScale(scale) {
		this.colorScale = scale;
	}

	getFeatureId(layer, feature) {
		// if (feature.properties.tags && feature.properties.tags['county:name']){
		// 	return feature.properties.tags['county:name'];
		// }
		if (this.info.idProperty) {
			if (this.info.idProperty instanceof Array) {
				return this.info.idProperty.reduce((str, prop) => {
					let property;
					if (prop.split('.').length > 1) {
						const arr = prop.split('.');
						for (const val of arr) {
							if (property) {
								property = feature.properties[val];
							}
						}
					} else {
						property = feature.properties[prop];
					}
					if (this.info.propertyMap && this.info.propertyMap[prop]) {
						property = this.info.propertyMap[prop][property];
					}
					return (str.length ? `${str}, ` : str) + property;
				}, '');
			} else {
				return feature.properties[this.info.idProperty];
			}
		} else {
			if (feature.id) {
				return feature.id;
			} else {
				if (feature.properties.id) {
					return feature.properties.id;
				} else {
					return Math.random();
				}
			}
		}
	}
}

Map.prototype.showPoints = points.show;
Map.prototype.hidePoints = points.hide;
Map.prototype.resizePoints = points.resize;
Map.prototype.bindSeries = bindSeries;
Map.prototype.showCoverage = coverageAnalysis.show;
Map.prototype.hideCoverage = coverageAnalysis.hide;
Map.prototype.getFeatureCoverage = coverageAnalysis.getFeatureCoverage;
Map.prototype.resize = resize;
