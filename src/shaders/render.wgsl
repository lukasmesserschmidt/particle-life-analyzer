const MAX_DIM = {{MAX_DIM}};
const MAX_GROUPS = {{MAX_GROUPS}};

struct SimParams {
    group_count: u32,
    particle_count: u32,
    dimension: u32,
    time_step: f32,
    friction_half_life: f32,
    r_max: f32,
    particle_size: f32
}

struct Particle {
    position: array<f32, MAX_DIM>,
    velocity: array<f32, MAX_DIM>
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) local_coord: vec2<f32>,
    @location(1) depth: f32,
    @location(2) @interpolate(flat) group_index: u32
}

@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<storage, read> color_data: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> particle_data: array<Particle>;

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
    let particle_index: u32 = vertex_index / 6;
    let corner_index: u32 = vertex_index % 6;
    
    let particle: Particle = particle_data[particle_index];

    let corner_offsets = array(
        vec2<f32>(-0.0005, -0.0005),
        vec2<f32>(0.0005, -0.0005),
        vec2<f32>(-0.0005, 0.0005),
        vec2<f32>(0.0005, -0.0005),
        vec2<f32>(0.0005, 0.0005),
        vec2<f32>(-0.0005, 0.0005)
    );

    let offset: vec2<f32> = corner_offsets[corner_index] * sim_params.particle_size;
    let pos_with_offset: vec2<f32> = vec2<f32>(particle.position[0], particle.position[1]) + offset;
    let depth: f32 = particle.position[2];

    var output: VertexOutput;
    let f: f32 = 1.0 / (depth + 1.0);
    output.position = vec4<f32>((pos_with_offset.x * 2.0 - 1.0) * f, (pos_with_offset.y * 2.0 - 1.0) * f, depth, 1.0);
    
    output.depth = depth;

    output.local_coord = corner_offsets[corner_index];

    let particles_per_group: u32 = sim_params.particle_count / sim_params.group_count;
    output.group_index = particle_index / particles_per_group;

    return output;
}

@fragment
fn fg_main(@location(0) local_coord: vec2<f32>, 
           @location(1) depth: f32, 
           @location(2) @interpolate(flat) group_index: u32) -> @location(0) vec4<f32> {
               
    let scaled_corner: vec2<f32> = local_coord / 0.0005;
    let r_sqr: f32 = dot(scaled_corner, scaled_corner);
    if r_sqr > 0.25 - 0.125 * depth {
        discard;
    }
    
    let color: vec4<f32> = color_data[group_index];

    let brightness: f32 = 1.0 - 0.5 * depth;
    let contrast: f32 = 1.0 - 0.5 * depth;
    
    let adjusted_color: vec4<f32> = (color - 0.5) * contrast + 0.5;
    
    return vec4<f32>(adjusted_color.rgb * brightness, adjusted_color.a);
}