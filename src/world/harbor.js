// Sunny Harbor scenery (Map 2): the open sea, wooden piers, a striped lighthouse with a turning beam, a big sailing
// ship at anchor, the fish market, palm trees and umbrellas on the beach, and three shop buildings with signs. Simple
// shapes merged with bake(); models from files where the village already has them (houses, boats).
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { PIERS, HARBOR } from '../core/regions/harbor.js';
import { waterMaterial, bake, label } from './common.js';
import { hangSign } from './village.js';
import { campStall } from './stall.js';

const M = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const mesh = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };

function piers(g) {
  const plank = M(0xb98a52), dark = M(0x6b4024);
  for (const p of PIERS) {
    for (let x = p.x0 - 2; x < p.x1 + 1; x += 0.55) mesh(g, new THREE.BoxGeometry(0.5, 0.12, p.half * 2 + 0.3), (Math.round(x * 2) % 3) ? plank : M(0xa87a46), x, 0.16, p.z);
    for (let x = p.x0; x <= p.x1; x += 4) for (const s of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.16, 0.18, 3.2, 7), dark, x, -1.2, p.z + s * (p.half + 0.1));
    for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(p.x1 - p.x0 + 2, 0.1, 0.1), dark, (p.x0 + p.x1) / 2, 0.85, p.z + s * (p.half + 0.1));      // rails
    for (let x = p.x0; x <= p.x1; x += 4) for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.1, 0.75, 0.1), dark, x, 0.55, p.z + s * (p.half + 0.1));
  }
}
function lighthouse(add) {
  const { x, z } = HARBOR.lighthouse, y = L.groundHeight(x, z) - 0.2, g = new THREE.Group(), still = new THREE.Group();
  const red = M(0xd8342a, 0.6), white = M(0xf6f2ea, 0.6);
  for (let i = 0; i < 6; i++) mesh(still, new THREE.CylinderGeometry(1.75 - (i + 1) * 0.14, 1.75 - i * 0.14, 1.6, 20), i % 2 ? red : white, x, y + 0.8 + i * 1.6, z);
  mesh(still, new THREE.CylinderGeometry(1.35, 1.35, 0.25, 20), M(0x3a3a40, 0.5), x, y + 9.7, z);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; mesh(still, new THREE.BoxGeometry(0.06, 0.6, 0.06), M(0x3a3a40, 0.5), x + Math.cos(a) * 1.25, y + 10.1, z + Math.sin(a) * 1.25); }
  mesh(still, new THREE.BoxGeometry(0.7, 1.2, 0.08), M(0x5a3416), x - 1.6, y + 0.6, z + 0.2).rotation.y = Math.PI / 2;      // door
  g.add(bake(still));
  const lamp = mesh(g, new THREE.SphereGeometry(0.55, 16, 12), M(0xfff2b0, 0.3, { emissive: 0xffd060, emissiveIntensity: 2.4 }), x, y + 10.4, z);
  mesh(g, new THREE.ConeGeometry(1.1, 0.9, 20), red, x, y + 11.3, z);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  beam.geometry.translate(0, -7, 0); beam.geometry.rotateZ(Math.PI / 2); beam.position.set(x, y + 10.4, z); g.add(beam);
  g.userData.update = (t) => { beam.rotation.y = t * 0.6; lamp.material.emissiveIntensity = 2.2 + Math.sin(t * 3) * 0.3; };
  add(g);
}
function ship(add) {
  const { x, z } = HARBOR.ship, g = new THREE.Group(), y = L.WATER_LEVEL - 0.6;
  const hull = M(0x7a3e1a, 0.7), trim = M(0xe8c060, 0.5), deck = M(0xc89058), sail = M(0xfff8ec, 0.9, { side: THREE.DoubleSide });
  const shape = new THREE.Shape(); shape.moveTo(-8, 0); shape.lineTo(7, 0); shape.quadraticCurveTo(10, 0.3, 10.5, 1.8); shape.lineTo(-8.5, 1.8); shape.closePath();
  const hg = new THREE.ExtrudeGeometry(shape, { depth: 4.2, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 2 }); hg.translate(0, 0, -2.1);
  mesh(g, hg, hull, 0, y, 0); mesh(g, new THREE.BoxGeometry(18, 0.12, 4.0), deck, 0.6, y + 1.85, 0); mesh(g, new THREE.BoxGeometry(18.8, 0.18, 4.4), trim, 0.6, y + 2.05, 0);
  mesh(g, new THREE.BoxGeometry(3.4, 1.4, 4.0), hull, -6.6, y + 2.6, 0);      // cabin at the back
  for (const [mx, h] of [[-2, 11], [4, 9]]) {
    mesh(g, new THREE.CylinderGeometry(0.16, 0.2, h, 8), M(0x5a3416), mx, y + 1.8 + h / 2, 0);
    for (const [sy, sw] of [[0.45, 1], [0.75, 0.75]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(4.2 * sw, h * 0.32, 6, 2), sail); const p = s.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.cos(p.getX(i) / (2.1 * sw) * Math.PI / 2) * 0.5); s.geometry.computeVertexNormals(); s.rotation.y = Math.PI / 2; s.position.set(mx + 0.4, y + 1.8 + h * sy, 0); g.add(s); }
  }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), M(0x2f6fd0, 0.8, { side: THREE.DoubleSide })); flag.position.set(-1.3, y + 13.2, 0); g.add(flag);
  g.position.set(x, 0, z); g.rotation.y = Math.PI / 2 + 0.12;
  g.userData.update = (t) => { g.rotation.z = Math.sin(t * 0.7) * 0.025; g.position.y = Math.sin(t * 0.9) * 0.08; flag.rotation.y = Math.sin(t * 3) * 0.3; };
  add(g);
}
function palm(still, x, z, k) {
  const y = L.groundHeight(x, z), trunk = M(0x9a7044), leaf = M(k % 2 ? 0x3f9a3a : 0x52b04a, 0.8, { side: THREE.DoubleSide });
  let px = x, py = y, lean = 0.12 + (k % 3) * 0.05, dir = k * 1.7;
  for (let i = 0; i < 7; i++) { const s = mesh(still, new THREE.CylinderGeometry(0.17 - i * 0.01, 0.2 - i * 0.01, 0.75, 7), trunk, px, py + 0.37, z + (px - x) * 0.2); s.rotation.z = -lean * i * 0.3; px += Math.cos(dir) * lean * 0.6; py += 0.72; }
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, f = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), leaf); f.scale.set(1.6, 0.12, 0.42); f.position.set(px + Math.cos(a) * 1.3, py - 0.25, z + (px - x) * 0.2 + Math.sin(a) * 1.3); f.rotation.y = -a; f.rotation.z = -0.35; still.add(f); }
  for (let i = 0; i < 3; i++) mesh(still, new THREE.SphereGeometry(0.17, 8, 6), M(0x6a4a24), px + Math.cos(i * 2) * 0.25, py - 0.35, z + (px - x) * 0.2 + Math.sin(i * 2) * 0.25);
}
function umbrella(still, x, z, col) {
  const y = L.groundHeight(x, z);
  mesh(still, new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6), M(0xf0f0f0), x, y + 1.15, z);
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.55, 8, 1, true, i * Math.PI / 4, Math.PI / 4), M(i % 2 ? col : 0xffffff, 0.8, { side: THREE.DoubleSide })); c.position.set(x, y + 2.35, z); still.add(c); }
  mesh(still, new THREE.BoxGeometry(0.8, 0.04, 1.8), M(col, 0.9), x + 1.2, y + 0.04, z + 0.4);      // towel
}

