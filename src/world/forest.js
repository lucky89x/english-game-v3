// Forest of Memories — everything you can see. Built procedurally from core/layout.js
// (InstancedMesh for trees, rocks, grass, flowers, cobbles, fences) plus 4 compact GLBs.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import * as L from '../core/layout.js';
import { ORCHARD_TREES, GATE } from '../core/regions/village.js';

export const TIME = { value: 0 };
const C = (hex) => new THREE.Color(hex);
const rnd = L.mulberry32(77);
const R = (a, b) => a + rnd() * (b - a);

function tint(geo, hex, jitter = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv');
  const n = g.attributes.position.count, col = new Float32Array(n * 3), c = C(hex);
  for (let i = 0; i < n; i++) { const k = 1 + (rnd() - 0.5) * jitter; col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const at = (geo, x, y, z, sx = 1, sy = sx, sz = sx, ry = 0, rx = 0, rz = 0) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  return geo.applyMatrix4(m);
};
function lumpy(geo, amount, seed = 1, smoothShade = true) {
  if (smoothShade) { geo.deleteAttribute('normal'); geo.deleteAttribute('uv'); geo = mergeVertices(geo, 1e-3); }   // shared vertices -> rounded shading
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amount * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 + seed * 1.7) + amount * 0.6 * Math.sin(y * 4.3 + seed * 0.3);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}
const std = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, ...o });
function windy(mat, strength) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = TIME;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 wOrigin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #else
        vec3 wOrigin = vec3(0.0);
      #endif
      float wSway = sin(uTime * 1.6 + wOrigin.x * 0.31 + wOrigin.z * 0.23) * ${strength.toFixed(4)} * max(position.y, 0.0) * max(position.y, 0.0);
      transformed.x += wSway; transformed.z += wSway * 0.6;`);
  };
  return mat;
}
function instanced(geo, mat, list, place, shadow = true) {
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  list.forEach((item, i) => { place(item, p, e, s, i, mesh); q.setFromEuler(e); m.compose(p, q, s); mesh.setMatrixAt(i, m); });
  mesh.castShadow = shadow; mesh.receiveShadow = true;
  mesh.userData.full = list.length;
  mesh.computeBoundingSphere();
  return mesh;
}
export function label(text, { size = 34, color = '#4a2a10', bg = 'rgba(255,246,222,0.92)', scale = 1 } = {}) {
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  ctx.font = `700 ${size}px "Nunito", "Trebuchet MS", sans-serif`;
  const lines = text.split('\n'), w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 36, h = lines.length * (size + 8) + 22;
  cv.width = Math.ceil(w); cv.height = Math.ceil(h);
  ctx.font = `700 ${size}px "Nunito", "Trebuchet MS", sans-serif`;
  if (bg) { ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(2, 2, cv.width - 4, cv.height - 4, 16); ctx.fill(); ctx.strokeStyle = '#9a6a35'; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, cv.width / 2, 12 + i * (size + 8)));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
  sp.scale.set(cv.width / 110 * scale, cv.height / 110 * scale, 1);
  return sp;
}

// ------------------------------------------------------------------ terrain
function buildTerrain() {
  const seg = 180, geo = new THREE.PlaneGeometry(L.SIZE + 40, L.SIZE + 40, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  const gA = C(0x62b83a), gB = C(0x9ad852), gC = C(0x3f9a3a), path = C(0xc9b58c), dirt = C(0xa98a5a), sand = C(0xe9dca6),
    rock = C(0x9b99a8), rockL = C(0xbcb8c6), bed = C(0x2f9aa8), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = L.groundHeight(x, z);
    p.setY(i, h);
    const slope = Math.hypot(L.groundHeight(x + 0.5, z) - L.groundHeight(x - 0.5, z), L.groundHeight(x, z + 0.5) - L.groundHeight(x, z - 0.5));
    const n = 0.5 + 0.5 * Math.sin(x * 0.37 + Math.sin(z * 0.21) * 2.0) * Math.cos(z * 0.29 - x * 0.11);
    tmp.copy(gA).lerp(gB, n);
    if (Math.hypot(x, z) > 72) tmp.lerp(gC, Math.min(1, (Math.hypot(x, z) - 72) / 10));
    const pd = L.pathDistance(x, z);
    if (pd < 0.9) tmp.lerp(dirt, 1 - Math.max(0, pd) / 0.9);
    if (pd < 0.1) tmp.lerp(path, 0.85);
    if (h < 0.28 && z > L.RIVER_START - 2) tmp.lerp(sand, Math.min(1, (0.28 - h) / 0.3));
    if (h < L.WATER_LEVEL) tmp.lerp(bed, Math.min(1, (L.WATER_LEVEL - h) / 0.5));
    if (slope > 0.75) tmp.lerp(n > 0.5 ? rockL : rock, Math.min(1, (slope - 0.75) / 0.5));
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, std({ roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}

function buildCobbles() {
  const stones = [];
  for (const path of L.PATHS) for (let i = 0; i < path.pts.length - 1; i++) {
    const a = path.pts[i], b = path.pts[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z);
    const dx = (b.x - a.x) / len, dz = (b.z - a.z) / len, rows = Math.max(3, Math.round(path.w / 0.56));
    for (let t = 0.2; t < len; t += 0.6) for (let r = 0; r < rows; r++) {
      const off = ((r + 0.5) / rows - 0.5) * (path.w - 0.3) + R(-0.08, 0.08), tt = t + (r % 2) * 0.3 + R(-0.07, 0.07);
      const x = a.x + dx * tt - dz * off, z = a.z + dz * tt + dx * off;
      if (L.onBridge(x, z) || L.inWater(x, z)) continue;
      stones.push({ x, z, s: R(0.25, 0.34), rot: R(0, 6.28), c: rnd() });
    }
  }
  const geo = lumpy(new THREE.IcosahedronGeometry(1, 1), 0.08, 5); geo.scale(1, 0.34, 1);
  const mesh = instanced(geo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), stones, (st, p, e, s, i, m) => {
    p.set(st.x, L.groundHeight(st.x, st.z) + 0.02, st.z); e.set(0, st.rot, 0); s.set(st.s, st.s * 0.9, st.s * R(0.78, 1.15));
    m.setColorAt(i, C(st.c < 0.3 ? 0xc9bfb6 : st.c < 0.6 ? 0xddd5ca : st.c < 0.85 ? 0xb5aca8 : 0xcdb9a2));
  }, false);
  return mesh;
}

// ------------------------------------------------------------------ water
const WATER_VS = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
function waterMaterial(fall) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: TIME, uFall: { value: fall ? 1 : 0 } }, transparent: true, depthWrite: false, vertexShader: WATER_VS,
    fragmentShader: `uniform float uTime; uniform float uFall; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec3 deep = vec3(0.05, 0.50, 0.72), shallow = vec3(0.30, 0.86, 0.90);
        if (uFall > 0.5) {
          float streak = n(vec2(vUv.x * 14.0, vUv.y * 3.0 + uTime * 2.6));
          vec3 col = mix(vec3(0.45, 0.82, 0.96), vec3(1.0), smoothstep(0.35, 0.8, streak));
          float mist = smoothstep(0.82, 1.0, 1.0 - vUv.y);
          gl_FragColor = vec4(mix(col, vec3(1.0), mist), 0.92);
          return;
        }
        float edge = abs(vUv.x - 0.5) * 2.0;
        vec2 p = vW.xz * 0.55 + vec2(0.0, -uTime * 0.55);
        float cells = abs(n(p * 1.7) - n(p * 1.7 + vec2(0.31, uTime * 0.12)));
        float lines = smoothstep(0.06, 0.0, abs(cells - 0.18));
        vec3 col = mix(deep, shallow, smoothstep(0.25, 0.95, edge) * 0.8 + 0.15 * n(p));
        col += lines * 0.35;
        float foam = smoothstep(0.62, 0.74, edge + 0.07 * sin(vW.z * 1.3 + uTime * 1.8) + 0.05 * n(p * 3.0));
        col = mix(col, vec3(1.0), foam * 0.85);
        gl_FragColor = vec4(col, 0.86 + 0.14 * foam);
      }`,
  });
}
function buildWater() {
  const g = new THREE.Group();
  const pos = [], uv = [], idx = [];
  let k = 0;
  for (let z = L.RIVER_START - 0.6; z <= 82; z += 1) {
    const cx = L.riverX(Math.max(z, L.RIVER_START)), hw = L.riverHalf(z) + 2.4;
    pos.push(cx - hw, L.WATER_LEVEL, z, cx + hw, L.WATER_LEVEL, z); uv.push(0, z, 1, z);
    if (k > 0) idx.push(2 * k - 2, 2 * k, 2 * k - 1, 2 * k - 1, 2 * k, 2 * k + 1);
    k++;
  }
  const river = new THREE.BufferGeometry();
  river.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); river.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); river.setIndex(idx);
  g.add(new THREE.Mesh(river, waterMaterial(false)));
  if (!L.WATERFALL) return g;
  const fx = L.riverX(L.RIVER_START), top = L.groundHeight(fx, -60) + 0.45;
  const upper = new THREE.PlaneGeometry(7, 26); upper.rotateX(-Math.PI / 2);
  const um = new THREE.Mesh(upper, waterMaterial(false)); um.position.set(fx, top, -66.5); g.add(um);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, top - L.WATER_LEVEL + 0.4, 1, 1), waterMaterial(true));
  fall.position.set(fx, (top + L.WATER_LEVEL) / 2, -53.6); g.add(fall);
  const lip = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), waterMaterial(true)); lip.rotation.x = -Math.PI / 2.6; lip.position.set(fx, top - 0.2, -54.2); g.add(lip);
  // mist at the foot of the fall
  const n = 90, mp = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { mp.set([fx + R(-3.4, 3.4), L.WATER_LEVEL + R(0, 0.4), -52.6 + R(-0.4, 1.8)], i * 3); ph[i] = rnd() * 6.28; }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mg.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const mist = new THREE.Points(mg, new THREE.ShaderMaterial({ uniforms: { uTime: TIME }, transparent: true, depthWrite: false,
    vertexShader: `uniform float uTime; attribute float phase; varying float vA; void main(){ vec3 p = position; float t = fract(uTime * 0.5 + phase); p.y += t * 1.6; p.z += t * 0.8; vA = (1.0 - t) * 0.55; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (60.0 + 80.0 * t) / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 1.0, 1.0, vA * smoothstep(0.5, 0.1, d)); }` }));
  mist.userData.particles = true; g.add(mist);
  return g;
}

// ------------------------------------------------------------------ vegetation
function pineGeo() {
  const parts = [tint(at(new THREE.CylinderGeometry(0.16, 0.26, 1.6, 7), 0, 0.8, 0), 0x7a4a26, 0.15)];
  const tiers = [[1.75, 2.0, 1.5, 0x2f7d3a], [1.45, 1.8, 2.6, 0x38903f], [1.12, 1.6, 3.6, 0x43a046], [0.78, 1.5, 4.55, 0x52b24c], [0.42, 1.2, 5.4, 0x66c256]];
  for (const [r, h, y, c] of tiers) parts.push(tint(at(lumpy(new THREE.ConeGeometry(r, h, 9, 2), 0.07, y), 0, y, 0), c, 0.12));
  return mergeGeometries(parts);
}
function leafyGeo(trunkHex, palette, { h = 2.6, r = 2.1, clumps = 15, trunkR = 0.26, seed = 1 } = {}) {
  const parts = [tint(at(new THREE.CylinderGeometry(trunkR * 0.7, trunkR * 1.35, h, 8), 0, h / 2, 0), trunkHex, 0.14)];
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + seed; parts.push(tint(at(new THREE.CylinderGeometry(0.05, 0.1, 1.3, 5), Math.cos(a) * 0.5, h + 0.2, Math.sin(a) * 0.5, 1, 1, 1, 0, Math.sin(a) * 0.7, -Math.cos(a) * 0.7), trunkHex, 0.1)); }
  for (let i = 0; i < clumps; i++) {
    const y = 1 - ((i + 0.5) / clumps) * 1.5, rr = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.399 + seed;
    const s = r * (0.36 + 0.14 * ((i * 7 + seed) % 5) / 5);
    const g = lumpy(new THREE.IcosahedronGeometry(s, 1), 0.16, i + seed);
    parts.push(tint(at(g, Math.cos(a) * rr * r * 0.62, h + r * 0.55 + y * r * 0.55, Math.sin(a) * rr * r * 0.62), palette[y > 0.35 ? 2 : y > -0.2 ? 1 : 0], 0.16));
  }
  return mergeGeometries(parts);
}
/** Leaf-cluster texture: a handful of pointed leaves on a transparent ground (tinted by vertex colour). */
let LEAF_TEX = null;
function leafTexture() {
  if (LEAF_TEX) return LEAF_TEX;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const leaf = (x, y, r, a, shade) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 0.75, -r * 0.2, 0, r); c.quadraticCurveTo(-r * 0.75, -r * 0.2, 0, -r); c.fillStyle = `rgb(${shade},${shade},${shade})`; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(0, r * 0.8); c.stroke(); c.restore(); };
  const spots = [[64, 64, 30, 0, 235], [34, 50, 26, -0.9, 205], [94, 50, 26, 0.9, 215], [44, 90, 25, -2.2, 190], [86, 92, 25, 2.2, 200], [64, 28, 24, 0.2, 250], [64, 100, 22, 3.1, 180], [22, 76, 19, -1.5, 215], [106, 76, 19, 1.5, 225]];
  for (const [x, y, r, a, sh] of spots) leaf(x, y, r, a, sh);
  LEAF_TEX = new THREE.CanvasTexture(cv); LEAF_TEX.colorSpace = THREE.SRGBColorSpace; LEAF_TEX.anisotropy = 4;
  return LEAF_TEX;
}
/** Leaf cards wrapped round a canopy: quads facing outward with soft spherical normals, lighter towards the top. */
function leafCards(palette, { h = 2.6, r = 2.1, count = 150, seed = 1 } = {}) {
  const pos = [], nor = [], uv = [], col = [], idx = [], rr = L.mulberry32(seed * 977 + 13), cy = h + r * 0.55;
  const cols = palette.map((x) => C(x)), t = new THREE.Color(), q = new THREE.Quaternion(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - ((i + 0.5) / count) * 1.75, ring = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.399 + seed;
    const n = new THREE.Vector3(Math.cos(a) * ring, y * 0.85, Math.sin(a) * ring).normalize();
    const d = r * (0.86 + rr() * 0.3), c = new THREE.Vector3(n.x * d * 1.02, cy + n.y * d * 0.8, n.z * d * 1.02), size = r * (0.42 + rr() * 0.22);
    q.setFromUnitVectors(up, n); const roll = new THREE.Quaternion().setFromAxisAngle(n, rr() * 6.28); q.premultiply(roll);
    const k = (y + 1) / 2; t.copy(cols[0]).lerp(cols[1], Math.min(1, k * 1.6)); if (k > 0.6) t.lerp(cols[2], (k - 0.6) / 0.4); t.multiplyScalar(0.9 + rr() * 0.2);
    const base = pos.length / 3;
    for (const [px, py, u, w] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) { v.set(px * size, py * size, 0).applyQuaternion(q).add(c); pos.push(v.x, v.y, v.z); nor.push(n.x, Math.max(0.15, n.y * 0.6 + 0.4), n.z); uv.push(u, w); col.push(t.r, t.g, t.b); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}
const leafMat = (wind) => windy(new THREE.MeshStandardMaterial({ map: leafTexture(), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 }), wind);
function buildTrees() {
  const g = new THREE.Group();
  const dark = (pal) => pal.map((x) => C(x).multiplyScalar(0.72).getHex());
  const leafy = (trunk, pal, o = {}) => ({ core: leafyGeo(trunk, dark(pal), { clumps: 8, ...o }), cards: leafCards(pal, { h: o.h, r: o.r, seed: o.seed, count: o.count }), wind: 0.016 });
  const kinds = {
    pine: { core: pineGeo(), wind: 0.010 },
    oak: leafy(0x7a4a26, [0x3f9a3a, 0x5fbe3f, 0xa6dc52], { seed: 1 }),
    birch: leafy(0xe9e4d6, [0x7fc24a, 0xa5d85a, 0xdcec72], { h: 3.2, r: 1.6, trunkR: 0.16, seed: 4, count: 110 }),
    gold: leafy(0x7a4a26, [0xc9a82a, 0xecd448, 0xf8f08a], { seed: 2 }),
    blossom: leafy(0x6b4024, [0xf07aa8, 0xff9fc4, 0xffd6e6], { seed: 3 }),
    maple: leafy(0x6b4024, [0xd0402a, 0xf0683a, 0xfaa25e], { seed: 5 }),
  };
  // some oaks become golden, blossom or autumn-red trees (same map data, just a different look)
  const look = (t) => { if (t.kind !== 'oak') return t.kind; const k = Math.abs(Math.sin(t.x * 12.9898 + t.z * 78.233) * 43758.5453) % 1; return k < 0.14 ? 'gold' : k < 0.24 ? 'blossom' : k < 0.31 ? 'maple' : 'oak'; };
  for (const [kind, K] of Object.entries(kinds)) {
    const list = L.TREES.filter((t) => look(t) === kind);
    const place = (t, p, e, s) => { p.set(t.x, L.groundHeight(t.x, t.z) - 0.08, t.z); e.set(0, t.rot, 0); s.setScalar(t.s * (kind === 'pine' ? 1.25 : 1.15)); };
    g.add(instanced(K.core, windy(std(), K.wind), list, place));
    if (K.cards) g.add(instanced(K.cards, leafMat(K.wind), list, place));
  }
  return g;
}
function buildRocks() {
  const geo = lumpy(new THREE.IcosahedronGeometry(1, 1), 0.2, 3, false), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  const a = C(0x9d9aa8), b = C(0xc3bfcc), moss = C(0x74b84a), t = new THREE.Color();
  for (let i = 0; i < n; i++) { const y = geo.attributes.position.getY(i); t.copy(a).lerp(b, 0.5 + 0.5 * Math.sin(i * 1.7)); if (y > 0.55) t.lerp(moss, 0.75); col.set([t.r, t.g, t.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.deleteAttribute('uv');
  return instanced(geo, std({ flatShading: true }), L.ROCKS, (r, p, e, s) => { p.set(r.x, L.groundHeight(r.x, r.z) + 0.25 * r.s, r.z); e.set(0, r.rot, 0); s.set(r.s, r.s * 0.72, r.s * 0.9); });
}
function scatterGround(count, ok) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 12) {
    const x = R(-74, 74), z = R(-74, 74);
    if (Math.hypot(x, z) > 74 || L.pathDistance(x, z) < 0.35 || L.groundHeight(x, z) < 0.12 || (L.WATERFALL && z < -53)) continue;
    if (ok && !ok(x, z)) continue;
    out.push({ x, z, s: R(0.7, 1.35), rot: R(0, 6.28), c: rnd() });
  }
  return out;
}
function buildGrass() {
  const blade = (ry) => { const g = new THREE.PlaneGeometry(0.34, 0.5, 1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.25; p.setY(i, y); p.setX(i, p.getX(i) * (1 - y * 1.5)); } g.rotateY(ry); return g; };
  const geo = mergeGeometries([blade(0), blade(1.57)]); geo.deleteAttribute('uv');
  const mat = windy(new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.DoubleSide }), 0.9);
  const mesh = instanced(geo, mat, scatterGround(7000), (t, p, e, s, i, m) => {
    p.set(t.x, L.groundHeight(t.x, t.z) - 0.02, t.z); e.set(0, t.rot, 0); s.set(t.s * 0.55, t.s * R(0.45, 0.85), t.s * 0.55);
    m.setColorAt(i, C(t.c < 0.5 ? 0x7fd84c : t.c < 0.85 ? 0x9be45a : 0x6cc944));
  }, false);
  mesh.userData.density = true;
  return mesh;
}
function buildFlowers() {
  const head = new THREE.SphereGeometry(0.15, 6, 3); head.scale(1, 0.55, 1);
  head.deleteAttribute('uv');
  const hues = [0xffffff, 0xff8fc0, 0xffd84a, 0xb69cf2, 0xff6f61, 0x7fc8ff];
  const mesh = instanced(head, new THREE.MeshStandardMaterial({ roughness: 0.8 }), scatterGround(2200, (x, z) => L.pathDistance(x, z) < 6 || L.riverDistance(x, z) < 9 || rnd() < 0.2), (t, p, e, s, i, m) => {
    p.set(t.x, L.groundHeight(t.x, t.z) + 0.16 * t.s, t.z); e.set(R(-0.3, 0.3), t.rot, 0); s.setScalar(t.s * 0.62);
    m.setColorAt(i, C(hues[Math.floor(t.c * hues.length)]));
  }, false);
  mesh.userData.density = true;
  return mesh;
}
function buildFences() {
  const posts = [], rails = [];
  for (const path of [L.PATHS[0], L.PATHS[1], L.PATHS[2], L.PATHS[5]]) for (const side of [-1, 1]) {
    let prev = null;
    for (let i = 0; i < path.pts.length - 1; i++) {
      const a = path.pts[i], b = path.pts[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z), dx = (b.x - a.x) / len, dz = (b.z - a.z) / len;
      for (let t = 0; t <= len; t += 2.2) {
        const x = a.x + dx * t - dz * side * (path.w / 2 + 0.55), z = a.z + dz * t + dx * side * (path.w / 2 + 0.55);
        const blocked = L.inWater(x, z) || L.onBridge(x, z) || L.pathDistance(x, z) < 0.3 || L.riverDistance(x, z) < L.riverHalf(z) + 1.2 || (Math.floor(t / 2.2) % 9 > 5);
        if (blocked) { prev = null; continue; }
        const cur = { x, z, y: L.groundHeight(x, z) };
        posts.push(cur);
        if (prev && Math.hypot(cur.x - prev.x, cur.z - prev.z) < 2.6) rails.push([prev, cur]);
        prev = cur;
      }
    }
  }
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x9a6436, roughness: 0.85 });
  const pg = new THREE.CylinderGeometry(0.09, 0.11, 1.05, 6); pg.translate(0, 0.5, 0);
  g.add(instanced(pg, wood, posts, (t, p, e, s) => { p.set(t.x, t.y - 0.05, t.z); e.set(0, 0, 0); s.setScalar(1); }));
  const rg = new THREE.BoxGeometry(1, 0.09, 0.07);
  const railList = rails.flatMap((r) => [[r, 0.45], [r, 0.8]]);
  g.add(instanced(rg, wood, railList, ([[a, b], h], p, e, s) => {
    p.set((a.x + b.x) / 2, (a.y + b.y) / 2 + h, (a.z + b.z) / 2); const len = Math.hypot(b.x - a.x, b.z - a.z);
    e.set(0, -Math.atan2(b.z - a.z, b.x - a.x), Math.atan2(b.y - a.y, len)); s.set(len, 1, 1);
  }));
  return g;
}

// ------------------------------------------------------------------ landmarks
const glowMat = (hex, k = 2.2) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, roughness: 0.4 });
function lantern(x, y, z) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.26), glowMat(0xffc45a, 2.4)));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.16, 4), new THREE.MeshStandardMaterial({ color: 0x3e3a3c })); cap.position.y = 0.25; cap.rotation.y = Math.PI / 4; g.add(cap);
  g.position.set(x, y, z);
  return g;
}
function lampPost(x, z) {
  const y = L.groundHeight(x, z), g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x6b4024, roughness: 0.85 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.5, 7), wood); pole.position.y = 1.25; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.09, 0.09), wood); arm.position.set(0.3, 2.4, 0); g.add(arm);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), wood); brace.position.set(0.17, 2.2, 0); brace.rotation.z = 0.8; g.add(brace);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xa49aa6, roughness: 0.95 })); base.position.y = 0.17; g.add(base);
  const lan = lantern(0.55, 2.05, 0); lan.scale.setScalar(1.35); g.add(lan);
  g.position.set(x, y, z); g.rotation.y = R(0, 6.28);
  return g;
}
function ancientTree() {
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
function mushrooms() {
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
function camp() {
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
function crystal(hex, s = 1) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.45 * s, 0), glowMat(hex, 2.0)); m.scale.y = 1.7; return m; }
function cave() {
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
function ruins() {
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
function tower() {
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
function woodpile() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 }), end = new THREE.MeshStandardMaterial({ color: 0xe2c08a, roughness: 0.9 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - r; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8), [wood, end, end]); l.rotation.x = Math.PI / 2; l.position.set((i - (4 - r) / 2) * 0.42, 0.2 + r * 0.36, 0); l.castShadow = true; g.add(l); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 2.1), new THREE.MeshStandardMaterial({ color: 0x8a4a2a })); roof.position.y = 1.55; roof.rotation.z = 0.12; g.add(roof);
  g.position.set(-46.5, L.groundHeight(-46.5, 11.5), 11.5); g.rotation.y = 0.5;
  return g;
}
function blossomTree() {
  const m = new THREE.Mesh(leafyGeo(0x6b4024, [0xf07aa8, 0xff9fc4, 0xffc6dc], { h: 3.0, r: 3.0, clumps: 13, trunkR: 0.42, seed: 9 }), windy(std(), 0.01));
  m.castShadow = true; m.position.set(-48, L.groundHeight(-48, 48) - 0.1, 48); m.scale.setScalar(1.5);
  return m;
}
function stonesAndLilies() {
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
function mountains() {
  const g = new THREE.Group(), parts = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + R(-0.06, 0.06), d = R(150, 215), h = R(34, 78), r = R(30, 52);
    parts.push(tint(at(lumpy(new THREE.ConeGeometry(r, h, 7, 3), 0.1, i), Math.cos(a) * d, h / 2 - 6, Math.sin(a) * d, 1, 1, 1, R(0, 6)), i % 3 ? 0x7f9fd0 : 0x93b1dc, 0.06));
    parts.push(tint(at(new THREE.ConeGeometry(r * 0.3, h * 0.3, 7), Math.cos(a) * d, h * 0.85 - 6, Math.sin(a) * d), 0xf4f8ff, 0.03));
  }
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, d = R(96, 128), r = R(16, 28); parts.push(tint(at(new THREE.SphereGeometry(r, 9, 6), Math.cos(a) * d, -r * 0.42, Math.sin(a) * d, 1, 0.8, 1), i % 2 ? 0x3f9442 : 0x4fa648, 0.1)); }
  const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ vertexColors: true, fog: true })); g.add(m);
  return g;
}
function critters() {
  const n = 110, pos = new Float32Array(n * 3), ph = new Float32Array(n), col = new Float32Array(n * 3);
  const hues = [0xfff2a0, 0xffb3d9, 0xa8e6ff, 0xffffff, 0xffd27a];
  for (let i = 0; i < n; i++) {
    const x = R(-60, 60), z = R(-50, 62);
    pos.set([x, L.groundHeight(x, z) + R(0.6, 2.4), z], i * 3); ph[i] = rnd() * 6.28; const c = C(hues[i % hues.length]); col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { uTime: TIME }, transparent: true, depthWrite: false, vertexColors: true,
    vertexShader: `uniform float uTime; attribute float phase; varying vec3 vC; varying float vA; void main(){ vC = color; vec3 p = position; p.x += sin(uTime * 0.7 + phase) * 1.6; p.z += cos(uTime * 0.5 + phase * 1.7) * 1.6; p.y += sin(uTime * 1.9 + phase * 3.0) * 0.35; vA = 0.6 + 0.4 * sin(uTime * 6.0 + phase * 5.0); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = 34.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC, vA * smoothstep(0.5, 0.12, d)); }` }));
  pts.userData.particles = true; pts.frustumCulled = false;
  return pts;
}

/** Mossy boulders stacked beside the waterfall and at its foot, so the cliff reads as rock, not a grey wall. */
function fallRocks() {
  const fx = L.riverX(L.RIVER_START), top = L.groundHeight(fx, -60) + 0.45, parts = [];
  const rock = (x, y, z, r, seed) => {
    let g = lumpy(new THREE.IcosahedronGeometry(r, 1), 0.2, seed, false); g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv');
    const n = g.attributes.position.count, col = new Float32Array(n * 3), a = C(seed % 2 ? 0x9d9aa8 : 0xb4b0bf), moss = C(0x74b84a), t = new THREE.Color();
    for (let i = 0; i < n; i++) { t.copy(a); if (g.attributes.position.getY(i) > r * 0.5) t.lerp(moss, 0.8); col.set([t.r, t.g, t.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.scale(1, 0.8, 0.9); g.translate(x, y, z); g.computeVertexNormals(); parts.push(g);
  };
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    const f = i / 8, x = fx + side * (3.9 + (i % 3) * 1.5 + f * 1.2), z = -53.4 + (i % 2) * 1.3 + f * 0.6;
    rock(x, L.WATER_LEVEL + f * (top - L.WATER_LEVEL) * 0.95, z, 1.5 - f * 0.5 + (i % 2) * 0.3, i * 3 + (side > 0 ? 1 : 0));
  }
  for (let i = 0; i < 6; i++) rock(fx + (i - 2.5) * 1.5 + ((i * 7) % 3) * 0.3, L.WATER_LEVEL - 0.25, -51.3 + (i % 2) * 0.8, 0.75 + (i % 3) * 0.2, 40 + i);
  const m = new THREE.Mesh(mergeGeometries(parts), std({ flatShading: true })); m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ------------------------------------------------------------------ riverside and ground dressing (both regions)
function riverside() {
  const g = new THREE.Group(), reeds = [], pads = [], blooms = [];
  for (let z = Math.max(L.RIVER_START + 2, -60); z < 62; z += 0.9) {
    if (Math.hypot(L.riverX(z), z) > L.PLAY_RADIUS + 6 || L.BRIDGES.some((b) => Math.abs(z - b.z) < 3.2)) continue;
    for (const side of [-1, 1]) {
      if (rnd() < 0.55) continue;
      const x = L.riverX(z) + side * (L.riverHalf(z) + R(0.2, 1.3)), h = L.groundHeight(x, z);
      if (h > 0.25 || h < L.WATER_LEVEL - 0.25 || L.pathDistance(x, z) < 1.2) continue;
      for (let k = 0; k < 3; k++) reeds.push({ x: x + R(-0.35, 0.35), z: z + R(-0.35, 0.35), y: Math.max(h, L.WATER_LEVEL - 0.1), s: R(0.8, 1.4), rot: R(0, 6.28), c: rnd() });
    }
    if (rnd() < 0.2) { const x = L.riverX(z) + R(-1, 1) * (L.riverHalf(z) - 1.1); if (L.inWater(x, z)) { pads.push({ x, z, s: R(0.32, 0.6), rot: R(0, 6.28) }); if (rnd() < 0.4) blooms.push({ x, z, c: rnd() }); } }
  }
  const leaf = new THREE.ConeGeometry(0.07, 1.3, 4); leaf.translate(0, 0.65, 0);
  const stalk = mergeGeometries([leaf, at(leaf.clone(), 0.12, 0, 0.05, 1, 0.8, 1, 0, 0, -0.25), at(leaf.clone(), -0.1, 0, -0.08, 1, 0.7, 1, 0, 0.2, 0.3)]); stalk.deleteAttribute('uv');
  const rm = instanced(stalk, windy(new THREE.MeshStandardMaterial({ roughness: 1 }), 0.05), reeds, (t, p, e, s, i, m) => { p.set(t.x, t.y, t.z); e.set(0, t.rot, 0); s.setScalar(t.s); m.setColorAt(i, C(t.c < 0.5 ? 0x5fae3c : 0x86c84a)); }, false);
  rm.userData.density = true; g.add(rm);
  const cat = new THREE.CapsuleGeometry(0.07, 0.26, 3, 6); cat.translate(0.02, 1.25, 0); cat.deleteAttribute('uv');
  g.add(instanced(cat, new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.9 }), reeds.filter((_, i) => i % 3 === 0), (t, p, e, s) => { p.set(t.x, t.y, t.z); e.set(0, t.rot, 0); s.setScalar(t.s); }, false));
  const pad = new THREE.CircleGeometry(1, 12, 0.5, 5.5); pad.rotateX(-Math.PI / 2); pad.deleteAttribute('uv');
  g.add(instanced(pad, new THREE.MeshStandardMaterial({ color: 0x4fb85a, roughness: 0.8 }), pads, (t, p, e, s) => { p.set(t.x, L.WATER_LEVEL + 0.03, t.z); e.set(0, t.rot, 0); s.setScalar(t.s); }, false));
  const bl = new THREE.SphereGeometry(0.16, 7, 5); bl.scale(1, 0.6, 1); bl.deleteAttribute('uv');
  g.add(instanced(bl, new THREE.MeshStandardMaterial({ roughness: 0.6 }), blooms, (t, p, e, s, i, m) => { p.set(t.x, L.WATER_LEVEL + 0.12, t.z); e.set(0, 0, 0); s.setScalar(1); m.setColorAt(i, C(t.c < 0.5 ? 0xff9fc8 : 0xffffff)); }, false));
  return g;
}
function bushes() {
  const g = new THREE.Group();
  const list = scatterGround(L.NAME === 'village' ? 150 : 190, (x, z) => L.pathDistance(x, z) > 1.3 && L.pathDistance(x, z) < 9 && L.walkable(x, z, 1.2) && Math.hypot(x, z) < L.PLAY_RADIUS && !(L.NAME === 'village' && x < -12 && x > -36 && z > 22 && z < 40) && Math.hypot(x + 6.4, z - 19.5) > 6 && Math.hypot(x, z - 4) > 7);
  const parts = [];
  for (let i = 0; i < 5; i++) { const a = i * 1.257; parts.push(lumpy(new THREE.IcosahedronGeometry(i ? 0.34 : 0.46, 1), 0.14, i + 2).translate(i ? Math.cos(a) * 0.34 : 0, i ? 0.28 : 0.42, i ? Math.sin(a) * 0.34 : 0)); }
  const geo = mergeGeometries(parts);
  const bm = instanced(geo, windy(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 0.02), list, (t, p, e, s, i, m) => { p.set(t.x, L.groundHeight(t.x, t.z) - 0.05, t.z); e.set(0, t.rot, 0); s.setScalar(t.s * 0.95); m.setColorAt(i, C(t.c < 0.4 ? 0x4fa83a : t.c < 0.75 ? 0x6cc044 : 0x8fd24e)); });
  g.add(bm);
  const dots = [];
  list.forEach((t, k) => { if (k % 2) return; for (let i = 0; i < 6; i++) { const a = i * 1.05 + k; dots.push({ x: t.x + Math.cos(a) * 0.42 * t.s, z: t.z + Math.sin(a) * 0.42 * t.s, y: 0.42 + (i % 3) * 0.16, s: t.s, c: (k * 0.37) % 1 }); } });
  const dot = new THREE.SphereGeometry(0.085, 6, 4); dot.deleteAttribute('uv');
  const hues = [0xffffff, 0xff8fc0, 0xffd84a, 0xe2483e, 0xb69cf2];
  const dm = instanced(dot, new THREE.MeshStandardMaterial({ roughness: 0.7 }), dots, (t, p, e, s, i, m) => { p.set(t.x, L.groundHeight(t.x, t.z) + t.y * t.s, t.z); e.set(0, 0, 0); s.setScalar(t.s); m.setColorAt(i, C(hues[Math.floor(t.c * hues.length)])); }, false);
  dm.userData.density = true; g.add(dm);
  return g;
}
/** Barrel, crate, bench, hay bale, pumpkin cart: small props that make the village feel lived in. */
function prop(kind, x, z, rot = 0, s = 1) {
  const g = new THREE.Group(), mat = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const wood = mat(0xa8743f), dark = mat(0x6b4024), iron = mat(0x4a4648, 0.5);
  const M = (geo, m, px, py, pz, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  if (kind === 'barrel') { const b = M(new THREE.CylinderGeometry(0.34, 0.3, 0.86, 12), wood, 0, 0.43, 0); b.scale.set(1.12, 1, 1.12); for (const y of [0.16, 0.7]) M(new THREE.TorusGeometry(0.36, 0.035, 5, 16), iron, 0, y, 0, Math.PI / 2); M(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), dark, 0, 0.87, 0); }
  if (kind === 'crate') { M(new THREE.BoxGeometry(0.72, 0.6, 0.72), wood, 0, 0.3, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) M(new THREE.BoxGeometry(0.09, 0.64, 0.09), dark, sx * 0.34, 0.31, sz * 0.34); M(new THREE.BoxGeometry(0.76, 0.07, 0.76), dark, 0, 0.6, 0); }
  if (kind === 'fruit') { M(new THREE.BoxGeometry(0.8, 0.36, 0.6), wood, 0, 0.18, 0); const cols = [0xe23a2a, 0xf6c62e, 0x8fd05a, 0xf08a3c]; for (let i = 0; i < 9; i++) M(new THREE.SphereGeometry(0.11, 7, 5), mat(cols[i % 4], 0.5), -0.26 + (i % 3) * 0.26, 0.42, -0.17 + Math.floor(i / 3) * 0.17); }
  if (kind === 'bench') { M(new THREE.BoxGeometry(1.7, 0.09, 0.5), wood, 0, 0.5, 0); M(new THREE.BoxGeometry(1.7, 0.42, 0.08), wood, 0, 0.86, -0.24, -0.15); for (const sx of [-1, 1]) { M(new THREE.BoxGeometry(0.1, 0.5, 0.46), dark, sx * 0.72, 0.25, 0); M(new THREE.BoxGeometry(0.09, 0.62, 0.09), dark, sx * 0.72, 0.8, -0.25, -0.15); } }
  if (kind === 'hay') { const h = M(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 14), mat(0xe6c35a, 1), 0, 0.55, 0, 0, 0, Math.PI / 2); h.scale.z = 1; for (const sx of [-0.3, 0.3]) M(new THREE.TorusGeometry(0.56, 0.025, 4, 16), mat(0xb48d45), sx, 0.55, 0, 0, Math.PI / 2); }
  if (kind === 'anvil') { M(new THREE.CylinderGeometry(0.42, 0.46, 0.6, 10), wood, 0, 0.3, 0); M(new THREE.BoxGeometry(0.34, 0.2, 0.3), iron, 0, 0.7, 0); M(new THREE.BoxGeometry(0.8, 0.16, 0.36), iron, 0, 0.88, 0); const horn = M(new THREE.ConeGeometry(0.13, 0.4, 8), iron, 0.58, 0.88, 0, 0, 0, -Math.PI / 2); horn.scale.z = 1; }
  if (kind === 'cart') { M(new THREE.BoxGeometry(1.5, 0.12, 0.95), wood, 0, 0.55, 0); for (const sz of [-1, 1]) { M(new THREE.BoxGeometry(1.5, 0.3, 0.07), dark, 0, 0.75, sz * 0.46); const w = M(new THREE.TorusGeometry(0.36, 0.06, 6, 14), dark, -0.2, 0.37, sz * 0.56); w.rotation.set(0, 0, 0); M(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), iron, -0.2, 0.37, sz * 0.56, Math.PI / 2); }
    M(new THREE.BoxGeometry(0.07, 0.3, 0.95), dark, -0.72, 0.75, 0); M(new THREE.BoxGeometry(0.9, 0.06, 0.06), dark, 1.15, 0.5, 0.3, 0, 0, -0.2); M(new THREE.BoxGeometry(0.9, 0.06, 0.06), dark, 1.15, 0.5, -0.3, 0, 0, -0.2);
    for (const [px, pz, r] of [[-0.3, 0.1, 0.34], [0.3, -0.12, 0.28], [0.1, 0.25, 0.22]]) { const pk = M(new THREE.SphereGeometry(r, 10, 8), mat(0xf08a2c, 0.6), px, 0.62 + r * 0.8, pz); pk.scale.y = 0.8; M(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 5), mat(0x4f8a3a), px, 0.62 + r * 1.5, pz); } }
  g.position.set(x, L.groundHeight(x, z), z); g.rotation.y = rot; g.scale.setScalar(s);
  return g;
}
/** Triangular flags on a line between two posts. */
function bunting(ax, az, bx, bz, h = 3.4) {
  const g = new THREE.Group(), cols = [0xe2483e, 0xf6c62e, 0x3d8fd6, 0x5fb84a, 0xf08ab0], wood = new THREE.MeshStandardMaterial({ color: 0x6b4024 });
  const ya = L.groundHeight(ax, az), yb = L.groundHeight(bx, bz), n = Math.max(6, Math.round(Math.hypot(bx - ax, bz - az) / 0.75)), ang = -Math.atan2(bz - az, bx - ax);
  for (const [x, y, z] of [[ax, ya, az], [bx, yb, bz]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 6), wood); p.position.set(x, y + h / 2, z); p.castShadow = true; g.add(p); }
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.24, 0, 0, 0.24, 0, 0, 0, -0.5, 0], 3)); tri.computeVertexNormals();
  const flags = [];
  for (let i = 1; i < n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * 0.55; const f = new THREE.Mesh(tri, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.8 })); f.position.set(ax + (bx - ax) * t, ya + (yb - ya) * t + h - 0.1 - sag, az + (bz - az) * t); f.rotation.y = ang; g.add(f); flags.push(f); }
  g.userData.update = (t) => { flags.forEach((f, i) => { f.rotation.x = Math.sin(t * 2.2 + i * 0.9) * 0.22; }); };
  return g;
}
/** Soft grey puffs rising from a chimney top. */
function smoke(x, y, z) {
  const n = 14, pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); ph[i] = i / n; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: { uTime: TIME }, transparent: true, depthWrite: false,
    vertexShader: `uniform float uTime; attribute float phase; varying float vA; void main(){ float t = fract(uTime * 0.11 + phase); vec3 p = position; p.y += t * 4.2; p.x += sin(t * 5.0 + phase * 20.0) * 0.35 + t * 1.1; p.z += cos(t * 4.0 + phase * 11.0) * 0.25; vA = (1.0 - t) * 0.5 * smoothstep(0.0, 0.12, t); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (130.0 + 330.0 * t) / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.96, 0.95, 0.94, vA * smoothstep(0.5, 0.05, d)); }` }));
  pts.userData.particles = true; pts.frustumCulled = false;
  return pts;
}

/** Friendly creatures: bouncing slimes and hopping bunnies (decoration only, no collision). */
function creatures() {
  const g = new THREE.Group(), list = [];
  const spots = scatterGround(11, (x, z) => L.walkable(x, z, 1.5) && L.pathDistance(x, z) > 2.5 && L.pathDistance(x, z) < 14 && Math.hypot(x, z) < L.PLAY_RADIUS - 6);
  const eye = new THREE.MeshBasicMaterial({ color: 0x24140c }), white = new THREE.MeshBasicMaterial({ color: 0xffffff }), blush = new THREE.MeshBasicMaterial({ color: 0xff9fb0 });
  const face = (o, y, z, w) => { for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eye); e.position.set(sx * w, y, z); o.add(e); const h = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), white); h.position.set(sx * w + 0.02, y + 0.03, z + 0.05); o.add(h); const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), blush); b.scale.set(1.3, 0.6, 0.4); b.position.set(sx * (w + 0.12), y - 0.08, z - 0.01); o.add(b); } };
  spots.forEach((sp, i) => {
    const o = new THREE.Group(), slime = i % 2 === 0;
    if (slime) {
      const hue = [0x6fc8ff, 0x8fe08a, 0xffb0d0][i % 3];
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), new THREE.MeshStandardMaterial({ color: hue, roughness: 0.15, transparent: true, opacity: 0.88, emissive: hue, emissiveIntensity: 0.15 }));
      body.scale.set(1, 0.78, 1); body.position.y = 0.34; body.castShadow = true; o.add(body);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 8), body.material); tip.position.set(0.05, 0.76, 0); tip.rotation.z = -0.3; o.add(tip);
      face(o, 0.36, 0.4, 0.15);
    } else {
      const fur = new THREE.MeshStandardMaterial({ color: i % 4 === 1 ? 0xfaf6ee : 0xd9b48a, roughness: 0.95 }), pink = new THREE.MeshStandardMaterial({ color: 0xffb6c8 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), fur); body.scale.set(0.9, 0.85, 1.1); body.position.y = 0.28; body.castShadow = true; o.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), fur); head.position.set(0, 0.56, 0.2); o.add(head);
      for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 3, 6), fur); ear.position.set(sx * 0.1, 0.9, 0.16); ear.rotation.z = -sx * 0.18; o.add(ear); const inn = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 3, 5), pink); inn.position.set(sx * 0.1, 0.9, 0.205); inn.rotation.z = -sx * 0.18; o.add(inn); }
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })); tail.position.set(0, 0.3, -0.33); o.add(tail);
      face(o, 0.6, 0.42, 0.1);
    }
    g.add(o); list.push({ o, slime, x: sp.x, z: sp.z, r: 0.8 + (i % 3) * 0.5, ph: i * 1.7, sp: (slime ? 0.25 : 0.45) * (i % 2 ? 1 : -1) });
  });
  if (L.NAME === 'village') {      // a corgi trotting round the well and an owl on the market sign
    const dog = new THREE.Group(), fur = new THREE.MeshStandardMaterial({ color: 0xe8a04a, roughness: 0.95 }), cream = new THREE.MeshStandardMaterial({ color: 0xfff4e2, roughness: 0.95 });
    const B = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; dog.add(o); return o; };
    B(new THREE.SphereGeometry(0.3, 12, 10), fur, 0, 0.36, 0, 0.85, 0.8, 1.45); B(new THREE.SphereGeometry(0.22, 10, 8), cream, 0, 0.3, 0.2, 0.8, 0.7, 0.9);
    B(new THREE.SphereGeometry(0.25, 12, 10), fur, 0, 0.62, 0.42); B(new THREE.SphereGeometry(0.13, 10, 8), cream, 0, 0.56, 0.62, 1, 0.8, 1.1);
    B(new THREE.SphereGeometry(0.04, 6, 5), eye, 0, 0.6, 0.76);
    for (const sx of [-1, 1]) { B(new THREE.ConeGeometry(0.09, 0.2, 6), fur, sx * 0.14, 0.9, 0.38); B(new THREE.CapsuleGeometry(0.06, 0.12, 3, 6), cream, sx * 0.14, 0.12, 0.3); B(new THREE.CapsuleGeometry(0.06, 0.12, 3, 6), cream, sx * 0.14, 0.12, -0.3); }
    const tailD = B(new THREE.SphereGeometry(0.11, 8, 6), cream, 0, 0.5, -0.45);
    B(new THREE.TorusGeometry(0.2, 0.045, 6, 14), new THREE.MeshStandardMaterial({ color: 0xd23b30 }), 0, 0.5, 0.3).rotation.x = 1.2;
    face(dog, 0.68, 0.62, 0.1);
    g.add(dog); list.push({ o: dog, dog: true, tail: tailD, x: 0, z: 4, r: 4.2, ph: 1, sp: 0.35 });
    const owl = new THREE.Group(), brown = new THREE.MeshStandardMaterial({ color: 0x9a6a3c, roughness: 0.95 });
    const O = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); owl.add(o); return o; };
    O(new THREE.SphereGeometry(0.2, 12, 10), brown, 0, 0.2, 0, 1, 1.15, 0.9); O(new THREE.SphereGeometry(0.15, 10, 8), cream, 0, 0.16, 0.08, 0.9, 1, 0.7);
    for (const sx of [-1, 1]) { O(new THREE.SphereGeometry(0.075, 10, 8), cream, sx * 0.075, 0.3, 0.14); O(new THREE.SphereGeometry(0.04, 8, 6), eye, sx * 0.075, 0.3, 0.2); O(new THREE.ConeGeometry(0.045, 0.1, 5), brown, sx * 0.11, 0.44, 0.02); O(new THREE.SphereGeometry(0.1, 8, 6), brown, sx * 0.19, 0.2, 0, 0.4, 1, 0.8); }
    O(new THREE.ConeGeometry(0.03, 0.06, 5), new THREE.MeshStandardMaterial({ color: 0xf0a030 }), 0, 0.25, 0.2).rotation.x = Math.PI / 2;
    owl.position.set(2.9, L.groundHeight(2.9, 14.5) + 2.32, 14.5); g.add(owl); list.push({ o: owl, owl: true });
  }
  g.userData.update = (t) => {
    for (const c of list) {
      if (c.owl) { c.o.rotation.y = Math.sin(t * 0.5) * 1.1; c.o.scale.y = 1 + Math.sin(t * 2) * 0.03; continue; }
      if (c.dog) { const a = c.ph + t * c.sp, x = c.x + Math.cos(a) * c.r, z = c.z + Math.sin(a) * c.r; c.o.position.set(x, L.groundHeight(x, z) + Math.abs(Math.sin(t * 9)) * 0.06, z); c.o.rotation.y = -a; c.tail.position.x = Math.sin(t * 14) * 0.06; continue; }
      const a = c.ph + t * c.sp, x = c.x + Math.cos(a) * c.r, z = c.z + Math.sin(a) * c.r, hop = Math.abs(Math.sin(t * (c.slime ? 2.4 : 5) + c.ph));
      if (!L.walkable(x, z, 0.4)) continue;
      c.o.position.set(x, L.groundHeight(x, z) + hop * (c.slime ? 0.22 : 0.3), z); c.o.rotation.y = -a + (c.sp > 0 ? 0 : Math.PI);
      if (c.slime) c.o.scale.set(1 + (1 - hop) * 0.18, 0.82 + hop * 0.3, 1 + (1 - hop) * 0.18);
    }
  };
  g.userData.update(0);
  return g;
}

// ------------------------------------------------------------------ village landmarks
export const MARKET_JARS = [[-6.4, 17.2], [-6.4, 18.75], [-6.4, 20.3], [-6.4, 21.85]];
export const MARKET_CUSTOMER = [-3.2, 22.6];
function well() {
  const g = new THREE.Group(), stone = new THREE.MeshStandardMaterial({ color: 0xb4afbe, roughness: 0.95, flatShading: true }), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 1.0, 12, 1, true), stone); ring.position.y = 0.5; ring.material.side = THREE.DoubleSide; ring.castShadow = true; g.add(ring);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.2, 14), new THREE.MeshStandardMaterial({ color: 0x3fb6e0, roughness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.7; g.add(water);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 0.16), wood); p.position.set(sx * 1.15, 1.7, 0); p.castShadow = true; g.add(p); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 4), new THREE.MeshStandardMaterial({ color: 0x3d6fc6, roughness: 0.8 })); roof.position.y = 3.4; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.3, 6), wood); bar.rotation.z = Math.PI / 2; bar.position.y = 2.5; g.add(bar);
  g.position.set(0, L.groundHeight(0, 4), 4);
  return g;
}
function marketStall() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x9a6436, roughness: 0.85 });
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8; const c = cv.getContext('2d');
  for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff6ea' : '#e2402f'; c.fillRect(i * 8, 0, 8, 8); }
  const stripes = new THREE.CanvasTexture(cv); stripes.colorSpace = THREE.SRGBColorSpace; stripes.magFilter = THREE.NearestFilter;
  for (const [x, z] of [[-1, -2.2], [-1, 2.2], [1.3, -2.2], [1.3, 2.2]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), wood); p.position.set(x, 1.3, z); p.castShadow = true; g.add(p); }
  const awning = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 5.0), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.9 })); awning.position.set(0.25, 2.7, 0); awning.rotation.z = -0.22; awning.castShadow = true; g.add(awning);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 4.4), new THREE.MeshStandardMaterial({ color: 0xb97d46, roughness: 0.85 })); counter.position.set(-0.6, 0.47, 0); counter.castShadow = true; g.add(counter);
  const fruit = [0xe2402f, 0xf4b942, 0x6fbf4a, 0xe2402f, 0xf08a3c];
  for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 5), new THREE.MeshStandardMaterial({ color: fruit[i % 5], roughness: 0.6 })); f.position.set(-0.6 + (i % 2) * 0.28 - 0.14, 1.05, -1.9 + i * 0.29); g.add(f); }
  g.position.set(-8.6, L.groundHeight(-8.6, 19.5), 19.5);
  return g;
}
function jarRow() {
  const g = new THREE.Group(), clay = new THREE.MeshStandardMaterial({ color: 0x5c6f9a, roughness: 0.6 }), crate = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 });
  const prof = [[0.01, 0], [0.34, 0.03], [0.44, 0.3], [0.36, 0.58], [0.26, 0.66], [0.3, 0.72]].map(([r, y]) => new THREE.Vector2(r, y));
  for (const [x, z] of MARKET_JARS) {
    const y = L.groundHeight(x, z), b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), crate); b.position.set(x, y + 0.35, z); b.castShadow = true; g.add(b);
    const j = new THREE.Mesh(new THREE.LatheGeometry(prof, 14), clay); j.position.set(x, y + 0.7, z); j.castShadow = true; g.add(j);
  }
  return g;
}
function dock() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: 0x6b4024, roughness: 0.9 });
  const x0 = L.riverX(18) - 3.4;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 2.6), wood); deck.position.set(x0 - 0.2, 0.12, 18); deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
  for (const [dx, dz] of [[-2, -1.1], [-2, 1.1], [1.9, -1.1], [1.9, 1.1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 7), dark); p.position.set(x0 - 0.2 + dx, -0.2, 18 + dz); g.add(p); }
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, 6.283, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9a5a30, roughness: 0.8, side: THREE.DoubleSide })); hull.scale.set(0.7, 0.5, 1.7); hull.position.set(x0 + 3.2, L.WATER_LEVEL + 0.32, 20.2); hull.castShadow = true; g.add(hull);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.3), wood); seat.position.set(x0 + 3.2, L.WATER_LEVEL + 0.2, 20.2); g.add(seat);
  for (const [dx, dz] of [[-1.4, 2.0], [-0.8, 2.3]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.9, 10), dark); b.position.set(x0 + dx, L.groundHeight(x0 + dx, 18 + dz) + 0.45, 18 + dz); b.castShadow = true; g.add(b); }
  return g;
}
function farm() {
  const g = new THREE.Group(), soil = new THREE.MeshStandardMaterial({ color: 0x7a4f2c, roughness: 1 }), wood = new THREE.MeshStandardMaterial({ color: 0x9a6436, roughness: 0.85 });
  const crops = [[0x5fb84a, 0.22], [0xf08a3c, 0.2], [0x8fd05a, 0.28], [0xe2c04a, 0.24]];
  for (let r = 0; r < 4; r++) {
    const z = 25.5 + r * 2.9, y = L.groundHeight(-24, z);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(11, 0.24, 1.9), soil); bed.position.set(-24, y + 0.06, z); bed.receiveShadow = true; g.add(bed);
    for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(crops[r][1], 7, 5), new THREE.MeshStandardMaterial({ color: crops[r][0], roughness: 0.8 })); c.position.set(-29 + i * 0.9, y + 0.3, z + (i % 2 ? 0.3 : -0.3)); c.scale.y = r === 3 ? 2.2 : 0.9; g.add(c); }
  }
  const sy = L.groundHeight(-27, 27), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), wood); pole.position.set(-27, sy + 1.2, 27); g.add(pole);
  const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), wood); arms.rotation.z = Math.PI / 2; arms.position.set(-27, sy + 1.7, 27); g.add(arms);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x3d6fc6, roughness: 0.9 })); shirt.position.set(-27, sy + 1.5, 27); shirt.castShadow = true; g.add(shirt);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf1d9a0 })); head.position.set(-27, sy + 2.2, 27); g.add(head);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 10), new THREE.MeshStandardMaterial({ color: 0xd9b25a })); hat.position.set(-27, sy + 2.55, 27); g.add(hat);
  return g;
}
function orchard(list) {
  const cards = leafCards([0x4faa3a, 0x77c948, 0xb4e45c], { h: 2.2, r: 2.3, seed: 6 }), cardMat = leafMat(0.012);
  const g = new THREE.Group(), geo = leafyGeo(0x7a4a26, [0x3a8a2c, 0x4f9e36, 0x62ae40], { h: 2.2, r: 2.3, clumps: 8, trunkR: 0.3, seed: 6 }), apple = new THREE.MeshStandardMaterial({ color: 0xe23a2a, roughness: 0.5 }), lemon = new THREE.MeshStandardMaterial({ color: 0xf6c62e, roughness: 0.5 });
  list.forEach(([x, z], k) => {
    const t = new THREE.Mesh(geo, windy(std(), 0.012)); t.castShadow = true; t.position.set(x, L.groundHeight(x, z) - 0.05, z); t.rotation.y = k * 1.3; g.add(t);
    const lc = new THREE.Mesh(cards, cardMat); lc.castShadow = true; lc.position.copy(t.position); lc.rotation.y = t.rotation.y; g.add(lc);
    for (let i = 0; i < 10; i++) { const a = i * 2.399 + k, f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), k % 3 === 2 ? lemon : apple); f.position.set(x + Math.cos(a) * 1.7, L.groundHeight(x, z) + 2.6 + (i % 4) * 0.45, z + Math.sin(a) * 1.7); g.add(f); }
  });
  return g;
}

async function forestExtras(add, loadModel, shadowed) {
  add(ancientTree()); add(mushrooms()); add(camp()); add(cave()); add(ruins()); add(tower()); add(woodpile()); add(blossomTree()); add(stonesAndLilies());
  for (const [x, z] of [[-31, 56], [-29, 42], [-36, 27], [-33, 4], [-12, -11], [11, -17], [20, -9], [38, -4], [33, 14], [36, 30], [10, 41], [24, 46], [-27, -19], [38, -27], [13, -33]]) add(lampPost(x + 1.9, z + 0.4));
  const cottage = shadowed(await loadModel('bld_cottage_red_v02')); cottage.position.set(-41, L.groundHeight(-41, 7) - 0.05, 7); cottage.rotation.y = Math.PI / 2; cottage.scale.setScalar(1.3); add(cottage);
  const gate = shadowed(await loadModel('prop_forest_gate_v02')); gate.position.set(L.ENTRANCE.x, L.groundHeight(L.ENTRANCE.x, L.ENTRANCE.z + 3), L.ENTRANCE.z + 3); gate.rotation.y = Math.PI; add(gate);
  const title = label('Forest of Memories\nRừng Ký Ức', { size: 30 }); title.position.set(L.ENTRANCE.x, L.groundHeight(L.ENTRANCE.x, L.ENTRANCE.z + 3) + 4.4, L.ENTRANCE.z + 3); add(title);
  signs(add, [[-24.5, 39, 'Camp →\n← Cottage'], [21, -11.5, 'Cave →\nTower ↑'], [-22, -9.5, '← Ruins\nAncient Tree →']]);
}
function signs(add, list) {
  for (const [x, z, text] of list) {
    const y = L.groundHeight(x, z), post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.3, 7), new THREE.MeshStandardMaterial({ color: 0x8a5a30 })); post.position.set(x, y + 1.1, z); post.castShadow = true; add(post);
    const s = label(text, { size: 26, scale: 0.75 }); s.position.set(x, y + 2.7, z); add(s);
  }
}
async function villageExtras(add, loadModel, shadowed) {
  const place = async (name, x, z, rot, scale) => { const m = shadowed(await loadModel(name)); m.position.set(x, L.groundHeight(x, z) - 0.05, z); m.rotation.y = rot; m.scale.setScalar(scale); add(m); return m; };
  await place('bld_hall_blue_v02', 0, -25.5, 0, 1.35);
  await place('bld_shop_orange_v02', 12.5, -8, -Math.PI / 2, 1.3);
  await place('bld_cottage_red_v02', -14.5, -8, Math.PI / 2, 1.3);
  await place('bld_house_blue_v02', -15, 9, Math.PI / 2, 1.3);
  const gate = await place('prop_forest_gate_v02', GATE.x, GATE.z, 0, 1); gate.position.y += 0.05;
  const title = label('Forest of Memories\nRừng Ký Ức', { size: 28 }); title.position.set(GATE.x, L.groundHeight(GATE.x, GATE.z) + 4.4, GATE.z); add(title);
  add(well()); add(marketStall()); add(jarRow()); add(dock()); add(farm()); add(orchard(ORCHARD_TREES));
  const stallName = label("Ben's Word Jars", { size: 28, scale: 0.8 }); stallName.position.set(-8.4, L.groundHeight(-8.6, 19.5) + 3.5, 19.5); add(stallName);
  for (const [x, z] of [[2.6, -12], [-2.6, -2], [2.8, 10], [-3, 16], [1.5, 27], [6, 8.2], [-8, 1.5], [-20, -10], [-26, -26], [32, 9], [42.6, 22], [8, 38]]) add(lampPost(x, z));
  signs(add, [[2.9, 14.5, '← Market\nFarm ↓'], [3.2, 1.2, 'Bridge →\n← Forest'], [30.5, 9.5, 'Orchard']]);
  for (const [kind, x, z, rot, sc] of VILLAGE_PROPS) add(prop(kind, x, z, rot, sc));
  add(bunting(-5.2, -3.2, 5.2, -3.2)); add(bunting(-6.5, 10.5, -6.5, 15.2, 3.0)); add(bunting(5.4, 9.6, 5.4, 2.2, 3.0));
  for (const [x, y, z] of [[4.0, 14.2, -24.3], [14.6, 9.3, -4.6], [-16.5, 7.4, -4.9], [-17.3, 10.6, 12.2]]) add(smoke(x, L.groundHeight(x, z) + y, z));
}
/** kind, x, z, rotation, scale — all outside paths; the big ones are also solids in core/regions/village.js */
export const VILLAGE_PROPS = [
  ['barrel', -9.5, -5.2, 0, 1], ['barrel', -9.2, -6.2, 1, 0.9], ['crate', -9.5, -10.6, 0.3, 1], ['fruit', -9.3, -9.5, 0.2, 1],
  ['bench', -3.4, -4.4, 1.57, 1], ['bench', 4.7, 9.2, 3.14, 1], ['barrel', 7.5, -11.4, 0, 1], ['crate', 7.4, -2.6, 0.5, 1], ['crate', 6.6, -2.0, 0.1, 0.8],
  ['fruit', 7.4, -9.9, 1.57, 1], ['cart', -12.6, 22.6, 0.5, 1], ['hay', -17.5, 22.6, 0.3, 1], ['hay', -18.9, 23.3, 1.2, 1], ['hay', -18.2, 22.9, 0.7, 0.8],
  ['barrel', -10.9, 12.8, 0, 1], ['crate', -8.0, 5.4, 0.2, 1], ['bench', 3.6, -13.6, -1.57, 1], ['barrel', -4.6, -17.6, 0, 1], ['crate', 4.6, -17.4, 0.4, 1],
  ['fruit', -3.6, 23.6, 0.2, 1], ['anvil', 7.6, -13.9, 0.4, 1], ['barrel', 12.2, 19.6, 0, 1], ['crate', 13.3, 20.3, 0.6, 0.9],
];

/** Loose planks bobbing in the river and a warning sign at the west end of a broken bridge (hidden when open). */
function brokenBits(b, base) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.9 });
  const planks = [[-0.6, 1.8, 0.4], [1.1, -2.2, -0.5], [2.4, 0.9, 1.1]].map(([dx, dz, rot]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.42), wood); m.position.set(b.x + dx, L.WATER_LEVEL + 0.04, b.z + dz); m.rotation.y = rot; m.castShadow = true; g.add(m); return m;
  });
  const wx = b.x - L.BRIDGE_LEN / 2 - 1.6, wz = b.z + 1.9, post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.3, 6), wood);
  post.position.set(wx, L.groundHeight(wx, wz) + 0.65, wz); g.add(post);
  const sign = label('⚠ Broken bridge', { size: 30, scale: 0.7, bg: 'rgba(255,214,120,0.95)' }); sign.position.set(wx, L.groundHeight(wx, wz) + 1.6, wz); g.add(sign);
  g.userData.update = (t) => { planks.forEach((m, i) => { m.position.y = L.WATER_LEVEL + 0.04 + Math.sin(t * 1.3 + i * 2) * 0.03; m.rotation.z = Math.sin(t * 0.9 + i) * 0.05; }); };
  return g;
}

/** Things for "Fix the Bridge": rope coil, metal chain, log and boulder (no labels: the word is the task). */
export function bridgeItem(kind) {
  const g = new THREE.Group();
  const mat = (color, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: metal ? 0.35 : 0.9, metalness: metal });
  if (kind === 'rope') { for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42 - i * 0.04, 0.07, 8, 24), mat(0xc9a165)); t.rotation.x = Math.PI / 2; t.position.y = 0.08 + i * 0.13; g.add(t); } }
  else if (kind === 'chain') { for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 6, 14), mat(0x8c939c, 0.8)); t.position.set(-0.6 + i * 0.24, 0.07, Math.sin(i) * 0.1); t.rotation.set(Math.PI / 2, i % 2 ? Math.PI / 2 : 0, 0); g.add(t); } }
  else if (kind === 'log') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 2.2, 12), mat(0x7a4f2a)); c.rotation.z = Math.PI / 2; c.position.y = 0.3; g.add(c);
    for (const sx of [-1.1, 1.1]) { const r = new THREE.Mesh(new THREE.CircleGeometry(0.27, 12), mat(0xe2b97a)); r.position.set(sx * 1.003, 0.3, 0); r.rotation.y = sx * Math.PI / 2; g.add(r); } }
  else { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), mat(0x8f8a84)); r.scale.set(1.2, 0.8, 1); r.position.y = 0.45; g.add(r); }
  g.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return g;
}

/** Builds the active region (core/layout.js). `loadModel(name)` resolves a cloned GLB scene. */
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
