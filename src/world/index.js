// Builds the scenery of the current region (core/layout.js): shared ground, water and plants from common.js, then
// the region's own landmarks (village.js or forest.js). Returns handles for detail level, bridges and jar labels.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { label, buildTerrain, buildCobbles, buildWater, buildTrees, buildRocks, buildGrass, buildFlowers, buildFences, mountains, critters, fallRocks, riverside, bushes, creatures } from './common.js';
import { MARKET_JARS, villageExtras, brokenBits } from './village.js';
import { forestExtras } from './forest.js';

export async function buildWorld(scene, loadModel) {
  const root = new THREE.Group(); root.name = 'world:' + L.NAME; scene.add(root);
  const updaters = [], add = (o) => { root.add(o); if (o.userData.update) updaters.push(o.userData.update); return o; };
  add(buildTerrain());
  const detail = { cobbles: add(buildCobbles()), grass: add(buildGrass()), flowers: add(buildFlowers()), far: add(mountains()), critters: add(critters()) };
  add(buildWater()); add(buildTrees()); add(buildRocks()); add(buildFences()); add(riverside()); add(bushes()); add(creatures()); if (L.WATERFALL) add(fallRocks());
  const shadowed = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
  const bridges = {};
  for (const b of L.BRIDGES) {
    const m = shadowed(await loadModel('prop_bridge_curved_v02'));
    const base = (L.groundHeight(b.x - L.BRIDGE_LEN / 2 - 0.9, b.z) + L.groundHeight(b.x + L.BRIDGE_LEN / 2 + 0.9, b.z)) / 2;
    m.position.set(b.x, base, b.z); m.rotation.y = Math.PI / 2; add(m);
    bridges[b.id] = { model: m, bridge: b, broken: add(brokenBits(b, base)) };
  }
  // A closed bridge: its middle is clipped away (own material copies, so the other bridge is untouched),
  // loose planks float below and a warning sign stands at the west end.
  const setBridgeOpen = (id, open) => {
    const e = bridges[id]; if (!e) return;
    if (!e.own) { e.own = true; e.model.traverse((c) => { if (c.isMesh) c.material = Array.isArray(c.material) ? c.material.map((m) => m.clone()) : c.material.clone(); }); }
    const gap = 1.7, x = e.bridge.x;
    const planes = open ? [] : [new THREE.Plane(new THREE.Vector3(-1, 0, 0), x - gap), new THREE.Plane(new THREE.Vector3(1, 0, 0), -(x + gap))];
    e.model.traverse((c) => { if (c.isMesh) [].concat(c.material).forEach((m) => { m.clippingPlanes = planes; m.clipIntersection = true; m.needsUpdate = true; }); });
    e.broken.visible = !open;
  };
  for (const b of L.BRIDGES) setBridgeOpen(b.id, b.open);
  if (L.NAME === 'forest') await forestExtras(add, loadModel, shadowed); else await villageExtras(add, loadModel, shadowed);
  // jar labels (village market): four pooled sprites, text swapped per customer
  const jarLabels = [];
  return {
    root, detail, setBridgeOpen,
    update(t) { for (const u of updaters) u(t); },
    setDetail(density, particles, far) {
      for (const k of ['grass', 'flowers']) detail[k].count = Math.floor(detail[k].userData.full * density);
      detail.cobbles.count = Math.floor(detail.cobbles.userData.full * Math.max(0.5, density));
      root.traverse((o) => { if (o.userData.particles) o.visible = particles; });
      detail.far.visible = far;
    },
    setJars(texts) {
      for (const s of jarLabels.splice(0)) { root.remove(s); s.material.map.dispose(); s.material.dispose(); }
      if (!texts) return;
      texts.forEach((text, i) => { const [x, z] = MARKET_JARS[i], s = label(text, { size: 30, scale: 0.62 }); s.position.set(x, L.groundHeight(x, z) + 2.0, z); s.material.depthTest = false; s.renderOrder = 5; root.add(s); jarLabels.push(s); });
    },
    dispose() {
      scene.remove(root);
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map && m.map.isCanvasTexture) m.map.dispose(); m.dispose(); }); });
    },
  };
}

export { TIME, compact, label } from './common.js';
export { bridgeItem, MARKET_JARS } from './village.js';
