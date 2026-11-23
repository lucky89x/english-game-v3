// House interiors (18/11: "go inside the houses, with a nice room inside"). When Ngọc enters a house the game draws
// one of these rooms instead of the village, with the shop / music / quest window docked on the right. Rooms are
// built from simple shapes in the game's warm palette: plank floor, panelled walls, beams, glowing windows and
// lanterns, a rug, and furniture for each house. The camera drifts slowly so the room feels alive.
import * as THREE from 'three';
import { GROUPS, floorPlan, paintOf, WALL_COLORS, FLOOR_COLORS, FLOOR_H, PARTITION_H, STAIR } from '../core/house.js';
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
}

/** kind: 'shop' | 'music' | 'hall' | 'herb' | 'forest' | 'home' (opts.items: what the child bought). Returns { scene, camera, update(dt), dispose() }. */
/** (19/11, the backbone story) the Language Compass pedestal in the hero's home: ten slots, the found pieces glow gold. */
export function compassPedestal(g, pieces, lights) {
  const p = new THREE.Group(), stone = M(0xb8b0a0, 0.85), dark = M(0x4a4440, 0.8);
  cyl(p, 0.32, 0.4, 0.75, stone, 0, 0.375, 0, 12); cyl(p, 0.52, 0.48, 0.1, stone, 0, 0.8, 0, 24);
  for (let i = 0; i < 10; i++) {
    const have = pieces.includes(i + 1), a = i / 10 * Math.PI * 2;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, have ? 0.07 : 0.03, 8, 1, false, a + 0.03, Math.PI * 2 / 10 - 0.06),
      have ? M(0xffcf3a, 0.3, { metalness: 0.6, emissive: 0xffa800, emissiveIntensity: 0.9 }) : dark);
    w.position.y = 0.87; p.add(w);
  }
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 4), M(0xe8443a, 0.4, { emissive: 0x801010, emissiveIntensity: pieces.length ? 0.8 : 0 }));
  needle.rotation.x = Math.PI / 2; needle.position.set(0, 0.95, 0.06); p.add(needle); cyl(p, 0.05, 0.05, 0.06, M(0xffe28a, 0.3), 0, 0.93, 0, 10);
  if (pieces.length) { const l = new THREE.PointLight(0xffc040, 1.4, 3.5); l.position.set(0, 1.3, 0); p.add(l); lights.push(l); }
  p.position.set(2.45, 0, -1.25); p.scale.setScalar(0.85); g.add(p);
}


