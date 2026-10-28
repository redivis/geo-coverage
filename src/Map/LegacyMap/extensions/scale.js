import { scaleLinear, axisTop, zoomIdentity } from 'd3';
import styles from '../styles.css';

export default function (map) {
	const svg = map.svg;
	const PX_R = 200;
	const kmDistance = (map.widthKilometers / map.width) * PX_R;
	const xUpRange = [0, 200];

	const distanceScale = scaleLinear().domain([0, kmDistance]).range(xUpRange);

	const distanceAxis = axisTop().scale(distanceScale).ticks(5);

	const scale = svg.append('g').attr('class', styles.scale).call(distanceAxis);
	const axisDims = scale.node().getBBox();

	scale
		.append('text')
		.attr('class', styles.label)
		.attr('text-anchor', 'end')
		.attr('fill', '#000')
		.attr('x', axisDims.width + 20)
		.attr('y', -axisDims.height / 2)
		.text('km');

	scale.attr('transform', `translate(30,${axisDims.height + 30})`);

	map.onZoom((zoom, event) => {
		const transform = zoomIdentity.scale(event.transform.k);
		scale.call(distanceAxis.scale(transform.rescaleX(distanceScale)));
	});
}
