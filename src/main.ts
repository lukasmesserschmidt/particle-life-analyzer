import { getDevice } from './webgpu/device';
import { Controller } from './controller';
import type { SimulationParams } from './simulation/parameters';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = 1000;
canvas.height = 1000;
const device = await getDevice();
const controller = new Controller(canvas, device);

function getParamsFromInputs() {
  const preferedParticleCount = parseInt(
    (document.getElementById('preferredParticleCount') as HTMLInputElement)
      .value,
  );
  const groupCount = parseInt(
    (document.getElementById('groupCount') as HTMLInputElement).value,
  );

  const params: SimulationParams = {
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

  return params;
}

// Add input validation to clamp values to min/max
function clampInputValue(input: HTMLInputElement) {
  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const value = parseFloat(input.value);

  if (!isNaN(value)) {
    if (!isNaN(min) && value < min) {
      input.value = min.toString();
    } else if (!isNaN(max) && value > max) {
      input.value = max.toString();
    }
  }
}

// Add event listeners to all number inputs
document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener('change', () =>
    clampInputValue(input as HTMLInputElement),
  );
});

// Apply button handler
document.getElementById('apply')?.addEventListener('click', () => {
  const params = getParamsFromInputs();
  controller.init(params);
  controller.startUpdateLoop();
});

// start animation
const params = getParamsFromInputs();
controller.init(params);
controller.startUpdateLoop();
