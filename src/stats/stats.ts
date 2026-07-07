import type { SimulationParams } from '../simulation/parameters';
import type { StatsContext } from './stats_context';
import { getPositions } from '../utils';

import { statsChart } from './stats_chart';
import { calcNormalizedMsd } from './normalized_msd';
import { calcNormalizedSpatialEntropy } from './normalized_spatial_entropy';
import { calcNormalizedAverageDistance } from './normalized_average_distance';

/**
 * Statistics controller for tracking and visualizing particle simulation metrics.
 * Manages Chart.js visualization and calculates normalized statistics.
 */
export class Stats {
  private params: SimulationParams;

  private initialPositions: number[][];

  private statsBuffer: GPUBuffer;
  private statsStagingBuffer: GPUBuffer;

  /**
   * Initialize statistics with simulation parameters and initial particle data.
   * @param params - Simulation parameters including particle count and dimensions
   * @param particleData - Initial particle positions and velocities
   */
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

  /**
   * Update statistics with current simulation state and refresh chart.
   * @param statsContext - Current simulation context including positions and time
   */
  update(statsContext: StatsContext) {
    // calculate statistics
    const normalizedMsd = calcNormalizedMsd(
      this.initialPositions,
      statsContext.currentPositions,
    );
    const normalizedSpatialEntropy = calcNormalizedSpatialEntropy(
      statsContext.currentPositions,
    );
    const normalizedAverageDistance = calcNormalizedAverageDistance(
      statsContext.totalDistance,
      this.params.particleCount,
      this.params.dimensions,
    );

    // update charts
    statsChart.data.datasets[0].data.push(normalizedMsd);
    statsChart.data.datasets[1].data.push(normalizedSpatialEntropy);
    statsChart.data.datasets[2].data.push(normalizedAverageDistance);
    statsChart.data.labels!.push(statsContext.currentTime);
    statsChart.options.scales!.x!.max = statsContext.currentTime;

    statsChart.update('none');
  }
}
