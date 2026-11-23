// Starter Village landmarks: market, dock, farm, orchard, houses, props and the broken-bridge pieces.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as L from '../core/layout.js';
import { ORCHARD_TREES, ORCHARD_H, ORCHARD_R, GATE, SOUTH, FIRE_SCALE, TENT_SCALE, BEN_MARKET } from '../core/regions/village.js';
import { at, std, windy, label, bake, leafyGeo, lampPost, prop, bunting, smoke, signs, lantern } from './common.js';

// ------------------------------------------------------------------ village landmarks
export const MARKET_JARS = BEN_MARKET.jars;      // (24/11) at the campfire in the south
export function well() {
  const g = new THREE.Group(), stone = new THREE.MeshStandardMaterial({ color: 0xb4afbe, roughness: 0.95, flatShading: true }), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 1.0, 12, 1, true), stone); ring.position.y = 0.5; ring.material.side = THREE.DoubleSide; ring.castShadow = true; g.add(ring);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.2, 14), new THREE.MeshStandardMaterial({ color: 0x3fb6e0, roughness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.7; g.add(water);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 0.16), wood); p.position.set(sx * 1.15, 1.7, 0); p.castShadow = true; g.add(p); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 4), new THREE.MeshStandardMaterial({ color: 0x3d6fc6, roughness: 0.8 })); roof.position.y = 3.4; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.3, 6), wood); bar.rotation.z = Math.PI / 2; bar.position.y = 2.5; g.add(bar);
  g.position.set(0, L.groundHeight(0, 4), 4);
  return g;
}
export function marketStall() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x9a6436, roughness: 0.85 });
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8; const c = cv.getContext('2d');
  for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff6ea' : '#e2402f'; c.fillRect(i * 8, 0, 8, 8); }
  const stripes = new THREE.CanvasTexture(cv); stripes.colorSpace = THREE.SRGBColorSpace; stripes.magFilter = THREE.NearestFilter;
  for (const [x, z] of [[-1, -2.2], [-1, 2.2], [1.3, -2.2], [1.3, 2.2]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), wood); p.position.set(x, 1.3, z); p.castShadow = true; g.add(p); }
  const awning = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 5.0), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.9 })); awning.position.set(0.25, 2.7, 0); awning.rotation.z = -0.22; awning.castShadow = true; g.add(awning);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 4.4), new THREE.MeshStandardMaterial({ color: 0xb97d46, roughness: 0.85 })); counter.position.set(-0.6, 0.47, 0); counter.castShadow = true; g.add(counter);
  const fruit = [0xe2402f, 0xf4b942, 0x6fbf4a, 0xe2402f, 0xf08a3c];
  for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 5), new THREE.MeshStandardMaterial({ color: fruit[i % 5], roughness: 0.6 })); f.position.set(-0.6 + (i % 2) * 0.28 - 0.14, 1.05, -1.9 + i * 0.29); g.add(f); }
  g.position.set(BEN_MARKET.stall[0], L.groundHeight(BEN_MARKET.stall[0], BEN_MARKET.stall[1]), BEN_MARKET.stall[1]);
  return g;
}
export function jarRow() {
  const g = new THREE.Group(), clay = new THREE.MeshStandardMaterial({ color: 0x5c6f9a, roughness: 0.6 }), crate = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 });
  const prof = [[0.01, 0], [0.34, 0.03], [0.44, 0.3], [0.36, 0.58], [0.26, 0.66], [0.3, 0.72]].map(([r, y]) => new THREE.Vector2(r, y));
  for (const [x, z] of MARKET_JARS) {
    const y = L.groundHeight(x, z), b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), crate); b.position.set(x, y + 0.35, z); b.castShadow = true; g.add(b);
    const j = new THREE.Mesh(new THREE.LatheGeometry(prof, 14), clay); j.position.set(x, y + 0.7, z); j.castShadow = true; g.add(j);
  }
  return g;
}
export function dock(bare = false) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: 0x6b4024, roughness: 0.9 });
  const x0 = L.riverX(18) - 3.4;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 2.6), wood); deck.position.set(x0 - 0.2, 0.12, 18); deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
  for (const [dx, dz] of [[-2, -1.1], [-2, 1.1], [1.9, -1.1], [1.9, 1.1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 7), dark); p.position.set(x0 - 0.2 + dx, -0.2, 18 + dz); g.add(p); }
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, 6.283, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9a5a30, roughness: 0.8, side: THREE.DoubleSide })); hull.scale.set(0.7, 0.5, 1.7); hull.position.set(x0 + 3.2, L.WATER_LEVEL + 0.32, 20.2); hull.castShadow = true; if (!bare) g.add(hull);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.3), wood); seat.position.set(x0 + 3.2, L.WATER_LEVEL + 0.2, 20.2); g.add(seat);
  for (const [dx, dz] of [[-1.4, 2.0], [-0.8, 2.3]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.9, 10), dark); b.position.set(x0 + dx, L.groundHeight(x0 + dx, 18 + dz) + 0.45, 18 + dz); b.castShadow = true; g.add(b); }
  return g;
}
const SCARE = [-31.5, 28.5];      // scarecrow, west of the garden beds
export function farm(bare = false) {
  const g = new THREE.Group(), soil = new THREE.MeshStandardMaterial({ color: 0x7a4f2c, roughness: 1 }), wood = new THREE.MeshStandardMaterial({ color: 0x9a6436, roughness: 0.85 });
  const crops = [[0x5fb84a, 0.22], [0xf08a3c, 0.2], [0x8fd05a, 0.28], [0xe2c04a, 0.24]];
  for (let r = 0; r < 4 && !bare; r++) {
    const z = 25.5 + r * 2.9, y = L.groundHeight(-24, z);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(11, 0.24, 1.9), soil); bed.position.set(-24, y + 0.06, z); bed.receiveShadow = true; g.add(bed);
    for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(crops[r][1], 7, 5), new THREE.MeshStandardMaterial({ color: crops[r][0], roughness: 0.8 })); c.position.set(-29 + i * 0.9, y + 0.3, z + (i % 2 ? 0.3 : -0.3)); c.scale.y = r === 3 ? 2.2 : 0.9; g.add(c); }
  }
  const sy = L.groundHeight(SCARE[0], SCARE[1]), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), wood); pole.position.set(SCARE[0], sy + 1.2, SCARE[1]); g.add(pole);
  const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), wood); arms.rotation.z = Math.PI / 2; arms.position.set(SCARE[0], sy + 1.7, SCARE[1]); g.add(arms);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x3d6fc6, roughness: 0.9 })); shirt.position.set(SCARE[0], sy + 1.5, SCARE[1]); shirt.castShadow = true; g.add(shirt);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf1d9a0 })); head.position.set(SCARE[0], sy + 2.2, SCARE[1]); g.add(head);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 10), new THREE.MeshStandardMaterial({ color: 0xd9b25a })); hat.position.set(SCARE[0], sy + 2.55, SCARE[1]); g.add(hat);
  return g;
}
/** Orchard (redone 17/11: "trees too low, cannot tell the fruit"): tall round fruit trees, each with one kind of big,
 *  clearly shaped fruit (apple, orange, pear, lemon, peach, plum), a little name board and a crate of the same fruit. */
