import type { SimulationParams } from './simulation/parameters';
import type { StatsContext } from './stats/stats_context';
import { Simulation } from './simulation/simulation';
import { Renderer } from './render/renderer';
import { Stats } from './stats/stats';
import { getPositions } from './utils';

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
    this.stats = new Stats(device);
  }

  public init(params: SimulationParams) {
    this.params = params;

    this.initSimulation();
    this.initStats();
  }

  private initSimulation() {
    // cancel previous animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.simulation.init(this.params);
    const renderContext = this.simulation.getRenderContext();
    this.renderer.init(this.canvas, this.params, renderContext);
  }

  private initStats() {
    this.currentTime = 0.0;
    this.stats.init(this.params, this.simulation.getParticleData());
  }

  public startUpdateLoop() {
    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }

  private async update() {
    const commandEncoder = this.device.createCommandEncoder();

    this.simulation.compute(commandEncoder);
    // this.renderer.render(this.context, commandEncoder);

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

    this.stats.update(statsContext);

    this.currentTime += this.params.timeStep;

    // swap bind groups
    this.simulation.swapBindGroups();
    this.renderer.swapBindGroups();

    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }
}

export { Controller };
