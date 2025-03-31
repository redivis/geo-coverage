import retryableFetch from './retryableFetch';
import { getCredentials, login, logout } from './auth';
import * as cache from './cache';

export default async function (tableReference) {
	let token = getCredentials();
	if (!token) {
		token = 'AAAAfg42tjQZmGywe+aAJAHEwSmUTI1X'; // Can only access public data
	}
	let tableResponse = await retryableFetch(`https://redivis.com/api/v1/tables/${tableReference}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (tableResponse.status === 401) {
		logout();
	}
	tableResponse = await tableResponse.json();

	if (tableResponse.error) {
		throw new Error(
			`An error occurred when fetching the table. ${tableResponse.error.message}: ${tableResponse.error.description}`,
		);
	}
	if (tableResponse.numBytes > 1e7 || tableResponse.numRows > 1e4) {
		throw new Error(`Can only fetch tables that are less than or equal to 10,000 records and 10MB`);
	}
	if (tableResponse.accessLevel === 'overview' || tableResponse.accessLevel === 'metadata') {
		throw new Error(
			`You must have data access to this table. Current access level is "${tableResponse.accessLevel}"`,
		);
	}

	const cachedResponse = await cache.get(`${tableReference}_${tableResponse.hash}`);
	if (cachedResponse) {
		const { variables, rows } = cachedResponse;
		return new Collection(variables, rows);
	}

	let variablesResponse = await retryableFetch(
		`https://redivis.com/api/v1/tables/${tableReference}/variables?maxResults=999`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	variablesResponse = await variablesResponse.json();
	if (variablesResponse.error) {
		throw new Error(
			`An error occurred when fetching table variables. ${variablesResponse.error.message}: ${variablesResponse.error.description}`,
		);
	}
	const variables = variablesResponse.results;

	let rowsResponse = await retryableFetch(
		`https://redivis.com/api/v1/tables/${tableReference}/rows?maxResults=10000&selectedVariables=${variables
			.sort((a, b) => a.index - b.index)
			.map(({ name }) => name)
			.join(',')}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	if (!rowsResponse.ok) {
		rowsResponse = await rowsResponse.json();
		throw new Error(
			`An error occurred when fetching table rows. ${rowsResponse.error.message}: ${rowsResponse.error.description}`,
		);
	}
	rowsResponse = await rowsResponse.text();
	const rows = rowsResponse.split('\n').map((row) => JSON.parse(row)).map((row) => {
		return variables.map(({ name }) => row[name]);
	});

	await cache.set(`${tableReference}_${tableResponse.hash}`, { variables, rows });
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
