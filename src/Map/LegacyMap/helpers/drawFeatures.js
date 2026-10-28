import * as d3 from 'd3';
import styles from '../styles.css';

import { onFeatureClickCallbacks, onFeatureHoverCallbacks } from '../index';

export default function (map, g) {
	const layers = g.selectAll(`.${styles.layer}`).data(map.layers, (d) => d.layerName);
	map.layersSelection = layers;
	map.featuresSelection = {};
	layers
		.enter()
		.insert('g', ':last-child')
		.attr('class', (d) => `${styles.layer} ${styles[d.layerName]}`)
		.attr('data-layer', (d) => d.layerName)
		.merge(layers)
		.each(function (layer) {
			const featuresData = layer.features || [layer];
			const features = d3
				.select(this)
				.selectAll(`path.${styles.regions}`)
				.data(featuresData, (feature) => feature.id);
			layer.elem = this;

			map.featuresSelection[layer.layerName] = d3.select(this);

			features
				.enter()
				.append('path')
				.attr('class', styles.regions)
				.attr('data-id', (d) => d.id)
				.attr('d', function (feature) {
					feature.elem = this;
					return map.path(feature);
				})
				.filter((feature) => {
					return feature.type === 'Feature';
				})
				.on('click', function (event, feature) {
					onFeatureClickCallbacks.get(map).forEach((fn) => {
						fn.call(this, feature);
					});
				})
				.on('mouseenter', function (event, feature) {
					onFeatureHoverCallbacks.get(map).forEach((fns) => {
						fns[0].call(this, feature);
					});
				})
				.on('mouseleave', function (event, feature) {
					onFeatureHoverCallbacks.get(map).forEach((fns) => {
						fns[1].call(this, feature);
					});
				});

			// features.enter()
			// 	.merge(features)
			// 	.selectAll('.regions')
			// 	.attr('d', function (feature, i) {
			// 		feature.elem = this;
			// 		console.log(i)
			// 		return map.path(feature);
			// 	});
		});
}
