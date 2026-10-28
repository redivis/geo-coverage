import { select as d3Select, geoPath as d3GeoPath } from 'd3';

import styles from '../../styles.css';
import costDistance from './costDistance';
import getProjection from '../../helpers/getProjection';

const coverageShownMap = new WeakMap();
const roadSpeeds = {
	trunk: 110,
	motorway: 110,
	primary: 100,
	secondary: 80,
	tertiary: 50,
	unclassified: 30,
	residential: 30,
	service: 30,
	other: 20,
};
const OFF_ROAD_SPEED = 15;
const canvasMap = new WeakMap();
const popCanvasMap = new WeakMap();
const projectionMap = new WeakMap();
const maxDistanceMap = new WeakMap();
const coverageLabelResizeHandlers = new WeakMap();

export function show(maxDistance, resolution, showPopDensity) {
	resolution = parseInt(resolution, 10);

	this.hideCoverage();
	coverageShownMap.set(this, true);

	const canvas = document.createElement('canvas');
	const g = this.svg.select(`.${styles.layerGroup}`);
	const mapWidth = g.select(`.${styles.boundary}`).node().getBBox().width;
	const mapHeight = g.select(`.${styles.boundary}`).node().getBBox().height;
	const useOsmRoadSpeed = this.useOsmRoadSpeed;
	const width = resolution;
	const kmPerPixel = this.widthKilometers / resolution;
	const height = (resolution * mapHeight) / mapWidth;

	const roadsContext = canvas.getContext('2d');
	const projection = getProjection(this.bbox, width, height);

	const bbox = g.select(`.${styles.boundary}`).node().getBBox();
	const costRaster = [];
	const sourceRaster = [];
	const that = this;
	const colorScale = this.colorScale.domain([0, maxDistance]);
	const popCanvas = document.createElement('canvas');
	const popContext = popCanvas.getContext('2d');
	const numTicks = this.colorScale.range().length;
	const minutes = maxDistance * 60;
	const legendTicks = [];

	maxDistanceMap.set(this, maxDistance);
	projectionMap.set(this, projection);

	for (let i = 0; i < numTicks; i++) {
		legendTicks.push(Math.round((minutes / (numTicks - 1)) * i));
	}

	legendTicks.push(`>${minutes}`);

	this.legend.update(this.colorScale.range(), 'Time to Facility', 'minutes', legendTicks);

	canvas.height = height;
	canvas.width = width;

	popCanvas.width = width;
	popCanvas.height = height;
	canvasMap.set(this, canvas);
	popCanvasMap.set(this, popCanvas);

	const path = d3GeoPath().projection(projection);
	const image = new Image();

	image.onload = function () {
		popContext.drawImage(image, 0, 0, width, height);
		popContext.globalCompositeOperation = 'destination-in';
		path.context(popContext);
		path(that.boundary);
		popContext.fill();
		afterImageLoad.call(that);
		image.remove();
	};

	image.src = this.raster.dataURL;

	function afterImageLoad() {
		path.context(roadsContext);

		let MAX_SPEED = 0;
		this.roads.features.forEach((road) => {
			if (!road.properties.speed || !useOsmRoadSpeed) {
				road.properties.speed = roadSpeeds[road.properties.type];
			}
			if (road.properties.speed > MAX_SPEED) {
				MAX_SPEED = road.properties.speed;
			}
		});

		// Sort in reverse order; we want to draw faster roads on top of slower
		this.roads.features.sort((a, b) => {
			return a.properties.speed - b.properties.speed;
		});

		this.roads.features.forEach((road) => {
			const speed = Math.round((road.properties.speed / MAX_SPEED) * 767);
			roadsContext.strokeStyle = `rgba(${Math.floor(speed / 3) + (speed % 3)},${Math.floor(
				speed / 3,
			)},${Math.floor(speed / 3)})`;
			path(road);
			roadsContext.stroke();
		});

		const imageDataObject = roadsContext.getImageData(0, 0, width, height);
		const imageData = imageDataObject.data;
		const popImageDataObject = popContext.getImageData(0, 0, width, height);
		const popImageData = popImageDataObject.data;

		let row = -1;

		for (let i = 0, n = 0, length = imageData.length; i < length; i += 4, n++) {
			if (!(n % canvas.width)) {
				n = 0;
				row++;
				costRaster[row] = [];
				sourceRaster[row] = [];
			}
			if (imageData[i] > 0) {
				// const speed = ((imageData[i] + imageData[i + 1] + imageData[i + 2]) / 767) * MAX_SPEED;
				costRaster[row][n] =
					kmPerPixel / (((imageData[i] + imageData[i + 1] + imageData[i + 2]) / 767) * MAX_SPEED);
			} else {
				costRaster[row][n] = kmPerPixel / OFF_ROAD_SPEED;
			}
		}
		[].concat(this.points, this.unboundPoints).forEach((point) => {
			if (point.serie.isFiltered) return;

			const pixel = projection([point.long, point.lat]);

			pixel[0] = Math.floor(pixel[0]);
			pixel[1] = Math.floor(pixel[1]);
			if (pixel[1] < 0 || pixel[1] > sourceRaster.length - 1) return;

			sourceRaster[pixel[1]][pixel[0]] = point.serie.value;
		});

		const output = costDistance(costRaster, sourceRaster, maxDistance);

		let totalPop = 0;
		let coveredPop = 0;
		let color;

		// Cache for performance
		const maxDistanceColor = colorScale(maxDistance);

		for (let row = 0, col = 0, i = 0, length = imageData.length; i < length; i += 4, col++) {
			if (col === canvas.width) {
				col = 0;
				row++;
			}

			if (showPopDensity) {
				if (popImageData[i] > 12) {
					imageData[i + 3] = Math.round(127 + popImageData[i] * 0.5);
				} else {
					imageData[i + 3] = 12;
				}
			} else {
				imageData[i + 3] = 255;
			}

			if (output[row][col] === null) {
				imageData[i] = 0;
				imageData[i + 1] = 0;
				imageData[i + 2] = 0;
			} else if (output[row][col] !== undefined) {
				color = colorScale(output[row][col].cost);
				imageData[i] = color.r;
				imageData[i + 1] = color.g;
				imageData[i + 2] = color.b;
				coveredPop += popImageData[i];
			} else {
				color = maxDistanceColor;
				imageData[i] = color.r;
				imageData[i + 1] = color.g;
				imageData[i + 2] = color.b;
			}
			totalPop += popImageData[i];
		}

		window.getCostDistanceCsv = function () {
			let csvString = 'latitude,longitude,id,distance(kms),travelTime(mins),avgTravelSpeed(kph)\n';
			for (let row = 0; row < output.length; row++) {
				for (let col = 0; col < output[row].length; col++) {
					const [long, lat] = projection.invert([col, row]);
					const id = output[row][col] === undefined ? '' : output[row][col].id;
					const cost = output[row][col] === undefined ? '' : output[row][col].cost * 60;
					const dist = output[row][col] === undefined ? '' : output[row][col].dist * kmPerPixel;
					csvString += `${lat},${long},${id},${dist},${cost},${dist / (cost / 60) || 0}\n`;
				}
			}
			const file = new File([csvString], 'distanceRaster.csv', { type: 'text/csv' });
			const link = document.createElement('a');
			link.href = window.URL.createObjectURL(file);
			link.setAttribute('download', 'distanceRaster.csv');
			link.click();
		};

		showCoverageLabel(that, coveredPop / totalPop, colorScale.range());
		roadsContext.putImageData(imageDataObject, 0, 0);

		this.defs
			.append('pattern')
			.attr('id', `coverageImage${0}`)
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('patternUnits', 'objectBoundingBox')
			.attr('viewBox', `0 0 ${canvas.width} ${canvas.height}`)
			// .attr('x', bbox.x)
			// .attr('y', bbox.y)
			.attr('class', 'coverageImage')
			.append('image')
			.attr('width', canvas.width)
			.attr('height', canvas.height)
			.attr('xlink:href', canvas.toDataURL());

		g.selectAll('path').style('fill', function () {
			this.__cachedFill__ = d3Select(this).style('fill');
			return 'rgba(0,0,0,0)';
		});

		d3Select(this.boundary.elem).select('path').node().style.fill = `url(${
			window.frameElement && window.frameElement.hasAttribute('srcdoc') ? 'about:srcdoc' : ''
		}#coverageImage0)`;
	}

	function showCoverageLabel(map, ratio) {
		let textBox = map.svg.select(`.${styles.coverageLabel}`);
		if (!textBox.node()) {
			textBox = map.svg.append('g').attr('class', styles.coverageLabel);
		}
		textBox.selectAll('*').remove();
		const number = textBox.append('text').text(`${Math.round(ratio * 1000) / 10}%`);

		if (number.text().indexOf('.') === -1) {
			number.text(`${Math.round(ratio * 1000) / 10}.0%`);
		}

		number.style('font-size', '4rem');

		const description = textBox
			.append('text')
			.text(`Population Covered, ${Math.round(maxDistance * 100) / 100}${maxDistance === 1 ? 'hr' : 'hrs'}`)
			.style('font-size', '2rem')
			.attr('y', () => {
				return number.node().getBBox().height / 2 + 4;
			});

		window.textBox = textBox.node();
		const scale = Math.min(map.svg.attr('width') / 1200, map.svg.attr('height') / 800);
		textBox.attr('transform', `scale(${scale})`);

		window.removeEventListener('resize', coverageLabelResizeHandlers.get(map));
		const onResize = () => {
			const scale = Math.min(map.svg.attr('width') / 1200, Math.min(map.svg.attr('height') / 800));
			textBox.attr(
				'transform',
				`translate(30,${
					parseFloat(map.svg.attr('height')) -
					(textBox.node().getBBox().height - description.attr('y')) * scale -
					10
				})scale(${scale})`,
			);
		};
		coverageLabelResizeHandlers.set(map, onResize);
		window.addEventListener('resize', onResize);
		onResize();
	}
}

