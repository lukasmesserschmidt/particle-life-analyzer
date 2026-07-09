export interface SimulationParams {
  groupCount: number;
  particleCount: number;
  dimensions: number;
  seed: number;
  relationScale: number;
  timeStep: number;
  frictionHalfLife: number;
  rMax: number;
  particleSize: number;

  headless: boolean;
  headlessIterations: number;
  headlessIterationTime: number;
}
