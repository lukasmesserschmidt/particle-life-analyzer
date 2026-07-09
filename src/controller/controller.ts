import type { SimulationParams } from '../simulation/parameters';
import type { StatsContext } from '../stats/stats_context';
import { Simulation } from '../simulation/simulation';
import { Renderer } from '../render/renderer';
import { Stats } from '../stats/stats';
import { getPositions } from '../utils';
import { liveChart } from '../stats/live_chart';

/**
 * Main application controller that coordinates simulation, rendering, and statistics.
 * Manages the WebGPU context and orchestrates the animation loop.
 */
class Controller {
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private device: GPUDevice;

  private simulation: Simulation;
  private renderer: Renderer;
  private stats: Stats;

  private params: SimulationParams;
  private currentTime: number;
  private animationFrameId: number;

  private headlessData: {
    msd: number[];
    entropy: number[];
    avgDistance: number[];
    timeSteps: number[];
  }[];

  /**
   * Initialize the controller with WebGPU canvas context and device.
   * @param canvas - The HTML canvas element for WebGPU rendering
   * @param device - The WebGPU device for GPU operations
   */
  constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
    this.canvas = canvas;
    this.context = canvas.getContext('webgpu') as GPUCanvasContext;
    this.device = device;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device,
      format: presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.simulation = new Simulation(device);
    this.renderer = new Renderer(device, presentationFormat);
    this.stats = new Stats();
  }

  /**
   * Initialize the simulation with the given parameters.
   * @param params - Simulation parameters including particle count, dimensions, etc.
   */
  public init(params: SimulationParams) {
    this.params = params;

    this.initSimulation();
    this.initStats();
  }

  /**
   * Initialize the simulation subsystem and renderer.
   * Cancels any existing animation frame before reinitializing.
   */
  private initSimulation() {
    // cancel previous animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.simulation.init(this.params);
    const renderContext = this.simulation.getRenderContext();
    this.renderer.init(this.canvas, this.params, renderContext);
  }

  /**
   * Initialize the statistics subsystem with current particle data.
   */
  private initStats() {
    this.currentTime = 0.0;
    this.stats.init(this.params, this.simulation.getParticleData());
  }

  /**
   * Start the animation loop for continuous simulation updates.
   */
  public startSimulation() {
    if (this.params.headless) {
      this.simHeadlessIterations();
    } else {
      this.animationFrameId = requestAnimationFrame(this.updateLoop.bind(this));
    }
  }

  private async updateLoop() {
    await this.updateLive();
    this.animationFrameId = requestAnimationFrame(this.updateLoop.bind(this));
  }

  /**
   * Main update loop: compute simulation, render, update statistics, and schedule next frame.
   */
  private async updateLive() {
    const commandEncoder = this.device.createCommandEncoder();

    this.simulation.compute(commandEncoder);
    this.renderer.render(this.context, commandEncoder);

    const { outputBuffer, stagingBuffer } = this.simulation.getOutputBuffers();
    const { statsBuffer, statsStagingBuffer } =
      this.simulation.getStatsBuffers();
    const particleData = this.simulation.getParticleData();

    commandEncoder.copyBufferToBuffer(
      outputBuffer,
      0,
      stagingBuffer,
      0,
      particleData.byteLength,
    );

    commandEncoder.copyBufferToBuffer(
      statsBuffer,
      0,
      statsStagingBuffer,
      0,
      this.params.particleCount * 4,
    );

    this.device.queue.submit([commandEncoder.finish()]);

    await stagingBuffer.mapAsync(GPUMapMode.READ);
    await statsStagingBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(stagingBuffer.getMappedRange());

    // extract output data from GPU
    const statsArray = new Float32Array(statsStagingBuffer.getMappedRange());
    let totalDistance = 0.0;
    for (let i = 0; i < this.params.particleCount; i++) {
      totalDistance += statsArray[i];
    }

    const currentPositions = getPositions(
      result,
      this.params.particleCount,
      this.params.dimensions,
    );
    stagingBuffer.unmap();
    statsStagingBuffer.unmap();

    const statsContext: StatsContext = {
      currentTime: this.currentTime,
      currentPositions,
      totalDistance,
    };

    this.stats.updateLiveChart(statsContext);

    this.currentTime += this.params.timeStep;

    // swap bind groups
    this.simulation.swapBindGroups();
    this.renderer.swapBindGroups();
  }

  /**
   * Fast update for headless mode: compute and swap buffers without CPU readback.
   */
  private async updateHeadless() {
    const commandEncoder = this.device.createCommandEncoder();

    this.simulation.compute(commandEncoder);

    this.device.queue.submit([commandEncoder.finish()]);

    this.currentTime += this.params.timeStep;

    // swap bind groups
    this.simulation.swapBindGroups();
  }

  private async simHeadlessIterations() {
    this.headlessData = [];
    this.stats.updateHeadlessChart([
      {
        msd: [],
        entropy: [],
        avgDistance: [],
        timeSteps: [],
      },
    ]);

    const frameCount =
      this.params.headlessIterationTime / this.params.timeStep + 1;
    const statsInterval = 10; // Read data every N timesteps instead of every timestep

    for (let i = 0; i < this.params.headlessIterations; i++) {
      this.init(this.params);

      for (let j = 0; j < frameCount; j++) {
        // Only read data and update stats at intervals
        if (j % statsInterval === 0 || j === frameCount - 1) {
          await this.updateLive();
        } else {
          await this.updateHeadless();
        }
      }

      // save stats
      this.headlessData.push({
        msd: liveChart.data.datasets[0].data as number[],
        entropy: liveChart.data.datasets[1].data as number[],
        avgDistance: liveChart.data.datasets[2].data as number[],
        timeSteps: liveChart.data.labels as number[],
      });
      this.stats.updateHeadlessChart(this.headlessData);

      this.params.seed++;
    }
  }
}

export { Controller };
