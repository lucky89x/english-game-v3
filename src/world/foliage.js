// Soft crowns for the user's plant pack (25/11: "the trees and bushes look bad, the leaves are laid out badly"). The pack's trees and bushes
// build their crowns from big flat leaf cards, which read as a pile of paper triangles. Here the leafy part (the mesh named "Plant") is
// replaced by a trunk and a crown of a few smooth, gently lumpy balls coloured darker underneath and lighter on top; the fruit, berry
// and flower pieces of the pack stay where they were. Pure geometry with vertex colours, so the instanced drawing in plants.js keeps working.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const C = (hex) => new THREE.Color(hex);

/** One leafy ball: smooth, a few soft bumps, darker underneath, lighter on top. */
function blob(r, x, y, z, low, high, seed, sy = 0.88) {
  let g = new THREE.IcosahedronGeometry(r, 2);      // (26/11) detail 3 was 1,280 triangles a blob (a tree ~3,000, a bush ~1,600, hundreds of them); 2 is 320 and looks the same from the path
  g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const p = g.attributes.position, col = [], v = new THREE.Vector3(), a = C(low), b = C(high), c = new THREE.Color(), k = seed * 1.7;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const n = v.clone().normalize();
    const bump = 1 + 0.09 * Math.sin(n.x * 5.1 + k) * Math.sin(n.y * 4.3 + k * 0.7) + 0.06 * Math.sin(n.z * 7.7 - k) * Math.cos(n.x * 6.1 + k * 1.3);
    v.copy(n).multiplyScalar(r * bump); v.y *= sy; p.setXYZ(i, x + v.x, y + v.y, z + v.z);
    const t = Math.max(0, Math.min(1, (n.y + 0.7) / 1.5)); c.copy(a).lerp(b, t * t * (3 - 2 * t)).offsetHSL(0, 0, 0.03 * Math.sin(n.x * 9 + n.z * 7 + k));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
/** A tapered limb from point a to point b (vertex colours; birch bark gets dark marks). */
function limb(a, b, r0, r1, hex, birch = false) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(), g = new THREE.CylinderGeometry(r1, r0, len, 9, 6, true).toNonIndexed();
  g.translate(0, len / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate(a.x, a.y, a.z);
  const p = g.attributes.position, col = [], base = C(hex), dark = C(0x3a2f2a), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), ang = Math.atan2(p.getZ(i) - a.z, p.getX(i) - a.x); c.copy(base).offsetHSL(0, 0, -0.04 + 0.05 * Math.sin(y * 6 + ang * 2));
    if (birch && Math.sin(y * 9.3 + Math.sin(ang * 3) * 1.4) > 0.82) c.lerp(dark, 0.85);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.deleteAttribute('uv'); g.computeVertexNormals(); return g;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** The leafy geometry of each restyled plant, sized like the pack's own mesh (so its fruit and berries sit on the surface). */
const BUILD = {
  tree_apple(r) {      // a round, full fruit tree: a thick brown trunk with three limbs and a crown of seven balls (pack size 3.7 x 3.7 m)
    const parts = [limb(V(0, 0, 0), V(0.05, 1.7, -0.1), 0.26, 0.18, 0x7a5032)];
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; parts.push(limb(V(0.05, 1.5, -0.1), V(Math.cos(a) * 0.8, 2.35, Math.sin(a) * 0.8 - 0.15), 0.13, 0.07, 0x7a5032)); }
    const cx = 0.13, cz = -0.18;
    parts.push(blob(1.15, cx, 2.62, cz, 0x2f6e2a, 0x7cc24a, 1));
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + r() * 0.4, d = 0.95 + r() * 0.15; parts.push(blob(0.78 + r() * 0.12, cx + Math.cos(a) * d, 2.2 + r() * 0.55, cz + Math.sin(a) * d, 0x2f6e2a, 0x86c850, i + 2)); }
    parts.push(blob(0.7, cx + 0.1, 3.15, cz - 0.05, 0x3d8030, 0x9bd65a, 9));
    return parts;
  },
  tree_birch(r) {      // a tall, light birch: a slender white trunk with dark marks and a loose, airy crown (pack size 3.1 x 4.0 m)
    const parts = [limb(V(0, 0, 0), V(0.05, 2.9, 0.02), 0.17, 0.09, 0xeeeae0, true)];
    for (let i = 0; i < 3; i++) { const a = i * 2.3 + 0.8; parts.push(limb(V(0.04, 1.9 + i * 0.3, 0.01), V(Math.cos(a) * 0.75, 2.75 + i * 0.25, Math.sin(a) * 0.75), 0.07, 0.035, 0xeeeae0, true)); }
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + r() * 0.5, d = i ? 0.55 + r() * 0.35 : 0, y = i ? 2.75 + r() * 0.85 : 3.3; parts.push(blob(i ? 0.55 + r() * 0.15 : 0.75, Math.cos(a) * d, y, Math.sin(a) * d - 0.15, 0x6f9a32, 0xc8e070, i + 20, 1.05)); }
    return parts;
  },
  bush(r, seed) {      // a low, round bush of five balls (pack size 1.3 x 1.0 m)
    const parts = [blob(0.46, 0, 0.47, 0.02, 0x2f6a28, 0x78bb46, seed)];
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + r() * 0.5; parts.push(blob(0.33 + r() * 0.05, Math.cos(a) * 0.33, 0.34 + r() * 0.1, Math.sin(a) * 0.33, 0x2f6a28, 0x80c24c, seed + i + 1)); }
    return parts;
  },
};
/** Little white five-petal flowers dotted over a bush (the pack's flower bush had them baked into its leaves). */
function flowers(seed, n = 8) {
  const r = rng(seed), petals = [], cores = [];
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, up = 0.2 + r() * 0.7, d = Math.sqrt(1 - Math.min(1, up * up * 0.5)), cx = Math.cos(a) * 0.62 * d, cy = 0.42 + up * 0.42, cz = Math.sin(a) * 0.62 * d;
    const n0 = V(cx, cy - 0.35, cz).normalize(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n0);
    for (let k = 0; k < 5; k++) { const pg = new THREE.SphereGeometry(0.045, 5, 3); pg.scale(1, 0.25, 0.6); pg.translate(0.05, 0, 0); pg.rotateY(k * 1.2566); pg.applyQuaternion(q); pg.translate(cx, cy, cz); petals.push(pg); }
    const cg = new THREE.SphereGeometry(0.025, 5, 3); cg.applyQuaternion(q); cg.translate(cx + n0.x * 0.012, cy + n0.y * 0.012, cz + n0.z * 0.012); cores.push(cg);
  }
  const mp = new THREE.Mesh(mergeGeometries(petals), new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.7 }));
  const mc = new THREE.Mesh(mergeGeometries(cores), new THREE.MeshStandardMaterial({ color: 0xf2b82a, roughness: 0.6 }));
  return [mp, mc];
}
const LEAF_MAT = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 });

