// A small camp shop stall (Willow's, in the Forest of Memories): four posts, a striped green awning, a counter with
// crates, lanterns and a name board. Built from simple shapes and merged into a few meshes.
import * as THREE from 'three';
import { bake } from './common.js';

export function campStall(x, y, z, yaw) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.85 }), dark = new THREE.MeshStandardMaterial({ color: 0x5a3416, roughness: 0.9 });
  const add = (geo, m, px, py, pz, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.y = ry; g.add(o); return o; };
  for (const [px, pz] of [[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8]]) add(new THREE.CylinderGeometry(0.07, 0.08, 2.5, 7), wood, px, 1.25, pz);
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.55, 0.06, 2.0), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x3f8a3a : 0xf2ead2, roughness: 0.8 }), -1.38 + i * 0.55, 2.55, 0).rotation.z = 0.08;
  add(new THREE.BoxGeometry(3.1, 0.9, 0.7), dark, 0, 0.45, 0.85); add(new THREE.BoxGeometry(3.2, 0.08, 0.8), wood, 0, 0.92, 0.85);
  const crate = new THREE.BoxGeometry(0.45, 0.35, 0.45);
  for (const [px, col] of [[-1.0, 0x8fbf4a], [-0.35, 0xd8483a], [0.35, 0x9a6a3a], [1.0, 0xe8c040]]) { add(crate, wood, px, 1.14, 0.8); add(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }), px, 1.34, 0.8); }
  add(new THREE.BoxGeometry(2.0, 0.5, 0.06), new THREE.MeshStandardMaterial({ color: 0xf6e2b0, roughness: 0.8 }), 0, 2.15, 0.82);
  const out = bake(g);
  for (const px of [-1.5, 1.5]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffb040, emissiveIntensity: 1.4 })); l.position.set(px, 2.1, 0.95); out.add(l); }
  out.position.set(x, y, z); out.rotation.y = yaw; return out;
}
