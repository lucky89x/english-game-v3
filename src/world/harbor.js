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
const tint = (m, f) => m.traverse((c) => { if (c.isMesh) f(c); });
/** Blender lighthouse with the turning beam kept from the code version (the lamp sits near the top of the tower). */
async function lighthouse(add, loadModel, shadowed) {
  const { x, z } = HARBOR.lighthouse, y = L.groundHeight(x, z) - 0.2, g = new THREE.Group();
  let m = null; try { m = shadowed(await loadModel('harbor_lighthouse_v01')); } catch { /* falls back to nothing: the beam alone */ }
  const SC = 1.6;      // (20/11) taller tower and a wider rocky hill; the beam now sweeps down over the sea
  if (m) { m.position.set(x, y, z); m.scale.setScalar(SC); g.add(m); }
  const lampY = y + 12.2 * SC;
  const lamp = mesh(g, new THREE.SphereGeometry(0.01, 4, 3), M(0xfff2b0, 0.3, { emissive: 0xffd060, emissiveIntensity: 2.4 }), x, lampY, z);
  const pivot = new THREE.Group(); pivot.position.set(x, lampY, z); g.add(pivot);
  const geo = new THREE.ConeGeometry(5, 50, 20, 1, true); geo.translate(0, -25, 0); geo.rotateZ(Math.PI / 2);      // apex at the lamp, opening along +x
  const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = -Math.atan2(lampY - L.WATER_LEVEL, 50) - 0.02; pivot.add(beam);      // tilted so the far end lands on the water
  g.userData.update = (t) => { pivot.rotation.y = t * 0.45; lamp.material.emissiveIntensity = 2.2 + Math.sin(t * 3) * 0.3; };
  add(g);
}
/** The big Blender cargo ship at anchor off the main pier (hull lies along z, bottom 2 m under the deck line). */
async function ship(add, loadModel, shadowed) {
  const { x, z } = HARBOR.ship; let m = null;
  try { m = shadowed(await loadModel('harbor_cargo_ship_v01')); } catch { return; }
  const g = new THREE.Group(); m.position.y = L.WATER_LEVEL + 0.9; g.add(m); g.position.set(x, 0, z); g.rotation.y = 0.06;
  g.userData.update = (t) => { g.rotation.z = Math.sin(t * 0.6) * 0.01; g.position.y = Math.sin(t * 0.8) * 0.06; };
  add(g);
}
export function palm(still, x, z, k) {
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


/** Blender props: container yard + quay crane, pier furniture, mannequins at the boutique door, fish nets. */
async function props(add, loadModel, shadowed) {
  const got = {}, get = async (k) => { if (!(k in got)) { try { got[k] = await loadModel(`harbor_${k}_v01`); } catch { got[k] = null; } } return got[k]; };
  const put = async (k, x, z, rot = 0, y = null, scale = 1, keep = null) => {
    const src = await get(k); if (!src) return null; const m = shadowed(src.clone(true));
    if (keep) m.children.forEach((c) => { if (c.name && c.name.startsWith('mannequin') && c.name !== keep) c.visible = false; });
    m.position.set(x, y ?? L.groundHeight(x, z), z); m.rotation.y = rot; m.scale.setScalar(scale); add(m); return m;
  };
  const gh = (x, z) => L.groundHeight(x, z), Y = HARBOR.yard;
  // container yard: two rows, two high in places
  const cols = ['red', 'blue', 'green', 'orange'];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const x = Y.x - 3 + c * 6.4, z = Y.z - 1.4 + r * 2.9, base = gh(x, z);
    await put(`container_${cols[(r * 3 + c) % 4]}`, x, z, 0, base);
    if ((r + c) % 2 === 0) await put(`container_${cols[(r * 3 + c + 2) % 4]}`, x, z, 0, base + 2.6);
  }
  await put('container_blue', Y.x + 4, Y.z + 6.2, 0.25, gh(Y.x + 4, Y.z + 6.2));
  await put('crane', HARBOR.crane.x, HARBOR.crane.z, 0, gh(HARBOR.crane.x, HARBOR.crane.z), 0.45);
  // main pier: benches, lamps, bollards, crates (the pier deck top is y 0.22)
  for (const [x, z, r] of [[22, 0.75, 0], [31, 0.75, 0], [27, 3.25, Math.PI]]) await put('pier_bench', x, z, r, 0.22);
  for (const [x, z] of [[16, 4.05], [28, 4.05], [40, 4.05], [22, -0.05], [34, -0.05]]) await put('lamp_post', x, z, 0, 0.22);
  for (const [x, z] of [[47, 0.15], [47, 3.85], [14, 0.15], [14, 3.85]]) await put('bollard', x, z, 0, 0.22);
  for (const [x, z, r] of [[18.5, 3.2, Math.PI], [36, 3.2, Math.PI]]) await put('crate_stack', x, z, r, 0.22);
  // fishing pier: nets, bench and a bollard
  await put('fish_net', 24, 29.3, Math.PI, 0.22); await put('pier_bench', 30, 26.9, 0, 0.22); await put('bollard', 35, 29.2, 0, 0.22);
  await put('crate_stack', 18, 26.9, 0, 0.22, 0.8);
  // two mannequins flanking the boutique door (dress and coat), and a rack beside them
  const bd = HARBOR.boutique.door;
  await put('mannequin', bd[0] + 0.2, bd[1] - 3.4, Math.PI / 2, gh(bd[0], bd[1] - 3.4), 1, 'mannequin_dress');
  await put('mannequin', bd[0] + 0.2, bd[1] + 3.4, Math.PI / 2, gh(bd[0], bd[1] + 3.4), 1, 'mannequin_coat');
}

