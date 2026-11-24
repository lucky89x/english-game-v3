// The landmark of each mini game (24/11): the place has a building you can see from afar, not only a sign. Built from a few boxes and cylinders,
// shared materials, no textures. `siteBuilding(kind)` returns a Group whose front faces +z; the caller sets position and yaw.
import * as THREE from 'three';

const mat = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.22, roughness: 0.8, ...o });      // a little self-light so the pale walls do not turn grey in shade
const M = { cream: mat(0xfff0d6), wood: mat(0x9a6a3a), dark: mat(0x5a3a1c), pink: mat(0xff7aa8), white: mat(0xffffff), red: mat(0xe0443a), blue: mat(0x3a7ae0), green: mat(0x4cbf5a), yellow: mat(0xffc93a), black: mat(0x222222), purple: mat(0x9a5ae0), orange: mat(0xff8a3a) };

function builder() {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const box = (w, h, d, m, x, y, z, ry = 0) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z, 0, ry, 0);
  const cyl = (r1, r2, h, m, x, y, z, seg = 10) => add(new THREE.CylinderGeometry(r1, r2, h, seg), m, x, y, z);
  return { g, add, box, cyl };
}

const KINDS = {
  /** A sweet shop: a cream cottage, a striped awning, a pyramid roof and a giant lollipop on top. */
  candy() {
    const { g, box, cyl, add } = builder();
    box(3.6, 2.6, 3.0, M.cream, 0, 1.3, 0); box(3.9, 0.25, 3.3, M.pink, 0, 2.7, 0);
    add(new THREE.ConeGeometry(2.9, 1.6, 4), M.pink, 0, 3.6, 0, 0, Math.PI / 4, 0);
    for (let i = 0; i < 6; i++) box(0.62, 0.12, 1.3, i % 2 ? M.white : M.red, -1.55 + i * 0.62, 2.15 - i * 0.02, 1.95);
    box(1.0, 1.7, 0.1, M.wood, 0, 0.85, 1.52); box(1.1, 0.7, 0.1, M.yellow, 1.0, 1.5, 1.52); box(1.1, 0.7, 0.1, M.yellow, -1.0, 1.5, 1.52);
    cyl(0.07, 0.07, 1.6, M.white, 0, 5.1, 0, 6); add(new THREE.SphereGeometry(0.55, 14, 10), M.red, 0, 6.0, 0).scale.set(1, 1, 0.35);
    for (const [x, c] of [[-1.5, M.pink], [1.5, M.blue]]) { add(new THREE.SphereGeometry(0.28, 10, 8), c, x, 0.28, 1.9); }
    return g;
  },
  /** A shooting range: a raised wooden stand with a banner and three round targets on stakes in front of it. */
  range() {
    const { g, box, cyl, add } = builder();
    box(3.4, 0.5, 2.0, M.wood, 0, 0.25, 0); box(0.14, 2.6, 0.14, M.dark, -1.55, 1.8, -0.7); box(0.14, 2.6, 0.14, M.dark, 1.55, 1.8, -0.7); box(3.5, 0.18, 1.0, M.dark, 0, 3.1, -0.6);
    box(2.6, 0.9, 0.06, M.red, 0, 2.5, -0.72);
    for (const [x, z] of [[-2.6, 5], [0, 7], [2.6, 5]]) { cyl(0.05, 0.05, 1.6, M.dark, x, 0.8, z, 6); const t = new THREE.Group();
      for (const [r, m] of [[0.7, M.white], [0.5, M.red], [0.3, M.white], [0.14, M.red]]) { const d = add(new THREE.CylinderGeometry(r, r, 0.08, 20), m, 0, 0, 0, Math.PI / 2, 0, 0); g.remove(d); d.position.set(0, 0, 0.04 * (0.7 - r) * 4); t.add(d); }
      t.position.set(x, 1.7, z); g.add(t); }
    return g;
  },
  /** The start arch of the cart race: two posts, a chequered beam and a flag on each side. */
  arch() {
    const { g, box, cyl, add } = builder();
    box(0.5, 4.2, 0.5, M.white, -2.4, 2.1, 0); box(0.5, 4.2, 0.5, M.white, 2.4, 2.1, 0);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) box(0.52, 0.4, 0.5, (i + j) % 2 ? M.black : M.white, -2.34 + i * 0.52, 4.0 + j * 0.4, 0);
    for (const x of [-2.4, 2.4]) { cyl(0.04, 0.04, 1.8, M.dark, x, 5.4, 0, 6); box(0.9, 0.55, 0.04, x < 0 ? M.red : M.blue, x + (x < 0 ? 0.5 : -0.5), 6.0, 0); }
    box(5.4, 0.1, 1.4, M.red, 0, 0.05, 0);
    return g;
  },
  /** A tower of coloured blocks, a little crooked, as high as a house. */
  tower() {
    const { g, box } = builder();
    const cols = [M.red, M.blue, M.green, M.yellow, M.purple, M.orange];
    let y = 0.5;
    for (let i = 0; i < 6; i++) { const w = 2.2 - i * 0.18; box(w, 1.0, w, cols[i % cols.length], Math.sin(i * 1.7) * 0.18, y, Math.cos(i * 1.3) * 0.12, i * 0.12); y += 1.0; }
    box(0.9, 0.9, 0.9, M.cream, 0.05, y + 0.2, 0, 0.5); box(0.8, 0.8, 0.8, M.cream, 1.7, 0.4, 1.2, 0.3); box(0.8, 0.8, 0.8, M.pink, -1.7, 0.4, 1.0, -0.3);
    return g;
  },
};

/** kind: 'candy' | 'range' | 'arch' | 'tower'. */
export const SITE_SCALE = 1.45;
export function siteBuilding(kind) { const g = (KINDS[kind] || KINDS.tower)(); g.scale.setScalar(SITE_SCALE); return g; }
