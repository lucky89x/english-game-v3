// (26/11) The scenery of maps 4-7 (core/regions/lands.js): the buildings and landmarks listed in the region's `decor`, the small
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
}
