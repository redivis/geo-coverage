import { geoAlbersUsa, geoEquirectangular } from 'd3';

export default function (bbox, width, height) {
	const projection = geoEquirectangular().scale(1).translate([0, 0]);

	const topLeft = projection([bbox[0], bbox[1]]);
	const bottomRight = projection([bbox[2], bbox[3]]);
	const scale =
		1 / Math.max(Math.abs(bottomRight[0] - topLeft[0]) / width, Math.abs(topLeft[1] - bottomRight[1]) / height);

	const translate = [
		(width - scale * (topLeft[0] + bottomRight[0])) / 2,
		(height - scale * (topLeft[1] + bottomRight[1])) / 2,
	];

	projection.scale(scale).translate(translate);

	return projection;
}
