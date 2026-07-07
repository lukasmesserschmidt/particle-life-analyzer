import { MAX_DIM } from './types';

/**
 * Create a Mulberry32 random number generator with a given seed.
 * @param seed - The seed for the random number generator
 * @returns A function that generates random numbers between 0 and 1
 */
function createMulberry32(seed: number): () => number {
  return function (): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Extract particle positions from a Float32Array.
 * @param data - The particle data array containing positions and velocities
 * @param particleCount - The number of particles
 * @param dimensions - The number of spatial dimensions
 * @returns Array of particle positions, where each position is an array of coordinates
 */
function getPositions(
  data: Float32Array,
  particleCount: number,
  dimensions: number,
): number[][] {
  return Array.from({ length: particleCount }, (_, i) => {
    const startIndex = i * (MAX_DIM * 2);
    return Array.from({ length: dimensions }, (_, d) => data[startIndex + d]);
  });
}

export { createMulberry32, getPositions };
