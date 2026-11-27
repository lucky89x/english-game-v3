// Casting the magic skills (20/11; one element and new effects 21/11; every effect redrawn 27/11, turn 72).
// Keys 1-4 (or the hotbar buttons) cast the spell in that slot; each spell costs mana and has its own cooldown. Damage goes
// through Wild.damage (element ring, combos, shields). Aiming: every spell goes for the locked target (the red ring), else the
// nearest monster in front, which then becomes the target. Single-target spells fly after it; melee spells lunge to it; area
// spells land on it.
// The pictures (27/11: "the skill effects are ugly and weak"): every spell is now put together from the pieces of game/vfx.js
// — a magic circle of the element under the caster, crescents and walls of scrolling fire/frost/wind that are eaten away
// instead of fading, orbs with a bright rim, ribbons behind the missiles, crystals that pop out of the ground, bolts that
// re-jag while they last, cracks and scorch marks — plus the small particles of game/fx.js, a flash of light and a shake of
// the camera on the heavy hits. What a spell DOES (who is hit, when, how hard) is unchanged.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import * as SK from '../core/skills.js';
import { playerAtk, inArc } from '../core/rules.js';
import { Particles, PAL } from './fx.js';
import * as V from './vfx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
/** The colours of the big shapes: like PAL, but wind and ice keep more of their own colour (their palettes for the small particles end in white). */
const SHAPE = { fire: PAL.fire, ice: { core: 0xf4fdff, mid: 0x8fe0ff, deep: 0x2f8fd8 }, wind: { core: 0xd6ffe2, mid: 0x5fe08c, deep: 0x1c9a56 }, thunder: { core: 0xfffbe0, mid: 0xffe84a, deep: 0x8a5cf0 } };

