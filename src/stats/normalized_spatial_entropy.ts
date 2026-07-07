function calcNormalizedSpatialEntropy(
  positions: Array<Array<number>>,
  kIntervals: number = 8,
): number {
  const dimensions = positions[0].length;
  const particleCount = positions.length;
  const cellCounts = new Map<string, number>();

  for (const position of positions) {
    const cellCoords: number[] = [];

    for (const coord of position) {
      let cellIndex = Math.floor(coord * kIntervals);
      cellIndex = Math.max(0, Math.min(kIntervals - 1, cellIndex));
      cellCoords.push(cellIndex);
    }

    const cellKey = cellCoords.join(',');
    cellCounts.set(cellKey, (cellCounts.get(cellKey) || 0) + 1);
  }

  let entropy = 0;
  for (const count of cellCounts.values()) {
    const p = count / particleCount;
    entropy -= p * Math.log(p);
  }

  const maxPossibleCells = Math.min(particleCount, kIntervals ** dimensions);
  const maxEntropy = Math.log(maxPossibleCells);

  return entropy / maxEntropy;
}

export { calcNormalizedSpatialEntropy as calcSpatialEntropy };
