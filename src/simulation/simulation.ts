import type { SimulationParams } from './parameters';
import type { RenderBuffers } from '../render/render_buffers';
import type { StatsBuffers } from '../stats/stats_buffers';
import type { OutputBuffers } from './output_buffers';

import {
  createSimParamsBuffer,
  createStatsBuffer,
  createRelationBuffer,
  createColorBuffer,
  createInputBuffer,
  createOutputBuffer,
  createStagingBuffer,
} from '../webgpu/buffers';
import { createComputePipeline } from '../webgpu/pipelines';
import { createBindGroup } from '../webgpu/bind_groups';
import { computeShaderCode } from '../webgpu/shaders';

import { ParticleSystem } from './particle_system';

class Simulation {
  private params: SimulationParams;

  private device: GPUDevice;

  private particleSystem: ParticleSystem;
  private particleData: Float32Array;
  private simParamsBuffer: GPUBuffer;
  private statsBuffer: GPUBuffer;
  private relationBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private inputBuffer: GPUBuffer;
  private outputBuffer: GPUBuffer;
  private stagingBuffer: GPUBuffer;
  private statsStagingBuffer: GPUBuffer;
  private computePipeline: GPUComputePipeline;
  private computeBindGroupA: GPUBindGroup;
  private computeBindGroupB: GPUBindGroup;
  private currentComputeBindeGroup: GPUBindGroup;

  constructor(device: GPUDevice) {
    this.device = device;

    // create shader modules
    const computeShaderModule = device.createShaderModule({
      label: 'particle position and speed calculator',
      code: computeShaderCode,
    });

    // create compute pipeline
    this.computePipeline = createComputePipeline(device, computeShaderModule);
  }

  public init(params: SimulationParams) {
    this.params = params;

    // destroy old buffers if they exist
    if (this.simParamsBuffer) this.simParamsBuffer.destroy();
    if (this.statsBuffer) this.statsBuffer.destroy();
    if (this.relationBuffer) this.relationBuffer.destroy();
    if (this.colorBuffer) this.colorBuffer.destroy();
    if (this.inputBuffer) this.inputBuffer.destroy();
    if (this.outputBuffer) this.outputBuffer.destroy();
    if (this.stagingBuffer) this.stagingBuffer.destroy();
    if (this.statsStagingBuffer) this.statsStagingBuffer.destroy();

    // create particle system
    this.particleSystem = new ParticleSystem(params);

    // create buffer data
    const simParamsData = this.particleSystem.createSimParamsData();
    const relationData = this.particleSystem.createRelationsData();
    const colorData = this.particleSystem.createColorsData();
    this.particleData = this.particleSystem.createParticleData();

    // create buffers
    this.simParamsBuffer = createSimParamsBuffer(
      this.device,
      simParamsData.byteLength,
    );
    this.device.queue.writeBuffer(this.simParamsBuffer, 0, simParamsData);

    this.statsBuffer = createStatsBuffer(this.device, params.particleCount * 4);

    this.relationBuffer = createRelationBuffer(
      this.device,
      relationData.byteLength,
    );
    this.device.queue.writeBuffer(this.relationBuffer, 0, relationData.buffer);

    this.colorBuffer = createColorBuffer(this.device, colorData.byteLength);
    this.device.queue.writeBuffer(this.colorBuffer, 0, colorData.buffer);

    this.inputBuffer = createInputBuffer(
      this.device,
      this.particleData.byteLength,
    );
    this.device.queue.writeBuffer(
      this.inputBuffer,
      0,
      this.particleData.buffer,
    );

    this.outputBuffer = createOutputBuffer(
      this.device,
      this.particleData.byteLength,
    );

    this.stagingBuffer = createStagingBuffer(
      this.device,
      this.particleData.byteLength,
    );

    this.statsStagingBuffer = createStagingBuffer(
      this.device,
      params.particleCount * 4,
    );

    // create bind groups
    this.computeBindGroupA = createBindGroup(
      this.device,
      this.computePipeline,
      [
        this.simParamsBuffer,
        this.statsBuffer,
        this.relationBuffer,
        this.inputBuffer,
        this.outputBuffer,
      ],
    );

    this.computeBindGroupB = createBindGroup(
      this.device,
      this.computePipeline,
      [
        this.simParamsBuffer,
        this.statsBuffer,
        this.relationBuffer,
        this.outputBuffer,
        this.inputBuffer,
      ],
    );

    this.currentComputeBindeGroup = this.computeBindGroupA;
  }

  public compute(commandEncoder: GPUCommandEncoder) {
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.computePipeline);
    passEncoder.setBindGroup(0, this.currentComputeBindeGroup);

    const workgrouCount = Math.ceil(this.params.particleCount / 32);
    passEncoder.dispatchWorkgroups(workgrouCount);
    passEncoder.end();
  }

  public swapBindGroups() {
    this.currentComputeBindeGroup =
      this.currentComputeBindeGroup === this.computeBindGroupA
        ? this.computeBindGroupB
        : this.computeBindGroupA;
  }

  public getRenderContext(): RenderBuffers {
    return {
      simParamsBuffer: this.simParamsBuffer,
      colorBuffer: this.colorBuffer,
      inputBuffer: this.inputBuffer,
      outputBuffer: this.outputBuffer,
    };
  }

  public getStatsBuffers(): StatsBuffers {
    return {
      statsBuffer: this.statsBuffer,
      statsStagingBuffer: this.statsStagingBuffer,
    };
  }

  public getOutputBuffers(): OutputBuffers {
    return {
      outputBuffer: this.outputBuffer,
      stagingBuffer: this.stagingBuffer,
    };
  }

  public getParticleData(): Float32Array {
    return this.particleData;
  }
}

export { Simulation };
