// Wild monsters to train on: real-time fights with the J / F key. No English here: this is the "play" part.
// Monsters chase when Ngọc comes close, hit on contact, respawn after a while. Defeat sends Ngọc back to the
// village square with full health and no loss, so young players are never punished hard.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { MONSTERS, SPAWNS, playerAtk, hurt, inArc } from '../core/rules.js';
import { addExp, maxHp } from '../core/save.js';

export class Wild {
  /** api: { scene, player, ui, sfx(name), profile() -> profile, save(), onChange(), respawn() } */
  constructor(api) {
    this.api = api; this.root = new THREE.Group(); api.scene.add(this.root); this.cool = 0; this.t = 0; this.regen = 0;
    const eye = new THREE.MeshBasicMaterial({ color: 0x24140c }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mobs = SPAWNS.map(([kind, x, z], i) => {
      const def = MONSTERS[kind], g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: kind === 'golem' ? 0.95 : 0.2, transparent: kind !== 'golem', opacity: kind === 'golem' ? 1 : 0.9, emissive: def.color, emissiveIntensity: 0.12, flatShading: kind === 'golem' });
      const body = new THREE.Mesh(kind === 'golem' ? new THREE.IcosahedronGeometry(0.55, 1) : new THREE.SphereGeometry(0.5, 16, 12), mat); body.scale.set(1, kind === 'golem' ? 1.1 : 0.8, 1); body.position.y = kind === 'golem' ? 0.6 : 0.4; body.castShadow = true; g.add(body);
      if (kind === 'golem') { for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), mat); arm.position.set(sx * 0.66, 0.5, 0.1); arm.castShadow = true; g.add(arm); } const moss = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), new THREE.MeshStandardMaterial({ color: 0x74b84a })); moss.scale.y = 0.4; moss.position.y = 1.12; g.add(moss); }
      for (const sx of [-1, 1]) {         // angry eyes: big dark eye, white glint, slanted brow
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), kind === 'golem' ? new THREE.MeshBasicMaterial({ color: 0xffd23c }) : eye); e.position.set(sx * 0.17, body.position.y + 0.06, 0.44); g.add(e);
        const h = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), white); h.position.set(sx * 0.19, body.position.y + 0.1, 0.5); g.add(h);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.04), eye); brow.position.set(sx * 0.17, body.position.y + 0.19, 0.47); brow.rotation.z = -sx * 0.45; g.add(brow);
      }
      const bar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xe23a2a, depthTest: false })); bar.center.set(0, 0.5); bar.scale.set(1, 0.12, 1); bar.position.set(-0.5, kind === 'golem' ? 1.75 : 1.2, 0); bar.renderOrder = 6; g.add(bar);
      const back = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3a2410, depthTest: false })); back.center.set(0, 0.5); back.scale.set(1.04, 0.16, 1); back.position.set(-0.52, bar.position.y, 0); back.renderOrder = 5; g.add(back);
      g.scale.setScalar(def.size); this.root.add(g);
      return { i, kind, def, g, body, bar, back, home: { x, z }, x, z, hp: def.hp, dead: 0, hitCool: 0, flash: 0, ph: i * 1.3 };
    });
    // sword slash arc shown for a moment in front of Ngọc
    this.slash = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.09, 6, 20, Math.PI * 0.9), new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.9, depthWrite: false })); this.slash.rotation.x = Math.PI / 2; this.slash.visible = false; api.scene.add(this.slash);
    this.setRegion(L.NAME);
  }
  setRegion(name) { this.root.visible = name === 'village'; for (const m of this.mobs) this.place(m); }
  place(m) { m.g.position.set(m.x, L.groundHeight(m.x, m.z), m.z); }
  /** Ngọc swings (J / F). Returns the number of monsters hit. */
  attack() {
    const { player, profile } = this.api, p = profile(); if (!this.root.visible || this.cool > 0 || !p) return 0;
    this.cool = 0.42; player.emote('Interact'); this.api.sfx('tick');
    this.slash.visible = true; this.slashT = 0.16; this.slash.position.set(player.pos.x, player.pos.y + 0.9, player.pos.z); this.slash.rotation.z = -player.yaw + Math.PI * 0.05;
    let hits = 0; const atk = playerAtk(p);
    for (const m of this.mobs) if (!m.dead && inArc(player.pos.x, player.pos.z, player.yaw, m.x, m.z, 2.4 + m.def.size * 0.3)) {
      hits += 1; m.hp -= atk; m.flash = 0.18;
      const dx = m.x - player.pos.x, dz = m.z - player.pos.z, d = Math.hypot(dx, dz) || 1, nx = m.x + dx / d * 0.9, nz = m.z + dz / d * 0.9; if (L.walkable(nx, nz, 0.5)) { m.x = nx; m.z = nz; }   // knock back
      if (m.hp <= 0) this.kill(m, p);
    }
    if (hits) this.api.sfx('correct');
    return hits;
  }
  kill(m, p) {
    m.dead = m.kind === 'golem' ? 40 : 14; m.g.visible = false;
    p.stats.gold += m.def.gold; addExp(p, m.def.exp); p.kills = (p.kills || 0) + 1;
    this.api.ui.toast(`+${m.def.exp} EXP   +${m.def.gold} ●`); this.api.save(); this.api.onChange();
  }
  update(dt, frozen) {
    if (!this.root.visible) return;
    const { player, profile } = this.api, p = profile(); if (!p) return;
    this.t += dt; this.cool = Math.max(0, this.cool - dt);
    if (this.slash.visible) { this.slashT -= dt; this.slash.material.opacity = Math.max(0, this.slashT / 0.16); if (this.slashT <= 0) this.slash.visible = false; }
    const hpMax = maxHp(p); if (p.stats.hp === undefined || p.stats.hp > hpMax) p.stats.hp = hpMax;
    let fighting = false;
    for (const m of this.mobs) {
      if (m.dead) { m.dead -= dt; if (m.dead <= 0) { m.dead = 0; m.hp = m.def.hp; m.x = m.home.x; m.z = m.home.z; m.g.visible = true; this.place(m); } continue; }
      const dx = player.pos.x - m.x, dz = player.pos.z - m.z, d = Math.hypot(dx, dz), far = Math.hypot(m.x - m.home.x, m.z - m.home.z);
      let vx = 0, vz = 0;
      if (!frozen && d < 9 && far < 13) { fighting = true; if (d > 0.9) { vx = dx / d; vz = dz / d; } }
      else if (far > 0.6) { vx = (m.home.x - m.x) / far; vz = (m.home.z - m.z) / far; if (far > 2) m.hp = Math.min(m.def.hp, m.hp + dt * 12); }
      const nx = m.x + vx * m.def.speed * dt, nz = m.z + vz * m.def.speed * dt; if ((vx || vz) && L.walkable(nx, nz, 0.45)) { m.x = nx; m.z = nz; }
      const hop = Math.abs(Math.sin(this.t * (m.kind === 'golem' ? 3 : 5) + m.ph)) * (vx || vz ? 0.22 : 0.08);
      m.g.position.set(m.x, L.groundHeight(m.x, m.z) + hop, m.z); if (vx || vz) m.g.rotation.y = Math.atan2(vx, vz);
      m.flash = Math.max(0, m.flash - dt); m.body.material.emissiveIntensity = m.flash > 0 ? 1.4 : 0.12;
      m.bar.scale.x = Math.max(0.001, m.hp / m.def.hp); const show = m.hp < m.def.hp || d < 9; m.bar.visible = m.back.visible = show;
      m.hitCool = Math.max(0, m.hitCool - dt);
      if (!frozen && d < 0.95 + m.def.size * 0.35 && m.hitCool <= 0) {
        m.hitCool = 1.1; p.stats.hp -= hurt(m.def.atk, p); this.api.sfx('wrong'); this.api.onChange();
        if (p.stats.hp <= 0) { p.stats.hp = hpMax; this.api.save(); this.api.respawn(); return; }
      }
    }
    if (!fighting && p.stats.hp < hpMax) { this.regen += dt; if (this.regen > 0.5) { this.regen = 0; p.stats.hp = Math.min(hpMax, p.stats.hp + 3); this.api.onChange(); } }
  }
  markers() { return this.root.visible ? this.mobs.filter((m) => !m.dead).map((m) => ({ x: m.x, z: m.z, text: '', color: m.kind === 'golem' ? '#8a8490' : m.kind === 'red' ? '#ff6a5a' : '#6ad05a', small: true })) : []; }
}
