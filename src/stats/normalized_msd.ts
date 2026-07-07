function calcNormalizedMsd(
  initialPositions: Array<Array<number>>,
  currentPositions: Array<Array<number>>,
) {
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

export { calcNormalizedMsd as calcMsd };
