// Casting the magic skills (20/11): the 12 spells of core/skills.js as real effects in the world, with shapes drawn here in
// the element colours until the Blender effect models (batch 21) arrive. Keys 1-4 (or the hotbar buttons) cast the spell in
// that slot; each spell costs energy and has its own cooldown. Damage goes through Wild.damage (element ring, combos, shields).
import * as THREE from 'three';
import * as L from '../core/layout.js';
import * as SK from '../core/skills.js';
import { playerAtk, inArc } from '../core/rules.js';

// normal blending (additive vanished on the bright grass: green wind on green grass), both sides, not tone mapped so the
// colours stay strong and the bloom of the medium/high quality makes them glow
const mat = (hex, opacity = 0.85) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });

export class Spells {
  /** api: { scene, wild, player, profile(), sfx(name), ui, onChange() } */
  constructor(api) { this.api = api; this.fx = []; this.cool = {}; this.root = new THREE.Group(); api.scene.add(this.root); }
  /** Seconds left before a spell can be cast again. */
  wait(id) { return Math.max(0, (this.cool[id] || 0)); }
  /** Casts the spell in hotbar slot i. Returns '' or why not (shown to the child). */
  castSlot(i) { const p = this.api.profile(); if (!p) return ''; const id = SK.magic(p).bar[i]; if (!id) { this.api.ui.toast(`Ô ${i + 1} trống: mở bảng Kỹ năng (phím T) để học phép`); return 'empty'; } return this.cast(id); }
  cast(id) {
    const { wild, player, sfx, ui } = this.api, p = this.api.profile(), n = SK.NODES[id];
    if (!p || !n || !SK.rank(p, id)) return 'unknown';
    if (!wild.root.visible) { ui.toast('Ở đây không dùng phép được'); return 'place'; }
    if (this.wait(id) > 0) return 'cool';
    if (!SK.spend(p, SK.spellCost(id))) { ui.toast('Hết năng lượng (thanh xanh). Chờ một chút!'); sfx('wrong'); return 'mp'; }
    this.cool[id] = SK.spellCool(p, id); player.emote('Interact'); sfx('tick');
    const dmg = SK.spellDamage(p, id, playerAtk(p)), el = n.el, col = SK.ELEMENTS[el].hex, here = player.pos.clone(), yaw = player.yaw;
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), targets = () => wild.targets(p);
    const hit = (m, o = {}) => wild.damage(m, dmg * (o.k || 1), el, { spell: true, ...o });
    const near = (r) => targets().filter((m) => Math.hypot(m.x - here.x, m.z - here.z) < r + m.def.size * 0.3);
    const nearest = (r) => { let best = null, bd = r; for (const m of targets()) { const d = Math.hypot(m.x - player.pos.x, m.z - player.pos.z), front = (m.x - player.pos.x) * fwd.x + (m.z - player.pos.z) * fwd.z > 0 ? 0 : 3; if (d + front < bd) { bd = d + front; best = m; } } return best; };
    switch (id) {
      case 'flame_slash': case 'frost_strike': case 'thunder_fist': {
        const reach = id === 'thunder_fist' ? 2.6 : 3.0;
        for (const m of targets()) if (inArc(here.x, here.z, yaw, m.x, m.z, reach + m.def.size * 0.3, 0.15)) hit(m, { burn: id === 'flame_slash' ? 3 : 0, slow: id === 'frost_strike' ? 3 : 0, stun: id === 'thunder_fist' ? 0.8 : 0, knock: 0.5 });
        this.arc(here, yaw, col, reach); break;
      }
      case 'whirlwind': for (const m of near(3.2)) hit(m, { knock: 2.4 }); this.ring(here, col, 3.2, 0.45, true); break;
      case 'fireball': this.bolt(here, fwd, col, { speed: 16, range: 14, size: 0.45, pierce: false, onHit: (at) => { for (const m of targets()) if (Math.hypot(m.x - at.x, m.z - at.z) < 2 + m.def.size * 0.3) hit(m, { burn: 2 }); this.ring(at, col, 2.2, 0.35); } }); break;
      case 'ice_spear': this.bolt(here, fwd, col, { speed: 20, range: 14, size: 0.3, long: true, pierce: true, each: (m) => hit(m, { slow: 3 }) }); break;
      case 'wind_blade': this.bolt(here, fwd, col, { speed: 26, range: 16, size: 0.35, flat: true, pierce: true, each: (m) => hit(m, { knock: 0.6 }) }); break;
      case 'lightning': {
        const first = nearest(12); if (!first) { this.zap(here, here.clone().addScaledVector(fwd, 8), col); break; }
        hit(first); this.zap(here, new THREE.Vector3(first.x, 0, first.z), col);
        if (SK.rank(p, id) >= 5) { const next = targets().filter((m) => m !== first && Math.hypot(m.x - first.x, m.z - first.z) < 6)[0]; if (next) { hit(next, { k: 0.7 }); this.zap(new THREE.Vector3(first.x, 0, first.z), new THREE.Vector3(next.x, 0, next.z), col); } }
        break;
      }
      case 'meteor': {
        const t = nearest(14), c = t ? new THREE.Vector3(t.x, 0, t.z) : here.clone().addScaledVector(fwd, 6);
        [[0, 0], [1.6, 0.8], [-1.2, 1.4]].forEach(([dx, dz], k) => this.later(0.35 + k * 0.4, () => { const at = c.clone().add(new THREE.Vector3(dx, 0, dz)); this.fall(at, col, () => { for (const m of targets()) if (Math.hypot(m.x - at.x, m.z - at.z) < 2.5 + m.def.size * 0.3) hit(m, { k: 0.5, burn: 2 }); this.ring(at, col, 2.6, 0.4); sfx('wrong'); }); }));
        break;
      }
      case 'blizzard': this.area(here, col, 6, 4, () => { for (const m of near(6)) hit(m, { k: 0.18, slow: 1.5, mark: true }); }, true); break;
      case 'tornado': this.twister(here, fwd, col, (at) => { for (const m of targets()) { const d = Math.hypot(m.x - at.x, m.z - at.z); if (d < 3.5 + m.def.size * 0.3) { if (!m.boss && d > 0.6) { const nx = m.x + (at.x - m.x) / d * 0.5, nz = m.z + (at.z - m.z) / d * 0.5; if (L.walkable(nx, nz, 0.45)) { m.x = nx; m.z = nz; } } hit(m, { k: 0.2 }); } } }); break;
      case 'thunderstorm': for (let k = 0; k < 6; k++) this.later(0.15 + k * 0.25, () => { const list = targets().filter((m) => Math.hypot(m.x - player.pos.x, m.z - player.pos.z) < 10); const m = list[Math.floor(Math.random() * list.length)]; const at = m ? new THREE.Vector3(m.x, 0, m.z) : player.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 12)); this.strike(at, col); if (m) hit(m, { k: 0.45 }); }); break;
    }
    this.api.onChange(); return '';
  }
  // ---------------------------------------------------------------- effects (each one: update(dt) -> false when finished)
  add(o, update) { if (o) this.root.add(o); this.fx.push({ o, update, t: 0 }); }
  later(sec, fn) { this.add(null, (f) => (f.t >= sec ? (fn(), false) : true)); }
  y(x, z) { return L.groundHeight(x, z); }
  arc(at, yaw, col, r) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r * 0.75, 0.16, 6, 24, Math.PI * 0.9), mat(col)); m.rotation.set(Math.PI / 2, 0, -yaw + Math.PI * 0.05); m.position.set(at.x, at.y + 0.9, at.z);
    this.add(m, (f) => { m.scale.setScalar(1 + f.t * 1.5); m.material.opacity = 0.85 * (1 - f.t / 0.3); return f.t < 0.3; });
  }
  ring(at, col, r, life = 0.4, spin = false) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.15, r, 32), mat(col, 0.7)); m.rotation.x = -Math.PI / 2; m.position.set(at.x, this.y(at.x, at.z) + 0.15, at.z);
    this.add(m, (f) => { const k = f.t / life; m.scale.setScalar(0.4 + k * 0.7); m.material.opacity = 0.7 * (1 - k); if (spin) m.rotation.z += 0.4; return f.t < life; });
  }
  bolt(from, dir, col, o) {
    const g = new THREE.Group(), core = new THREE.Mesh(o.long ? new THREE.ConeGeometry(o.size * 0.6, o.size * 4, 6) : o.flat ? new THREE.TorusGeometry(o.size * 1.6, o.size * 0.25, 4, 16, Math.PI) : new THREE.SphereGeometry(o.size, 12, 8), mat(col, 0.95));
    if (o.long) core.rotation.x = Math.PI / 2; if (o.flat) core.rotation.x = Math.PI / 2;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(o.size * 1.9, 10, 8), mat(col, 0.3)); g.add(core, glow);
    const pos = from.clone(); pos.y = from.y + 1.0; g.position.copy(pos); g.rotation.y = Math.atan2(dir.x, dir.z);
    const hitSet = new Set();
    this.add(g, (f) => {
      const step = o.speed * f.dt; g.position.addScaledVector(dir, step); g.position.y = this.y(g.position.x, g.position.z) + 1.0; if (o.flat) g.rotation.z += 0.5;
      const gone = f.t * o.speed >= o.range;
      for (const m of this.api.wild.targets(this.api.profile())) {
        if (hitSet.has(m) || Math.hypot(m.x - g.position.x, m.z - g.position.z) > 0.9 + m.def.size * 0.35) continue;
        hitSet.add(m); if (o.each) o.each(m); if (!o.pierce) { if (o.onHit) o.onHit(g.position.clone()); return false; }
      }
      if (gone) { if (o.onHit) o.onHit(g.position.clone()); return false; }
      return true;
    });
  }
  zap(a, b, col) {
    const pts = [], n = 8, A = new THREE.Vector3(a.x, this.y(a.x, a.z) + 1.2, a.z), B = new THREE.Vector3(b.x, this.y(b.x, b.z) + 1.0, b.z);
    for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); if (i && i < n) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6)); pts.push(p); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.07, 5), mat(col, 1)); this.add(tube, (f) => { tube.material.opacity = 1 - f.t / 0.25; return f.t < 0.25; });
    this.ring(b, col, 1.2, 0.3);
  }
  strike(at, col) {
    const y = this.y(at.x, at.z), beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 12, 6, 1, true), mat(col, 1)); beam.position.set(at.x, y + 6, at.z);
    this.add(beam, (f) => { beam.material.opacity = 1 - f.t / 0.3; beam.scale.x = beam.scale.z = 1 + f.t * 3; return f.t < 0.3; }); this.ring(at, col, 1.8, 0.35);
  }
  fall(at, col, land) {
    const y = this.y(at.x, at.z), rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), new THREE.MeshStandardMaterial({ color: 0x5a2a1a, emissive: col, emissiveIntensity: 1.2, roughness: 0.8 }));
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3, 8, 1, true), mat(col, 0.6)); tail.position.y = 1.6; rock.add(tail);
    rock.position.set(at.x - 3, y + 14, at.z - 3);
    this.add(rock, (f) => { const k = Math.min(1, f.t / 0.5); rock.position.set(at.x - 3 * (1 - k), y + 14 * (1 - k) + 0.4, at.z - 3 * (1 - k)); rock.rotation.x += 0.2; if (k >= 1) { land(); return false; } return true; });
  }
  area(at, col, r, life, tick, snow) {
    const g = new THREE.Group(), y = this.y(at.x, at.z), disc = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat(col, 0.3)); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.12; g.add(disc);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(r, 0.12, 6, 48), mat(col, 0.8)); edge.rotation.x = Math.PI / 2; edge.position.y = 0.2; g.add(edge);
    const flakes = []; for (let i = 0; i < 60; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), mat(snow ? 0xeaf8ff : col, 0.95)); const a = Math.random() * Math.PI * 2, d = Math.random() * r; s.position.set(Math.cos(a) * d, Math.random() * 4, Math.sin(a) * d); g.add(s); flakes.push(s); }
    g.position.set(at.x, y, at.z); let acc = 0;
    this.add(g, (f) => { const p = this.api.player.pos; g.position.set(p.x, this.y(p.x, p.z), p.z); for (const s of flakes) { s.position.y -= f.dt * 3; if (s.position.y < 0) s.position.y = 4; } acc += f.dt; if (acc >= 0.5) { acc = 0; tick(); } disc.material.opacity = 0.3 * Math.min(1, (life - f.t) * 2); edge.rotation.z += f.dt; return f.t < life; });
  }
  twister(from, dir, col, tick) {
    const g = new THREE.Group(), cone = new THREE.Mesh(new THREE.ConeGeometry(1.7, 4.6, 18, 6, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, wireframe: true, toneMapped: false })); cone.rotation.x = Math.PI; cone.position.y = 2.3; g.add(cone);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(1.0, 4.0, 14, 1, true), mat(0xe8fff0, 0.4)); inner.rotation.x = Math.PI; inner.position.y = 2.0; g.add(inner);
    for (let i = 0; i < 10; i++) { const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.12), mat(i % 2 ? col : 0x8a6a3a, 0.95)); const a = i / 10 * Math.PI * 2; leaf.position.set(Math.cos(a) * (0.6 + i * 0.08), 0.4 + i * 0.35, Math.sin(a) * (0.6 + i * 0.08)); cone.add(leaf); }
    const pos = from.clone(); g.position.copy(pos); let acc = 0;
    this.add(g, (f) => { const nx = g.position.x + dir.x * 5 * f.dt, nz = g.position.z + dir.z * 5 * f.dt; if (L.walkable(nx, nz, 0.5)) { g.position.x = nx; g.position.z = nz; } g.position.y = this.y(g.position.x, g.position.z); cone.rotation.y += 0.35; inner.rotation.y -= 0.5; acc += f.dt; if (acc >= 0.5) { acc = 0; tick(g.position); } return f.t < 4; });
  }
  update(dt) {
    for (const k in this.cool) this.cool[k] = Math.max(0, this.cool[k] - dt);
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t += dt; f.dt = dt; let keep = false;
      try { keep = f.update(f); } catch (e) { console.warn('spell effect', e); }
      if (!keep) { if (f.o) { f.o.removeFromParent(); f.o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); } this.fx.splice(i, 1); }
    }
  }
  /** Ends every effect at once (changing region). */
  clear() { this.fx.splice(0).forEach((f) => { if (f.o) f.o.removeFromParent(); }); }
}
