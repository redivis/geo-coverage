import { useCallback, useState } from 'react';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { grey } from '@mui/material/colors';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import countries from 'helpers/countryList';
import roadOptions from 'helpers/roadOptions';

import styles from './styles.css';

function getSubregionOptions(region, subregion) {
	const country = countries.find(({ name }) => name === region);
	const subregions = [];
	if (country) {
		subregions.push(...country.subregions);
	}
	if (subregion) {
		subregions.unshift({ name: '' });
	}
	return subregions;
}

const formControlSx = { width: '100%' };
const fieldSx = { mt: '7px', mb: '15px' };
const switchSx = { mt: '7px', mb: '15px', ml: 0 };
const pendingSx = { color: grey[500], mr: '5px' };
const collapseSx = { '&.MuiCollapse-entered': { mb: '10px' } };
const listItemSx = {
	width: 'calc(100% + 60px)',
	color: grey[900],
	pl: '30px',
	ml: '-30px',
	mr: '-30px',
};
const listItemTextSlotProps = { primary: { sx: { fontWeight: 'bold' } } };
const listItemTextSx = { flexShrink: 0, mr: '10px' };
const helperTextSx = { color: grey[500], mb: 0 };

function SectionHeader({ label, isOpen, onToggle, children }) {
	return (
		<ListItemButton onClick={onToggle} sx={listItemSx}>
			<ListItemText primary={label} slotProps={listItemTextSlotProps} sx={listItemTextSx} />
			{children}
			{isOpen ? <ExpandMore /> : <ExpandLess />}
		</ListItemButton>
	);
}

