function createSimParamsBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size: size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
}

function createStatsBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size: size,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
}

function createRelationBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size: size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
}

function createColorBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size: size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
}

function createInputBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size: size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
}

function createOutputBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size: size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
}

function createStagingBuffer(device: GPUDevice, size: number): GPUBuffer {
  return device.createBuffer({
    size: size,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
}

export {
  createSimParamsBuffer,
  createStatsBuffer,
  createRelationBuffer,
  createColorBuffer,
  createInputBuffer,
  createOutputBuffer,
  createStagingBuffer,
};
