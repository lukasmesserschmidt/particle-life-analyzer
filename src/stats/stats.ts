import type { SimulationParams } from '../simulation/parameters';
import type { StatsContext } from './stats_context';
import { getPositions } from '../utils';

import { liveChart } from './live_chart';
import { headlessChart } from './headless_chart';
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
  private entropyHistory: number[];
  private k: number;

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
    this.entropyHistory = [];
    this.k = Math.round(
      Math.pow(this.params.particleCount, 1 / this.params.dimensions),
    );

    liveChart.data.labels = [];
    liveChart.data.datasets[0].data = [];
    liveChart.data.datasets[1].data = [];
    liveChart.data.datasets[2].data = [];
    liveChart.options.scales!.x!.max = undefined;
    liveChart.update('none');
  }

  /**
   * Update statistics with current simulation state and refresh chart.
   * @param statsContext - Current simulation context including positions and time
   */
  updateLiveChart(statsContext: StatsContext) {
    // calculate statistics
    const normalizedMsd = calcNormalizedMsd(
      this.initialPositions,
      statsContext.currentPositions,
    );
    const normalizedSpatialEntropy = calcNormalizedSpatialEntropy(
      statsContext.currentPositions,
      this.k,
    );
    const normalizedAverageDistance = calcNormalizedAverageDistance(
      statsContext.totalDistance,
      this.params.particleCount,
      this.params.dimensions,
    );

    // track entropy history
    this.entropyHistory.push(normalizedSpatialEntropy);
    if (this.entropyHistory.length > 60) {
      this.entropyHistory.shift();
    }

    // calculate moving average of entropy
    const entropyMovingAverage =
      this.entropyHistory.reduce((a, b) => a + b, 0) /
      this.entropyHistory.length;

    // update charts
    liveChart.data.datasets[0].data.push(normalizedMsd);
    liveChart.data.datasets[1].data.push(entropyMovingAverage);
    liveChart.data.datasets[2].data.push(normalizedAverageDistance);
    liveChart.data.labels!.push(statsContext.currentTime);
    liveChart.options.scales!.x!.max = statsContext.currentTime;

    liveChart.update('none');
  }

  updateHeadlessChart(
    headlessData: {
      msd: number[];
      entropy: number[];
      avgDistance: number[];
      timeSteps: number[];
    }[],
  ) {
    // calculate averages per index position
    const maxLength = headlessData[0].timeSteps.length;
    const avgMsd: number[] = [];
    const avgEntropy: number[] = [];
    const avgAvgDistance: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      const msdValues = headlessData.map((d) => d.msd[i]);
      const entropyValues = headlessData.map((d) => d.entropy[i]);
      const avgDistanceValues = headlessData.map((d) => d.avgDistance[i]);

      avgMsd.push(msdValues.reduce((a, b) => a + b, 0) / msdValues.length);
      avgEntropy.push(
        entropyValues.reduce((a, b) => a + b, 0) / entropyValues.length,
      );
      avgAvgDistance.push(
        avgDistanceValues.reduce((a, b) => a + b, 0) / avgDistanceValues.length,
      );
    }

    headlessChart.data.datasets[0].data = avgMsd;
    headlessChart.data.datasets[1].data = avgEntropy;
    headlessChart.data.datasets[2].data = avgAvgDistance;
    headlessChart.data.labels = headlessData[0].timeSteps;
    headlessChart.options.scales!.x!.max =
      headlessData[0].timeSteps[headlessData[0].timeSteps.length - 1];
    headlessChart.options.plugins!.title!.text =
      'Headless Mode Statistics (Average over ' +
      headlessData.length +
      ' runs)';
    headlessChart.update('none');
  }
}
