import { zoom } from 'd3';

import { onZoomCallbacks } from '../index';

export default function (map) {
	map.zoom = zoom()
		.scaleExtent([0.3, 1000])
		.on('zoom', (event) => {
			map.g.attr('transform', event.transform);
			onZoomCallbacks.get(map).forEach((cb) => cb(map.zoom, event));
		});

	map.zoom(map.svg);
}
