export default function (arr, obj, comparator) {
	let minIndex = 0;
	let maxIndex = arr.length - 1;
	let currentIndex;
	let currentElement;
	let comparison;

	while (minIndex <= maxIndex) {
		currentIndex = ((minIndex + maxIndex) / 2) | 0;
		currentElement = arr[currentIndex];
		comparison = comparator(currentElement, obj);

		if (comparison < 0) {
			minIndex = currentIndex + 1;
		} else if (comparison > 0) {
			maxIndex = currentIndex - 1;
		} else {
			return currentIndex;
		}
	}
	return -1;
}
