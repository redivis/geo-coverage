import colorbrewer from 'colorbrewer';

const colorBrewerPaired = colorbrewer.Paired;

const DEFAULT_COLORS = colorBrewerPaired[12];
import { scaleLog } from 'd3';

export default function (hexArray) {
	hexArray = hexArray || DEFAULT_COLORS;

	const logScale = scaleLog();
	const interpolators = {
		linear: {
			scale: function (val) {
				if (domain[1] === domain[0]) return 1;
				return (val - domain[0]) / (domain[1] - domain[0]);
			},
			invert: function (val) {
				return val * (domain[1] - domain[0]) + domain[0];
			},
		},
		logarithmic: {
			scale: function (val) {
				if (domain[1] === domain[0]) return 1;
				return logScale(val);
			},
			invert: function (val) {
				return logScale.invert(val);
			},
		},
	};

	let colors = hexArray.map((hex) => {
		return hexToRgb(hex);
	});
	let domain;
	let isRGB = true;
	let type = 'discrete';
	let format = 'rgb';
	let domainMap = new Map();
	let interpolator = interpolators.linear;
	let dynamicDomain = true;

	const fn = function (val) {
		if (dynamicDomain) {
			const oldVal = val;
			val = domainMap.get(val);
			if (val === undefined) {
				val = Math.random();
				domainMap.set(oldVal, val);
			}
		} else {
			if (val === null || val === undefined) return null;

			val = interpolator.scale(val);
		}

		let color;
		switch (type) {
			case 'discrete': {
				if (val >= 1) {
					color = colors[colors.length - 1];
				} else {
					color = colors[Math.floor(val * colors.length)];
				}

				return isRGB ? color : rgbToHex(color);
			}
			case 'continuous': {
				color = {};
				if (val >= 1) {
					return isRGB ? colors[colors.length - 1] : rgbToHex(colors[colors.length - 1]);
				}
				const index = Math.floor(val * (colors.length - 1));
				color.r = Math.floor(
					(colors.length - 1) *
						(val - index / (colors.length - 1)) *
						(colors[index + 1].r - colors[index].r) +
						colors[index].r,
				);
				color.g = Math.floor(
					(colors.length - 1) *
						(val - index / (colors.length - 1)) *
						(colors[index + 1].g - colors[index].g) +
						colors[index].g,
				);
				color.b = Math.floor(
					(colors.length - 1) *
						(val - index / (colors.length - 1)) *
						(colors[index + 1].b - colors[index].b) +
						colors[index].b,
				);

				return isRGB ? color : rgbToHex(color);
			}
		}
	};

	fn.interpolator = function (arg) {
		if (!arg) {
			return interpolator;
		}
		if (typeof arg === 'function') {
			interpolator = arg;
			return fn;
		}
		if (typeof arg === 'string') {
			if (interpolators[arg]) {
				interpolator = interpolators[arg];
				return fn;
			} else {
				console.error('Color Scale: invalid interpolation type');
				return fn;
			}
		}
	};

	fn.type = function (val) {
		if (val) {
			if (val === 'discrete' || val === 'continuous') {
				type = val;
				return fn;
			} else {
				console.error('invalid type. must be either "discrete" or "continuous"');
				return fn;
			}
		} else {
			return type;
		}
	};

	fn.domain = function (arr) {
		if (arr) {
			if (arr.length === 2 && !isNaN(parseInt(arr[0], 10))) {
				dynamicDomain = false;
				domain = arr;
				domainMap = null;
				logScale.domain(domain);
				return fn;
			} else {
				domain = [0, 1];
				domainMap = new Map();
				arr.forEach((val, i) => {
					if (arr.length === 1) {
						domainMap.set(val, 0);
					} else {
						domainMap.set(val, i / (arr.length - 1));
					}
				});
				return fn;
			}
		} else {
			return domain;
		}
	};

	fn.range = function (arr) {
		if (arr) {
			hexArray = arr;
			colors = hexArray.map((hex) => hexToRgb(hex));
			return fn;
		} else {
			return hexArray;
		}
	};

	fn.getTicks = function () {
		const numTicks = type === 'discrete' ? colors.length + 1 : colors.length;
		const step = 1 / (numTicks - 1);
		const legendTicks = [];

		for (let i = 0; i < numTicks; i++) {
			legendTicks.push(interpolator.invert(step * i));
		}
		return legendTicks;
	};

	fn.format = function (str) {
		if (str) {
			if (str === 'rgb' || str === 'hex') {
				format = str;
				isRGB = str === 'rgb';
				return fn;
			} else {
				console.error('invalid color scale format. Either "rgb" or "hex"');
				return fn;
			}
		} else {
			return str;
		}
	};

	return fn;
}

function hexToRgb(hex) {
	hex = hex.replace('#', '');
	const bigint = parseInt(hex, 16);

	return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(obj) {
	return `#${((1 << 24) + (obj.r << 16) + (obj.g << 8) + Math.round(obj.b)).toString(16).slice(1)}`;
}
