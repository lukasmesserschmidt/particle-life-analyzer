import type { SimulationParams } from '../simulation/parameters';
import type { StatsContext } from './stats_context';
import { getPositions } from '../utils';

import { statsChart } from './stats_chart';
import { calcMsd } from './normalized_msd';
import { calcSpatialEntropy } from './normalized_spatial_entropy';
import { calcNormalizedAverageDistance } from './normalized_average_distance';

export class Stats {
  private device: GPUDevice;
  private params: SimulationParams;

  private initialPositions: number[][];

  private statsBuffer: GPUBuffer;
  private statsStagingBuffer: GPUBuffer;

  constructor(device: GPUDevice) {
    this.device = device;
  }

  init(params: SimulationParams, particleData: Float32Array) {
    this.params = params;

    // destroy old buffers if they exist
    if (this.statsBuffer) this.statsBuffer.destroy();
    if (this.statsStagingBuffer) this.statsStagingBuffer.destroy();

    this.initialPositions = getPositions(
      particleData,
      params.particleCount,
      params.dimensions,
    );

    statsChart.data.labels = [];
    statsChart.data.datasets[0].data = [];
    statsChart.data.datasets[1].data = [];
    statsChart.data.datasets[2].data = [];
    statsChart.options.scales!.x!.max = undefined;
    statsChart.update('none');
  }

  update(statsContext: StatsContext) {
    // calculate statistics
    const msd = calcMsd(this.initialPositions, statsContext.currentPositions);
    const spatialEntropy = calcSpatialEntropy(statsContext.currentPositions);
    const normalizedAverageDistance = calcNormalizedAverageDistance(
      statsContext.totalDistance,
      this.params.particleCount,
      this.params.dimensions,
    );

    // update charts
    statsChart.data.datasets[0].data.push(msd);
    statsChart.data.datasets[1].data.push(spatialEntropy);
    statsChart.data.datasets[2].data.push(normalizedAverageDistance);
    statsChart.data.labels!.push(statsContext.currentTime);
    statsChart.options.scales!.x!.max = statsContext.currentTime;

    statsChart.update('none');
  }
}
