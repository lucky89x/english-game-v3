// A portal (24/11): a stone arch with a swirling light inside and a board with the places it leads to. One per map edge; the child
// presses E in front of it (the card that opens is src/ui/worldmap.js). Built from boxes and one shader, a few hundred triangles.
import * as THREE from 'three';
import { TIME, label } from './common.js';

const SWIRL = `
  uniform float uTime; uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
    float a = atan(p.y, p.x), k = sin(a * 4.0 + uTime * 1.6 - r * 7.0) * 0.5 + 0.5, k2 = sin(a * 7.0 - uTime * 2.1 + r * 11.0) * 0.5 + 0.5;
    vec3 c = mix(uA, uB, k * 0.7 + k2 * 0.3) * (0.55 + 0.7 * (1.0 - r));
    float edge = smoothstep(1.0, 0.82, r);
    gl_FragColor = vec4(c, (0.5 + 0.35 * k) * edge);
  }`;

/** x, z: the place; yaw: which way the arch faces; names: what the board says ("Rừng xanh · Biển cả"). Returns a Group; group.userData.update(t). */
export function makePortal(x, y, z, yaw, names) {
  const g = new THREE.Group(), stone = new THREE.MeshStandardMaterial({ color: 0xa9a6b4, roughness: 0.9, flatShading: true }), moss = new THREE.MeshStandardMaterial({ color: 0x6f8f55, roughness: 1 });
  const box = (w, h, d, m, px, py, pz, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(px, py, pz); o.rotation.y = ry; o.castShadow = true; g.add(o); return o; };
  const W = 3.2, H = 4.6;      // inner width and height
  for (const s of [-1, 1]) { box(0.9, H, 0.9, stone, s * (W / 2 + 0.45), H / 2, 0); box(1.1, 0.35, 1.1, stone, s * (W / 2 + 0.45), 0.17, 0); box(1.0, 0.3, 1.0, stone, s * (W / 2 + 0.45), H + 0.1, 0); box(0.5, 0.3, 0.5, moss, s * (W / 2 + 0.7), 0.5, 0.3); }
  // the arch: a ring of wedge blocks above the pillars
  const N = 9; for (let i = 0; i < N; i++) { const a = Math.PI * (i + 0.5) / N, rr = W / 2 + 0.45; box(0.95, 0.8, 0.95, stone, Math.cos(a) * rr, H + 0.15 + Math.sin(a) * (W / 2 + 0.2), 0, 0).rotation.z = a - Math.PI / 2; }
  box(0.7, 0.7, 1.0, moss, 0, H + W / 2 + 0.75, 0);      // keystone
  const swirl = new THREE.Mesh(new THREE.CircleGeometry(W / 2 + 0.15, 40), new THREE.ShaderMaterial({ uniforms: { uTime: TIME, uA: { value: new THREE.Color(0x58d6ff) }, uB: { value: new THREE.Color(0xc78bff) } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: SWIRL, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  swirl.position.set(0, H / 2 + 0.5, 0); swirl.scale.set(1, (H + 1) / (W + 0.3), 1); swirl.userData.noOutline = true; g.add(swirl);
  const light = new THREE.PointLight(0x9fd8ff, 6, 10, 1.6); light.position.set(0, 2.4, 0.8); g.add(light);
  const board = label(names, { size: 30, scale: 1.0 }); board.position.set(0, H + W / 2 + 2.0, 0); g.add(board);
  g.position.set(x, y, z); g.rotation.y = yaw; g.userData.update = (t) => { light.intensity = 5 + Math.sin(t * 3) * 1.2; };
  return g;
}
