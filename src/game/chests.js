// Word chests in the Wild Meadow: each one is locked with an English word of the unit being studied.
// The child sees the Vietnamese meaning and rebuilds the word from letter tiles. A chest opens once a day.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { today } from '../core/review.js';
import { spellable } from '../core/spell.js';

export const CHEST_SPOTS = [[40, -20], [46, -30], [34, -34], [30, -28], [42, -40]];
/** Map 2: chests in the Forest of Memories, shown once Map 2 is open (they ask Unit 2 words there). */
export const FOREST_CHESTS = [[-10, -20], [25, -12], [-30, 30], [30, 35], [45, -30]];

export class Chests {
  /** api: { scene, profile() -> profile, cards() -> [{id, word, vi}], dueIds() -> [id], open(chest, card) } */
  constructor(api) {
    this.api = api; this.root = new THREE.Group(); api.scene.add(this.root); this.t = 0;
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a5a2c, roughness: 0.8 }), band = new THREE.MeshStandardMaterial({ color: 0xe2b04a, roughness: 0.3, metalness: 0.8 });
    this.list = [...CHEST_SPOTS.map((p) => [...p, 'village']), ...FOREST_CHESTS.map((p) => [...p, 'forest'])].map(([x, z, region], i) => {
      const g = new THREE.Group(), y = L.REGIONS[region].groundHeight(x, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.75), wood); base.position.y = 0.3; g.add(base);
      const lid = new THREE.Group(); lid.position.set(0, 0.6, -0.375); g.add(lid);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 1.1, 12, 1, false, 0, Math.PI), wood); top.rotation.z = Math.PI / 2; top.position.z = 0.375; lid.add(top);
      for (const sx of [-0.4, 0.4]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.78), band); b.position.set(sx, 0.3, 0); g.add(b); const bt = new THREE.Mesh(new THREE.TorusGeometry(0.375, 0.04, 6, 12, Math.PI), band); bt.rotation.y = Math.PI / 2; bt.position.set(sx, 0, 0.375); lid.add(bt); }
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0xffd23c, emissive: 0xffb020, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3 })); lock.position.set(0, 0.55, 0.4); g.add(lock);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.18, depthWrite: false })); glow.position.y = 0.5; g.add(glow);
      g.traverse((o) => { if (o.isMesh && o !== glow) o.castShadow = true; });
      g.position.set(x, y, z); g.rotation.y = Math.atan2(-x + 40, -z - 10) + Math.PI; this.root.add(g);
      return { i, x, z, g, lid, lock, glow, region };
    });
    this.setRegion(L.NAME);
  }
  get data() { const p = this.api.profile(); return p ? (p.chests || (p.chests = {})) : {}; }
  isOpen(c) { return this.data[c.i] === today(); }
  setRegion(name) { this.region = name; this.root.visible = name === 'village' || name === 'forest'; this.sync(); }
  /** A chest takes part in this region (forest ones once Map 2 is open). */
  live(c) { const p = this.api.profile(); return c.region === this.region && (c.region !== 'forest' || !!(p && p.flags.map2)); }
  sync() { for (const c of this.list) { c.g.visible = this.live(c); const o = this.isOpen(c); c.lid.rotation.x = o ? -1.9 : 0; c.lock.visible = !o; c.glow.visible = !o; } }
  /** Chooses the lock word: a due review word first, otherwise a word of the unit; null when the unit has none that fit. */
  word(c) {
    const cards = this.api.cards().filter((w) => spellable(w.word)); if (!cards.length) return null;
    const due = this.api.dueIds().map((id) => cards.find((w) => w.id === id)).filter(Boolean);
    const pool = due.length ? due : cards; return pool[(c.i * 7 + today()) % pool.length];
  }
  interact(pos) {
    if (!this.root.visible) return null;
    for (const c of this.list) if (this.live(c) && Math.hypot(pos.x - c.x, pos.z - c.z) < 1.9) {
      if (this.isOpen(c)) return { text: 'Rương đã mở hôm nay. Mai quay lại nhé!', run() {} };
      return { text: 'E · Mở rương khóa chữ', run: () => { const w = this.word(c); this.api.open(c, w); } };
    }
    return null;
  }
  opened(c) { this.data[c.i] = today(); this.sync(); }
  update(dt) { if (!this.root.visible) return; this.t += dt; for (const c of this.list) { const v = this.live(c); if (c.g.visible !== v) c.g.visible = v; }      // Map 2 can open while standing in the forest
    for (const c of this.list) if (c.g.visible && c.glow.visible) { c.glow.scale.setScalar(1 + Math.sin(this.t * 2.5 + c.i) * 0.08); c.lock.rotation.y = Math.sin(this.t * 2 + c.i) * 0.3; } }
  markers() { return this.root.visible ? this.list.filter((c) => this.live(c) && !this.isOpen(c)).map((c) => ({ x: c.x, z: c.z, text: '▣', color: '#ffd23c' })) : []; }
}