export const FRUITS = [
  { en: 'Apple', color: 0xe02a2a, shape: 'apple' }, { en: 'Orange', color: 0xff8a1a, shape: 'round' }, { en: 'Pear', color: 0xb8d43a, shape: 'pear' },
  { en: 'Lemon', color: 0xffe03a, shape: 'lemon' }, { en: 'Peach', color: 0xffa07a, shape: 'round' }, { en: 'Plum', color: 0x7a3a9a, shape: 'round' },
];
function fruitMesh(f, s = 1, models = null) {
  const fm = models && models[f.en];      // apple and orange made in Blender
  if (fm) { const w = new THREE.Group(), c = fm.clone(true); c.scale.setScalar(s * 1.4); c.position.y = -0.15 * s * 1.4; w.add(c); return w; }
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.45 }), stemM = new THREE.MeshStandardMaterial({ color: 0x5a3a1a }), leafM = new THREE.MeshStandardMaterial({ color: 0x3f9a3a });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 12, 9), m);
  if (f.shape === 'apple') body.scale.set(1.05, 0.92, 1.05);
  if (f.shape === 'lemon') body.scale.set(0.82, 0.82, 1.2);
  g.add(body);
  if (f.shape === 'pear') { body.position.y = -0.06 * s; const top = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 10, 8), m); top.position.y = 0.14 * s; g.add(top); }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015 * s, 0.02 * s, 0.12 * s, 5), stemM); stem.position.y = (f.shape === 'pear' ? 0.28 : 0.22) * s; g.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 6, 4), leafM); leaf.scale.set(1.4, 0.3, 0.7); leaf.position.set(0.07 * s, (f.shape === 'pear' ? 0.29 : 0.24) * s, 0); leaf.rotation.z = -0.4; g.add(leaf);
  return g;
}
export function orchard(list, fruitModels = null) {
  const g = new THREE.Group(), still = new THREE.Group(), H = ORCHARD_H, R = ORCHARD_R;
  const geo = leafyGeo(0x7a4a26, [0x3f9a3a, 0x5fbe3f, 0x8fd04a], { h: H, r: R, clumps: 12, trunkR: 0.32, seed: 6 }), mat = windy(std(), 0.008);
  const wood = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 });
  list.forEach(([x, z], k) => {
    const f = FRUITS[k % FRUITS.length], y = L.groundHeight(x, z);
    const t = new THREE.Mesh(geo, mat); t.castShadow = true; t.position.set(x, y - 0.05, z); t.rotation.y = k * 1.3; g.add(t);
    const cy = y + H + R * 0.55;
    for (let i = 0; i < 16; i++) {           // fruit hanging all round the lower half of the crown, big enough to read from afar
      const a = i * 2.399 + k, e = -0.15 - 0.5 * ((i * 7) % 5) / 5, rr = R * 0.92;
      const fr = fruitMesh(f, 1.15, fruitModels); fr.position.set(x + Math.cos(a) * rr * Math.cos(e), cy + Math.sin(e) * rr, z + Math.sin(a) * rr * Math.cos(e)); fr.rotation.y = a; still.add(fr);
    }
    for (let i = 0; i < 3; i++) { const fr = fruitMesh(f, 1, fruitModels); const a = k + i * 2.1; fr.position.set(x + Math.cos(a) * 1.4, y + 0.2, z + Math.sin(a) * 1.4); fr.rotation.z = 1.2; still.add(fr); }   // fallen fruit
    // crate of the same fruit, by the trunk on the side of the path
    const cx = x - 1.6, cz = z + 1.3, crate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.7), wood); crate.position.set(cx, L.groundHeight(cx, cz) + 0.25, cz); still.add(crate);
    for (let i = 0; i < 6; i++) { const fr = fruitMesh(f, 0.9, fruitModels); fr.position.set(cx - 0.3 + (i % 3) * 0.3, L.groundHeight(cx, cz) + 0.55, cz - 0.15 + Math.floor(i / 3) * 0.3); still.add(fr); }
  });
  g.add(bake(still));
  list.forEach(([x, z], k) => { const sx = x - 1.6, sz = z + 1.3, b = label(`${FRUITS[k % FRUITS.length].en} tree`, { size: 26, scale: 0.7 }); b.position.set(sx, L.groundHeight(sx, sz) + 1.35, sz); g.add(b); });
  g.add(orchardFence());
  return g;
}
/** (20/11) The orchard is its own place: a low white fence round it with a gate on the west side where Hana waits (decoration, nothing to walk round). */
export const ORCHARD_BOX = { x0: 30, x1: 53, z0: -5, z1: 25, gate: [4, 9] };
function orchardFence() {
  const g = new THREE.Group(), post = new THREE.MeshStandardMaterial({ color: 0xf6efe0, roughness: 0.8 }), rail = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.85 });
  const B = ORCHARD_BOX, pts = [];
  const side = (x0, z0, x1, z1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.6)); for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, Math.atan2(x1 - x0, z1 - z0)]); };
  side(B.x0, B.z0, B.x1, B.z0); side(B.x1, B.z0, B.x1, B.z1); side(B.x1, B.z1, B.x0, B.z1); side(B.x0, B.z1, B.x0, B.gate[1]); side(B.x0, B.gate[0], B.x0, B.z0);
  const posts = new THREE.CylinderGeometry(0.07, 0.08, 1.05, 6), bar = new THREE.BoxGeometry(0.06, 0.07, 1.62);
  for (let i = 0; i < pts.length; i++) {
    const [x, z, yaw] = pts[i], y = L.groundHeight(x, z), m = new THREE.Mesh(posts, post); m.position.set(x, y + 0.5, z); g.add(m);
    if (i + 1 < pts.length && Math.hypot(pts[i + 1][0] - x, pts[i + 1][1] - z) < 2.2) for (const h of [0.45, 0.85]) { const nx = (x + pts[i + 1][0]) / 2, nz = (z + pts[i + 1][1]) / 2, r = new THREE.Mesh(bar, rail); r.position.set(nx, y + h, nz); r.rotation.y = Math.atan2(pts[i + 1][0] - x, pts[i + 1][1] - z); g.add(r); }
  }
  // the gate: two tall posts with a board across (the gap stays open)
  const gz = [B.gate[0], B.gate[1]], gy = L.groundHeight(B.x0, (gz[0] + gz[1]) / 2);
  for (const z of gz) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.9 })); t.position.set(B.x0, L.groundHeight(B.x0, z) + 1.3, z); g.add(t); }
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, gz[1] - gz[0] + 0.5), new THREE.MeshStandardMaterial({ color: 0xb5793a, roughness: 0.85 })); board.position.set(B.x0, gy + 2.45, (gz[0] + gz[1]) / 2); g.add(board);
  const lb = label("🍎 Hana's Apple Orchard", { size: 30, scale: 0.9 }); lb.position.set(B.x0 - 0.2, gy + 3.2, (gz[0] + gz[1]) / 2); g.add(lb);
  return bake(g);
}
/** The fountain in the middle of the Quest Square: stone basin, a pillar with a bowl, water. */
export function fountain(x, z) {
  const g = new THREE.Group(), stone = new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: 0xa79f90, roughness: 0.9 });
  const water = new THREE.MeshStandardMaterial({ color: 0x58c4ee, roughness: 0.12, metalness: 0.1, emissive: 0x1a5a80, emissiveIntensity: 0.25 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.0, 0.62, 28), stone); basin.position.y = 0.31; g.add(basin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.13, 8, 32), dark); rim.rotation.x = Math.PI / 2; rim.position.y = 0.64; g.add(rim);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.7, 28), water); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.6; g.add(pool);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.5, 12), stone); pillar.position.y = 1.2; g.add(pillar);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.35, 0.3, 20), dark); bowl.position.y = 1.95; g.add(bowl);
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.76, 20), water); top.rotation.x = -Math.PI / 2; top.position.y = 2.11; g.add(top);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.7, roughness: 0.1 })); spout.position.y = 2.45; g.add(spout);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.position.set(x, L.groundHeight(x, z), z); return g;
}
/** x, height above the ground, z, which way the board faces, name, small line, size (1 = 2.7 m wide). */
/** The nine garden beds of the farm: x, z. */
export const FARM_BEDS = [-27.6, -23.2, -18.8].flatMap((x) => [26.5, 30.2, 33.9].map((z) => [x, z]));
export const HOUSE_SIGNS = [
  [7.0, 4.9, -8, -Math.PI / 2, 'VILLAGE SHOP', 'Weapons · Armour · Bread'],
  [0, 6.3, -18.2, 0, 'VILLAGE HALL', "Mr Tom's office", 1.5],
  [-17.7, 4.7, -4, Math.PI / 2, "LILY'S HOUSE", 'Herbs and flowers'],
  [-18.2, 4.7, 12.5, Math.PI / 2, "ANNA'S HOUSE", 'Music and songs'],
];
/** A wooden board hanging on two chains from an iron arm fixed to the wall behind it; painted on both sides. */
export function hangSign(name, sub, x, y, z, yaw, size = 1) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192; const c = cv.getContext('2d');
  const wood = c.createLinearGradient(0, 0, 0, 192); wood.addColorStop(0, '#a8642c'); wood.addColorStop(1, '#7c451a');
  c.fillStyle = wood; c.beginPath(); c.roundRect(4, 4, 504, 184, 26); c.fill();
  c.strokeStyle = '#4a250a'; c.lineWidth = 8; c.stroke(); c.strokeStyle = 'rgba(255,220,150,0.35)'; c.lineWidth = 3; c.beginPath(); c.roundRect(18, 18, 476, 156, 18); c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 64px "Nunito", "Trebuchet MS", sans-serif';
  c.lineWidth = 8; c.strokeStyle = '#3a1a04'; c.strokeText(name, 256, 78, 470); c.fillStyle = '#ffe9a8'; c.fillText(name, 256, 78, 470);
  c.font = '700 32px "Nunito", "Trebuchet MS", sans-serif'; c.fillStyle = '#fff4dc'; c.fillText(sub, 256, 140, 460);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const g = new THREE.Group(), W = 2.7, H = W * 192 / 512;
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), edge = new THREE.MeshStandardMaterial({ color: 0x5a3010, roughness: 0.85 });
  const by = -0.55 - H / 2, board = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.07), edge); board.position.y = by; g.add(board);
  const front = new THREE.PlaneGeometry(W, H); front.translate(0, 0, 0.04); const back = new THREE.PlaneGeometry(W, H); back.rotateY(Math.PI); back.translate(0, 0, -0.04);
  const faces = new THREE.Mesh(mergeGeometries([front, back]), face); faces.position.y = by; g.add(faces);      // painted on both sides, readable from either
  const iron = new THREE.MeshStandardMaterial({ color: 0x2c2620, roughness: 0.5, metalness: 0.6 });
  const arm = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.08, 0.08), iron); g.add(arm);
  for (const sx of [-1, 1]) {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 5), iron); chain.position.set(sx * (W / 2 - 0.25), -0.27, 0); g.add(chain);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.9), iron); brace.position.set(sx * (W / 2 + 0.2), 0, -0.45); g.add(brace);     // back to the wall
  }
  g.position.set(x, y, z); g.rotation.y = yaw; g.scale.setScalar(size);
  return g;
}
export async function villageExtras(add, loadModel, shadowed) {
  const place = async (name, x, z, rot, scale) => { const m = shadowed(await loadModel(name)); m.position.set(x, L.groundHeight(x, z) - 0.05, z); m.rotation.y = rot; m.scale.setScalar(scale); add(m); return m; };
  await place('bld_hall_blue_v02', 0, -25.5, 0, 1.35);
  await place('bld_shop_orange_v02', 12.5, -8, -Math.PI / 2, 1.3);
  await place('bld_cottage_red_v02', -22, -4, Math.PI / 2, 1.3);
  await place('bld_house_blue_v02', -22.5, 12.5, Math.PI / 2, 1.3);
  const gate = await place('prop_forest_gate_v02', GATE.x, GATE.z, 0, 1); gate.position.y += 0.05;
  const title = label('Forest of Memories\nRừng Ký Ức', { size: 28 }); title.position.set(GATE.x, L.groundHeight(GATE.x, GATE.z) + 4.4, GATE.z); add(title);
  // props made in Blender (assets/models/prop_*); if one fails to load the code-drawn version stays
  const tryModel = async (name) => { try { return await loadModel(name); } catch (e) { console.warn('model', name, e); return null; } };
  const setup = (m, x, z, rot, sc, dy = 0) => { m.position.set(x, L.groundHeight(x, z) + dy, z); m.rotation.y = rot; m.scale.setScalar(sc); m.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return m; };
  const glow = (m, names, lo, hi, speed) => {      // water and flames: the emissive colour breathes, so the surface shimmers
    const mats = []; m.traverse((c) => { if (c.isMesh) for (const x of [].concat(c.material)) if (names.some((n) => x.name.startsWith(n)) && !mats.includes(x)) { if (!x.emissive || x.emissive.getHex() === 0) { x.emissive = x.color.clone().multiplyScalar(0.6); } mats.push(x); } });
    const o = new THREE.Group(); o.userData.update = (t) => { for (const [i, x] of mats.entries()) x.emissiveIntensity = lo + (hi - lo) * (0.5 + 0.5 * Math.sin(t * speed + i * 1.7)); }; return o;
  };
  const [gardenM, fountainM, fireM, boatM, appleM, orangeM] = await Promise.all(['prop_vegetable_garden_v01', 'prop_plaza_fountain_v01', 'prop_campfire_v01', 'prop_boat_v01', 'prop_apple_v01', 'prop_orange_v01'].map(tryModel));
  const still = new THREE.Group(); for (const g of [marketStall(), dock(!!boatM), farm(!!gardenM)]) still.add(g);      // the well in the square was removed (17/11): it blocked the main road
  add(jarRow()); add(orchard(ORCHARD_TREES, appleM && orangeM ? { Apple: appleM, Orange: orangeM } : null));
  if (boatM) { const bg = new THREE.Group(); const x0 = L.riverX(18) - 3.4; bg.add(setup(boatM, x0 + 3.2, 20.2, 0.25, 0.9, 0)); bg.children[0].position.y = L.WATER_LEVEL - 0.3; add(bake(bg)); }
  if (gardenM) {      // nine raised vegetable beds on the farm, three rows of three
    const gg = new THREE.Group();
    for (const [x, z] of FARM_BEDS) gg.add(setup(gardenM.clone(true), x, z, 0, 1.25, -0.02));
    add(bake(gg));
  }
  const stallName = label("Ben's Word Jars", { size: 28, scale: 0.8 }); stallName.position.set(-8.4, L.groundHeight(-8.6, 19.5) + 3.5, 19.5); add(stallName);
  for (const [x, z] of [[3.6, -12], [-3.6, -2], [3.8, 10], [-4, 16], [2.6, 27], [6, 8.2], [-8, 1.5], [-20, -10], [-26, -26], [32, 9], [42.6, 22], [8, 38]]) still.add(lampPost(x, z));
  signs(add, [[2.9, 14.5, '← Market\nFarm ↓'], [30.5, 9.5, 'Orchard']]);
  // Quest Square: fountain in the middle, a signpost where each road leaves (17/11)
  if (fountainM) { setup(fountainM, 0, 4, 0, 1); const sh = glow(fountainM, ['water', 'water_spray'], 0.25, 0.7, 2.2); add(bake(fountainM)); add(sh); } else add(fountain(0, 4));
  signs(add, [[-3.2, -4.6, '↑ Village Hall · Shop'], [8.6, 8.8, 'Bridge · Dock →\nOrchard · Wild Meadow ⚔'], [-9.6, -4.2, '← Forest Gate'], [-9.4, 9.6, "← Anna's · Lily's houses\nFarm ↓"]]);
  const sq = label('QUEST SQUARE', { size: 30, scale: 0.9 }); sq.position.set(0, L.groundHeight(0, 4) + (fountainM ? 6.9 : 3.3), 4); add(sq);
  for (const [kind, x, z, rot, sc] of VILLAGE_PROPS) still.add(prop(kind, x, z, rot, sc));
  add(bake(still));
  // hanging signboards over the doors (feedback 17/11): the name of each house in big letters, what is inside below
  const boards = new THREE.Group(); for (const [x, y, z, yaw, name, sub, size] of HOUSE_SIGNS) boards.add(hangSign(name, sub, x, L.groundHeight(x, z) + y, z, yaw, size));
  add(bake(boards));          // wood and iron merged into one mesh; only the painted faces stay apart
  add(windmill()); add(dummies()); add(campsite(!!fireM));
  if (fireM) { const [fx, fz] = SOUTH.fire; setup(fireM, fx, fz, 0.4, FIRE_SCALE); const sh = glow(fireM, ['flame'], 1.2, 3.2, 12); add(bake(fireM)); add(sh); }           // D1: the south fields
  signs(add, [[-2.5, 37.5, '← Windmill · Campsite\nBen\'s Word Jars ↓ · Training Yard →']]);
  add(bunting(-5.2, -3.2, 5.2, -3.2)); add(bunting(-6.5, 10.5, -6.5, 15.2, 3.0)); add(bunting(5.4, 9.6, 5.4, 2.2, 3.0));
  for (const [x, y, z] of [[4.0, 14.2, -24.3], [14.6, 9.3, -4.6], [-24, 7.4, -0.9], [-24.8, 10.6, 15.7]]) add(smoke(x, L.groundHeight(x, z) + y, z));
}
/** kind, x, z, rotation, scale — all outside paths; the big ones are also solids in core/regions/village.js */
export const VILLAGE_PROPS = [
  ['barrel', -17, -1.2, 0, 1], ['barrel', -16.7, -2.2, 1, 0.9], ['crate', -17, -6.6, 0.3, 1], ['fruit', -16.8, -5.5, 0.2, 1],
  ['bench', -3.4, -4.4, 1.57, 1], ['bench', 4.7, 9.2, 3.14, 1], ['barrel', 7.5, -11.4, 0, 1], ['crate', 7.4, -2.6, 0.5, 1], ['crate', 6.6, -2.0, 0.1, 0.8],
  ['fruit', 7.4, -9.9, 1.57, 1], ['cart', -12.6, 22.6, 0.5, 1], ['hay', -17.5, 22.6, 0.3, 1], ['hay', -18.9, 23.3, 1.2, 1], ['hay', -18.2, 22.9, 0.7, 0.8],
  ['barrel', -10.9, 12.8, 0, 1], ['crate', -8.0, 5.4, 0.2, 1], ['bench', 3.6, -13.6, -1.57, 1], ['barrel', -4.6, -17.6, 0, 1], ['crate', 4.6, -17.4, 0.4, 1],
  ['fruit', -3.6, 23.6, 0.2, 1], ['anvil', 7.6, -13.9, 0.4, 1], ['target', -23.5, -8.5, 0.3, 1], ['target', -21, -9.6, -0.2, 1], ['hay', -24.5, -6.2, 0.2, 0.8], ['bench', -28.4, -5.4, 1.2, 1], ['barrel', 12.2, 19.6, 0, 1], ['crate', 13.3, 20.3, 0.6, 0.9],
];

