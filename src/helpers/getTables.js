import redivis from 'redivis';

// Lists the tables in a dataset or workflow, e.g. `owner.dataset_name`
export default async function getTables(reference) {
	let tables;
	try {
		tables = await redivis.dataset(reference).listTables();
	} catch (e) {
		if (!(e instanceof redivis.errors.NotFoundError)) {
			throw e;
		}
		tables = await redivis.workflow(reference).listTables();
	}
	return tables.map((table) => ({
		// The table's reference within its container, without its reference id (e.g. `my_table`)
		name: table.scopedReference.split(':')[0].toLowerCase(),
		label: table.properties.name,
	}));
}
