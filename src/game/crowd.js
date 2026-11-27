// (27/11, turn 67) People who walk about: the three young explorers of core/crowd.js, and the walking of the hero's two friends
// (main.js keeps their talk). `stepTo` moves a person one frame towards a point, with the walk or run clip, stopping at
// walls and water; the Crowd keeps the explorers walking between the places of the land the hero is in.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as L from '../core/layout.js';
import { Npc } from './actors.js';
import { BOTS, botLevel, HELLOS } from '../core/crowd.js';

/** One frame of walking for an Npc: 'arrived' | 'moving' | 'blocked'. */
export function stepTo(n, tx, tz, speed, dt, near = 0.5) {
  const dx = tx - n.x, dz = tz - n.z, dd = Math.hypot(dx, dz);
  if (dd <= near) { n.play('Idle'); return 'arrived'; }
  const st = Math.min(dd, speed * dt), nx = n.x + dx / dd * st, nz = n.z + dz / dd * st;
  if (!L.walkable(nx, nz, 0.35) || (L.inWater && L.inWater(nx, nz))) { n.play('Idle'); return 'blocked'; }
  n.x = nx; n.z = nz; n.root.position.set(nx, L.walkHeight(nx, nz), nz);
  let diff = Math.atan2(dx, dz) - n.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); n.root.rotation.y += diff * Math.min(1, dt * 10);
  n.play(speed > 5 && n.actions.Run ? 'Run' : 'Walk'); return 'moving';
}
/** Turns a standing person towards a point. */
export function faceTo(n, x, z, dt) { let diff = Math.atan2(x - n.x, z - n.z) - n.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); n.root.rotation.y += diff * Math.min(1, dt * 5); }
/** A free spot round a point (for someone who arrives beside the hero): [x, z] or null. */
export function spotNear(x, z, r0 = 11, r1 = 16, rnd = Math.random) {
  for (let k = 0; k < 24; k++) { const a = rnd() * 6.283, r = r0 + rnd() * (r1 - r0), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; if (L.walkable(px, pz, 0.7) && !(L.inWater && L.inWater(px, pz))) return [px, pz]; }
  return null;
}

export class Crowd {
  /** api: { scene, load(file) -> gltf, label(text, opts) -> sprite, tint(root, parts), fallbackClips, onHello(bot, line), onTalk(bot) } */
  constructor(api) { this.api = api; this.list = []; this.on = false; }
  async init() {
    for (const def of BOTS) {
      try {
        const g = await this.api.load(def.file), sc = SkeletonUtils.clone(g.scene);
        sc.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); if (def.mul) o.material.color.multiply(new THREE.Color(...def.mul)); } });
        const npc = new Npc({ scene: sc, animations: g.animations }, 0, 0, 0, this.api.fallbackClips); if (def.tint) this.api.tint(npc.root, def.tint);
        npc.root.scale.setScalar(def.scale); npc.hide(); this.api.scene.add(npc.root);
        this.list.push({ def, npc, tag: null, tx: 0, tz: 0, idle: 0, stuck: 0, greet: 20 + this.list.length * 25, wave: 0, n: this.list.length });
      } catch (e) { console.warn('explorer ' + def.id + ': ' + e.message); }
    }
  }
  /** The explorers move to the land the hero enters. show: false hides them (the admin, the treasure isle). lo, hi: the land's levels. */
  setRegion(show, lo = 1, hi = 5) {
    const R = L.REGIONS[L.NAME]; this.on = !!show;
    this.spots = (R.LANDMARKS || []).map((l) => l.spot || [l.x, l.z]).filter(([x, z]) => L.walkable(x, z, 0.6) && !(L.inWater && L.inWater(x, z)));
    if (this.spots.length < 2) this.on = false;
    this.list.forEach((b, k) => {
      if (b.tag) { b.tag.removeFromParent(); b.tag.material.map.dispose(); b.tag.material.dispose(); b.tag = null; }
      if (!this.on) { b.npc.hide(); return; }
      const [x, z] = this.spots[(k * 2 + 1) % this.spots.length]; b.npc.move(x + 1.2, z + 0.8, k); this.pick(b); b.idle = 2 + k * 3;
      b.tag = this.api.label(`${b.def.name} · Lv ${botLevel(b.def, lo, hi)}`, { size: 26, scale: 0.55 / b.def.scale }); b.tag.position.y = 2.25 / b.def.scale; b.npc.root.add(b.tag);
    });
  }
  pick(b) { const s = this.spots[Math.floor(Math.random() * this.spots.length)]; b.tx = s[0] + (Math.random() - 0.5) * 3; b.tz = s[1] + (Math.random() - 0.5) * 3; b.stuck = 0; }
  /** pos: the hero; talkingTo: the name in the open talk ('' when none); quiet: no calling out now (a talk, a fight, a room). */
  update(dt, pos, talkingTo, quiet, rt = dt) {      // dt: the step for walking (capped); rt: real seconds, for the waits
    if (!this.on) return;
    for (const b of this.list) {
      const n = b.npc, d = Math.hypot(pos.x - n.x, pos.z - n.z); b.greet -= rt;
      if (d > 75) { b.idle -= rt; if (b.idle <= 0) { n.x = b.tx; n.z = b.tz; n.root.position.set(n.x, L.walkHeight(n.x, n.z), n.z); this.pick(b); b.idle = 12 + Math.random() * 14; } n.root.visible = false; continue; }      // far away: not drawn, hops from place to place
      n.root.visible = true;
      if (talkingTo === b.def.name) { faceTo(n, pos.x, pos.z, dt); n.play(n.actions.Talk ? 'Talk' : 'Idle'); }
      else if (b.wave > 0) { b.wave -= rt; faceTo(n, pos.x, pos.z, dt); n.play(n.actions.Wave ? 'Wave' : 'Idle'); }
      else if (b.idle > 0) { b.idle -= rt; n.play('Idle'); if (d < 6) faceTo(n, pos.x, pos.z, dt); }
      else {
        const r = stepTo(n, b.tx, b.tz, 2.5, dt, 0.8);
        if (r === 'arrived') { b.idle = 3 + Math.random() * 8; this.pick(b); } else if (r === 'blocked') { b.stuck += rt; if (b.stuck > 1.2) { this.pick(b); b.idle = 0.6; } }
      }
      if (d < 5 && b.greet <= 0 && !quiet && talkingTo !== b.def.name) { b.greet = 90 + Math.random() * 80; b.wave = 2.2; if (this.api.onHello) this.api.onHello(b.def, HELLOS[Math.floor(Math.random() * HELLOS.length)]); }
      if (n.mixer) n.mixer.update(dt);
    }
  }
  interact(pos) { if (!this.on) return null; for (const b of this.list) if (b.npc.root.visible && Math.hypot(pos.x - b.npc.x, pos.z - b.npc.z) < 2.4) return { text: `E · Nói chuyện với ${b.def.name}`, run: () => { b.idle = Math.max(b.idle, 4); b.n += 1; this.api.onTalk(b.def, b.n); } }; return null; }
}
