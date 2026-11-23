// Casting the magic skills (20/11; one element and new effects 21/11). Keys 1-3 (or the hotbar buttons) cast the spell in
// that slot; each spell costs mana and has its own cooldown. Damage goes through Wild.damage (element ring, combos, shields).
// Aiming (21/11: "it is hard to hit with a spell that only flies straight"): every spell goes for the locked target (the red
// ring; a left click or pointing with the mouse while pressing the key locks a monster), else the nearest monster in front,
// which then becomes the target. Single-target spells fly after it; melee spells lunge to it; area spells land on it.
// Effects: batched particles (game/fx.js) — a rune circle under the caster, flame trails and embers, ice shards and frost mist,
// wind leaves and streaks, branching lightning with sparks — plus a few meshes (slash crescents, shock rings, meteors).
import * as THREE from 'three';
import * as L from '../core/layout.js';
import * as SK from '../core/skills.js';
import { playerAtk, inArc } from '../core/rules.js';
import { Particles, PAL, cellTexture } from './fx.js';

const mat = (hex, opacity = 0.85, map = null) => new THREE.MeshBasicMaterial({ color: hex, map, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const rnd = (a, b) => a + Math.random() * (b - a);

export class Spells {
  /** api: { scene, wild, player, profile(), sfx(name), ui, onChange(), camera? } */
  constructor(api) { this.api = api; this.fx = []; this.cool = {}; this.root = new THREE.Group(); api.scene.add(this.root); this.parts = new Particles(api.scene); }
  /** Seconds left before a spell can be cast again. */
  wait(id) { return Math.max(0, (this.cool[id] || 0)); }
  /** Casts the spell in hotbar slot i. Returns '' or why not (shown to the child). */
  castSlot(i) {
    const p = this.api.profile(); if (!p) return ''; const id = SK.magic(p).bar[i];
    if (!id) { this.api.ui.toast(SK.elOf(p) ? `Ô ${i + 1} trống: bấm vào ô để chọn chiêu đã học (chưa học thì bấm T)` : 'Con chưa chọn hệ phép: bấm T để chọn Lửa, Băng, Gió hoặc Sét'); return 'empty'; }
    return this.cast(id);
  }
  /** The monster to aim at within r metres: the locked target, else the nearest one (in front counts closer). */
  aim(r) {
    const { wild, player } = this.api, p = this.api.profile(), t = wild.target, d = (m) => Math.hypot(m.x - player.pos.x, m.z - player.pos.z);
    if (t && !t.dead && t.g.visible && d(t) <= r) return t;
    const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw); let best = null, bd = r;
    for (const m of wild.targets(p)) { const front = (m.x - player.pos.x) * fx + (m.z - player.pos.z) * fz > 0 ? 0 : 4, s = d(m) + front; if (s < bd) { bd = s; best = m; } }
    if (best) wild.setTarget(best); return best;
  }
  cast(id) {
    const { wild, player, sfx, ui } = this.api, p = this.api.profile(), n = SK.NODES[id];
    if (!p || !n || !SK.rank(p, id)) return 'unknown';
    if (!wild.root.visible) { ui.toast('Ở đây không dùng phép được'); return 'place'; }
    if (this.wait(id) > 0) return 'cool';
    if (!SK.spend(p, SK.spellCost(id))) { ui.toast('Hết mana (thanh xanh). Uống bình mana (phím 5–8) hoặc chờ một chút!'); sfx('wrong'); return 'mp'; }
    this.cool[id] = SK.spellCool(p, id); sfx('spell_' + n.el);
    const el = n.el, dmg = SK.spellDamage(p, id, playerAtk(p)), C = PAL[el], targets = () => wild.targets(p);
    const range = n.type === 'melee' ? 7 : n.type === 'single' ? 18 : 16, tgt = this.aim(range);
    if (tgt) player.yaw = Math.atan2(tgt.x - player.pos.x, tgt.z - player.pos.z);
    if (n.type === 'melee' && tgt) this.lunge(tgt, wild.reach(tgt) - 0.6);
    player.emote('Interact'); if (player.swing) player.swing();
    const here = player.pos.clone(), yaw = player.yaw, fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const hit = (m, o = {}) => wild.damage(m, dmg * (o.k || 1), el, { spell: true, ...o });
    const near = (at, r) => targets().filter((m) => Math.hypot(m.x - at.x, m.z - at.z) < r + m.def.size * 0.3);
    this.runes(here, el, n.type === 'ultimate' ? 4.5 : n.type === 'aoe' ? 2.2 : 1.3);
    switch (id) {
      // -------------------------------------------------------------- melee: a crescent slash with the element's particles
      case 'flame_slash': case 'frost_strike': case 'thunder_fist': {
        const reach = id === 'thunder_fist' ? 2.8 : 3.0;
        for (const m of targets()) if (inArc(here.x, here.z, yaw, m.x, m.z, reach + m.def.size * 0.3, 0.15)) { hit(m, { burn: id === 'flame_slash' ? 3 : 0, slow: id === 'frost_strike' ? 3 : 0, stun: id === 'thunder_fist' ? 0.8 : 0, knock: 0.5 }); this.impact(m, el, 0.8); }
        this.slash(here, yaw, el, reach); if (id === 'thunder_fist') { const at = here.clone().addScaledVector(fwd, 1.6); this.sparks(at, 1.0, 30); this.shock(at, el, 2.4, 0.3); } break;
      }
      case 'whirlwind': for (const m of near(here, 3.2)) { hit(m, { knock: 2.4 }); this.impact(m, el, 0.7); } this.cyclone(here, 3.2, 0.6); this.shock(here, el, 3.4, 0.45); break;
      // -------------------------------------------------------------- single target: flies after the target
      case 'fireball': this.missile(here, fwd, tgt, el, { speed: 15, size: 0.5, onHit: (at, m) => { if (m) hit(m, { burn: 3 }); for (const o of near(at, 1.6)) if (o !== m) hit(o, { k: 0.4, burn: 2 }); this.explode(at, el, 1.6); } }); break;
      case 'ice_spear': this.missile(here, fwd, tgt, el, { speed: 20, size: 0.32, spear: true, onHit: (at, m) => { if (m) hit(m, { slow: 3 }); this.explode(at, el, 1.2); } }); break;
      case 'wind_blade': this.missile(here, fwd, tgt, el, { speed: 26, size: 0.38, blade: true, onHit: (at, m) => { if (m) hit(m, { knock: 0.8 }); this.explode(at, el, 1.2); } }); break;
      case 'lightning': {
        const first = tgt; if (!first) { this.bolt(here, here.clone().addScaledVector(fwd, 9)); break; }
        hit(first); const at = new THREE.Vector3(first.x, 0, first.z); this.bolt(here, at); this.impact(first, el, 1.2);
        if (SK.rank(p, id) >= 5) { const next = targets().filter((m) => m !== first && Math.hypot(m.x - first.x, m.z - first.z) < 6)[0]; if (next) { hit(next, { k: 0.7 }); this.later(0.08, () => this.bolt(at, new THREE.Vector3(next.x, 0, next.z), true)); } }
        break;
      }
      // -------------------------------------------------------------- area
      case 'meteor': {
        const c = tgt ? new THREE.Vector3(tgt.x, 0, tgt.z) : here.clone().addScaledVector(fwd, 6); this.warn(c, el, 3.2, 1.4);
        [[0, 0], [1.7, 0.9], [-1.3, 1.5]].forEach(([dx, dz], k) => this.later(0.3 + k * 0.35, () => { const at = c.clone().add(new THREE.Vector3(dx, 0, dz)); this.meteor(at, () => { for (const m of near(at, 2.5)) hit(m, { k: 0.75, burn: 2 }); this.explode(at, el, 2.6); sfx('boom'); }); }));
        break;
      }
      case 'blizzard': this.blizzard(here, 6, 4, () => { for (const m of near(player.pos, 6)) hit(m, { k: 0.3, slow: 1.5, mark: true }); }); break;
      case 'tornado': { const dir = tgt ? new THREE.Vector3(tgt.x - here.x, 0, tgt.z - here.z).normalize() : fwd; this.twister(here, dir, (at) => { for (const m of targets()) { const d = Math.hypot(m.x - at.x, m.z - at.z); if (d < 3.5 + m.def.size * 0.3) { if (!m.boss && d > 0.6) { const nx = m.x + (at.x - m.x) / d * 0.5, nz = m.z + (at.z - m.z) / d * 0.5; if (L.walkable(nx, nz, 0.45)) { m.x = nx; m.z = nz; } } hit(m, { k: 0.3 }); } } }); break; }
      case 'thunderstorm': {
        this.cloud(here, 10, 1.9);
        for (let k = 0; k < 6; k++) this.later(0.2 + k * 0.25, () => { const list = targets().filter((m) => Math.hypot(m.x - player.pos.x, m.z - player.pos.z) < 10); const m = list[Math.floor(Math.random() * list.length)]; const at = m ? new THREE.Vector3(m.x, 0, m.z) : player.pos.clone().add(new THREE.Vector3(rnd(-6, 6), 0, rnd(-6, 6))); this.strike(at); if (m) { hit(m, { k: 0.6 }); this.impact(m, el, 1); } sfx('zap'); });
        break;
      }
      // -------------------------------------------------------------- ultimates (24/11): one per element, big, dear and slow to come back
      case 'inferno': {
        this.warn(here, el, 9, 0.9);
        this.later(0.9, () => { for (const m of near(here, 9)) { hit(m, { burn: 5, knock: 2.5 }); this.impact(m, el, 1.3); } this.explode(here, el, 9); sfx('boom'); });
        for (let k = 0; k < 6; k++) this.later(0.95 + k * 0.18, () => { const at = here.clone().add(new THREE.Vector3(rnd(-6, 6), 0, rnd(-6, 6))); for (const m of near(at, 2.6)) hit(m, { k: 0.3, burn: 2 }); this.explode(at, el, 3); });
        break;
      }
      case 'absolute_zero': {
        this.shock(here, el, 10, 0.7); this.cyclone(here, 5, 0.7);
        this.later(0.45, () => { for (const m of near(here, 9)) { hit(m, { stun: 2.5, slow: 4, mark: true }); this.impact(m, el, 1.2); } for (let k = 0; k < 18; k++) this.spike(here.x + rnd(-8, 8), here.z + rnd(-8, 8)); this.explode(here, el, 7); sfx('boom'); });
        break;
      }
      case 'storm_eye': {
        const pull = (at) => { for (const m of near(at, 8)) { const d = Math.hypot(m.x - at.x, m.z - at.z); if (!m.boss && d > 0.8) { const nx = m.x + (at.x - m.x) / d * 0.7, nz = m.z + (at.z - m.z) / d * 0.7; if (L.walkable(nx, nz, 0.45)) { m.x = nx; m.z = nz; } } hit(m, { k: 0.22 }); } };
        const still = new THREE.Vector3(0, 0, 0), a = here.clone(), b = here.clone().add(new THREE.Vector3(3, 0, 2));
        this.twister(a, still, pull); this.twister(b, still, () => {}); this.cyclone(here, 6, 1.2); this.shock(here, el, 8, 0.6);
        break;
      }
      case 'judgement': {
        this.cloud(here, 14, 3.4);
        for (let k = 0; k < 14; k++) this.later(0.2 + k * 0.22, () => { const list = targets().filter((m) => Math.hypot(m.x - player.pos.x, m.z - player.pos.z) < 14), m = list[Math.floor(Math.random() * list.length)]; const at = m ? new THREE.Vector3(m.x, 0, m.z) : player.pos.clone().add(new THREE.Vector3(rnd(-10, 10), 0, rnd(-10, 10))); this.strike(at); if (m) { hit(m, { k: 0.45, stun: 0.5 }); this.impact(m, el, 1.1); } sfx('zap'); });
        break;
      }
    }
    this.api.onChange(); return '';
  }
  // ---------------------------------------------------------------- building blocks (each effect: update(f) -> false when done)
  add(o, update) { if (o) this.root.add(o); this.fx.push({ o, update, t: 0, dt: 0 }); }
  later(sec, fn) { this.add(null, (f) => (f.t >= sec ? (fn(), false) : true)); }
  y(x, z) { return L.groundHeight(x, z); }
  /** Melee: the hero dashes up to the target (stops at `stop` metres from it). */
  lunge(m, stop) {
    const pl = this.api.player, dx = m.x - pl.pos.x, dz = m.z - pl.pos.z, d = Math.hypot(dx, dz); if (d <= stop + 0.3) return;
    let x = pl.pos.x, z = pl.pos.z; const ux = dx / d, uz = dz / d;
    for (let s = 0; s < d - stop; s += 0.25) { const nx = x + ux * 0.25, nz = z + uz * 0.25; if (!L.canStep(x, z, nx, nz)) break; x = nx; z = nz; }
    for (let k = 0; k < 10; k++) { const t = k / 10; this.parts.one({ x: pl.pos.x + (x - pl.pos.x) * t, y: pl.pos.y + 0.6, z: pl.pos.z + (z - pl.pos.z) * t, life: 0.35, size: 0.9, size1: 0.2, color: 0xffffff, alpha: 0.5, cell: 2 }); }
    const yaw = pl.yaw; pl.place(x, z); pl.yaw = yaw;
  }
  /** The rune circle that flashes under the caster. */
  runes(at, el, r) {
    const C = PAL[el], g = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), mat(C.mid, 0.9, cellTexture(7))); g.rotation.x = -Math.PI / 2; g.position.set(at.x, this.y(at.x, at.z) + 0.08, at.z); g.renderOrder = 9;
    this.add(g, (f) => { const k = f.t / 0.6; g.rotation.z += f.dt * 2.5; g.scale.setScalar(0.6 + 0.5 * Math.min(1, k * 2)); g.material.opacity = 0.9 * (1 - k); return k < 1; });
    for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28, rr = Math.random() * r * 0.8; this.parts.one({ x: at.x + Math.cos(a) * rr, y: this.y(at.x, at.z) + 0.1, z: at.z + Math.sin(a) * rr, vy: rnd(1.5, 3), life: rnd(0.4, 0.8), size: 0.25, size1: 0.05, color: C.core, color1: C.mid, glow: true, cell: el === 'ice' ? 1 : 0 }); }
  }
  /** A crescent of light swept in front of the hero, with the element's particles along it. */
  slash(at, yaw, el, r) {
    const C = PAL[el], y0 = at.y + 0.95;
    const geo = new THREE.RingGeometry(r * 0.5, r * 0.98, 40, 1, -Math.PI * 0.45, Math.PI * 0.9), m = new THREE.Mesh(geo, mat(C.deep, 0.75));
    const inner = new THREE.Mesh(new THREE.RingGeometry(r * 0.66, r * 0.9, 40, 1, -Math.PI * 0.42, Math.PI * 0.84), mat(C.mid, 0.95)), edge = new THREE.Mesh(new THREE.RingGeometry(r * 0.86, r * 0.92, 40, 1, -Math.PI * 0.4, Math.PI * 0.8), mat(C.core, 1));
    const g = new THREE.Group(); g.add(m, inner, edge); m.rotation.x = inner.rotation.x = edge.rotation.x = -Math.PI / 2; edge.position.y = 0.01; g.position.set(at.x, y0, at.z); g.rotation.y = yaw - Math.PI / 2; g.rotation.z = 0.25;
    this.add(g, (f) => { const k = f.t / 0.3; g.rotation.y = yaw - Math.PI / 2 + (k - 0.5) * 1.1; g.scale.setScalar(0.8 + 0.35 * k); m.material.opacity = 0.75 * (1 - k); inner.material.opacity = 0.95 * (1 - k * k); edge.material.opacity = 1 - k; return k < 1; });
    for (let i = 0; i < 26; i++) {
      const a = yaw + (i / 25 - 0.5) * Math.PI * 0.9, rr = r * rnd(0.55, 0.95), x = at.x + Math.sin(a) * rr, z = at.z + Math.cos(a) * rr, out = rnd(1, 3);
      if (el === 'fire') this.parts.one({ x, y: y0, z, vx: Math.sin(a) * out, vy: rnd(1, 3), vz: Math.cos(a) * out, life: rnd(0.4, 0.7), size: rnd(0.5, 0.9), size1: 0.15, color: i % 2 ? C.mid : C.core, color1: C.deep, glow: i % 3 === 0, alpha: 0.9, cell: 2, drag: 2 });
      else if (el === 'ice') this.parts.one({ x, y: y0, z, vx: Math.sin(a) * out, vy: rnd(0, 2), vz: Math.cos(a) * out, life: rnd(0.5, 0.8), size: rnd(0.25, 0.45), color: C.core, color1: C.mid, cell: 3, grav: 6, spin: rnd(-8, 8) });
      else if (el === 'wind') this.parts.one({ x, y: y0, z, vx: Math.cos(a) * 4, vy: rnd(0, 1.5), vz: -Math.sin(a) * 4, life: rnd(0.4, 0.7), size: rnd(0.25, 0.4), color: C.mid, color1: C.deep, cell: 4, spin: rnd(-10, 10), drag: 1 });
      else this.parts.one({ x, y: y0, z, vx: Math.sin(a) * out * 2, vy: rnd(-1, 3), vz: Math.cos(a) * out * 2, life: rnd(0.15, 0.35), size: rnd(0.25, 0.45), color: C.core, color1: C.mid, glow: true, cell: 1 });
    }
  }
  /** A bright ring on the ground that grows and fades. */
  shock(at, el, r, life = 0.4) {
    const C = PAL[el], m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), mat(C.mid, 0.9, cellTexture(5))); m.rotation.x = -Math.PI / 2; m.position.set(at.x, this.y(at.x, at.z) + 0.12, at.z); m.renderOrder = 9;
    this.add(m, (f) => { const k = f.t / life; m.scale.setScalar(0.2 + 0.9 * Math.sqrt(k)); m.material.opacity = 0.9 * (1 - k); return k < 1; });
  }
  /** Where a monster gets hit: a flash and particles of the element. */
  impact(m, el, k = 1) { const y = this.y(m.x, m.z) + 0.6 * m.def.size * (m.def.fit || 1); this.pop(new THREE.Vector3(m.x, y, m.z), el, k); }
  pop(at, el, k = 1) {
    const C = PAL[el];
    this.parts.one({ x: at.x, y: at.y, z: at.z, life: 0.22, size: 1.6 * k, size1: 2.4 * k, color: C.core, color1: C.mid, glow: true, cell: 0, alpha: 0.9, fadeIn: 0.01 });
    if (el === 'fire') { this.parts.burst(at.x, at.y, at.z, 14 * k | 0, { speed: 4, life: 0.5, size: 0.7, size1: 0.12, color: C.mid, color1: C.deep, alpha: 0.95, cell: 2, drag: 3, up: 1 }); this.parts.burst(at.x, at.y, at.z, 8 * k | 0, { speed: 6, life: 0.4, size: 0.25, size1: 0.05, color: C.spark, glow: true, cell: 1, grav: 5 }); this.parts.burst(at.x, at.y, at.z, 6, { speed: 1.5, life: 0.9, size: 0.6, size1: 1.2, color: C.smoke, alpha: 0.45, cell: 2, up: 1.5 }); }
    else if (el === 'ice') { this.parts.burst(at.x, at.y, at.z, 12 * k | 0, { speed: 5, life: 0.6, size: 0.35, color: C.core, color1: C.mid, cell: 3, grav: 9, spin: 8 }); this.parts.burst(at.x, at.y, at.z, 6, { speed: 1.2, life: 0.8, size: 0.7, size1: 1.4, color: C.smoke, alpha: 0.5, cell: 2 }); }
    else if (el === 'wind') { this.parts.burst(at.x, at.y, at.z, 12 * k | 0, { speed: 5, life: 0.5, size: 0.3, color: C.mid, color1: C.deep, cell: 4, spin: 10, drag: 2, flat: true }); this.parts.burst(at.x, at.y, at.z, 8, { speed: 6, life: 0.3, size: 0.6, color: C.core, alpha: 0.7, cell: 6, flat: true }); }
    else this.sparks(at, k, 18);
  }
  sparks(at, k, n) { const C = PAL.thunder; this.parts.burst(at.x, at.y, at.z, n * k | 0, { speed: 7, life: 0.3, size: 0.3, size1: 0.05, color: C.core, color1: C.mid, glow: true, cell: 1, grav: 6 }); }
  /** A bigger hit: flash, shock ring and lots of particles. */
  explode(at, el, r) {
    const p = new THREE.Vector3(at.x, (at.y > 0.01 ? at.y : this.y(at.x, at.z) + 0.8), at.z); this.pop(p, el, 1.6); this.shock(at, el, r * 1.3, 0.45);
    const C = PAL[el]; if (el === 'fire') for (let i = 0; i < 10; i++) this.parts.one({ x: at.x + rnd(-r, r) * 0.5, y: this.y(at.x, at.z) + 0.2, z: at.z + rnd(-r, r) * 0.5, vy: rnd(1, 3), life: rnd(0.6, 1.1), size: rnd(0.6, 1), size1: 0.2, color: C.mid, color1: C.deep, glow: true, cell: 2 });
    if (el === 'ice') for (let i = 0; i < 6; i++) this.spike(at.x + rnd(-r, r) * 0.6, at.z + rnd(-r, r) * 0.6);
  }
  /** Ice spike popping out of the ground and melting away. */
  spike(x, z) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.0, 5), new THREE.MeshStandardMaterial({ color: 0xcff2ff, emissive: 0x4fb8ff, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 })); const y = this.y(x, z);
    m.position.set(x, y, z); m.rotation.set(rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3)); this.add(m, (f) => { const k = f.t / 1.2; m.position.y = y + Math.min(1, f.t * 8) * 0.45 - Math.max(0, k - 0.7) * 1.5; m.material.opacity = 0.9 * (1 - Math.max(0, k - 0.7) / 0.3); return k < 1; });
  }
  /** A single-target spell: a glowing missile that steers after the monster `m` (straight on when there is none). */
  missile(from, dir, m, el, o) {
    const C = PAL[el], g = new THREE.Group(), pos = from.clone(); pos.y += 1.0; g.position.copy(pos);
    let core;
    if (o.spear) { core = new THREE.Mesh(new THREE.ConeGeometry(o.size * 0.55, o.size * 4.2, 6), new THREE.MeshStandardMaterial({ color: 0xe6f8ff, emissive: 0x6fd0ff, emissiveIntensity: 1.1, roughness: 0.1, metalness: 0.2 })); core.rotation.x = Math.PI / 2; }
    else if (o.blade) { core = new THREE.Mesh(new THREE.RingGeometry(o.size * 0.9, o.size * 2.0, 24, 1, 0, Math.PI), mat(C.mid, 0.95, cellTexture(6))); core.rotation.x = -Math.PI / 2; }
    else { core = new THREE.Mesh(new THREE.SphereGeometry(o.size * 0.55, 14, 10), mat(C.core, 1)); const shell = new THREE.Mesh(new THREE.SphereGeometry(o.size * 0.85, 14, 10), mat(C.mid, 0.55)); core.add(shell); }
    g.add(core); this.root.add(g);
    const v = dir.clone().normalize(); let life = 0, done = false;
    const hitTest = (x) => Math.hypot(x.x - g.position.x, x.z - g.position.z) < 0.8 + x.def.size * 0.35;
    this.add(g, (f) => {
      if (done) return false; life += f.dt;
      if (m && !m.dead && m.g.visible) { const want = new THREE.Vector3(m.x - g.position.x, 0, m.z - g.position.z).normalize(); v.lerp(want, Math.min(1, f.dt * 9)).normalize(); }
      g.position.addScaledVector(v, o.speed * f.dt); const gy = this.y(g.position.x, g.position.z) + 1.0; g.position.y += (gy - g.position.y) * Math.min(1, f.dt * 6);
      g.rotation.y = Math.atan2(v.x, v.z); if (o.blade) core.rotation.z += f.dt * 20;
      // the trail
      const P = g.position;
      if (el === 'fire') { this.parts.one({ x: P.x, y: P.y, z: P.z, life: 0.25, size: o.size * 2.6, size1: o.size, color: C.core, color1: C.mid, glow: true, cell: 0 }); for (let i = 0; i < 4; i++) this.parts.one({ x: P.x + rnd(-0.15, 0.15), y: P.y + rnd(-0.15, 0.15), z: P.z + rnd(-0.15, 0.15), vy: rnd(0.5, 1.5), life: rnd(0.3, 0.6), size: rnd(0.5, 0.9), size1: 0.12, color: i ? C.mid : C.core, color1: C.deep, glow: i === 0, alpha: 0.9, cell: 2 }); this.parts.one({ x: P.x, y: P.y, z: P.z, vy: 1, life: 0.8, size: 0.4, size1: 1.0, color: C.smoke, alpha: 0.35, cell: 2 }); }
      else if (el === 'ice') { this.parts.one({ x: P.x, y: P.y, z: P.z, life: 0.2, size: 1.2, color: C.mid, glow: true, cell: 0, alpha: 0.7 }); for (let i = 0; i < 2; i++) this.parts.one({ x: P.x, y: P.y, z: P.z, vx: rnd(-1, 1), vy: rnd(-0.5, 1), vz: rnd(-1, 1), life: rnd(0.4, 0.7), size: rnd(0.15, 0.3), color: C.core, color1: C.mid, cell: 3, spin: 6, grav: 3 }); this.parts.one({ x: P.x, y: P.y, z: P.z, life: 0.7, size: 0.5, size1: 1.0, color: C.smoke, alpha: 0.35, cell: 2 }); }
      else if (el === 'wind') { for (let i = 0; i < 2; i++) this.parts.one({ x: P.x, y: P.y + rnd(-0.2, 0.2), z: P.z, vx: -v.x * 2 + rnd(-1, 1), vy: rnd(-0.3, 0.6), vz: -v.z * 2 + rnd(-1, 1), life: rnd(0.3, 0.5), size: rnd(0.2, 0.35), color: C.mid, color1: C.deep, cell: 4, spin: 12 }); this.parts.one({ x: P.x, y: P.y, z: P.z, life: 0.25, size: 1.2, color: C.core, alpha: 0.55, cell: 6, rot: -Math.atan2(v.z, v.x) }); }
      if (m && !m.dead && hitTest(m)) { done = true; o.onHit(g.position.clone(), m); return false; }
      if (!m) for (const x of this.api.wild.targets(this.api.profile())) if (hitTest(x)) { done = true; o.onHit(g.position.clone(), x); return false; }
      if (life * o.speed > 22 || !L.walkable(P.x, P.z, 0.1) && !L.inWater(P.x, P.z)) { done = true; o.onHit(g.position.clone(), null); return false; }
      return true;
    });
  }
  /** A branching lightning bolt from the caster's hand to `b` (or across from one monster to the next). */
  bolt(a, b, chain = false) {
    const A = new THREE.Vector3(a.x, chain ? this.y(a.x, a.z) + 1.0 : a.y + 1.5, a.z), B = new THREE.Vector3(b.x, this.y(b.x, b.z) + 0.8, b.z);
    this.jag(A, B, 0.09, 0.28); this.jag(A, B, 0.04, 0.22);
    for (let k = 0; k < 3; k++) { const s = A.clone().lerp(B, rnd(0.25, 0.75)), e = s.clone().add(new THREE.Vector3(rnd(-1.5, 1.5), rnd(-1, 0.5), rnd(-1.5, 1.5))); this.jag(s, e, 0.03, 0.18); }
    this.sparks(B, 1.2, 22); this.parts.one({ x: B.x, y: B.y, z: B.z, life: 0.25, size: 2.6, color: 0xffffff, color1: PAL.thunder.mid, glow: true, cell: 0, fadeIn: 0.01 });
  }
  jag(A, B, w, life) {
    const pts = [], n = Math.max(6, Math.round(A.distanceTo(B) * 1.6));
    for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); if (i && i < n) p.add(new THREE.Vector3(rnd(-0.45, 0.45), rnd(-0.45, 0.45), rnd(-0.45, 0.45))); pts.push(p); }
    const core = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), n * 3, w, 4), mat(0xffffff, 1));
    const glow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), n * 3, w * 3.5, 5), mat(PAL.thunder.mid, 0.4)); const g = new THREE.Group(); g.add(glow, core);
    this.add(g, (f) => { const k = f.t / life, flick = Math.random() > 0.3 ? 1 : 0.3; core.material.opacity = (1 - k) * flick; glow.material.opacity = 0.4 * (1 - k) * flick; return k < 1; });
  }
  strike(at) { const top = new THREE.Vector3(at.x + rnd(-1, 1), this.y(at.x, at.z) + 11, at.z + rnd(-1, 1)); this.bolt(top, at, true); this.jag(top, new THREE.Vector3(at.x, this.y(at.x, at.z) + 0.2, at.z), 0.1, 0.3); this.shock(at, 'thunder', 2.2, 0.35); }
  /** A dark storm cloud over the hero for the thunderstorm. */
  cloud(at, r, life) {
    const pl = this.api.player;
    this.add(null, (f) => { const p = pl.pos; for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28, rr = Math.random() * r * 0.9; this.parts.one({ x: p.x + Math.cos(a) * rr, y: p.y + rnd(9, 10.5), z: p.z + Math.sin(a) * rr, vx: rnd(-0.3, 0.3), life: rnd(0.8, 1.3), size: rnd(2.5, 4), size1: rnd(3.5, 5), color: 0x3a3456, color1: 0x5a5480, alpha: 0.55, cell: 2, fadeIn: 0.3 }); } if (Math.random() < 0.15) this.parts.one({ x: p.x + rnd(-r, r) * 0.6, y: p.y + 9.6, z: p.z + rnd(-r, r) * 0.6, life: 0.15, size: 5, color: 0xd8d0ff, glow: true, cell: 0, alpha: 0.6 }); return f.t < life; });
  }
  /** Red warning circle where the meteors will land. */
  warn(at, el, r, life) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), mat(PAL[el].deep, 0.8, cellTexture(7))); m.rotation.x = -Math.PI / 2; m.position.set(at.x, this.y(at.x, at.z) + 0.1, at.z); m.renderOrder = 9;
    this.add(m, (f) => { const k = f.t / life; m.rotation.z -= f.dt; m.material.opacity = 0.75 * Math.sin(Math.min(1, k) * Math.PI); return k < 1; });
  }
  /** A flaming rock that falls from the sky with a long tail. */
  meteor(at, land) {
    const y = this.y(at.x, at.z), C = PAL.fire;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshStandardMaterial({ color: 0x4a2414, emissive: 0xff5a14, emissiveIntensity: 1.4, roughness: 0.85, flatShading: true }));
    const s = new THREE.Vector3(at.x - 5, y + 16, at.z - 3); rock.position.copy(s);
    this.add(rock, (f) => { const k = Math.min(1, f.t / 0.55); rock.position.lerpVectors(s, new THREE.Vector3(at.x, y + 0.4, at.z), k * k); rock.rotation.x += 0.25; rock.rotation.z += 0.18;
      const P = rock.position; this.parts.one({ x: P.x, y: P.y, z: P.z, life: 0.35, size: 2.2, size1: 0.6, color: C.core, color1: C.mid, glow: true, cell: 0 }); for (let i = 0; i < 3; i++) this.parts.one({ x: P.x + rnd(-0.3, 0.3), y: P.y + rnd(-0.3, 0.3), z: P.z + rnd(-0.3, 0.3), life: rnd(0.4, 0.8), size: rnd(0.6, 1.1), size1: 0.2, color: C.mid, color1: C.deep, glow: true, cell: 2 }); this.parts.one({ x: P.x, y: P.y, z: P.z, life: 1.2, size: 0.8, size1: 2, color: C.smoke, alpha: 0.4, cell: 2 });
      if (k >= 1) { land(); this.scorch(at); return false; } return true; });
  }
  scorch(at) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: 0x1a0c06, transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(at.x, this.y(at.x, at.z) + 0.05, at.z); this.add(m, (f) => { m.material.opacity = 0.55 * (1 - f.t / 3); return f.t < 3; }); }
  /** The blizzard: frost ground circle, snow falling and swirling round the hero, ice spikes now and then. */
  blizzard(at, r, life, tick) {
    const pl = this.api.player, C = PAL.ice, disc = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2), mat(C.mid, 0.5, cellTexture(7))); disc.rotation.x = -Math.PI / 2; disc.renderOrder = 9; let acc = 0, sp = 0;
    this.add(disc, (f) => { const p = pl.pos; disc.position.set(p.x, this.y(p.x, p.z) + 0.1, p.z); disc.rotation.z += f.dt * 0.6; disc.material.opacity = 0.5 * Math.min(1, (life - f.t) * 2, f.t * 4);
      for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * r; this.parts.one({ x: p.x + Math.cos(a) * rr, y: p.y + rnd(3, 5), z: p.z + Math.sin(a) * rr, vx: rnd(-1, 1) + Math.cos(a + 1.6) * 2, vy: -rnd(3, 5), vz: rnd(-1, 1) + Math.sin(a + 1.6) * 2, life: 1.0, size: rnd(0.12, 0.25), color: 0xffffff, cell: i % 2 ? 1 : 3, spin: 5 }); }
      if (Math.random() < 0.5) { const a = Math.random() * 6.28; this.parts.one({ x: p.x, y: p.y + 0.6, z: p.z, life: 1.1, size: 1.3, size1: 2.4, color: C.smoke, alpha: 0.35, cell: 2, orbit: { x: p.x, z: p.z, a, w: 2.2, r: 1, grow: r * 0.8 } }); }
      sp += f.dt; if (sp > 0.35) { sp = 0; const a = Math.random() * 6.28, rr = rnd(1.5, r); this.spike(p.x + Math.cos(a) * rr, p.z + Math.sin(a) * rr); }
      acc += f.dt; if (acc >= 0.5) { acc = 0; tick(); } return f.t < life; });
  }
  /** Whirlwind: leaves and streaks spinning round the hero. */
  cyclone(at, r, life) {
    const C = PAL.wind, pl = this.api.player;
    for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28; this.parts.one({ x: at.x, y: at.y + rnd(0.3, 1.6), z: at.z, life: life * rnd(0.7, 1), size: rnd(0.25, 0.4), color: i % 3 ? C.mid : 0xc8a050, color1: C.deep, cell: 4, spin: 14, orbit: { x: pl.pos.x, z: pl.pos.z, a, w: 11, r: 0.6, grow: r * 2.4 } }); }
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; this.parts.one({ x: at.x, y: at.y + rnd(0.5, 1.3), z: at.z, life: 0.35, size: 1.2, color: C.core, alpha: 0.7, cell: 6, rot: -a, orbit: { x: pl.pos.x, z: pl.pos.z, a, w: 12, r: 1, grow: r * 4 } }); }
  }
  /** Tornado: a twisting column of wind that walks forward and pulls monsters in. */
  twister(from, dir, tick) {
    const C = PAL.wind, at = from.clone(); let acc = 0;
    this.add(null, (f) => { const nx = at.x + dir.x * 4.5 * f.dt, nz = at.z + dir.z * 4.5 * f.dt; if (L.walkable(nx, nz, 0.5)) { at.x = nx; at.z = nz; } const y = this.y(at.x, at.z);
      for (let i = 0; i < 10; i++) { const h = Math.random() * 5, a = Math.random() * 6.28; this.parts.one({ x: at.x, y: y + h, z: at.z, vy: 1.5, life: rnd(0.5, 0.8), size: 0.7 + h * 0.3, size1: 1.0 + h * 0.35, color: i % 3 ? C.mid : C.deep, color1: C.smoke, alpha: 0.65, cell: i % 2 ? 2 : 6, rot: a, orbit: { x: at.x, z: at.z, a, w: 9, r: 0.3 + h * 0.32, grow: 0.3 } }); }
      for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28; this.parts.one({ x: at.x, y: y + rnd(0.2, 3), z: at.z, vy: 2, life: 0.8, size: 0.3, color: 0x8a6a3a, cell: 4, spin: 15, orbit: { x: at.x, z: at.z, a, w: 7, r: 1.2, grow: 0.5 } }); }
      acc += f.dt; if (acc >= 0.5) { acc = 0; tick(at); } return f.t < 4; });
  }
  update(dt) {
    for (const k in this.cool) this.cool[k] = Math.max(0, this.cool[k] - dt);
    const cam = this.api.camera; if (cam) this.parts.setCamera(cam, (this.api.canvas && this.api.canvas.height) || innerHeight);
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t += dt; f.dt = dt; let keep = false;
      try { keep = f.update(f); } catch (e) { console.warn('spell effect', e); }
      if (!keep) { if (f.o) { f.o.removeFromParent(); f.o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); } this.fx.splice(i, 1); }
    }
    this.parts.update(dt);
  }
  /** Ends every effect at once (changing region). */
  clear() { this.fx.splice(0).forEach((f) => { if (f.o) f.o.removeFromParent(); }); this.parts.clear(); }
}