/** Loose planks bobbing in the river and a warning sign at the west end of a broken bridge (hidden when open). */
export function brokenBits(b, base) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.9 });
  const planks = [[-0.6, 1.8, 0.4], [1.1, -2.2, -0.5], [2.4, 0.9, 1.1]].map(([dx, dz, rot]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.42), wood); m.position.set(b.x + dx, L.WATER_LEVEL + 0.04, b.z + dz); m.rotation.y = rot; m.castShadow = true; g.add(m); return m;
  });
  const wx = b.x - L.BRIDGE_LEN / 2 - 1.6, wz = b.z + 1.9, post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.3, 6), wood);
  post.position.set(wx, L.groundHeight(wx, wz) + 0.65, wz); g.add(post);
  const sign = label('⚠ Broken bridge', { size: 30, scale: 0.7, bg: 'rgba(255,214,120,0.95)' }); sign.position.set(wx, L.groundHeight(wx, wz) + 1.6, wz); g.add(sign);
  g.userData.update = (t) => { planks.forEach((m, i) => { m.position.y = L.WATER_LEVEL + 0.04 + Math.sin(t * 1.3 + i * 2) * 0.03; m.rotation.z = Math.sin(t * 0.9 + i) * 0.05; }); };
  return g;
}

/** Things for "Fix the Bridge": rope coil, metal chain, log and boulder (no labels: the word is the task). */
export function bridgeItem(kind) {
  const g = new THREE.Group();
  const mat = (color, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: metal ? 0.35 : 0.9, metalness: metal });
  if (kind === 'rope') { for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42 - i * 0.04, 0.07, 8, 24), mat(0xc9a165)); t.rotation.x = Math.PI / 2; t.position.y = 0.08 + i * 0.13; g.add(t); } }
  else if (kind === 'chain') { for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 6, 14), mat(0x8c939c, 0.8)); t.position.set(-0.6 + i * 0.24, 0.07, Math.sin(i) * 0.1); t.rotation.set(Math.PI / 2, i % 2 ? Math.PI / 2 : 0, 0); g.add(t); } }
  else if (kind === 'log') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 2.2, 12), mat(0x7a4f2a)); c.rotation.z = Math.PI / 2; c.position.y = 0.3; g.add(c);
    for (const sx of [-1.1, 1.1]) { const r = new THREE.Mesh(new THREE.CircleGeometry(0.27, 12), mat(0xe2b97a)); r.position.set(sx * 1.003, 0.3, 0); r.rotation.y = sx * Math.PI / 2; g.add(r); } }
  else { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), mat(0x8f8a84)); r.scale.set(1.2, 0.8, 1); r.position.y = 0.45; g.add(r); }
  g.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return g;
}