export async function harborExtras(add, loadModel, shadowed) {
  // the open sea: one big water sheet; the land hides it where the ground is higher
  const seaGeo = new THREE.PlaneGeometry(1000, 1000, 1, 1); seaGeo.rotateX(-Math.PI / 2);      // the sea closes round the whole island and runs to the horizon
  const sea = new THREE.Mesh(seaGeo, waterMaterial(false)); sea.position.set(0, L.WATER_LEVEL, 0); add(sea);
  const still = new THREE.Group(); piers(still);
  // the three shops with mini games: boutique (fashion), café (cooking), salon (beauty)
  const place = async (name, x, z, rot, tint) => { const m = shadowed(await loadModel(name)); m.position.set(x, L.groundHeight(x, z) - 0.05, z); m.rotation.y = rot; m.scale.setScalar(1.3); if (tint) m.traverse((c) => { if (c.isMesh) { c.material = c.material.clone(); c.material.color.multiply(new THREE.Color(...tint)); } }); add(m); return m; };
  const B = HARBOR;
  const house = async (name, spot, rot) => { try { const m = shadowed(await loadModel(name)); m.position.set(spot.x, L.groundHeight(spot.x, spot.z) - 0.05, spot.z); m.rotation.y = rot; m.scale.setScalar(1.12); add(m); } catch { /* keep the shop door sign alone */ } };
  await house('harbor_house_boutique_v01', B.boutique, Math.PI / 2);
  await house('harbor_house_cafe_v01', B.cafe, Math.PI / 2);
  await house('harbor_house_salon_v01', B.salon, 0);
  const gh = (x, z) => L.groundHeight(x, z);
  still.add(hangSign('STYLE BOUTIQUE', 'Clothes · Shoes · Hats', B.boutique.door[0] - 0.3, gh(...B.boutique.door) + 4.9, B.boutique.door[1], Math.PI / 2));
  still.add(hangSign('SEASIDE CAFÉ', 'Cakes · Drinks · Ice cream', B.cafe.door[0] - 0.3, gh(...B.cafe.door) + 4.7, B.cafe.door[1], Math.PI / 2));
  still.add(hangSign('BEAUTY SALON', 'Hair · Nails · Make-up', B.salon.door[0], gh(...B.salon.door) + 4.7, B.salon.door[1] - 0.3, 0));
  // fish market: two stalls with blue awnings
  for (const sx of [-1, 5]) add(campStall(sx, gh(sx, 18), 18, Math.PI, 0x2f6fd0));
  { const n = label('🐟 Fish Market', { size: 28, scale: 0.8 }); n.position.set(2, gh(2, 18) + 3.4, 18); add(n); }
  { const sx = B.shop.x, sz = B.shop.z; add(campStall(sx, gh(sx, sz), sz, Math.PI / 2 + 0.3)); const n = label("🌿 Willow's Harbor Stall", { size: 28, scale: 0.8 }); n.position.set(sx, gh(sx, sz) + 3.4, sz); add(n); }      // the Map 2 gear counter
  { const n = label('⛵ Boat to Treasure Isle', { size: 26, scale: 0.75 }); n.position.set(B.isle.x, L.WATER_LEVEL + 3.2, B.isle.z + 2.6); add(n); }
  // boats at the fishing pier
  for (const [bx, bz, r] of [[22, 31.2, 0.2], [30, 24.8, -0.3], [44, 5.6, 1.6]]) { try { const b = shadowed(await loadModel('prop_boat_v01')); b.position.set(bx, L.WATER_LEVEL - 0.25, bz); b.rotation.y = r; b.scale.setScalar(1.2); add(b); } catch { /* no boat model: the piers are enough */ } }
  // palms and umbrellas on the beach, crates and barrels on the main pier
  [[10, 34], [16, 46], [4, 42], [14, 22], [-2, 30], [20, 52], [-6, -8], [-18, 22], [-4, 24], [10, -14], [-22, -14], [-26, 4], [-14, 36], [-2, 50], [-18, 46], [-8, -34], [4, -40], [-26, -36], [-34, 30], [22, 40]]
    .filter(([x, z]) => L.walkable(x, z, 1.0) && L.pathDistance(x, z) > 3.2 && !L.inWater(x, z)).forEach(([x, z], k) => palm(still, x, z, k));      // palms instead of forest
  [[10, 40, 0xe2483e], [15, 34, 0x2f6fd0], [6, 47, 0xffb020], [18, 44, 0x2e9a5a]].forEach(([x, z, c]) => umbrella(still, x, z, c));
  for (const [x, z] of [[22, 0.5], [38, 0.6]]) mesh(still, new THREE.CylinderGeometry(0.4, 0.4, 0.95, 12), M(0x7a4a24), x, 0.7, z);
  add(bake(still));
  await props(add, loadModel, shadowed);
  await lighthouse(add, loadModel, shadowed); await ship(add, loadModel, shadowed);
  const sq = label('HARBOR SQUARE', { size: 30, scale: 0.9 }); sq.position.set(B.square.x, gh(B.square.x, B.square.z) + 3.2, B.square.z); add(sq);
}
