import Heap from 'heap';

export default function (costRaster, sourceRaster, maxCost) {
	const rowCnt = costRaster.length;
	const colCnt = costRaster[0].length;
	const costDistanceRaster = [];
	const heap = new Heap((a, b) => {
		return a.cost - b.cost;
	});
	let neighbor;
	let row;
	let col;
	let rlen;
	const sqrt2 = 1.4142;
	let curCell;
	let curCost;
	let curDist;
	let tempAccumCost;
	let tempAccumDist;
	let curCostByTwo;

	// Init the input raster to the size as the cost raster
	for (row = 0, rlen = costRaster.length; row < rlen; row++) {
		costDistanceRaster[row] = [];
	}

	for (row in sourceRaster) {
		for (col in sourceRaster[row]) {
			costDistanceRaster[row][col] = { cost: 0, id: sourceRaster[row][col], dist: 0 };
			heap.push({
				row: parseInt(row, 10),
				col: parseInt(col, 10),
				cost: 0,
				dist: 0,
				id: sourceRaster[row][col],
			});
		}
	}

	while ((curCell = heap.pop())) {
		row = curCell.row;
		col = curCell.col;
		let id = curCell.id;
		curCostByTwo = costRaster[row][col] / 2;

		/*
		 *  Order in which the neighbors are visited
		 *  5  3  6
		 *  1  X  2
		 *  8  4  7
		 */

		for (neighbor = 1; neighbor <= 8; neighbor++) {
			switch (neighbor) {
				case 1:
					col = curCell.col - 1;
					if (col < 0) continue;
					curCost = curCostByTwo + costRaster[row][col] / 2;
					curDist = 1;
					break;
				case 2:
					col = curCell.col + 1;
					if (col >= colCnt) continue;
					curCost = curCostByTwo + costRaster[row][col] / 2;
					curDist = 1;
					break;
				case 3:
					row = curCell.row - 1;
					col = curCell.col;
					if (row < 0) continue;
					curCost = curCostByTwo + costRaster[row][col] / 2;
					curDist = 1;
					break;
				case 4:
					row = curCell.row + 1;
					if (row >= rowCnt) continue;
					curCost = curCostByTwo + costRaster[row][col] / 2;
					curDist = 1;
					break;
				case 5:
					row = curCell.row - 1;
					col = curCell.col - 1;
					if (row < 0) {
						neighbor++;
						continue;
					}
					if (col < 0) continue;
					curCost = sqrt2 * (curCostByTwo + costRaster[row][col] / 2);
					curDist = sqrt2;
					break;
				case 6:
					col = curCell.col + 1;
					if (col >= colCnt) continue;
					curCost = sqrt2 * (curCostByTwo + costRaster[row][col] / 2);
					curDist = sqrt2;
					break;
				case 7:
					row = curCell.row + 1;
					if (row >= rowCnt) {
						neighbor++;
						continue;
					}
					if (col >= colCnt) continue;
					curCost = sqrt2 * (curCostByTwo + costRaster[row][col] / 2);
					curDist = sqrt2;
					break;
				case 8:
					col = curCell.col - 1;
					if (col < 0) continue;
					curCost = sqrt2 * (curCostByTwo + costRaster[row][col] / 2);
					curDist = sqrt2;
					break;
			}

			tempAccumCost = curCell.cost + curCost;
			tempAccumDist = curCell.dist + curDist;

			if (
				tempAccumCost < maxCost &&
				(costDistanceRaster[row][col] === undefined || tempAccumCost < costDistanceRaster[row][col].cost)
			) {
				//costDistanceRaster[row][col] = true;

				costDistanceRaster[row][col] = { cost: tempAccumCost, id, dist: tempAccumDist };

				heap.push({
					row,
					col,
					cost: tempAccumCost,
					dist: tempAccumDist,
					id,
				});
			}
		}
		//}
	}

	return costDistanceRaster;
}
