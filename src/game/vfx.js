// (27/11, turn 72) The building blocks of the redrawn spell effects ("the skill effects are ugly and weak").
// The old effects were flat coloured rings, plain spheres and round dots. These are the usual tools of stylised game
// effects instead, all made here in code (no picture files):
//   - noise textures that scroll through every shape, so fire licks, wind streams and frost creeps;
//   - "erosion": a shape does not just fade, it is eaten away from its thin parts first (uErode), like a flame dying;
//   - three-tone colour ramps (deep -> mid -> white-hot core) instead of one flat colour;
//   - bands with their own UVs (crescents, rings, walls, ribbons behind a missile), orbs with a bright rim, ground decals
//     drawn per element (a magic circle with the element's sign, cracks, a scorch), crystals, and bolts that re-jag.
// game/spells.js puts them together; game/fx.js still does the small particles.
import * as THREE from 'three';

// ---------------------------------------------------------------- textures (made once)
const cache = {};
const canvasTex = (cv, repeat = true) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
/** Tileable cloudy noise (four octaves of value noise that wrap), white on black. */
export function noiseTex() {
  if (cache.noise) return cache.noise;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), img = c.createImageData(S, S);
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const layers = [8, 16, 32, 64].map((n) => ({ n, v: Float32Array.from({ length: n * n }, rand) }));
  const at = (l, x, y) => { const n = l.n, fx = x * n, fy = y * n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const g = (i, j) => l.v[((j % n + n) % n) * n + ((i % n + n) % n)]; return (g(x0, y0) * (1 - sx) + g(x0 + 1, y0) * sx) * (1 - sy) + (g(x0, y0 + 1) * (1 - sx) + g(x0 + 1, y0 + 1) * sx) * sy; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let v = 0, a = 0.5; for (const l of layers) { v += at(l, x / S, y / S) * a; a *= 0.5; } const k = Math.max(0, Math.min(255, Math.round((v / 0.9375) * 255))), i = (y * S + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = k; img.data[i + 3] = 255; }
  c.putImageData(img, 0, 0); return (cache.noise = canvasTex(cv));
}
const SIGN = {
  fire(c) { c.beginPath(); c.moveTo(0, -62); c.bezierCurveTo(46, -18, 52, 26, 0, 62); c.bezierCurveTo(-52, 26, -30, -8, -12, -22); c.bezierCurveTo(-8, -2, 6, -8, 0, -62); c.stroke(); c.beginPath(); c.moveTo(0, 44); c.bezierCurveTo(20, 28, 14, 8, 2, -6); c.bezierCurveTo(-14, 10, -18, 30, 0, 44); c.stroke(); },
  ice(c) { for (let k = 0; k < 6; k++) { c.save(); c.rotate(k * Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -66); c.moveTo(0, -34); c.lineTo(-16, -50); c.moveTo(0, -34); c.lineTo(16, -50); c.moveTo(0, -54); c.lineTo(-9, -64); c.moveTo(0, -54); c.lineTo(9, -64); c.stroke(); c.restore(); } },
  wind(c) { for (let k = 0; k < 3; k++) { c.save(); c.rotate(k * Math.PI * 2 / 3); c.beginPath(); for (let a = 0; a <= 4.4; a += 0.1) { const r = 6 + a * 13, x = Math.cos(a) * r, y = Math.sin(a) * r; if (a === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); c.restore(); } },
  thunder(c) { c.beginPath(); c.moveTo(14, -66); c.lineTo(-22, -4); c.lineTo(2, -4); c.lineTo(-14, 66); c.lineTo(26, -14); c.lineTo(2, -14); c.closePath(); c.stroke(); },
};
/** The magic circle of an element: rings, ticks, a star and the element's sign; white lines with a soft glow. */
export function circleTex(el) {
  const key = 'circle_' + el; if (cache[key]) return cache[key];
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'); c.translate(S / 2, S / 2);
  c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = '#fff'; c.shadowBlur = 14;
  const ring = (r, w) => { c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); };
  ring(244, 5); ring(226, 2); ring(168, 3); ring(96, 2);
  for (let k = 0; k < 48; k++) { const a = k * Math.PI / 24, r0 = k % 4 ? 230 : 226, r1 = k % 4 ? 240 : 244; c.lineWidth = k % 4 ? 2 : 4; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
  const pts = el === 'ice' ? 6 : el === 'wind' ? 3 : el === 'thunder' ? 4 : 5, step = el === 'fire' ? 2 : 1;
  c.lineWidth = 3; for (let rep = 0; rep < (el === 'wind' || el === 'thunder' ? 2 : 1); rep++) { c.beginPath(); for (let k = 0; k <= pts; k++) { const a = -Math.PI / 2 + rep * Math.PI / pts + k * step * 2 * Math.PI / pts; if (k === 0) c.moveTo(Math.cos(a) * 168, Math.sin(a) * 168); else c.lineTo(Math.cos(a) * 168, Math.sin(a) * 168); } c.stroke(); }
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + 0.26; c.save(); c.translate(Math.cos(a) * 197, Math.sin(a) * 197); c.rotate(a + Math.PI / 2); c.lineWidth = 2.5; c.beginPath(); if (k % 3 === 0) c.arc(0, 0, 9, 0, 7); else if (k % 3 === 1) { c.moveTo(-8, 8); c.lineTo(0, -9); c.lineTo(8, 8); c.closePath(); } else { c.moveTo(-8, -8); c.lineTo(8, 8); c.moveTo(8, -8); c.lineTo(-8, 8); } c.stroke(); c.restore(); }
  c.lineWidth = 5; c.shadowBlur = 20; SIGN[el](c);
  return (cache[key] = canvasTex(cv, false));
}
/** Cracks running out from the middle (the ground under a heavy hit). */
export function crackTex() {
  if (cache.crack) return cache.crack;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'); c.translate(S / 2, S / 2); c.strokeStyle = '#fff'; c.lineCap = 'round';
  let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const branch = (x, y, a, len, w) => { if (len < 8 || w < 0.6) return; const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke(); branch(nx, ny, a + (rand() - 0.5) * 0.9, len * 0.78, w * 0.8); if (rand() < 0.45) branch(nx, ny, a + (rand() < 0.5 ? 1 : -1) * (0.5 + rand() * 0.5), len * 0.6, w * 0.6); };
  for (let k = 0; k < 9; k++) branch(0, 0, k * 0.7 + rand() * 0.4, 26 + rand() * 12, 4.5);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 44); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 44, 0, 7); c.fill();
  return (cache.crack = canvasTex(cv, false));
}

