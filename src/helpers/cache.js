import localforage from 'localforage';

import packageJson from '../../package.json';

// Entries from previous versions of the app are ignored
const cacheBuster = packageJson.version;

export async function set(key, val) {
	key = normalizeKey(key);
	return localforage.setItem(key, val);
}

export async function get(key) {
	key = normalizeKey(key);
	return localforage.getItem(key);
}

export async function unset(key) {
	key = normalizeKey(key);
	return localforage.removeItem(key);
}

export async function clearAll() {
	return localforage.clear();
}

function normalizeKey(key) {
	if (typeof key === 'object') {
		key = JSON.stringify(key);
	}
	if (key.length > 100) {
		key = hashString(key);
	}
	return `v${cacheBuster}_${key}`;
}

function hashString(val) {
	let hash = 0,
		i,
		chr;

	for (i = 0; i < val.length; i++) {
		chr = val.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return String(hash);
}