export class Spells {
  /** api: { scene, wild, player, profile(), sfx(name), ui, onChange(), camera? } */
  constructor(api) { this.api = api; this.fx = []; this.cool = {}; this.last = null; this.root = new THREE.Group(); api.scene.add(this.root); this.parts = new Particles(api.scene); this.slow = 1; }
  /** (27/11) A free cast for looking at an effect (the admin's review panel, tests/fx_look.mjs): no mana, no cooldown, any element. */
  demo(id) { return this.cast(id, true); }
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
  cast(id, free = false) {
    const { wild, player, sfx, ui } = this.api, p = this.api.profile(), n = SK.NODES[id];
    if (!p || !n || (!free && !SK.rank(p, id))) return 'unknown';
    if (!wild.root.visible) { ui.toast('Ở đây không dùng phép được'); return 'place'; }
    if (!free && this.wait(id) > 0) return 'cool';
    if (!free && !SK.spend(p, SK.spellCost(id))) { ui.toast('Hết mana (thanh xanh). Uống bình mana (phím 5–8) hoặc chờ một chút!'); sfx('wrong'); return 'mp'; }
    if (!free) this.cool[id] = SK.spellCool(p, id); sfx('spell_' + n.el); this.last = { id, at: Date.now() };
    const el = n.el, dmg = SK.spellDamage(p, id, playerAtk(p)), C = PAL[el], targets = () => wild.targets(p);
    const range = n.type === 'melee' ? 7 : n.type === 'single' ? 18 : 16, tgt = this.aim(range);
    if (tgt) player.yaw = Math.atan2(tgt.x - player.pos.x, tgt.z - player.pos.z);
    if (n.type === 'melee' && tgt) this.lunge(tgt, wild.reach(tgt) - 0.6, el);
    player.emote('Interact'); if (player.swing) player.swing();
    const here = player.pos.clone(), yaw = player.yaw, fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const hit = (m, o = {}) => wild.damage(m, dmg * (o.k || 1), el, { spell: true, ...o });
    const near = (at, r) => targets().filter((m) => Math.hypot(m.x - at.x, m.z - at.z) < r + m.def.size * 0.3);
    this.runes(here, el, n.type === 'ultimate' ? 4.5 : n.type === 'aoe' ? 2.6 : 1.7);
    switch (id) {
      // -------------------------------------------------------------- melee: a crescent slash with the element's particles
      case 'flame_slash': case 'frost_strike': case 'thunder_fist': {
        const reach = id === 'thunder_fist' ? 2.8 : 3.0;
        for (const m of targets()) if (inArc(here.x, here.z, yaw, m.x, m.z, reach + m.def.size * 0.3, 0.15)) { hit(m, { burn: id === 'flame_slash' ? 3 : 0, slow: id === 'frost_strike' ? 3 : 0, stun: id === 'thunder_fist' ? 0.8 : 0, knock: 0.5 }); this.impact(m, el, 0.8); }
        this.slash(here, yaw, el, reach, id === 'thunder_fist' ? { sweep: Math.PI * 0.8, tilt: 0.05, life: 0.3 } : id === 'frost_strike' ? { tilt: 0.22, sweep: Math.PI * 1.35 } : {}); this.shake(0.12);
        if (id === 'flame_slash') this.later(0.07, () => this.slash(here, yaw, el, reach * 0.8, { tilt: -0.25, life: 0.32, h: 0.75 }));
        if (id === 'frost_strike') for (let k = 0; k < 5; k++) { const a = yaw + (k - 2) * 0.32, d = reach * rnd(0.7, 1.05); this.later(0.05 + k * 0.03, () => this.spike(here.x + Math.sin(a) * d, here.z + Math.cos(a) * d, rnd(0.8, 1.3))); }
        if (id === 'thunder_fist') { const at = here.clone().addScaledVector(fwd, 1.6); this.sparks(at, 1.0, 30); this.shock(at, el, 2.8, 0.35); for (let k = 0; k < 4; k++) { const a = yaw + (k - 1.5) * 0.5, gy = this.y(at.x, at.z) + 0.2; this.bolt(new THREE.Vector3(here.x, gy + 0.7, here.z), new THREE.Vector3(here.x + Math.sin(a) * 3.6, gy, here.z + Math.cos(a) * 3.6), { raw: true, w: 0.4, life: 0.26, branches: 1 }); } this.flash(new THREE.Vector3(at.x, at.y + 1, at.z), el, 0.9); }
        break;
      }
      case 'whirlwind': for (const m of near(here, 3.2)) { hit(m, { knock: 2.4 }); this.impact(m, el, 0.7); } this.cyclone(here, 3.2, 0.7); this.shock(here, el, 3.6, 0.5); this.shake(0.12); break;
      // -------------------------------------------------------------- single target: flies after the target
      case 'fireball': this.missile(here, fwd, tgt, el, { speed: 15, size: 0.5, onHit: (at, m) => { if (m) hit(m, { burn: 3 }); for (const o of near(at, 1.6)) if (o !== m) hit(o, { k: 0.4, burn: 2 }); this.explode(at, el, 1.6); } }); break;
      case 'ice_spear': this.missile(here, fwd, tgt, el, { speed: 20, size: 0.32, spear: true, onHit: (at, m) => { if (m) hit(m, { slow: 3 }); this.explode(at, el, 1.2); } }); break;
      case 'wind_blade': this.missile(here, fwd, tgt, el, { speed: 26, size: 0.38, blade: true, onHit: (at, m) => { if (m) hit(m, { knock: 0.8 }); this.explode(at, el, 1.2); } }); break;
      case 'lightning': {
        const first = tgt; if (!first) { this.bolt(here, here.clone().addScaledVector(fwd, 9)); this.shake(0.1); break; }
        hit(first); const at = new THREE.Vector3(first.x, 0, first.z); this.bolt(here, at); this.impact(first, el, 1.2); this.shock(at, el, 1.8, 0.35); this.scorch(at, 0.8, 2); this.shake(0.16);
        if (SK.rank(p, id) >= 5) { const next = targets().filter((m) => m !== first && Math.hypot(m.x - first.x, m.z - first.z) < 6)[0]; if (next) { hit(next, { k: 0.7 }); this.later(0.08, () => this.bolt(at, new THREE.Vector3(next.x, 0, next.z), { chain: true })); } }
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
        this.warn(here, el, 9, 0.9); this.wall(here, el, 8.6, 3.2, 1.5, { turn: 0.5, scroll: [0.4, -2.2], tile: [5, 0.7], edge: 0.18, sharp: 0.8, hold: 0.7, rise: 1.6, turns: 6, base: 0.4 }); this.wall(here, el, 4.2, 1.8, 1.3, { turn: -0.8, scroll: [-0.5, -2.6], tile: [4, 0.7], edge: 0.2, sharp: 0.9, hold: 0.7, rise: 1.4, turns: 4, alpha: 0.8, base: 0.42 });
        this.later(0.9, () => { for (const m of near(here, 9)) { hit(m, { burn: 5, knock: 2.5 }); this.impact(m, el, 1.3); } this.explode(here, el, 9); this.pillar(here, el, 2.6, 11, 1.2); this.later(0.1, () => this.pillar(here, el, 1.3, 14, 0.9)); sfx('boom'); });
        for (let k = 0; k < 6; k++) this.later(0.95 + k * 0.18, () => { const at = here.clone().add(new THREE.Vector3(rnd(-6, 6), 0, rnd(-6, 6))); for (const m of near(at, 2.6)) hit(m, { k: 0.3, burn: 2 }); this.explode(at, el, 3); });
        break;
      }
      case 'absolute_zero': {
        this.runes(here, el, 9, 1.6, true); this.shock(here, el, 10, 0.7); this.wall(here, el, 6, 2.6, 0.6, { turn: 7, scroll: [3, -0.4], tile: [3, 1], edge: 0.5, sharp: 0.8, alpha: 0.6, hold: 0.3 });
        for (let k = 0; k < 40; k++) { const a = rnd(0, 6.28), r0 = rnd(6, 10); this.parts.one({ x: here.x + Math.cos(a) * r0, y: here.y + rnd(0.3, 2.5), z: here.z + Math.sin(a) * r0, vx: -Math.cos(a) * r0 * 2, vz: -Math.sin(a) * r0 * 2, life: 0.45, size: rnd(0.2, 0.4), size1: 0.05, color: C.core, color1: C.mid, glow: true, cell: k % 2 ? 0 : 3 }); }
        this.later(0.45, () => { for (const m of near(here, 9)) { hit(m, { stun: 2.5, slow: 4, mark: true }); this.impact(m, el, 1.2); } this.dome(new THREE.Vector3(here.x, here.y + 0.3, here.z), el, 9, 0.9, { rim: 2.2, fill: 0.2, bulge: 0.5 }); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 + 0.3; this.spike(here.x + Math.cos(a) * 3.4, here.z + Math.sin(a) * 3.4, rnd(1.8, 2.6)); } for (let k = 0; k < 18; k++) { const a = rnd(0, 6.28), d = rnd(5, 8.5); this.later(0.04 + k * 0.012, () => this.spike(here.x + Math.cos(a) * d, here.z + Math.sin(a) * d, rnd(1.0, 1.7))); } this.explode(here, el, 7); sfx('boom'); });
        break;
      }
      case 'storm_eye': {
        const pull = (at) => { for (const m of near(at, 8)) { const d = Math.hypot(m.x - at.x, m.z - at.z); if (!m.boss && d > 0.8) { const nx = m.x + (at.x - m.x) / d * 0.7, nz = m.z + (at.z - m.z) / d * 0.7; if (L.walkable(nx, nz, 0.45)) { m.x = nx; m.z = nz; } } hit(m, { k: 0.22 }); } };
        const still = new THREE.Vector3(0, 0, 0), a = here.clone(), b = here.clone().add(new THREE.Vector3(3, 0, 2));
        this.runes(here, el, 8, 4, true); this.twister(a, still, pull, 1.5); this.twister(b, still, () => {}, 1.1); this.cyclone(here, 6, 1.2); this.shock(here, el, 8, 0.6); this.wall(here, el, 7.5, 2.2, 4, { turn: 3.5, scroll: [2.2, -0.3], tile: [1, 5], edge: 0.4, sharp: 0.8, alpha: 0.55, hold: 0.88, turns: 3, base: 0.5 }); this.shake(0.3);
        break;
      }
      case 'judgement': {
        this.cloud(here, 14, 3.4); this.runes(here, el, 10, 3.6, true);
        this.later(3.3, () => { this.pillar(player.pos, el, 2.8, 16, 0.9); this.shock(player.pos, el, 12, 0.8); this.flash(new THREE.Vector3(player.pos.x, player.pos.y + 1.5, player.pos.z), el, 2.4); this.shake(0.7); });
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
  /** Plays an object built from the vfx materials for `life` seconds: their clocks run, step(k, f) shapes it (k = 0..1 of the life). */
  play(o, mats, life, step) {
    o.traverse((c) => { if (c.isMesh) { c.frustumCulled = false; if (!c.renderOrder) c.renderOrder = 9; } });
    this.add(o, (f) => { for (const m of mats) if (m.uniforms && m.uniforms.uTime) m.uniforms.uTime.value = f.t; if (step) step(Math.min(1, f.t / life), f); return f.t / life < 1; });      // a step may end its effect at once by setting f.t past the life
    return o;
  }
  /** A burst of light where something big happens: a white-hot dot, a four-point star, and the scene lit for a moment. */
  flash(at, el, power = 1) {
    const C = PAL[el]; power = Math.min(1.5, power);
    this.parts.one({ x: at.x, y: at.y, z: at.z, life: 0.16, size: 2.6 * power, size1: 4.2 * power, color: C.core, color1: C.mid, glow: true, cell: 0, alpha: 0.9, fadeIn: 0.01 });
    this.parts.one({ x: at.x, y: at.y, z: at.z, life: 0.22, size: 3.4 * power, size1: 5.5 * power, color: 0xffffff, color1: C.core, glow: true, cell: 1, alpha: 0.9, fadeIn: 0.01, rot: rnd(0, 1.5) });
    if (this.api.flash) this.api.flash(at, C.mid, power);
  }
  shake(a) { if (this.api.shake) this.api.shake(a); }
  /** Melee: the hero dashes up to the target (stops at `stop` metres from it), leaving a streak of the element. */
  lunge(m, stop, el = 'fire') {
    const pl = this.api.player, dx = m.x - pl.pos.x, dz = m.z - pl.pos.z, d = Math.hypot(dx, dz); if (d <= stop + 0.3) return;
    let x = pl.pos.x, z = pl.pos.z; const ux = dx / d, uz = dz / d, x0 = x, z0 = z;
    for (let s = 0; s < d - stop; s += 0.25) { const nx = x + ux * 0.25, nz = z + uz * 0.25; if (!L.canStep(x, z, nx, nz)) break; x = nx; z = nz; }
    const C = PAL[el]; for (let k = 0; k < 8; k++) { const t = k / 8; this.parts.one({ x: x0 + (x - x0) * t, y: pl.pos.y + 0.6, z: z0 + (z - z0) * t, life: 0.3, size: 0.8, size1: 0.15, color: C.mid, color1: C.deep, alpha: 0.45, cell: 2 }); }
    const yaw = pl.yaw; pl.place(x, z); pl.yaw = yaw;
  }
  /** The magic circle of the element under the caster: drawn round in a blink, turning, then eaten away. */
  runes(at, el, r, life = 0.95, slow = false) {
    const C = PAL[el], y = this.y(at.x, at.z) + 0.07;
    const glow = V.groundMat(C, { kind: 'disc', radius: 0.95, alpha: 0.12, spin: -0.12, tile: [2, 1.5], soft: 0.3, add: true, boost: 1 }), ring = V.groundMat({ core: 0xffffff, mid: C.core, deep: C.mid }, { kind: 'map', map: V.circleTex(el), spin: slow ? 0.35 : 0.9, soft: 0.25, add: true, boost: r > 5 ? 1.15 : 1.5 }), ga = 0.12 * Math.min(1, 2.5 / r);
    const g = new THREE.Group(), a = new THREE.Mesh(V.groundGeo(r * 1.12), glow), b = new THREE.Mesh(V.groundGeo(r), ring); b.position.y = 0.02; g.add(a, b); g.position.set(at.x, y, at.z);
    this.play(g, [glow, ring], life, (k) => { const end = Math.max(0, (k - 0.6) / 0.4); ring.uniforms.uReveal.value = Math.min(1, k * (slow ? 2.2 : 5)); ring.uniforms.uErode.value = end * 1.5; glow.uniforms.uErode.value = 0.05 + end * 1.3; glow.uniforms.uAlpha.value = ga * Math.min(1, k * 6); g.scale.setScalar(0.6 + 0.4 * V.overshoot(k * 3.2)); });
    for (let i = 0; i < 16; i++) { const an = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * r * 0.9; this.parts.one({ x: at.x + Math.cos(an) * rr, y: y + 0.05, z: at.z + Math.sin(an) * rr, vy: rnd(1.4, 3.2), life: rnd(0.5, 0.9), size: rnd(0.14, 0.3), size1: 0.04, color: C.core, color1: C.mid, glow: true, cell: i % 3 ? 0 : 1, fadeIn: 0.1 }); }
  }
  /** A crescent swept in front of the hero: a band of the element with a white-hot leading edge, eaten away from its tail. */
  slash(at, yaw, el, r, o = {}) {
    const C = PAL[el], S = SHAPE[el], life = o.life || 0.4, sweep = o.sweep || Math.PI * 1.2, a0 = Math.PI / 2 - sweep / 2;
    const body = V.bandMat(S, { tile: [2.2, 1], scroll: [-2.4, 0.2], edge: 0.74, sharp: 1.25, taper: [0.5, 0.05], soft: el === 'ice' ? 0.1 : 0.2, boost: 1.08 });
    const edge = V.bandMat({ core: 0xffffff, mid: C.core, deep: C.mid }, { tile: [3, 1], scroll: [-3.5, 0], edge: 0.6, sharp: 2.4, taper: [0.35, 0.04], soft: 0.12, add: true, boost: 1.25 });
    const pivot = new THREE.Group(), tilt = new THREE.Group(), spin = new THREE.Group(); pivot.position.set(at.x, at.y + (o.h ?? 0.95), at.z); pivot.rotation.y = yaw; tilt.rotation.z = o.tilt ?? 0.3; pivot.add(tilt); tilt.add(spin);
    spin.add(new THREE.Mesh(V.arcGeo(r * 0.42, r * 1.04, a0, sweep, 56, r * 0.06), body), new THREE.Mesh(V.arcGeo(r * 0.84, r * 1.02, a0, sweep, 56, r * 0.06), edge));
    this.play(pivot, [body, edge], life, (k) => { spin.rotation.y = 1.15 - 1.7 * V.easeOut(k * 2.4); const e = Math.max(0, (k - 0.22) / 0.78); body.uniforms.uErode.value = e * 1.5; edge.uniforms.uErode.value = Math.max(0, (k - 0.12) / 0.5) * 1.6; spin.scale.setScalar(0.82 + 0.3 * V.easeOut(k * 2)); });
    const y0 = at.y + 0.95;
    for (let i = 0; i < 26; i++) {
      const a = yaw + (i / 25 - 0.5) * sweep * 0.8, rr = r * rnd(0.6, 1.0), x = at.x + Math.sin(a) * rr, z = at.z + Math.cos(a) * rr, out = rnd(1, 3.5);
      if (el === 'fire') this.parts.one({ x, y: y0, z, vx: Math.sin(a) * out, vy: rnd(1, 3.4), vz: Math.cos(a) * out, life: rnd(0.4, 0.75), size: rnd(0.45, 0.85), size1: 0.12, color: i % 2 ? C.mid : C.core, color1: C.deep, glow: i % 3 === 0, alpha: 0.9, cell: 2, drag: 2 });
      else if (el === 'ice') this.parts.one({ x, y: y0, z, vx: Math.sin(a) * out * 1.6, vy: rnd(0, 2.4), vz: Math.cos(a) * out * 1.6, life: rnd(0.5, 0.85), size: rnd(0.22, 0.42), color: C.core, color1: C.mid, cell: 3, grav: 7, spin: rnd(-9, 9) });
      else if (el === 'wind') this.parts.one({ x, y: y0, z, vx: Math.cos(a) * 4.5, vy: rnd(0, 1.6), vz: -Math.sin(a) * 4.5, life: rnd(0.4, 0.75), size: rnd(0.22, 0.4), color: C.mid, color1: C.deep, cell: 4, spin: rnd(-10, 10), drag: 1 });
      else this.parts.one({ x, y: y0, z, vx: Math.sin(a) * out * 2.2, vy: rnd(-1, 3), vz: Math.cos(a) * out * 2.2, life: rnd(0.15, 0.38), size: rnd(0.22, 0.45), color: C.core, color1: C.mid, glow: true, cell: 1 });
    }
  }
  /** A wave running out over the ground: a torn ring that grows fast and is eaten away. */
  shock(at, el, r, life = 0.45) {
    const C = SHAPE[el], mat = V.groundMat(C, { kind: 'ring', tile: [5, 1], scroll: [0.3, 0.6], soft: 0.22, boost: 1.1, heat: 0.9 }), m = new THREE.Mesh(V.groundGeo(r), mat); m.position.set(at.x, this.y(at.x, at.z) + 0.11, at.z);
    this.play(m, [mat], life, (k) => { const u = mat.uniforms; u.uRadius.value = 0.1 + 0.82 * V.easeOut(k * 1.3); u.uWidth.value = 0.24 - 0.12 * k; u.uErode.value = Math.max(0, (k - 0.3) / 0.7) * 1.5; });
  }
  /** An upright wall of the element round a point (a ring of flames, a spinning wall of wind or snow). */
  wall(at, el, r, h, life, o = {}) {
    const C = SHAPE[el], mat = V.bandMat(C, { tile: o.tile || [4, 1], scroll: o.scroll || [0.5, -1.6], edge: o.edge ?? 0.22, sharp: o.sharp ?? 0.9, taper: [0, 0], soft: 0.25, alpha: o.alpha ?? 0.9, boost: 1.05, heat: o.heat ?? 0.72 }), floor = o.base ?? 0.32;
    const m = new THREE.Mesh(V.wallGeo(r, r * (o.flare ?? 1.06), 1, 56, o.turns || 3), mat); m.position.set(at.x, this.y(at.x, at.z) + 0.05, at.z);
    this.play(m, [mat], life, (k, f) => { m.scale.y = h * (0.15 + 0.85 * V.easeOut(k * (o.rise ?? 2.5))); m.rotation.y += f.dt * (o.turn ?? 0.6); mat.uniforms.uErode.value = floor + Math.max(0, (k - (o.hold ?? 0.6)) / (1 - (o.hold ?? 0.6))) * (1.6 - floor); if (o.follow) m.position.set(o.follow.x, this.y(o.follow.x, o.follow.z) + 0.05, o.follow.z); });
    return m;
  }
  /** A pillar shooting up from the ground (the heart of an ultimate, a strike from the sky). */
  pillar(at, el, r, h, life) {
    const C = SHAPE[el], y = this.y(at.x, at.z);
    const outer = V.bandMat(C, { tile: [6, 1], scroll: [0.25, -3.2], edge: 0.2, sharp: 0.8, taper: [0, 0], soft: 0.28, boost: 1.1, heat: 0.7 }), inner = V.bandMat({ core: 0xffffff, mid: C.core, deep: C.mid }, { tile: [4, 1], scroll: [0, -5], edge: 0.15, sharp: 0.7, taper: [0, 0], soft: 0.3, add: true, boost: 1.1, alpha: 0.8 });
    const g = new THREE.Group(); g.add(new THREE.Mesh(V.wallGeo(r, r * 0.75, 1, 40, 2), outer), new THREE.Mesh(V.wallGeo(r * 0.45, r * 0.3, 1, 24, 1), inner)); g.position.set(at.x, y, at.z);
    this.play(g, [outer, inner], life, (k) => { g.scale.set(1 + 0.25 * k, h * V.easeOut(k * 4), 1 + 0.25 * k); const e = Math.max(0, (k - 0.35) / 0.65); outer.uniforms.uErode.value = 0.3 + e * 1.3; inner.uniforms.uErode.value = 0.25 + Math.max(0, (k - 0.2) / 0.6) * 1.4; });
  }
  /** A ball of the element blowing up: it grows fast, bulges with the noise and is eaten away from the inside. */
  dome(at, el, r, life = 0.5, o = {}) {
    const C = SHAPE[el], mat = V.orbMat(C, { heat: 0.9, tile: [3, 2], scroll: [0.2, 1.1], rim: o.rim ?? 1.5, bulge: o.bulge ?? 0.3, fill: o.fill ?? (r > 4 ? 0.28 : 0.6), soft: 0.2, boost: 1.1, side: THREE.DoubleSide }), m = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 18), mat); m.position.copy(at);
    this.play(m, [mat], life, (k) => { m.scale.setScalar(r * (0.25 + 0.75 * V.easeOut(k * 1.8))); mat.uniforms.uErode.value = (r > 4 ? 0.3 : 0.08) + Math.max(0, (k - 0.12) / 0.88) * 1.7; });
  }
  /** Where a monster gets hit: a flash and particles of the element. */
  impact(m, el, k = 1) { const y = this.y(m.x, m.z) + 0.6 * m.def.size * (m.def.fit || 1); this.pop(new THREE.Vector3(m.x, y, m.z), el, k); }
  pop(at, el, k = 1) {
    const C = PAL[el];
    this.parts.one({ x: at.x, y: at.y, z: at.z, life: 0.2, size: 1.5 * k, size1: 2.6 * k, color: C.core, color1: C.mid, glow: true, cell: 0, alpha: 0.9, fadeIn: 0.01 });
    this.parts.one({ x: at.x, y: at.y, z: at.z, life: 0.2, size: 2.2 * k, size1: 3.6 * k, color: 0xffffff, color1: C.core, glow: true, cell: 1, alpha: 0.85, fadeIn: 0.01, rot: rnd(0, 1.5) });
    this.dome(at, el, 0.75 * k, 0.26, { bulge: 0.18, fill: 0.5 });
    if (el === 'fire') { this.parts.burst(at.x, at.y, at.z, 14 * k | 0, { speed: 4, life: 0.5, size: 0.7, size1: 0.12, color: C.mid, color1: C.deep, alpha: 0.95, cell: 2, drag: 3, up: 1 }); this.parts.burst(at.x, at.y, at.z, 10 * k | 0, { speed: 7, life: 0.45, size: 0.2, size1: 0.04, color: C.core, color1: C.mid, glow: true, cell: 0, grav: 7 }); }
    else if (el === 'ice') { this.parts.burst(at.x, at.y, at.z, 14 * k | 0, { speed: 5.5, life: 0.6, size: 0.35, color: C.core, color1: C.mid, cell: 3, grav: 9, spin: 8 }); this.parts.burst(at.x, at.y, at.z, 6, { speed: 1.2, life: 0.8, size: 0.7, size1: 1.4, color: C.smoke, alpha: 0.4, cell: 2, drag: 2 }); }
    else if (el === 'wind') { this.parts.burst(at.x, at.y, at.z, 12 * k | 0, { speed: 5, life: 0.5, size: 0.3, color: C.mid, color1: C.deep, cell: 4, spin: 10, drag: 2, flat: true }); this.parts.burst(at.x, at.y, at.z, 8, { speed: 6, life: 0.3, size: 0.6, color: C.core, alpha: 0.7, cell: 6, drag: 2, flat: true }); }
    else this.sparks(at, k, 20);
  }
  sparks(at, k, n) { const C = PAL.thunder; this.parts.burst(at.x, at.y, at.z, n * k | 0, { speed: 8, life: 0.32, size: 0.3, size1: 0.05, color: C.core, color1: C.mid, glow: true, cell: 1, grav: 6 }); }
  /** A bigger hit: a ball of the element, a wave over the ground, what the element leaves behind, light and a shake. */
  explode(at, el, r) {
    const gy = this.y(at.x, at.z), p = new THREE.Vector3(at.x, (at.y > 0.01 ? at.y : gy + 0.8), at.z), C = PAL[el], big = r >= 5;
    this.pop(p, el, Math.min(2.2, 1 + r * 0.25)); this.dome(new THREE.Vector3(at.x, gy + (big ? 0.3 : 0.7), at.z), el, r * (big ? 0.95 : 0.85), big ? 0.75 : 0.5, { bulge: 0.2 + r * 0.05 });
    this.shock(at, el, r * 1.35, big ? 0.75 : 0.5); if (big) this.later(0.12, () => this.shock(at, el, r * 1.1, 0.6));
    this.flash(p, el, Math.min(2.4, 0.7 + r * 0.22)); this.shake(Math.min(0.9, 0.08 + r * 0.075));
    if (el === 'fire') { this.scorch(at, Math.min(3.2, r * 0.75)); for (let i = 0; i < 6 + r * 2; i++) this.parts.one({ x: at.x + rnd(-r, r) * 0.5, y: gy + 0.2, z: at.z + rnd(-r, r) * 0.5, vy: rnd(1, 3.2), life: rnd(0.7, 1.3), size: rnd(0.7, 1.2), size1: rnd(1.6, 2.4), color: C.mid, color1: C.smoke, alpha: 0.7, cell: 2, drag: 1, fadeIn: 0.1 }); }
    if (el === 'ice') for (let i = 0; i < Math.min(14, 4 + r * 1.5); i++) this.spike(at.x + rnd(-r, r) * 0.6, at.z + rnd(-r, r) * 0.6, rnd(0.7, 1.3));
    if (el === 'wind') for (let i = 0; i < 3; i++) this.wall(at, el, r * (0.35 + i * 0.2), 1.2 + i * 0.5, 0.5, { turn: 9 - i * 2, scroll: [2.5, -0.6], tile: [2, 1], edge: 0.5, sharp: 0.8, alpha: 0.7, hold: 0.3 });
    if (el === 'thunder') for (let i = 0; i < 4; i++) { const a = rnd(0, 6.28), e = new THREE.Vector3(at.x + Math.cos(a) * r * 1.1, gy + 0.15, at.z + Math.sin(a) * r * 1.1); this.bolt(new THREE.Vector3(at.x, gy + 0.2, at.z), e, { w: 0.45, life: 0.22, branches: 0, raw: true }); }
  }
  /** An ice crystal popping out of the ground (with a small one beside it), standing a moment, then sinking away. */
  spike(x, z, k = 1) {
    const C = PAL.ice, mat = V.crystalMat({ core: C.core, mid: C.mid, deep: C.deep }), g = new THREE.Group(), y = this.y(x, z), h = rnd(0.9, 1.5) * k;
    const a = new THREE.Mesh(V.crystalGeo(0.2 * k, h), mat); a.rotation.set(rnd(-0.3, 0.3), rnd(0, 6), rnd(-0.3, 0.3)); const b = new THREE.Mesh(V.crystalGeo(0.13 * k, h * 0.55), mat); b.position.set(rnd(-0.25, 0.25), 0, rnd(-0.25, 0.25)); b.rotation.set(rnd(-0.6, 0.6), rnd(0, 6), rnd(-0.6, 0.6)); g.add(a, b); g.position.set(x, y, z); a.renderOrder = b.renderOrder = 8;
    this.play(g, [], 1.4, (kk) => { const up = V.overshoot(kk * 7); g.scale.set(1, Math.max(0.01, up), 1); if (kk > 0.72) { const d = (kk - 0.72) / 0.28; g.position.y = y - d * h * 1.1; mat.uniforms.uAlpha.value = 0.95 * (1 - d); } });
    this.parts.burst(x, y + 0.2, z, 5, { speed: 2.5, life: 0.5, size: 0.22, color: C.core, color1: C.mid, cell: 3, grav: 6, spin: 8, up: 1.5 });
  }
  /** A single-target spell: a missile with a tail that steers after the monster `m` (straight on when there is none). */
  missile(from, dir, m, el, o) {
    const C = PAL[el], g = new THREE.Group(), pos = from.clone(); pos.y += 1.0; g.position.copy(pos); const mats = []; let core = null;
    if (o.spear) { const cm = V.crystalMat({ core: C.core, mid: C.mid, deep: C.deep }); core = new THREE.Mesh(V.crystalGeo(o.size * 0.5, o.size * 5.2), cm); core.geometry.rotateX(Math.PI / 2); core.geometry.translate(0, 0, -o.size * 2.2); const halo = V.orbMat(C, { rim: 1.2, fill: 0.15, alpha: 0.4, tile: [2, 2], add: true, boost: 1 }); mats.push(halo); const h = new THREE.Mesh(new THREE.SphereGeometry(o.size * 1.5, 16, 10), halo); h.scale.z = 2.4; g.add(h); }
    else if (o.blade) { const bm = V.bandMat(SHAPE[el], { tile: [2, 1], scroll: [-4, 0], edge: 0.7, sharp: 1.1, taper: [0.25, 0.25], soft: 0.15, boost: 1.15, heat: 0.95 }); mats.push(bm); core = new THREE.Group(); const a = new THREE.Mesh(V.arcGeo(o.size * 1.3, o.size * 3.4, 0.15, Math.PI - 0.3, 28), bm), b = a.clone(); b.rotation.z = Math.PI / 2; core.add(a, b); }
    else { const hot = V.orbMat({ core: 0xffffff, mid: C.core, deep: C.mid }, { rim: 0.8, fill: 0.95, tile: [2, 2], scroll: [0, 2.5], add: true, boost: 1.3 }), shell = V.orbMat(C, { rim: 1.6, fill: 0.45, bulge: o.size * 0.5, tile: [2, 2], scroll: [0.4, 2.2], alpha: 0.95 }); mats.push(hot, shell); core = new THREE.Mesh(new THREE.SphereGeometry(o.size * 0.7, 18, 12), hot); const s2 = new THREE.Mesh(new THREE.SphereGeometry(o.size * 1.25, 20, 14), shell); s2.scale.z = 1.35; g.add(s2); }
    g.add(core);
    const tailMat = V.bandMat(SHAPE[el], { tile: [1.6, 1], scroll: [2.8, 0], edge: 0.5, sharp: el === 'ice' ? 1.9 : 1.1, taper: [0.02, 0.8], soft: 0.22, boost: 1.1, heat: 0.9 }), tail = new V.Ribbon(tailMat, o.size * (o.spear ? 1.3 : o.blade ? 2.6 : 2.4), 20), state = { done: false, end: 0 };
    this.play(tail.mesh, [tailMat], 99, (k, f) => { if (!state.done) { tail.push(g.position, this.api.camera); return; } state.end += f.dt; tailMat.uniforms.uErode.value = state.end / 0.28 * 1.5; if (state.end > 0.28) f.t = 1e9; });
    const v = dir.clone().normalize(); let life = 0;
    const hitTest = (x) => Math.hypot(x.x - g.position.x, x.z - g.position.z) < 0.8 + x.def.size * 0.35, finish = (who) => { state.done = true; o.onHit(g.position.clone(), who); return false; };
    this.play(g, mats, 99, (k, f) => {
      if (state.done) return; life += f.dt;
      if (m && !m.dead && m.g.visible) { const want = new THREE.Vector3(m.x - g.position.x, 0, m.z - g.position.z).normalize(); v.lerp(want, Math.min(1, f.dt * 9)).normalize(); }
      g.position.addScaledVector(v, o.speed * f.dt); const gy = this.y(g.position.x, g.position.z) + 1.0; g.position.y += (gy - g.position.y) * Math.min(1, f.dt * 6);
      g.rotation.y = Math.atan2(v.x, v.z); if (o.blade) core.rotation.z += f.dt * 22; if (o.spear) core.rotation.z += f.dt * 9;
      const P = g.position;
      if (el === 'fire') { for (let i = 0; i < 3; i++) this.parts.one({ x: P.x + rnd(-0.15, 0.15), y: P.y + rnd(-0.15, 0.15), z: P.z + rnd(-0.15, 0.15), vx: -v.x * 2 + rnd(-1, 1), vy: rnd(0.2, 1.6), vz: -v.z * 2 + rnd(-1, 1), life: rnd(0.3, 0.55), size: rnd(0.35, 0.7), size1: 0.08, color: C.mid, color1: C.deep, alpha: 0.9, cell: 2, drag: 2 }); if (Math.random() < 0.7) this.parts.one({ x: P.x, y: P.y, z: P.z, vx: rnd(-2, 2), vy: rnd(0, 2.5), vz: rnd(-2, 2), life: rnd(0.3, 0.6), size: 0.16, size1: 0.03, color: C.core, color1: C.mid, glow: true, cell: 0, grav: 4 }); }
      else if (el === 'ice') { for (let i = 0; i < 2; i++) this.parts.one({ x: P.x, y: P.y, z: P.z, vx: rnd(-1, 1), vy: rnd(-0.5, 1), vz: rnd(-1, 1), life: rnd(0.35, 0.6), size: rnd(0.14, 0.26), color: C.core, color1: C.mid, cell: 3, spin: rnd(-8, 8), grav: 3 }); if (Math.random() < 0.5) this.parts.one({ x: P.x, y: P.y, z: P.z, life: 0.5, size: 0.5, size1: 1.1, color: C.smoke, alpha: 0.3, cell: 2 }); }
      else if (el === 'wind') { for (let i = 0; i < 2; i++) this.parts.one({ x: P.x, y: P.y + rnd(-0.2, 0.2), z: P.z, vx: -v.x * 2 + rnd(-1, 1), vy: rnd(-0.3, 0.6), vz: -v.z * 2 + rnd(-1, 1), life: rnd(0.3, 0.5), size: rnd(0.2, 0.35), color: C.mid, color1: C.deep, cell: 4, spin: rnd(-10, 10) }); }
      if (m && !m.dead && hitTest(m)) { f.t = 1e9; finish(m); return; }
      if (!m) for (const x of this.api.wild.targets(this.api.profile())) if (hitTest(x)) { f.t = 1e9; finish(x); return; }
      if (life * o.speed > 22 || !L.walkable(P.x, P.z, 0.1) && !L.inWater(P.x, P.z)) { f.t = 1e9; finish(null); }
    });
    this.parts.one({ x: pos.x, y: pos.y, z: pos.z, life: 0.14, size: 0.7, size1: 1.2, color: C.core, color1: C.mid, glow: true, cell: 1, alpha: 0.6, fadeIn: 0.01 });
  }
  /** Lightning from A to B: a white core in a coloured glow that re-jags a few times while it lasts, with side forks. */
  bolt(a, b, o = {}) {
    if (o === true) o = { chain: true };
    const C = PAL.thunder, cam = this.api.camera, w = o.w || 1, life = o.life || 0.34;
    const A = o.raw ? a.clone() : new THREE.Vector3(a.x, o.chain ? this.y(a.x, a.z) + 1.0 : a.y + 1.5, a.z), B = o.raw ? b.clone() : new THREE.Vector3(b.x, this.y(b.x, b.z) + 0.8, b.z);
    const coreMat = V.bandMat({ core: 0xffffff, mid: 0xffffff, deep: C.core }, { tile: [1, 1], scroll: [0, 0], edge: 0.5, sharp: 2.6, taper: [0.02, 0.02], soft: 0.3, add: true, boost: 1.5 }), glowMat = V.bandMat({ core: C.core, mid: C.mid, deep: C.deep }, { tile: [2, 1], scroll: [5, 0], edge: 0.5, sharp: 1.5, taper: [0.03, 0.03], soft: 0.4, alpha: 0.5, add: true, boost: 1.0 });
    const g = new THREE.Group(); let next = 0;
    const build = () => {
      for (const c of [...g.children]) { c.geometry.dispose(); g.remove(c); }
      const main = V.jagPoints(A, B, 0.55 * w + A.distanceTo(B) * 0.025); g.add(new THREE.Mesh(V.stripGeo(main, 0.6 * w, cam), glowMat), new THREE.Mesh(V.stripGeo(main, 0.17 * w, cam), coreMat));
      for (let k = 0; k < (o.branches ?? 3); k++) { const s = main[2 + Math.floor(Math.random() * (main.length - 4))], e = s.clone().add(new THREE.Vector3(rnd(-1.6, 1.6), rnd(-1.2, 0.4), rnd(-1.6, 1.6)).multiplyScalar(w)), pts = V.jagPoints(s, e, 0.3 * w); g.add(new THREE.Mesh(V.stripGeo(pts, 0.28 * w, cam), glowMat), new THREE.Mesh(V.stripGeo(pts, 0.08 * w, cam), coreMat)); }
      g.traverse((c) => { if (c.isMesh) { c.frustumCulled = false; c.renderOrder = 12; } });
    };
    this.play(g, [coreMat, glowMat], life, (k, f) => { if (f.t >= next) { next = f.t + 0.055; build(); } const flick = 0.55 + 0.45 * Math.random(); coreMat.uniforms.uAlpha.value = (1 - k * k) * flick; glowMat.uniforms.uAlpha.value = 0.5 * (1 - k) * flick; });
    if (!o.raw) { this.sparks(B, 1.2 * w, 24); this.flash(B, 'thunder', 0.9 * w); }
  }
  jag(A, B, w, life) { this.bolt(A, B, { raw: true, w: w * 9, life, branches: 0 }); }
  /** A strike from the sky: a thick bolt, a pillar of light where it lands, a wave and a burn mark. */
  strike(at) {
    const gy = this.y(at.x, at.z), top = new THREE.Vector3(at.x + rnd(-1.5, 1.5), gy + 12, at.z + rnd(-1.5, 1.5)), B = new THREE.Vector3(at.x, gy + 0.15, at.z);
    this.bolt(top, B, { raw: true, w: 1.7, life: 0.36, branches: 3 }); this.pillar(at, 'thunder', 0.32, 6, 0.28); this.shock(at, 'thunder', 2.6, 0.4); this.scorch(at, 1.1, 2.4);
    this.sparks(B, 1.6, 26); this.flash(new THREE.Vector3(at.x, gy + 0.8, at.z), 'thunder', 1.3); this.shake(0.22);
  }
  /** A dark storm ceiling turning over the hero. */
  cloud(at, r, life) {
    const pl = this.api.player, C = { core: 0x9a8ae0, mid: 0x4a3c86, deep: 0x1a1430 }, mat = V.groundMat(C, { kind: 'disc', radius: 0.98, alpha: 0.9, spin: 0.22, tile: [2, 2], soft: 0.3 }), lit = V.groundMat(PAL.thunder, { kind: 'disc', radius: 0.9, alpha: 0.35, spin: -0.35, tile: [3, 2], soft: 0.2, add: true, boost: 1 });
    const g = new THREE.Group(), a = new THREE.Mesh(V.groundGeo(r * 1.25), mat), b = new THREE.Mesh(V.groundGeo(r * 1.1), lit); b.position.y = -0.2; g.add(a, b);
    this.play(g, [mat, lit], life + 0.6, (k, f) => { const p = pl.pos; g.position.set(p.x, p.y + 10, p.z); const edge = Math.min(1, k * 6, (1 - k) * 5); mat.uniforms.uErode.value = 0.1 + (1 - edge) * 1.3; lit.uniforms.uErode.value = 0.75 + 0.2 * Math.sin(f.t * 23) + (1 - edge);
      for (let i = 0; i < 2; i++) { const an = Math.random() * 6.28, rr = Math.random() * r * 0.9; this.parts.one({ x: p.x + Math.cos(an) * rr, y: p.y + rnd(8.8, 9.8), z: p.z + Math.sin(an) * rr, vx: rnd(-0.3, 0.3), life: rnd(0.8, 1.3), size: rnd(3, 5), color: 0x2a2440, color1: 0x4a4070, alpha: 0.5, cell: 2, fadeIn: 0.3 }); } });
  }
  /** The circle that shows where something heavy will land: the element's magic circle, drawn slowly, with a wave closing in. */
  warn(at, el, r, life) {
    this.runes(at, el, r, life + 0.35, true);
    const C = PAL[el], mat = V.groundMat({ core: C.core, mid: C.deep, deep: C.deep }, { kind: 'ring', tile: [6, 1], scroll: [0.5, 0], soft: 0.2, width: 0.07, add: true, boost: 1.1 }), m = new THREE.Mesh(V.groundGeo(r), mat); m.position.set(at.x, this.y(at.x, at.z) + 0.1, at.z);
    this.play(m, [mat], life, (k) => { mat.uniforms.uRadius.value = 0.95 - 0.85 * k * k; mat.uniforms.uAlpha.value = Math.min(1, k * 5); });
  }
  /** A burning rock that falls from the sky with a long tail of fire. */
  meteor(at, land) {
    const y = this.y(at.x, at.z), C = PAL.fire, g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshStandardMaterial({ color: 0x3a1a0e, emissive: 0xff5a14, emissiveIntensity: 1.6, roughness: 0.85, flatShading: true }));
    const shell = V.orbMat(C, { rim: 1.3, fill: 0.5, bulge: 0.35, tile: [2, 2], scroll: [0.3, 2.6] }), s2 = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 14), shell); g.add(rock, s2);
    const s = new THREE.Vector3(at.x - 6, y + 17, at.z - 3.5), e = new THREE.Vector3(at.x, y + 0.4, at.z); g.position.copy(s);
    const tailMat = V.bandMat(C, { tile: [1.4, 1], scroll: [2.6, 0], edge: 0.5, sharp: 1.0, taper: [0.02, 0.85], soft: 0.25, boost: 1.12 }), tail = new V.Ribbon(tailMat, 2.3, 22), state = { done: false, end: 0 };
    this.play(tail.mesh, [tailMat], 99, (k, f) => { if (!state.done) { tail.push(g.position, this.api.camera); return; } state.end += f.dt; tailMat.uniforms.uErode.value = state.end / 0.4 * 1.5; if (state.end > 0.4) f.t = 1e9; });
    this.play(g, [shell], 99, (k, f) => { const kk = Math.min(1, f.t / 0.55); g.position.lerpVectors(s, e, kk * kk); rock.rotation.x += f.dt * 12; rock.rotation.z += f.dt * 9;
      const P = g.position; for (let i = 0; i < 3; i++) this.parts.one({ x: P.x + rnd(-0.3, 0.3), y: P.y + rnd(-0.3, 0.3), z: P.z + rnd(-0.3, 0.3), vy: rnd(0, 1), life: rnd(0.5, 0.9), size: rnd(0.8, 1.3), size1: rnd(1.6, 2.2), color: C.mid, color1: C.smoke, alpha: 0.75, cell: 2, drag: 1 });
      if (kk >= 1) { state.done = true; f.t = 1e9; land(); for (let i = 0; i < 7; i++) this.debris(e, 0x3a2418); } });
  }
  /** A stone thrown out of a crater: it flies, falls and is gone. */
  debris(at, hex) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.1, 0.24), 0), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, flatShading: true })), a = rnd(0, 6.28), sp = rnd(3, 7); let vx = Math.cos(a) * sp, vz = Math.sin(a) * sp, vy = rnd(5, 9); m.position.copy(at);
    this.play(m, [], 0.9, (k, f) => { vy -= 20 * f.dt; m.position.x += vx * f.dt; m.position.y = Math.max(this.y(m.position.x, m.position.z) + 0.05, m.position.y + vy * f.dt); m.position.z += vz * f.dt; m.rotation.x += f.dt * 9; m.rotation.y += f.dt * 7; m.scale.setScalar(1 - Math.max(0, k - 0.7) / 0.3); });
  }
  /** What a blast leaves on the ground: dark cracks that stay a while, glowing at first. */
  scorch(at, r = 1.6, life = 4.5) {
    const y = this.y(at.x, at.z) + 0.05, dark = V.groundMat({ core: 0x2a1a12, mid: 0x1a0e08, deep: 0x0c0604 }, { kind: 'map', map: V.crackTex(), soft: 0.25, alpha: 0.85, tile: [1.5, 1.5] }), hot = V.groundMat(PAL.fire, { kind: 'map', map: V.crackTex(), soft: 0.2, add: true, boost: 1.3, tile: [2, 2] });
    const g = new THREE.Group(), a = new THREE.Mesh(V.groundGeo(r * 1.2), dark), b = new THREE.Mesh(V.groundGeo(r), hot); b.position.y = 0.01; a.renderOrder = 7; b.renderOrder = 8; g.add(a, b); g.position.set(at.x, y, at.z); g.rotation.y = rnd(0, 6.28);
    this.play(g, [dark, hot], life, (k) => { dark.uniforms.uErode.value = Math.max(0, (k - 0.6) / 0.4) * 1.5; hot.uniforms.uErode.value = Math.min(1.5, k * 5); });
  }
  /** The blizzard: frost creeping over the ground, a wall of driving snow round the hero, ice growing out of the ground. */
  blizzard(at, r, life, tick) {
    const pl = this.api.player, C = PAL.ice; let acc = 0, sp = 0;
    const frost = V.groundMat(C, { kind: 'disc', radius: 0.97, alpha: 0.55, spin: 0.1, tile: [3, 2], soft: 0.25, boost: 1.05 }), sign = V.groundMat({ core: 0xffffff, mid: C.core, deep: C.mid }, { kind: 'map', map: V.circleTex('ice'), spin: 0.25, soft: 0.25, add: true, boost: 1.2 });
    const g = new THREE.Group(), a = new THREE.Mesh(V.groundGeo(r * 1.15), frost), b = new THREE.Mesh(V.groundGeo(r * 0.9), sign); b.position.y = 0.02; g.add(a, b);
    const w1 = this.wall(at, 'ice', r * 0.95, 3.4, life, { follow: pl.pos, turn: 2.2, scroll: [1.8, -0.5], tile: [1, 5], edge: 0.45, sharp: 0.7, alpha: 0.55, hold: 0.85, turns: 2, base: 0.5 }), w2 = this.wall(at, 'ice', r * 0.55, 2.4, life, { follow: pl.pos, turn: -3, scroll: [-2.2, -0.4], tile: [1, 4], edge: 0.5, sharp: 0.8, alpha: 0.45, hold: 0.85, turns: 2, base: 0.5 }); void w1; void w2;
    this.play(g, [frost, sign], life, (k, f) => { const p = pl.pos; g.position.set(p.x, this.y(p.x, p.z) + 0.08, p.z); const edge = Math.min(1, f.t * 3, (life - f.t) * 2); frost.uniforms.uErode.value = 0.08 + (1 - edge) * 1.3; sign.uniforms.uErode.value = (1 - edge) * 1.5; sign.uniforms.uReveal.value = Math.min(1, f.t * 3);
      for (let i = 0; i < 6; i++) { const an = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * r; this.parts.one({ x: p.x + Math.cos(an) * rr, y: p.y + rnd(3, 5), z: p.z + Math.sin(an) * rr, vx: rnd(-1, 1) + Math.cos(an + 1.6) * 3, vy: -rnd(3, 5), vz: rnd(-1, 1) + Math.sin(an + 1.6) * 3, life: rnd(0.8, 1.3), size: rnd(0.1, 0.24), color: C.core, color1: C.mid, cell: i % 3 ? 0 : 3, spin: rnd(-6, 6) }); }
      if (Math.random() < 0.5) { const an = Math.random() * 6.28; this.parts.one({ x: p.x, y: p.y + 0.6, z: p.z, life: 1.1, size: 1.3, size1: 2.4, color: C.smoke, alpha: 0.3, cell: 2, orbit: { x: p.x, z: p.z, a: an, w: 2.2, r: 1, grow: r * 0.8 } }); }
      sp += f.dt; if (sp > 0.3) { sp = 0; const an = Math.random() * 6.28, rr = rnd(1.5, r); this.spike(p.x + Math.cos(an) * rr, p.z + Math.sin(an) * rr, rnd(0.8, 1.4)); }
      acc += f.dt; if (acc >= 0.5) { acc = 0; tick(); } });
  }
  /** Whirlwind: walls of wind spinning out from the hero, leaves and dust flung round. */
  cyclone(at, r, life) {
    const C = PAL.wind, pl = this.api.player;
    this.wall(at, 'wind', r * 0.55, 1.9, life, { turn: 14, scroll: [3, -0.4], tile: [1, 4], edge: 0.5, sharp: 0.75, alpha: 0.85, hold: 0.35, flare: 1.5, turns: 2, base: 0.42 });
    this.wall(at, 'wind', r * 0.95, 1.3, life * 1.1, { turn: -10, scroll: [-2.6, -0.3], tile: [1, 5], edge: 0.5, sharp: 0.9, alpha: 0.7, hold: 0.3, flare: 1.25, turns: 2, base: 0.45 });
    for (let i = 0; i < 36; i++) { const a = i / 36 * 6.28; this.parts.one({ x: at.x, y: at.y + rnd(0.3, 1.6), z: at.z, life: life * rnd(0.7, 1), size: rnd(0.25, 0.4), color: i % 3 ? C.mid : 0xc8a050, color1: C.deep, cell: 4, spin: 14, orbit: { x: pl.pos.x, z: pl.pos.z, a, w: 9, r: 0.8, grow: r * 1.6 } }); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; this.parts.one({ x: at.x, y: at.y + 0.15, z: at.z, life: life * 0.9, size: 0.9, size1: 1.8, color: 0xd8c8a0, alpha: 0.35, cell: 2, orbit: { x: pl.pos.x, z: pl.pos.z, a, w: 5, r: 0.6, grow: r * 2.2 } }); }
  }
  /** Tornado: a leaning funnel of wind (three sleeves turning at different speeds) that walks forward and pulls monsters in. */
  twister(from, dir, tick, size = 1) {
    const C = PAL.wind, at = from.clone(), life = 4; let acc = 0;
    const mk = (r0, r1, h, o) => { const mat = V.bandMat(SHAPE.wind, { heat: 0.62, tile: o.tile, scroll: o.scroll, edge: 0.5, sharp: o.sharp, taper: [0, 0], soft: 0.22, alpha: o.alpha, boost: 1.08 }); return { mat, mesh: new THREE.Mesh(V.wallGeo(r0 * size, r1 * size, h * size, 44, 3), mat), w: o.w, base: o.base }; };
    const sleeves = [mk(0.35, 2.3, 6, { tile: [0.7, 6], scroll: [1.6, -0.9], sharp: 0.55, alpha: 0.95, w: 9, base: 0.42 }), mk(0.6, 2.9, 5.2, { tile: [1, 4], scroll: [-1.2, -0.6], sharp: 0.9, alpha: 0.6, w: -6, base: 0.5 }), mk(0.2, 1.4, 6.4, { tile: [0.5, 8], scroll: [2.2, -1.4], sharp: 0.7, alpha: 0.95, w: 13, base: 0.38 })];
    const g = new THREE.Group(); for (const s of sleeves) g.add(s.mesh);
    const dust = V.groundMat({ core: 0xf0e8c8, mid: 0xc8b890, deep: 0x8a7a58 }, { kind: 'disc', radius: 0.9, alpha: 0.5, spin: 1.4, tile: [3, 1], soft: 0.3 }), base = new THREE.Mesh(V.groundGeo(3.2 * size), dust); base.position.y = 0.08; g.add(base);
    this.play(g, [...sleeves.map((s) => s.mat), dust], life, (k, f) => { const nx = at.x + dir.x * 4.5 * f.dt, nz = at.z + dir.z * 4.5 * f.dt; if (L.walkable(nx, nz, 0.5)) { at.x = nx; at.z = nz; } const y = this.y(at.x, at.z);
      g.position.set(at.x, y, at.z); g.rotation.x = Math.sin(f.t * 2.3) * 0.07; g.rotation.z = Math.cos(f.t * 1.7) * 0.07; const grow = V.easeOut(k * 6), end = Math.max(0, (k - 0.85) / 0.15);
      for (const s of sleeves) { s.mesh.rotation.y += f.dt * s.w; s.mesh.scale.set(grow, grow, grow); s.mat.uniforms.uErode.value = s.base + end * 1.3; } dust.uniforms.uErode.value = 0.1 + end * 1.4;
      for (let i = 0; i < 4; i++) { const h = Math.random() * 5 * size, a = Math.random() * 6.28; this.parts.one({ x: at.x, y: y + h, z: at.z, vy: 1.5, life: rnd(0.5, 0.8), size: rnd(0.25, 0.4), color: i % 2 ? C.mid : 0x8a6a3a, color1: C.deep, cell: 4, spin: 15, orbit: { x: at.x, z: at.z, a, w: 7, r: (0.5 + h * 0.4) * size, grow: 0.5 } }); }
      acc += f.dt; if (acc >= 0.5) { acc = 0; tick(at); } });
  }
  update(dt) {
    dt *= this.slow || 1;
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
  clear() { this.fx.splice(0).forEach((f) => { if (f.o) { f.o.removeFromParent(); f.o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); } }); this.parts.clear(); }
}