// ---------------------------------------------------------------- materials
const COMMON = `uniform sampler2D uNoise; uniform float uTime, uErode, uSoft, uAlpha, uSeed, uBoost, uHeat; uniform vec3 uCore, uMid, uDeep; uniform vec2 uTile, uScroll;
float noise2(vec2 uv) { float a = texture2D(uNoise, uv * uTile + uScroll * uTime + uSeed).r; float b = texture2D(uNoise, uv * uTile * 2.13 - uScroll * uTime * 0.6 + uSeed * 3.7 + 0.31).r; return a * 0.62 + b * 0.38; }
vec3 ramp(float h) { vec3 c = mix(uDeep, uMid, smoothstep(0.0, 0.5, h)); return mix(c, uCore, smoothstep(0.5, 0.95, h)); }
float eaten(float body) { return smoothstep(uErode, uErode + uSoft, body); }`;
const uni = (C, o = {}) => ({ uNoise: { value: noiseTex() }, uTime: { value: 0 }, uErode: { value: o.erode ?? 0 }, uSoft: { value: o.soft ?? 0.12 }, uAlpha: { value: o.alpha ?? 1 }, uSeed: { value: Math.random() * 10 }, uBoost: { value: o.boost ?? (o.add ? 1.25 : 1.0) }, uHeat: { value: o.heat ?? 1.0 },
  uCore: { value: new THREE.Color(C.core) }, uMid: { value: new THREE.Color(C.mid) }, uDeep: { value: new THREE.Color(C.deep) }, uTile: { value: new THREE.Vector2(...(o.tile || [2, 1])) }, uScroll: { value: new THREE.Vector2(...(o.scroll || [1, 0])) } });