export function hide() {
	if (!coverageShownMap.get(this)) return;

	const g = this.svg.select('g');
	const defs = this.svg.select('defs');

	coverageShownMap.set(this, false);

	g.selectAll('path').style('fill', function () {
		return this.__cachedFill__;
	});
	this.svg.select(`.${styles.coverageLabel}`).remove();
	g.node().insertBefore(this.boundary.elem, g.node().firstChild);
	defs.selectAll(`.${styles.coverageImage}`).remove();
	window.removeEventListener('resize', coverageLabelResizeHandlers.get(this));
	coverageLabelResizeHandlers.delete(this);
}

export function getFeatureCoverage(feature) {
	const coverageCanvas = canvasMap.get(this);
	const popCanvas = popCanvasMap.get(this);
	if (!coverageCanvas) return;
	const popContext = popCanvas.getContext('2d');
	const featureBBox = feature.elem.getBBox();
	const boundaryBBox = this.g.select(`.${styles.boundary}`).node().getBBox();
	const projection = projectionMap.get(this);
	const divisor = boundaryBBox.width / coverageCanvas.width;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	const outsideColor = this.colorScale(maxDistanceMap.get(this));
	const path = d3GeoPath().projection(projection);

	canvas.width = coverageCanvas.width;
	canvas.height = coverageCanvas.height;

	context.drawImage(coverageCanvas, 0, 0);
	context.globalCompositeOperation = 'destination-in';

	path.context(context);
	path(feature);
	context.fill();

	const fillData = context.getImageData(
		(featureBBox.x - boundaryBBox.x) / divisor,
		(featureBBox.y - boundaryBBox.y) / divisor,
		featureBBox.width / divisor,
		featureBBox.height / divisor,
	).data;

	const popData = popContext.getImageData(
		(featureBBox.x - boundaryBBox.x) / divisor,
		(featureBBox.y - boundaryBBox.y) / divisor,
		featureBBox.width / divisor,
		featureBBox.height / divisor,
	).data;

	let coveredPop = 0;
	let totalPop = 0;
	const tolerance = 5;

	for (let i = 0; i < fillData.length; i += 4) {
		if (fillData[i + 3] !== 0) {
			if (
				(fillData[i] > outsideColor.r + tolerance || fillData[i] < outsideColor.r - tolerance) &&
				(fillData[i + 1] > outsideColor.g + tolerance || fillData[i + 1] < outsideColor.g - tolerance) &&
				(fillData[i + 2] > outsideColor.b + tolerance || fillData[i + 1] < outsideColor.b - tolerance)
			) {
				coveredPop += popData[i];
			}
			totalPop += popData[i];
		}
	}

	return coveredPop / totalPop;
}

export function getPopulationPercent(feature) {
	//TODO: return ratio of pop in feature to total pop
}

function makePopDensityGrid(populationImageData, width) {
	const popDensityGrid = [];
	let row;
	let sum = 0;
	for (let i = 0; i < populationImageData.length; i += 4) {
		if ((i / 4) % width === 0) {
			row = [];
			popDensityGrid.push(row);
		}
		row.push((populationImageData[i] * 1024) / width);
		sum += row[row.length - 1];
	}
	return popDensityGrid;
}