export default function Settings({
	owner,
	setOwner,
	parentEntity,
	setParentEntity,
	table,
	setTable,
	region,
	setRegion,
	subregion,
	setSubregion,
	latitudeIndicator,
	setLatitudeIndicator,
	longitudeIndicator,
	setLongitudeIndicator,
	roads,
	setRoads,
	coverageTravelTime,
	setCoverageTravelTime,
	colorScaleBucketCount,
	setColorScaleBucketCount,
	resolution,
	setResolution,
	hideRoads,
	setHideRoads,
	useOsmRoadSpeed,
	setUseOsmRoadSpeed,
	showPoints,
	setShowPoints,
	showPopulationDensity,
	setShowPopulationDensity,
	hasDiscreteColorScale,
	setHasDiscreteColorScale,
	pointRadius,
	setPointRadius,
	tables,
	isFetchingTables,
	tablesError,
	collection,
	isFetchingCollection,
	collectionError,
	isFetchingMap,
	mapDataError,
}) {
	const resetLatAndLong = useCallback(() => {
		setLatitudeIndicator('');
		setLongitudeIndicator('');
	}, [setLatitudeIndicator, setLongitudeIndicator]);

	const handleSetOwner = (e) => {
		setOwner(e.target.value);
		resetLatAndLong();
	};

	const handleSetParentEntity = (e) => {
		setParentEntity(e.target.value);
		resetLatAndLong();
	};

	const handleSetTable = (e) => {
		setTable(e.target.value);
		resetLatAndLong();
	};

	const handleSetRegion = (e) => {
		setRegion(e.target.value);
		setSubregion('');
	};

	const handleSetRoads = (e) => {
		const nextSelectedRoadsSet = new Set(roads);
		if (e.target.checked) {
			nextSelectedRoadsSet.add(e.target.name);
		} else {
			nextSelectedRoadsSet.delete(e.target.name);
		}
		setRoads([...nextSelectedRoadsSet]);
	};

	const selectedRoadsSet = new Set(roads);

	const subregions = getSubregionOptions(region, subregion);

	const [showTableOptions, setShowTableOptions] = useState(true);
	const [showRegion, setShowRegion] = useState(true);
	const [showLatLong, setShowLatLong] = useState(!!(latitudeIndicator && longitudeIndicator));
	const [showRoads, setShowRoads] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	const selectedListTable = tables.find(({ name }) => name === table.toLowerCase());
	const variableNames = (collection?.variables || []).map(({ name }) => name);

	return (
		<div className={styles.sideBarWrapper}>
			<div className={styles.bodyWrapper}>
				<div className={styles.sectionWrapper}>
					<FormControl component={'fieldset'} error={!!(collectionError || tablesError)} sx={formControlSx}>
						<SectionHeader
							label={'Data'}
							isOpen={showTableOptions}
							onToggle={() => setShowTableOptions(!showTableOptions)}
						>
							{(isFetchingCollection || isFetchingTables) && (
								<CircularProgress size={20} sx={pendingSx} />
							)}
							{table && (
								<Badge badgeContent={''} variant={'dot'} color={'error'} invisible={!collectionError}>
									<Chip size={'small'} label={`${parentEntity}.${table}`} />
								</Badge>
							)}
						</SectionHeader>
						<Collapse in={showTableOptions} sx={collapseSx}>
							<FormGroup>
								<Box sx={fieldSx}>
									<TextField
										name={'owner'}
										label={'Owner'}
										value={owner}
										onChange={handleSetOwner}
										fullWidth={true}
										placeholder={'User or organization'}
									/>
								</Box>
								<Box sx={fieldSx}>
									<TextField
										name={'parentEntity'}
										label={'Dataset/Workflow'}
										value={parentEntity}
										onChange={handleSetParentEntity}
										fullWidth={true}
										placeholder={'dataset or workflow name'}
									/>
								</Box>
								<Box sx={fieldSx}>
									{tables.length ? (
										<TextField
											name={'table'}
											label={'Table'}
											value={selectedListTable ? selectedListTable.name : ''}
											select={true}
											onChange={handleSetTable}
											fullWidth={true}
										>
											{tables.map(({ name }) => (
												<MenuItem key={name} value={name}>
													{name}
												</MenuItem>
											))}
										</TextField>
									) : (
										<TextField
											name={'table'}
											label={'Table'}
											value={table}
											onChange={handleSetTable}
											fullWidth={true}
											placeholder={'table name'}
										/>
									)}
								</Box>
							</FormGroup>
							<FormHelperText>{collectionError?.message || tablesError?.message || ''}</FormHelperText>
						</Collapse>
					</FormControl>
				</div>
				<div className={styles.sectionWrapper}>
					<FormControl component={'fieldset'} error={!!mapDataError} sx={formControlSx}>
						<SectionHeader label={'Region'} isOpen={showRegion} onToggle={() => setShowRegion(!showRegion)}>
							{isFetchingMap && <CircularProgress size={20} sx={pendingSx} />}
							{region && <Chip size={'small'} label={`${region}${subregion ? ` (${subregion})` : ''}`} />}
						</SectionHeader>
						<Collapse in={showRegion} sx={collapseSx}>
							<FormGroup>
								<Box sx={fieldSx}>
									<TextField
										name={'region'}
										label={'Country'}
										value={region}
										select={true}
										onChange={handleSetRegion}
										fullWidth={true}
									>
										{countries.map(({ name }) => (
											<MenuItem key={name} value={name}>
												{name}
											</MenuItem>
										))}
									</TextField>
								</Box>
								<Box sx={fieldSx}>
									<TextField
										name={'subregion'}
										label={'Subregion (optional)'}
										value={subregion}
										select={true}
										onChange={(e) => setSubregion(e.target.value)}
										fullWidth={true}
									>
										{subregions.map(({ name }) => (
											<MenuItem key={name} value={name}>
												{name || '(deselect subregion)'}
											</MenuItem>
										))}
									</TextField>
								</Box>
							</FormGroup>
							<FormHelperText>{mapDataError?.message || ''}</FormHelperText>
						</Collapse>
					</FormControl>
				</div>
				<div className={styles.sectionWrapper}>
					<FormControl
						component={'fieldset'}
						required={true}
						error={!latitudeIndicator || !longitudeIndicator}
						sx={formControlSx}
					>
						<SectionHeader
							label={'Latitude & longitude'}
							isOpen={showLatLong}
							onToggle={() => setShowLatLong(!showLatLong)}
						>
							{isFetchingCollection && <CircularProgress size={20} sx={pendingSx} />}
							<Badge
								badgeContent={''}
								variant={'dot'}
								color={'error'}
								invisible={isFetchingCollection || !!(latitudeIndicator && longitudeIndicator)}
							>
								<Chip
									size={'small'}
									label={`${latitudeIndicator || '_'}/${longitudeIndicator || '_'}`}
								/>
							</Badge>
						</SectionHeader>
						<Collapse in={showLatLong} sx={collapseSx}>
							<FormGroup>
								<Box sx={fieldSx}>
									<TextField
										name={'latitudeIndicator'}
										label={'Latitude'}
										value={variableNames.includes(latitudeIndicator) ? latitudeIndicator : ''}
										select={true}
										onChange={(e) => setLatitudeIndicator(e.target.value)}
										fullWidth={true}
									>
										{variableNames.map((name) => (
											<MenuItem key={name} value={name}>
												{name}
											</MenuItem>
										))}
									</TextField>
								</Box>
								<Box sx={fieldSx}>
									<TextField
										name={'longitudeIndicator'}
										label={'Longitude'}
										value={variableNames.includes(longitudeIndicator) ? longitudeIndicator : ''}
										select={true}
										onChange={(e) => setLongitudeIndicator(e.target.value)}
										fullWidth={true}
									>
										{variableNames.map((name) => (
											<MenuItem key={name} value={name}>
												{name}
											</MenuItem>
										))}
									</TextField>
								</Box>
								{!isFetchingCollection && (!latitudeIndicator || !longitudeIndicator) && (
									<FormHelperText>{`Select ${
										!latitudeIndicator
											? `latitude ${!longitudeIndicator ? 'and longitude' : ''}`
											: 'longitude'
									} variable${!latitudeIndicator && !longitudeIndicator ? 's' : ''}`}</FormHelperText>
								)}
							</FormGroup>
						</Collapse>
					</FormControl>
				</div>
				<div className={styles.sectionWrapper}>
					<FormControl component={'fieldset'} sx={formControlSx}>
						<SectionHeader label={'Roads'} isOpen={showRoads} onToggle={() => setShowRoads(!showRoads)}>
							<Tooltip
								title={
									<>
										<a
											href={'https://wiki.openstreetmap.org/wiki/Key:highway'}
											target={'_blank'}
											rel={'noreferrer'}
										>
											{'Learn more'}
										</a>
										<span>{' about OpenStreetMap roads'}</span>
									</>
								}
								placement={'bottom-start'}
								arrow={true}
							>
								<Chip size={'small'} label={selectedRoadsSet.size} />
							</Tooltip>
						</SectionHeader>
						<Collapse in={showRoads} sx={collapseSx}>
							<FormGroup>
								{roadOptions.map(({ label, name }) => (
									<FormControlLabel
										key={name}
										control={
											<Checkbox
												name={name}
												checked={selectedRoadsSet.has(name)}
												color={'primary'}
												onChange={handleSetRoads}
											/>
										}
										label={label}
									/>
								))}
							</FormGroup>
						</Collapse>
					</FormControl>
				</div>
				<div className={styles.sectionWrapper}>
					<FormControl component={'fieldset'} sx={formControlSx}>
						<SectionHeader
							label={'Settings'}
							isOpen={showSettings}
							onToggle={() => setShowSettings(!showSettings)}
						/>
						<Collapse in={showSettings} sx={collapseSx}>
							<FormGroup>
								<Box sx={fieldSx}>
									<TextField
										name={'coverageTravelTime'}
										label={'Coverage travel time (mins)'}
										value={coverageTravelTime}
										onChange={(e) => setCoverageTravelTime(e.target.value)}
										fullWidth={true}
									/>
								</Box>
								<Box sx={{ ...fieldSx, ml: '11px' }}>
									<FormHelperText sx={helperTextSx}>{'Resolution'}</FormHelperText>
									<RadioGroup
										aria-label={'Resolution'}
										name={'resolution'}
										value={resolution}
										onChange={(e) => setResolution(e.target.value)}
									>
										<FormControlLabel control={<Radio />} value={'1024'} label={'1024'} />
										<FormControlLabel control={<Radio />} value={'2048'} label={'2048'} />
										<FormControlLabel control={<Radio />} value={'3072'} label={'3072'} />
									</RadioGroup>
								</Box>
								<Box sx={fieldSx}>
									<TextField
										name={'colorScaleBucketCount'}
										label={'Color scale buckets'}
										value={colorScaleBucketCount}
										onChange={(e) => setColorScaleBucketCount(e.target.value)}
										fullWidth={true}
									/>
								</Box>
								<FormControlLabel
									control={
										<Switch
											name={'showPopulationDensity'}
											checked={showPopulationDensity}
											onChange={(e) => setShowPopulationDensity(e.target.checked)}
										/>
									}
									label={'Show population density'}
									sx={switchSx}
								/>
								<FormControlLabel
									control={
										<Switch
											name={'hasDiscreteColorScale'}
											checked={hasDiscreteColorScale}
											onChange={(e) => setHasDiscreteColorScale(e.target.checked)}
										/>
									}
									label={'Discrete color scale'}
									sx={switchSx}
								/>
								<FormControlLabel
									control={
										<Switch
											name={'hideRoads'}
											checked={hideRoads}
											onChange={(e) => setHideRoads(e.target.checked)}
										/>
									}
									label={'Hide roads (better performance)'}
									sx={switchSx}
								/>
								<FormControlLabel
									control={
										<Switch
											name={'useOsmRoadSpeed'}
											checked={useOsmRoadSpeed}
											onChange={(e) => setUseOsmRoadSpeed(e.target.checked)}
										/>
									}
									label={'Use OSM road speeds'}
									sx={switchSx}
								/>
								<FormControlLabel
									control={
										<Switch
											name={'showPoints'}
											checked={showPoints}
											onChange={(e) => setShowPoints(e.target.checked)}
										/>
									}
									label={'Show points'}
									sx={switchSx}
								/>
								<Box sx={fieldSx}>
									<TextField
										name={'pointRadius'}
										label={'Point radius (px)'}
										value={pointRadius}
										onChange={(e) => setPointRadius(e.target.value)}
										fullWidth={true}
									/>
								</Box>
							</FormGroup>
						</Collapse>
					</FormControl>
				</div>
			</div>
		</div>
	);
}