const base = (o) => ({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending });      // bodies keep their colour on bright grass (normal blending); only edges, cores and light itself are added (add: true)
const VS_UV = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
/** A band (crescent, ring, wall, ribbon): u runs along it, v across. Bright towards uEdge (0..1 across), thin at both ends,
 *  torn by scrolling noise, eaten away as uErode goes from 0 to 1. o: tile, scroll, soft, edge, sharp, add, taper, alpha, boost,
 *  heat (below 1: more of the deep and mid colour, less white). */
export function bandMat(C, o = {}) {
  const u = uni(C, o); u.uEdge = { value: o.edge ?? 0.5 }; u.uSharp = { value: o.sharp ?? 1.6 }; u.uTaper = { value: new THREE.Vector2(...(o.taper || [0.12, 0.3])) };
  return new THREE.ShaderMaterial({ ...base(o), uniforms: u, vertexShader: VS_UV, fragmentShader: `${COMMON} uniform float uEdge, uSharp; uniform vec2 uTaper; varying vec2 vUv;
    void main() { float across = 1.0 - abs(vUv.y - uEdge) / max(uEdge, 1.0 - uEdge); across = pow(clamp(across, 0.0, 1.0), uSharp);
      float along = uTaper.x + uTaper.y > 0.0 ? smoothstep(0.0, max(uTaper.x, 0.0001), vUv.x) * (1.0 - smoothstep(1.0 - max(uTaper.y, 0.0001), 1.0, vUv.x)) : 1.0; float n = noise2(vUv);
      float body = across * along * (0.45 + 1.1 * n); float a = eaten(body) * uAlpha; if (a < 0.004) discard;
      gl_FragColor = vec4(ramp(body * 1.15 * uHeat) * uBoost, a); }` });
}
/** An orb (a ball of fire, an explosion, a dome of frost): a bright rim, noise crawling over it, and it bulges with the noise.
 *  o: tile, scroll, soft, rim (power), bulge, add, fill (how solid the middle is). */
