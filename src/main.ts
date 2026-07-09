import { getDevice } from './webgpu/device';
import { Controller } from './controller/controller';
import type { SimulationParams } from './simulation/parameters';
import { SPACE } from './types';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = SPACE;
canvas.height = SPACE;
const device = await getDevice();
const controller = new Controller(canvas, device);

function getParamsFromInputs(): SimulationParams {
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
    headless: (document.getElementById('headless') as HTMLInputElement).checked,
    headlessIterations: parseInt(
      (document.getElementById('headless-iterations') as HTMLInputElement)
        .value,
    ),
    headlessIterationTime: parseInt(
      (document.getElementById('headless-iteration-time') as HTMLInputElement)
        .value,
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

// Headless mode toggle
document.getElementById('headless')?.addEventListener('change', (e) => {
  const headless = (e.target as HTMLInputElement).checked;
  document
    .querySelector('.controls__headless')
    ?.classList.toggle('hidden', !headless);
  document.getElementById('canvas')?.classList.toggle('hidden', headless);
  document
    .getElementById('headless-container')
    ?.classList.toggle('hidden', !headless);
  controller.init(params);
  if (!headless) {
    const params = getParamsFromInputs();
    controller.init(params);
    controller.startSimulation();
  }
});

// Apply button handler
document.getElementById('apply')?.addEventListener('click', () => {
  const params = getParamsFromInputs();
  controller.init(params);
  controller.startSimulation();
});

// start animation
const params = getParamsFromInputs();
controller.init(params);
controller.startSimulation();
