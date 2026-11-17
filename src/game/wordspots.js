// Word sparkles (feedback 17/11: "teach while playing, don't assume the child already knows"). Glowing letter
// bubbles float along the village roads. Walking up and pressing E teaches one word of the unit: a big card with
// the word read aloud and its meaning, and a small reward. New words come first; when every word has been met, a
// sparkle replays one already met so it is heard again. Each sparkle can be used once a day. Words met here are
// the ones Ben's travellers, the chests and the owl ask about first.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { today } from '../core/review.js';

export const SPOTS = [[-2.2, -6], [3.4, 4.5], [-6.5, 12], [9, 7.2], [1.5, 22], [-6, 30.5], [27, 6], [-12, -2.5], [12.5, -2.5], [-2, 41]];

function bubbleTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 8, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.5, 'rgba(140,220,255,0.75)'); g.addColorStop(1, 'rgba(80,170,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  c.font = '900 44px "Nunito", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 6; c.strokeStyle = '#1f5a9a'; c.strokeText('Abc', 64, 66); c.fillStyle = '#ffffff'; c.fillText('Abc', 64, 66);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class WordSpots {
  /** api: { scene, profile(), cards() -> [{id, word, vi}], learn(card, isNew) } */
  constructor(api) {
    this.api = api; this.t = 0; this.root = new THREE.Group(); api.scene.add(this.root);
    const tex = bubbleTexture(), V = L.REGIONS.village;
    this.list = SPOTS.map(([x, z], i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })); sp.scale.setScalar(1.0); sp.renderOrder = 4;
      const y = V.walkHeight(x, z) + 1.25; sp.position.set(x, y, z); this.root.add(sp);
      return { i, x, z, y, sp };
    });
    this.setRegion(L.NAME);
  }
  get data() { const p = this.api.profile(); return p ? (p.spots || (p.spots = {})) : {}; }
  used(s) { return this.data[s.i] === today(); }
  setRegion(name) { this.root.visible = name === 'village'; this.sync(); }
  sync() { for (const s of this.list) s.sp.visible = !this.used(s); }
  /** The word a sparkle teaches: the first unit word never met, else the one met longest ago. */
  pick() {
    const p = this.api.profile(), seen = p.seen || {}, cards = this.api.cards(); if (!cards.length) return null;
    const fresh = cards.find((c) => !seen[c.id] && !p.words[c.id]); if (fresh) return { card: fresh, isNew: true };
    const old = [...cards].sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0))[0]; return { card: old, isNew: false };
  }
  interact(pos) {
    if (!this.root.visible) return null;
    for (const s of this.list) if (!this.used(s) && Math.hypot(pos.x - s.x, pos.z - s.z) < 1.8) {
      return { text: 'E · Học từ mới (bong bóng chữ)', run: () => { const w = this.pick(); this.data[s.i] = today(); this.sync(); this.api.learn(w && w.card, w ? w.isNew : false); } };
    }
    return null;
  }
  update(dt) {
    if (!this.root.visible) return; this.t += dt;
    for (const s of this.list) if (s.sp.visible) { const k = Math.sin(this.t * 2.2 + s.i); s.sp.position.y = s.y + k * 0.18; s.sp.scale.setScalar(0.95 + 0.1 * Math.sin(this.t * 3.1 + s.i)); }
  }
  markers() { return this.root.visible ? this.list.filter((s) => !this.used(s)).map((s) => ({ x: s.x, z: s.z, text: '•', color: '#7fd0ff' })) : []; }
}