/** Builds the active region (core/layout.js). `loadModel(name)` resolves a cloned GLB scene. */

// ------------------------------------------------------------------ D1: the south fields
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
/** Windmill on a stone base; the sails turn slowly in the wind. */
export function windmill() {
  const [x, z] = SOUTH.mill, y = L.groundHeight(x, z), g = new THREE.Group(), still = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.1, 5.2, 12), M(0xf1e2c4)); tower.position.y = 2.6; still.add(tower);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.35, 0.7, 12), M(0xa8a3b0)); base.position.y = 0.35; still.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.9, 12), M(0xc8452e)); roof.position.y = 6.15; still.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.2), M(0x7a4a24)); door.position.set(0, 0.95, 2.0); still.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), M(0xffd98a, { emissive: 0xffc860, emissiveIntensity: 0.6 })); win.position.set(0, 3.4, 1.72); still.add(win);
  g.add(bake(still));
  const hub = new THREE.Group(); hub.position.set(0, 4.6, 1.95);
  const wood = M(0x8a5a30), cloth = M(0xfff6e6, { side: THREE.DoubleSide });
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2;
    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.6, 0.12), wood); spar.position.y = 1.8; arm.add(spar);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.7), cloth); sail.position.set(0.55, 2.1, 0.02); arm.add(sail);
    hub.add(arm);
  }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), wood); hub.add(cap);
  g.add(hub); g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.update = (t) => { hub.rotation.z = t * 0.6; };
  g.position.set(x, y, z); g.rotation.y = 0.9; return g;
}
/** The big camp tent (24/11, "make the tent bigger and decorate it"): an eight-sided striped canvas tent TENT_SCALE times the old one, its
 *  mouth facing the fire, with crossed poles and tied-back flaps, a pennant, a rug, two lanterns on posts, a table with stools and cups,
 *  bedrolls and supply crates. Group origin = the tent's centre on the ground; +z is the front. */
