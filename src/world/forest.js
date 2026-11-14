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
  const gA = C(0x58b535), gB = C(0x86d44a), gC = C(0x3f9a3a), path = C(0xe9d29c), dirt = C(0xb98f55), sand = C(0xe9dca6),
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
    const dx = (b.x - a.x) / len, dz = (b.z - a.z) / len, rows = Math.max(2, Math.round(path.w / 0.72));
    for (let t = 0.2; t < len; t += 0.74) for (let r = 0; r < rows; r++) {
      const off = ((r + 0.5) / rows - 0.5) * (path.w - 0.5) + R(-0.1, 0.1), tt = t + (r % 2) * 0.37 + R(-0.08, 0.08);
      const x = a.x + dx * tt - dz * off, z = a.z + dz * tt + dx * off;
      if (L.onBridge(x, z) || L.inWater(x, z)) continue;
      stones.push({ x, z, s: R(0.27, 0.36), rot: R(0, 6.28), c: rnd() });
    }
  }
  const geo = new THREE.CylinderGeometry(1, 1.08, 0.22, 6, 1, false); geo.deleteAttribute('uv');
  const mesh = instanced(geo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), stones, (st, p, e, s, i, m) => {
    p.set(st.x, L.groundHeight(st.x, st.z) + 0.03, st.z); e.set(0, st.rot, 0); s.set(st.s, 0.5, st.s * R(0.85, 1.1));
    m.setColorAt(i, C(st.c < 0.33 ? 0xcfc3b4 : st.c < 0.66 ? 0xdcd2c2 : 0xbfb4a8));
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
function leafyGeo(trunkHex, palette, { h = 2.6, r = 2.1, clumps = 9, trunkR = 0.24, seed = 1 } = {}) {
  const parts = [tint(at(new THREE.CylinderGeometry(trunkR * 0.7, trunkR * 1.35, h, 8), 0, h / 2, 0), trunkHex, 0.14)];
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + seed; parts.push(tint(at(new THREE.CylinderGeometry(0.05, 0.1, 1.3, 5), Math.cos(a) * 0.5, h + 0.2, Math.sin(a) * 0.5, 1, 1, 1, 0, Math.sin(a) * 0.7, -Math.cos(a) * 0.7), trunkHex, 0.1)); }
  for (let i = 0; i < clumps; i++) {
    const y = 1 - ((i + 0.5) / clumps) * 1.5, rr = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.399 + seed;
    const s = r * (0.42 + 0.16 * ((i * 7 + seed) % 5) / 5);
    const g = lumpy(new THREE.IcosahedronGeometry(s, 1), 0.1, i + seed);
    parts.push(tint(at(g, Math.cos(a) * rr * r * 0.62, h + r * 0.55 + y * r * 0.55, Math.sin(a) * rr * r * 0.62), palette[y > 0.35 ? 2 : y > -0.2 ? 1 : 0], 0.16));
  }
  return mergeGeometries(parts);
}
function buildTrees() {
  const g = new THREE.Group();
  const kinds = {
    pine: [pineGeo(), 0.010], oak: [leafyGeo(0x7a4a26, [0x3f9a3a, 0x5fbe3f, 0x9ad64a]), 0.016],
    birch: [leafyGeo(0xe9e4d6, [0x7fc24a, 0xa5d85a, 0xd4e86a], { h: 3.2, r: 1.6, clumps: 7, trunkR: 0.16, seed: 4 }), 0.018],
  };
  for (const [kind, [geo, wind]] of Object.entries(kinds)) {
    const list = L.TREES.filter((t) => t.kind === kind);
    g.add(instanced(geo, windy(std(), wind), list, (t, p, e, s) => { p.set(t.x, L.groundHeight(t.x, t.z) - 0.08, t.z); e.set(0, t.rot, 0); s.setScalar(t.s * (kind === 'pine' ? 1.25 : 1.15)); }));
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
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.07, 0.07), wood); arm.position.set(0.28, 2.4, 0); g.add(arm);
  g.add(lantern(0.5, 2.1, 0));
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
  const g = new THREE.Group(), geo = leafyGeo(0x7a4a26, [0x4faa3a, 0x77c948, 0xa9dd55], { h: 2.2, r: 2.3, clumps: 10, trunkR: 0.3, seed: 6 }), apple = new THREE.MeshStandardMaterial({ color: 0xe23a2a, roughness: 0.5 }), lemon = new THREE.MeshStandardMaterial({ color: 0xf6c62e, roughness: 0.5 });
  list.forEach(([x, z], k) => {
    const t = new THREE.Mesh(geo, windy(std(), 0.012)); t.castShadow = true; t.position.set(x, L.groundHeight(x, z) - 0.05, z); t.rotation.y = k * 1.3; g.add(t);
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
}

/** Builds the active region (core/layout.js). `loadModel(name)` resolves a cloned GLB scene. */
export async function buildWorld(scene, loadModel) {
  const root = new THREE.Group(); root.name = 'world:' + L.NAME; scene.add(root);
  const updaters = [], add = (o) => { root.add(o); if (o.userData.update) updaters.push(o.userData.update); return o; };
  add(buildTerrain());
  const detail = { cobbles: add(buildCobbles()), grass: add(buildGrass()), flowers: add(buildFlowers()), far: add(mountains()), critters: add(critters()) };
  add(buildWater()); add(buildTrees()); add(buildRocks()); add(buildFences());
  const shadowed = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
  for (const b of L.BRIDGES) {
    const m = shadowed(await loadModel('prop_bridge_curved_v02'));
    const base = (L.groundHeight(b.x - L.BRIDGE_LEN / 2 - 0.9, b.z) + L.groundHeight(b.x + L.BRIDGE_LEN / 2 + 0.9, b.z)) / 2;
    m.position.set(b.x, base, b.z); m.rotation.y = Math.PI / 2; add(m);
  }
  if (L.NAME === 'forest') await forestExtras(add, loadModel, shadowed); else await villageExtras(add, loadModel, shadowed);
  // jar labels (village market): four pooled sprites, text swapped per customer
  const jarLabels = [];
  return {
    root, detail,
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
