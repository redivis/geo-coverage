import LegacyMap from './LegacyMap';

import styles from './styles.css';

export default class MapRenderer {
	constructor(elem, props) {
		this.elem = elem;
		this.collection = null;
		this.mapData = null;
		this.options = {};
		this.settings = {};
		window.addEventListener('resize', this.onResize);
		this.update(props);
	}

	onResize = () => {
		if (this.map) {
			const defaultWidth = 700;
			const defaultHeight = 467;
			const height = this.elem.offsetHeight;
			const width = this.elem.offsetWidth;
			const minRatio = Math.min(height / defaultHeight, width / defaultWidth);
			this.map.resize({ width, height, minRatio });
		}
	};

	update({ collection, mapData, options, settings }) {
		if (mapData) {
			this.elem.classList.add(styles.loading);
			if (
				!this.map ||
				// We need to redraw if data changes or coverage settings change
				collection !== this.collection ||
				mapData !== this.mapData ||
				options.latitudeIndicator !== this.options.latitudeIndicator ||
				options.longitudeIndicator !== this.options.longitudeIndicator ||
				settings.hideRoads !== this.settings.hideRoads ||
				settings.useOsmRoadSpeed !== this.settings.useOsmRoadSpeed ||
				settings.coverageTravelTime !== this.settings.coverageTravelTime ||
				settings.colorScaleBucketCount !== this.settings.colorScaleBucketCount ||
				settings.resolution !== this.settings.resolution ||
				settings.showPopulationDensity !== this.settings.showPopulationDensity ||
				settings.hasDiscreteColorScale !== this.settings.hasDiscreteColorScale
			) {
				this.collection = collection;
				this.mapData = mapData;
				this.options = { ...options };
				this.settings.hideRoads = settings.hideRoads;
				this.settings.coverageTravelTime = settings.coverageTravelTime;
				this.settings.colorScaleBucketCount = settings.colorScaleBucketCount;
				this.settings.resolution = settings.resolution;
				this.settings.useOsmRoadSpeed = settings.useOsmRoadSpeed;
				this.settings.showPopulationDensity = settings.showPopulationDensity;
				this.settings.hasDiscreteColorScale = settings.hasDiscreteColorScale;
				this.elem.innerHTML = '';
				this.map = new LegacyMap(mapData, settings, this.elem);

				if (!settings.hasDiscreteColorScale) {
					this.map.colorScale = this.map.colorScale.type('continuous');
				}

				if (collection && options.latitudeIndicator && options.longitudeIndicator) {
					this.map.bindSeries(collection, options);
					this.map.showCoverage(
						settings.coverageTravelTime / 60,
						settings.resolution,
						settings.showPopulationDensity,
					);
				}
			}

			if (settings.showPoints) {
				this.map.showPoints();
				this.map.resizePoints(settings.pointRadius);
			} else {
				this.map.hidePoints();
			}

			this.onResize();
			this.elem.classList.remove(styles.loading);
		}
	}

	downloadCsv = () => {
		window.getCostDistanceCsv();
	};

	unload() {
		window.removeEventListener('resize', this.onResize);
	}
}
