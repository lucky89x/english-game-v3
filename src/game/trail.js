// The quest trail (21/11: "the arrow is hard to follow: draw a line of small dots along the nearest way to the quest").
// Small glowing dots on the ground follow the A* path (core/nav.js) from the hero to the goal; a soft wave runs along
// them towards the goal so the eye reads the direction. The path is worked out again about twice a second, or at once
// when the goal changes. When no path is found (the goal is across water), the dots go straight there.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { findPath, snap, dotsAlong, simplify } from '../core/nav.js';
export { dotsAlong, simplify };

const MAX = 70;

export class GuideTrail {
  constructor(scene) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.45, 'rgba(255,214,70,0.95)'); g.addColorStop(0.7, 'rgba(255,190,40,0.35)'); g.addColorStop(1, 'rgba(255,190,40,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    const geo = new THREE.PlaneGeometry(0.85, 0.85); geo.rotateX(-Math.PI / 2);      // (21/11 check) bigger and brighter: the first ones hid under crops and grass
    this.mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, toneMapped: false, color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, this.mat, MAX); this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.renderOrder = 3;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
    scene.add(this.mesh); this.dots = []; this.t = 0; this.again = 0; this.key = ''; this.m4 = new THREE.Matrix4(); this.col = new THREE.Color();
  }
  /** from: the hero's position; goal: {x, z} or null; show: false hides it. */
  update(dt, from, goal, show) {
    this.t += dt; this.again -= dt;
    if (!show || !goal || Math.hypot(goal.x - from.x, goal.z - from.z) < 3) { this.mesh.visible = false; this.key = ''; return; }
    const key = `${L.NAME}:${Math.round(goal.x)}:${Math.round(goal.z)}`;
    if (key !== this.key || this.again <= 0) {
      this.key = key; this.again = 0.6;
      const t = snap(goal.x, goal.z, 4); let path = t ? findPath(from.x, from.z, t.x, t.z) : null;
      if (!path) path = [{ x: from.x, z: from.z }, { x: goal.x, z: goal.z }];
      else path[0] = { x: from.x, z: from.z };
      this.dots = dotsAlong(simplify(path));
    }
    const n = this.dots.length; this.mesh.count = n; this.mesh.visible = n > 0;
    for (let i = 0; i < n; i++) {
      const d = this.dots[i], wave = 0.5 + 0.5 * Math.sin(i * 0.9 - this.t * 6), far = 1 - Math.max(0, (i - (MAX - 20)) / 20);      // the wave runs towards the goal; the last dots fade
      const s = 0.7 + 0.3 * wave, y = Math.max(L.walkHeight(d.x, d.z), L.groundHeight(d.x, d.z)) + 0.14;
      this.m4.makeScale(s, 1, s).setPosition(d.x, y, d.z); this.mesh.setMatrixAt(i, this.m4);
      this.col.setRGB(1, 0.88 + 0.12 * wave, 0.5 + 0.45 * wave).multiplyScalar((0.85 + 0.15 * wave) * far); this.mesh.setColorAt(i, this.col);
    }
    this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true;
  }
}
