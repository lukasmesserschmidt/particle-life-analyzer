/**
 * Calculate normalized average distance between particles.
 * @param totalDistance - Sum of all pairwise distances calculated on GPU
 * @param particleCount - Number of particles in the simulation
 * @param dimensions - Number of spatial dimensions
 * @returns Normalized average distance value between 0 and 1
 */
function calcNormalizedAverageDistance(
  totalDistance: number,
  particleCount: number,
  dimensions: number,
): number {
  const totalPairsCalculated = particleCount * (particleCount - 1);
  const averageDistance = totalDistance / totalPairsCalculated;
  const maxPossibleDist = Math.sqrt(dimensions) / 2.0;
  return averageDistance / maxPossibleDist;
}

export { calcNormalizedAverageDistance };
