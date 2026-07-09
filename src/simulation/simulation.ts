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

import { ParticleDataGenerator } from './particle_data_generator';
import { MAX_DIM, WORKGROUP_SIZE } from '../types';

/**
 * Core simulation engine using WebGPU compute shaders for particle physics.
 * Manages GPU buffers, compute pipelines, and double-buffering for efficient particle updates.
 */
class Simulation {
  private params: SimulationParams;

  private device: GPUDevice;

  private particleDataGenerator: ParticleDataGenerator;
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
  private currentComputeBindGroup: GPUBindGroup;

  /**
   * Initialize the simulation with WebGPU device and compute pipeline.
   * @param device - The WebGPU device for GPU operations
   */
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

  /**
   * Initialize simulation with given parameters, creating all necessary GPU buffers and bind groups.
   * @param params - Simulation parameters including particle count, dimensions, etc.
   */
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
    this.particleDataGenerator = new ParticleDataGenerator(params);

    // create buffer data
    const simParamsData = this.particleDataGenerator.createSimParamsData();
    const relationData = this.particleDataGenerator.createRelationsData();
    const colorData = this.particleDataGenerator.createColorsData();
    this.particleData = this.particleDataGenerator.createParticleData();

    // create buffers
    this.simParamsBuffer = createSimParamsBuffer(
      this.device,
      simParamsData.byteLength,
    );
    this.device.queue.writeBuffer(this.simParamsBuffer, 0, simParamsData);

    this.statsBuffer = createStatsBuffer(
      this.device,
      this.params.particleCount * 4,
    );

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
    this.device.queue.writeBuffer(
      this.outputBuffer,
      0,
      this.particleData.buffer,
    );

    this.stagingBuffer = createStagingBuffer(
      this.device,
      this.particleData.byteLength,
    );

    this.statsStagingBuffer = createStagingBuffer(
      this.device,
      this.params.particleCount * 4,
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

    this.currentComputeBindGroup = this.computeBindGroupA;
  }

  /**
   * Execute compute shader to update particle positions and velocities.
   * @param commandEncoder - WebGPU command encoder for recording compute commands
   */
  public compute(commandEncoder: GPUCommandEncoder) {
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.computePipeline);
    passEncoder.setBindGroup(0, this.currentComputeBindGroup);

    const workgrouCount = Math.ceil(this.params.particleCount / WORKGROUP_SIZE);
    passEncoder.dispatchWorkgroups(workgrouCount);
    passEncoder.end();
  }

  /**
   * Swap between double-buffered bind groups for ping-pong buffering.
   */
  public swapBindGroups() {
    this.currentComputeBindGroup =
      this.currentComputeBindGroup === this.computeBindGroupA
        ? this.computeBindGroupB
        : this.computeBindGroupA;
  }

  /**
   * Get GPU buffers needed for rendering.
   * @returns Object containing simulation parameters, colors, and particle position buffers
   */
  public getRenderContext(): RenderBuffers {
    return {
      simParamsBuffer: this.simParamsBuffer,
      colorBuffer: this.colorBuffer,
      inputBuffer: this.inputBuffer,
      outputBuffer: this.outputBuffer,
    };
  }

  /**
   * Get GPU buffers needed for statistics computation.
   * @returns Object containing stats buffer and staging buffer for CPU readback
   */
  public getStatsBuffers(): StatsBuffers {
    return {
      statsBuffer: this.statsBuffer,
      statsStagingBuffer: this.statsStagingBuffer,
    };
  }

  /**
   * Get GPU buffers for simulation output.
   * @returns Object containing output buffer and staging buffer for CPU readback
   */
  public getOutputBuffers(): OutputBuffers {
    return {
      outputBuffer: this.outputBuffer,
      stagingBuffer: this.stagingBuffer,
    };
  }

  /**
   * Get the initial particle data as a Float32Array.
   * @returns Initial particle positions and velocities
   */
  public getParticleData(): Float32Array {
    return this.particleData;
  }
}

export { Simulation };
