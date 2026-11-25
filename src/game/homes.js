// The children's homes (18/11: "a house for each of my two children, sharing one save: in one account you still see the
// other one's house. Empty at first, then buy furniture, garden, bed, mirror… in the shops. Put the two houses in an
// empty corner, each with a yard and a sign with the hero's name. Add more houses and shops: furniture, fruit and
// vegetables, instruments.") All profiles live in one save on this computer, so both houses read the same store.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { HOMES, FURNITURE, STALLS, TOWN, MARKET_ROW } from '../core/regions/village.js';
import { home, owners } from '../core/rules.js';
import { house, gardenOf, bedOffset, flowerOffset, PLOT } from '../core/house.js';
import { farm, stageOf, eggsReady, pigSize, pigGrown } from '../core/farm.js';
import { label, bake } from '../world/common.js';
import { buildPlants } from '../world/plants.js';
import { hangSign } from '../world/village.js';
import { campStall } from '../world/stall.js';

const M = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });
const HOUSE_FILE = ['bld_cottage_red_v02', 'bld_house_blue_v02', 'bld_cottage_red_v02', 'bld_house_blue_v02'];      // (24/11) four lots, two models, each tinted differently
const HOUSE_TINT = [[1.1, 1.0, 0.92], [0.95, 1.05, 1.15], [0.92, 1.1, 0.95], [1.12, 1.02, 1.12]];
/** Garden things around the yard centre (dx, dz); the garden path runs along dz = 0. */
const YARD_AT = { flowers: [-1.0, -2.6], veg_patch: [-2.4, -3.6], fruit_tree: [-1.2, 3.4], bench: [-2.4, 1.9], mailbox: [2.4, -1.3], garden_lamp: [2.4, 1.3] };      // (21/11) veg patch and bench moved for the coop and the pen


function flowerBed() {
  const g = new THREE.Group(); const soil = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 1.0), M(0x6a4024, 1)); soil.position.y = 0.1; g.add(soil);
  const cols = [0xff5a8a, 0xffd23c, 0xffffff, 0xb070f0, 0xff8a3c];
  for (let i = 0; i < 14; i++) { const x = -0.75 + (i % 7) * 0.25, z = -0.25 + Math.floor(i / 7) * 0.5;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), M(0x3f8a34)); st.position.set(x, 0.35, z); g.add(st);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(cols[i % cols.length], 0.6)); fl.position.set(x, 0.52, z); g.add(fl); }
  return g;
}
function bench() {
  const g = new THREE.Group(), wood = M(0xa8743f), iron = M(0x3a3a40, 0.5);
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.16), wood); p.position.set(0, 0.45, -0.18 + i * 0.18); g.add(p); }
  for (let i = 0; i < 2; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.05), wood); p.position.set(0, 0.7 + i * 0.18, -0.28); g.add(p); }
  for (const x of [-0.65, 0.65]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), iron); l.position.set(x, 0.22, -0.05); g.add(l); const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.06), iron); b.position.set(x, 0.75, -0.3); g.add(b); }
  return g;
}
function mailbox() {
  const g = new THREE.Group(); const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), M(0x7a4a24)); post.position.y = 0.5; g.add(post);
  const box = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.35, 4, 10), M(0xd8342a, 0.5)); box.rotation.x = Math.PI / 2; box.position.y = 1.12; g.add(box);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.1), M(0xffd23c)); flag.position.set(0.19, 1.25, 0.05); g.add(flag);
  return g;
}

function gardenLamp() {          // own shapes: common.js lampPost draws from the seeded scenery random numbers
  const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 7), M(0x2a2a30, 0.5)); pole.position.y = 0.8; g.add(pole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb040, emissiveIntensity: 1.4 })); lamp.position.y = 1.72; g.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 8), M(0x2a2a30, 0.5)); cap.position.y = 1.9; g.add(cap);
  return g;
}

