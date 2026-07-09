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

struct Stats {
    total_distance: array<f32>,
}

struct Particle {
    position: array<f32, MAX_DIM>,
    velocity: array<f32, MAX_DIM>
}

alias Relation = array<f32, MAX_GROUPS>;

@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<storage, read_write> stats: Stats;
@group(0) @binding(2) var<storage, read> relations: array<Relation>;
@group(0) @binding(3) var<storage, read> particles_in: array<Particle>;
@group(0) @binding(4) var<storage, read_write> particles_out: array<Particle>;

@compute @workgroup_size(32)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let index: u32 = id.x;

    if (index >= sim_params.particle_count) {
        return;
    }

    let group_count: u32 = sim_params.group_count;
    let particle_count: u32 = sim_params.particle_count;
    let n: u32 = sim_params.dimension;
    let dt: f32 = sim_params.time_step;
    let friction_half_life: f32 = sim_params.friction_half_life;
    let r_max: f32 = sim_params.r_max;
    let r_max_sq: f32 = r_max * r_max;
    
    var particle: Particle = particles_in[index];
    var total_force: array<f32, MAX_DIM>;
    for (var i: u32 = 0; i < MAX_DIM; i = i + 1) {
        total_force[i] = 0.0;
    }
    
    let particles_per_group: u32 = particle_count / group_count;
    let group: u32 = index / particles_per_group;

    var local_distance: f32 = 0.0;

    for (var i: u32 = 0; i < particle_count; i = i + 1) {
        if (i == index) {
            continue;
        }
        
        let reference_particle: Particle = particles_in[i];
        
        // calculate euclidean distance
        var sum_sqr_dist: f32 = 0.0;
        for (var j: u32 = 0; j < n; j = j + 1) {
            var r_i: f32 = wrap_distance(reference_particle.position[j] - particle.position[j]);
            sum_sqr_dist = sum_sqr_dist + (r_i * r_i);
        }
        let r: f32 = sqrt(sum_sqr_dist);

        // accumulate stats locally
        local_distance = local_distance + r;
        
        if (r == 0.0 || r >= r_max) {
            continue;
        }
        
        // get relation
        let reference_group: u32 = i / particles_per_group;
        let relation: f32 = relations[group][reference_group];

        // calculate total force
        for (var j: u32 = 0; j < n; j = j + 1) {
            let r_i: f32 = wrap_distance(reference_particle.position[j] - particle.position[j]);

            // attraction
            let f: f32 = force(r / r_max, relation);
            total_force[j] = total_force[j] + (r_i / r) * f;
        }
    }

    // scale total force
    for (var i: u32 = 0; i < n; i = i + 1) {
        total_force[i] = total_force[i] * r_max;
    }
    
    // update velocity
    let decay: f32 = pow(0.5, dt / friction_half_life);
    for (var i: u32 = 0; i < n; i = i + 1) {
        particle.velocity[i] = particle.velocity[i] * decay;
        // particle.velocity[i] = particle.velocity[i] * friction_half_life;
        particle.velocity[i] = particle.velocity[i] + total_force[i] * dt;
    }

    // update position
    for (var i: u32 = 0; i < n; i = i + 1) {
        var pos: f32 = particle.position[i] + particle.velocity[i] * dt;
        particle.position[i] = wrap_position(pos);
    }

    particles_out[index] = particle;
    
    // write local accumulated distance to stats array
    stats.total_distance[index] = local_distance;
}

fn force(r: f32, a: f32) -> f32 {
    const beta: f32 = 0.3;
    if (r < beta) {
        return (r / beta) - 1.0;
    } else if (beta < r && r < 1.0) {
        return a * (1.0 - abs(2.0 * r - 1.0 - beta) / (1.0 - beta));
    } else {
        return 0.0;
    }
}

fn wrap_distance(d: f32) -> f32 {
    return d - 1.0 * round(d);
}

fn wrap_position(pos: f32) -> f32 {
    if (pos < 0.0) {
        return pos + 1.0;
    } else if (pos > 1.0) {
        return pos - 1.0;
    }
    return pos;
}
