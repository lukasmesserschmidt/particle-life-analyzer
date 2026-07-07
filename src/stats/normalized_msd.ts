/**
 * Calculate normalized mean squared displacement of particles from their initial positions.
 * Accounts for periodic boundary conditions in the simulation space.
 * @param initialPositions - Array of initial particle positions
 * @param currentPositions - Array of current particle positions
 * @returns Normalized MSD value between 0 and 1
 */
function calcNormalizedMsd(
  initialPositions: number[][],
  currentPositions: number[][],
): number {
  const dimensions = initialPositions[0].length;
  const particleCount = initialPositions.length;
  let totalDistSq = 0.0;

  for (let pIdx = 0; pIdx < particleCount; pIdx++) {
    const initialPos = initialPositions[pIdx];
    const currentPos = currentPositions[pIdx];

    let squaredDist = 0.0;
    for (let n = 0; n < dimensions; n++) {
      let diff = Math.abs(currentPos[n] - initialPos[n]);
      diff = Math.min(diff, 1.0 - diff);
      squaredDist += diff ** 2;
    }

    totalDistSq += squaredDist;
  }

  const msd = totalDistSq / particleCount;
  const maxPossibleDistSq = dimensions * 0.25;

  return msd / maxPossibleDistSq;
}

export { calcNormalizedMsd };
