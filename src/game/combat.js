// Wild monsters to train on: real-time fights with the J / F key. No English here: this is the "play" part.
// Monsters chase when Ngọc comes close, hit on contact, respawn after a while. Defeat sends Ngọc back to the
// village square with full health and no loss, so young players are never punished hard.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { MONSTERS, SPAWNS, playerAtk, hurt, inArc, HUNTS, hunt, countKill, huntLine, BOSS, shieldDue } from '../core/rules.js';

export const BOARD = { x: 29, z: -14 }, BOSS_AT = { x: 40, z: -26 };
import { addExp, maxHp } from '../core/save.js';
import { compact } from '../world/forest.js';

export class Wild {
  /** api: { scene, player, ui, sfx(name), profile() -> profile, save(), onChange(), respawn(), quiz(done(ok)) } */
  constructor(api) {
    this.api = api; this.root = new THREE.Group(); api.scene.add(this.root); this.cool = 0; this.t = 0; this.regen = 0;
    const eye = new THREE.MeshBasicMaterial({ color: 0x24140c }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mobs = SPAWNS.map(([kind, x, z], i) => {
      const def = MONSTERS[kind], g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: kind === 'golem' ? 0.95 : 0.2, transparent: kind !== 'golem', opacity: kind === 'golem' ? 1 : 0.9, emissive: def.color, emissiveIntensity: 0.12, flatShading: kind === 'golem' });
      const body = new THREE.Mesh(kind === 'golem' ? new THREE.IcosahedronGeometry(0.55, 1) : new THREE.SphereGeometry(0.5, 16, 12), mat); body.scale.set(1, kind === 'golem' ? 1.1 : 0.8, 1); body.position.y = kind === 'golem' ? 0.6 : 0.4; body.castShadow = true; body.userData.live = true; g.add(body);
      if (kind === 'golem') { for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), mat); arm.position.set(sx * 0.66, 0.5, 0.1); arm.castShadow = true; g.add(arm); } const moss = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), new THREE.MeshStandardMaterial({ color: 0x74b84a })); moss.scale.y = 0.4; moss.position.y = 1.12; g.add(moss); }
      for (const sx of [-1, 1]) {         // angry eyes: big dark eye, white glint, slanted brow
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), kind === 'golem' ? new THREE.MeshBasicMaterial({ color: 0xffd23c }) : eye); e.position.set(sx * 0.17, body.position.y + 0.06, 0.44); g.add(e);
        const h = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), white); h.position.set(sx * 0.19, body.position.y + 0.1, 0.5); g.add(h);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.04), eye); brow.position.set(sx * 0.17, body.position.y + 0.19, 0.47); brow.rotation.z = -sx * 0.45; g.add(brow);
      }
      compact(g);        // eyes, brows, arms and moss become one mesh; the body stays separate because it flashes when hit
      const bar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xe23a2a, depthTest: false })); bar.center.set(0, 0.5); bar.scale.set(1, 0.12, 1); bar.position.set(-0.5, kind === 'golem' ? 1.75 : 1.2, 0); bar.renderOrder = 6; g.add(bar);
      const back = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3a2410, depthTest: false })); back.center.set(0, 0.5); back.scale.set(1.04, 0.16, 1); back.position.set(-0.52, bar.position.y, 0); back.renderOrder = 5; g.add(back);
      g.scale.setScalar(def.size); this.root.add(g);
      return { i, kind, def, g, body, bar, back, home: { x, z }, x, z, hp: def.hp, dead: 0, hitCool: 0, flash: 0, ph: i * 1.3 };
    });
    // the Slime King: a big crowned slime that wakes up once Ngọc reaches its level
    {
      const def = BOSS, g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.15, transparent: true, opacity: 0.9, emissive: def.color, emissiveIntensity: 0.12 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), mat); body.scale.set(1, 0.8, 1); body.position.y = 0.4; body.castShadow = true; body.userData.live = true; g.add(body);
      const gold = new THREE.MeshStandardMaterial({ color: 0xffd23c, metalness: 0.8, roughness: 0.3, emissive: 0xb08010, emissiveIntensity: 0.4 });
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.14, 10, 1, true), gold); crown.position.y = 0.86; g.add(crown);
      for (let k = 0; k < 5; k++) { const a = k * 1.257, sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), gold); sp.position.set(Math.cos(a) * 0.22, 1.0, Math.sin(a) * 0.22); g.add(sp); }
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), eye); e.position.set(sx * 0.15, 0.48, 0.44); g.add(e); const brow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), eye); brow.position.set(sx * 0.15, 0.6, 0.46); brow.rotation.z = -sx * 0.5; g.add(brow); }
      compact(g);
      const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.3, wireframe: true, depthWrite: false })); shield.position.y = 0.45; shield.visible = false; g.add(shield);
      const bar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xe23a2a, depthTest: false })); bar.center.set(0, 0.5); bar.scale.set(1, 0.07, 1); bar.position.set(-0.5, 1.25, 0); bar.renderOrder = 6; g.add(bar);
      const back = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3a2410, depthTest: false })); back.center.set(0, 0.5); back.scale.set(1.04, 0.1, 1); back.position.set(-0.52, 1.25, 0); back.renderOrder = 5; g.add(back);
      g.scale.setScalar(def.size); this.root.add(g);
      this.boss = { i: this.mobs.length, kind: 'king', boss: true, def, g, body, bar, back, shield, home: { ...BOSS_AT }, x: BOSS_AT.x, z: BOSS_AT.z, hp: def.hp, dead: 0, hitCool: 0, flash: 0, ph: 0, broken: 0, shieldOn: false };
      this.mobs.push(this.boss);
    }
    // quest board at the edge of the meadow
    {
      const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 }), g = new THREE.Group();
      for (const sx of [-0.7, 0.7]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 6), wood); p.position.set(sx, 1.1, 0); g.add(p); }
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 0.1), new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.9 })); b.position.y = 1.6; g.add(b);
      for (const [x, y, c] of [[-0.45, 1.7, 0xfff4dc], [0.15, 1.55, 0xfff4dc], [0.55, 1.75, 0xffd8a0]]) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.02), new THREE.MeshStandardMaterial({ color: c })); n.position.set(x, y, 0.06); n.rotation.z = (x * 3) % 0.2; g.add(n); }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.5), wood); roof.position.y = 2.2; g.add(roof);
      compact(g); g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      g.position.set(BOARD.x, L.REGIONS.village.groundHeight(BOARD.x, BOARD.z), BOARD.z); g.rotation.y = -2.2; this.root.add(g);
    }
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
      if (m.shieldOn) { hits += 1; m.flash = 0.1; if (!this.shieldTold) { this.shieldTold = true; this.api.ui.toast('Word shield! Press E'); } continue; }
      hits += 1; m.hp -= atk; m.flash = 0.18;
      if (m.boss && shieldDue(m.hp, m.def.hp, m.broken)) { m.shieldOn = true; m.shield.visible = true; this.shieldTold = false; this.api.ui.toast('Word shield! Press E'); this.api.sfx('wrong'); }
      const dx = m.x - player.pos.x, dz = m.z - player.pos.z, d = Math.hypot(dx, dz) || 1, nx = m.x + dx / d * 0.9, nz = m.z + dz / d * 0.9; if (L.walkable(nx, nz, 0.5)) { m.x = nx; m.z = nz; }   // knock back
      if (m.hp <= 0) this.kill(m, p);
    }
    if (hits) this.api.sfx('correct');
    return hits;
  }
  kill(m, p) {
    m.dead = m.boss ? 300 : m.kind === 'golem' ? 40 : 14; m.g.visible = false;
    const first = m.boss && !p.flags.boss1, k = m.boss && !first ? 0.25 : 1, gold = Math.round(m.def.gold * k), exp = Math.round(m.def.exp * k);
    p.stats.gold += gold; addExp(p, exp); p.kills = (p.kills || 0) + 1;
    if (m.boss) { m.broken = 0; m.shieldOn = false; m.shield.visible = false; p.flags.boss1 = true; }
    if (countKill(p, m.kind)) this.api.ui.toast('Quest done! Go back to the board');
    else this.api.ui.toast(`+${exp} EXP   +${gold} ●`);
    if (first) this.api.ui.dialogue([{ who: 'Ngọc', en: `I defeated the Slime King! (+${gold} gold, +${exp} EXP)`, vi: 'Con đã thắng Vua Slime của Đồng Hoang! Vua Slime sẽ quay lại sau, nhưng ít thưởng hơn.' }]);
    this.api.save(); this.api.onChange();
  }
  /** E near the board, or near the shielded boss. */
  interact(pos) {
    if (!this.root.visible) return null;
    const b = this.boss;
    if (b.g.visible && b.shieldOn && Math.hypot(pos.x - b.x, pos.z - b.z) < 2.2 + b.def.size * 0.5) return { text: 'E · Phá khiên chữ của Vua Slime', run: () => this.api.quiz((ok) => {
      if (ok) { b.shieldOn = false; b.shield.visible = false; b.broken += 1; this.api.sfx('fanfare'); this.api.ui.toast('Shield broken!'); }
      else { b.hp = Math.min(b.def.hp * [1, 0.75, 0.5][b.broken], b.hp + 40); this.api.sfx('wrong'); }
      this.api.onChange(); }) };
    if (Math.hypot(pos.x - BOARD.x, pos.z - BOARD.z) < 2.2) return { text: 'E · Bảng nhiệm vụ săn quái', run: () => this.board() };
    return null;
  }
  board() {
    const { ui, profile } = this.api, p = profile(), h = hunt(p), q = HUNTS[h.i % HUNTS.length], name = MONSTERS[q.kind].name;
    if (!h.active) { ui.dialogue([{ who: 'Quest board', en: huntLine(q, p.grade), vi: `Nhiệm vụ: hạ ${q.need} ${name}. Thưởng ${q.gold} vàng, ${q.exp} EXP.` }], () => { h.active = true; h.got = 0; this.api.sfx('tick'); this.api.save(); this.api.onChange(); }); return; }
    if (h.got < q.need) { ui.dialogue([{ who: 'Quest board', en: `${name}: ${h.got} of ${q.need}. Keep going!` }]); return; }
    p.stats.gold += q.gold; addExp(p, q.exp); h.done += 1; h.i += 1; h.active = false; h.got = 0; this.api.sfx('fanfare');
    ui.dialogue([{ who: 'Quest board', en: `Thank you, hero! (+${q.gold} gold, +${q.exp} EXP)`, vi: 'Quay lại bảng để nhận nhiệm vụ mới.' }]); this.api.save(); this.api.onChange();
  }
  /** Short text for the HUD while a hunt is running. */
  huntNote() { const p = this.api.profile(); if (!p || !p.hunt || !p.hunt.active) return ''; const q = HUNTS[p.hunt.i % HUNTS.length]; return `⚔ ${Math.min(p.hunt.got, q.need)}/${q.need}`; }
  update(dt, frozen) {
    if (!this.root.visible) return;
    const { player, profile } = this.api, p = profile(); if (!p) return;
    this.t += dt; this.cool = Math.max(0, this.cool - dt);
    if (this.slash.visible) { this.slashT -= dt; this.slash.material.opacity = Math.max(0, this.slashT / 0.16); if (this.slashT <= 0) this.slash.visible = false; }
    const hpMax = maxHp(p); if (p.stats.hp === undefined || p.stats.hp > hpMax) p.stats.hp = hpMax;
    let fighting = false;
    for (const m of this.mobs) {
      if (m.boss && p.stats.level < BOSS.level) { m.g.visible = false; continue; }
      if (m.boss && !m.dead && !m.g.visible) { m.g.visible = true; this.place(m); }
      if (m.dead) { m.dead -= dt; if (m.dead <= 0) { m.dead = 0; m.hp = m.def.hp; if (m.boss) { m.broken = 0; m.shieldOn = false; m.shield.visible = false; } m.x = m.home.x; m.z = m.home.z; m.g.visible = true; this.place(m); } continue; }
      const dx = player.pos.x - m.x, dz = player.pos.z - m.z, d = Math.hypot(dx, dz), far = Math.hypot(m.x - m.home.x, m.z - m.home.z);
      let vx = 0, vz = 0;
      if (!frozen && d < 9 && far < 13) { fighting = true; if (d > 0.9) { vx = dx / d; vz = dz / d; } }
      else if (far > 0.6) { vx = (m.home.x - m.x) / far; vz = (m.home.z - m.z) / far; if (far > 2) m.hp = Math.min(m.def.hp, m.hp + dt * 12); }
      const nx = m.x + vx * m.def.speed * dt, nz = m.z + vz * m.def.speed * dt; if ((vx || vz) && L.walkable(nx, nz, 0.45)) { m.x = nx; m.z = nz; }
      const hop = Math.abs(Math.sin(this.t * (m.kind === 'golem' ? 3 : 5) + m.ph)) * (vx || vz ? 0.22 : 0.08);
      m.g.position.set(m.x, L.groundHeight(m.x, m.z) + hop, m.z); if (vx || vz) m.g.rotation.y = Math.atan2(vx, vz);
      m.flash = Math.max(0, m.flash - dt); m.body.material.emissiveIntensity = m.flash > 0 ? 1.4 : 0.12;
      if (m.shieldOn) m.shield.rotation.y += dt * 1.5;
      m.bar.scale.x = Math.max(0.001, m.hp / m.def.hp); const show = m.hp < m.def.hp || d < 9; m.bar.visible = m.back.visible = show;
      m.hitCool = Math.max(0, m.hitCool - dt);
      if (!frozen && d < 0.95 + m.def.size * 0.35 && m.hitCool <= 0) {
        m.hitCool = 1.1; p.stats.hp -= hurt(m.def.atk, p); this.api.sfx('wrong'); this.api.onChange();
        if (p.stats.hp <= 0) { p.stats.hp = hpMax; this.api.save(); this.api.respawn(); return; }
      }
    }
    if (!fighting && p.stats.hp < hpMax) { this.regen += dt; if (this.regen > 0.5) { this.regen = 0; p.stats.hp = Math.min(hpMax, p.stats.hp + 3); this.api.onChange(); } }
  }
  markers() {
    if (!this.root.visible) return [];
    const p = this.api.profile(), h = p && p.hunt, q = h && HUNTS[h.i % HUNTS.length], out = [];
    if (!h || !h.active || h.got >= q.need) out.push({ x: BOARD.x, z: BOARD.z, text: '!', color: '#ffd23c' });
    if (this.boss.g.visible && !this.boss.dead) out.push({ x: this.boss.x, z: this.boss.z, text: '♛', color: '#8fd8ff' });
    return out.concat(this.mobs.filter((m) => !m.dead && !m.boss).map((m) => ({ x: m.x, z: m.z, text: '', color: m.kind === 'golem' ? '#8a8490' : m.kind === 'red' ? '#ff6a5a' : '#6ad05a', small: true })));
  }
}
