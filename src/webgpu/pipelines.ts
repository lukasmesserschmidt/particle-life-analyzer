function createComputePipeline(
  device: GPUDevice,
  shaderModule: GPUShaderModule,
): GPUComputePipeline {
  return device.createComputePipeline({
    label: 'compute pipeline',
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });
}

function createRenderPipeline(
  device: GPUDevice,
  shaderModule: GPUShaderModule,
  presentationFormat: GPUTextureFormat,
): GPURenderPipeline {
  return device.createRenderPipeline({
    label: 'render pipeline',
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fg_main',
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  });
}

export { createComputePipeline, createRenderPipeline };
