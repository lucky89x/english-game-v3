// The villa of a child's home as a little fairy-tale castle (25/11, from the user's reference picture): a grey stone plinth with arches, a
// grand stair with a red carpet edged in gold, an arched gate with a wooden double door and gold rings, wall lanterns, a red banner with a
// gold lily over the gate and blue ones beside it, crenellated cream walls, a central keep with a steep blue roof, dormers and two small
// spires, two round blue-roofed towers behind, two round front towers with open red-roofed lantern pavilions, a little half-timbered
// cottage, a blue-domed gazebo, flower boxes, potted flowers and ivy. Built from simple shapes; the plain ones are baked into one mesh.
import * as THREE from 'three';
import { bake } from './common.js';

const Mx = (c, r = 0.75, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
let bannerTex = null;
/** A hanging banner with a gold border and a gold lily (red or blue), drawn once on a canvas. */
function banner(color) {
  bannerTex = bannerTex || {};
  if (!bannerTex[color]) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const c = cv.getContext('2d');
    c.fillStyle = color; c.beginPath(); c.moveTo(6, 6); c.lineTo(122, 6); c.lineTo(122, 200); c.lineTo(64, 250); c.lineTo(6, 200); c.closePath(); c.fill();
    c.lineWidth = 7; c.strokeStyle = '#e8b830'; c.stroke();
    c.fillStyle = '#f2c640'; c.save(); c.translate(64, 112);      // the lily: a middle petal, two curled side petals, a band, a foot
    c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(16, -24, 12, -4, 0, 10); c.bezierCurveTo(-12, -4, -16, -24, 0, -46); c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 4, 6); c.bezierCurveTo(s * 40, -6, s * 40, -40, s * 18, -30); c.bezierCurveTo(s * 30, -18, s * 22, 0, s * 4, 14); c.fill(); }
    c.fillRect(-22, 10, 44, 9); c.beginPath(); c.moveTo(-10, 19); c.lineTo(10, 19); c.lineTo(0, 40); c.fill(); c.restore();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; bannerTex[color] = t;
  }
  return new THREE.MeshStandardMaterial({ map: bannerTex[color], transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
}

/** Where the door and the name board are (the same in the Blender castle bld_castle_villa_f2/f3.glb): the board's height, the door's depth. */
export const CASTLE_DOOR = { signY: 1.0 + 3.0 + 0.35, doorZ: 2.3 + 0.06 + 0.4 };
/** floors: 2 or 3. Returns { g, signY, doorZ } with the front facing +z (homes.js turns it to face the street). */
export function castleVilla(floors = 2) {
  const g = new THREE.Group(), st = new THREE.Group(), S = 3.4, n = Math.max(2, floors), P = 1.0, H = n * S, TOP = P + H;
  const stone = Mx(0xece2cf, 0.85), stone2 = Mx(0xddd1bb, 0.85), grey = Mx(0xa9a4a8, 0.9), grey2 = Mx(0x8e8a90, 0.9), dark = Mx(0x4a4048, 0.9);
  const blue = Mx(0x3b5fc8, 0.55), red = Mx(0xd0483c, 0.6), gold = Mx(0xe2b23a, 0.3, { metalness: 0.7 }), wood = Mx(0x8a5530, 0.7), wood2 = Mx(0x5e3a20, 0.7), leaf = Mx(0x4f9a3a, 0.9), pink = Mx(0xf08ab0, 0.7), white = Mx(0xfbf6ee, 0.6);
  const glow = Mx(0xffd27a, 0.4, { emissive: 0xffb040, emissiveIntensity: 1.1 });
  const B = (w, h, d, m, x, y, z, p = st) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  const C = (r1, r2, h, m, x, y, z, seg = 18, p = st) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  const K = (r, h, m, x, y, z, seg = 18, rot = 0, p = st) => { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m); o.position.set(x, y, z); o.rotation.y = rot; o.castShadow = true; p.add(o); return o; };
  const ball = (r, m, x, y, z, p = st) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); o.position.set(x, y, z); p.add(o); return o; };
  /** An arched window facing +z (or turned by ry), glowing warm, with a stone frame and a flower box. */
  const win = (x, y, z, w = 0.8, h = 1.2, ry = 0, flowers = true) => {
    const q = new THREE.Group(); q.position.set(x, y, z); q.rotation.y = ry; g.add(q);
    B(w, h, 0.08, glow, 0, 0, 0, q); const top = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 14, 0, Math.PI), glow); top.position.set(0, h / 2, 0.041); q.add(top); const rim = new THREE.Mesh(new THREE.TorusGeometry(w / 2 + 0.04, 0.06, 6, 14, Math.PI), stone2); rim.position.set(0, h / 2, 0.05); q.add(rim);
    B(w + 0.18, 0.12, 0.2, stone2, 0, -h / 2 - 0.06, 0.06, q); B(0.08, h, 0.12, wood2, 0, 0, 0.05, q); B(w, 0.06, 0.12, wood2, 0, 0.1, 0.05, q);
    if (flowers) { B(w + 0.1, 0.18, 0.25, wood, 0, -h / 2 - 0.2, 0.18, q); for (let i = 0; i < 4; i++) ball(0.09, i % 2 ? pink : leaf, -w / 2 + 0.12 + i * (w - 0.24) / 3, -h / 2 - 0.05, 0.2, q); }
    return q;
  };
  /** A row of merlons (battlements) from (x0, z0) to (x1, z1) at height y. */
  const merlons = (x0, z0, x1, z1, y, m = stone) => { const L = Math.hypot(x1 - x0, z1 - z0), k = Math.max(2, Math.round(L / 0.75)); for (let i = 0; i <= k; i += 2) { const t = i / k; B(0.42, 0.5, 0.42, m, x0 + (x1 - x0) * t, y + 0.25, z0 + (z1 - z0) * t); } };
  const ringMerlons = (x, z, r, y, m = stone) => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; if (i % 2) continue; const o = B(0.4, 0.45, 0.32, m, x + Math.cos(a) * r, y + 0.22, z + Math.sin(a) * r); o.rotation.y = -a; } };
  const flag = (x, y, z, col = 0xe8443a) => { C(0.035, 0.035, 1.3, gold, x, y + 0.65, z, 6); ball(0.1, gold, x, y + 1.35, z); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.42), Mx(col, 0.7, { side: THREE.DoubleSide })); f.position.set(x + 0.52, y + 1.08, z); g.add(f); };
  const ivy = (x, y, z, h) => { for (let i = 0; i < h * 3; i++) ball(0.12 + (i % 3) * 0.03, leaf, x + Math.sin(i * 1.7) * 0.18, y + i * 0.32, z); };

  // ---- the plinth: grey stone with arches all round, a terrace on top with a white balustrade
  const PW = 10.4, PZ0 = -3.4, PZ1 = 3.0, PD = PZ1 - PZ0;
  B(PW, P, PD, grey, 0, P / 2, (PZ0 + PZ1) / 2); B(PW + 0.2, 0.14, PD + 0.2, grey2, 0, P, (PZ0 + PZ1) / 2);
  for (let i = 0; i < 6; i++) { const x = -PW / 2 + 0.9 + i * (PW - 1.8) / 5; if (Math.abs(x) < 1.8) continue; B(0.7, 0.55, 0.06, dark, x, 0.4, PZ1 + 0.02); }
  for (const x of [-PW / 2 + 0.3, PW / 2 - 0.3]) for (let z = PZ0 + 0.6; z < PZ1 - 0.4; z += 1.3) { B(0.42, 0.42, 0.42, white, x, P + 0.3, z); }
  for (const x of [-1, 1]) { B((PW / 2 - 1.8), 0.1, 0.18, white, x * (1.8 + (PW / 2 - 1.8) / 2), P + 0.62, PZ1 - 0.12); for (let k = 0; k < 6; k++) C(0.06, 0.06, 0.5, white, x * (2.0 + k * 0.55), P + 0.3, PZ1 - 0.12, 6); }
  // ---- the grand stair with a red carpet edged in gold, lamp posts at the foot
  const SN = 5, SZ0 = PZ1, SZ1 = PZ1 + 1.7, run = (SZ1 - SZ0) / SN;
  for (let i = 0; i < SN; i++) { const h = P * (SN - i) / SN, z = SZ0 + run * (i + 0.5); B(3.4, h, run, stone2, 0, h / 2, z); B(1.6, 0.02, run + 0.01, red, 0, h + 0.01, z); for (const s of [-1, 1]) B(0.08, 0.025, run + 0.01, gold, s * 0.82, h + 0.012, z); }
  B(1.6, 0.02, 1.2, red, 0, P + 0.08, PZ1 - 0.6); for (const s of [-1, 1]) { B(0.3, P + 0.5, SZ1 - SZ0, white, s * 1.85, (P + 0.5) / 2, (SZ0 + SZ1) / 2); C(0.05, 0.06, 1.2, wood2, s * 1.85, P + 1.1, SZ1 - 0.15, 8); B(0.3, 0.36, 0.3, wood2, s * 1.85, P + 1.85, SZ1 - 0.15); B(0.22, 0.26, 0.22, glow, s * 1.85, P + 1.85, SZ1 - 0.15, g); }
  // ---- the main block, crenellated, with rows of arched windows and flower boxes
  const MW = 7.0, MZ0 = -2.4, MZ1 = 2.3, MD = MZ1 - MZ0;
  B(MW, H, MD, stone, 0, P + H / 2, (MZ0 + MZ1) / 2);
  for (let f = 1; f <= n; f++) B(MW + 0.14, 0.16, MD + 0.14, stone2, 0, P + f * S - 0.05, (MZ0 + MZ1) / 2);
  B(MW + 0.5, 0.3, MD + 0.5, stone2, 0, TOP + 0.15, (MZ0 + MZ1) / 2);      // the corbel band under the battlements
  merlons(-MW / 2 - 0.1, MZ1 + 0.15, MW / 2 + 0.1, MZ1 + 0.15, TOP + 0.3); merlons(-MW / 2 - 0.1, MZ0 - 0.15, MW / 2 + 0.1, MZ0 - 0.15, TOP + 0.3);
  merlons(-MW / 2 - 0.15, MZ0, -MW / 2 - 0.15, MZ1, TOP + 0.3); merlons(MW / 2 + 0.15, MZ0, MW / 2 + 0.15, MZ1, TOP + 0.3);
  for (let f = 0; f < n; f++) for (const x of [-2.5, -1.25, 1.25, 2.5]) { if (f === 0 && Math.abs(x) < 2) continue; win(x, P + f * S + 1.8, MZ1 + 0.05); }
  for (let f = 0; f < n; f++) for (const s of [-1, 1]) for (const z of [-1.0, 1.0]) win(s * (MW / 2 + 0.05), P + f * S + 1.8, z, 0.7, 1.1, s * Math.PI / 2, f > 0);
  // ---- the gate: an arched stone frame, a wooden double door with gold rings and bands, lanterns, the banners above
  const DZ = MZ1 + 0.06, DH = 3.0;
  B(2.6, DH + 0.8, 0.3, stone2, 0, P + (DH + 0.8) / 2, DZ + 0.05);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.22, 8, 20, Math.PI), grey); arch.position.set(0, P + DH - 0.9, DZ + 0.22); st.add(arch);
  B(1.9, DH - 0.9, 0.12, wood, 0, P + (DH - 0.9) / 2, DZ + 0.22); const dt = new THREE.Mesh(new THREE.CircleGeometry(0.95, 16, 0, Math.PI), wood); dt.position.set(0, P + DH - 0.9, DZ + 0.285); g.add(dt);
  B(0.05, DH - 0.2, 0.14, wood2, 0, P + (DH - 0.2) / 2, DZ + 0.26); for (const y of [0.6, 1.5]) B(1.9, 0.07, 0.14, gold, 0, P + y, DZ + 0.27);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 14), gold); r.position.set(s * 0.32, P + 1.15, DZ + 0.32); st.add(r); }
  for (const s of [-1, 1]) { B(0.12, 0.12, 0.4, wood2, s * 1.65, P + 2.3, DZ + 0.35); B(0.3, 0.42, 0.3, wood2, s * 1.65, P + 2.0, DZ + 0.55); B(0.22, 0.3, 0.22, glow, s * 1.65, P + 2.0, DZ + 0.55, g); }
  const bR = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.0), banner('#c8342c')); bR.position.set(0, P + DH + 2.2, DZ + 0.12); g.add(bR); B(1.7, 0.08, 0.08, gold, 0, P + DH + 3.72, DZ + 0.14);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.9), banner('#2f55c0')); b.position.set(s * 2.6, P + DH + 1.0, DZ + 0.1); g.add(b); B(1.1, 0.06, 0.06, gold, s * 2.6, P + DH + 1.96, DZ + 0.12); }
  // ---- the central keep: rises above the battlements, a big arched window, a dormer gable, a steep blue roof with two little spires
  const KW = 3.4, KZ = -0.2, KH = 3.6;
  B(KW, KH, KW, stone, 0, TOP + KH / 2, KZ); B(KW + 0.3, 0.25, KW + 0.3, stone2, 0, TOP + KH, KZ);
  win(0, TOP + 1.6, KZ + KW / 2 + 0.05, 0.9, 1.4);
  K(KW * 0.86, 4.8, blue, 0, TOP + KH + 2.4, KZ, 4, Math.PI / 4); ball(0.16, gold, 0, TOP + KH + 4.85, KZ); flag(0, TOP + KH + 4.9, KZ);
  for (const s of [-1, 1]) { C(0.42, 0.45, 1.4, stone, s * 1.7, TOP + KH + 0.6, KZ + 1.1, 12); K(0.62, 1.6, blue, s * 1.7, TOP + KH + 2.1, KZ + 1.1, 12); ball(0.08, gold, s * 1.7, TOP + KH + 2.95, KZ + 1.1); }
  { const gz = KZ + KW / 2 + 0.25, gy = TOP + KH - 0.2; B(1.6, 1.4, 0.6, stone, 0, gy + 0.2, gz); const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.15, 0.9, 3), blue); rf.rotation.z = Math.PI / 2; rf.rotation.y = Math.PI / 2; rf.position.set(0, gy + 1.1, gz); rf.scale.set(1, 1, 0.55); st.add(rf); win(0, gy + 0.25, gz + 0.32, 0.6, 0.8, 0, false); }
  // ---- two dormers on the roof behind the battlements (each side of the keep)
  for (const s of [-1, 1]) { const x = s * 2.4, z = 0.8, y = TOP + 0.9; B(1.4, 1.5, 1.3, stone2, x, y, z); const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.0, 0.9, 3), blue); rf.rotation.z = Math.PI / 2; rf.rotation.y = Math.PI / 2; rf.position.set(x, y + 1.15, z); rf.scale.set(1, 1.4, 0.7); st.add(rf); win(x, y + 0.05, z + 0.68, 0.55, 0.75, 0, true); }
  B(MW - 0.4, 0.6, MD - 0.4, blue, 0, TOP + 0.3, (MZ0 + MZ1) / 2);      // the slate roof between the battlements
  // ---- two round towers behind, with crenellations, blue cones and flags
  for (const s of [-1, 1]) {
    const x = s * 4.0, z = -2.2, r = 1.25, th = H + 2.6;
    C(r, r + 0.1, th, stone, x, P + th / 2, z, 22); C(r + 0.28, r + 0.1, 0.4, stone2, x, P + th, z, 22); ringMerlons(x, z, r + 0.15, P + th + 0.2);
    K(r + 0.45, 3.6, blue, x, P + th + 2.25, z, 22); flag(x, P + th + 4.0, z);
    for (let f = 0; f < n; f++) win(x + s * 0.0, P + f * S + 2.2, z + r + 0.02, 0.6, 1.0, 0, f > 0);
  }
  // ---- two round front towers with an open lantern pavilion and a red cone roof, a blue banner each
  for (const s of [-1, 1]) {
    const x = s * 4.55, z = 1.5, r = 1.0, th = H - 0.6;
    C(r + 0.15, r + 0.25, 1.4, grey, x, P * 0 + 0.7, z, 20); C(r, r, th, stone, x, P + th / 2, z, 20);
    C(r + 0.3, r + 0.2, 0.35, stone2, x, P + th + 0.17, z, 20); ringMerlons(x, z, r + 0.2, P + th + 0.3);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; C(0.06, 0.06, 1.3, wood, x + Math.cos(a) * (r - 0.1), P + th + 1.0, z + Math.sin(a) * (r - 0.1), 6); }
    ball(0.28, glow, x, P + th + 0.95, z, g); K(r + 0.5, 1.6, red, x, P + th + 2.4, z, 20); ball(0.1, gold, x, P + th + 3.25, z); flag(x, P + th + 3.25, z);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), banner('#2f55c0')); b.position.set(x, P + 1.6, z + r + 0.03); g.add(b);
    win(x, P + S + 1.6, z + r + 0.02, 0.55, 0.9, 0, true);
    ivy(x - s * 0.7, P, z + 0.75, 4);
  }
  // ---- the little half-timbered cottage (left) and the blue-domed gazebo (right) on the terrace
  { const x = -2.85, z = 2.4, w = 1.6, d = 1.2, h = 1.7; B(w, h, d, Mx(0xf6ead2, 0.8), x, P + h / 2, z); for (const dx of [-0.75, 0, 0.75]) B(0.07, h, 0.05, wood2, x + dx, P + h / 2, z + d / 2 + 0.01); B(w, 0.07, 0.05, wood2, x, P + h * 0.6, z + d / 2 + 0.01);
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.05, 1.0, 3), red); rf.rotation.z = Math.PI / 2; rf.position.set(x, P + h + 0.4, z); rf.scale.set(1, 1.0, 0.95); st.add(rf); win(x + 0.35, P + 1.0, z + d / 2 + 0.03, 0.45, 0.6, 0, true); }
  { const x = 2.85, z = 2.35, r = 0.75; C(r + 0.1, r + 0.1, 0.15, white, x, P + 0.08, z, 16); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; C(0.06, 0.06, 1.5, white, x + Math.cos(a) * r, P + 0.85, z + Math.sin(a) * r, 8); }
    C(r + 0.12, r + 0.12, 0.14, white, x, P + 1.65, z, 16); const dome = new THREE.Mesh(new THREE.SphereGeometry(r + 0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), blue); dome.position.set(x, P + 1.7, z); st.add(dome); ball(0.09, gold, x, P + 2.6, z); C(0.03, 0.03, 0.3, gold, x, P + 2.5, z, 6); }
  // ---- flowers in pots on the terrace and by the stair, ivy on the walls
  for (const [x, z] of [[-1.6, 2.7], [1.6, 2.7], [-4.0, 2.75], [4.0, 2.75], [-2.0, 3.9], [2.0, 3.9]]) { const y = z > 3 ? 0 : P; C(0.22, 0.17, 0.3, Mx(0xe8dcc8, 0.6), x, y + 0.15, z, 12); for (let i = 0; i < 5; i++) ball(0.11, i % 2 ? pink : leaf, x + Math.cos(i * 1.3) * 0.12, y + 0.36 + (i % 2) * 0.05, z + Math.sin(i * 1.3) * 0.12); }
  ivy(-3.3, P, MZ1 + 0.08, 5); ivy(3.3, P, MZ1 + 0.08, 6);
  g.add(bake(st));
  return { g, signY: P + DH + 0.35, doorZ: DZ + 0.4 };
}
