// House interiors (18/11: "go inside the houses, with a nice room inside"). When Ngọc enters a house the game draws
// one of these rooms instead of the village, with the shop / music / quest window docked on the right. Rooms are
// built from simple shapes in the game's warm palette: plank floor, panelled walls, beams, glowing windows and
// lanterns, a rug, and furniture for each house. The camera drifts slowly so the room feels alive.
import { SOUVENIRS, TROPHIES, SHOW_FILE } from '../core/house.js';
import * as THREE from 'three';
import { GROUPS, floorPlan, roomOf, paintOf, WALL_COLORS, FLOOR_COLORS, FLOOR_H, dims, stairOf, stairX, STAIR_HALF, DOOR_HALF, cellsOf } from '../core/house.js';
import { buildHomeWalk } from './homewalk.js';

const M = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const box = (g, w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
const cyl = (g, r1, r2, h, m, x, y, z, seg = 12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); g.add(o); return o; };
const ball = (g, r, m, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); o.position.set(x, y, z); g.add(o); return o; };

/** The shell every room shares: 8 x 6 m, 3.4 m high, open towards the camera. */
function shell(g, wallCol, floorCol, rugs = true) {
  const plank = M(floorCol, 0.85), wall = M(wallCol, 0.9), beam = M(0x5a3416, 0.85), trim = M(0x7a4a24, 0.8);
  for (let i = 0; i < 16; i++) box(g, 0.5, 0.06, 6.2, i % 2 ? plank : M(new THREE.Color(floorCol).multiplyScalar(0.9).getHex(), 0.85), -3.75 + i * 0.5, 0, 0);
  box(g, 8, 3.4, 0.2, wall, 0, 1.7, -3.1); box(g, 0.2, 3.4, 6.2, wall, -4, 1.7, 0); box(g, 0.2, 3.4, 6.2, wall, 4, 1.7, 0);
  box(g, 8, 1.0, 0.24, trim, 0, 0.5, -3.0); box(g, 0.24, 1.0, 6.2, trim, -3.9, 0.5, 0); box(g, 0.24, 1.0, 6.2, trim, 3.9, 0.5, 0);    // wainscot
  for (const x of [-3, -1, 1, 3]) box(g, 0.25, 0.25, 6.2, beam, x, 3.3, 0);
  box(g, 8.2, 0.12, 6.4, M(0x6a4020, 0.9), 0, 3.46, 0);
  // two windows with daylight
  for (const x of [-2.2, 2.2]) { box(g, 1.3, 1.2, 0.08, M(0xfff2c0, 0.3, { emissive: 0xffe0a0, emissiveIntensity: 0.9 }), x, 2.15, -2.98); box(g, 1.45, 0.1, 0.16, trim, x, 1.52, -2.95); box(g, 0.08, 1.2, 0.12, trim, x, 2.15, -2.94); box(g, 1.3, 0.08, 0.12, trim, x, 2.15, -2.94); }
  if (!rugs) return;
  // rug
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), M(0xb8463a, 0.95)); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.4, 1, 1); rug.position.set(0, 0.04, 0.6); g.add(rug);
  const rug2 = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.4, 32), M(0xf2c84a, 0.95)); rug2.rotation.x = -Math.PI / 2; rug2.scale.set(1.4, 1, 1); rug2.position.set(0, 0.05, 0.6); g.add(rug2);
}
/** A hanging lantern with a warm light. */
function lantern(g, x, z, lights) {
  cyl(g, 0.01, 0.01, 0.6, M(0x333333), x, 3.0, z, 4);
  ball(g, 0.16, M(0xffd27a, 0.4, { emissive: 0xffb040, emissiveIntensity: 1.6 }), x, 2.6, z);
  const l = new THREE.PointLight(0xffc070, 6, 9, 1.6); l.position.set(x, 2.5, z); g.add(l); lights.push(l);
}
function bookshelf(g, x, z, ry) {
  const s = new THREE.Group(), wood = M(0x6a3e1c, 0.85), cols = [0xc0392b, 0x2f6fd0, 0x2e9a5a, 0xe8b030, 0x8a4ad0, 0xe07a30];
  box(s, 1.6, 2.4, 0.4, wood, 0, 1.2, 0); for (let k = 0; k < 4; k++) box(s, 1.5, 0.05, 0.38, M(0x8a5428), 0, 0.35 + k * 0.55, 0.02);
  for (let k = 0; k < 4; k++) for (let i = 0; i < 9; i++) box(s, 0.12, 0.38 + (i * 7 % 5) * 0.02, 0.28, M(cols[(i + k) % cols.length], 0.7), -0.62 + i * 0.155, 0.56 + k * 0.55, 0.06);
  s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
}
function shelfWall(g, x, z, ry, items) {
  const s = new THREE.Group(), wood = M(0x7a4a24, 0.85);
  box(s, 2.4, 2.2, 0.08, M(0x5a3416), 0, 1.3, -0.2);
  for (let k = 0; k < 3; k++) box(s, 2.4, 0.07, 0.42, wood, 0, 0.55 + k * 0.7, 0);
  items(s); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
}
const sword = (g, x, y, z, col) => { box(g, 0.06, 0.62, 0.02, M(col, 0.3, { metalness: 0.7 }), x, y + 0.36, z); box(g, 0.22, 0.04, 0.05, M(0x8a6a2a), x, y + 0.04, z); box(g, 0.04, 0.14, 0.04, M(0x5a3416), x, y - 0.05, z); };
const shield = (g, x, y, z, col) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 18), M(col, 0.5, { metalness: 0.4 })); o.rotation.x = Math.PI / 2; o.position.set(x, y + 0.26, z); g.add(o); ball(g, 0.06, M(0xe2b04a, 0.3, { metalness: 0.8 }), x, y + 0.26, z + 0.04); };
const bread = (g, x, y, z) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 4, 10), M(0xd08a3a, 0.7)); o.rotation.z = Math.PI / 2; o.position.set(x, y + 0.1, z); g.add(o); };
const bottle = (g, x, y, z, col) => { cyl(g, 0.08, 0.1, 0.22, M(col, 0.2, { transparent: true, opacity: 0.85, emissive: col, emissiveIntensity: 0.25 }), x, y + 0.12, z); cyl(g, 0.03, 0.03, 0.08, M(0x8a5a2a), x, y + 0.27, z, 6); };
const pot = (g, x, y, z, s = 1) => { cyl(g, 0.16 * s, 0.12 * s, 0.24 * s, M(0xb8643a), x, y + 0.12 * s, z); for (let i = 0; i < 5; i++) ball(g, 0.12 * s, M([0x4f9a3a, 0x6cc044, 0x3f8a34][i % 3], 0.8), x + Math.cos(i * 1.3) * 0.1 * s, y + (0.32 + (i % 2) * 0.08) * s, z + Math.sin(i * 1.3) * 0.1 * s); };

