export default function ({ width, height }) {
	this.svg.attr('width', width).attr('height', height);

	this.legend.resize();
}
