// Floating numbers over monsters (20/11, magic): damage, "Miss!", combo names. Small canvas sprites from a pool that rise
// and fade in about a second; drawn on top of everything so they never hide behind a monster.
import * as THREE from 'three';
import * as L from '../core/layout.js';

export class Floaters {
  constructor(scene) { this.scene = scene; this.live = []; this.pool = []; }
  /** text at the ground point (x, z), a CSS colour, size about 1 for a normal number. */
  add(x, z, text, color = '#ffffff', size = 1) {
    let f = this.pool.pop();
    if (!f) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })); s.renderOrder = 12; f = { s, c, tex };
    }
    const g = f.c.getContext('2d'); g.clearRect(0, 0, 256, 64); g.font = '900 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 7; g.strokeStyle = 'rgba(20,10,30,.85)'; g.strokeText(text, 128, 34); g.fillStyle = color; g.fillText(text, 128, 34); f.tex.needsUpdate = true;
    f.t = 0; f.x = x + (Math.random() - 0.5) * 0.6; f.z = z + (Math.random() - 0.5) * 0.6; f.y = L.groundHeight(x, z) + 2.2; f.size = size;
    f.s.scale.set(2.2 * size, 0.55 * size, 1); f.s.material.opacity = 1; f.s.position.set(f.x, f.y, f.z); this.scene.add(f.s); this.live.push(f);
  }
  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const f = this.live[i]; f.t += dt; f.s.position.y = f.y + f.t * 1.4; f.s.material.opacity = Math.max(0, 1 - Math.max(0, f.t - 0.5) / 0.6);
      if (f.t > 1.1) { this.scene.remove(f.s); this.live.splice(i, 1); if (this.pool.length < 40) this.pool.push(f); }
    }
  }
}