/** A child's home (18/11): empty walls at first; each thing bought in the shops stands in its own place. */
export function homeThings(g, items, lights, model) {
  // Blender furniture (home_*_v01.glb, batch 11): drawn when the file is loaded (model(name) -> a private clone or null), else the shapes below
  const put = (file, x, y, z, ry = 0, sc = 1, rx = 0) => {
    const m = model && model(file); if (!m) return false;
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); if (Array.isArray(sc)) m.scale.set(...sc); else m.scale.setScalar(sc);
    m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(m); return true;
  };
  const has = (id) => items.includes(id), wood = M(0x9a6436), dark = M(0x5a3416), white = M(0xf4efe6, 0.7);
  // (27/11, turn 64) souvenirs and trophies: each on its own stand, in a row along the back wall (a plain block until the model is loaded)
  SOUVENIRS.forEach((id, k) => { if (!has(id)) return; const x = -3.3 + k * 0.78, z = -2.75; if (!put(SHOW_FILE[id], x, 0, z)) box(g, 0.4, 0.9, 0.4, M(0xd9a85a), x, 0.45, z); });
  TROPHIES.forEach((id, k) => { if (!has(id)) return; const x = -3.4 + k * 0.55, z = -2.8; if (!put(SHOW_FILE[id], x, 0, z, 0, 0.85)) box(g, 0.3, 1.0, 0.3, M(0xffcf3a, 0.4), x, 0.5, z); });
  if (has('rug') && !put('home_rug', -0.2, 0.04, 0.9, 0, [2.4, 1, 1.7])) { const r = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), M(0x3d6fc6, 0.95)); r.rotation.x = -Math.PI / 2; r.scale.set(1.4, 1, 1); r.position.set(-0.2, 0.04, 0.9); g.add(r);
    const r2 = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.32, 32), M(0xffd23c, 0.95)); r2.rotation.x = -Math.PI / 2; r2.scale.set(1.4, 1, 1); r2.position.set(-0.2, 0.05, 0.9); g.add(r2); }
  if (has('bed') && !put('home_bed', -2.8, 0, -1.95, 0, 1.0)) { box(g, 1.5, 0.4, 2.2, wood, -2.8, 0.2, -1.85); box(g, 1.4, 0.22, 2.05, white, -2.8, 0.51, -1.85); box(g, 1.42, 0.12, 1.3, M(0xe2483e, 0.9), -2.8, 0.66, -1.4);
    box(g, 0.9, 0.16, 0.42, M(0xffffff, 0.8), -2.8, 0.7, -2.6); box(g, 1.5, 1.2, 0.12, wood, -2.8, 0.6, -2.95); }
  if (has('wardrobe') && !put('home_wardrobe', -3.6, 0, 0.9, Math.PI / 2, 1.1)) { box(g, 0.6, 2.2, 1.3, dark, -3.55, 1.1, 0.9); box(g, 0.04, 2.0, 0.02, M(0x2a1a0a), -3.24, 1.1, 0.9); for (const z of [0.82, 0.98]) ball(g, 0.04, M(0xe2b04a, 0.3), -3.22, 1.15, z); }
  if (has('mirror') && !put('home_mirror', -3.68, 0, 2.3, Math.PI / 2, 1.05)) { box(g, 0.06, 1.35, 0.75, M(0xe2b04a, 0.35), -3.86, 1.55, 2.3); box(g, 0.03, 1.2, 0.6, new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.05, metalness: 0.9 }), -3.82, 1.55, 2.3); }
  if (has('table') && !put('home_table_chairs', -0.2, 0, 0.9, 0, 1.25)) { box(g, 1.4, 0.08, 0.9, wood, -0.2, 0.75, 0.9); for (const [x, z] of [[-0.8, 0.55], [0.4, 0.55], [-0.8, 1.25], [0.4, 1.25]]) box(g, 0.08, 0.72, 0.08, wood, x, 0.36, z);
    for (const x of [-1.25, 0.85]) { box(g, 0.45, 0.06, 0.45, wood, x, 0.45, 0.9); for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(g, 0.05, 0.45, 0.05, wood, x + dx, 0.22, 0.9 + dz); box(g, 0.06, 0.5, 0.45, wood, x + (x < 0 ? -0.2 : 0.2), 0.72, 0.9); }
    ball(g, 0.12, M(0xe2402f, 0.5), -0.4, 0.88, 0.9); ball(g, 0.11, M(0xff8a1a, 0.5), -0.1, 0.87, 0.95); }
  if (has('sofa') && !put('home_sofa', 3.3, 0, 0.7, -Math.PI / 2, 1.2)) { const c = M(0x2e9a5a, 0.95); box(g, 0.9, 0.45, 2.0, c, 3.3, 0.3, 0.7); box(g, 0.25, 0.85, 2.0, c, 3.75, 0.62, 0.7); for (const z of [-0.35, 1.75]) box(g, 0.95, 0.65, 0.2, c, 3.3, 0.4, z); }
  if (has('lamp') && put('home_lamp', -1.3, 0, -2.5, 0, 1.5)) { const l = new THREE.PointLight(0xffc070, 3, 6, 1.8); l.position.set(-1.3, 1.5, -2.4); g.add(l); lights.push(l); } else if (has('lamp')) { cyl(g, 0.03, 0.03, 1.5, M(0x333333), -1.3, 0.75, -2.6, 6); cyl(g, 0.18, 0.18, 0.04, M(0x333333), -1.3, 0.02, -2.6); cyl(g, 0.16, 0.3, 0.32, M(0xfff0c0, 0.6, { emissive: 0xffc060, emissiveIntensity: 0.9, side: THREE.DoubleSide }), -1.3, 1.6, -2.6, 16);
    const l = new THREE.PointLight(0xffc070, 3, 6, 1.8); l.position.set(-1.3, 1.5, -2.4); g.add(l); lights.push(l); }
  if (has('bookcase') && !put('home_bookcase', 3.0, 0, -2.78, 0, 1.5)) bookshelf(g, 3.0, -2.75, 0);
  if (has('desk') && !put('home_desk', -2.0, 0, 2.3, 0, 1.3)) { box(g, 1.2, 0.07, 0.6, wood, -2.0, 0.75, 2.5); for (const [x, z] of [[-2.5, 2.3], [-1.5, 2.3], [-2.5, 2.7], [-1.5, 2.7]]) box(g, 0.06, 0.72, 0.06, wood, x, 0.36, z); box(g, 0.32, 0.05, 0.24, M(0x2f6fd0), -2.2, 0.81, 2.5); box(g, 0.28, 0.05, 0.22, M(0xe8b030), -1.8, 0.81, 2.45); }
  if (has('clock') && !put('home_clock', 1.3, 2.55, -2.92, 0, 1.6)) { const c = cyl(g, 0.32, 0.32, 0.06, M(0x7a4a24), 1.3, 2.75, -2.95, 24); c.rotation.x = Math.PI / 2; const f = cyl(g, 0.27, 0.27, 0.02, white, 1.3, 2.75, -2.91, 24); f.rotation.x = Math.PI / 2;
    box(g, 0.025, 0.2, 0.01, M(0x222222), 1.3, 2.83, -2.89); box(g, 0.14, 0.02, 0.01, M(0x222222), 1.36, 2.75, -2.89); }
  if (has('picture') && !put('home_picture', 0, 1.85, -2.93, 0, 1.7)) { box(g, 1.0, 0.75, 0.05, M(0xe2b04a, 0.4), 0, 2.2, -2.97); box(g, 0.86, 0.3, 0.02, M(0x8fd0ff, 0.8), 0, 2.33, -2.94); box(g, 0.86, 0.32, 0.02, M(0x5fb84a, 0.8), 0, 2.03, -2.94); ball(g, 0.08, M(0xffd23c, 0.5, { emissive: 0xffc000, emissiveIntensity: 0.5 }), 0.25, 2.38, -2.93); }
  if (has('plant') && !put('home_plant', 3.4, 0, 2.4, 0, 1.5)) pot(g, 3.4, 0, 2.4, 1.6);
  if (has('guitar') && !put('home_guitar', -0.55, 0, -2.72, 0, 1.0, -0.18)) { const gg = new THREE.Group(), body = M(0xc87a30, 0.4); const b1 = ball(gg, 0.26, body, 0, 0.3, 0); b1.scale.z = 0.35; const b2 = ball(gg, 0.2, body, 0, 0.62, 0); b2.scale.z = 0.35;
    box(gg, 0.07, 0.75, 0.04, dark, 0, 1.1, 0); cyl(gg, 0.07, 0.07, 0.02, M(0x222222), 0, 0.45, 0.1, 12).rotation.x = Math.PI / 2; gg.position.set(-0.55, 0, -2.75); gg.rotation.x = -0.18; g.add(gg); }
  if (has('piano') && !put('home_piano', 1.35, 0, -2.4, 0, 1.15)) { const k = M(0x14141a, 0.15); box(g, 1.7, 1.15, 0.6, k, 1.35, 0.58, -2.65); box(g, 1.6, 0.05, 0.3, white, 1.35, 0.78, -2.25); for (let i = 0; i < 10; i++) if (i % 7 !== 2 && i % 7 !== 6) box(g, 0.06, 0.04, 0.16, k, 0.65 + i * 0.15, 0.82, -2.32);
    box(g, 0.6, 0.06, 0.35, k, 1.35, 0.48, -1.8); }
  if (has('drum') && !put('home_drum', 2.3, 0, 2.0, 0, 0.8)) { cyl(g, 0.38, 0.38, 0.45, M(0xd8342a, 0.4), 2.3, 0.23, 2.0, 20); cyl(g, 0.39, 0.39, 0.02, white, 2.3, 0.46, 2.0, 20); for (const dx of [-0.12, 0.12]) { const st = cyl(g, 0.015, 0.015, 0.45, M(0xe8c070), 2.3 + dx, 0.5, 2.0, 5); st.rotation.z = 1.2 * Math.sign(dx); } }
  if (has('violin') && !put('home_violin', 3.84, 1.1, -1.2, -Math.PI / 2, 1.3)) { const vg = new THREE.Group(), b = M(0x8a3a10, 0.3); const v1 = ball(vg, 0.15, b, 0, 0, 0); v1.scale.z = 0.3; const v2 = ball(vg, 0.12, b, 0, 0.2, 0); v2.scale.z = 0.3; box(vg, 0.04, 0.35, 0.03, M(0x1a1a1a), 0, 0.45, 0);
    vg.position.set(3.86, 1.6, -1.2); vg.rotation.y = -Math.PI / 2; vg.rotation.z = 0.3; g.add(vg); }
  extraThings(g, items);      // (25/11) the newer pieces
}

