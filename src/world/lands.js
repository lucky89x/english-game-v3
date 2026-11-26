// (26/11) The scenery of maps 4-12 (core/regions/lands.js): the buildings and landmarks listed in the region's `decor`, the small
// things scattered over the ground (`scatter`: cacti, rocks, broken pillars…) drawn as instanced meshes, and a few touches of
// each land made in code: falling snow and a frozen lake in the peaks, drifting dust in the desert, glowing runes in the ruins,
// cloud banks, floating clouds and a rainbow in the sky. Everything is static except the particles (one draw call each).
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { TIME } from './common.js';
import { ZONES } from '../core/zones.js';

function mulberry32(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Points that fall (or drift) in a box that follows the camera: snow, dust, sparkles. One draw call. */
function drift({ n = 700, color = 0xffffff, size = 60, fall = 2.2, sway = 0.6, box = 56, high = 26, opacity = 0.85 }) {
  const pos = new Float32Array(n * 3), ph = new Float32Array(n), r = mulberry32(91);
  for (let i = 0; i < n; i++) { pos.set([r() * box, r() * high, r() * box], i * 3); ph[i] = r() * 6.28; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uTime: TIME, uColor: { value: new THREE.Color(color) } }, transparent: true, depthWrite: false,
    vertexShader: `uniform float uTime; attribute float phase; varying float vA;
      void main(){ vec3 p = position; p.y = mod(p.y - uTime * ${fall.toFixed(2)} * (0.6 + 0.4 * sin(phase)), ${high.toFixed(1)});
        p.x += sin(uTime * 0.7 + phase) * ${sway.toFixed(2)}; p.z += cos(uTime * 0.5 + phase * 1.3) * ${sway.toFixed(2)};
        p.xz = cameraPosition.xz + mod(p.xz - cameraPosition.xz, ${box.toFixed(1)}) - ${(box / 2).toFixed(1)};
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = smoothstep(${(box / 2).toFixed(1)}, ${(box / 2 - 8).toFixed(1)}, length(p.xz - cameraPosition.xz));
        gl_PointSize = ${size.toFixed(1)} / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uColor, vA * ${opacity.toFixed(2)} * smoothstep(0.5, 0.15, d)); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.userData.particles = true; return pts;
}
/** Many copies of every mesh of a loaded model, placed by a list of { x, z, s, ry }. */
function instances(root, scene, list) {
  scene.updateMatrixWorld(true);
  const tmp = new THREE.Matrix4(), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const inst = new THREE.InstancedMesh(o.geometry, o.material, list.length), local = o.matrixWorld;
    list.forEach((p, i) => { q.setFromEuler(e.set(0, p.ry, 0)); mm.compose(v.set(p.x, L.groundHeight(p.x, p.z) - 0.04, p.z), q, sc.set(p.s, p.s, p.s)); tmp.multiplyMatrices(mm, local); inst.setMatrixAt(i, tmp); });
    inst.instanceMatrix.needsUpdate = true; inst.castShadow = true; inst.receiveShadow = true; inst.computeBoundingSphere(); root.add(inst);
  });
}
function puff(parts, x, y, z, r, rnd) { for (let k = 0; k < 5; k++) { const g = new THREE.SphereGeometry(r * (0.55 + rnd() * 0.5), 9, 6); g.scale(1.3, 0.62, 1); g.translate(x + (rnd() - 0.5) * r * 2.2, y + (rnd() - 0.5) * r * 0.4, z + (rnd() - 0.5) * r * 1.4); parts.push(g); } }
function merged(parts, mat) { let n = 0; for (const g of parts) n += g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = []; let o = 0;
  for (const g of parts) { const gi = g.index ? g.index.array : null, c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (gi) for (const i of gi) idx.push(i + o); else for (let i = 0; i < c; i++) idx.push(i + o); o += c; g.dispose(); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setIndex(idx); return new THREE.Mesh(out, mat); }

/** Like `merged`, with a colour for every part: [geometry, hex] pairs become one mesh with vertex colours. */
function mergedC(parts, mat) { let n = 0; for (const [g] of parts) n += g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = [], c = new THREE.Color(); let o = 0;
  for (const [g, hex] of parts) { const gi = g.index ? g.index.array : null, k = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); c.set(hex); for (let i = 0; i < k; i++) col.set([c.r, c.g, c.b], (o + i) * 3); if (gi) for (const i of gi) idx.push(i + o); else for (let i = 0; i < k; i++) idx.push(i + o); o += k; g.dispose(); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.setIndex(idx); return new THREE.Mesh(out, mat); }
const gy = (x, z) => L.groundHeight(x, z);
/** A geometry moved (and turned) into place. */
function put(g, x, y, z, rx = 0, ry = 0, rz = 0) { if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz))); g.translate(x, y, z); return g; }
/** A ring of soft banks round the land (clouds, mist) and a few drifting overhead. */
function banks(R, color, emissive, overhead = 22) {
  const parts = [], cr = mulberry32(42);
  for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283 + cr() * 0.1, d = R.PLAY_RADIUS + 10 + cr() * 22; puff(parts, Math.cos(a) * d, 1 + cr() * 4, Math.sin(a) * d, 7 + cr() * 6, cr); }
  for (let i = 0; i < overhead; i++) { const a = cr() * 6.283, d = 20 + cr() * 110; puff(parts, Math.cos(a) * d, 24 + cr() * 16, Math.sin(a) * d, 4 + cr() * 5, cr); }
  const m = merged(parts, new THREE.MeshStandardMaterial({ color, roughness: 1, emissive, emissiveIntensity: 0.25 })); m.userData.far = true; return m;
}
/** A still pool that glows a little (pond, lake, lava): a disc just above the ground; `pulse` makes it breathe. */
function pool(x, z, r, color, { y = 0.14, opacity = 0.9, pulse = 0, glow = false } = {}) {
  const mat = glow ? new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }) : new THREE.MeshStandardMaterial({ color, roughness: 0.12, metalness: 0.1, transparent: true, opacity, emissive: color, emissiveIntensity: 0.25 });
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, gy(x, z) + y, z); m.receiveShadow = !glow;
  if (pulse) { const base = new THREE.Color(color), hot = base.clone().lerp(new THREE.Color(0xffffff), 0.35); m.userData.update = (t) => { mat.color.copy(base).lerp(hot, 0.5 + 0.5 * Math.sin(t * pulse + x)); }; }
  return m;
}
/** One crystal: a six-sided shaft with a point, leaning a little. */
function gem(parts, x, y, z, h, r, rnd) { const tilt = (rnd() - 0.5) * 0.7, turn = rnd() * 6.28; const a = new THREE.CylinderGeometry(r * 0.62, r, h * 0.78, 6), b = new THREE.ConeGeometry(r * 0.62, h * 0.22, 6); b.translate(0, h * 0.5, 0); for (const g of [a, b]) { g.translate(0, h * 0.39, 0); parts.push(put(g.toNonIndexed(), x, y, z, tilt, turn, 0)); } }
const flat = (g) => { g.computeVertexNormals(); return g; };

export async function landExtras(add, loadModel, shadowed) {
  const R = L.REGIONS[L.NAME], rnd = mulberry32(R.seed || 7), cache = {};
  const get = async (f) => { if (!(f in cache)) { try { cache[f] = await loadModel(f); } catch (e) { console.warn('land model', f, e.message); cache[f] = null; } } return cache[f]; };
  // the buildings and landmarks
  for (const d of R.decor || []) { const src = await get(d.f); if (!src) continue; const m = shadowed(src.clone(true)); m.position.set(d.x, L.groundHeight(d.x, d.z) - 0.05, d.z); m.rotation.y = d.rot; m.scale.setScalar(d.s); add(m); }
  // the small things on the ground: off the roads, out of the towns, the hunting grounds and the boss's arena
  const zones = ZONES[L.NAME] || [], clear = R.keepClear || [];
  const free = (x, z) => Math.hypot(x, z) < R.PLAY_RADIUS + 10 && (Math.hypot(x, z) > R.PLAY_RADIUS || (L.walkable(x, z, 0.6) && L.pathDistance(x, z) > 2.2 && !clear.some((c) => Math.hypot(x - c.x, z - c.z) < c.r) && !zones.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 1)));
  for (const [f, n, s] of R.scatter || []) {
    const src = await get(f); if (!src) continue; const list = [];
    for (let k = 0; k < n * 30 && list.length < n; k++) { const a = rnd() * 6.283, d = 6 + Math.sqrt(rnd()) * (R.PLAY_RADIUS + 4), x = Math.sin(a) * d, z = Math.cos(a) * d; if (free(x, z)) list.push({ x, z, s: s * (0.8 + rnd() * 0.5), ry: rnd() * 6.283 }); }
    const g = new THREE.Group(); instances(g, shadowed(src.clone(true)), list); add(g);
  }
  // touches of each land
  if (L.NAME === 'desert') add(drift({ n: 420, color: 0xf2dca0, size: 34, fall: 0.35, sway: 1.6, high: 9, opacity: 0.5 }));
  if (L.NAME === 'mountain') {
    add(drift({ n: 900, color: 0xffffff, size: 62, fall: 2.4, sway: 0.7 }));
    const lm = R.LANDMARKS.find((l) => l.id === 'lake'), ice = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.92 }));
    ice.rotation.x = -Math.PI / 2; ice.position.set(lm.x, L.groundHeight(lm.x, lm.z) + 0.16, lm.z); ice.receiveShadow = true; add(ice);
  }
  if (L.NAME === 'ruins') {      // runes that glow on the vault door and round the pillar court
    const mat = new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.9 }), g = new THREE.Group();
    for (const [x, z, y] of [[-3.2, -43.2, 2.2], [3.2, -43.2, 2.2], [0, -43.2, 4.4], [-6, 12, 2.6], [6, 12, 2.6], [-6, 0, 2.6], [6, 0, 2.6]]) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), mat); c.position.set(x, L.groundHeight(x, z) + y, z); g.add(c); }
    g.userData.update = (t) => { g.children.forEach((c, i) => { c.rotation.y = t * 1.2 + i; c.position.y += Math.sin(t * 2 + i) * 0.002; }); }; add(g);
    add(drift({ n: 260, color: 0xbfffe0, size: 26, fall: -0.5, sway: 0.9, high: 8, opacity: 0.7 }));
  }
  if (L.NAME === 'sky') {
    const parts = [], cr = mulberry32(42);
    for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283 + cr() * 0.1, d = R.PLAY_RADIUS + 10 + cr() * 22; puff(parts, Math.cos(a) * d, 1 + cr() * 4, Math.sin(a) * d, 7 + cr() * 6, cr); }      // the cloud banks round the island
    for (let i = 0; i < 22; i++) { const a = cr() * 6.283, d = 20 + cr() * 110; puff(parts, Math.cos(a) * d, 24 + cr() * 16, Math.sin(a) * d, 4 + cr() * 5, cr); }      // clouds drifting overhead
    const clouds = merged(parts, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xbfd8ff, emissiveIntensity: 0.25 })); clouds.userData.far = true; add(clouds);
    const bow = new THREE.Group(), cols = [0xff5a5a, 0xffa040, 0xffe050, 0x6fd86a, 0x5ab0ff, 0x7a6aff, 0xc070ff];      // a rainbow behind the arena
    cols.forEach((c, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(46 - i * 1.1, 0.55, 5, 48, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, depthWrite: false, fog: false })); bow.add(t); });
    bow.position.set(0, -2, -96); add(bow);
    add(drift({ n: 300, color: 0xfff6c0, size: 30, fall: -0.4, sway: 1.2, high: 12, opacity: 0.8 }));
  }
  // ------------------------------------------------ (26/11, turn 63) maps 8-12: their own scenery, drawn in code
  if (L.NAME === 'fairy') {
    add(banks(R, 0xffe6f4, 0xffb8e0, 12));      // the isle floats in a pink mist
    add(pool(0, 4, 7.5, 0x9ad8ff, { pulse: 0.8 }));      // the Moon Pond
    const parts = [], fr = mulberry32(8);      // the giant flowers: a stem, a ring of petals, a golden heart
    for (const [x, z, h, col] of R.flowers || []) {
      const y = gy(x, z), pr = h * 0.42;
      parts.push([put(new THREE.CylinderGeometry(h * 0.035, h * 0.06, h, 7).toNonIndexed(), x, y + h / 2, z), 0x5aa850]);
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, g = new THREE.SphereGeometry(1, 8, 5); g.scale(pr * 0.5, pr * 0.1, pr * 0.26); g.translate(pr * 0.55, 0, 0); parts.push([put(flat(g.toNonIndexed()), x, y + h, z, 0, a, 0.28), col]); }
      parts.push([put(new THREE.SphereGeometry(pr * 0.3, 10, 7).toNonIndexed(), x, y + h + pr * 0.1, z), 0xffd24a]);
      for (let k = 0; k < 2; k++) { const a = fr() * 6.283, g = new THREE.SphereGeometry(1, 7, 4); g.scale(h * 0.16, h * 0.02, h * 0.07); g.translate(h * 0.16, 0, 0); parts.push([put(flat(g.toNonIndexed()), x, y + h * (0.3 + k * 0.2), z, 0, a, 0.5), 0x6cbf5a]); }
    }
    const fl = shadowed(mergedC(parts, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }))); add(fl);
    add(drift({ n: 360, color: 0xffc8f0, size: 30, fall: -0.35, sway: 1.3, high: 10, opacity: 0.8 }));
  }
  if (L.NAME === 'volcano') {
    for (const [x, z, r] of R.lava || []) { add(pool(x, z, r - 0.6, 0xff6a1a, { y: 0.22, opacity: 1, pulse: 1.4, glow: true })); const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.3, 0.55, 6, 28), new THREE.MeshStandardMaterial({ color: 0x241c1c, roughness: 1, flatShading: true })); rim.rotation.x = Math.PI / 2; rim.position.set(x, gy(x, z) + 0.2, z); rim.scale.z = 0.7; add(rim); }
    // Fire Mountain behind the gate: a broken cone with a glowing mouth and rivers of lava down its side
    const cone = new THREE.Group(), rock = new THREE.MeshStandardMaterial({ color: 0x2c2626, roughness: 1, flatShading: true }), fire = new THREE.MeshBasicMaterial({ color: 0xff7a1a, fog: false });
    cone.add(new THREE.Mesh(new THREE.CylinderGeometry(11, 52, 62, 22, 4, true), rock));
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(10.6, 22), fire); mouth.rotation.x = -Math.PI / 2; mouth.position.y = 30.5; cone.add(mouth);
    for (const a of [0.3, 1.5, 2.6, 4.0, 5.2]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(11.15, 52.15, 62, 3, 1, true, a, 0.07 + (a % 1) * 0.05), fire); cone.add(st); }
    const smoke = new THREE.Group(), sm = new THREE.MeshBasicMaterial({ color: 0x3a3232, transparent: true, opacity: 0.55, depthWrite: false, fog: false });
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(7 + i * 1.4, 10, 8), sm); b.userData.k = i; smoke.add(b); }
    smoke.userData.update = (t) => { for (const b of smoke.children) { const u = ((t * 0.035 + b.userData.k / 7) % 1); b.position.set(Math.sin(u * 5 + b.userData.k) * 6 + u * 26, 64 + u * 46, 0); b.scale.setScalar(0.6 + u * 1.3); } fire.color.setHSL(0.06, 1, 0.5 + 0.06 * Math.sin(t * 2)); };
    cone.position.set(0, 30, -128); cone.userData.far = true; add(cone); smoke.position.set(0, 0, -128); smoke.userData.far = true; add(smoke);
    add(drift({ n: 420, color: 0xff9a3a, size: 30, fall: -1.1, sway: 1.1, high: 13, opacity: 0.85 }));
  }
  if (L.NAME === 'crystal') {
    add(pool(0, 4, 10, 0x2aa8d8, { y: 0.18, opacity: 0.7, pulse: 0.7, glow: true }));      // the Glow Lake
    const cr = mulberry32(77), byCol = new Map(), bucket = (c) => { if (!byCol.has(c)) byCol.set(c, []); return byCol.get(c); };
    for (const [x, z, h, col] of R.gems || []) { const y = gy(x, z) - 0.2, parts = bucket(col); gem(parts, x, y, z, h, h * 0.2, cr); for (let k = 0; k < 5; k++) { const a = cr() * 6.283, d = h * (0.22 + cr() * 0.18); gem(parts, x + Math.cos(a) * d, y, z + Math.sin(a) * d, h * (0.35 + cr() * 0.3), h * 0.1, cr); } }
    const cols = [0x6ad8ff, 0xd08cff, 0xff8ad8, 0x8affc8];      // small crystals all over the floor of the cave, thick along the walls
    for (let k = 0, n = 0; k < 9000 && n < 300; k++) { const a = cr() * 6.283, d = 8 + Math.sqrt(cr()) * (R.PLAY_RADIUS + 12), x = Math.sin(a) * d, z = Math.cos(a) * d; if (!free(x, z)) continue; n++; gem(bucket(cols[n % 4]), x, gy(x, z) - 0.1, z, 0.9 + cr() * (d > R.PLAY_RADIUS ? 5 : 1.6), 0.22 + cr() * 0.25, cr); }
    for (const [col, parts] of byCol) { const m = merged(parts.map(flat), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.85, roughness: 0.25, flatShading: true })); add(m); }
    add(drift({ n: 320, color: 0xbfe8ff, size: 26, fall: -0.3, sway: 0.8, high: 10, opacity: 0.8 }));
  }
  if (L.NAME === 'city') {
    const body = [], lights = [], dark = 0x2c3644;
    for (const [x, z, w, d, h, col] of R.towers || []) {
      const y = gy(x, z); body.push([put(new THREE.BoxGeometry(w, h, d).toNonIndexed(), x, y + h / 2, z), dark]); body.push([put(new THREE.BoxGeometry(w * 0.6, 3, d * 0.6).toNonIndexed(), x, y + h + 1.5, z), 0x445266]);
      for (let fy = 3; fy < h - 1; fy += 3.2) lights.push([put(new THREE.BoxGeometry(w + 0.12, 0.7, d + 0.12).toNonIndexed(), x, y + fy, z), col]);
      lights.push([put(new THREE.BoxGeometry(0.3, 5, 0.3).toNonIndexed(), x, y + h + 5, z), col]);
    }
    // the Solar Tower in the middle of the main avenue: a white shaft, a ring that turns, a little sun on top
    const tx = 0, tz = -12, ty = gy(tx, tz); body.push([put(new THREE.CylinderGeometry(2.2, 3.6, 44, 14).toNonIndexed(), tx, ty + 22, tz), 0xe8eef6]); body.push([put(new THREE.CylinderGeometry(4.4, 4.4, 1, 18).toNonIndexed(), tx, ty + 0.5, tz), 0x9aa6b4]);
    add(shadowed(mergedC(body, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.3 })))); add(mergedC(lights, new THREE.MeshBasicMaterial({ vertexColors: true })));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(4.2, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffe27a, fog: false })); sun.position.set(tx, ty + 49, tz); add(sun);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(7, 0.3, 6, 40), new THREE.MeshBasicMaterial({ color: 0x8affc8 })); halo.position.copy(sun.position); halo.userData.update = (t) => { halo.rotation.set(1.2 + Math.sin(t * 0.4) * 0.3, t * 0.6, 0); }; add(halo);
    // the sky train: a rail on tall legs all round the city, three cars that never stop
    const rail = [], RR = 74, RY = 15;
    { const g = new THREE.TorusGeometry(RR, 0.4, 5, 120); g.rotateX(Math.PI / 2); rail.push([put(g.toNonIndexed(), 0, RY, 0), 0xdfe6ee]); }
    for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283 + 0.16, x = Math.cos(a) * RR, z = Math.sin(a) * RR, y = gy(x, z); rail.push([put(new THREE.CylinderGeometry(0.45, 0.6, RY - y, 6).toNonIndexed(), x, (RY + y) / 2, z), 0x8f9cab]); }
    add(mergedC(rail, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })));
    const train = new THREE.Group(), carM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), win = new THREE.MeshBasicMaterial({ color: 0x6ad8ff });
    for (let i = 0; i < 3; i++) { const a = i * 0.105, car = new THREE.Group(), b = new THREE.Mesh(new THREE.CapsuleGeometry(1.3, 4.6, 4, 10), carM); b.rotation.x = Math.PI / 2; car.add(b); const wn = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.6, 4.4), win); wn.position.y = 0.35; car.add(wn); car.position.set(Math.cos(a) * RR, RY + 1.6, Math.sin(a) * RR); car.rotation.y = -a; train.add(car); }
    train.userData.update = (t) => { train.rotation.y = -t * 0.12; }; add(train);
    const cars = new THREE.Group();      // little flying cars on a higher ring, the other way round
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 2.4), new THREE.MeshBasicMaterial({ color: [0xff8ad8, 0xffd24a, 0x8affc8][i % 3] })); c.position.set(Math.cos(a) * (38 + (i % 2) * 14), 24 + (i % 3) * 5, Math.sin(a) * (38 + (i % 2) * 14)); c.rotation.y = -a; cars.add(c); }
    cars.userData.update = (t) => { cars.rotation.y = t * 0.2; }; add(cars);
  }
  if (L.NAME === 'dream') {
    add(banks(R, 0xf4ecff, 0xd8c8ff));
    const parts = [], dr = mulberry32(12), y0 = gy(0, 0);      // the Star Fountain, pillows in the garden, the Moon Bridge
    parts.push([put(new THREE.CylinderGeometry(2.6, 2.9, 0.7, 20).toNonIndexed(), 0, y0 + 0.35, 0), 0xf6eeff]); parts.push([put(new THREE.CylinderGeometry(0.5, 0.7, 2.6, 10).toNonIndexed(), 0, y0 + 1.6, 0), 0xe6dcff]); parts.push([put(new THREE.CylinderGeometry(1.5, 0.6, 0.4, 16).toNonIndexed(), 0, y0 + 2.9, 0), 0xf6eeff]);
    const garden = R.LANDMARKS.find((l) => l.id === 'garden'), pcol = [0xffc8e0, 0xc8e0ff, 0xfff0b8, 0xd8c8ff, 0xc8ffe6];
    for (let i = 0; i < 16; i++) { const a = dr() * 6.283, d = 3 + dr() * 9, x = garden.x + Math.cos(a) * d - 6, z = garden.z + Math.sin(a) * d - 6; if (!free(x, z)) continue; const g = new THREE.SphereGeometry(1, 10, 7); g.scale(1.5 + dr(), 0.55, 1.1 + dr() * 0.6); parts.push([put(g.toNonIndexed(), x, gy(x, z) + 0.45, z, 0, dr() * 3, 0), pcol[i % 5]]); }
    const bridge = R.LANDMARKS.find((l) => l.id === 'bridge'); { const g = new THREE.TorusGeometry(5, 0.5, 8, 24, Math.PI); parts.push([put(g.toNonIndexed(), bridge.x - 5, gy(bridge.x - 5, bridge.z) - 0.2, bridge.z - 4, 0, 0.6, 0), 0xfff6d0]); }
    add(shadowed(mergedC(parts, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }))));
    add(pool(0, 0, 2.3, 0xbfe8ff, { y: 0.72, pulse: 1 }));
    const gold = new THREE.MeshBasicMaterial({ color: 0xffe89a, fog: false }), star = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), gold); star.position.set(0, y0 + 4.2, 0); star.scale.y = 1.5; star.userData.update = (t) => { star.rotation.y = t * 1.5; star.position.y = y0 + 4.2 + Math.sin(t * 2) * 0.2; }; add(star);
    const sky = [], sr = mulberry32(5);      // stars that hang low over the kingdom, and a great crescent moon behind the castle
    for (let i = 0; i < 70; i++) { const a = sr() * 6.283, d = 14 + sr() * 110, g = new THREE.OctahedronGeometry(0.5 + sr() * 0.9); g.scale(1, 1.6, 1); sky.push(put(g, Math.cos(a) * d, 14 + sr() * 30, Math.sin(a) * d, 0, sr() * 3, 0)); }
    const stars = merged(sky.map(flat), gold); stars.userData.far = true; stars.userData.update = (t) => { stars.position.y = Math.sin(t * 0.5) * 0.8; }; add(stars);
    const sh = new THREE.Shape(); sh.absarc(0, 0, 22, -Math.PI * 0.42, Math.PI * 0.42, false); sh.absarc(-9, 0, 20, Math.PI * 0.32, -Math.PI * 0.32, true);
    const moon = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0xfff2b8, fog: false })); moon.position.set(46, 58, -150); moon.rotation.z = 0.5; moon.userData.far = true; add(moon);
    const bow = new THREE.Group(); [0xff9ac0, 0xffd08a, 0xfff0a0, 0xa0e8b0, 0x9ad0ff, 0xc0a8ff].forEach((c, i) => { bow.add(new THREE.Mesh(new THREE.TorusGeometry(52 - i * 1.2, 0.6, 5, 48, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, depthWrite: false, fog: false }))); }); bow.position.set(-30, -4, -120); bow.userData.far = true; add(bow);
    add(drift({ n: 360, color: 0xfff0b0, size: 32, fall: -0.3, sway: 1.2, high: 12, opacity: 0.85 }));
  }
}
