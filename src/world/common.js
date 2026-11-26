// Shared scenery for every region: terrain, water, trees, grass, fences, lamps, signs, critters, the merge helpers
// (bake / compact) and the seeded random numbers. Built procedurally from core/layout.js.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import * as L from '../core/layout.js';

export const TIME = { value: 0 };
export const C = (hex) => new THREE.Color(hex);
export const rnd = L.mulberry32(77);
export const R = (a, b) => a + rnd() * (b - a);

export function tint(geo, hex, jitter = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv');
  const n = g.attributes.position.count, col = new Float32Array(n * 3), c = C(hex);
  for (let i = 0; i < n; i++) { const k = 1 + (rnd() - 0.5) * jitter; col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
export const at = (geo, x, y, z, sx = 1, sy = sx, sz = sx, ry = 0, rx = 0, rz = 0) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  return geo.applyMatrix4(m);
};
export function lumpy(geo, amount, seed = 1, smoothShade = true) {
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
/** Hand-painted look without texture files: every surface gets soft colour blotches and a fine grain computed from
 *  its world position (so it never repeats or swims), the ground also gets blade-like streaks and sun-bleached
 *  patches. PAINT.on is false on the "low" quality level: the shader is then left untouched. */
export const PAINT = { on: true };
const PAINT_GLSL = `
  varying vec3 vPaintPos;
  float pH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float pN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(pH(i), pH(i+vec2(1,0)), f.x), mix(pH(i+vec2(0,1)), pH(i+vec2(1,1)), f.x), f.y); }`;
export function paint(mat, mode = 'wall') {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    if (!PAINT.on) return;
    sh.vertexShader = 'varying vec3 vPaintPos;\n' + sh.vertexShader.replace('#include <project_vertex>', `
      vec4 paintW = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        paintW = instanceMatrix * paintW;
      #endif
      vPaintPos = (modelMatrix * paintW).xyz;
      #include <project_vertex>`);
    const body = mode === 'ground' ? `
      float pa = pN(vPaintPos.xz * 0.16), pb = pN(vPaintPos.xz * 1.9 + 7.0), pc = pN(vec2(vPaintPos.x * 9.0 + vPaintPos.z * 2.0, vPaintPos.z * 7.0 - vPaintPos.x * 1.5));
      diffuseColor.rgb *= 0.70 + 0.30 * pa + 0.14 * pb + 0.18 * pc;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 1.06, 0.78), smoothstep(0.55, 0.85, pN(vPaintPos.xz * 0.07 + 3.0)) * 0.55);` : `
      vec2 pq = vPaintPos.xz + vPaintPos.y * vec2(0.37, 0.61);
      float pa = pN(pq * 0.55), pb = pN(pq * 4.3 + 11.0);
      diffuseColor.rgb *= 0.80 + 0.22 * pa + 0.14 * pb;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.06, 1.0, 0.90), pa * 0.5);`;
    sh.fragmentShader = PAINT_GLSL + '\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>' + body);
  };
  const key = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => key() + '|paint:' + mode + (PAINT.on ? 1 : 0);
  return mat;
}
export const std = (o = {}) => paint(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, ...o }));
export function windy(mat, strength) {
  const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => key() + '|wind' + strength;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
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
export function instanced(geo, mat, list, place, shadow = true) {
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
/** Merges the plain static meshes of a group into one vertex-coloured mesh (one draw call instead of dozens).
 *  Meshes with a texture, glow, transparency or their own animation are kept as they are. */
export function bake(group) {
  group.updateMatrixWorld(true);
  const parts = [], keep = [], out = new THREE.Group();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material, plain = !o.userData.live && !Array.isArray(m) && (m.isMeshStandardMaterial || m.isMeshBasicMaterial) && !m.map && !m.transparent && !m.vertexColors && m.side === THREE.FrontSide && (!m.emissive || m.emissive.getHex() === 0 || m.emissiveIntensity === 0) && !o.isInstancedMesh && !o.isSkinnedMesh;
    if (!plain) { keep.push(o); return; }
    let g = o.geometry.clone(); g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(o.matrixWorld);
    const n = g.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.set([m.color.r, m.color.g, m.color.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); parts.push(g);
  });
  for (const o of keep) { o.updateMatrixWorld(true); const w = o.matrixWorld.clone(); out.add(o); o.matrix.copy(w); o.matrix.decompose(o.position, o.quaternion, o.scale); }
  if (parts.length) { const mesh = new THREE.Mesh(mergeGeometries(parts), std({ roughness: 0.85 })); mesh.castShadow = true; mesh.receiveShadow = true; out.add(mesh); }
  return out;
}
/** Same, for a small moving thing built at the origin (a creature): its parts become one mesh inside the same group. */
export function compact(group) { const b = bake(group); group.clear(); for (const c of [...b.children]) group.add(c); return group; }
export function buildTerrain() {
  const seg = Math.max(180, Math.round(L.SIZE + 40)), geo = new THREE.PlaneGeometry(L.SIZE + 40, L.SIZE + 40, seg, seg);      // (24/11) about one vertex a metre, as before, on the bigger village map
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  const PL = L.REGIONS[L.NAME].palette || {};      // (26/11) maps 4-7 colour their own ground: sand, snow, mossy stone, cloud
  const gA = C(PL.a || 0x62b83a), gB = C(PL.b || 0x9ad852), gC = C(PL.far || 0x3f9a3a), path = C(PL.path || 0xc9b58c), dirt = C(PL.dirt || 0xa98a5a), sand = C(PL.sand || 0xe9dca6),
    rock = C(PL.rock || 0x9b99a8), rockL = C(PL.rockL || 0xbcb8c6), bed = C(0x2f9aa8), tmp = new THREE.Color(), lowSand = L.REGIONS[L.NAME].lowSand;      // the harbour beach (Map 2)
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
    if (lowSand ? (h < 0.62 && lowSand(x, z)) : (h < 0.28 && z > L.RIVER_START - 2)) tmp.lerp(sand, Math.min(1, ((lowSand ? 0.62 : 0.28) - h) / (lowSand ? 0.45 : 0.3)));      // the harbour island has a wide beach all round
    if (h < L.WATER_LEVEL) tmp.lerp(bed, Math.min(1, (L.WATER_LEVEL - h) / 0.5));
    if (slope > 0.75) tmp.lerp(n > 0.5 ? rockL : rock, Math.min(1, (slope - 0.75) / 0.5));
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, paint(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }), 'ground'));
  mesh.receiveShadow = true;
  return mesh;
}

