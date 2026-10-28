import { scaleLinear as d3ScaleLinear, min as d3Min, max as d3Max } from 'd3';
import styles from '../styles.css';
import { onPointHoverCallbacks, onPointClickCallbacks } from '../index';

export function show(showFiltered) {
	this.svg.select('g').select(`.${styles.points}`).style('display', 'block');
	if (showFiltered) {
		this.svg.select('g').select(`.${styles.points}`).selectAll(`.${styles.point}`).style('display', 'block');
	} else {
		this.svg
			.select('g')
			.select(`.${styles.points}`)
			.selectAll(`.${styles.point}`)
			.each(function (d, i) {
				if (d.serie.isFiltered) {
					this.style.display = 'none';
				}
			});
	}
}

export function hide() {
	this.svg.select('g').select(`.${styles.points}`).style('display', 'none');
}

export function draw(map, points) {
	points = [].concat(points, map.unboundPoints);
	if (points.length < 10000) {
		const d3Points = map.svg.select(`.${styles.points}`).selectAll(`.${styles.point}`).data(points);
		d3Points
			.enter()
			.append('circle')
			.each(function (d) {
				d.circle = this;
			})
			.attr('class', styles.point)
			.attr('cx', (d) => d.x)
			.attr('cy', (d) => d.y)
			.attr('r', 2)
			.on('mouseenter', function (event, d) {
				onPointHoverCallbacks.get(map).forEach((cbs) => cbs[0].call(this, d));
			})
			.on('mouseleave', function (event, d) {
				onPointHoverCallbacks.get(map).forEach((cbs) => cbs[1].call(this, d));
			})
			.on('click', function (event, d) {
				onPointClickCallbacks.get(map).forEach((cb) => cb.call(this, d));
			});

		d3Points.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
	}
}

export function resize(val, { indicator } = {}) {
	const selection = this.svg.select(`.${styles.points}`).selectAll(`.${styles.point}`);

	if (isNaN(parseFloat(val))) {
		return;
	}
	if (val instanceof Array && indicator) {
		const scale = d3ScaleLinear().range(val);
		const valueArray = [];
		selection.each((d) => {
			const datum = indicator.getDatum(d.serie);
			if (datum.value !== null) {
				valueArray.push(datum.value);
			}
		});
		scale.domain([d3Min(valueArray), d3Max(valueArray)]);
		selection.attr('r', function (d) {
			const datum = indicator.getDatum(d.serie);
			if (datum.value === null) {
				this.style.strokeDasharray = `${val[0] / 4} ${val[0] / 8}`;
				return val[0] / 2;
			}
			this.style.strokeDasharray = '';
			return scale(datum.value);
		});
	} else {
		if (val instanceof Array) val = val[0];
		selection.attr('r', val).style('stroke-dasharray', '');
	}
}
