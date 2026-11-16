// Forest of Memories landmarks: the ancient tree, mushrooms, camp, cave, ruins, tower, cottage and gate.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { R, tint, at, lumpy, std, windy, label, bake, leafyGeo, glowMat, lantern, lampPost, signs } from './common.js';

export function ancientTree() {
  const g = new THREE.Group(), y0 = L.groundHeight(17, -30);
  const prof = [[3.6, 0], [2.7, 0.8], [2.15, 2.2], [1.85, 4.5], [1.7, 7], [1.9, 9.2]].map(([r, y]) => new THREE.Vector2(r, y));
  const parts = [tint(lumpy(new THREE.LatheGeometry(prof, 18), 0.05, 2), 0x8a5a30, 0.2)];
  for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3; parts.push(tint(at(new THREE.CylinderGeometry(0.25, 0.85, 4.4, 7), Math.cos(a) * 3.3, 0.5, Math.sin(a) * 3.3, 1, 1, 1, -a, 0, 1.15), 0x7a4c28, 0.2)); }
  for (let i = 0; i < 6; i++) { const a = i * 1.047; parts.push(tint(at(new THREE.CylinderGeometry(0.35, 0.75, 6.5, 7), Math.cos(a) * 3.0, 10.6, Math.sin(a) * 3.0, 1, 1, 1, -a, 0, -0.75), 0x7a4c28, 0.2)); }
  const pal = [0x4faa3a, 0x86cf45, 0xc4e454];
  for (let i = 0; i < 30; i++) {
    const yy = 1 - ((i + 0.5) / 30) * 1.45, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = i * 2.399, s = R(2.4, 3.6);
    parts.push(tint(at(lumpy(new THREE.IcosahedronGeometry(s, 1), 0.13, i), Math.cos(a) * rr * 8.2, 13.5 + yy * 4.6, Math.sin(a) * rr * 8.2), pal[yy > 0.3 ? 2 : yy > -0.25 ? 1 : 0], 0.15));
  }
  const tree = new THREE.Mesh(mergeGeometries(parts), windy(std(), 0.0012)); tree.castShadow = true; tree.receiveShadow = true; g.add(tree);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: 0.8 })); door.position.set(0.9, 1.05, 2.75); door.rotation.y = 0.32; g.add(door);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.33, 12), glowMat(0xffd27a, 1.8)); win.position.set(0.95, 1.5, 2.92); win.rotation.y = 0.32; g.add(win);
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.2, r = 5.5 + (i % 3) * 1.4, h = 7.2 + (i % 2) * 0.9; g.add(lantern(Math.cos(a) * r, h, Math.sin(a) * r)); const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.2, 4), new THREE.MeshBasicMaterial({ color: 0x3b2a1a })); cord.position.set(Math.cos(a) * r, h + 1.3, Math.sin(a) * r); g.add(cord); }
  const glow = new THREE.PointLight(0xffc670, 26, 20, 1.6); glow.position.set(2, 5, 5); g.add(glow);
  g.position.set(17, y0 - 0.2, -30);
  return g;
}
export function mushrooms() {
  const g = new THREE.Group(), stemM = new THREE.MeshStandardMaterial({ color: 0xf3e8d2, roughness: 0.8 }), capM = new THREE.MeshStandardMaterial({ color: 0xdb3a2c, roughness: 0.55 }), dotM = new THREE.MeshStandardMaterial({ color: 0xfff6ea, roughness: 0.6 });
  const one = (x, z, s) => {
    const m = new THREE.Group(), stem = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 2.1, 10), stemM); stem.position.y = 1.05; stem.castShadow = true; m.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.7, 18, 10, 0, 6.283, 0, Math.PI / 2), capM); cap.scale.y = 0.72; cap.position.y = 1.85; cap.castShadow = true; m.add(cap);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 1.5, 0.14, 18), stemM); skirt.position.y = 1.84; m.add(skirt);
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.35 + (i % 3) * 0.42, d = new THREE.Mesh(new THREE.SphereGeometry(0.2 - (i % 3) * 0.03, 8, 6), dotM); d.position.set(Math.cos(a) * r, 1.85 + Math.sqrt(Math.max(0, 1.7 * 1.7 - r * r)) * 0.72 - 0.05, Math.sin(a) * r); d.scale.y = 0.45; m.add(d); }
    m.position.set(x, L.groundHeight(x, z) - 0.05, z); m.scale.setScalar(s); m.rotation.y = R(0, 6.28); g.add(m);
  };
  one(41.5, 19, 1.35); one(43.5, 23.5, 0.95); one(39, 24.5, 0.6);
  for (let i = 0; i < 9; i++) one(40 + R(-5, 5), 21.5 + R(-5, 5), R(0.14, 0.26));
  return g;
}
export function camp() {
  const g = new THREE.Group(), y = L.groundHeight(34, 47);
  const shape = new THREE.Shape(); shape.moveTo(-2, 0); shape.lineTo(2, 0); shape.lineTo(0, 2.6); shape.closePath();
  const tent = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 3.6, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0xf4e4bc, roughness: 0.9 }));
  tent.position.set(36.5 - 0, y, 49.5 - 1.8); tent.rotation.y = -0.5; tent.castShadow = true; g.add(tent);
  const open = new THREE.Mesh(new THREE.CircleGeometry(1.15, 3), new THREE.MeshStandardMaterial({ color: 0x4a3526 })); open.position.set(35.55, y + 0.75, 47.75); open.rotation.y = -0.5 + Math.PI; open.rotation.z = Math.PI / 2; g.add(open);
  const fy = L.groundHeight(31.5, 47.5), stone = new THREE.MeshStandardMaterial({ color: 0xa9a5b2, roughness: 1, flatShading: true });
  for (let i = 0; i < 9; i++) { const a = i * 0.698, s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), stone); s.position.set(31.5 + Math.cos(a) * 0.7, fy + 0.1, 47.5 + Math.sin(a) * 0.7); g.add(s); }
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.9 });
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 6), wood); l.position.set(31.5, fy + 0.22, 47.5); l.rotation.set(Math.PI / 2 - 0.5, i * 2.1, 0); g.add(l); }
  const flames = [];
  for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.2 - i * 0.04, 0.7 - i * 0.12, 7), glowMat(i ? 0xffd24a : 0xff7a2a, 2.6)); f.position.set(31.5 + (i - 1) * 0.12, fy + 0.5, 47.5 + (i % 2) * 0.1); g.add(f); flames.push(f); }
  const fire = new THREE.PointLight(0xff9a40, 20, 14, 1.7); fire.position.set(31.5, fy + 1.1, 47.5); g.add(fire);
  for (const [x, z, r] of [[29.3, 48.8, 0.5], [32.8, 45.2, -0.9]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.7, 9), wood); s.rotation.set(0, r, Math.PI / 2); s.position.set(x, L.groundHeight(x, z) + 0.26, z); s.castShadow = true; g.add(s); }
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xb97d46, roughness: 0.85 })); crate.position.set(38.8, y + 0.4, 46.6); crate.castShadow = true; g.add(crate);
  g.userData.update = (t) => { flames.forEach((f, i) => { f.scale.y = 1 + 0.25 * Math.sin(t * 9 + i * 2); f.scale.x = 1 + 0.12 * Math.sin(t * 13 + i); }); fire.intensity = 18 + 4 * Math.sin(t * 11); };
  return g;
}
export function crystal(hex, s = 1) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.45 * s, 0), glowMat(hex, 2.0)); m.scale.y = 1.7; return m; }
export function cave() {
  const g = new THREE.Group(), y = L.groundHeight(56, 2), rock = std({ flatShading: true });
  const parts = [];
  for (const [x, yy, z, s] of [[0, 1.6, -3.4, 2.6], [0.4, 1.7, 3.5, 2.7], [0.2, 4.9, 0, 3.1], [1.2, 4.2, -2.4, 2.4], [1.2, 4.3, 2.5, 2.4], [-0.3, 0.6, -5.4, 1.5], [-0.2, 0.6, 5.6, 1.6]])
    parts.push(tint(at(lumpy(new THREE.IcosahedronGeometry(s, 1), 0.16, x + z, false), x, yy, z), 0xa29fae, 0.18));
  const arch = new THREE.Mesh(mergeGeometries(parts), rock); arch.castShadow = true; arch.receiveShadow = true; g.add(arch);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(2.3, 16), new THREE.MeshBasicMaterial({ color: 0x0c1830 })); dark.position.set(-0.75, 1.9, 0); dark.rotation.y = -Math.PI / 2; g.add(dark);
  for (const [x, z, s, r] of [[-1.5, -1.5, 1.3, 0.2], [-1.3, 1.6, 1.0, -0.3], [-2.4, 0.6, 0.7, 0.4], [-2.2, -2.6, 0.6, -0.2], [-1.0, 0.2, 0.8, 0]]) { const c = crystal(0x58c8ff, s); c.position.set(x, 0.55 * s, z); c.rotation.z = r; g.add(c); }
  const light = new THREE.PointLight(0x58c8ff, 30, 16, 1.6); light.position.set(-2.2, 1.6, 0); g.add(light);
  g.position.set(57.2, y - 0.3, 2);
  return g;
}
export function ruins() {
  const g = new THREE.Group(), stone = new THREE.MeshStandardMaterial({ color: 0xb7b2c0, roughness: 0.95, flatShading: true }), mossM = new THREE.MeshStandardMaterial({ color: 0x79b84c, roughness: 1 });
  const pillar = (x, z, h) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, h, 9), stone); p.position.set(x, L.groundHeight(x, z) + h / 2 - 0.1, z); p.castShadow = true; g.add(p); const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.5), h > 3 ? stone : mossM); cap.position.set(x, L.groundHeight(x, z) + h, z); g.add(cap); };
  pillar(-47, -43, 4.2); pillar(-41.5, -44.5, 4.2); pillar(-48.5, -37.5, 2.3); pillar(-39.2, -39.2, 1.5);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.7, 1.3), stone); lintel.position.set(-44.25, L.groundHeight(-44, -44) + 4.6, -43.75); lintel.rotation.y = 0.266; lintel.castShadow = true; g.add(lintel);
  const dy = L.groundHeight(-44.2, -40.5), dais = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 14), stone); dais.position.set(-44.2, dy + 0.2, -40.5); g.add(dais);
  const c = crystal(0x6fe3ff, 1.5); c.position.set(-44.2, dy + 1.9, -40.5); g.add(c);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.04, 6, 30), glowMat(0xffe08a, 1.6)); ring.position.copy(c.position); ring.rotation.x = 1.2; g.add(ring);
  const light = new THREE.PointLight(0x6fe3ff, 22, 14, 1.7); light.position.set(-44.2, dy + 2.4, -40.5); g.add(light);
  g.userData.update = (t) => { c.rotation.y = t * 0.8; c.position.y = dy + 1.9 + Math.sin(t * 1.4) * 0.15; ring.rotation.z = t * 0.6; };
  return g;
}
export function tower() {
  const g = new THREE.Group(), y = L.groundHeight(49, -44), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 }), stone = new THREE.MeshStandardMaterial({ color: 0xaaa6b4, roughness: 0.95 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 3.4), stone); base.position.y = 1.3; base.castShadow = true; g.add(base);
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 0.28), wood); p.position.set(x, 5.2, z); p.castShadow = true; g.add(p); }
  for (const r of [0, Math.PI / 2]) for (const s of [-1, 1]) { const x = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.16, 0.16), wood); x.position.set(r ? s * 1.3 : 0, 4.4, r ? 0 : s * 1.3); x.rotation.set(0, r, 0.72 * s); g.add(x); }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 4.2), wood); deck.position.y = 7.6; deck.castShadow = true; g.add(deck);
  const hut = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.9, 2.8), new THREE.MeshStandardMaterial({ color: 0xc08a50, roughness: 0.85 })); hut.position.y = 8.7; hut.castShadow = true; g.add(hut);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 2.1, 4), new THREE.MeshStandardMaterial({ color: 0xc8502f, roughness: 0.8 })); roof.position.y = 10.7; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5), wood); pole.position.y = 12.6; g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6, 6, 1), new THREE.MeshStandardMaterial({ color: 0xe23a2a, side: THREE.DoubleSide })); flag.position.set(0.62, 13.3, 0); g.add(flag);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), glowMat(0xffd27a, 1.6)); win.position.set(0, 8.8, 1.41); g.add(win);
  g.userData.update = (t) => { const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4 + t * 5) * 0.08 * (p.getX(i) + 0.6)); p.needsUpdate = true; };
  g.position.set(49, y - 0.15, -44);
  return g;
}
export function woodpile() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 }), end = new THREE.MeshStandardMaterial({ color: 0xe2c08a, roughness: 0.9 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - r; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8), [wood, end, end]); l.rotation.x = Math.PI / 2; l.position.set((i - (4 - r) / 2) * 0.42, 0.2 + r * 0.36, 0); l.castShadow = true; g.add(l); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 2.1), new THREE.MeshStandardMaterial({ color: 0x8a4a2a })); roof.position.y = 1.55; roof.rotation.z = 0.12; g.add(roof);
  g.position.set(-46.5, L.groundHeight(-46.5, 11.5), 11.5); g.rotation.y = 0.5;
  return g;
}
export function blossomTree() {
  const m = new THREE.Mesh(leafyGeo(0x6b4024, [0xf07aa8, 0xff9fc4, 0xffc6dc], { h: 3.0, r: 3.0, clumps: 13, trunkR: 0.42, seed: 9 }), windy(std(), 0.01));
  m.castShadow = true; m.position.set(-48, L.groundHeight(-48, 48) - 0.1, 48); m.scale.setScalar(1.5);
  return m;
}
export function stonesAndLilies() {
  const g = new THREE.Group(), stone = new THREE.MeshStandardMaterial({ color: 0xbdb8c6, roughness: 0.95 });
  for (const s of L.STONES) { const m = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r * 1.1, 0.5, 9), stone); m.position.set(s.x, L.WATER_LEVEL + 0.0, s.z); m.receiveShadow = true; g.add(m); }
  const pad = new THREE.MeshStandardMaterial({ color: 0x4fb85a, roughness: 0.8 }), bloom = new THREE.MeshStandardMaterial({ color: 0xff9fc8, roughness: 0.6 });
  for (let i = 0; i < 16; i++) {
    const z = 22 + R(-5, 5), x = L.riverX(z) + R(-1, 1) * (L.riverHalf(z) - 1.0);
    const p = new THREE.Mesh(new THREE.CircleGeometry(R(0.3, 0.55), 10, 0.4, 5.6), pad); p.rotation.x = -Math.PI / 2; p.rotation.z = R(0, 6); p.position.set(x, L.WATER_LEVEL + 0.03, z); g.add(p);
    if (i % 3 === 0) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), bloom); f.scale.y = 0.6; f.position.set(x, L.WATER_LEVEL + 0.12, z); g.add(f); }
  }
  return g;
}
export async function forestExtras(add, loadModel, shadowed) {
  add(ancientTree()); add(mushrooms()); add(camp()); add(cave()); add(ruins()); add(tower()); add(blossomTree()); add(stonesAndLilies());
  const still = new THREE.Group(); still.add(woodpile());
  for (const [x, z] of [[-31, 56], [-29, 42], [-36, 27], [-33, 4], [-12, -11], [11, -17], [20, -9], [38, -4], [33, 14], [36, 30], [10, 41], [24, 46], [-27, -19], [38, -27], [13, -33]]) still.add(lampPost(x + 1.9, z + 0.4));
  add(bake(still));
  const cottage = shadowed(await loadModel('bld_cottage_red_v02')); cottage.position.set(-41, L.groundHeight(-41, 7) - 0.05, 7); cottage.rotation.y = Math.PI / 2; cottage.scale.setScalar(1.3); add(cottage);
  const gate = shadowed(await loadModel('prop_forest_gate_v02')); gate.position.set(L.ENTRANCE.x, L.groundHeight(L.ENTRANCE.x, L.ENTRANCE.z + 3), L.ENTRANCE.z + 3); gate.rotation.y = Math.PI; add(gate);
  const title = label('Forest of Memories\nRừng Ký Ức', { size: 30 }); title.position.set(L.ENTRANCE.x, L.groundHeight(L.ENTRANCE.x, L.ENTRANCE.z + 3) + 4.4, L.ENTRANCE.z + 3); add(title);
  signs(add, [[-24.5, 39, 'Camp →\n← Cottage'], [21, -11.5, 'Cave →\nTower ↑'], [-22, -9.5, '← Ruins\nAncient Tree →']]);
}