/** (20/11) The plot: a white picket fence all round the lot (x from the house's west side to 10.4 m east, z +-6.5 m) with a gate on the east side. */
export { PLOT };
function plotFence(h, gh) {
  const g = new THREE.Group(), post = M(0xf6efe0, 0.8), rail = M(0xe9dcc0, 0.85), pg = new THREE.CylinderGeometry(0.06, 0.07, 0.95, 6), rg = new THREE.BoxGeometry(0.8, 0.06, 0.05), rgz = new THREE.BoxGeometry(0.05, 0.06, 0.8);
  const x0 = h.x + PLOT.x0, x1 = h.x + PLOT.x1, z0 = h.z - PLOT.z, z1 = h.z + PLOT.z;
  const put = (x, z, alongX) => { const y = gh(x, z), p = new THREE.Mesh(pg, post); p.position.set(x, y + 0.47, z); g.add(p);
    for (const hh of [0.35, 0.7]) { const r = new THREE.Mesh(alongX ? rg : rgz, rail); r.position.set(x + (alongX ? 0.4 : 0), y + hh, z + (alongX ? 0 : 0.4)); g.add(r); } };
  for (let x = x0; x < x1 - 0.1; x += 0.8) { put(x, z0, true); put(x, z1, true); }
  for (let z = z0; z < z1 - 0.1; z += 0.8) { put(x0, z, false); if (Math.abs(z + 0.4 - h.z) > PLOT.gate) put(x1, z, false); }      // the east side has a gap for the gate
  const tall = new THREE.CylinderGeometry(0.12, 0.14, 1.9, 8), wood = M(0x8a5a2a, 0.9);
  for (const dz of [-PLOT.gate, PLOT.gate]) { const gz = h.z + dz, t = new THREE.Mesh(tall, wood); t.position.set(x1, gh(x1, gz) + 0.95, gz); g.add(t); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, PLOT.gate * 2 + 0.3), M(0xb5793a, 0.85)); bar.position.set(x1, gh(x1, h.z) + 1.85, h.z); g.add(bar);
  return g;
}
/** Vegetable bed with rows of cabbages and carrot tops; flower bed reuses flowerBed(). */
function vegBed(crops = true) {
  const g = new THREE.Group(), soil = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 1.1), M(0x6a4024, 1)); soil.position.y = 0.11; g.add(soil);
  for (let k = 0; k < 2; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.16), M(0x553018, 1)); r.position.set(0, 0.24, k ? 0.25 : -0.25); g.add(r); }      // two furrows
  if (!crops) return g;
  for (let i = 0; i < 6; i++) { const x = -0.7 + (i % 3) * 0.7, z = i < 3 ? -0.25 : 0.25; const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M(i % 2 ? 0x6cc044 : 0x8fd05a, 0.8)); c.scale.y = 0.7; c.position.set(x, 0.32, z); g.add(c);
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 5), M(0xff8a1a, 0.7)); t.position.set(x + 0.28, 0.3, z + (i < 3 ? 0.18 : -0.18)); t.rotation.z = Math.PI; g.add(t); }
  return g;
}
/** Everything the garden level adds: veg beds on the north strip, flower beds on the south strip, trees, pond, flower gate. */
function gardenDecor(h, tier, gh, models) {
  const g = new THREE.Group(), cfg = gardenOf({ garden: tier });
  for (let i = 0; i < cfg.veg; i++) { const o = vegBed(false), [dx, dz] = bedOffset(i), x = h.x + dx, z = h.z + dz; o.position.set(x, gh(x, z), z); g.add(o); }      // (21/11) the crops are planted by the child (cropsOf)
  for (let i = 0; i < cfg.flowers; i++) { const o = flowerBed(), [dx, dz] = flowerOffset(i), x = h.x + dx, z = h.z + dz; o.position.set(x, gh(x, z), z); g.add(o); }
  for (let i = 0; i < cfg.trees; i++) { const x = h.x - 5.6, z = h.z + (i ? 3.2 : -3.2); const t = models.tree ? models.tree.clone(true) : null; if (t) { t.scale.setScalar(0.85); t.position.set(x, gh(x, z), z); t.traverse((c) => { if (c.isMesh) c.castShadow = true; }); g.add(t); } }
  if (cfg.pond) { const x = h.x - 3.5, z = h.z; const w = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshStandardMaterial({ color: 0x4fc6e8, roughness: 0.15, transparent: true, opacity: 0.9 })); w.rotation.x = -Math.PI / 2; w.scale.set(1.3, 1, 1); w.position.set(x + 5.4, gh(x + 5.4, z) + 0.08, z + 2.6); g.add(w); }
  if (cfg.arch) { const x = h.x + PLOT.x1 - 0.1; for (const dz of [-PLOT.gate - 0.2, PLOT.gate + 0.2]) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), M(0xff5a8a, 0.6)); fl.position.set(x - 0.3, gh(x, h.z + dz) + 1.9, h.z + dz); g.add(fl); } }
  return g;
}
/** (21/11) What grows on a bed: crop and stage (1 seed, 2 sprout, 3 growing, 4 ready to pick), six plants a bed. */
export const COOP_AT = [8.6, -3.2], PEN_AT = [8.4, 3.4];
/** (25/11) The user's crop models (plants pack) for a growing (3) and a ready (4) bed: [file, scale at 3, scale at 4, sink at 3, sink at 4]. Tomato has no model and keeps its shapes. */
const CROP_MODEL = { corn: [['corn_stalk', 0.45], ['corn_plant_ripe', 0.62]], carrot: [['carrot', 0.75, -0.3], ['carrot', 1.0, -0.2]], cabbage: [['cabbage', 0.9], ['cabbage', 1.45]], pumpkin: [['pumpkin', 0.6], ['pumpkin', 1.1]] };
export const CROP_FILES = [...new Set(Object.values(CROP_MODEL).flat().map(([f]) => f))];
function cropsOf(crop, stage, models = {}) {
  const g = new THREE.Group(); if (!stage) return g;
  const cm = stage >= 3 && CROP_MODEL[crop] && CROP_MODEL[crop][stage - 3], src = cm && models[cm[0]];
  if (src) {      // six real plants on the bed
    for (let i = 0; i < 6; i++) { const o = src.clone(true); o.position.set(-0.62 + (i % 3) * 0.62, 0.24 + (cm[2] || 0), i < 3 ? -0.25 : 0.25); o.scale.setScalar(cm[1] * (0.92 + ((i * 37) % 10) / 60)); o.rotation.y = i * 1.9; o.traverse((c) => { if (c.isMesh) c.castShadow = true; }); g.add(o); }
    return g;
  }
  const leaf = M(0x5fb83a, 0.8), dark = M(0x3f8a2a, 0.8);
  for (let i = 0; i < 6; i++) {
    const x = -0.62 + (i % 3) * 0.62, z = i < 3 ? -0.25 : 0.25, p = new THREE.Group(); p.position.set(x, 0.24, z); g.add(p);
    if (stage === 1) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), M(0x8a5a30, 1)); m.scale.y = 0.4; p.add(m); continue; }
    if (stage === 2) { for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), leaf); l.scale.set(1, 0.3, 0.5); l.position.set(s * 0.05, 0.06, 0); l.rotation.z = s * 0.5; p.add(l); } continue; }
    const big = stage === 4;
    if (crop === 'corn') { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, big ? 1.1 : 0.6, 5), dark); st.position.y = big ? 0.55 : 0.3; p.add(st); for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), leaf); l.scale.set(0.3, 0.1, 1.4); l.position.y = 0.25 + k * 0.25; l.rotation.y = k * 2.1; p.add(l); } if (big) { const cob = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), M(0xf6d040, 0.6)); cob.position.set(0.07, 0.65, 0); cob.rotation.z = -0.3; p.add(cob); } continue; }
    const bush = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.17 : 0.12, 8, 6), crop === 'cabbage' ? M(0x8fd05a, 0.8) : leaf); bush.scale.y = 0.7; bush.position.y = 0.1; p.add(bush);
    if (!big) continue;
    if (crop === 'carrot') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), M(0xff8a1a, 0.7)); c.rotation.z = Math.PI; c.position.set(0.06, 0.04, 0.06); p.add(c); }
    if (crop === 'tomato') for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M(0xe2302a, 0.45)); t.position.set(Math.cos(k * 2.1) * 0.12, 0.14, Math.sin(k * 2.1) * 0.12); p.add(t); }
    if (crop === 'cabbage') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M(0xc8ec9a, 0.7)); c.position.y = 0.16; p.add(c); }
    if (crop === 'pumpkin') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), M(0xf08a1e, 0.6)); c.scale.y = 0.7; c.position.set(0.05, 0.1, 0.05); p.add(c); }
  }
  if (stage === 4) { const glow = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.05, 32), new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.scale.set(1.05, 0.62, 1); glow.position.y = 0.26; g.add(glow); g.userData.ready = glow; }
  return g;
}
function coop() {
  const g = new THREE.Group(), wood = M(0xb8743a), roof = M(0xc0392b, 0.7);
  const hut = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.0), wood); hut.position.y = 0.75; g.add(hut);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.75), roof); r.position.set(0, 1.38, s * 0.3); r.rotation.x = s * 0.55; g.add(r); }
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), wood); l.position.set(x, 0.15, z); g.add(l); }
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.04), M(0x5a3416)); door.position.set(0, 0.62, 0.52); g.add(door);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.7), wood); ramp.position.set(0, 0.22, 0.85); ramp.rotation.x = 0.55; g.add(ramp);
  const nest = new THREE.Group(); nest.position.set(-0.9, 0, 0.3); const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.14, 12), M(0xe8c46a, 1)); straw.position.y = 0.07; nest.add(straw); g.add(nest); g.userData.nest = nest;
  return g;
}
function chicken() {
  const g = new THREE.Group(), w = M(0xfaf6ee, 0.8);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), w); b.scale.set(1, 0.9, 1.25); b.position.y = 0.18; g.add(b);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), w); hd.position.set(0, 0.32, 0.12); g.add(hd);
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.08), M(0xe2302a)); comb.position.set(0, 0.41, 0.12); g.add(comb);
  const bk = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 5), M(0xf0a020)); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.31, 0.21); g.add(bk);
  return g;
}
function pen() {
  const g = new THREE.Group(), wood = M(0x9a6436), mud = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), M(0x7a5a3a, 1)); mud.rotation.x = -Math.PI / 2; mud.position.y = 0.03; mud.scale.set(1.2, 1, 0.9); g.add(mud);
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, x = Math.cos(a) * 1.55, z = Math.sin(a) * 1.15; const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), wood); post.position.set(x, 0.35, z); g.add(post); }
  for (const hh of [0.3, 0.6]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 4, 28), wood); r.rotation.x = Math.PI / 2; r.scale.set(1.55, 1.15, 1); r.position.y = hh; g.add(r); }
  const trough = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.3), wood); trough.position.set(0.6, 0.12, -0.6); g.add(trough);
  const pig = new THREE.Group(), pink = M(0xf4a8b8, 0.7), body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), pink); body.scale.set(1, 0.85, 1.35); body.position.y = 0.42; pig.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), pink); head.position.set(0, 0.55, 0.5); pig.add(head);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10), M(0xe88a9a)); snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.52, 0.75); pig.add(snout);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), pink); e.position.set(s * 0.14, 0.78, 0.45); pig.add(e); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), M(0x1a1a20)); eye.position.set(s * 0.1, 0.62, 0.7); pig.add(eye); }
  for (const [x, z] of [[-0.2, 0.3], [0.2, 0.3], [-0.2, -0.3], [0.2, -0.3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 6), pink); l.position.set(x, 0.1, z); pig.add(l); }
  g.add(pig); g.userData.pig = pig; return g;
}
/** (25/11) "the villa must look like a villa, even a castle": a cream manor with gold trim, slate roofs, a white-columned porch with a balcony
 *  over the door, rows of tall windows and two round corner towers with pointed roofs and flags. Faces +x (the door side of the lot).
 *  floors: 2 or 3. Returns { g, signY } (signY: height of the name board, right over the door). */