/** Sunny Harbor (Map 2): the town's roads are wooden boardwalk laid across the road, not the cobblestones of Map 1. */
function boardwalk() {
  const planks = [], tones = [0xb98a52, 0xc79a60, 0xa87a46, 0x9a6d3c];
  for (const path of L.PATHS) for (let i = 0; i < path.pts.length - 1; i++) {
    const a = path.pts[i], b = path.pts[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z), dx = (b.x - a.x) / len, dz = (b.z - a.z) / len, lanes = Math.max(1, Math.ceil(path.w / 2.0)), lw = path.w / lanes;
    for (let t = 0.2; t < len; t += 0.34) for (let k = 0; k < lanes; k++) {
      const off = (k + 0.5) * lw - path.w / 2, tt = t + (k % 2) * 0.17, x = a.x + dx * tt - dz * off, z = a.z + dz * tt + dx * off;
      if (L.onBridge(x, z) || L.inWater(x, z) || L.groundHeight(x, z) < 0.04) continue;
      planks.push({ x, z, len: lw - 0.04, yaw: Math.atan2(-dx, -dz) + R(-0.02, 0.02), c: Math.floor(rnd() * tones.length) });
    }
  }
  const geo = new THREE.BoxGeometry(1, 0.07, 0.3); geo.deleteAttribute('uv');
  return instanced(geo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), planks, (pl, p, e, s, i, m) => {
    p.set(pl.x, L.groundHeight(pl.x, pl.z) + 0.04, pl.z); e.set(0, pl.yaw, 0); s.set(pl.len, 1, 1); m.setColorAt(i, C(tones[pl.c]));
  }, false);
}
export function buildCobbles() {
  if (L.isSea()) return boardwalk();
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
  const geo = lumpy(new THREE.IcosahedronGeometry(1, 0), 0.06, 5); geo.scale(1, 0.34, 1);       // 20 triangles a pebble: thousands of them are drawn
  const mesh = instanced(geo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), stones, (st, p, e, s, i, m) => {
    p.set(st.x, L.groundHeight(st.x, st.z) + 0.02, st.z); e.set(0, st.rot, 0); s.set(st.s, st.s * 0.9, st.s * R(0.78, 1.15));
    m.setColorAt(i, C(st.c < 0.3 ? 0xc9bfb6 : st.c < 0.6 ? 0xddd5ca : st.c < 0.85 ? 0xb5aca8 : 0xcdb9a2));
  }, false);
  return mesh;
}

