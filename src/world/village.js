// Starter Village landmarks: well, market, dock, farm, orchard, houses, props and the broken-bridge pieces.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { ORCHARD_TREES, GATE } from '../core/regions/village.js';
import { at, std, windy, label, bake, leafyGeo, leafCards, leafMat, lampPost, prop, bunting, smoke, signs } from './common.js';

// ------------------------------------------------------------------ village landmarks
export const MARKET_JARS = [[-6.4, 17.2], [-6.4, 18.75], [-6.4, 20.3], [-6.4, 21.85]];
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
  g.position.set(-8.6, L.groundHeight(-8.6, 19.5), 19.5);
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
export function dock() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: 0x6b4024, roughness: 0.9 });
  const x0 = L.riverX(18) - 3.4;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 2.6), wood); deck.position.set(x0 - 0.2, 0.12, 18); deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
  for (const [dx, dz] of [[-2, -1.1], [-2, 1.1], [1.9, -1.1], [1.9, 1.1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 7), dark); p.position.set(x0 - 0.2 + dx, -0.2, 18 + dz); g.add(p); }
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, 6.283, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9a5a30, roughness: 0.8, side: THREE.DoubleSide })); hull.scale.set(0.7, 0.5, 1.7); hull.position.set(x0 + 3.2, L.WATER_LEVEL + 0.32, 20.2); hull.castShadow = true; g.add(hull);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.3), wood); seat.position.set(x0 + 3.2, L.WATER_LEVEL + 0.2, 20.2); g.add(seat);
  for (const [dx, dz] of [[-1.4, 2.0], [-0.8, 2.3]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.9, 10), dark); b.position.set(x0 + dx, L.groundHeight(x0 + dx, 18 + dz) + 0.45, 18 + dz); b.castShadow = true; g.add(b); }
  return g;
}
export function farm() {
  const g = new THREE.Group(), soil = new THREE.MeshStandardMaterial({ color: 0x7a4f2c, roughness: 1 }), wood = new THREE.MeshStandardMaterial({ color: 0x9a6436, roughness: 0.85 });
  const crops = [[0x5fb84a, 0.22], [0xf08a3c, 0.2], [0x8fd05a, 0.28], [0xe2c04a, 0.24]];
  for (let r = 0; r < 4; r++) {
    const z = 25.5 + r * 2.9, y = L.groundHeight(-24, z);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(11, 0.24, 1.9), soil); bed.position.set(-24, y + 0.06, z); bed.receiveShadow = true; g.add(bed);
    for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(crops[r][1], 7, 5), new THREE.MeshStandardMaterial({ color: crops[r][0], roughness: 0.8 })); c.position.set(-29 + i * 0.9, y + 0.3, z + (i % 2 ? 0.3 : -0.3)); c.scale.y = r === 3 ? 2.2 : 0.9; g.add(c); }
  }
  const sy = L.groundHeight(-27, 27), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), wood); pole.position.set(-27, sy + 1.2, 27); g.add(pole);
  const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), wood); arms.rotation.z = Math.PI / 2; arms.position.set(-27, sy + 1.7, 27); g.add(arms);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x3d6fc6, roughness: 0.9 })); shirt.position.set(-27, sy + 1.5, 27); shirt.castShadow = true; g.add(shirt);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf1d9a0 })); head.position.set(-27, sy + 2.2, 27); g.add(head);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 10), new THREE.MeshStandardMaterial({ color: 0xd9b25a })); hat.position.set(-27, sy + 2.55, 27); g.add(hat);
  return g;
}
export function orchard(list) {
  const cards = leafCards([0x4faa3a, 0x77c948, 0xb4e45c], { h: 2.2, r: 2.3, seed: 6 }), cardMat = leafMat(0.012);
  const g = new THREE.Group(), geo = leafyGeo(0x7a4a26, [0x3a8a2c, 0x4f9e36, 0x62ae40], { h: 2.2, r: 2.3, clumps: 8, trunkR: 0.3, seed: 6 }), apple = new THREE.MeshStandardMaterial({ color: 0xe23a2a, roughness: 0.5 }), lemon = new THREE.MeshStandardMaterial({ color: 0xf6c62e, roughness: 0.5 });
  list.forEach(([x, z], k) => {
    const t = new THREE.Mesh(geo, windy(std(), 0.012)); t.castShadow = true; t.position.set(x, L.groundHeight(x, z) - 0.05, z); t.rotation.y = k * 1.3; g.add(t);
    const lc = new THREE.Mesh(cards, cardMat); lc.position.copy(t.position); lc.rotation.y = t.rotation.y; g.add(lc);
    for (let i = 0; i < 10; i++) { const a = i * 2.399 + k, f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), k % 3 === 2 ? lemon : apple); f.position.set(x + Math.cos(a) * 1.7, L.groundHeight(x, z) + 2.6 + (i % 4) * 0.45, z + Math.sin(a) * 1.7); g.add(f); }
  });
  return g;
}