/** Straw training dummies with red targets: the place to practise J / K before the Wild Meadow. */
export function dummies() {
  const g = new THREE.Group(), wood = M(0x8a5a30), straw = M(0xe8c45a), red = M(0xd8342a), white = M(0xfff6e6);
  for (const [x, z] of SOUTH.dummies) {
    const d = new THREE.Group(), y = L.groundHeight(x, z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.7, 6), wood); post.position.y = 0.85; d.add(post);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), wood); arm.rotation.z = Math.PI / 2; arm.position.y = 1.25; d.add(arm);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.8, 10), straw); body.position.y = 1.15; d.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), straw); head.position.y = 1.78; d.add(head);
    for (const [r, m] of [[0.22, red], [0.14, white], [0.07, red]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 14), m); t.rotation.x = Math.PI / 2; t.position.set(0, 1.18, 0.34 + (0.22 - r) * 0.1); d.add(t); }
    d.position.set(x, y, z); d.rotation.y = Math.atan2(-x, 40 - z); g.add(d);
  }
  const fence = new THREE.Group();
  for (let k = 0; k < 7; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 6), wood); const a = -0.3 + k * 0.42; p.position.set(11.5 + Math.cos(a) * 5.5, L.groundHeight(11.5 + Math.cos(a) * 5.5, 48.5 + Math.sin(a) * 5.5) + 0.45, 48.5 + Math.sin(a) * 5.5); fence.add(p); }
  g.add(fence);
  return bake(g);
}
function bigTent(tx, tz, yaw) {
  const S = TENT_SCALE, g = new THREE.Group(); g.position.set(tx, L.groundHeight(tx, tz), tz); g.rotation.y = yaw;
  const stripe = (a, b, w = 128) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = 8; const c = cv.getContext('2d'); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? b : a; c.fillRect(i * w / 8, 0, w / 8, 8); } const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; return t; };
  const wood = M(0x6a4020), rope = M(0xd9c79a), cloth = (c) => M(c, { side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.ConeGeometry(1.9 * S, 2.4 * S, 8, 1, true), new THREE.MeshStandardMaterial({ map: stripe('#f0a03c', '#fff1d8'), side: THREE.DoubleSide, roughness: 0.9 }));
  body.position.y = 1.2 * S; body.rotation.y = Math.PI / 8; body.castShadow = true; g.add(body);
  const front = 1.9 * S * Math.cos(Math.PI / 8);
  const mouth = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.85 * S, 0.02, front + 0.03), new THREE.Vector3(0.85 * S, 0.02, front + 0.03), new THREE.Vector3(0, 1.75 * S, front * 0.27)]), new THREE.MeshBasicMaterial({ color: 0x24160d, side: THREE.DoubleSide })); mouth.geometry.computeVertexNormals(); g.add(mouth);
  for (const sx of [-1, 1]) {      // tied-back flaps and the poles that frame the mouth
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.75 * S, 1.8 * S), cloth(0x8a3a1c)); flap.position.set(sx * 0.98 * S, 0.85 * S, front + 0.08); flap.rotation.set(-0.35, sx * -0.32, sx * 0.18); g.add(flap);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.0 * S, 6), wood); pole.position.set(sx * 0.9 * S, 0.9 * S, front + 0.45); pole.rotation.x = -0.2; pole.castShadow = true; g.add(pole);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.1, 6), wood); post.position.set(sx * 2.1 * S * 0.62, 1.05, front + 1.1); post.castShadow = true; g.add(post);
    const lan = lantern(sx * 2.1 * S * 0.62 + sx * 0.12, 2.15, front + 1.1); lan.scale.setScalar(1.6); g.add(lan);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.5, 6), wood); mast.position.y = 2.4 * S + 0.55; g.add(mast);
  const flagGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(1.1, 0.12, 0), new THREE.Vector3(0, -0.1, 0)]); flagGeo.computeVertexNormals();
  const flag = new THREE.Mesh(flagGeo, cloth(0xd8342a)); flag.position.set(0.03, 2.4 * S + 1.05, 0); g.add(flag);
  const rug = new THREE.Mesh(new THREE.BoxGeometry(2.6 * S * 0.8, 0.04, 2.2), new THREE.MeshStandardMaterial({ map: stripe('#b8503a', '#e8c070', 64), roughness: 1 })); rug.position.set(0, 0.03, front + 1.25); rug.receiveShadow = true; g.add(rug);
  const table = new THREE.Group(); const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 0.85), M(0x9a6436)); top.position.y = 0.82; table.add(top);
  for (const [dx, dz] of [[-0.65, -0.34], [0.65, -0.34], [-0.65, 0.34], [0.65, 0.34]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), wood); l.position.set(dx, 0.4, dz); table.add(l); }
  const map = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), M(0xfff1cf, { side: THREE.DoubleSide })); map.rotation.x = -Math.PI / 2; map.position.set(-0.2, 0.875, 0); table.add(map);
  for (const [dx, dz, c] of [[0.45, 0.15, 0xd8342a], [0.55, -0.18, 0x3f7fd0]]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 8), M(c)); cup.position.set(dx, 0.93, dz); table.add(cup); }
  table.position.set(S * 1.65, 0, front * 0.35); table.rotation.y = -0.5; g.add(table);
  for (const [dx, dz] of [[S * 1.65 - 0.9, front * 0.35 + 0.8], [S * 1.65 + 0.9, front * 0.35 - 0.3]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.44, 8), wood); st.position.set(dx, 0.22, dz); st.castShadow = true; g.add(st); }
  for (const [dx, dz, c, ry] of [[-S * 1.7, front * 0.55, 0x3f7fd0, 0.3], [-S * 1.45, front * 0.2, 0x6fae3a, -0.2]]) { const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.7, 10), M(c)); roll.rotation.z = Math.PI / 2; roll.rotation.y = ry; roll.position.set(dx, 0.26, dz); roll.castShadow = true; g.add(roll); }
  for (const [dx, dz, w] of [[-S * 1.55, -front * 0.35, 0.8], [-S * 1.15, -front * 0.62, 0.62], [-S * 1.95, -front * 0.12, 0.55]]) { const cr = new THREE.Mesh(new THREE.BoxGeometry(w, w * 0.85, w), M(0xa8743f)); cr.position.set(dx, w * 0.42, dz); cr.rotation.y = dx; cr.castShadow = true; g.add(cr); }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.8, 10), M(0x7a4a24)); barrel.position.set(-S * 0.55, 0.4, -front * 0.85); barrel.castShadow = true; g.add(barrel);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
