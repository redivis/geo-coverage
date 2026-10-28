import { format as d3Format } from 'd3';
import styles from '../styles.css';

const LEGEND_WIDTH = 40;
const LEGEND_HEIGHT = 400;
const LEGEND_MARGIN_TOP = 40;

export default function (map) {
	const svg = map.svg;
	let defs = map.svg.select('defs');
	if (!defs.node()) defs = svg.append('defs');
	const gradient = defs.append('linearGradient').attr('id', 'legendGradient');

	const g = svg
		.append('g')
		.attr('class', styles.legend)
		.attr('transform', `translate(${svg.attr('width') - LEGEND_WIDTH},${LEGEND_MARGIN_TOP})`);

	const labelsGroup = g
		.append('g')
		.attr('class', styles.tickLabels)
		.attr('transform', `translate(${-LEGEND_WIDTH - 13},15)`);

	const titleText = g.append('text').attr('class', styles.legendTitle);

	const labelText = g.append('text').attr('class', styles.legendLabel);

	const shadingGroup = g.append('g').attr('transform', 'translate(0,15)rotate(90)');

	this.resize = function () {
		const height = g.node().getBBox().height;
		const scale = Math.min(1, (0.6 * svg.attr('height')) / height);
		g.attr('transform', `translate(${svg.attr('width') - LEGEND_WIDTH},${LEGEND_MARGIN_TOP})scale(${scale})`);
	};

	this.update = function (colors, title, label, domain) {
		this.show();
		let count;
		let step;
		let width;
		let start;
		let shadingMarker;
		const markerWidth = 3;
		let shadingMarkerText;

		titleText.text(title).attr('x', function () {
			return -this.getBBox().width;
		});

		labelText
			.text(label)
			.attr('x', function () {
				return -this.getBBox().width;
			})
			.attr('y', () => {
				return titleText.node().getBBox().height;
			});

		shadingGroup.selectAll('*').remove();
		gradient.selectAll('*').remove();
		labelsGroup.selectAll('*').remove();

		count = colors.length;
		//step = (shadingScale.range()[1] -shadingScale.range()[0]) / (count-1);
		const stepHeight = LEGEND_HEIGHT / (map.colorScale.type() === 'discrete' ? colors.length : colors.length);
		start = colors[0];

		for (let i = 0; i < colors.length; i++) {
			gradient
				.append('stop')
				.attr('offset', () => {
					return map.colorScale.type() === 'discrete'
						? `${(i * 100) / colors.length}%`
						: `${(i * 100) / colors.length}%`;
				})
				.style('stop-color', colors[i]);

			if (map.colorScale.type() === 'discrete') {
				gradient
					.append('stop')
					.attr('offset', `${((i + 1) * 100) / colors.length}%`)
					.style('stop-color', colors[i]);
			}
		}

		for (let i = 0; i < domain.length; i++) {
			labelsGroup
				.append('text')
				.text(isNaN(parseInt(domain[i], 10)) ? domain[i] : d3Format(',.1f')(domain[i]))
				.attr('y', function () {
					return stepHeight * i + this.getBBox().height / 2 - 4;
				})
				.attr('x', function () {
					return -this.getBBox().width;
				});
		}

		const translateY = titleText.node().getBBox().height + labelText.node().getBBox().height;

		labelsGroup.attr('transform', `translate(${-LEGEND_WIDTH - 13},${translateY})`);
		shadingGroup.attr('transform', `translate(0,${translateY})` + `rotate(90)`);

		shadingGroup
			.append('rect')
			.attr('y', 5)
			.attr('width', LEGEND_HEIGHT)
			.attr('height', LEGEND_WIDTH)
			.attr(
				'fill',
				`url(${
					window.frameElement && window.frameElement.hasAttribute('srcdoc') ? 'about:srcdoc' : ''
				}#legendGradient)`,
			);

		shadingMarker = shadingGroup
			.append('rect')
			.attr('width', markerWidth)
			.attr('height', 20)
			.attr('y', 2.5)
			.style('display', 'none');

		shadingMarkerText = shadingGroup.append('text').attr('y', -4).style('display', 'none');
	};

	this.show = function () {
		g.style('display', '');
	};

	this.hide = function () {
		g.style('display', 'none');
	};

	this.showTick = function (val) {};
}
