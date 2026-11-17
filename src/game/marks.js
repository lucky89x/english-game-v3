// Quest markers (feedback 17/11, second time: "the glowing ! is still hard to tell apart"). Every quest giver gets
// a solid golden "!" (a new job) or "?" (come back and report) that spins slowly and bobs above the head, with a
// pulsing glow behind it, a beam of light up into the sky that can be seen across the village, and a bright ring on
// the ground. The materials ignore lighting, so they look the same at every graphics level, with or without bloom.
import * as THREE from 'three';

const GOLD = new THREE.Color(1.0, 0.82, 0.18), DEEP = new THREE.Color(0.48, 0.26, 0.04);
function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,248,200,1)'); g.addColorStop(0.35, 'rgba(255,214,70,0.7)'); g.addColorStop(1, 'rgba(255,190,30,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
function beamTexture() {           // bright at the bottom, fading out upwards, soft at the sides
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d');
  const v = c.createLinearGradient(0, 256, 0, 0); v.addColorStop(0, 'rgba(255,230,120,0.9)'); v.addColorStop(0.5, 'rgba(255,210,80,0.35)'); v.addColorStop(1, 'rgba(255,200,60,0)');
  c.fillStyle = v; c.fillRect(0, 0, 64, 256);
  c.globalCompositeOperation = 'destination-in'; const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = h; c.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(cv);
}
/** The "!" or "?" as solid shapes with a dark rim (inverted hull) so it reads against sky and grass alike. */
function glyph(kind, fill, rim) {
  const g = new THREE.Group(), parts = [];
  if (kind === '!') {
    const bar = new THREE.CylinderGeometry(0.15, 0.085, 0.62, 14); bar.translate(0, 0.42, 0); parts.push(bar);
    const dot = new THREE.SphereGeometry(0.12, 14, 10); parts.push(dot);
  } else {
    const hook = new THREE.TorusGeometry(0.22, 0.085, 10, 24, Math.PI * 1.45); hook.rotateZ(-Math.PI * 0.45); hook.translate(0, 0.62, 0); parts.push(hook);
    const stem = new THREE.CylinderGeometry(0.085, 0.085, 0.2, 12); stem.translate(0, 0.3, 0); parts.push(stem);
    const dot = new THREE.SphereGeometry(0.11, 14, 10); parts.push(dot);
  }
  for (const geo of parts) {             // drawn after the glow (transparent list, higher order) so the glow never washes it out
    const f = new THREE.Mesh(geo, fill); f.renderOrder = 8; g.add(f);
    const r = new THREE.Mesh(geo, rim); r.scale.setScalar(1.2); r.renderOrder = 7; g.add(r);
  }
  return g;
}

export class QuestMarks {
  constructor(scene) {
    this.scene = scene; this.pool = []; this.t = 0;
    this.fill = new THREE.MeshBasicMaterial({ color: GOLD.clone().multiplyScalar(1.15), toneMapped: false, transparent: true });
    this.fillQ = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.92, 1.0).multiplyScalar(1.1), toneMapped: false, transparent: true });
    this.rim = new THREE.MeshBasicMaterial({ color: DEEP, side: THREE.BackSide, transparent: true });
    this.glowTex = glowTexture(); this.beamTex = beamTexture();
  }
  make() {
    const root = new THREE.Group(), add = (o) => { if (o.isMesh || o.isSprite) o.renderOrder = 4; root.add(o); return o; };
    const bang = add(glyph('!', this.fill, this.rim)), ask = add(glyph('?', this.fillQ, this.rim));
    const glow = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffd23c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
    glow.renderOrder = 5;
    const beam = add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 14, 16, 1, true), new THREE.MeshBasicMaterial({ map: this.beamTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })));
    const ring = add(new THREE.Mesh(new THREE.RingGeometry(0.55, 0.85, 32), new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })));
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(root);
    return { root, bang, ask, glow, beam, ring, y: 0, ground: 0, phase: Math.random() * 6 };
  }
  /** list: [{x, z, text: '!' | '?', ground, head}] — ground: height of the ground, head: height for the sign. */
  set(list) {
    while (this.pool.length < list.length) this.pool.push(this.make());
    this.pool.forEach((m, i) => {
      const w = list[i]; m.root.visible = !!w; if (!w) return;
      m.bang.visible = w.text === '!'; m.ask.visible = w.text === '?';
      m.root.position.set(w.x, 0, w.z); m.y = w.head; m.ground = w.ground;
      m.glow.material.color.set(w.text === '!' ? 0xffd23c : 0xbfe6ff); m.ring.material.color.set(w.text === '!' ? 0xffd23c : 0xbfe6ff);
    });
  }
  update(dt) {
    this.t += dt;
    for (const m of this.pool) if (m.root.visible) {
      const t = this.t + m.phase, k = 0.5 + 0.5 * Math.sin(t * 4.5), y = m.y + Math.sin(t * 2.6) * 0.14;
      for (const g of [m.bang, m.ask]) { g.position.y = y; g.rotation.y = t * 1.6; g.scale.setScalar(1.5 + 0.15 * k); }
      m.glow.position.y = y + 0.55; m.glow.scale.setScalar(1.8 + 0.6 * k); m.glow.material.opacity = 0.25 + 0.35 * k;
      m.beam.position.y = m.ground + 7; m.beam.material.opacity = 0.35 + 0.35 * k;
      m.ring.position.y = m.ground + 0.06; m.ring.scale.setScalar(1 + 0.35 * k); m.ring.material.opacity = 0.9 - 0.6 * k;
    }
  }
}