export async function harborExtras(add, loadModel, shadowed) {
  // the open sea: one big water sheet; the land hides it where the ground is higher
  const seaGeo = new THREE.PlaneGeometry(320, 320, 1, 1); seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, waterMaterial(false)); sea.position.set(60, L.WATER_LEVEL, 0); add(sea);
  const still = new THREE.Group(); piers(still);
  // the three shops with mini games: boutique (fashion), café (cooking), salon (beauty)
  const place = async (name, x, z, rot, tint) => { const m = shadowed(await loadModel(name)); m.position.set(x, L.groundHeight(x, z) - 0.05, z); m.rotation.y = rot; m.scale.setScalar(1.3); if (tint) m.traverse((c) => { if (c.isMesh) { c.material = c.material.clone(); c.material.color.multiply(new THREE.Color(...tint)); } }); add(m); return m; };
  const B = HARBOR;
  await place('bld_shop_orange_v02', B.boutique.x, B.boutique.z, Math.PI / 2, [1.12, 0.86, 1.05]);
  await place('bld_cottage_red_v02', B.cafe.x, B.cafe.z, Math.PI / 2, [1.0, 1.05, 1.1]);
  await place('bld_house_blue_v02', B.salon.x, B.salon.z, 0, [1.08, 0.92, 1.15]);
  const gh = (x, z) => L.groundHeight(x, z);
  still.add(hangSign('STYLE BOUTIQUE', 'Clothes · Shoes · Hats', B.boutique.door[0] - 0.3, gh(...B.boutique.door) + 4.9, B.boutique.door[1], Math.PI / 2));
  still.add(hangSign('SEASIDE CAFÉ', 'Cakes · Drinks · Ice cream', B.cafe.door[0] - 0.3, gh(...B.cafe.door) + 4.7, B.cafe.door[1], Math.PI / 2));
  still.add(hangSign('BEAUTY SALON', 'Hair · Nails · Make-up', B.salon.door[0], gh(...B.salon.door) + 4.7, B.salon.door[1] - 0.3, 0));
  // fish market: two stalls with blue awnings
  for (const sx of [-1, 5]) add(campStall(sx, gh(sx, 18), 18, Math.PI, 0x2f6fd0));
  { const n = label('🐟 Fish Market', { size: 28, scale: 0.8 }); n.position.set(2, gh(2, 18) + 3.4, 18); add(n); }
  // boats at the fishing pier
  for (const [bx, bz, r] of [[22, 31.2, 0.2], [30, 24.8, -0.3], [44, 5.6, 1.6]]) { try { const b = shadowed(await loadModel('prop_boat_v01')); b.position.set(bx, L.WATER_LEVEL - 0.25, bz); b.rotation.y = r; b.scale.setScalar(1.2); add(b); } catch { /* no boat model: the piers are enough */ } }
  // palms and umbrellas on the beach, crates and barrels on the main pier
  [[10, 34], [16, 46], [4, 42], [14, 22], [8, -6], [12, -14], [-2, 30], [20, 52]].forEach(([x, z], k) => palm(still, x, z, k));
  [[10, 40, 0xe2483e], [15, 34, 0x2f6fd0], [6, 47, 0xffb020], [18, 44, 0x2e9a5a]].forEach(([x, z, c]) => umbrella(still, x, z, c));
  for (const [x, z] of [[18, 3.4], [19.2, 3.4], [26, 0.6], [34, 3.4]]) mesh(still, new THREE.BoxGeometry(0.9, 0.8, 0.9), M(0xa8743f), x, 0.62, z);
  for (const [x, z] of [[22, 0.5], [38, 0.6]]) mesh(still, new THREE.CylinderGeometry(0.4, 0.4, 0.95, 12), M(0x7a4a24), x, 0.7, z);
  add(bake(still));
  lighthouse(add); ship(add);
  const sq = label('HARBOUR SQUARE', { size: 30, scale: 0.9 }); sq.position.set(B.square.x, gh(B.square.x, B.square.z) + 3.2, B.square.z); add(sq);
}
