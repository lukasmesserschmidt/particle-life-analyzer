import computeShaderCodeRaw from '../shaders/compute.wgsl?raw';
import renderShaderCodeRaw from '../shaders/render.wgsl?raw';
import { MAX_GROUPS, MAX_DIM } from '../types';

function replaceShaderConstants(shaderCode: string): string {
  return shaderCode
    .replace(/{{MAX_DIM}}/g, MAX_DIM.toString())
    .replace(/{{MAX_GROUPS}}/g, MAX_GROUPS.toString());
}

const computeShaderCode = replaceShaderConstants(computeShaderCodeRaw);
const renderShaderCode = replaceShaderConstants(renderShaderCodeRaw);

export { computeShaderCode, renderShaderCode };
