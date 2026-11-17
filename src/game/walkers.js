// Villagers walking up and down the village roads so the streets feel alive (feedback 17/11). They use the light
// villager models (about 10k triangles each) with a slight colour change each, walk on the right-hand side of the
// road, stop when Ngọc stands in their way and greet her in short English lines (E). Only in the village.
import * as THREE from 'three';
import * as L from '../core/layout.js';

/** Routes along the village roads (walked there and back). */
export const ROUTES = [
  [[0, -17], [0, -4], [-4.6, 4], [0, 12], [-1, 24], [-2, 34]],
  [[5, 6], [8, 6], [14, 12], [15.5, 16]],
  [[0, 0], [-10, -1], [-22, -14], [-28, -30]],
  [[-2, 34], [-8, 42], [-16, 46], [-26, 44]],
  [[-1.5, 30], [-16, 30]],
];
const MODELS = ['npc_sam_fisherman_v02', 'npc_ben_merchant_v02', 'npc_forge_blacksmith_v01', 'npc_sam_fisherman_v02', 'npc_ben_merchant_v02'];
const TINTS = [[0.92, 1.0, 1.08], [1.06, 0.98, 0.9], [0.95, 1.05, 0.95], [1.08, 0.94, 1.0], [0.9, 0.95, 1.05]];
const HELLO = ['Good morning!', 'What a lovely day!', 'The market is busy today.', 'Have a nice day!', 'Hello there, little hero!', 'I love walking by the river.', 'See you later!'];

export class Walkers {
  /** load(name) -> Promise<gltf> must give a fresh copy each call. */
  constructor(scene, load) { this.scene = scene; this.load = load; this.list = []; this.region = 'village'; }
  async init() {
    for (let i = 0; i < ROUTES.length; i++) {
      const gltf = await this.load(MODELS[i]), root = gltf.scene, mixer = new THREE.AnimationMixer(root), act = {};
      for (const c of gltf.animations) act[c.name] = mixer.clipAction(c);
      root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.material = o.material.clone(); o.material.color.multiply(new THREE.Color(...TINTS[i])); } });
      root.scale.setScalar(0.92 + (i % 3) * 0.04);
      const route = ROUTES[i], w = { root, mixer, act, cur: '', route, seg: 0, dir: 1, t: (i * 0.37) % 1, x: route[0][0], z: route[0][1], speed: 1.15 + (i % 3) * 0.15, wait: 0, line: i };
      this.scene.add(root); this.list.push(w); this.play(w, 'Walk');
    }
  }
  play(w, n) { if (w.cur === n || !w.act[n]) return; const a = w.act[n]; a.reset().play(); if (w.act[w.cur]) w.act[w.cur].crossFadeTo(a, 0.25, false); w.cur = n; }
  setRegion(name) { this.region = name; for (const w of this.list) w.root.visible = name === 'village'; }
  /** dt: seconds; player: position; talking: the walker index being talked to (stands still and faces Ngọc). */
  update(dt, player, talking = -1) {
    if (this.region !== 'village') return;
    for (const [i, w] of this.list.entries()) {
      const near = Math.hypot(player.x - w.x, player.z - w.z), far = near > 48;
      w.root.visible = !far; if (far) continue;
      const a = w.route[w.seg], b = w.route[w.seg + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const blocked = near < 1.3 || talking === i;
      if (w.wait > 0) w.wait -= dt;
      else if (!blocked) {
        w.t += (w.speed * dt / len) * w.dir;
        if (w.t > 1 || w.t < 0) {           // next segment, or turn round at the end of the road
          if (w.dir > 0 && w.seg < w.route.length - 2) { w.seg += 1; w.t = 0; }
          else if (w.dir < 0 && w.seg > 0) { w.seg -= 1; w.t = 1; }
          else { w.dir = -w.dir; w.t = Math.min(1, Math.max(0, w.t)); w.wait = 1.5 + (i % 3); }
        }
      }
      const A = w.route[w.seg], B = w.route[w.seg + 1], dx = (B[0] - A[0]), dz = (B[1] - A[1]), l = Math.hypot(dx, dz) || 1;
      const side = 1.1 * w.dir;               // keep to the right-hand side of the road
      w.x = A[0] + dx * w.t - dz / l * side; w.z = A[1] + dz * w.t + dx / l * side;
      w.root.position.set(w.x, L.walkHeight(w.x, w.z), w.z);
      const yaw = blocked || w.wait > 0 ? (near < 4 ? Math.atan2(player.x - w.x, player.z - w.z) : w.root.rotation.y) : Math.atan2(dx * w.dir, dz * w.dir);
      let d = yaw - w.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); w.root.rotation.y += d * Math.min(1, dt * 6);
      this.play(w, talking === i ? 'Talk' : blocked || w.wait > 0 ? 'Idle' : 'Walk');
      if (near < 30) w.mixer.update(dt);       // far walkers keep their pose: saves time on slow machines
    }
  }
  /** The walker within reach of pos, or -1. */
  near(pos) { if (this.region !== 'village') return -1; return this.list.findIndex((w) => w.root.visible && Math.hypot(pos.x - w.x, pos.z - w.z) < 2.0); }
  greet(i) { const w = this.list[i]; w.line = (w.line + 1) % HELLO.length; return HELLO[w.line]; }
}
