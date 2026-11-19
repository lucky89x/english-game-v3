// Pieces from the wardrobe worn on Ngọc (19/11): simple shapes in the game's palette fixed to her bones, rebuilt whenever the
// wardrobe changes. Sizes are in the bone's space (about metres; y up the bone, z forward). Tuned with a close-up look.
import * as THREE from 'three';
import { COLORS } from '../ui/style.js';
import { KINDS, JEWEL_HEX } from '../core/wardrobe.js';

const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; return o; };
/** FIT: where each piece sits (head bone: y up from the neck, z forward). */
export const FIT = { headY: 0.58, headR: 0.33, eyeY: 0.2, faceZ: 0.28 };      // the chibi head is big: bone origin at the neck, skull centre about 0.34 up, top about 0.64
/** Returns [{ bone: RegExp, obj }] for one piece of a colour name. */
export function outfitParts(kind, colorName) {
  const col = new THREE.Color(COLORS[colorName] || JEWEL_HEX[colorName] || '#ffffff'), m = std(col), dark = std(0x2a2a30, 0.5), g = new THREE.Group();
  if (!KINDS[kind]) return [];
  if (kind === 'hat') {
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.2, 24), m, 0, FIT.headY + 0.13, 0)); g.add(mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.03, 32), m, 0, FIT.headY + 0.03, 0.02));
    const band = mesh(new THREE.TorusGeometry(0.245, 0.02, 6, 28), std(0xffffff, 0.5)); band.rotation.x = Math.PI / 2; band.position.y = FIT.headY + 0.08; g.add(band); g.rotation.x = -0.1;
    return [{ bone: /^head$/, obj: g }];
  }
  if (kind === 'bow') {
    for (const s of [-1, 1]) { const w = mesh(new THREE.ConeGeometry(0.1, 0.2, 4), m, s * 0.11, 0, 0); w.rotation.z = -s * Math.PI / 2; g.add(w); }
    g.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), std(col.clone().multiplyScalar(0.7)))); g.position.set(0.27, FIT.headY - 0.02, 0.05); g.rotation.set(0, -0.6, 0.3);
    return [{ bone: /^head$/, obj: g }];
  }
  if (kind === 'headband') {
    const t = mesh(new THREE.TorusGeometry(FIT.headR + 0.02, 0.03, 8, 36), m); t.rotation.x = Math.PI / 2; t.position.y = FIT.headY - 0.02; g.add(t); g.rotation.x = -0.25;
    g.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), std(0xffe28a, 0.3, 0.6), 0, FIT.headY + 0.02, FIT.headR + 0.04));
    return [{ bone: /^head$/, obj: g }];
  }
  if (kind === 'glasses') {
    for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(0.085, 0.016, 8, 24), m, s * 0.125, FIT.eyeY, FIT.faceZ); g.add(r); const l = mesh(new THREE.CircleGeometry(0.08, 20), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.3 }), s * 0.125, FIT.eyeY, FIT.faceZ); g.add(l); }
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.016, 0.016), m, 0, FIT.eyeY + 0.03, FIT.faceZ)); return [{ bone: /^head$/, obj: g }];
  }
  if (kind === 'scarf') {
    const t = mesh(new THREE.TorusGeometry(0.1, 0.04, 8, 20), m); t.rotation.x = Math.PI / 2; g.add(t); g.add(mesh(new THREE.BoxGeometry(0.08, 0.2, 0.025), m, 0.05, -0.1, 0.1)); g.position.y = 0.03;
    return [{ bone: /^neck$/, obj: g }];
  }
  if (kind === 'bag') {
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.28, 0.1), m, 0, 0, -0.16)); g.add(mesh(new THREE.BoxGeometry(0.2, 0.08, 0.11), std(col.clone().multiplyScalar(0.8)), 0, 0.12, -0.16));
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.025, 0.3, 0.02), dark, s * 0.07, 0.02, -0.08)); g.position.y = 0.04;
    return [{ bone: /^chest$/, obj: g }];
  }
  if (kind === 'bracelet') {
    const t = mesh(new THREE.TorusGeometry(0.075, 0.025, 8, 20), m); t.rotation.x = Math.PI / 2; t.position.y = 0.1; g.add(t); return [{ bone: /^forearm.?L$/, obj: g }];
  }
  // jewellery (19/11, Mia's shop): drawn here until the Blender pieces (batch 19) arrive. Metal colours are all metal;
  // a gem colour gets a gold setting with the coloured stone.
  const metalCol = JEWEL_HEX[colorName] ? col : new THREE.Color(JEWEL_HEX.gold), metal = std(metalCol, 0.28, 0.85);
  const gem = JEWEL_HEX[colorName] ? metal : new THREE.MeshStandardMaterial({ color: col, roughness: 0.15, metalness: 0.1, emissive: col, emissiveIntensity: 0.25 });
  if (kind === 'necklace') {
    const t = mesh(new THREE.TorusGeometry(0.135, 0.008, 6, 36), metal); t.rotation.x = Math.PI / 2 - 0.35; g.add(t);
    const drop = mesh(new THREE.OctahedronGeometry(0.035), gem, 0, -0.06, 0.13); drop.scale.y = 1.4; g.add(drop); g.position.y = -0.02;
    return [{ bone: /^neck$/, obj: g }];
  }
  if (kind === 'earrings') {
    for (const s of [-1, 1]) { g.add(mesh(new THREE.SphereGeometry(0.014, 8, 6), metal, s * (FIT.headR + 0.005), 0.13, 0.02)); const d = mesh(new THREE.OctahedronGeometry(0.026), gem, s * (FIT.headR + 0.008), 0.085, 0.02); d.scale.y = 1.5; g.add(d); }
    return [{ bone: /^head$/, obj: g }];
  }
  if (kind === 'tiara') {
    const band = mesh(new THREE.TorusGeometry(FIT.headR - 0.02, 0.016, 6, 30, Math.PI), metal); band.rotation.set(-Math.PI / 2 + 0.25, 0, 0); band.position.y = FIT.headY - 0.01; g.add(band);
    for (const [a, h] of [[0, 0.11], [0.45, 0.07], [-0.45, 0.07], [0.85, 0.045], [-0.85, 0.045]]) {
      const x = Math.sin(a) * (FIT.headR - 0.02), z = Math.cos(a) * (FIT.headR - 0.02) * 0.97;
      const spike = mesh(new THREE.ConeGeometry(0.022, h, 6), metal, x, FIT.headY + h / 2, z - 0.02); g.add(spike);
      if (a === 0) g.add(mesh(new THREE.OctahedronGeometry(0.03), gem, x, FIT.headY + 0.02, z + 0.01));
    }
    g.rotation.x = -0.12; return [{ bone: /^head$/, obj: g }];
  }
  if (kind === 'hairclip') {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), gem, Math.cos(a) * 0.035, Math.sin(a) * 0.035, 0)); }
    g.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), metal)); g.position.set(-0.27, FIT.headY - 0.06, 0.13); g.rotation.set(0, -0.7, 0);
    return [{ bone: /^head$/, obj: g }];
  }
  if (kind === 'shoes') {
    return ['L', 'R'].map((s) => { const o = new THREE.Group(); const sh = mesh(new THREE.SphereGeometry(0.1, 14, 10), m, 0, -0.02, 0.08); sh.scale.set(1.05, 0.75, 1.9); o.add(sh); return { bone: new RegExp(`^foot.?${s}$`), obj: o }; });
  }
  return [];
}
