async function getDevice() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    throw new Error('WebGPU not supported');
  }
  return device;
}

export { getDevice };
