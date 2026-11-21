// Particles for the spells (21/11: "the most important: better pictures and effects for the magic skills").
// Two batched point clouds (one draw call each): `glow` adds light (embers, sparks, cores), `soft` is normal blending
// (smoke, frost mist, shards, leaves) so the colours stay strong on bright grass. One small texture atlas, drawn here:
// 0 soft glow, 1 four-point spark, 2 puffy flame/smoke, 3 ice shard, 4 leaf, 5 ring, 6 streak, 7 rune circle.
// Each particle: position, velocity, gravity, drag, life, size from → to, colour from → to, alpha curve, spin.
import * as THREE from 'three';

const CELLS = 4, CAP = 1400;
let ATLAS = null;
function atlas() {
  if (ATLAS) return ATLAS;
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S * CELLS; const c = cv.getContext('2d');
  const cell = (i, draw) => { c.save(); c.translate((i % CELLS) * S, Math.floor(i / CELLS) * S); draw(c, S); c.restore(); };
  const radial = (g, stops) => { for (const [k, col] of stops) g.addColorStop(k, col); return g; };
  cell(0, (c, s) => { c.fillStyle = radial(c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2), [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.75)'], [0.6, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, s, s); });
  cell(1, (c, s) => { c.fillStyle = radial(c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 3), [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, s, s);
    c.fillStyle = '#fff'; for (const [w, h] of [[3, 60], [60, 3]]) { c.beginPath(); c.ellipse(s / 2, s / 2, w, h, 0, 0, 7); c.fill(); } for (const [w, h] of [[2, 30], [30, 2]]) { c.beginPath(); c.ellipse(s / 2, s / 2, w, h, Math.PI / 4, 0, 7); c.fill(); } });
  cell(2, (c, s) => { for (let k = 0; k < 9; k++) { const a = k * 0.7, r = k ? 20 : 0, x = s / 2 + Math.cos(a) * r, y = s / 2 + Math.sin(a) * r, rr = k ? 26 : 40; c.fillStyle = radial(c.createRadialGradient(x, y, 0, x, y, rr), [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, s, s); } });
  cell(3, (c, s) => { const g = c.createLinearGradient(0, 0, s, s); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(220,245,255,0.9)'); g.addColorStop(1, 'rgba(160,220,255,0.75)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(s / 2, 6); c.lineTo(s * 0.68, s / 2); c.lineTo(s / 2, s - 6); c.lineTo(s * 0.32, s / 2); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(s / 2, 10); c.lineTo(s / 2, s - 10); c.stroke(); });
  cell(4, (c, s) => { c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.moveTo(s * 0.5, 8); c.quadraticCurveTo(s * 0.92, s * 0.45, s * 0.5, s - 8); c.quadraticCurveTo(s * 0.08, s * 0.45, s * 0.5, 8); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(s / 2, 14); c.lineTo(s / 2, s - 14); c.stroke(); });
  cell(5, (c, s) => { c.fillStyle = radial(c.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2), [[0, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,255,255,1)'], [0.75, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, s, s); });
  cell(6, (c, s) => { const g = c.createLinearGradient(0, s / 2, s, s / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(s / 2, s / 2, s / 2 - 2, 7, 0, 0, 7); c.fill(); });
  cell(7, (c, s) => { c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 4; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 6, 0, 7); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 18, 0, 7); c.stroke();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(s / 2 + Math.cos(a) * (s / 2 - 18), s / 2 + Math.sin(a) * (s / 2 - 18)); c.lineTo(s / 2 + Math.cos(a + 2.1) * (s / 2 - 18), s / 2 + Math.sin(a + 2.1) * (s / 2 - 18)); c.stroke(); }
    c.font = '700 13px serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; const R = 'ᚠᚢᚦᚨᚱᚲᚷᚹ'; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.4; c.fillText(R[k], s / 2 + Math.cos(a) * (s / 2 - 12), s / 2 + Math.sin(a) * (s / 2 - 12)); } });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (ATLAS = { tex: t, canvas: cv });
}
/** A texture of one atlas cell, for meshes (ground rings, rune circles, slash crescents). */
const cellTex = {};
export function cellTexture(i) {
  if (cellTex[i]) return cellTex[i];
  const a = atlas().canvas, S = a.width / CELLS, cv = document.createElement('canvas'); cv.width = cv.height = S; cv.getContext('2d').drawImage(a, (i % CELLS) * S, Math.floor(i / CELLS) * S, S, S, 0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (cellTex[i] = t);
}

const VS = `attribute vec3 aColor; attribute float aAlpha; attribute float aSize; attribute float aRot; attribute float aCell;
varying vec3 vC; varying float vA; varying float vR; varying float vCell; uniform float uScale;
void main() { vC = aColor; vA = aAlpha; vR = aRot; vCell = aCell; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }
`;
const FS = `uniform sampler2D uTex; varying vec3 vC; varying float vA; varying float vR; varying float vCell;
void main() { vec2 c = gl_PointCoord - 0.5; float s = sin(vR), k = cos(vR); c = vec2(k * c.x - s * c.y, s * c.x + k * c.y) * 1.414 + 0.5;
  if (c.x < 0.0 || c.y < 0.0 || c.x > 1.0 || c.y > 1.0) discard;
  vec2 uv = (vec2(c.x, 1.0 - c.y) + vec2(mod(vCell, ${CELLS}.0), ${CELLS - 1}.0 - floor(vCell / ${CELLS}.0))) / ${CELLS}.0;
  vec4 t = texture2D(uTex, uv); float a = t.a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC * t.rgb, a); }
`;
class Cloud {
  constructor(scene, additive) {
    this.n = 0; this.p = [];
    const g = new THREE.BufferGeometry(), f = (k) => new THREE.BufferAttribute(new Float32Array(CAP * k), k).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', f(3)); g.setAttribute('aColor', f(3)); g.setAttribute('aAlpha', f(1)); g.setAttribute('aSize', f(1)); g.setAttribute('aRot', f(1)); g.setAttribute('aCell', f(1));
    g.setDrawRange(0, 0); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { uTex: { value: atlas().tex }, uScale: { value: 600 } }, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = additive ? 11 : 10; scene.add(this.pts); this.g = g;
  }
  add(o) { if (this.p.length >= CAP) this.p.shift(); this.p.push(o); }
  update(dt) {
    const P = this.p, g = this.g, pos = g.attributes.position.array, col = g.attributes.aColor.array, al = g.attributes.aAlpha.array, sz = g.attributes.aSize.array, rot = g.attributes.aRot.array, cl = g.attributes.aCell.array;
    let w = 0;
    for (let i = 0; i < P.length; i++) {
      const q = P[i]; q.t += dt; if (q.t >= q.life) continue;
      const k = q.t / q.life, dr = Math.max(0, 1 - q.drag * dt);
      q.vx *= dr; q.vy = q.vy * dr - q.grav * dt; q.vz *= dr; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.r += q.spin * dt;
      if (q.orbit) { const a = q.orbit.a + q.orbit.w * q.t, rr = q.orbit.r + q.orbit.grow * q.t; q.x = q.orbit.x + Math.cos(a) * rr; q.z = q.orbit.z + Math.sin(a) * rr; }
      P[w++] = q; const j = w - 1;
      pos[j * 3] = q.x; pos[j * 3 + 1] = q.y; pos[j * 3 + 2] = q.z;
      col[j * 3] = q.c0[0] + (q.c1[0] - q.c0[0]) * k; col[j * 3 + 1] = q.c0[1] + (q.c1[1] - q.c0[1]) * k; col[j * 3 + 2] = q.c0[2] + (q.c1[2] - q.c0[2]) * k;
      al[j] = q.a * (k < q.fadeIn ? k / q.fadeIn : 1 - Math.pow((k - q.fadeIn) / (1 - q.fadeIn), 1.6)); sz[j] = q.s0 + (q.s1 - q.s0) * k; rot[j] = q.r; cl[j] = q.cell;
    }
    P.length = w; this.n = w; g.setDrawRange(0, w);
    for (const n of ['position', 'aColor', 'aAlpha', 'aSize', 'aRot', 'aCell']) g.attributes[n].needsUpdate = true;
  }
}
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

/** The particle system: emit(kind, opts) and burst helpers per element. */
export class Particles {
  constructor(scene) { this.glow = new Cloud(scene, true); this.soft = new Cloud(scene, false); }
  setCamera(camera, height) { const s = height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2); this.glow.mat.uniforms.uScale.value = this.soft.mat.uniforms.uScale.value = s; }
  /** One particle. o: x y z, vx vy vz, life, size (s0) → s1, color (c0 hex) → c1, alpha, cell, grav, drag, spin, glow (additive). */
  one(o) {
    const c0 = rgb(o.color ?? 0xffffff), c1 = o.color1 === undefined ? c0 : rgb(o.color1);
    (o.glow ? this.glow : this.soft).add({ x: o.x, y: o.y, z: o.z, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, t: 0, life: o.life || 0.6, s0: o.size ?? 0.4, s1: o.size1 ?? o.size ?? 0.4, c0, c1, a: o.alpha ?? 1, cell: o.cell || 0, grav: o.grav || 0, drag: o.drag || 0, r: o.rot ?? Math.random() * 6.28, spin: o.spin || 0, fadeIn: o.fadeIn ?? 0.1, orbit: o.orbit || null });
  }
  /** A ball of particles flying out from (x, y, z). */
  burst(x, y, z, n, o) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, u = o.flat ? (Math.random() - 0.5) * 0.4 : Math.random() * 2 - 1, r = Math.sqrt(1 - u * u), sp = (o.speed || 4) * (0.4 + Math.random() * 0.8);
      this.one({ ...o, x, y, z, vx: Math.cos(a) * r * sp, vy: u * sp + (o.up || 0), vz: Math.sin(a) * r * sp, life: (o.life || 0.6) * (0.6 + Math.random() * 0.7), size: (o.size || 0.4) * (0.6 + Math.random() * 0.8), rot: Math.random() * 6.28 });
    }
  }
  update(dt) { this.glow.update(dt); this.soft.update(dt); }
  clear() { this.glow.p.length = 0; this.soft.p.length = 0; this.glow.update(0); this.soft.update(0); }
  get count() { return this.glow.n + this.soft.n; }
}
/** Colours per element: core, mid, dark/smoke, and the extra spark colour. */
export const PAL = {
  fire: { core: 0xfff1a0, mid: 0xff8a1e, deep: 0xc8260c, smoke: 0x3a2a24, spark: 0xffd060 },
  ice: { core: 0xffffff, mid: 0x8fe0ff, deep: 0x2f8fd8, smoke: 0xd8f4ff, spark: 0xe6fbff },
  wind: { core: 0xf0fff2, mid: 0x7ef0a0, deep: 0x23a860, smoke: 0xd8ffe4, spark: 0xc8ffd8 },
  thunder: { core: 0xffffff, mid: 0xfff060, deep: 0x9a6aff, smoke: 0x5a4a8a, spark: 0xfff8b0 },
};