export function villaExterior(floors) {
  const g = new THREE.Group(), S = 3.6, H = S * floors, Mx = (c, r = 0.75, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const wall = Mx(0xf4ecdc, 0.8), trim = Mx(0xd9b45a, 0.35, { metalness: 0.5 }), roof = Mx(0x3a5a8a, 0.6), white = Mx(0xfbf8f2, 0.5), glass = Mx(0xbfe2ff, 0.15, { emissive: 0xffe0a0, emissiveIntensity: 0.35 }), stone = Mx(0xb8b0a0, 0.9);
  const bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const cy = (r1, r2, h, m, x, y, z, seg = 16) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const X0 = -4.2, X1 = 3.4, Z = 3.5, W = X1 - X0;
  bx(W + 0.4, 0.5, Z * 2 + 0.4, stone, (X0 + X1) / 2, 0.25, 0);      // plinth
  bx(W, H, Z * 2, wall, (X0 + X1) / 2, H / 2 + 0.5, 0);
  for (let f = 1; f <= floors; f++) bx(W + 0.12, 0.18, Z * 2 + 0.12, trim, (X0 + X1) / 2, 0.5 + f * S, 0);      // a gold band at each floor
  // a hipped slate roof (a four-sided pyramid, flattened)
  const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(W, Z * 2) / 2 + 0.6, 3.2, 4), roof); rf.rotation.y = Math.PI / 4; rf.scale.set(W / (Z * 2) * 1.02, 1, 1); rf.position.set((X0 + X1) / 2, H + 0.5 + 1.6, 0); rf.castShadow = true; g.add(rf);
  // windows on the front and the two sides, every floor
  for (let f = 0; f < floors; f++) {
    const y = 0.5 + f * S + 1.9;
    for (const z of [-2.5, -1.2, 1.2, 2.5]) { if (f === 0 && Math.abs(z) < 1.5) continue; bx(0.06, 1.6, 0.8, glass, X1 + 0.02, y, z); bx(0.1, 0.12, 1.0, trim, X1 + 0.04, y + 0.86, z); bx(0.14, 0.1, 1.0, white, X1 + 0.06, y - 0.85, z); }
    for (const sz of [-1, 1]) for (const x of [-2.6, -0.4, 1.8]) { bx(0.8, 1.6, 0.06, glass, x, y, sz * (Z + 0.02)); bx(1.0, 0.12, 0.1, trim, x, y + 0.86, sz * (Z + 0.04)); }
  }
  // the porch: four white columns, a pediment, a balcony with a gold rail over the door, steps
  const PX = X1 + 1.2;
  for (const z of [-1.9, -0.7, 0.7, 1.9]) { cy(0.17, 0.2, S - 0.2, white, PX, 0.5 + (S - 0.2) / 2, z, 14); cy(0.26, 0.26, 0.14, trim, PX, 0.5 + S - 0.13, z, 14); }
  bx(1.5, 0.3, 4.6, white, X1 + 0.75, 0.5 + S + 0.05, 0);      // the porch roof = the balcony floor
  for (const z of [-2.2, -1.1, 0, 1.1, 2.2]) cy(0.03, 0.03, 0.8, trim, PX + 0.6, 0.5 + S + 0.6, z, 6);
  bx(0.08, 0.08, 4.6, trim, PX + 0.6, 0.5 + S + 1.0, 0);
  for (let i = 0; i < 3; i++) bx(1.0, 0.17, 3.2 - i * 0.3, stone, X1 + 1.6 + 0.35 * (2 - i), 0.08 + i * 0.17, 0);
  bx(0.08, 2.6, 1.6, Mx(0x7a3a1a, 0.6), X1 + 0.03, 0.5 + 1.3, 0); bx(0.1, 0.16, 1.9, trim, X1 + 0.05, 0.5 + 2.7, 0);      // the double door
  for (const z of [-0.35, 0.35]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), trim); k.position.set(X1 + 0.1, 0.5 + 1.25, z); g.add(k); }
  // two round towers at the front corners with pointed roofs and flags
  for (const sz of [-1, 1]) {
    const tz = sz * (Z + 0.75), tx = X1 - 0.9, th = H + 2.4;
    cy(0.95, 1.05, th, wall, tx, 0.5 + th / 2, tz, 20); cy(1.08, 1.08, 0.2, trim, tx, 0.5 + th, tz, 20);
    for (let f = 0; f < floors; f++) { const w = bx(0.5, 1.2, 0.06, glass, tx + 0.98, 0.5 + f * S + 2.0, tz); w.rotation.y = Math.PI / 2; }
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.2, 20), roof); cone.position.set(tx, 0.5 + th + 1.8, tz); cone.castShadow = true; g.add(cone);
    cy(0.03, 0.03, 1.4, trim, tx, 0.5 + th + 4.1, tz, 6);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), Mx(sz > 0 ? 0xe8443a : 0x2f6fd0, 0.7, { side: THREE.DoubleSide })); flag.position.set(tx + 0.42, 0.5 + th + 4.55, tz); g.add(flag);
  }
  // hedges and two gold lamps by the steps
  for (const sz of [-1, 1]) { const hb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), Mx(0x3f8a34, 0.9)); hb.scale.set(1.4, 0.8, 1); hb.position.set(X1 + 1.3, 0.45, sz * 2.9); g.add(hb); cy(0.05, 0.06, 1.6, trim, X1 + 2.4, 0.8, sz * 1.9, 8); const l = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), Mx(0xffe6a0, 0.3, { emissive: 0xffc860, emissiveIntensity: 1.2 })); l.position.set(X1 + 2.4, 1.7, sz * 1.9); g.add(l); }
  return { g, signY: 0.5 + S + 1.55 };
}

