import { useEffect, useEffectEvent } from 'react';

// Runs the callback once its dependencies have stopped changing for `delay` milliseconds
export default function useDebouncedEffect(callback, delay, dependencies) {
	const onTimeout = useEffectEvent(callback);

	useEffect(() => {
		const timeout = setTimeout(() => onTimeout(), delay);
		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [delay, ...dependencies]);
}
