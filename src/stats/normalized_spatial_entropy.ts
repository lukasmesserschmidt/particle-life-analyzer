/**
 * Calculate normalized spatial entropy of particle distribution.
 * Measures how uniformly particles are distributed across spatial cells.
 * @param positions - Array of particle positions
 * @param kIntervals - Number of intervals per dimension for spatial binning (default: 8)
 * @returns Normalized entropy value between 0 and 1
 */
function calcNormalizedSpatialEntropy(
  positions: number[][],
  kIntervals: number,
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

export { calcNormalizedSpatialEntropy };
