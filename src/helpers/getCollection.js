import redivis from 'redivis';
import * as cache from './cache';

const MAX_ROWS = 1e4;
const MAX_BYTES = 1e7;

// Reads a table of points, e.g. `owner.dataset_name.table_name`
export default async function getCollection(tableReference) {
	const table = await redivis.table(tableReference).get();
	const { numRows, numBytes, accessLevel, hash } = table.properties;

	if (numBytes > MAX_BYTES || numRows > MAX_ROWS) {
		throw new Error(`Can only fetch tables that are less than or equal to 10,000 records and 10MB`);
	}
	if (accessLevel === 'overview' || accessLevel === 'metadata') {
		throw new Error(`You must have data access to this table. Current access level is "${accessLevel}"`);
	}

	const cacheKey = `${table.qualifiedReference}_${hash}`;
	const cachedResponse = await cache.get(cacheKey);
	if (cachedResponse) {
		const { variables, rows } = cachedResponse;
		return new Collection(variables, rows);
	}

	// Each variable's index is its position in the rows
	const variables = (await table.listVariables())
		.map(({ properties }) => properties)
		.sort((a, b) => a.index - b.index)
		.map(({ name, type }, index) => ({ name, type, index }));
	// Dates are returned as Date objects, which (unlike Temporal values) can be stored in the cache
	const rowObjects = await table.toRowsArray(MAX_ROWS, { temporal: false });
	const rows = rowObjects.map((row) => variables.map(({ name }) => row[name]));

	await cache.set(cacheKey, { variables, rows });
	return new Collection(variables, rows);
}

class Collection {
	constructor(variables, rows) {
		this.variables = variables;
		this.indicatorsMap = {};

		this.indicators = variables.map((variable) => {
			const indicator = new Indicator(variable, rows);
			this.indicatorsMap[variable.name.toLowerCase()] = indicator;
			return indicator;
		});
		const firstVariableIsUnique = new Set(rows.map(([val]) => val)).size === rows.length;

		this.series = rows.map((row, i) => {
			return {
				index: i,
				isFiltered: false,
				value: firstVariableIsUnique ? row[0] : `row_${i + 1}`,
			};
		});
	}

	getIndicator(val) {
		return this.indicatorsMap[val.toLowerCase()];
	}
}

class Indicator {
	constructor(variable, rows) {
		this.variable = variable;
		this.rows = rows;
	}

	getDatum(serie) {
		return {
			value: this.rows[serie.index][this.variable.index],
			serie,
			indicator: this,
		};
	}
}