// (25/11) "more kinds of furniture": 22 more pieces drawn from simple shapes, each in its own spot of its room (the child moves them freely).
const XTRA = {
  armchair: [-5.5, 1.5, Math.PI / 2, (g) => { const c = M(0xc0504a, 0.95), w = M(0x5a3416); box(g, 1.0, 0.45, 1.0, c, 0, 0.35, 0); box(g, 1.0, 0.8, 0.22, c, 0, 0.75, -0.42); for (const x of [-0.45, 0.45]) box(g, 0.16, 0.6, 1.0, c, x, 0.5, 0); for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) box(g, 0.08, 0.14, 0.08, w, x, 0.07, z); }],
  coffee_table: [1.8, 0.8, 0, (g) => { const w = M(0x8a5428, 0.6); box(g, 1.3, 0.07, 0.75, w, 0, 0.45, 0); box(g, 1.15, 0.04, 0.6, w, 0, 0.15, 0); for (const [x, z] of [[-0.58, -0.3], [0.58, -0.3], [-0.58, 0.3], [0.58, 0.3]]) box(g, 0.06, 0.45, 0.06, w, x, 0.22, z); ball(g, 0.1, M(0xe8b030, 0.5), 0.3, 0.55, 0); }],
  tv: [0, -5.3, 0, (g) => { const k = M(0x222428, 0.4); box(g, 2.2, 0.55, 0.5, M(0x6a4020, 0.7), 0, 0.28, 0); box(g, 1.9, 1.1, 0.07, k, 0, 1.25, 0); box(g, 1.75, 0.95, 0.02, M(0x3a7ad8, 0.3, { emissive: 0x2a6ad0, emissiveIntensity: 0.7 }), 0, 1.25, 0.045); box(g, 0.3, 0.2, 0.2, k, 0, 0.62, 0); }],
  fireplace: [-5.5, -5.4, 0, (g) => { const st = M(0xb8aea0, 0.9); box(g, 2.0, 1.4, 0.6, st, 0, 0.7, 0); box(g, 2.3, 0.12, 0.75, M(0x7a4a24), 0, 1.45, 0.05); box(g, 1.1, 0.8, 0.1, M(0x2a1a10), 0, 0.5, 0.26); box(g, 0.8, 0.35, 0.12, M(0xff8a3a, 0.5, { emissive: 0xff6a20, emissiveIntensity: 1.6 }), 0, 0.3, 0.27); box(g, 0.7, 2.5, 0.5, st, 0, 2.7, -0.05); }],
  aquarium: [5.5, -5.2, 0, (g) => { box(g, 1.6, 0.8, 0.6, M(0x2a2a30, 0.5), 0, 0.4, 0); box(g, 1.5, 0.75, 0.5, new THREE.MeshStandardMaterial({ color: 0x6ad0f0, roughness: 0.05, transparent: true, opacity: 0.55, emissive: 0x2a8ab0, emissiveIntensity: 0.4 }), 0, 1.2, 0); for (let i = 0; i < 4; i++) { const f = ball(g, 0.06, M([0xff8a1a, 0xffd23c, 0xe8443a, 0xf0f0f0][i], 0.4), -0.5 + i * 0.32, 1.05 + (i % 2) * 0.25, 0.05); f.scale.set(1.6, 1, 0.6); } box(g, 1.5, 0.08, 0.5, M(0xe0c890), 0, 0.86, 0); }],
  beanbag: [5.3, 2.8, 0, (g) => { const b = ball(g, 0.55, M(0x8a4ad0, 0.95), 0, 0.38, 0); b.scale.set(1.1, 0.7, 1.1); const t = ball(g, 0.35, M(0x8a4ad0, 0.95), 0, 0.62, -0.32); t.scale.set(1.2, 0.8, 0.7); }],
  statue: [-6.5, 4.2, 0, (g) => { const m = M(0xf2ede4, 0.35); box(g, 0.8, 0.9, 0.8, M(0x9a8a7a, 0.6), 0, 0.45, 0); cyl(g, 0.22, 0.3, 1.1, m, 0, 1.45, 0, 12); ball(g, 0.24, m, 0, 2.2, 0); for (const sx of [-1, 1]) { const a = cyl(g, 0.07, 0.07, 0.7, m, sx * 0.3, 1.6, 0, 8); a.rotation.z = sx * 0.4; } }],
  vase: [6.5, 4.5, 0, (g) => { cyl(g, 0.16, 0.24, 0.6, M(0x2f6fd0, 0.3), 0, 0.3, 0, 14); for (let i = 0; i < 6; i++) { cyl(g, 0.01, 0.01, 0.5, M(0x3f8a2a), Math.cos(i) * 0.05, 0.8, Math.sin(i) * 0.05, 4); ball(g, 0.07, M([0xf8a0c0, 0xffd23c, 0xffffff][i % 3], 0.6), Math.cos(i) * 0.12, 1.05 + (i % 2) * 0.06, Math.sin(i) * 0.12); } }],
  palm: [6.6, -3.3, 0, (g) => { cyl(g, 0.3, 0.24, 0.5, M(0xc8643a), 0, 0.25, 0, 12); cyl(g, 0.06, 0.09, 1.6, M(0x8a6a3a), 0, 1.3, 0, 8); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.2, 4), M(0x3f9a3a, 0.8)); l.position.set(Math.cos(i * 0.9) * 0.45, 2.0, Math.sin(i * 0.9) * 0.45); l.rotation.set(Math.sin(i * 0.9) * 1.2, 0, -Math.cos(i * 0.9) * 1.2); g.add(l); } }],
  fridge: [-2.6, 4.6, Math.PI, (g) => { const w = M(0xeef2f4, 0.35); box(g, 0.9, 2.0, 0.75, w, 0, 1.0, 0); box(g, 0.88, 0.02, 0.02, M(0x9aa0a6), 0, 1.3, 0.38); for (const y of [0.8, 1.6]) box(g, 0.04, 0.35, 0.05, M(0x9aa0a6, 0.3, { metalness: 0.7 }), 0.32, y, 0.4); }],
  stove: [-1.3, 4.6, Math.PI, (g) => { box(g, 0.9, 0.9, 0.7, M(0xd8dcdf, 0.4), 0, 0.45, 0); box(g, 0.9, 0.04, 0.7, M(0x222222, 0.3), 0, 0.92, 0); for (const [x, z] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]]) cyl(g, 0.12, 0.12, 0.02, M(0x555555), x, 0.95, z, 14); box(g, 0.6, 0.35, 0.02, M(0x1a1a1a, 0.2), 0, 0.45, 0.36); cyl(g, 0.17, 0.15, 0.18, M(0xc0392b, 0.4), 0.2, 1.04, -0.15, 14); }],
  counter: [0.4, 4.6, Math.PI, (g) => { box(g, 1.8, 0.9, 0.65, M(0x7aa0c0, 0.6), 0, 0.45, 0); box(g, 1.9, 0.06, 0.72, M(0xf0ece4, 0.3), 0, 0.93, 0); box(g, 0.5, 0.05, 0.35, M(0xb88a5a), -0.4, 0.98, 0); ball(g, 0.08, M(0xe2402f, 0.5), 0.4, 1.02, 0); ball(g, 0.08, M(0xffd23c, 0.5), 0.55, 1.02, 0.1); }],
  dining: [4.0, 4.0, 0, (g) => { const w = M(0x7a4a24, 0.6); box(g, 2.4, 0.08, 1.1, w, 0, 0.76, 0); for (const [x, z] of [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]]) box(g, 0.08, 0.74, 0.08, w, x, 0.37, z); for (const x of [-0.7, 0, 0.7]) for (const sz of [-1, 1]) { box(g, 0.45, 0.06, 0.45, w, x, 0.46, sz * 0.85); box(g, 0.45, 0.55, 0.06, w, x, 0.76, sz * 1.06); } cyl(g, 0.18, 0.12, 0.08, M(0xf4efe6, 0.5), 0, 0.84, 0, 14); }],
  nightstand: [-1.6, -2.8, 0, (g) => { box(g, 0.55, 0.6, 0.45, M(0x9a6436), 0, 0.3, 0); box(g, 0.45, 0.02, 0.02, M(0xe2b04a, 0.3), 0, 0.42, 0.23); cyl(g, 0.12, 0.16, 0.3, M(0xfff0c0, 0.6, { emissive: 0xffc060, emissiveIntensity: 0.8 }), 0, 0.85, 0, 12); }],
  teddy: [-1.2, 0.5, 0, (g) => { const b = M(0xb07a44, 0.95); ball(g, 0.24, b, 0, 0.25, 0); ball(g, 0.18, b, 0, 0.62, 0); for (const sx of [-1, 1]) { ball(g, 0.07, b, sx * 0.13, 0.78, 0); ball(g, 0.09, b, sx * 0.2, 0.32, 0.08); } ball(g, 0.06, M(0xe8d0b0), 0, 0.6, 0.15); }],
  toybox: [2.8, 3.8, 0, (g) => { box(g, 0.9, 0.55, 0.6, M(0xe8443a, 0.6), 0, 0.28, 0); box(g, 0.94, 0.08, 0.64, M(0xffd23c, 0.6), 0, 0.6, 0); ball(g, 0.12, M(0x2f8fd0, 0.5), -0.25, 0.7, 0); box(g, 0.18, 0.18, 0.18, M(0x5fb84a, 0.6), 0.2, 0.73, 0.05); }],
  dresser: [5.6, -4.9, 0, (g) => { const w = M(0xf4efe6, 0.6); box(g, 1.3, 0.8, 0.5, w, 0, 0.4, 0); box(g, 1.0, 1.0, 0.05, new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.05, metalness: 0.9 }), 0, 1.4, -0.2); box(g, 1.1, 1.1, 0.04, M(0xe2b04a, 0.35), 0, 1.4, -0.23); bottleish(g); }],
  globe: [5.2, 1.5, 0, (g) => { cyl(g, 0.2, 0.25, 0.06, M(0x7a4a24), 0, 0.03, 0, 14); cyl(g, 0.03, 0.03, 0.9, M(0x7a4a24), 0, 0.48, 0, 6); ball(g, 0.32, M(0x2f8fd0, 0.5), 0, 1.15, 0); const r = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.015, 6, 24), M(0xe2b04a, 0.3, { metalness: 0.7 })); r.position.y = 1.15; r.rotation.y = 0.4; g.add(r); }],
  telescope: [-5.6, -4.4, 0, (g) => { for (let i = 0; i < 3; i++) { const l = cyl(g, 0.025, 0.025, 1.2, M(0x3a2a1a), Math.cos(i * 2.1) * 0.25, 0.55, Math.sin(i * 2.1) * 0.25, 5); l.rotation.set(Math.sin(i * 2.1) * 0.35, 0, -Math.cos(i * 2.1) * 0.35); } const t = cyl(g, 0.09, 0.13, 1.2, M(0xe2b04a, 0.3, { metalness: 0.6 }), 0, 1.3, 0.1, 12); t.rotation.x = -0.9; }],
  trophy: [-3.5, -5.3, 0, (g) => { box(g, 1.3, 2.0, 0.45, M(0x5a3416, 0.6), 0, 1.0, 0); box(g, 1.15, 1.8, 0.02, new THREE.MeshStandardMaterial({ color: 0xdff0ff, roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 1.05, 0.23); for (let k = 0; k < 3; k++) { box(g, 1.15, 0.04, 0.4, M(0x7a4a24), 0, 0.45 + k * 0.55, 0); for (let i = 0; i < 3; i++) { cyl(g, 0.08, 0.04, 0.16, M(0xffcf3a, 0.25, { metalness: 0.8 }), -0.35 + i * 0.35, 0.6 + k * 0.55, 0, 10); cyl(g, 0.03, 0.05, 0.06, M(0xffcf3a, 0.25, { metalness: 0.8 }), -0.35 + i * 0.35, 0.5 + k * 0.55, 0, 8); } } }],
  computer: [5.4, -4.6, 0, (g) => { const w = M(0x2a2a30, 0.5); box(g, 1.4, 0.06, 0.7, M(0xf0ece4, 0.5), 0, 0.75, 0); for (const x of [-0.65, 0.65]) box(g, 0.06, 0.74, 0.65, w, x, 0.37, 0); box(g, 0.9, 0.55, 0.05, w, 0, 1.15, -0.2); box(g, 0.82, 0.47, 0.02, M(0x5fd0a0, 0.3, { emissive: 0x2fa070, emissiveIntensity: 0.8 }), 0, 1.15, -0.17); box(g, 0.6, 0.03, 0.2, w, 0, 0.8, 0.1); box(g, 0.2, 0.45, 0.45, M(0x3a3a44, 0.4, { emissive: 0x4a2ad0, emissiveIntensity: 0.3 }), 0.5, 1.0, -0.05); box(g, 0.5, 0.06, 0.5, M(0x222222), 0, 0.45, 0.75); box(g, 0.5, 0.6, 0.06, M(0x222222), 0, 0.78, 0.98); }],
  chalkboard: [0, -5.6, 0, (g) => { box(g, 2.2, 1.3, 0.06, M(0x2a4a3a, 0.9), 0, 1.6, 0); box(g, 2.35, 1.45, 0.04, M(0x8a5428), 0, 1.6, -0.03); box(g, 2.2, 0.06, 0.12, M(0x8a5428), 0, 0.92, 0.05); box(g, 0.9, 0.04, 0.01, M(0xf4f4f4, 0.9), -0.3, 1.9, 0.035); box(g, 0.6, 0.04, 0.01, M(0xf4f4f4, 0.9), -0.45, 1.7, 0.035); box(g, 0.2, 0.04, 0.04, M(0xffffff), 0.6, 0.97, 0.05); for (const x of [-1.0, 1.0]) box(g, 0.06, 0.95, 0.06, M(0x8a5428), x, 0.47, 0.1); }],
};
function bottleish(g) { for (let i = 0; i < 3; i++) cyl(g, 0.05, 0.06, 0.16, M([0xf8a0c0, 0xb684e8, 0x7fd6ff][i], 0.2), -0.35 + i * 0.2, 0.88, 0.05, 10); }
export const EXTRA_FURNITURE = Object.keys(XTRA);
function extraThings(g, items) {
  for (const id of items) { const x = XTRA[id]; if (!x) continue; const p = new THREE.Group(); x[3](p); p.position.set(x[0], 0, x[1]); p.rotation.y = x[2]; p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(p); }
}

/** kind: 'shop' | 'music' | 'hall' | 'herb' | 'forest' | 'home' (opts.items: what the child bought). Returns { scene, camera, update(dt), dispose() }. */
/** (19/11, the backbone story) the Language Compass pedestal in the hero's home: ten slots, the found pieces glow gold. */
export function compassPedestal(g, pieces, lights) {
  const p = new THREE.Group(), stone = M(0xb8b0a0, 0.85), dark = M(0x4a4440, 0.8);
  cyl(p, 0.32, 0.4, 0.75, stone, 0, 0.375, 0, 12); cyl(p, 0.52, 0.48, 0.1, stone, 0, 0.8, 0, 24);
  for (let i = 0; i < 12; i++) {      // (26/11, turn 63) twelve lands, twelve pieces
    const have = pieces.includes(i + 1), a = i / 12 * Math.PI * 2;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, have ? 0.07 : 0.03, 8, 1, false, a + 0.03, Math.PI * 2 / 12 - 0.06),
      have ? M(0xffcf3a, 0.3, { metalness: 0.6, emissive: 0xffa800, emissiveIntensity: 0.9 }) : dark);
    w.position.y = 0.87; p.add(w);
  }
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 4), M(0xe8443a, 0.4, { emissive: 0x801010, emissiveIntensity: pieces.length ? 0.8 : 0 }));
  needle.rotation.x = Math.PI / 2; needle.position.set(0, 0.95, 0.06); p.add(needle); cyl(p, 0.05, 0.05, 0.06, M(0xffe28a, 0.3), 0, 0.93, 0, 10);
  if (pieces.length) { const l = new THREE.PointLight(0xffc040, 1.4, 3.5); l.position.set(0, 1.3, 0); p.add(l); lights.push(l); }
  p.position.set(2.45, 0, -1.25); p.scale.setScalar(0.85); g.add(p);
}