// ---------------------------------------------------------------- the child's house (20/11): 16 x 12 m per floor (four times the old room),
// up to three floors of the same size joined by stairs, four rooms on each floor. Open towards the camera like a doll's house.
export function houseFloor(g, f, h, lights) {
  const y0 = f * FLOOR_H, W = 16, D = 12, villa = !!h.villa, top = f === h.floors - 1, WH = FLOOR_H - 0.3, CY = FLOOR_H - 0.15, PH = PARTITION_H;      // (24/11) WH: the outer walls reach the (three times higher) ceiling, PH: the partitions stay low
  const pt = paintOf(h), fc = h.paint && h.paint.floor ? FLOOR_COLORS[pt.floor].hex : villa ? 0xe6dccb : FLOOR_COLORS[pt.floor].hex, shiny = villa || pt.floor === 'marble';      // (21/11) the child's own colours
  const wallCol = h.paint && h.paint.wall ? WALL_COLORS[pt.wall].hex : villa ? 0xf4ecdc : WALL_COLORS[pt.wall].hex, plank = M(fc, shiny ? 0.45 : 0.85), plank2 = M(new THREE.Color(fc).multiplyScalar(0.9).getHex(), shiny ? 0.45 : 0.85);
  const wall = M(wallCol, 0.9), trim = M(villa ? 0xd9b45a : 0x7a4a24, villa ? 0.35 : 0.8, villa ? { metalness: 0.5 } : {}), beam = M(0x5a3416, 0.85), slab = M(0x6a4020, 0.9);
  const fl = new THREE.Group(); fl.position.y = y0; g.add(fl);
  for (let i = 0; i < 16; i++) box(fl, 1.0, 0.08, D + 0.2, i % 2 ? plank : plank2, -7.5 + i, 0, 0);      // the floor boards
  box(fl, W, WH, 0.2, wall, 0, WH / 2, -D / 2 - 0.1); box(fl, 0.2, WH, D, wall, -W / 2 - 0.1, WH / 2, 0); box(fl, 0.2, WH, D, wall, W / 2 + 0.1, WH / 2, 0);
  box(fl, W, 1.0, 0.24, trim, 0, 0.5, -D / 2 + 0.02); box(fl, 0.24, 1.0, D, trim, -W / 2 + 0.02, 0.5, 0); box(fl, 0.24, 1.0, D, trim, W / 2 - 0.02, 0.5, 0);      // wainscot
  // partitions: a full wall at x = 0 with a doorway, a low wall at z = 0 with gaps
  box(fl, 0.15, PH, 4.8, wall, 0, PH / 2, -3.6); box(fl, 0.15, PH, 4.8, wall, 0, PH / 2, 3.6); box(fl, 0.15, 1.0, 2.4, wall, 0, PH - 0.5, 0);
  for (const [x0, x1] of [[-8, -5.4], [-2.6, 2.6], [5.4, 8]]) box(fl, x1 - x0, 1.0, 0.15, trim, (x0 + x1) / 2, 0.5, 0);
  // windows (daylight)
  const glass = M(0xfff2c0, 0.3, { emissive: 0xffe0a0, emissiveIntensity: 0.9 });
  for (const x of [-6, -2, 2, 6]) { box(fl, 1.5, 1.3, 0.08, glass, x, 2.1, -D / 2 + 0.05); box(fl, 1.65, 0.1, 0.16, trim, x, 1.42, -D / 2 + 0.1); }
  for (const z of [-3, 3]) for (const sx of [-1, 1]) box(fl, 0.08, 1.3, 1.5, glass, sx * (W / 2 - 0.05), 2.1, z);
  for (const x of [-6, -2, 2, 6]) box(fl, 1.5, 1.6, 0.08, glass, x, WH * 0.72, -D / 2 + 0.05);      // a second row of tall windows under the high ceiling
  // the ceiling slab (the next floor's boards) with a stairwell hole on the side of this floor's stairs
  if (!top) {
    const left = f % 2 === 0, hx0 = left ? -8 : 6.4, hx1 = left ? -6.4 : 8;
    box(fl, W - (hx1 - hx0), 0.3, D, slab, left ? (hx1 + 8) / 2 : (-8 + hx0) / 2, CY, 0);
    const e0 = (D / 2 + STAIR.z1) / 2, e1 = (D / 2 - STAIR.z0) / 2;      // the strips of slab in front of and behind the stairwell, which runs the whole length of the stairs
    box(fl, hx1 - hx0, 0.3, e0, slab, (hx0 + hx1) / 2, CY, -D / 2 + e0 / 2); box(fl, hx1 - hx0, 0.3, e1, slab, (hx0 + hx1) / 2, CY, D / 2 - e1 / 2);
    // the stairs: solid steps from the front (low) to the back (high) along the wall, with a handrail
    const sx = left ? -7.2 : 7.2, wood = M(0xa8743f, 0.85), wood2 = M(0xb98450, 0.85), N = Math.round(FLOOR_H / 0.25), run = (STAIR.z0 - STAIR.z1) / N;
    for (let i = 0; i < N; i++) { const hgt = (i + 1) * (FLOOR_H / N); box(fl, 1.3, hgt, run, i % 2 ? wood : wood2, sx, hgt / 2, STAIR.z0 - run / 2 - i * run); }
    const rx = left ? -6.45 : 6.45, span = STAIR.z0 - STAIR.z1;
    for (let i = 0; i <= N; i += 8) cyl(fl, 0.035, 0.035, 0.9, M(0x3a2410), rx, (i + 1) * (FLOOR_H / N) + 0.45, STAIR.z0 - run / 2 - i * run, 6);
    const rail = box(fl, 0.06, 0.06, Math.hypot(span, FLOOR_H), M(0x3a2410), rx, FLOOR_H / 2 + 0.9, (STAIR.z0 + STAIR.z1) / 2); rail.rotation.x = Math.atan2(FLOOR_H, span);
  }
  if (top) { box(fl, W + 0.3, 0.2, D + 0.3, slab, 0, CY, 0); for (const x of [-6, -2, 2, 6]) box(fl, 0.25, 0.25, D, beam, x, CY - 0.2, 0); }
  // a lantern on each room, one real light per floor (more would slow the shaders)
  for (const cx of [-4, 4]) for (const cz of [-3, 3]) { cyl(fl, 0.01, 0.01, CY - 3.0, M(0x333333), cx, (CY + 3.0) / 2, cz, 4); ball(fl, 0.16, M(0xffd27a, 0.4, { emissive: 0xffb040, emissiveIntensity: 1.6 }), cx, 2.85, cz); }
  for (const x of [-4, 4]) { const l = new THREE.PointLight(0xfff0dc, 13, 15, 1.4); l.position.set(x, y0 + 2.7, 0); g.add(l); lights.push(l); }      // (21/11) whiter, so the chosen wall colour shows
  if (villa) {      // stone columns on the open front edge, a golden chandelier
    for (const x of [-7.7, -3, 3, 7.7]) { cyl(fl, 0.22, 0.26, WH - 0.1, M(0xf0ece4, 0.4), x, (WH - 0.1) / 2, D / 2 - 0.2, 14); cyl(fl, 0.34, 0.34, 0.12, M(0xd9b45a, 0.35, { metalness: 0.5 }), x, WH - 0.06, D / 2 - 0.2, 14); }
    const ch = new THREE.Group(); ball(ch, 0.28, M(0xffe6a0, 0.3, { emissive: 0xffc860, emissiveIntensity: 1.5 }), 0, 0, 0); for (let i = 0; i < 6; i++) ball(ch, 0.1, M(0xffe6a0, 0.3, { emissive: 0xffc860, emissiveIntensity: 1.5 }), Math.cos(i * 1.05) * 0.5, -0.1, Math.sin(i * 1.05) * 0.5);
    const chY = Math.min(6, CY - 1.2); cyl(ch, 0.012, 0.012, CY - chY, M(0x333333), 0, (CY - chY) / 2 + 0.2, 0, 4); ch.position.set(0, chY, 0.6); fl.add(ch);
  }
  return fl;
}
function buildHome(opts) {
  const h = { floors: 1, villa: false, garden: 0, ...(opts.house || {}) }, items = opts.items || [], plan = floorPlan(h);
  const scene = new THREE.Scene(), g = new THREE.Group(), lights = []; scene.add(g);
  scene.background = new THREE.Color(0x2a1a10);
  scene.add(new THREE.HemisphereLight(0xfff0d0, 0x5a3a20, 1.3));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.1); sun.position.set(-3, 8, 12); scene.add(sun);
  const CELLS = [[-4, -2.9], [4, -2.9], [-4, 3.1], [4, 3.1]];
  for (let f = 0; f < h.floors; f++) {
    houseFloor(g, f, h, lights);
    plan[f].forEach((room, k) => {
      if (!room) return; const cell = new THREE.Group(); cell.position.set(CELLS[k][0], f * FLOOR_H, CELLS[k][1]); g.add(cell);
      const mine = (GROUPS[room] || []).filter((id) => items.includes(id)); if (mine.length) homeThings(cell, mine, lights, opts.model);
      if (room === 'living') compassPedestal(cell, opts.pieces || [], lights);
    });
  }
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 90), N = h.floors, top = FLOOR_H * N;
  let t = 0;
  return {
    scene, camera,
    update(dt, aspect) {
      t += dt; if (Math.abs(camera.aspect - aspect) > 1e-3) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
      camera.position.set(2 + Math.sin(t * 0.15) * 0.8, 4.2 + top * 0.55 + Math.sin(t * 0.2) * 0.1, 19.5 + N * 3.2); camera.lookAt(2.2, top * 0.42 + 0.6, -1);
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
