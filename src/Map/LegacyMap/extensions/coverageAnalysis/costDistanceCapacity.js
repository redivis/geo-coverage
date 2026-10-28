import costDistance from './costDistance';

// total population for Zambia = 1,301,198 (sum of population raster)
// Hospital capacities are between 0 - 10,000; mean 5,000

export default function ({ costRaster, sourceRaster, populationRaster, maxDistance }) {
	// console.log(sourceRaster, populationRaster);

	//  TEMP SHIM: This is the old implementation, that doesn't take into account capacity
	const output = costDistance(costRaster, sourceRaster, maxDistance);

	return output;
	// returns sparse two dimensional array of cost (in hours)
	// Null values in array represent areas within 2 hours but unable to reach a facility because it is filled up
}
