import { geoArea } from 'd3';

// d3-geo expects exterior rings to be clockwise and holes counter-clockwise: the opposite of RFC 7946, which BigQuery's
//   ST_ASGEOJSON follows. A ring wound the other way is drawn as its complement, covering the rest of the globe.
export default function (rings) {
	rings.forEach((ring, i) => {
		const isHole = i > 0;
		const coversMostOfGlobe = geoArea({ type: 'Polygon', coordinates: [ring] }) > 2 * Math.PI;
		if (coversMostOfGlobe !== isHole) {
			ring.reverse();
		}
	});
}