export async function villageExtras(add, loadModel, shadowed) {
  const place = async (name, x, z, rot, scale) => { const m = shadowed(await loadModel(name)); m.position.set(x, L.groundHeight(x, z) - 0.05, z); m.rotation.y = rot; m.scale.setScalar(scale); add(m); return m; };
  await place('bld_hall_blue_v02', 0, -25.5, 0, 1.35);
  await place('bld_shop_orange_v02', 12.5, -8, -Math.PI / 2, 1.3);
  await place('bld_cottage_red_v02', -14.5, -8, Math.PI / 2, 1.3);
  await place('bld_house_blue_v02', -15, 9, Math.PI / 2, 1.3);
  const gate = await place('prop_forest_gate_v02', GATE.x, GATE.z, 0, 1); gate.position.y += 0.05;
  const title = label('Forest of Memories\nRừng Ký Ức', { size: 28 }); title.position.set(GATE.x, L.groundHeight(GATE.x, GATE.z) + 4.4, GATE.z); add(title);
  const still = new THREE.Group(); for (const g of [well(), marketStall(), dock(), farm()]) still.add(g);
  add(jarRow()); add(bake(orchard(ORCHARD_TREES)));
  const stallName = label("Ben's Word Jars", { size: 28, scale: 0.8 }); stallName.position.set(-8.4, L.groundHeight(-8.6, 19.5) + 3.5, 19.5); add(stallName);
  for (const [x, z] of [[2.6, -12], [-2.6, -2], [2.8, 10], [-3, 16], [1.5, 27], [6, 8.2], [-8, 1.5], [-20, -10], [-26, -26], [32, 9], [42.6, 22], [8, 38]]) still.add(lampPost(x, z));
  signs(add, [[2.9, 14.5, '← Market\nFarm ↓'], [3.2, 1.2, 'Bridge →\n← Forest'], [30.5, 9.5, 'Orchard']]);
  for (const [kind, x, z, rot, sc] of VILLAGE_PROPS) still.add(prop(kind, x, z, rot, sc));
  add(bake(still));
  add(bunting(-5.2, -3.2, 5.2, -3.2)); add(bunting(-6.5, 10.5, -6.5, 15.2, 3.0)); add(bunting(5.4, 9.6, 5.4, 2.2, 3.0));
  for (const [x, y, z] of [[4.0, 14.2, -24.3], [14.6, 9.3, -4.6], [-16.5, 7.4, -4.9], [-17.3, 10.6, 12.2]]) add(smoke(x, L.groundHeight(x, z) + y, z));
}
/** kind, x, z, rotation, scale — all outside paths; the big ones are also solids in core/regions/village.js */
export const VILLAGE_PROPS = [
  ['barrel', -9.5, -5.2, 0, 1], ['barrel', -9.2, -6.2, 1, 0.9], ['crate', -9.5, -10.6, 0.3, 1], ['fruit', -9.3, -9.5, 0.2, 1],
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
