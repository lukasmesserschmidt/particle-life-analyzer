function createBindGroup(
  device: GPUDevice,
  pipeline: GPUPipelineBase,
  buffers: GPUBuffer[],
): GPUBindGroup {
  return device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: buffers.map((buffer, index) => ({
      binding: index,
      resource: { buffer },
    })),
  });
}

export { createBindGroup };
