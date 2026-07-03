import { createMulberry32 } from '../utils';
import { MAX_DIM } from '../types';
import type { SimulationParams } from './parameters';

class ParticleSystem {
  private params: SimulationParams;

  constructor(params: SimulationParams) {
    this.params = params;
  }

  public createSimParamsData(): ArrayBuffer {
    const simParamsData = new ArrayBuffer(32);
    const view = new DataView(simParamsData);
    view.setUint32(0, this.params.groupCount, true);
    view.setUint32(4, this.params.particleCount, true);
    view.setUint32(8, this.params.dimensions, true);
    view.setFloat32(12, this.params.timeStep, true);
    view.setFloat32(16, this.params.frictionHalfLife, true);
    view.setFloat32(20, this.params.rMax, true);
    view.setFloat32(24, this.params.particleSize, true);

    return simParamsData;
  }

  public createRelationsData(): Float32Array {
    const relations = Array(this.params.groupCount)
      .fill(0)
      .map((_, i) => {
        const relationRandom = createMulberry32(this.params.seed + i);
        return [
          ...Array(this.params.groupCount)
            .fill(0)
            .map(
              () => (relationRandom() * 2.0 - 1.0) * this.params.relationScale,
            ),
          ...Array(MAX_DIM - this.params.groupCount).fill(0),
        ];
      });

    return new Float32Array(relations.flat());
  }

  public createColorsData(): Float32Array {
    const colorRandom = createMulberry32(this.params.seed);
    const colors = Array(this.params.groupCount)
      .fill(0)
      .map(() => [colorRandom(), colorRandom(), colorRandom(), 1]);

    return new Float32Array(colors.flat());
  }

  public createParticleData(): Float32Array {
    const particles = Array(this.params.particleCount)
      .fill(0)
      .map((_, i) => {
        const particleRandom = createMulberry32(this.params.seed + i);
        return [
          ...Array(this.params.dimensions)
            .fill(0)
            .map(() => particleRandom()),
          ...Array(MAX_DIM - this.params.dimensions).fill(0),
          ...Array(this.params.dimensions).fill(0),
          ...Array(MAX_DIM - this.params.dimensions).fill(0),
        ];
      });

    return new Float32Array(particles.flat());
  }

  public createParticleDataGrid(): Float32Array {
    const particles = Array(this.params.particleCount)
      .fill(0)
      .map((_, i) => {
        const position = [];

        // Calculate grid spacing
        const particlesPerDim = Math.ceil(
          Math.pow(this.params.particleCount, 1 / this.params.dimensions),
        );
        const spacing = 1.0 / particlesPerDim;

        // Calculate position in n-dimensional grid
        for (let d = 0; d < this.params.dimensions; d++) {
          const index =
            Math.floor(i / Math.pow(particlesPerDim, d)) % particlesPerDim;
          position.push((index + 0.5) * spacing);
        }

        return [
          ...position,
          ...Array(MAX_DIM - this.params.dimensions).fill(0),
          ...Array(this.params.dimensions).fill(0), // velocity starts at 0
          ...Array(MAX_DIM - this.params.dimensions).fill(0),
        ];
      });

    return new Float32Array(particles.flat());
  }
}

export { ParticleSystem };