/** Campsite: striped tent, log seats and a crackling fire that glows at night-ish hours and makes sparks. */
export function campsite(bare = false) {
  const [tx, tz] = SOUTH.tent, [fx, fz] = SOUTH.fire, g = new THREE.Group(), still = new THREE.Group();
  const camp = bigTent(tx, tz, Math.atan2(fx - tx, fz - tz)); g.add(camp);      // (24/11) a big striped tent with a rug, lanterns, a table, bedrolls and crates
  const fy = L.groundHeight(fx, fz), wood = M(0x6a4020), stone = M(0x9b99a8, { flatShading: true });
  if (!bare) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), stone); r.position.set(fx + Math.cos(a) * 0.55, fy + 0.08, fz + Math.sin(a) * 0.55); still.add(r); }
  if (!bare) for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6), wood); l.rotation.z = Math.PI / 2; l.rotation.y = k * 1.05; l.position.set(fx, fy + 0.12, fz); still.add(l); }
  if (!bare) for (const [dx, dz, ry] of [[1.9, 0.3, 0.2], [-0.4, 1.9, 1.6], [-2.0, -0.2, 0.4], [0.3, -1.9, 1.5]]) { const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.3, 8), wood); seat.rotation.z = Math.PI / 2; seat.rotation.y = ry; seat.position.set(fx + dx, fy + 0.22, fz + dz); still.add(seat); }
  g.add(bake(still));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 8), new THREE.MeshStandardMaterial({ color: 0xffb030, emissive: 0xff7a10, emissiveIntensity: 2.6, transparent: true, opacity: 0.92 }));
  flame.position.set(fx, fy + 0.5, fz); g.add(flame);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.45, 6), new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffe060, emissiveIntensity: 3 })); inner.position.set(fx, fy + 0.4, fz); g.add(inner); flame.visible = inner.visible = !bare;
  const sparkGeo = new THREE.BufferGeometry(), N = 24, pos = new Float32Array(N * 3), seed = Array.from({ length: N }, (_, i) => i * 0.37);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffb040, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false })); sparks.userData.particles = true; sparks.frustumCulled = false; g.add(sparks);
  g.userData.update = (t) => {
    const f = 1 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 21); flame.scale.set(1 / f, f, 1 / f); flame.material.emissiveIntensity = 2.2 + 0.6 * Math.sin(t * 17);
    for (let i = 0; i < N; i++) { const k = (t * 0.6 + seed[i]) % 1; pos[i * 3] = fx + Math.sin(seed[i] * 7 + t) * 0.25 * k; pos[i * 3 + 1] = fy + 0.5 + k * 2.2; pos[i * 3 + 2] = fz + Math.cos(seed[i] * 5 + t) * 0.25 * k; }
    sparkGeo.attributes.position.needsUpdate = true;
  };
  return g;
}
