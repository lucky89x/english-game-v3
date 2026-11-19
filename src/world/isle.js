// Treasure Isle scenery (19/11): the open sea round a small sandy island, palms, and the seven named places of the treasure
// maps (old boat, big palm tree, big rock, stone hut, red flag, campfire, cave), each with its English name on a small sign.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { MARKS } from '../core/regions/isle.js';
import { waterMaterial, bake, label } from './common.js';
import { palm } from './harbor.js';

const M = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const mesh = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
const lumpy = (geo, amp, k) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + amp * Math.sin(p.getX(i) * 2.3 + k) * Math.cos(p.getZ(i) * 2.1 - k) * Math.sin(p.getY(i) * 1.7 + k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f); } geo.computeVertexNormals(); return geo; };

export async function isleExtras(add, loadModel, shadowed) {
  const seaGeo = new THREE.PlaneGeometry(1000, 1000, 1, 1); seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, waterMaterial(false)); sea.position.set(0, L.WATER_LEVEL, 0); add(sea);
  const gh = (x, z) => L.groundHeight(x, z), still = new THREE.Group(), live = new THREE.Group(), M0 = MARKS;
  // the old boat: a hull half sunk in the sand, tilted
  { const { x, z } = M0.boat; let boat = null; try { boat = shadowed(await loadModel('prop_boat_v01')); } catch { /* the plain hull below */ }
    if (boat) { boat.position.set(x, gh(x, z) - 0.15, z); boat.rotation.set(0.12, 0.7, 0.2); boat.scale.setScalar(1.5); add(boat); }
    else { const h = mesh(still, new THREE.BoxGeometry(3.4, 0.9, 1.4), M(0x7a4a2a), x, gh(x, z) + 0.3, z); h.rotation.set(0.1, 0.7, 0.2); } }
  palm(still, M0.palm.x, M0.palm.z, 3);
  // the big rock
  { const { x, z } = M0.rock; const r = mesh(still, lumpy(new THREE.IcosahedronGeometry(2, 1), 0.12, 2), M(0x8f8c9c, 0.95, { flatShading: true }), x, gh(x, z) + 1.0, z); r.scale.set(1.15, 0.85, 1); }
  // the stone hut with a thatch roof
  { const { x, z } = M0.hut, y = gh(x, z); mesh(still, new THREE.BoxGeometry(3.8, 2.2, 3.2), M(0xb0a898, 0.95), x, y + 1.1, z); mesh(still, new THREE.ConeGeometry(3.1, 1.6, 4), M(0xc8a050, 1), x, y + 3.0, z).rotation.y = Math.PI / 4; mesh(still, new THREE.BoxGeometry(0.9, 1.5, 0.12), M(0x4a2a14), x - 1.95, y + 0.75, z); }
  // the red flag (it waves)
  { const { x, z } = M0.flag, y = gh(x, z); mesh(still, new THREE.CylinderGeometry(0.06, 0.08, 4, 8), M(0xe8e0d0), x, y + 2, z); const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9, 8, 1), M(0xe2302a, 0.7, { side: THREE.DoubleSide })); cloth.position.set(x + 0.75, y + 3.5, z); live.add(cloth); live.userData.cloth = cloth; }
  // the campfire (it flickers)
  { const { x, z } = M0.fire, y = gh(x, z); for (let i = 0; i < 8; i++) { const a = i * 0.785; mesh(still, new THREE.SphereGeometry(0.2, 8, 6), M(0x8a8a90), x + Math.cos(a) * 0.7, y + 0.12, z + Math.sin(a) * 0.7); }
    for (const a of [0, 1.2, 2.4]) { const l = mesh(still, new THREE.CylinderGeometry(0.07, 0.07, 0.9, 6), M(0x5a3416), x, y + 0.2, z); l.rotation.set(1.2, a, 0); }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xffb030 })); flame.position.set(x, y + 0.65, z); live.add(flame); live.userData.flame = flame; }
  // the cave: a dark mound with a black mouth facing the beach
  { const { x, z } = M0.cave, y = gh(x, z); mesh(still, lumpy(new THREE.SphereGeometry(3.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0.1, 5), M(0x6a6672, 0.95, { flatShading: true }), x, y, z); const mouth = new THREE.Mesh(new THREE.CircleGeometry(1.2, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a0a10, side: THREE.DoubleSide })); mouth.position.set(x - 2.6, y + 0.05, z); mouth.rotation.y = -Math.PI / 2; live.add(mouth); }
  // more palms and a few shells for the beach
  [[-14, -6], [-16, 14], [8, -4], [20, 10], [22, -4], [-2, 16], [10, -22], [-4, -20]].filter(([x, z]) => L.walkable(x, z, 1) && L.pathDistance(x, z) > 2.5).forEach(([x, z], k) => palm(still, x, z, k));
  add(bake(still));
  for (const [id, m] of Object.entries(M0)) { const n = label(m.en, { size: 26, scale: 0.7 }); n.position.set(m.x, gh(m.x, m.z) + (id === 'palm' ? 6.2 : id === 'hut' ? 4.4 : id === 'flag' ? 4.8 : id === 'boat' ? 2.8 : id === 'cave' ? 3.6 : 3.4), m.z); add(n); }
  const title = label('TREASURE ISLE', { size: 30, scale: 0.9 }); title.position.set(-18, gh(-18, 2) + 3.2, 2); add(title);
  live.userData.update = (t) => {
    const c = live.userData.cloth; if (c) { const p = c.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 3 - t * 5) * 0.12 * (p.getX(i) + 0.7)); p.needsUpdate = true; }
    const f = live.userData.flame; if (f) { f.scale.set(1 + Math.sin(t * 13) * 0.12, 1 + Math.sin(t * 9) * 0.18, 1 + Math.cos(t * 11) * 0.12); }
  };
  add(live);
}
