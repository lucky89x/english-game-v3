// (27/11, turn 69) The other children of the room, drawn in this child's world: a body of their own kind and colours,
// a blue name tag, the last place heard glided to, and a speech bubble for the ready-made lines.
// Only children standing in the same land are drawn; the rest are kept for the list in the panel.
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Npc } from './actors.js';
import { animName, glide } from '../core/net.js';

export class Peers {
  /** api: { scene, body(kind) -> Promise<gltf never shown itself>, label(text, opts) -> sprite, dress(root, look), clips } */
  constructor(api) { this.api = api; this.map = new Map(); this.region = ''; }
  get list() { return [...this.map.values()]; }
  get(id) { return this.map.get(id) || null; }
  here(p) { return p.r === this.region && !!p.npc && p.placed; }
  setRegion(r) { this.region = r; for (const p of this.map.values()) this.show(p); }
  show(p) { if (p.npc) p.npc.root.visible = this.here(p); }

  /** info: { id, n, lv, look, r, at } from the server. */
  add(info) {
    this.remove(info.id);
    const p = { id: info.id, n: info.n, lv: info.lv, look: info.look, r: info.r, npc: null, tag: null, bubble: null, bubbleT: 0, placed: false, to: null, cur: { x: 0, z: 0, h: 0, y: 0 }, anim: 'Idle', build: 0 };
    this.map.set(p.id, p); this.dress(p); if (info.at) this.move(p.id, info.at);
    return p;
  }
  /** Builds (or rebuilds) the body from the look; the peer keeps its place. */
  async dress(p) {
    const turn = ++p.build;
    try {
      const g = await this.api.body(p.look.a); if (this.map.get(p.id) !== p || turn !== p.build) return;
      const sc = SkeletonUtils.clone(g.scene);
      sc.traverse((o) => { if (o.isMesh && o.material) o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); });
      const npc = new Npc({ scene: sc, animations: g.animations }, 0, 0, 0, this.api.clips);
      this.api.dress(npc.root, p.look);
      this.drop(p); p.npc = npc; this.api.scene.add(npc.root); this.tag(p);
      npc.root.position.set(p.cur.x, p.cur.h, p.cur.z); npc.root.rotation.y = p.cur.y; npc.play(p.anim); this.show(p);
    } catch (e) { console.warn('peer body: ' + e.message); }
  }
  tag(p) {
    if (!p.npc) return;
    if (p.tag) { p.tag.removeFromParent(); p.tag.material.map.dispose(); p.tag.material.dispose(); }
    p.tag = this.api.label(`${p.n} · Lv ${p.lv}`, { size: 28, scale: 0.72, color: '#0d3a66', bg: 'rgba(214,238,255,0.95)' }); p.tag.position.y = 2.35; p.npc.root.add(p.tag);
  }
  drop(p) {
    for (const k of ['tag', 'bubble']) if (p[k]) { p[k].removeFromParent(); p[k].material.map.dispose(); p[k].material.dispose(); p[k] = null; }
    if (p.npc) { p.npc.root.removeFromParent(); p.npc.root.traverse((o) => { if (o.isMesh && o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose(); }); if (p.npc.mixer) p.npc.mixer.stopAllAction(); p.npc = null; }
  }
  remove(id) { const p = this.map.get(id); if (!p) return; this.drop(p); this.map.delete(id); }
  clear() { for (const id of [...this.map.keys()]) this.remove(id); }

  move(id, at) {
    const p = this.map.get(id); if (!p) return;
    p.to = { x: at.x, z: at.z, h: at.h, y: at.y }; p.anim = animName(at.a);
    if (!p.placed) { p.placed = true; Object.assign(p.cur, p.to); this.show(p); }
  }
  enter(id, r) { const p = this.map.get(id); if (!p) return; p.r = r; p.placed = false; p.to = null; this.show(p); }
  card(id, lv, look) { const p = this.map.get(id); if (!p) return; const same = JSON.stringify(look) === JSON.stringify(p.look); p.lv = lv; p.look = look; if (same) this.tag(p); else this.dress(p); }
  /** A line over the head for a few seconds. */
  say(id, text, anim) {
    const p = this.map.get(id); if (!p || !p.npc) return;
    if (p.bubble) { p.bubble.removeFromParent(); p.bubble.material.map.dispose(); p.bubble.material.dispose(); }
    p.bubble = this.api.label(text, { size: 28, scale: 0.7, color: '#222', bg: 'rgba(255,255,255,0.97)' }); p.bubble.position.y = 3.05; p.npc.root.add(p.bubble); p.bubbleT = 5;
    if (anim && p.npc.actions[anim]) { p.npc.play(anim); p.hold = 1.6; }
  }
  /** dt: the capped step for the clips; rt: real seconds for gliding and the waits. */
  update(dt, rt) {
    for (const p of this.map.values()) {
      if (p.bubble) { p.bubbleT -= rt; if (p.bubbleT <= 0) { p.bubble.removeFromParent(); p.bubble.material.map.dispose(); p.bubble.material.dispose(); p.bubble = null; } }
      if (!p.npc || !this.here(p)) continue;
      if (p.to) glide(p.cur, p.to, rt);
      const n = p.npc; n.x = p.cur.x; n.z = p.cur.z; n.root.position.set(p.cur.x, p.cur.h, p.cur.z); n.root.rotation.y = p.cur.y;
      if (p.hold > 0) p.hold -= rt; else n.play(n.actions[p.anim] ? p.anim : p.anim === 'Run' && n.actions.Walk ? 'Walk' : 'Idle');
      if (n.mixer) n.mixer.update(dt);
    }
  }
  /** The nearest drawn child within `r` metres of a point, or null. */
  near(pos, r = 2.6) { let best = null, bd = r; for (const p of this.map.values()) if (this.here(p)) { const d = Math.hypot(pos.x - p.cur.x, pos.z - p.cur.z); if (d < bd) { bd = d; best = p; } } return best; }
  markers() { const out = []; for (const p of this.map.values()) if (this.here(p)) out.push({ x: p.cur.x, z: p.cur.z, text: '🙂', color: '#9fd8ff' }); return out; }
}