export class Homes {
  /** api: { scene, load(name) -> model, profiles() -> all profiles in the save, current() -> playing profile } */
  constructor(api) { this.api = api; this.root = new THREE.Group(); this.root.name = 'homes'; api.scene.add(this.root); this.lots = []; this.key = ''; }
  async build() {
    const { load } = this.api, still = new THREE.Group();
    this.cropModels = {}; await Promise.all(CROP_FILES.map(async (f) => { try { this.cropModels[f] = await load(`plants/${f}`); } catch (e) { /* missing: that crop keeps its shapes */ } }));      // (25/11)
    const place = async (name, x, z, rot, scale, tint) => {
      const m = await load(name); m.position.set(x, L.REGIONS.village.groundHeight(x, z) - 0.05, z); m.rotation.y = rot; m.scale.setScalar(scale);
      m.traverse((c) => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; if (tint) { c.material = c.material.clone(); c.material.color.multiply(new THREE.Color(...tint)); } } });
      this.root.add(m); return m;
    };
    const gh = (x, z) => L.REGIONS.village.groundHeight(x, z);
    for (const [i, h] of HOMES.entries()) {
      const hm = await place(HOUSE_FILE[i], h.x, h.z, Math.PI / 2, 1.3, HOUSE_TINT[i]);
      let hall = null; try { hall = await place('bld_hall_blue_v02', h.x - 0.4, h.z, Math.PI / 2, 1.0, i ? [1.0, 0.95, 1.1] : [1.1, 1.0, 0.95]); hall.visible = false; } catch { /* no villa model: the house stays */ }
      const yard = new THREE.Group(); this.root.add(yard); const garden = new THREE.Group(); this.root.add(garden);
      still.add(plotFence(h, gh));      // (20/11) fence round the whole plot
      this.lots.push({ h, yard, garden, models: { house: hm, hall }, sign: null, post: null, owner: null });
    }
    // Bram's furniture shop, with its board over the door, and the two market stalls
    await place('bld_shop_orange_v02', FURNITURE.x, FURNITURE.z, Math.PI / 2, 1.3, [0.92, 1.05, 1.12]);
    still.add(hangSign('FURNITURE', 'Beds · Tables · Garden', FURNITURE.door[0] - 0.3, gh(FURNITURE.door[0], FURNITURE.door[1]) + 4.9, FURNITURE.door[1], Math.PI / 2));
    for (const b of [...TOWN, ...MARKET_ROW]) {      // (24/11) the user's new buildings and stalls
      try { await place(b.file, b.x, b.z, b.yaw, b.scale);
        if (b.name) { const n = label(b.name, { size: 28, scale: 0.8 }); n.position.set(b.x, gh(b.x, b.z) + (b.file.startsWith('stall') ? 4.3 : b.file === 'bld_quest_tower' ? 9.0 : 7.4) * (b.scale > 1.25 ? 1 : 0.95), b.z); this.root.add(n); }
      } catch (e) { /* the file is missing: the village goes on without it */ }
    }
    for (const [k, t] of Object.entries(STALLS)) {
      if (k === 'produce') { try { await place('stall_vegetables', t.x, t.z, t.yaw, 1.2); const n = label("🥕 Poppy's Fruit & Veg", { size: 28, scale: 0.8 }); n.position.set(t.x, gh(t.x, t.z) + 4.3, t.z); this.root.add(n); continue; } catch (e) { /* the old stall below */ } }
      const s = campStall(t.x, gh(t.x, t.z), t.z, t.yaw, k === 'music' ? 0x8a4ad0 : k === 'tailor' ? 0xe06aa8 : k === 'healer' ? 0x2f9ae0 : k === 'pets' ? 0xf0a030 : 0xe2483e, k === 'tailor' ? 'cloth' : 'fruit'); this.root.add(s);
      const n = label(k === 'music' ? "🎵 Anna's Instruments" : k === 'tailor' ? "🧵 Mia's Tailor Shop" : k === 'healer' ? "🧪 Village Shop · Lily" : k === 'pets' ? "🐾 Penny's Pet Shop" : "🍎 Poppy's Fruit & Veg", { size: 28, scale: 0.8 }); n.position.set(t.x, gh(t.x, t.z) + 3.3, t.z); this.root.add(n);
      if (k === 'tailor') {      // two mannequins from the harbor boutique beside Mia's stall
        try { const src = await load('harbor_mannequin_v01');
          for (const [dx, keep] of [[-2.6, 'mannequin_dress'], [2.6, 'mannequin_coat']]) { const m = src.clone(true); m.children.forEach((c) => { if (c.name && c.name.startsWith('mannequin') && c.name !== keep) c.visible = false; });
            const x = t.x + dx, z = t.z - 0.6; m.position.set(x, gh(x, z), z); m.rotation.y = t.yaw; m.traverse((c) => { if (c.isMesh) c.castShadow = true; }); this.root.add(m); } } catch (e) { /* no mannequin file: the stall alone */ }
      }
    }
    this.root.add(bake(still));
    try { this.root.add(await buildPlants(load)); } catch (e) { console.warn('plants', e); }      // (24/11) the user's plant pack
    this.refresh(true);
  }
  /** Rebuilds the signs and yards when an owner, a name or a bought garden thing changed. */
  refresh(force = false) {
    if (!this.lots.length) return;
    const kids = owners(this.api.profiles(), HOMES.length), key = JSON.stringify(kids.map((p) => [p.id, p.name, home(p).items, house(p)]));
    if (!force && key === this.key) return; this.key = key;
    const gh = (x, z) => L.REGIONS.village.groundHeight(x, z);
    for (const [i, lot] of this.lots.entries()) {
      const p = kids[i] || null, h = lot.h; lot.owner = p;
      for (const o of [lot.sign, lot.post]) if (o) { o.removeFromParent(); o.traverse((c) => { if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } }); }
      const name = p ? p.name : '';
      // (25/11) the name board always hangs right over the door: on the villa's balcony, or at the door of the (taller) house
      const hh0 = p ? house(p) : null, isVilla = !!(hh0 && hh0.villa), tall = hh0 ? 1 + 0.38 * (hh0.floors - 1) : 1;
      if (lot.villa) { lot.villa.removeFromParent(); lot.villa = null; }
      if (isVilla) { const v = villaExterior(Math.max(2, hh0.floors)); v.g.position.set(h.x, gh(h.x, h.z) - 0.05, h.z); this.root.add(v.g); lot.villa = v.g; lot.signAt = [h.x + 3.4 + 1.95, gh(h.x, h.z) + v.signY, h.z]; }
      else lot.signAt = [h.door[0] - 0.3, gh(h.door[0], h.door[1]) + 4.7 * tall, h.door[1]];
      lot.sign = hangSign(p ? `NHÀ CỦA ${name.toLocaleUpperCase('vi')}` : 'NHÀ TRỐNG', p ? `${name}'s home` : 'Chưa có chủ', ...lot.signAt, Math.PI / 2, 1.25);      // the hero's own name (18/11)
      this.root.add(lot.sign);
      lot.post = label(p ? `🏠 Nhà của ${name}` : '🏠 Nhà trống', { size: 28, scale: 0.8 }); lot.post.position.set(h.yard[0] + 2.9, gh(h.yard[0] + 2.9, h.z - 1.6) + 2.2, h.z - 1.6); this.root.add(lot.post);
      lot.yard.clear(); lot.garden.clear();
      if (p) {      // (20/11) the house grows with the floors, the villa swaps in the big hall; the garden has three sizes
        const hh = house(p), up = 1 + 0.38 * (hh.floors - 1), m = lot.models.house;
        lot.models.house.visible = !hh.villa; if (lot.models.hall) lot.models.hall.visible = false;      // (25/11) the villa is drawn by villaExterior
        m.scale.y = (m === lot.models.hall ? 1.0 : 1.3) * up; lot.garden.add(gardenDecor(h, hh.garden, gh, this.api.models));
        lot.farm = { beds: [], sig: [], coop: null, pen: null, hens: [] };      // (21/11) the farm: crops, coop with hens, pig pen
        const cfg = gardenOf(hh);
        for (let b = 0; b < cfg.veg; b++) { const [dx, dz] = bedOffset(b), x = h.x + dx, z = h.z + dz, grp = new THREE.Group(); grp.position.set(x, gh(x, z), z); lot.garden.add(grp); lot.farm.beds.push(grp); lot.farm.sig.push(''); }
        if (hh.coop) { const c = coop(), x = h.x + COOP_AT[0], z = h.z + COOP_AT[1]; c.position.set(x, gh(x, z), z); c.rotation.y = -Math.PI / 2; lot.garden.add(c); lot.farm.coop = c;
          for (let k = 0; k < 3; k++) { const ch = chicken(); lot.garden.add(ch); lot.farm.hens.push({ o: ch, a: k * 2.1, cx: x - 1.4, cz: z, ph: k }); } }
        if (hh.pen) { const pn = pen(), x = h.x + PEN_AT[0], z = h.z + PEN_AT[1]; pn.position.set(x, gh(x, z), z); lot.garden.add(pn); lot.farm.pen = pn; }
        this.syncFarm(true);
      } else { lot.farm = null; lot.models.house.visible = true; lot.models.house.scale.y = 1.3; if (lot.models.hall) lot.models.hall.visible = false; }
      const have = p ? home(p).items : [];
      for (const id of have) {
        const at = YARD_AT[id]; if (!at) continue;
        const x = h.yard[0] + at[0], z = h.z + at[1], y = gh(x, z);
        let o = null;
        const glb = this.api.models[id];            // Blender yard pieces (yard_*_v01.glb) when loaded; the shapes otherwise
        if (glb && ['flowers', 'bench', 'mailbox', 'garden_lamp'].includes(id)) { o = glb.clone(true); o.rotation.y = id === 'bench' ? -Math.PI / 2 : id === 'mailbox' ? Math.PI / 2 : id === 'flowers' ? Math.PI / 2 : 0; o.scale.setScalar(id === 'flowers' ? 1.3 : 1.15); }
        else if (id === 'flowers') o = flowerBed();
        else if (id === 'bench') { o = bench(); o.rotation.y = Math.PI; }
        else if (id === 'mailbox') o = mailbox();
        else if (id === 'garden_lamp') o = gardenLamp();
        else if (id === 'veg_patch' && this.api.models.garden) { o = this.api.models.garden.clone(true); o.scale.setScalar(0.75); }
        else if (id === 'fruit_tree' && this.api.models.tree) { o = this.api.models.tree.clone(true); o.scale.setScalar(0.9); }
        if (!o) continue;
        o.position.set(x, y, z);
        o.traverse((c) => { if (c.isMesh) c.castShadow = true; }); lot.yard.add(o);
      }
    }
  }
  /** Redraws the crops, the eggs in the nest and the pig when they changed (called about twice a second). */
  syncFarm(force = false, now = Date.now()) {
    for (const lot of this.lots) {
      const p = lot.owner, F = lot.farm; if (!p || !F) continue; const fm = farm(p);
      F.beds.forEach((grp, i) => { const b = fm.beds[i], st = stageOf(b, now), sig = b ? `${b.crop}:${st}` : ''; if (!force && sig === F.sig[i]) return; F.sig[i] = sig; grp.clear(); grp.add(cropsOf(b && b.crop, st, this.cropModels)); });
      if (F.coop) { const n = eggsReady(p, now), nest = F.coop.userData.nest; if (nest.userData.n !== n) { nest.userData.n = n; while (nest.children.length > 1) nest.remove(nest.children[1]); for (let k = 0; k < Math.min(n, 8); k++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M(0xfaf0dc, 0.5)); e.scale.y = 1.3; e.position.set(Math.cos(k * 1.3) * 0.12, 0.17 + Math.floor(k / 5) * 0.06, Math.sin(k * 1.3) * 0.12); nest.add(e); } } }
      if (F.pen) { const pig = F.pen.userData.pig, s = pigSize(fm.pig, now); pig.visible = !!fm.pig; pig.scale.setScalar(s || 0.5); pig.userData.grown = pigGrown(fm.pig, now); }
    }
  }
  /** Hens peck about, the pig wobbles, the ripe beds glow (every frame while the village is shown). */
  update(dt) {
    if (!this.root.visible) return; this.t = (this.t || 0) + dt; this.farmT = (this.farmT || 0) + dt; if (this.farmT > 0.5) { this.farmT = 0; this.syncFarm(); }
    const gh = (x, z) => L.REGIONS.village.groundHeight(x, z);
    for (const lot of this.lots) { const F = lot.farm; if (!F) continue;
      for (const hn of F.hens) { hn.a += dt * 0.5; const x = hn.cx + Math.cos(hn.a + hn.ph) * 0.8, z = hn.cz + Math.sin(hn.a * 1.3 + hn.ph) * 0.9; hn.o.position.set(x, gh(x, z) + Math.abs(Math.sin(this.t * 7 + hn.ph)) * 0.04, z); hn.o.rotation.y = hn.a + hn.ph + Math.PI / 2; hn.o.rotation.x = Math.sin(this.t * 3 + hn.ph) > 0.8 ? 0.5 : 0; }
      if (F.pen) { const pig = F.pen.userData.pig; pig.rotation.y = Math.sin(this.t * 0.4) * 1.2; pig.position.y = Math.abs(Math.sin(this.t * 2.5)) * 0.02; }
      for (const grp of F.beds) { const r = grp.children[0] && grp.children[0].userData.ready; if (r) r.material.opacity = 0.35 + 0.35 * Math.sin(this.t * 4); }
    }
  }
  /** The farm spot the hero stands at: { lot, kind: 'bed' | 'coop' | 'pen', i } or null. */
  farmAt(pos) {
    for (const lot of this.lots) { const F = lot.farm, h = lot.h; if (!F) continue;
      for (let i = 0; i < F.beds.length; i++) { const [dx, dz] = bedOffset(i); if (Math.abs(pos.x - (h.x + dx)) < 1.3 && Math.abs(pos.z - (h.z + dz)) < 0.85) return { lot, kind: 'bed', i }; }
      if (F.coop && Math.hypot(pos.x - (h.x + COOP_AT[0]), pos.z - (h.z + COOP_AT[1])) < 1.9) return { lot, kind: 'coop' };
      if (F.pen && Math.hypot(pos.x - (h.x + PEN_AT[0]), pos.z - (h.z + PEN_AT[1])) < 2.1) return { lot, kind: 'pen' };
    }
    return null;
  }
  setRegion(name) { this.root.visible = name === 'village'; }
  /** The lot that belongs to this profile (or null: a third child, or the admin). */
  lotOf(p) { return this.lots.find((l) => l.owner && p && l.owner.id === p.id) || null; }
  /** Which lot's door the hero stands at (or null). */
  doorAt(pos, r = 2.2) { return this.lots.find((l) => Math.hypot(pos.x - (l.h.door[0] + 0.9), pos.z - l.h.door[1]) < r) || null; }
}
