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
