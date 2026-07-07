import { MAX_DIM } from './types';

function createMulberry32(seed: number): () => number {
  return function (): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getPositions(
  data: Float32Array,
  particleCount: number,
  dimensions: number,
) {
  return Array.from({ length: particleCount }, (_, i) => {
    const startIndex = i * (MAX_DIM * 2);
    return Array.from({ length: dimensions }, (_, d) => data[startIndex + d]);
  });
}

export { createMulberry32, getPositions };
