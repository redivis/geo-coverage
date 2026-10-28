import { useEffect, useRef } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import MapRenderer from './MapRenderer';

import styles from './styles.css';

export default function Map({
	collection,
	mapData,
	isUserAuthorized,
	onAuthorize,
	latitudeIndicator,
	longitudeIndicator,
	coverageTravelTime,
	colorScaleBucketCount,
	resolution,
	hideRoads,
	useOsmRoadSpeed,
	showPoints,
	showPopulationDensity,
	hasDiscreteColorScale,
	pointRadius,
	colorScale,
}) {
	const mapElement = useRef(null);
	const mapRenderer = useRef(null);

	useEffect(() => {
		const props = {
			collection,
			mapData,
			options: { latitudeIndicator, longitudeIndicator },
			settings: {
				coverageTravelTime,
				colorScaleBucketCount,
				resolution,
				hideRoads,
				useOsmRoadSpeed,
				showPoints,
				showPopulationDensity,
				hasDiscreteColorScale,
				pointRadius,
				colorScale,
			},
		};
		if (mapRenderer.current) {
			mapRenderer.current.update(props);
		} else {
			mapRenderer.current = new MapRenderer(mapElement.current, props);
		}
	}, [
		collection,
		mapData,
		latitudeIndicator,
		longitudeIndicator,
		coverageTravelTime,
		colorScaleBucketCount,
		resolution,
		hideRoads,
		useOsmRoadSpeed,
		showPoints,
		showPopulationDensity,
		hasDiscreteColorScale,
		pointRadius,
		colorScale,
	]);

	useEffect(() => {
		return () => {
			mapRenderer.current?.unload();
			mapRenderer.current = null;
		};
	}, []);

	return (
		<>
			<div ref={mapElement} className={styles.wrapper} />
			{isUserAuthorized === false && !mapData && (
				<div className={styles.signInPrompt}>
					<Typography variant={'body1'}>
						{'Sign in to Redivis to load road networks and boundaries from OpenStreetMap.'}
					</Typography>
					<Button variant={'contained'} color={'primary'} onClick={onAuthorize}>
						{'Sign in to Redivis'}
					</Button>
				</div>
			)}
			<div className={styles.downloadButton}>
				<Button
					style={collection && mapData ? {} : { display: 'none' }}
					onClick={() => {
						mapRenderer.current?.downloadCsv();
					}}
					variant={'contained'}
					size={'small'}
				>
					{'Download coverage data'}
				</Button>
			</div>
		</>
	);
}