// ---------------------------------------------------------------- the child's house (20/11; 25/11 twice as big, the villa bigger still)
// Up to three floors joined by wide stairs, four rooms on each floor, open towards the camera like a doll's house. Sizes: core/house.js dims().
export function houseFloor(g, f, h, lights) {
  const { hw, hd } = dims(h), W = hw * 2, D = hd * 2, S = stairOf(h);
  const y0 = f * FLOOR_H, villa = !!h.villa, top = f === h.floors - 1, WH = FLOOR_H - 0.3, CY = FLOOR_H - 0.15;      // WH: the outer walls reach the high ceiling
  const pt = paintOf(h), fc = h.paint && h.paint.floor ? FLOOR_COLORS[pt.floor].hex : villa ? 0xe6dccb : FLOOR_COLORS[pt.floor].hex, shiny = villa || pt.floor === 'marble';      // (21/11) the child's own colours
  const wallCol = h.paint && h.paint.wall ? WALL_COLORS[pt.wall].hex : villa ? 0xf4ecdc : WALL_COLORS[pt.wall].hex, plank = M(fc, shiny ? 0.45 : 0.85), plank2 = M(new THREE.Color(fc).multiplyScalar(0.9).getHex(), shiny ? 0.45 : 0.85);
  const wall = M(wallCol, 0.9), trim = M(villa ? 0xd9b45a : 0x7a4a24, villa ? 0.35 : 0.8, villa ? { metalness: 0.5 } : {}), beam = M(0x5a3416, 0.85), slab = M(0x6a4020, 0.9);
  const fl = new THREE.Group(); fl.position.y = y0; g.add(fl);
  // the floor boards; (25/11) on an upper floor they leave the stairwell of the floor below open, so the way down can be seen and walked
  const hole = f > 0 ? { x0: stairX(f - 1, h) - STAIR_HALF - 0.2, x1: stairX(f - 1, h) + STAIR_HALF + 0.2, z0: S.z1, z1: S.z0 } : null;
  for (let i = 0, n = Math.round(W / 1.2); i < n; i++) {
    const bw = W / n, x = -hw + bw * (i + 0.5), m = i % 2 ? plank : plank2;
    if (hole && x + bw / 2 > hole.x0 && x - bw / 2 < hole.x1) { const back = hole.z0 + hd, front = hd - hole.z1; if (back > 0.05) box(fl, bw, 0.08, back, m, x, 0, -hd + back / 2); if (front > 0.05) box(fl, bw, 0.08, front, m, x, 0, hd - front / 2); }
    else box(fl, bw, 0.08, D + 0.2, m, x, 0, 0);
  }
  if (hole) {      // a balustrade round the stairwell on the upper floor, so nobody steps off the edge by mistake
    const rail = M(villa ? 0xd9b45a : 0x5a3416, villa ? 0.3 : 0.7, villa ? { metalness: 0.6 } : {}), inner = f % 2 === 1 ? hole.x1 : hole.x0, len = hole.z1 - hole.z0;
    box(fl, 0.12, 0.1, len, rail, inner, 1.05, (hole.z0 + hole.z1) / 2); for (let z = hole.z0 + 0.6; z < hole.z1 - 2.6; z += 0.9) cyl(fl, 0.04, 0.04, 1.0, rail, inner, 0.5, z, 6);
  }
  box(fl, W, WH, 0.2, wall, 0, WH / 2, -hd - 0.1); box(fl, 0.2, WH, D, wall, -hw - 0.1, WH / 2, 0); box(fl, 0.2, WH, D, wall, hw + 0.1, WH / 2, 0);
  box(fl, W, 1.0, 0.24, trim, 0, 0.5, -hd + 0.02); box(fl, 0.24, 1.0, D, trim, -hw + 0.02, 0.5, 0); box(fl, 0.24, 1.0, D, trim, hw - 0.02, 0.5, 0);      // wainscot
  // the middle wall reaches the ceiling, with one wide doorway
  const DOOR = 3.6, side = hd - DOOR_HALF;
  box(fl, 0.15, WH, side, wall, 0, WH / 2, -hd + side / 2); box(fl, 0.15, WH, side, wall, 0, WH / 2, hd - side / 2); box(fl, 0.15, WH - DOOR, DOOR_HALF * 2, wall, 0, DOOR + (WH - DOOR) / 2, 0);
  box(fl, 0.2, 0.18, DOOR_HALF * 2 + 0.1, trim, 0, DOOR + 0.04, 0);
  // windows (daylight), two rows under the high ceiling
  const glass = M(0xfff2c0, 0.3, { emissive: 0xffe0a0, emissiveIntensity: 0.9 }), nx = Math.round(W / 4);
  for (let i = 0; i < nx; i++) { const x = -hw + (W / nx) * (i + 0.5); box(fl, 1.6, 1.4, 0.08, glass, x, 2.2, -hd + 0.05); box(fl, 1.75, 0.1, 0.16, trim, x, 1.46, -hd + 0.1); box(fl, 1.6, 1.8, 0.08, glass, x, WH * 0.7, -hd + 0.05); }
  for (let i = 0, nz = Math.round(D / 5); i < nz; i++) for (const sx of [-1, 1]) { const z = -hd + (D / nz) * (i + 0.5); if (sx === (f % 2 === 0 ? -1 : 1) && z > S.z1 && z < S.z0) continue; box(fl, 0.08, 1.4, 1.6, glass, sx * (hw - 0.05), 2.2, z); }
  // the ceiling slab (the next floor's underside) with the stairwell open over this floor's stairs
  const sxS = stairX(f, h), hx0 = sxS - STAIR_HALF - 0.2, hx1 = sxS + STAIR_HALF + 0.2;
  if (!top) {
    box(fl, hx0 + hw, 0.3, D, slab, (-hw + hx0) / 2, CY, 0); box(fl, hw - hx1, 0.3, D, slab, (hx1 + hw) / 2, CY, 0);
    const back = S.z1 + hd, front = hd - S.z0; box(fl, hx1 - hx0, 0.3, back, slab, (hx0 + hx1) / 2, CY, -hd + back / 2); box(fl, hx1 - hx0, 0.3, front, slab, (hx0 + hx1) / 2, CY, hd - front / 2);
    // (25/11) the stairs: 3 m wide, gentle, with a carpet runner, nosings, a balustrade on both sides and newel posts (gold in a villa)
    const wood = M(villa ? 0xf0ece4 : 0xa8743f, villa ? 0.35 : 0.8), wood2 = M(villa ? 0xe2dccf : 0xb98450, villa ? 0.35 : 0.8), carpet = M(villa ? 0x8a1f2a : 0xb8463a, 0.95), nose = M(villa ? 0xd9b45a : 0x6a4020, villa ? 0.3 : 0.7, villa ? { metalness: 0.6 } : {});
    const N = Math.round(FLOOR_H / 0.2), run = (S.z0 - S.z1) / N, wSt = STAIR_HALF * 2;
    for (let i = 0; i < N; i++) {
      const hgt = (i + 1) * (FLOOR_H / N), z = S.z0 - run / 2 - i * run;
      box(fl, wSt, hgt, run, i % 2 ? wood : wood2, sxS, hgt / 2, z); box(fl, wSt * 0.62, 0.02, run + 0.01, carpet, sxS, hgt + 0.01, z); box(fl, wSt, 0.05, 0.06, nose, sxS, hgt - 0.01, z + run / 2);
    }
    const railM = M(villa ? 0xd9b45a : 0x3a2410, villa ? 0.3 : 0.7, villa ? { metalness: 0.6 } : {}), span = S.z0 - S.z1, ang = Math.atan2(FLOOR_H, span), L = Math.hypot(span, FLOOR_H);
    for (const rx of [sxS - STAIR_HALF + 0.08, sxS + STAIR_HALF - 0.08]) {
      for (let i = 0; i <= N; i += 3) cyl(fl, 0.03, 0.03, 0.95, railM, rx, (i + 1) * (FLOOR_H / N) + 0.47, S.z0 - run / 2 - i * run, 6);
      const r = box(fl, 0.09, 0.09, L, railM, rx, FLOOR_H / 2 + 0.95, (S.z0 + S.z1) / 2); r.rotation.x = ang;
      cyl(fl, 0.11, 0.13, 1.25, railM, rx, 0.62, S.z0 - 0.05, 8); ball(fl, 0.13, railM, rx, 1.32, S.z0 - 0.05);      // newel post at the foot
    }
  }
  if (top) { box(fl, W + 0.3, 0.2, D + 0.3, slab, 0, CY, 0); for (let i = 0; i < nx; i++) box(fl, 0.25, 0.25, D, beam, -hw + (W / nx) * (i + 0.5), CY - 0.2, 0); }
  // a lantern over each room, one real light per half floor (more would slow the shaders)
  for (const [cx, cz] of cellsOf(h)) { cyl(fl, 0.01, 0.01, CY - 3.0, M(0x333333), cx, (CY + 3.0) / 2, cz, 4); ball(fl, 0.2, M(0xffd27a, 0.4, { emissive: 0xffb040, emissiveIntensity: 1.6 }), cx, 2.85, cz); }
  for (const x of [-hw / 2, hw / 2]) { const l = new THREE.PointLight(0xfff0dc, 22, hd * 2.6, 1.3); l.position.set(x, y0 + 3.2, 0); g.add(l); lights.push(l); }      // whiter, so the chosen wall colour shows
  if (villa) {      // stone columns along the open front edge, golden chandeliers
    for (let i = 0, n = 6; i < n; i++) { const x = -hw + 0.3 + (W - 0.6) * i / (n - 1); cyl(fl, 0.3, 0.36, WH - 0.1, M(0xf0ece4, 0.4), x, (WH - 0.1) / 2, hd - 0.3, 16); cyl(fl, 0.46, 0.46, 0.14, M(0xd9b45a, 0.35, { metalness: 0.5 }), x, WH - 0.07, hd - 0.3, 16); cyl(fl, 0.46, 0.5, 0.2, M(0xd9b45a, 0.35, { metalness: 0.5 }), x, 0.1, hd - 0.3, 16); }
    for (const cx of [-hw / 2, hw / 2]) {
      const ch = new THREE.Group(), gl = M(0xffe6a0, 0.3, { emissive: 0xffc860, emissiveIntensity: 1.5 }), gold = M(0xd9b45a, 0.3, { metalness: 0.7 });
      ball(ch, 0.34, gl, 0, 0, 0); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 6, 28), gold); ring.rotation.x = Math.PI / 2; ring.position.y = -0.15; ch.add(ring);
      for (let i = 0; i < 8; i++) ball(ch, 0.11, gl, Math.cos(i * 0.785) * 0.75, -0.05, Math.sin(i * 0.785) * 0.75);
      const chY = Math.min(7, CY - 1.4); cyl(ch, 0.015, 0.015, CY - chY, M(0x333333), 0, (CY - chY) / 2 + 0.2, 0, 4); ch.position.set(cx, chY, 0); fl.add(ch);
    }
  }
  return fl;
}
function buildHome(opts) {
  const h = { floors: 1, villa: false, garden: 0, ...(opts.house || {}) }, items = opts.items || [], plan = floorPlan(h);
  const scene = new THREE.Scene(), g = new THREE.Group(), lights = []; scene.add(g);
  scene.background = new THREE.Color(0x2a1a10);
  scene.add(new THREE.HemisphereLight(0xfff0d0, 0x5a3a20, 1.3));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.1); sun.position.set(-3, 8, 12); scene.add(sun);
  const CELLS = cellsOf(h);
  for (let f = 0; f < h.floors; f++) houseFloor(g, f, h, lights);
  const where = roomOf(h);
  for (const [grp, ids] of Object.entries(GROUPS)) { const [f, k] = where[grp], mine = ids.filter((id) => items.includes(id)); if (!mine.length) continue; const cell = new THREE.Group(); cell.position.set(CELLS[k][0], f * FLOOR_H, CELLS[k][1]); g.add(cell); homeThings(cell, mine, lights, opts.model); }
  { const [f, k] = where.living, cell = new THREE.Group(); cell.position.set(CELLS[k][0], f * FLOOR_H, CELLS[k][1]); g.add(cell); compassPedestal(cell, opts.pieces || [], lights); }
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 90), N = h.floors, top = FLOOR_H * N;
  let t = 0;
  return {
    scene, camera,
    update(dt, aspect) {
      t += dt; if (Math.abs(camera.aspect - aspect) > 1e-3) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
      camera.position.set(2 + Math.sin(t * 0.15) * 0.8, 4.2 + top * 0.55 + Math.sin(t * 0.2) * 0.1, dims(h).hd * 1.9 + 8 + N * 3.2); camera.lookAt(2.2, top * 0.42 + 0.6, -1);
      for (const l of lights) if (l.isPointLight && l.userData.base === undefined) l.userData.base = l.intensity;
      for (const l of lights) if (l.isPointLight) l.intensity = (l.userData.base || 6) * (1 + Math.sin(t * 7 + l.position.x) * 0.03);
    },
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); }); },
  };
}
export function buildRoom(kind, opts = {}) {
  if (kind === 'home') return opts.avatar ? buildHomeWalk(opts) : buildHome(opts);      // (21/11) the hero walks inside
  const scene = new THREE.Scene(), g = new THREE.Group(), lights = []; scene.add(g);
  scene.background = new THREE.Color(0x2a1a10);
  scene.add(new THREE.HemisphereLight(0xfff0d0, 0x5a3a20, 1.1));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.2); sun.position.set(-2, 5, 4); scene.add(sun);
  const look = { home: [0xf2e6d0, 0xc08a50], shop: [0xe8d2a8, 0xb07a44], music: [0xd8c8f0, 0x9a6a44], hall: [0xd8e0f0, 0xa0703c], herb: [0xd8ecc8, 0xa87a48], forest: [0xd0e8c0, 0x8a6a40] }[kind] || [0xe8d2a8, 0xb07a44];
  shell(g, ...look, kind !== 'home'); lantern(g, -1.6, 0, lights); lantern(g, 1.6, 0, lights);
  if (kind === 'home') homeThings(g, opts.items || [], lights, opts.model);
  if (kind === 'home') compassPedestal(g, opts.pieces || [], lights);
  if (kind === 'shop' || kind === 'forest') {
    box(g, 3.6, 1.0, 0.8, M(0x7a4a24), 0, 0.5, 1.6); box(g, 3.8, 0.08, 0.95, M(0x9a6030), 0, 1.02, 1.6);       // counter
    for (let i = 0; i < 4; i++) bread(g, -1.2 + i * 0.8, 1.06, 1.6);
    shelfWall(g, -2.2, -2.7, 0, (s) => { for (let i = 0; i < 4; i++) { sword(s, -0.9 + i * 0.6, 1.62, 0.05, [0xb98a4a, 0xc8ced6, 0x7fd6ff, 0xbfd8ff][i]); } for (let i = 0; i < 3; i++) shield(s, -0.7 + i * 0.7, 0.92, 0.05, [0xb8c0ca, 0x8a5228, 0x3f7a3a][i]); for (let i = 0; i < 5; i++) bottle(s, -0.9 + i * 0.45, 0.25, 0.05, [0xe8443a, 0x2f8fd0, 0x5fb84a, 0xe8b030, 0xb684e8][i]); });
    shelfWall(g, 2.2, -2.7, 0, (s) => { for (let i = 0; i < 5; i++) bread(s, -0.9 + i * 0.45, 1.62, 0.05); for (let i = 0; i < 4; i++) pot(s, -0.8 + i * 0.55, 0.92, 0.05, 0.7); for (let i = 0; i < 3; i++) box(s, 0.5, 0.35, 0.35, M(0x8a5a2a), -0.7 + i * 0.7, 0.42, 0.05); });
    box(g, 0.6, 0.6, 0.6, M(0x8a5a2a), -3.3, 0.3, 1.8); box(g, 0.5, 0.5, 0.5, M(0x7a4a24), -3.2, 0.85, 1.8, 0.4);
    cyl(g, 0.3, 0.32, 0.8, M(0x7a4a24), 3.3, 0.4, 1.6); // barrel
    if (kind === 'forest') for (const x of [-3.4, 3.4]) pot(g, x, 0, -2.4, 1.6);
  }
  if (kind === 'music') {
    box(g, 2.2, 0.9, 0.7, M(0x1c1c22, 0.4), -1.6, 0.45, -2.3); box(g, 2.0, 0.06, 0.25, M(0xf6f2ea, 0.5), -1.6, 0.93, -2.0);      // piano
    for (let i = 0; i < 14; i++) box(g, 0.07, 0.04, 0.14, M(0x111111), -2.45 + i * 0.13 + (i % 7 === 2 || i % 7 === 6 ? 99 : 0), 0.97, -2.04);
    box(g, 2.2, 1.0, 0.1, M(0x1c1c22, 0.4), -1.6, 1.4, -2.62);
    const gt = new THREE.Group(), gb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), M(0xd08a3a, 0.5)); gb.scale.set(1, 1.2, 0.35); gt.add(gb);      // guitar
    box(gt, 0.08, 0.8, 0.05, M(0x5a3416), 0, 0.65, 0); gt.position.set(2.6, 1.0, -2.4); gt.rotation.z = 0.15; g.add(gt);
    cyl(g, 0.35, 0.35, 0.5, M(0xc0392b, 0.5), 1.4, 0.25, -2.2, 20); cyl(g, 0.36, 0.36, 0.04, M(0xf2ead2, 0.6), 1.4, 0.52, -2.2, 20);      // drum
    for (let i = 0; i < 4; i++) { const n = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 16), M([0x8a4ad0, 0xe8443a, 0x2f6fd0, 0x2e9a5a][i], 0.5, { emissive: [0x8a4ad0, 0xe8443a, 0x2f6fd0, 0x2e9a5a][i], emissiveIntensity: 0.5 })); n.position.set(-3.0 + i * 2, 2.9, -2.9); n.userData.float = i; g.add(n); }
    for (const x of [-3.2, 3.2]) cyl(g, 0.25, 0.3, 0.9, M(0x3a2a6a, 0.6), x, 0.45, 1.6);      // speakers
    const stage = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), M(0x6a4aa0, 0.6)); stage.rotation.x = -Math.PI / 2; stage.position.set(0, 0.06, 0.6); g.add(stage);
  }
  if (kind === 'hall') {
    bookshelf(g, -2.6, -2.75, 0); bookshelf(g, 2.6, -2.75, 0);
    box(g, 2.2, 0.08, 1.1, M(0x7a4a24), 0, 0.9, -0.6); for (const [x, z] of [[-1, -1.05], [1, -1.05], [-1, -0.15], [1, -0.15]]) box(g, 0.1, 0.9, 0.1, M(0x5a3416), x, 0.45, z);    // desk
    ball(g, 0.22, M(0x2f8fd0, 0.5), 0.6, 1.25, -0.7); cyl(g, 0.02, 0.06, 0.2, M(0xc9a24a), 0.6, 1.0, -0.7, 8);        // globe
    box(g, 0.5, 0.06, 0.35, M(0xf6ead0), -0.5, 0.96, -0.6); bottle(g, -0.1, 0.94, -0.8, 0x2a2a2a);
    box(g, 2.0, 1.2, 0.05, M(0xe8d8a8), 0, 2.2, -2.95); box(g, 1.8, 1.0, 0.06, M(0x8fbf6a), 0, 2.2, -2.93);      // map on the wall
    box(g, 1.4, 1.1, 0.5, M(0x8a8a8a, 0.9), -3.6, 0.55, 1.2, Math.PI / 2); box(g, 0.9, 0.6, 0.3, M(0xff8a3a, 0.5, { emissive: 0xff6a20, emissiveIntensity: 1.2 }), -3.45, 0.45, 1.2, Math.PI / 2);   // fireplace
  }
  if (kind === 'herb') {
    for (let i = 0; i < 6; i++) pot(g, -3.3 + (i % 2) * 6.6, 0, -2.4 + Math.floor(i / 2) * 1.6, 1.4);
    shelfWall(g, 0, -2.7, 0, (s) => { for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) bottle(s, -1.0 + i * 0.4, 0.25 + k * 0.7, 0.05, [0x5fb84a, 0x2f8fd0, 0xe8443a, 0xe8b030, 0xb684e8, 0x3fd0c0][(i + k) % 6]); });
    for (let i = 0; i < 5; i++) { cyl(g, 0.01, 0.01, 0.4, M(0x6a4a2a), -1.6 + i * 0.8, 3.0, 1.2, 4); ball(g, 0.14, M(0x6cc044, 0.9), -1.6 + i * 0.8, 2.75, 1.2); }   // drying herbs
    box(g, 1.6, 0.8, 0.8, M(0x7a4a24), 0, 0.4, 1.6); pot(g, -0.4, 0.8, 1.6, 0.8); bottle(g, 0.4, 0.8, 1.6, 0x5fb84a);
  }
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  let t = 0;
  return {
    scene, camera,
    update(dt, aspect) {
      t += dt; if (Math.abs(camera.aspect - aspect) > 1e-3) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
      camera.position.set(-1.2 + Math.sin(t * 0.15) * 0.6, 2.1 + Math.sin(t * 0.2) * 0.1, 5.4); camera.lookAt(-0.6, 1.2, -0.8);     // the left part of the screen shows the room
      for (const l of lights) l.intensity = 6 + Math.sin(t * 7 + l.position.x) * 0.4;
      g.traverse((o) => { if (o.userData.float !== undefined) o.position.y = 2.9 + Math.sin(t * 2 + o.userData.float) * 0.12; });
    },
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); }); },
  };
}
