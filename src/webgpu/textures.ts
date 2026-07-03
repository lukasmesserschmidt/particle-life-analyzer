function createDepthTexture(
  device: GPUDevice,
  width: number,
  height: number,
): GPUTexture {
  const depthTexture = device.createTexture({
    size: [width, height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  return depthTexture;
}

export { createDepthTexture };