/** Replaces the leafy mesh of a pack model in place (name: the file name). Returns true when it was restyled. */
export function restyle(name, scene) {
  const kind = name === 'tree_apple' ? 'tree_apple' : name === 'tree_birch' ? 'tree_birch' : /^bush_/.test(name) ? 'bush' : null; if (!kind || !scene) return false;
  const leafy = scene.getObjectByName('Plant'); if (!leafy || !leafy.isMesh) return false;
  const seed = name.length * 31, parts = BUILD[kind](rng(seed), seed), geo = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
  const m = new THREE.Mesh(geo, LEAF_MAT()); m.name = 'Plant'; m.position.copy(leafy.position); m.quaternion.copy(leafy.quaternion); m.scale.copy(leafy.scale);
  leafy.parent.add(m); leafy.removeFromParent();
  if (kind === 'tree_apple') scene.traverse((o) => { if (/^Apple_/.test(o.name)) { const dx = o.position.x - 0.13, dz = o.position.z + 0.18, d = Math.hypot(dx, dz) || 1, want = Math.max(d, 1.9); o.position.x = 0.13 + dx / d * want; o.position.z = -0.18 + dz / d * want; o.position.y = Math.min(o.position.y, 2.35); } });      // the fruit sits on the crown's skin, not inside it
  if (name === 'bush_white_flowers') for (const f of flowers(seed)) { f.position.copy(m.position); m.parent.add(f); }
  scene.updateMatrixWorld(true); return true;
}
