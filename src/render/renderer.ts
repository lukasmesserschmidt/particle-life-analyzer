import type { SimulationParams } from '../simulation/parameters';
import type { RenderBuffers } from './render_buffers';

import { createRenderPipeline } from '../webgpu/pipelines';
import { createBindGroup } from '../webgpu/bind_groups';
import { renderShaderCode } from '../webgpu/shaders';
import { createDepthTexture } from '../webgpu/textures';

class Renderer {
  private device: GPUDevice;
  private params: SimulationParams;

  private depthTexture: GPUTexture;
  private renderPipeline: GPURenderPipeline;
  private renderBindGroupA: GPUBindGroup;
  private renderBindGroupB: GPUBindGroup;
  private currentRenderBindGroup: GPUBindGroup;

  constructor(device: GPUDevice, presentationFormat: GPUTextureFormat) {
    this.device = device;

    const renderShaderModule = device.createShaderModule({
      label: 'particle renderer',
      code: renderShaderCode,
    });

    // create render pipeline
    this.renderPipeline = createRenderPipeline(
      device,
      renderShaderModule,
      presentationFormat,
    );
  }

  public init(
    canvas: HTMLCanvasElement,
    params: SimulationParams,
    renderContext: RenderBuffers,
  ) {
    this.params = params;

    // destroy old buffers if they exist
    if (this.depthTexture) this.depthTexture.destroy();

    // create textures
    this.depthTexture = createDepthTexture(
      this.device,
      canvas.width,
      canvas.height,
    );

    // create bind groups
    this.renderBindGroupA = createBindGroup(this.device, this.renderPipeline, [
      renderContext.simParamsBuffer,
      renderContext.colorBuffer,
      renderContext.inputBuffer,
    ]);

    this.renderBindGroupB = createBindGroup(this.device, this.renderPipeline, [
      renderContext.simParamsBuffer,
      renderContext.colorBuffer,
      renderContext.outputBuffer,
    ]);

    this.currentRenderBindGroup = this.renderBindGroupA;
  }

  render(context: GPUCanvasContext, commandEncoder: GPUCommandEncoder) {
    const textureView = context.getCurrentTexture().createView();
    const depthTextureView = this.depthTexture.createView();

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
    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setBindGroup(0, this.currentRenderBindGroup);
    passEncoder.draw(this.params.particleCount * 6);
    passEncoder.end();
  }

  public swapBindGroups() {
    this.currentRenderBindGroup =
      this.currentRenderBindGroup === this.renderBindGroupA
        ? this.renderBindGroupB
        : this.renderBindGroupA;
  }
}

export { Renderer };
