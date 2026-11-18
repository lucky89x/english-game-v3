// Worn equipment shown on Ngọc: armour on the chest bone, the charm on the hip. Simple shapes in the game's palette,
// rebuilt whenever the bag changes. Sizes are in the chest bone's space (about metres; y up the spine, z forward).
import * as THREE from 'three';

const mat = (color, metal = 0, rough = 0.7) => new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
export const ARMOR_LOOK = {
  leather_vest: { body: 0x8a5228, trim: 0x5f3519, metal: 0, pads: false },
  iron_armor: { body: 0xb8c0ca, trim: 0xe2b04a, metal: 0.75, pads: true },
  ranger_cloak: { body: 0x3f7a3a, trim: 0xc9a24a, metal: 0, pads: false },
  bark_armor: { body: 0x6a4a2a, trim: 0x7fc24a, metal: 0, pads: true },
};
/** Fit values, tuned with tests/look.mjs ngoc_front / ngoc_side. */
export const FIT = { y: 0.05, r: 0.155, h: 0.22, depth: 0.82, padX: 0.17, padY: 0.17 };
export function armorMesh(id) {
  const look = ARMOR_LOOK[id]; if (!look) return null;
  const g = new THREE.Group(), body = mat(look.body, look.metal, look.metal ? 0.35 : 0.8), trim = mat(look.trim, look.metal ? 0.8 : 0, 0.5);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(FIT.r, FIT.r * 1.08, FIT.h, 20, 1, true), body);
  shell.material.side = THREE.DoubleSide; shell.scale.z = FIT.depth; shell.position.y = FIT.y; g.add(shell);
  for (const y of [FIT.y + FIT.h / 2, FIT.y - FIT.h / 2]) { const band = new THREE.Mesh(new THREE.TorusGeometry(y > FIT.y ? FIT.r : FIT.r * 1.08, 0.012, 6, 24), trim); band.rotation.x = Math.PI / 2; band.scale.y = FIT.depth; band.position.y = y; g.add(band); }
  if (look.pads) for (const s of [-1, 1]) { const pad = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), body); pad.scale.set(1.1, 0.7, 1); pad.position.set(s * FIT.padX, FIT.padY, 0); pad.rotation.z = -s * 0.5; g.add(pad); }
  else { const lace = new THREE.Mesh(new THREE.BoxGeometry(0.012, FIT.h * 0.8, 0.01), trim); lace.position.set(0, FIT.y, FIT.r * FIT.depth + 0.004); g.add(lace); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function charmMesh() {
  const g = new THREE.Group(), leaf = mat(0x4fb84a, 0, 0.5);
  for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), leaf); const a = k * Math.PI / 2 + 0.78; l.position.set(Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0); l.scale.z = 0.4; g.add(l); }
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 4), mat(0xe2b04a, 0.6)); cord.position.y = 0.05; g.add(cord);
  return g;
}