export function orbMat(C, o = {}) {
  const u = uni(C, { tile: [3, 2], scroll: [0.3, 0.9], ...o }); u.uRim = { value: o.rim ?? 2 }; u.uBulge = { value: o.bulge ?? 0 }; u.uFill = { value: o.fill ?? 0.5 };
  return new THREE.ShaderMaterial({ ...base(o), side: o.side ?? THREE.FrontSide, uniforms: u,
    vertexShader: `uniform sampler2D uNoise; uniform float uTime, uBulge, uSeed; uniform vec2 uTile, uScroll; varying vec2 vUv; varying vec3 vN, vV;
      void main() { vUv = uv; float n = texture2D(uNoise, uv * uTile + uScroll * uTime + uSeed).r; vec3 p = position + normal * (n - 0.45) * uBulge; vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `${COMMON} uniform float uRim, uFill; varying vec2 vUv; varying vec3 vN, vV;
      void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uRim); float n = noise2(vUv); float body = (uFill + (1.0 - uFill) * f) * (0.5 + n);
        float a = eaten(body) * uAlpha; if (a < 0.004) discard; gl_FragColor = vec4(ramp((body * (0.6 + 0.7 * n) + f * 0.25) * uHeat) * uBoost, a); }` });
}
/** A flat mark on the ground. kind 'ring': a wave ring of radius uRadius (0..1 of the quad) with a torn edge; 'map': a
 *  texture (magic circle, cracks) tinted by the ramp and eaten by noise; 'disc': a filled noisy disc (frost, scorch, swirl). */
export function groundMat(C, o = {}) {
  const u = uni(C, { tile: [3, 3], scroll: [0, 0], ...o }); u.uMap = { value: o.map || null }; u.uRadius = { value: o.radius ?? 0.8 }; u.uWidth = { value: o.width ?? 0.16 }; u.uSpin = { value: o.spin ?? 0 }; u.uReveal = { value: o.reveal ?? 1 };
  const kind = o.kind || 'ring';
  return new THREE.ShaderMaterial({ ...base(o), uniforms: u, vertexShader: VS_UV, fragmentShader: `${COMMON} uniform sampler2D uMap; uniform float uRadius, uWidth, uSpin, uReveal; varying vec2 vUv;
    void main() { vec2 p = vUv * 2.0 - 1.0; float r = length(p), ang = atan(p.y, p.x); vec2 pol = vec2(ang / 6.2832 + 0.5 + uSpin * uTime, r);
      float n = noise2(${kind === 'map' ? 'vUv' : 'pol * vec2(4.0, 1.0)'}); float body, heat, shape = 1.0;
      ${kind === 'ring' ? 'float d = abs(r - uRadius) / uWidth; body = clamp(1.0 - d, 0.0, 1.0) * (0.5 + n); body *= smoothstep(1.0, 0.92, r); heat = body * 1.2;'
      : kind === 'map' ? 'float c = cos(uSpin * uTime), s = sin(uSpin * uTime); vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y) * 0.5 + 0.5; float m = texture2D(uMap, q).a * step(r, 1.0); float wipe = step(fract(ang / 6.2832 + 0.75), uReveal); shape = m * wipe; body = 0.3 + 0.9 * n; heat = m * (0.55 + 0.6 * n);'
      : 'body = smoothstep(uRadius, uRadius * 0.25, r) * (0.35 + 1.0 * n); heat = body;'}
      float a = eaten(body) * shape * uAlpha; if (a < 0.004) discard; gl_FragColor = vec4(ramp(heat * uHeat) * uBoost, a); }` });      // a drawn mark keeps the softness of its lines (shape): the noise only eats it away
}
/** Ice: flat facets, a cold rim and a bright glint; lit by itself so it reads the same in every land. */
export function crystalMat(C, o = {}) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: true, toneMapped: false, uniforms: { uCore: { value: new THREE.Color(C.core) }, uMid: { value: new THREE.Color(C.mid) }, uDeep: { value: new THREE.Color(C.deep) }, uAlpha: { value: o.alpha ?? 0.95 } },
    vertexShader: 'varying vec3 vP; varying vec3 vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 uCore, uMid, uDeep; uniform float uAlpha; varying vec3 vP; varying vec3 vV;
      void main() { vec3 n = normalize(cross(dFdx(vP), dFdy(vP))); float f = pow(1.0 - abs(dot(n, vV)), 2.2); float up = n.y * 0.5 + 0.5; float glint = pow(max(0.0, dot(n, normalize(vec3(0.4, 0.8, 0.5)))), 12.0);
        vec3 c = mix(uDeep, uMid, up); c = mix(c, uCore, f * 0.8 + glint); gl_FragColor = vec4(c * 1.15, uAlpha * (0.72 + 0.28 * f)); }` });
}

