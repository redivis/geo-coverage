import { useRef, useState } from 'react';
import useDebouncedEffect from './useDebouncedEffect';

/**
 * Fetches a resource once its dependencies have stopped changing, keeping only the result of the latest request.
 *
 * @param {() => Promise<any>} fetcher
 * @param {any[]} dependencies
 * @param {object} [options]
 * @param {number} [options.delay=1000] Milliseconds to wait for the dependencies to settle
 * @param {boolean} [options.enabled=true] Whether to fetch; the previous result is kept while disabled
 * @param {(data: any) => void} [options.onSuccess] Called with the result of the latest request
 * @returns {{data: any, isFetching: boolean, error: Error | null}}
 */
export default function useDebouncedResource(fetcher, dependencies, { delay = 1000, enabled = true, onSuccess } = {}) {
	const [state, setState] = useState({ data: null, isFetching: false, error: null });
	const latestRequest = useRef(0);

	useDebouncedEffect(
		async () => {
			if (!enabled) {
				return;
			}
			const request = ++latestRequest.current;
			setState((previousState) => ({ ...previousState, isFetching: true, error: null }));
			try {
				const data = await fetcher();
				if (request === latestRequest.current) {
					setState({ data, isFetching: false, error: null });
					onSuccess?.(data);
				}
			} catch (error) {
				if (request === latestRequest.current) {
					console.error(error);
					setState({ data: null, isFetching: false, error });
				}
			}
		},
		delay,
		[enabled, ...dependencies],
	);

	return state;
}
