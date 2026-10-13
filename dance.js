//////////////////// HUGE WARNING ////////////////////
/*
    this sucks... im so embarrassed and i hate it so so much
*/

const canvas = document.getElementById("overlayCanvas");
const ctx = canvas.getContext('2d');

const world_scale = 10;

function to_worldspace(pos) {
    return [pos[0] / world_scale, pos[1] / world_scale];
}

function to_screenspace(pos) {
    return [pos[0] * world_scale, pos[1] * world_scale];
}

function mult_by_or_minmax(v, c, min, max) {
    if (Math.abs(v * c) < min) {
        return min * Math.sign(v);
    }
    else if (Math.abs(v * c) > max) {
        return max * Math.sign(v);
    }
    return v * c;
}

var manmoder = new Image();
var global_moder_scale_reduction = [100, 100]; // n many pixels smaller regardless of scale
var last_time; // used for delta time calculation
var start_time;

class Moder {
    constructor(pos, rot, scale, start_vel = [0, 0], scale_amount = [0, 0], scale_speed = 10) {
        this.vel = start_vel;
        this.pos = pos;
        this.rot = rot;
        this.rot_vel = 4;
        this.scale = [scale[0], scale[1]];
        this._scale = [scale[0], scale[1]];
        this.scale_amount = scale_amount;
        this.scale_theta = 0;
        this.scale_speed = scale_speed;
        this.scale_phase = [0, Math.PI];
        this.mass = 6.9420;
    }

    step(delta) {
        this.vel[1] += this.mass * 9.81 * delta;
        for (let i = 0; i < 2; ++i) {
            this.pos[i] += this.vel[i] * delta;
            this.scale[i] = this._scale[i] + norm_sin(this.scale_theta * this.scale_speed + this.scale_phase[i]) * this.scale_amount[i];
        }
        this.scale_theta += delta;
        this.rot += this.rot_vel * delta;

        // i dont believe in reusing code :P 
        let screen_pos = to_screenspace(this.pos);
        if (screen_pos[1] > canvas.height) {
            this.pos[1] = canvas.height / world_scale;
            this.vel[1] *= -(1 + Math.random() * 0.00981);
            this.rot_vel = mult_by_or_minmax(this.rot_vel, 2 * Math.random() * Math.sign(this.rot_vel) * Math.sign(this.vel[0]), 1, 6);
        }
        else if (screen_pos[1] < 0) {
            this.pos[1] = 0;
            //this.vel[1] *= -1;
            this.vel[1] *= -1;
            this.rot_vel = mult_by_or_minmax(this.rot_vel, -2 * Math.random() * Math.sign(this.rot_vel) * Math.sign(this.vel[0]), 1, 6);
        }
        if (screen_pos[0] > canvas.width) {
            this.pos[0] = canvas.width / world_scale;
            //this.vel[0] *= -1;
            this.vel[0] *= -1;
            this.rot_vel = mult_by_or_minmax(this.rot_vel, -2 * Math.random() * Math.sign(this.rot_vel) * Math.sign(this.vel[1]), 1, 6);
        }
        else if (screen_pos[0] < 0) {
            this.pos[0] = 0;
            //this.vel[0] *= -1;
            this.vel[0] *= -1;
            this.rot_vel = mult_by_or_minmax(this.rot_vel, 2 * Math.random() * Math.sign(this.rot_vel) * Math.sign(this.vel[1]), 1, 6);
        }
    }
};

var moders = new Array();

function draw_moder(pos, rot, scale) {
    let x = pos[0] * world_scale;
    let y = pos[1] * world_scale;
    let width = [manmoder.width - global_moder_scale_reduction[0]] * scale[0];
    let height = [manmoder.height - global_moder_scale_reduction[1]] * scale[1];
    let dx = x - width / 2;
    let dy = y - height / 2;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.translate(-x, -y);
    ctx.drawImage(manmoder, dx, dy, width, height);
    ctx.translate(x, y);
    ctx.rotate(-rot);
    ctx.translate(-x, -y);
}

function norm_sin(theta) {
    return 0.5 * Math.sin(theta) + 0.5;
}

function resize_canvas(event) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function init() {
    window.addEventListener('resize', resize_canvas);
    resize_canvas();
    manmoder.src = './static/literallyme_small.png';

    let n_moders = (30 / (1920 * 1080)) * (canvas.width * canvas.height); // arbitrary this many moders per screen area number to not overcrowd small screens
    for (let i = 0; i < n_moders; ++i) {
        let scale = Math.random() * 2 + 0.2;
        let angle = Math.random() * 2 * Math.PI
        let len = Math.max(10, Math.random() * 100);
        moders.push(new Moder(to_worldspace([canvas.width / 2, canvas.height / 2]), Math.random() * 2 * Math.PI , [scale, scale], [Math.cos(angle) * len, Math.sin(angle) * len]));
    }
}

function start() {
    last_time = performance.now();
    start_time = performance.now();
    window.requestAnimationFrame(frame);
}

function frame(time) {
    window.requestAnimationFrame(frame);
    let delta = (time - last_time) / 1000;
    let elapsed = time - start_time;
    last_time = time;

    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //draw_moder([0.25, 0.5], Math.sin(elapsed / 300), [0.8 + norm_sin(elapsed / 100 + Math.PI / 1.5) * 0.4, 0.8 + norm_sin(elapsed / 100) * 0.4]);
    moders.forEach(moder => {
        moder.step(delta);
        
        let s = [moder._scale[0], moder._scale[1]];
        if (elapsed <= 1000) {
            s[0] = moder._scale[0] * (elapsed / 1000);
            s[1] = moder._scale[1] * (elapsed / 1000);
        }
        draw_moder(moder.pos, moder.rot, s);
    });
}

init();
manmoder.addEventListener('load', start); // works on my machine