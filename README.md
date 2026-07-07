# Particle Life Analyzer

A high-performance N-dimensional particle life simulation using WebGPU for GPU-accelerated computation. This project simulates particle interactions in configurable dimensions with real-time statistical analysis and visualization.

## Features

- **N-dimensional simulation**: Configure particle systems from 1D to 16D
- **GPU acceleration**: Uses WebGPU for high-performance parallel computation
- **Real-time statistics**: Tracks mean squared displacement, spatial entropy, and normalized average distance
- **Interactive controls**: Adjust particle count, dimensions, physics parameters, and visualization settings
- **Live visualization**: Real-time rendering of particle behavior with Chart.js analytics

## Prerequisites

- A modern browser with WebGPU support (Chrome 113+, Edge 113+, or Firefox Nightly)
- Node.js 18+ and npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd n-dim-particle-life
```

2. Install dependencies:

```bash
npm install
```

## Usage

### Development

Start the development server:

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (typically `http://localhost:5173`).

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Parameters

- **Preferred Particle Count**: Total number of particles (16-100,000)
- **Group Count**: Number of particle groups with different interaction rules (1-16)
- **Dimensions**: Spatial dimensions for the simulation (0-16)
- **Seed**: Random seed for reproducible simulations
- **Relation Scale**: Scale factor for interaction strength between groups
- **Time Step**: Simulation time step size (0.001-1)
- **Friction Half-Life**: Controls velocity decay over time
- **Max Range**: Maximum interaction distance between particles
- **Visual Particle Size**: Rendering size of particles

## Architecture

The project is organized into several key modules:

- **`simulation/`**: Core particle simulation logic and physics
  - `particle_data_generator.ts`: Particle data generation and initialization
  - `simulation.ts`: Main simulation controller with WebGPU compute pipeline
  - `parameters.ts`: Simulation parameter interfaces
  - `output_buffers.ts`: GPU buffer management for simulation output

- **`render/`**: GPU-accelerated rendering pipeline
  - `renderer.ts`: WebGPU render pipeline and draw calls
  - `render_buffers.ts`: Render buffer interfaces

- **`stats/`**: Statistical analysis and visualization
  - `stats.ts`: Statistics controller and chart management
  - `normalized_msd.ts`: Mean squared displacement calculation
  - `normalized_spatial_entropy.ts`: Spatial entropy analysis
  - `normalized_average_distance.ts`: Average distance metrics

- **`webgpu/`**: WebGPU abstraction layer
  - `device.ts`: GPU device initialization
  - `buffers.ts`: GPU buffer creation utilities
  - `pipelines.ts`: Compute and render pipeline setup
  - `shaders.ts`: WGSL shader code management
  - `textures.ts`: Depth texture creation

- **`controller.ts`**: Main application controller coordinating simulation, rendering, and statistics

## Technical Details

### WebGPU Pipeline

The simulation uses a double-buffering approach for efficient GPU computation:

- Compute shaders handle particle physics and interaction calculations
- Render shaders visualize particle positions with depth testing
- Staging buffers enable GPU-to-CPU data transfer for statistics

### Statistics

Three key metrics are tracked in real-time:

- **Mean Squared Displacement**: Measures particle movement from initial positions
- **Spatial Entropy**: Quantifies spatial distribution uniformity
- **Normalized Average Distance**: Tracks average inter-particle distance

## Browser Compatibility

WebGPU is required for this application. Check browser support at:

- [WebGPU Browser Support](https://caniuse.com/webgpu)
