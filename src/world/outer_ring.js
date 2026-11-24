// (24/11) New cottages and plants in the outer ring of the harbour and forest maps (the village has its own in homes.js and plants.js).
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { OUTER } from '../core/regions/outer.js';
import { buildPlants } from './plants.js';

/** load(name) -> Promise<Object3D>. Returns { harbor: Group, forest: Group }; main.js shows the one of the map being played. */
export async function buildOuter(load) {
  const out = {};
  for (const name of Object.keys(OUTER)) {
    const g = new THREE.Group(); g.name = 'outer-' + name; g.visible = false; out[name] = g;
    const R = L.REGIONS[name];
    for (const b of OUTER[name]) {
      try {
        const m = await load(b.file); m.position.set(b.x, R.groundHeight(b.x, b.z) - 0.05, b.z); m.rotation.y = b.yaw; m.scale.setScalar(b.scale);
        m.traverse((c) => { if (c.isMesh) c.castShadow = c.receiveShadow = true; }); g.add(m);
      } catch (e) { /* a missing house file: the others still stand */ }
    }
    try { g.add(await buildPlants(load, name)); } catch (e) { console.warn('plants ' + name, e); }
  }
  return out;
}
