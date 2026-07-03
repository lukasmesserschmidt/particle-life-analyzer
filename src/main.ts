import { getDevice } from './webgpu/device';
import { ParticleSystem } from './simulation/particle_system';
import type { SimulationParams } from './simulation/parameters';

import {
  createSimParamsBuffer,
  createRelationBuffer,
  createColorBuffer,
  createInputBuffer,
  createOutputBuffer,
  createStagingBuffer,
} from './webgpu/buffers';
import {
  createComputePipeline,
  createRenderPipeline,
} from './webgpu/pipelines';
import { createBindGroup } from './webgpu/bind_groups';
import { computeShaderCode, renderShaderCode } from './webgpu/shaders';
import { createDepthTexture } from './webgpu/textures';

// define variables
let params: SimulationParams;

let particleSystem: ParticleSystem;
let simParamsBuffer: GPUBuffer;
let relationBuffer: GPUBuffer;
let colorBuffer: GPUBuffer;
let inputBuffer: GPUBuffer;
let outputBuffer: GPUBuffer;
let stagingBuffer: GPUBuffer;
let depthTexture: GPUTexture;
let computePipeline: GPUComputePipeline;
let renderPipeline: GPURenderPipeline;
let computeBindGroupA: GPUBindGroup;
let computeBindGroupB: GPUBindGroup;
let renderBindGroupA: GPUBindGroup;
let renderBindGroupB: GPUBindGroup;
let currentComputeBindeGroup: GPUBindGroup;
let currentRenderBindGroup: GPUBindGroup;
let particleData: Float32Array;
let animationFrameId: number;

// init canvas
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = 1000;
canvas.height = 1000;
const context = canvas.getContext('webgpu') as GPUCanvasContext;

// init webgpu
const device = await getDevice();
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device: device,
  format: presentationFormat,
});

// create shader modules
const computeShaderModule = device.createShaderModule({
  label: 'particle position and speed calculator',
  code: computeShaderCode,
});

const renderShaderModule = device.createShaderModule({
  label: 'particle renderer',
  code: renderShaderCode,
});

// create pipelines
computePipeline = createComputePipeline(device, computeShaderModule);
renderPipeline = createRenderPipeline(
  device,
  renderShaderModule,
  presentationFormat,
);

function getValuesFromInputs() {
  const preferedParticleCount = parseInt(
    (document.getElementById('preferredParticleCount') as HTMLInputElement)
      .value,
  );
  const groupCount = parseInt(
    (document.getElementById('groupCount') as HTMLInputElement).value,
  );

  params = {
    groupCount,
    particleCount: Math.floor(preferedParticleCount / groupCount) * groupCount,
    dimensions: parseInt(
      (document.getElementById('dimensions') as HTMLInputElement).value,
    ),
    seed: parseInt((document.getElementById('seed') as HTMLInputElement).value),
    relationScale: parseFloat(
      (document.getElementById('relationScale') as HTMLInputElement).value,
    ),
    timeStep: parseFloat(
      (document.getElementById('timeStep') as HTMLInputElement).value,
    ),
    frictionHalfLife: parseFloat(
      (document.getElementById('frictionHalfLife') as HTMLInputElement).value,
    ),
    rMax: parseFloat(
      (document.getElementById('rMax') as HTMLInputElement).value,
    ),
    particleSize: parseFloat(
      (document.getElementById('particleSize') as HTMLInputElement).value,
    ),
  };
}

function initSimulation() {
  // cancel previous animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // destroy old buffers if they exist
  if (simParamsBuffer) simParamsBuffer.destroy();
  if (relationBuffer) relationBuffer.destroy();
  if (colorBuffer) colorBuffer.destroy();
  if (inputBuffer) inputBuffer.destroy();
  if (outputBuffer) outputBuffer.destroy();
  if (stagingBuffer) stagingBuffer.destroy();
  if (depthTexture) depthTexture.destroy();

  // create particle system
  particleSystem = new ParticleSystem(params);

  // create buffer data
  const simParamsData = particleSystem.createSimParamsData();
  const relationData = particleSystem.createRelationsData();
  const colorData = particleSystem.createColorsData();
  particleData = particleSystem.createParticleData();

  // create buffers
  simParamsBuffer = createSimParamsBuffer(device, simParamsData.byteLength);
  device.queue.writeBuffer(simParamsBuffer, 0, simParamsData);

  relationBuffer = createRelationBuffer(device, relationData.byteLength);
  device.queue.writeBuffer(relationBuffer, 0, relationData.buffer);

  colorBuffer = createColorBuffer(device, colorData.byteLength);
  device.queue.writeBuffer(colorBuffer, 0, colorData.buffer);

  inputBuffer = createInputBuffer(device, particleData.byteLength);
  device.queue.writeBuffer(inputBuffer, 0, particleData.buffer);

  outputBuffer = createOutputBuffer(device, particleData.byteLength);

  stagingBuffer = createStagingBuffer(device, particleData.byteLength);

  // create textures
  depthTexture = createDepthTexture(device, canvas.width, canvas.height);

  // create bind groups
  computeBindGroupA = createBindGroup(device, computePipeline, [
    simParamsBuffer,
    relationBuffer,
    inputBuffer,
    outputBuffer,
  ]);

  computeBindGroupB = createBindGroup(device, computePipeline, [
    simParamsBuffer,
    relationBuffer,
    outputBuffer,
    inputBuffer,
  ]);

  renderBindGroupA = createBindGroup(device, renderPipeline, [
    simParamsBuffer,
    colorBuffer,
    inputBuffer,
  ]);

  renderBindGroupB = createBindGroup(device, renderPipeline, [
    simParamsBuffer,
    colorBuffer,
    outputBuffer,
  ]);

  currentComputeBindeGroup = computeBindGroupA;
  currentRenderBindGroup = renderBindGroupA;
}

// initial initialization
getValuesFromInputs();
initSimulation();

// execution functions
function compute(commandEncoder: GPUCommandEncoder) {
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, currentComputeBindeGroup);

  const workgrouCount = Math.ceil(params.particleCount / 32);
  passEncoder.dispatchWorkgroups(workgrouCount);
  passEncoder.end();
}

function render(commandEncoder: GPUCommandEncoder) {
  const textureView = context.getCurrentTexture().createView();
  const depthTextureView = depthTexture.createView();

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTextureView,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(renderPipeline);
  passEncoder.setBindGroup(0, currentRenderBindGroup);
  passEncoder.draw(params.particleCount * 6);
  passEncoder.end();
}

async function frame() {
  const commandEncoder = device.createCommandEncoder();

  compute(commandEncoder);
  render(commandEncoder);

  commandEncoder.copyBufferToBuffer(
    outputBuffer,
    0,
    stagingBuffer,
    0,
    particleData.byteLength,
  );

  device.queue.submit([commandEncoder.finish()]);

  currentComputeBindeGroup =
    currentComputeBindeGroup === computeBindGroupA
      ? computeBindGroupB
      : computeBindGroupA;
  currentRenderBindGroup =
    currentRenderBindGroup === renderBindGroupA
      ? renderBindGroupB
      : renderBindGroupA;

  animationFrameId = requestAnimationFrame(frame);
}

// Apply button handler
document.getElementById('apply')?.addEventListener('click', () => {
  getValuesFromInputs();
  initSimulation();
  animationFrameId = requestAnimationFrame(frame);
});

// start animation
animationFrameId = requestAnimationFrame(frame);