// ---------------------------------------------------------------- shapes
/** A flat arc band in the XZ plane: inner radius r0, outer r1, from angle a0 over `sweep` radians. u runs along the arc, v from the inside out. */
export function arcGeo(r0, r1, a0, sweep, seg = 48, lift = 0) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg, a = a0 + sweep * t, c = Math.cos(a), s = Math.sin(a), y = Math.sin(t * Math.PI) * lift; pos.push(c * r0, y, s * r0, c * r1, y, s * r1); uv.push(t, 0, t, 1); if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
/** An upright wall round a circle (a cone when r1 differs from r0): u runs round, v goes up. */
export function wallGeo(r0, r1, h, seg = 40, turns = 1) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg, a = t * Math.PI * 2; pos.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * r1, h, Math.sin(a) * r1); uv.push(t * turns, 0, t * turns, 1); if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
/** A ground quad lying flat (for groundMat). */
export const groundGeo = (r) => { const g = new THREE.PlaneGeometry(r * 2, r * 2); g.rotateX(-Math.PI / 2); return g; };
/** A crystal: a six-sided prism with a point (and a short point below), standing on its base. */
export function crystalGeo(r = 0.2, h = 1) {
  const g = new THREE.CylinderGeometry(r * 0.55, r, h * 0.62, 6, 1), tip = new THREE.ConeGeometry(r * 0.55, h * 0.38, 6); g.translate(0, h * 0.31, 0); tip.translate(0, h * 0.81, 0);
  const pos = [...g.toNonIndexed().attributes.position.array, ...tip.toNonIndexed().attributes.position.array], out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.dispose(); tip.dispose(); return out;
}
/** A ribbon that follows a moving point (the tail of a missile): feed it the head's position every frame. u = 0 at the head. */
export class Ribbon {
  constructor(mat, width = 0.5, n = 22, upright = false) {
    this.n = n; this.w = width; this.upright = upright; this.pts = []; const g = new THREE.BufferGeometry(), uv = [], idx = [];
    for (let i = 0; i < n; i++) { uv.push(i / (n - 1), 0, i / (n - 1), 1); if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false;
  }
  push(p, camera) {
    this.pts.unshift(p.clone()); if (this.pts.length > this.n) this.pts.length = this.n;
    const a = this.mesh.geometry.attributes.position.array, P = this.pts, side = new THREE.Vector3(), dir = new THREE.Vector3(), view = new THREE.Vector3();
    for (let i = 0; i < this.n; i++) {
      const c = P[Math.min(i, P.length - 1)], prev = P[Math.max(0, Math.min(i, P.length - 1) - 1)], next = P[Math.min(P.length - 1, i + 1)]; dir.subVectors(prev, next); if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
      if (this.upright) side.set(0, 1, 0); else { view.subVectors(camera ? camera.position : new THREE.Vector3(0, 10, 0), c); side.crossVectors(dir, view).normalize(); }
      const w = this.w * 0.5; a[i * 6] = c.x + side.x * w; a[i * 6 + 1] = c.y + side.y * w; a[i * 6 + 2] = c.z + side.z * w; a[i * 6 + 3] = c.x - side.x * w; a[i * 6 + 4] = c.y - side.y * w; a[i * 6 + 5] = c.z - side.z * w;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
}
/** The points of a jagged bolt from A to B: `rough` metres of sideways jitter, more in the middle. */
export function jagPoints(A, B, rough = 0.5, rnd = Math.random) {
  const n = Math.max(7, Math.round(A.distanceTo(B) * 1.8)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, p = A.clone().lerp(B, t), k = Math.sin(t * Math.PI) * rough; if (i && i < n) p.add(new THREE.Vector3((rnd() - 0.5) * 2 * k, (rnd() - 0.5) * 2 * k, (rnd() - 0.5) * 2 * k)); pts.push(p); }
  return pts;
}
/** A camera-facing strip through points (a bolt of lightning): bright in the middle, soft at the sides. */
export function stripGeo(pts, width, camera) {
  const pos = [], uv = [], idx = [], side = new THREE.Vector3(), dir = new THREE.Vector3(), view = new THREE.Vector3(), n = pts.length;
  for (let i = 0; i < n; i++) { const c = pts[i]; dir.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]); view.subVectors(camera ? camera.position : new THREE.Vector3(0, 10, 0), c); side.crossVectors(dir, view).normalize(); const w = width * 0.5 * (0.55 + 0.45 * Math.sin(i / (n - 1) * Math.PI));
    pos.push(c.x + side.x * w, c.y + side.y * w, c.z + side.z * w, c.x - side.x * w, c.y - side.y * w, c.z - side.z * w); uv.push(i / (n - 1), 0, i / (n - 1), 1); if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
/** Easing used everywhere: fast out, a little past the end and back (things pop instead of sliding). */
export const easeOut = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
export const overshoot = (k) => { k = Math.min(1, Math.max(0, k)); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