// ------------------------------------------------------------------ water
export const WATER_VS = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
export function waterMaterial(fall) {
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
        float glint = smoothstep(0.80, 0.96, n(vW.xz * 3.6 + vec2(uTime * 0.7, -uTime * 0.9))) * smoothstep(0.55, 0.9, n(vW.xz * 0.9 - uTime * 0.2));
        col += vec3(1.6, 1.5, 1.2) * glint * (1.0 - foam);            // sun sparkles: bright enough to glow
        gl_FragColor = vec4(col, 0.86 + 0.14 * foam);
      }`,
  });
}
export function buildWater() {
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
export function pineGeo() {
  const parts = [tint(at(new THREE.CylinderGeometry(0.16, 0.26, 1.6, 7), 0, 0.8, 0), 0x7a4a26, 0.15)];
  const tiers = [[1.75, 2.0, 1.5, 0x2f7d3a], [1.45, 1.8, 2.6, 0x38903f], [1.12, 1.6, 3.6, 0x43a046], [0.78, 1.5, 4.55, 0x52b24c], [0.42, 1.2, 5.4, 0x66c256]];
  for (const [r, h, y, c] of tiers) parts.push(tint(at(lumpy(new THREE.ConeGeometry(r, h, 9, 2), 0.07, y), 0, y, 0), c, 0.12));
  return mergeGeometries(parts);
}
export function leafyGeo(trunkHex, palette, { h = 2.6, r = 2.1, clumps = 15, trunkR = 0.26, seed = 1 } = {}) {
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
/** Round, lumpy crowns (the look the owner preferred over leaf cards, which were removed on 17/11). */
export function buildTrees() {
  const g = new THREE.Group();
  const kinds = {
    pine: [pineGeo(), 0.010], oak: [leafyGeo(0x7a4a26, [0x3f9a3a, 0x5fbe3f, 0x9ad64a]), 0.016],
    birch: [leafyGeo(0xe9e4d6, [0x7fc24a, 0xa5d85a, 0xd4e86a], { h: 3.2, r: 1.6, clumps: 7, trunkR: 0.16, seed: 4 }), 0.018],
    gold: [leafyGeo(0x7a4a26, [0xc9b632, 0xe8d84a, 0xf6ee7a], { seed: 2 }), 0.016],
    blossom: [leafyGeo(0x6b4024, [0xf07aa8, 0xff9fc4, 0xffd0e2], { seed: 3 }), 0.016],
    maple: [leafyGeo(0x6b4024, [0xd8482e, 0xf0683a, 0xf99a5a], { seed: 5 }), 0.016],
  };
  // some oaks become golden, blossom or autumn-red trees (same map data, just a different look)
  const look = (t) => { if (t.kind !== 'oak') return t.kind; const k = Math.abs(Math.sin(t.x * 12.9898 + t.z * 78.233) * 43758.5453) % 1; return k < 0.14 ? 'gold' : k < 0.24 ? 'blossom' : k < 0.31 ? 'maple' : 'oak'; };
  for (const [kind, [geo, wind]] of Object.entries(kinds)) {
    const list = L.TREES.filter((t) => look(t) === kind);
    g.add(instanced(geo, windy(std(), wind), list, (t, p, e, s) => { p.set(t.x, L.groundHeight(t.x, t.z) - 0.08, t.z); e.set(0, t.rot, 0); const k = t.s * (kind === 'pine' ? 1.25 : 1.15) * L.treeScale(); s.set(k, k * (kind === 'pine' ? 1.05 : 1.12), k); }));      // treeScale: taller trees (village 17/11)
  }
  return g;
}
export function buildRocks() {
  const geo = lumpy(new THREE.IcosahedronGeometry(1, 1), 0.2, 3, false), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  const a = C(0x9d9aa8), b = C(0xc3bfcc), moss = C(0x74b84a), t = new THREE.Color();
  for (let i = 0; i < n; i++) { const y = geo.attributes.position.getY(i); t.copy(a).lerp(b, 0.5 + 0.5 * Math.sin(i * 1.7)); if (y > 0.55) t.lerp(moss, 0.75); col.set([t.r, t.g, t.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.deleteAttribute('uv');
  return instanced(geo, std({ flatShading: true }), L.ROCKS, (r, p, e, s) => { p.set(r.x, L.groundHeight(r.x, r.z) + 0.25 * r.s, r.z); e.set(0, r.rot, 0); s.set(r.s, r.s * 0.72, r.s * 0.9); });
}
export function scatterGround(count, ok) {
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
export function buildGrass() {
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
export function buildFlowers() {
  const head = new THREE.SphereGeometry(0.15, 6, 3); head.scale(1, 0.55, 1);
  head.deleteAttribute('uv');
  const hues = [0xffffff, 0xff8fc0, 0xffd84a, 0xb69cf2, 0xff6f61, 0x7fc8ff];
  const mesh = instanced(head, new THREE.MeshStandardMaterial({ roughness: 0.8 }), scatterGround(L.isSea() ? 600 : 2200, (x, z) => L.pathDistance(x, z) < 6 || L.riverDistance(x, z) < 9 || rnd() < 0.2), (t, p, e, s, i, m) => {
    p.set(t.x, L.groundHeight(t.x, t.z) + 0.16 * t.s, t.z); e.set(R(-0.3, 0.3), t.rot, 0); s.setScalar(t.s * 0.62);
    m.setColorAt(i, C(hues[Math.floor(t.c * hues.length)]));
  }, false);
  mesh.userData.density = true;
  return mesh;
}
export function buildFences() {
  if (L.isSea()) return new THREE.Group();      // the sea maps have boardwalks, no fences
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
export const glowMat = (hex, k = 2.2) => { const m = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, roughness: 0.4 }); m.userData.nightGlow = true; return m; };
export function lantern(x, y, z) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.26), glowMat(0xffc45a, 2.4)));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.16, 4), new THREE.MeshStandardMaterial({ color: 0x3e3a3c })); cap.position.y = 0.25; cap.rotation.y = Math.PI / 4; g.add(cap);
  g.position.set(x, y, z);
  return g;
}
export function lampPost(x, z) {
  const y = L.groundHeight(x, z), g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x6b4024, roughness: 0.85 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.5, 7), wood); pole.position.y = 1.25; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.09, 0.09), wood); arm.position.set(0.3, 2.4, 0); g.add(arm);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), wood); brace.position.set(0.17, 2.2, 0); brace.rotation.z = 0.8; g.add(brace);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xa49aa6, roughness: 0.95 })); base.position.y = 0.17; g.add(base);
  const lan = lantern(0.55, 2.05, 0); lan.scale.setScalar(1.35); g.add(lan);
  g.position.set(x, y, z); g.rotation.y = R(0, 6.28);
  return g;
}
export function mountains() {
  const g = new THREE.Group(), parts = [];
  const K = Math.max(1, (L.PLAY_RADIUS + 34) / 96);      // (24/11) a bigger play area pushes the far mountains and the foothills out
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + R(-0.06, 0.06), d = R(150, 215) * K, h = R(34, 78), r = R(30, 52);
    parts.push(tint(at(lumpy(new THREE.ConeGeometry(r, h, 7, 3), 0.1, i), Math.cos(a) * d, h / 2 - 6, Math.sin(a) * d, 1, 1, 1, R(0, 6)), i % 3 ? 0x7f9fd0 : 0x93b1dc, 0.06));
    parts.push(tint(at(new THREE.ConeGeometry(r * 0.3, h * 0.3, 7), Math.cos(a) * d, h * 0.85 - 6, Math.sin(a) * d), 0xf4f8ff, 0.03));
  }
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, d = R(96, 128) * K, r = R(16, 28); parts.push(tint(at(new THREE.SphereGeometry(r, 9, 6), Math.cos(a) * d, -r * 0.42, Math.sin(a) * d, 1, 0.8, 1), i % 2 ? 0x3f9442 : 0x4fa648, 0.1)); }
  const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ vertexColors: true, fog: true })); g.add(m);
  return g;
}
export function critters() {
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
export function fallRocks() {
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
export function riverside() {
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
export function bushes() {
  const g = new THREE.Group();
  const list = scatterGround(L.NAME === 'village' ? 150 : L.isSea() ? 60 : 190, (x, z) => L.pathDistance(x, z) > 1.3 && L.pathDistance(x, z) < 9 && L.walkable(x, z, 1.2) && Math.hypot(x, z) < L.PLAY_RADIUS && !(L.NAME === 'village' && x < -12 && x > -36 && z > 22 && z < 40) && Math.hypot(x + 6.4, z - 19.5) > 6 && Math.hypot(x, z - 4) > 7);
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
export function prop(kind, x, z, rot = 0, s = 1) {
  const g = new THREE.Group(), mat = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const wood = mat(0xa8743f), dark = mat(0x6b4024), iron = mat(0x4a4648, 0.5);
  const M = (geo, m, px, py, pz, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  if (kind === 'barrel') { const b = M(new THREE.CylinderGeometry(0.34, 0.3, 0.86, 12), wood, 0, 0.43, 0); b.scale.set(1.12, 1, 1.12); for (const y of [0.16, 0.7]) M(new THREE.TorusGeometry(0.36, 0.035, 5, 16), iron, 0, y, 0, Math.PI / 2); M(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), dark, 0, 0.87, 0); }
  if (kind === 'crate') { M(new THREE.BoxGeometry(0.72, 0.6, 0.72), wood, 0, 0.3, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) M(new THREE.BoxGeometry(0.09, 0.64, 0.09), dark, sx * 0.34, 0.31, sz * 0.34); M(new THREE.BoxGeometry(0.76, 0.07, 0.76), dark, 0, 0.6, 0); }
  if (kind === 'fruit') { M(new THREE.BoxGeometry(0.8, 0.36, 0.6), wood, 0, 0.18, 0); const cols = [0xe23a2a, 0xf6c62e, 0x8fd05a, 0xf08a3c]; for (let i = 0; i < 9; i++) M(new THREE.SphereGeometry(0.11, 7, 5), mat(cols[i % 4], 0.5), -0.26 + (i % 3) * 0.26, 0.42, -0.17 + Math.floor(i / 3) * 0.17); }
  if (kind === 'bench') { M(new THREE.BoxGeometry(1.7, 0.09, 0.5), wood, 0, 0.5, 0); M(new THREE.BoxGeometry(1.7, 0.42, 0.08), wood, 0, 0.86, -0.24, -0.15); for (const sx of [-1, 1]) { M(new THREE.BoxGeometry(0.1, 0.5, 0.46), dark, sx * 0.72, 0.25, 0); M(new THREE.BoxGeometry(0.09, 0.62, 0.09), dark, sx * 0.72, 0.8, -0.25, -0.15); } }
  if (kind === 'hay') { const h = M(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 14), mat(0xe6c35a, 1), 0, 0.55, 0, 0, 0, Math.PI / 2); h.scale.z = 1; for (const sx of [-0.3, 0.3]) M(new THREE.TorusGeometry(0.56, 0.025, 4, 16), mat(0xb48d45), sx, 0.55, 0, 0, Math.PI / 2); }
  if (kind === 'target') { M(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 6), dark, 0, 0.65, 0); for (const [r, c, z] of [[0.55, 0xf4efe6, 0], [0.4, 0xe2483e, 0.02], [0.25, 0xf4efe6, 0.04], [0.11, 0xe2483e, 0.06]]) M(new THREE.CylinderGeometry(r, r, 0.06, 18), mat(c), 0, 1.5, z, Math.PI / 2); }
  if (kind === 'anvil') { M(new THREE.CylinderGeometry(0.42, 0.46, 0.6, 10), wood, 0, 0.3, 0); M(new THREE.BoxGeometry(0.34, 0.2, 0.3), iron, 0, 0.7, 0); M(new THREE.BoxGeometry(0.8, 0.16, 0.36), iron, 0, 0.88, 0); const horn = M(new THREE.ConeGeometry(0.13, 0.4, 8), iron, 0.58, 0.88, 0, 0, 0, -Math.PI / 2); horn.scale.z = 1; }
  if (kind === 'cart') { M(new THREE.BoxGeometry(1.5, 0.12, 0.95), wood, 0, 0.55, 0); for (const sz of [-1, 1]) { M(new THREE.BoxGeometry(1.5, 0.3, 0.07), dark, 0, 0.75, sz * 0.46); const w = M(new THREE.TorusGeometry(0.36, 0.06, 6, 14), dark, -0.2, 0.37, sz * 0.56); w.rotation.set(0, 0, 0); M(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), iron, -0.2, 0.37, sz * 0.56, Math.PI / 2); }
    M(new THREE.BoxGeometry(0.07, 0.3, 0.95), dark, -0.72, 0.75, 0); M(new THREE.BoxGeometry(0.9, 0.06, 0.06), dark, 1.15, 0.5, 0.3, 0, 0, -0.2); M(new THREE.BoxGeometry(0.9, 0.06, 0.06), dark, 1.15, 0.5, -0.3, 0, 0, -0.2);
    for (const [px, pz, r] of [[-0.3, 0.1, 0.34], [0.3, -0.12, 0.28], [0.1, 0.25, 0.22]]) { const pk = M(new THREE.SphereGeometry(r, 10, 8), mat(0xf08a2c, 0.6), px, 0.62 + r * 0.8, pz); pk.scale.y = 0.8; M(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 5), mat(0x4f8a3a), px, 0.62 + r * 1.5, pz); } }
  g.position.set(x, L.groundHeight(x, z), z); g.rotation.y = rot; g.scale.setScalar(s);
  return g;
}
/** Triangular flags on a line between two posts. */
export function bunting(ax, az, bx, bz, h = 3.4) {
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
export function smoke(x, y, z) {
  const n = 14, pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); ph[i] = i / n; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: { uTime: TIME }, transparent: true, depthWrite: false,
    vertexShader: `uniform float uTime; attribute float phase; varying float vA; void main(){ float t = fract(uTime * 0.11 + phase); vec3 p = position; p.y += t * 4.2; p.x += sin(t * 5.0 + phase * 20.0) * 0.35 + t * 1.1; p.z += cos(t * 4.0 + phase * 11.0) * 0.25; vA = (1.0 - t) * 0.5 * smoothstep(0.0, 0.12, t); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (130.0 + 330.0 * t) / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.96, 0.95, 0.94, vA * smoothstep(0.5, 0.05, d)); }` }));
  pts.userData.particles = true; pts.frustumCulled = false;
  return pts;
}

// Animals redrawn 18/11 ("make the animals nicer"): more rounded shapes, bigger, with proper faces (eye whites and
// shine, nose, inner ears, whiskers), a hen with comb and wattle instead of the toy slimes, and a fuller corgi.
const SM = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });
function part(g, geo, m, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); o.castShadow = true; g.add(o); return o; }
function eyes(g, y, z, w, r = 0.055) {
  const dark = new THREE.MeshBasicMaterial({ color: 0x1a0e08 }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const sx of [-1, 1]) { part(g, new THREE.SphereGeometry(r * 1.25, 12, 10), white, sx * w, y, z - 0.01); part(g, new THREE.SphereGeometry(r, 12, 10), dark, sx * w, y, z + r * 0.4); part(g, new THREE.SphereGeometry(r * 0.32, 6, 5), white, sx * w + r * 0.3, y + r * 0.35, z + r * 1.1); }
}
export function rabbit(furHex) {
  const g = new THREE.Group(), fur = SM(furHex, 0.95), belly = SM(0xfffaf2, 0.95), pink = SM(0xffaec0, 0.7), dark = SM(0x5a3a30, 0.6);
  part(g, new THREE.SphereGeometry(0.3, 24, 18), fur, 0, 0.3, -0.05, 0.95, 0.88, 1.15);             // body
  for (const sx of [-1, 1]) { part(g, new THREE.SphereGeometry(0.16, 18, 14), fur, sx * 0.17, 0.22, -0.16, 0.8, 1, 1.2); part(g, new THREE.CapsuleGeometry(0.055, 0.16, 4, 10), belly, sx * 0.16, 0.05, -0.02, 1, 1, 1, Math.PI / 2); part(g, new THREE.CapsuleGeometry(0.04, 0.12, 4, 8), fur, sx * 0.09, 0.12, 0.2); }
  part(g, new THREE.SphereGeometry(0.17, 18, 14), belly, 0, 0.27, 0.13, 1, 1.1, 0.7);              // chest
  part(g, new THREE.SphereGeometry(0.22, 24, 18), fur, 0, 0.6, 0.2, 1.05, 0.95, 1);                // head
  for (const sx of [-1, 1]) { part(g, new THREE.SphereGeometry(0.08, 12, 10), belly, sx * 0.07, 0.53, 0.36); part(g, new THREE.CapsuleGeometry(0.06, 0.34, 4, 12), fur, sx * 0.09, 0.98, 0.14, 1, 1, 0.55, -0.12, 0, -sx * 0.12); part(g, new THREE.CapsuleGeometry(0.032, 0.26, 4, 8), pink, sx * 0.09, 0.98, 0.17, 1, 1, 0.4, -0.12, 0, -sx * 0.12); }
  part(g, new THREE.SphereGeometry(0.035, 10, 8), pink, 0, 0.58, 0.42);                             // nose
  eyes(g, 0.65, 0.36, 0.09, 0.045);
  const wh = new THREE.MeshBasicMaterial({ color: 0x6a5a50 });
  for (const sx of [-1, 1]) for (const k of [-1, 1]) part(g, new THREE.CylinderGeometry(0.004, 0.004, 0.18, 3), wh, sx * 0.13, 0.55 + k * 0.015, 0.4, 1, 1, 1, 0, 0, Math.PI / 2 + sx * k * 0.15);
  part(g, new THREE.SphereGeometry(0.1, 14, 10), belly, 0, 0.36, -0.38);                            // tail
  part(g, new THREE.SphereGeometry(0.02, 6, 5), dark, 0, 0.5, 0.41);
  g.scale.setScalar(1.3); return g;
}
export function hen(featherHex) {
  const g = new THREE.Group(), body = SM(featherHex, 0.9), red = SM(0xd8322a, 0.6), beak = SM(0xf0a830, 0.5), leg = SM(0xe8a030, 0.6);
  part(g, new THREE.SphereGeometry(0.28, 24, 18), body, 0, 0.42, 0, 0.9, 0.85, 1.15);
  part(g, new THREE.SphereGeometry(0.16, 20, 14), body, 0, 0.72, 0.2);
  for (let k = 0; k < 3; k++) part(g, new THREE.SphereGeometry(0.05, 10, 8), red, 0, 0.88 + (k === 1 ? 0.03 : 0), 0.14 + k * 0.06);    // comb
  part(g, new THREE.ConeGeometry(0.045, 0.12, 10), beak, 0, 0.7, 0.38, 1, 1, 1, Math.PI / 2);
  part(g, new THREE.SphereGeometry(0.035, 10, 8), red, 0, 0.62, 0.33, 0.8, 1.4, 0.8);              // wattle
  for (const sx of [-1, 1]) { part(g, new THREE.SphereGeometry(0.17, 16, 12), body, sx * 0.22, 0.45, -0.02, 0.35, 0.7, 1.1, 0, 0, sx * 0.2); part(g, new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), leg, sx * 0.08, 0.12, 0.02); part(g, new THREE.BoxGeometry(0.1, 0.02, 0.12), leg, sx * 0.08, 0.02, 0.05); }
  for (let k = 0; k < 3; k++) part(g, new THREE.SphereGeometry(0.1, 12, 10), body, (k - 1) * 0.07, 0.62, -0.32, 0.5, 1.2, 0.6, 0.5);    // tail feathers
  eyes(g, 0.76, 0.32, 0.075, 0.03);
  g.scale.setScalar(1.15); return g;
}
export function corgi() {
  const g = new THREE.Group(), fur = SM(0xe39a46, 0.95), cream = SM(0xfff4e2, 0.95), nose = SM(0x1e1410, 0.4), tongue = SM(0xff7f8f, 0.6);
  part(g, new THREE.CapsuleGeometry(0.24, 0.5, 6, 18), fur, 0, 0.4, 0, 1, 1, 1, Math.PI / 2);           // long body
  part(g, new THREE.SphereGeometry(0.22, 20, 14), cream, 0, 0.34, 0.24, 0.9, 0.8, 0.9);
  part(g, new THREE.SphereGeometry(0.24, 24, 18), fur, 0, 0.66, 0.45);                                  // head
  part(g, new THREE.SphereGeometry(0.15, 20, 14), cream, 0, 0.58, 0.62, 1, 0.75, 1.1);                   // muzzle
  part(g, new THREE.SphereGeometry(0.11, 18, 12), cream, 0, 0.74, 0.58, 0.6, 0.9, 0.6);                  // white blaze
  part(g, new THREE.SphereGeometry(0.045, 12, 10), nose, 0, 0.62, 0.78);
  part(g, new THREE.SphereGeometry(0.05, 12, 8), tongue, 0, 0.51, 0.72, 0.8, 0.5, 1);
  for (const sx of [-1, 1]) {
    part(g, new THREE.ConeGeometry(0.11, 0.26, 12), fur, sx * 0.15, 0.94, 0.42, 1, 1, 0.5, 0, 0, -sx * 0.2); part(g, new THREE.ConeGeometry(0.06, 0.16, 10), SM(0xffc0a8), sx * 0.15, 0.92, 0.45, 1, 1, 0.3, 0, 0, -sx * 0.2);
    for (const z of [0.3, -0.3]) part(g, new THREE.CapsuleGeometry(0.065, 0.1, 4, 10), cream, sx * 0.14, 0.13, z);
  }
  eyes(g, 0.72, 0.62, 0.1, 0.04);
  part(g, new THREE.TorusGeometry(0.19, 0.04, 8, 20), SM(0x2f6fd0, 0.5), 0, 0.52, 0.36, 1, 1, 1, 1.2);   // collar
  part(g, new THREE.CylinderGeometry(0.04, 0.04, 0.015, 12), SM(0xffd23c, 0.3), 0, 0.42, 0.52, 1, 1, 1, Math.PI / 2);
  g.scale.setScalar(1.25); return g;
}

/** Friendly creatures: bouncing slimes and hopping bunnies (decoration only, no collision). */
export function creatures(models = {}) {
  const g = new THREE.Group(), list = [];
  const spots = scatterGround(11, (x, z) => L.walkable(x, z, 1.5) && L.pathDistance(x, z) > 2.5 && L.pathDistance(x, z) < 14 && Math.hypot(x, z) < L.PLAY_RADIUS - 6);
  const eye = new THREE.MeshBasicMaterial({ color: 0x24140c }), white = new THREE.MeshBasicMaterial({ color: 0xffffff }), blush = new THREE.MeshBasicMaterial({ color: 0xff9fb0 });
  const face = (o, y, z, w) => { for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eye); e.position.set(sx * w, y, z); o.add(e); const h = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), white); h.position.set(sx * w + 0.02, y + 0.03, z + 0.05); o.add(h); const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), blush); b.scale.set(1.3, 0.6, 0.4); b.position.set(sx * (w + 0.12), y - 0.08, z - 0.01); o.add(b); } };
  spots.forEach((sp, i) => {
    const slime = false, kind = i % 3;                  // rabbits and hens (the toy slimes were dropped 18/11)
    const glb = kind === 1 ? models.chicken : models.rabbit;      // models made in Blender (assets/models/animal_*.glb) when they loaded
    let o;
    if (glb) { o = new THREE.Group(); const m = glb.clone(true); m.scale.setScalar((kind === 1 ? 1.35 : 1.05) * (0.92 + (i % 3) * 0.06)); m.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); o.add(m); }
    else { o = kind === 1 ? hen([0xfaf6ee, 0xd8a060, 0x8a5a3a][i % 3]) : rabbit([0xd9b48a, 0xfaf6ee, 0x9a8a80][i % 3]); compact(o); }
    o.userData.hen = kind === 1;
    g.add(o); list.push({ o, slime, x: sp.x, z: sp.z, r: 0.8 + (i % 3) * 0.5, ph: i * 1.7, sp: (slime ? 0.25 : 0.3) * (i % 2 ? 1 : -1) });
  });
  if (L.NAME === 'village') {      // a corgi trotting round the square and an owl on the market sign
    const cream = new THREE.MeshStandardMaterial({ color: 0xfff4e2, roughness: 0.95 }), eye = new THREE.MeshBasicMaterial({ color: 0x24140c });
    let dog, tailD = null, mixer = null;
    if (models.dog) {      // Shiba from Blender with its own walk clip
      dog = new THREE.Group(); const m = models.dog.scene; m.scale.setScalar(0.85); m.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.frustumCulled = false; } }); dog.add(m);
      const clip = models.dog.animations.find((a) => a.name === 'Walk') || models.dog.animations[0];
      if (clip) { mixer = new THREE.AnimationMixer(m); mixer.clipAction(clip).play(); }
    } else { dog = corgi(); tailD = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), cream); tailD.position.set(0, 0.52, -0.5); tailD.userData.live = true; dog.add(tailD); compact(dog); }
    g.add(dog); list.push({ o: dog, dog: true, tail: tailD, mixer, x: 6, z: 12, r: 2.3, ph: 1, sp: 0.5 });      // open grass east of the path: no fence to run through
    const owl = new THREE.Group(), brown = new THREE.MeshStandardMaterial({ color: 0x9a6a3c, roughness: 0.95 });
    const O = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); owl.add(o); return o; };
    O(new THREE.SphereGeometry(0.2, 12, 10), brown, 0, 0.2, 0, 1, 1.15, 0.9); O(new THREE.SphereGeometry(0.15, 10, 8), cream, 0, 0.16, 0.08, 0.9, 1, 0.7);
    for (const sx of [-1, 1]) { O(new THREE.SphereGeometry(0.075, 10, 8), cream, sx * 0.075, 0.3, 0.14); O(new THREE.SphereGeometry(0.04, 8, 6), eye, sx * 0.075, 0.3, 0.2); O(new THREE.ConeGeometry(0.045, 0.1, 5), brown, sx * 0.11, 0.44, 0.02); O(new THREE.SphereGeometry(0.1, 8, 6), brown, sx * 0.19, 0.2, 0, 0.4, 1, 0.8); }
    O(new THREE.ConeGeometry(0.03, 0.06, 5), new THREE.MeshStandardMaterial({ color: 0xf0a030 }), 0, 0.25, 0.2).rotation.x = Math.PI / 2;
    compact(owl); owl.position.set(2.9, L.groundHeight(2.9, 14.5) + 2.32, 14.5); g.add(owl); list.push({ o: owl, owl: true });
  }
  g.userData.update = (t) => {
    for (const c of list) {
      if (c.owl) { c.o.rotation.y = Math.sin(t * 0.5) * 1.1; c.o.scale.y = 1 + Math.sin(t * 2) * 0.03; continue; }
      if (c.dog) { const a = c.ph + t * c.sp, x = c.x + Math.cos(a) * c.r, z = c.z + Math.sin(a) * c.r; c.o.position.set(x, L.groundHeight(x, z) + (c.mixer ? 0 : Math.abs(Math.sin(t * 9)) * 0.06), z); c.o.rotation.y = -a; if (c.tail) c.tail.position.x = Math.sin(t * 14) * 0.06; if (c.mixer) { c.mixer.update(Math.max(0, Math.min(0.1, t - (c.lastT ?? t)))); c.lastT = t; } continue; }
      const a = c.ph + t * c.sp, x = c.x + Math.cos(a) * c.r, z = c.z + Math.sin(a) * c.r, hop = Math.abs(Math.sin(t * 7 + c.ph));
      if (!L.walkable(x, z, 0.4)) continue;
      c.o.position.set(x, L.groundHeight(x, z) + hop * 0.015, z); c.o.rotation.y = -a + (c.sp > 0 ? 0 : Math.PI);      // a walk, not a hop (18/11)
      c.o.rotation.z = Math.sin(t * 7 + c.ph) * 0.05;      // a little waddle
      if (c.slime) c.o.scale.set(1 + (1 - hop) * 0.18, 0.82 + hop * 0.3, 1 + (1 - hop) * 0.18);
    }
  };
  g.userData.update(0);
  return g;
}

export function signs(add, list) {
  for (const [x, z, text] of list) {
    const y = L.groundHeight(x, z), post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.3, 7), new THREE.MeshStandardMaterial({ color: 0x8a5a30 })); post.position.set(x, y + 1.1, z); post.castShadow = true; add(post);
    const s = label(text, { size: 26, scale: 0.75 }); s.position.set(x, y + 2.7, z); add(s);
  }
}
