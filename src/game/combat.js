// Wild monsters to train on: real-time fights with the J / F key. No English here: this is the "play" part.
// Monsters chase when Ngọc comes close, hit on contact, respawn after a while. Defeat sends Ngọc back to the
// village square with full health and no loss, so young players are never punished hard.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { MONSTERS, SPAWNS, FOREST_SPAWNS, playerAtk, hurt, inArc, huntsOf, hunt, countKill, huntLine, BOSSES, shieldDue } from '../core/rules.js';

// BOARD: on the Quest Square since 17/11 (was out at 29, -14), facing the fountain
export const BOARD = { x: -6.2, z: 0.6 }, BOSS_AT = { x: 40, z: -26 }, BOSS2_AT = { x: 46, z: 40 };
/** Map 2: the forest board by the entrance path, the Mushroom Queen's glade west of the old ruins (17/11). */
export const FOREST_BOARD = { x: -33.5, z: 46 }, BOSS3_AT = { x: -46, z: -24 };
const BOSS_NAMES = { boss1: 'Vua Slime', boss2: 'Golem Cổ', boss3: 'Nữ hoàng Nấm' };
import { addExp, maxHp } from '../core/save.js';
import { compact } from '../world/common.js';

export class Wild {
  /** api: { scene, player, ui, sfx(name), profile() -> profile, save(), onChange(), respawn(), quiz(bossName, done(ok)) } */
  constructor(api) {
    this.api = api; this.root = new THREE.Group(); api.scene.add(this.root); this.cool = 0; this.t = 0; this.regen = 0;
    const eye = new THREE.MeshBasicMaterial({ color: 0x24140c }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mobs = [...SPAWNS.map((r) => [...r, 'village']), ...FOREST_SPAWNS.map((r) => [...r, 'forest'])].map(([kind, x, z, region], i) => {
      const def = MONSTERS[kind], g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: kind === 'golem' ? 0.95 : 0.2, transparent: kind !== 'golem', opacity: kind === 'golem' ? 1 : 0.9, emissive: def.color, emissiveIntensity: 0.12, flatShading: kind === 'golem' });
      const body = new THREE.Mesh(kind === 'golem' ? new THREE.IcosahedronGeometry(0.55, 1) : new THREE.SphereGeometry(kind === 'bat' ? 0.34 : 0.5, 16, 12), mat);
      body.scale.set(1, kind === 'golem' ? 1.1 : kind === 'shroom' ? 0.75 : 0.8, 1); body.position.y = kind === 'golem' ? 0.6 : kind === 'bat' ? 1.3 : kind === 'shroom' ? 0.38 : 0.4; body.castShadow = true; body.userData.live = true; g.add(body);
      if (kind === 'shroom') {      // a red spotted cap on a pale stem body
        mat.color.set(0xf2e6cc); mat.emissive.set(0x403020); mat.transparent = false; mat.opacity = 1;
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6 })); cap.scale.y = 0.75; cap.position.y = 0.62; cap.castShadow = true; g.add(cap);
        for (let k = 0; k < 6; k++) { const a = k * 1.05, sp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), white); sp.position.set(Math.cos(a) * 0.38, 0.86, Math.sin(a) * 0.38); sp.scale.y = 0.4; g.add(sp); }
      }
      if (kind === 'bat') {         // two wings that flap (rebuilt each frame by rotation in update)
        mat.transparent = false; mat.opacity = 1;
        const wingGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.75, 0.2, -0.1), new THREE.Vector3(0.6, -0.15, 0.05), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.6, -0.15, 0.05), new THREE.Vector3(0.3, -0.2, 0.1)]);
        wingGeo.computeVertexNormals();
        const wm = new THREE.MeshStandardMaterial({ color: 0x3a2a5a, side: THREE.DoubleSide, roughness: 0.8 });
        for (const sx of [-1, 1]) { const w = new THREE.Mesh(wingGeo, wm); w.scale.x = sx; w.position.set(sx * 0.2, 1.32, 0); g.add(w); (g.userData.wings || (g.userData.wings = [])).push(w); }
      }
      if (kind === 'golem') { for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), mat); arm.position.set(sx * 0.66, 0.5, 0.1); arm.castShadow = true; g.add(arm); } const moss = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), new THREE.MeshStandardMaterial({ color: 0x74b84a })); moss.scale.y = 0.4; moss.position.y = 1.12; g.add(moss); }
      for (const sx of [-1, 1]) {         // angry eyes: big dark eye, white glint, slanted brow
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), kind === 'golem' ? new THREE.MeshBasicMaterial({ color: 0xffd23c }) : eye); e.position.set(sx * 0.17, body.position.y + 0.06, 0.44); g.add(e);
        const h = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), white); h.position.set(sx * 0.19, body.position.y + 0.1, 0.5); g.add(h);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.04), eye); brow.position.set(sx * 0.17, body.position.y + 0.19, 0.47); brow.rotation.z = -sx * 0.45; g.add(brow);
      }
      compact(g);        // eyes, brows, arms and moss become one mesh; the body stays separate because it flashes when hit
      const bar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xe23a2a, depthTest: false })); bar.center.set(0, 0.5); bar.scale.set(1, 0.12, 1); bar.position.set(-0.5, ({ golem: 1.75, bat: 1.95, shroom: 1.3 })[kind] || 1.2, 0); bar.renderOrder = 6; g.add(bar);
      const back = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3a2410, depthTest: false })); back.center.set(0, 0.5); back.scale.set(1.04, 0.16, 1); back.position.set(-0.52, bar.position.y, 0); back.renderOrder = 5; g.add(back);
      g.scale.setScalar(def.size); this.root.add(g);
      return { i, kind, def, region, g, body, bar, back, home: { x, z }, x, z, hp: def.hp, dead: 0, hitCool: 0, flash: 0, ph: i * 1.3 };
    });
    // Map 1's bosses wake up once Ngọc reaches their level: the Slime King in the meadow, the Ancient Golem in the golem fields
    this.bosses = BOSSES.map((def, k) => this.makeBoss(def, [BOSS_AT, BOSS2_AT, BOSS3_AT][k], eye));
    this.boss = this.bosses[0];
    // quest boards: the Quest Square in the village, the entrance path in the forest
    this.boards = [];
    for (const [at, region] of [[BOARD, 'village'], [FOREST_BOARD, 'forest']]) {
      const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 }), g = new THREE.Group();
      for (const sx of [-0.7, 0.7]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 6), wood); p.position.set(sx, 1.1, 0); g.add(p); }
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 0.1), new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.9 })); b.position.y = 1.6; g.add(b);
      for (const [x, y, c] of [[-0.45, 1.7, 0xfff4dc], [0.15, 1.55, 0xfff4dc], [0.55, 1.75, 0xffd8a0]]) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.02), new THREE.MeshStandardMaterial({ color: c })); n.position.set(x, y, 0.06); n.rotation.z = (x * 3) % 0.2; g.add(n); }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.5), wood); roof.position.y = 2.2; g.add(roof);
      compact(g); g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      g.position.set(at.x, L.REGIONS[region].groundHeight(at.x, at.z), at.z); g.rotation.y = region === 'village' ? Math.atan2(-at.x, 4 - at.z) : Math.PI / 2; g.scale.setScalar(1.25); this.root.add(g);
      this.boards.push({ at, region, g }); if (region === 'village') this.boardMesh = g;
    }
    // sword slash arc shown for a moment in front of Ngọc
    this.slash = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.09, 6, 20, Math.PI * 0.9), new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.9, depthWrite: false })); this.slash.rotation.x = Math.PI / 2; this.slash.visible = false; api.scene.add(this.slash);
    this.setRegion(L.NAME);
  }
  makeBoss(def, at, eye) {
    const g = new THREE.Group(), stone = def.id === 'ancient', queen = def.id === 'queen';
    const mat = new THREE.MeshStandardMaterial({ color: queen ? 0xf3e4c8 : def.color, roughness: stone ? 0.95 : 0.15, transparent: !stone, opacity: stone ? 1 : 0.9, emissive: def.color, emissiveIntensity: 0.12, flatShading: stone });
    const body = new THREE.Mesh(stone ? new THREE.IcosahedronGeometry(0.5, 1) : new THREE.SphereGeometry(0.5, 20, 14), mat); body.scale.set(1, stone ? 1.15 : 0.8, 1); body.position.y = stone ? 0.55 : 0.4; body.castShadow = true; body.userData.live = true; g.add(body);
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd23c, metalness: 0.8, roughness: 0.3, emissive: 0xb08010, emissiveIntensity: 0.4 });
    if (queen) {        // the Mushroom Queen: a wide spotted cap over a pale body, a golden crown, little leaf arms
      body.scale.set(0.8, 1.0, 0.8);
      const capMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.45, emissive: def.color, emissiveIntensity: 0.1 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMat); cap.scale.y = 0.6; cap.position.y = 0.72; cap.castShadow = true; g.add(cap);
      const rimC = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 24), capMat); rimC.rotation.x = Math.PI / 2; rimC.position.y = 0.72; g.add(rimC);
      const dot = new THREE.MeshStandardMaterial({ color: 0xfff6ea, roughness: 0.6 });
      for (let k = 0; k < 7; k++) { const a = k * 0.9, r = k % 2 ? 0.42 : 0.28, sp = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), dot); sp.position.set(Math.cos(a) * r, 0.72 + Math.sqrt(Math.max(0, 0.36 - r * r)) * 0.6, Math.sin(a) * r); sp.scale.y = 0.5; g.add(sp); }
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 10, 1, true), gold); crown.position.y = 1.12; g.add(crown);
      for (let k = 0; k < 5; k++) { const a = k * 1.257, sp = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), gold); sp.position.set(Math.cos(a) * 0.15, 1.22, Math.sin(a) * 0.15); g.add(sp); }
      const leaf = new THREE.MeshStandardMaterial({ color: 0x5fae48, roughness: 0.7 });
      for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), leaf); arm.scale.set(1.6, 0.5, 0.9); arm.position.set(sx * 0.42, 0.35, 0.05); arm.rotation.z = sx * 0.5; g.add(arm); }
    } else if (stone) {        // moss cap, glowing runes and big fists
      const moss = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 6), new THREE.MeshStandardMaterial({ color: 0x5fa040 })); moss.scale.y = 0.45; moss.position.y = 1.08; g.add(moss);
      for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), mat); arm.position.set(sx * 0.62, 0.42, 0.1); arm.castShadow = true; g.add(arm); }
      const rune = new THREE.MeshBasicMaterial({ color: 0x8fe8ff });
      for (const [x, y] of [[-0.2, 0.3], [0.22, 0.42], [0, 0.18]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), rune); r.position.set(x, y, 0.47); r.rotation.z = 0.78; g.add(r); }
    } else {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.14, 10, 1, true), gold); crown.position.y = 0.86; g.add(crown);
      for (let k = 0; k < 5; k++) { const a = k * 1.257, sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), gold); sp.position.set(Math.cos(a) * 0.22, 1.0, Math.sin(a) * 0.22); g.add(sp); }
    }
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), stone ? new THREE.MeshBasicMaterial({ color: 0x8fe8ff }) : eye); e.position.set(sx * 0.15, stone ? 0.7 : queen ? 0.42 : 0.48, queen ? 0.38 : 0.44); g.add(e); const brow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), eye); brow.position.set(sx * 0.15, stone ? 0.82 : queen ? 0.53 : 0.6, queen ? 0.4 : 0.46); brow.rotation.z = -sx * 0.5; g.add(brow); }
    compact(g);
    const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.3, wireframe: true, depthWrite: false })); shield.position.y = 0.45; shield.visible = false; g.add(shield);
    const top = stone ? 1.45 : queen ? 1.45 : 1.25;
    const bar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xe23a2a, depthTest: false })); bar.center.set(0, 0.5); bar.scale.set(1, 0.07, 1); bar.position.set(-0.5, top, 0); bar.renderOrder = 6; g.add(bar);
    const back = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3a2410, depthTest: false })); back.center.set(0, 0.5); back.scale.set(1.04, 0.1, 1); back.position.set(-0.52, top, 0); back.renderOrder = 5; g.add(back);
    g.scale.setScalar(def.size); this.root.add(g);
    const m = { i: this.mobs.length, kind: def.id, boss: true, region: def.region || 'village', def, g, body, bar, back, shield, home: { ...at }, x: at.x, z: at.z, hp: def.hp, dead: 0, hitCool: 0, flash: 0, ph: 0, broken: 0, shieldOn: false };
    this.mobs.push(m); return m;
  }
  /** Village: meadow monsters, bosses and the board. Forest: Map 2 monsters, only once Map 2 is open. */
  setRegion(name) {
    this.region = name; this.root.visible = name === 'village' || name === 'forest'; for (const b of this.boards || []) b.g.visible = b.region === name;
    for (const m of this.mobs) { if (m.region === name) this.place(m); else m.g.visible = false; }
  }
  /** A monster takes part when it lives in this region (forest ones wait for Map 2). */
  here(m, p) { return m.region === this.region && (m.region !== 'forest' || !!(p && p.flags.map2)); }
  place(m) { m.g.position.set(m.x, L.groundHeight(m.x, m.z), m.z); }
  /** K: a quick roll forward. Monsters cannot hurt Ngọc for half a second. */
  dodge() {
    const { player } = this.api; if (!this.root.visible || this.rollCool > 0) return false;
    this.rollCool = 0.8; this.iframes = 0.5; player.emote('Jump'); this.api.sfx('tick');
    let x = player.pos.x, z = player.pos.z; const dx = Math.sin(player.yaw), dz = Math.cos(player.yaw);
    for (let d = 0; d < 3.2; d += 0.2) { const nx = x + dx * 0.2, nz = z + dz * 0.2; if (!L.canStep(x, z, nx, nz)) break; x = nx; z = nz; }
    const yaw = player.yaw; player.place(x, z); player.yaw = yaw; return true;
  }
  /** Ngọc swings (J / F). Returns the number of monsters hit. */
  attack() {
    const { player, profile } = this.api, p = profile(); if (!this.root.visible || this.cool > 0 || !p) return 0;
    this.cool = 0.42; player.emote('Interact'); this.api.sfx('tick');
    this.slash.visible = true; this.slashT = 0.16; this.slash.position.set(player.pos.x, player.pos.y + 0.9, player.pos.z); this.slash.rotation.z = -player.yaw + Math.PI * 0.05;
    let hits = 0; const atk = playerAtk(p);
    for (const m of this.mobs) if (!m.dead && this.here(m, p) && inArc(player.pos.x, player.pos.z, player.yaw, m.x, m.z, 2.4 + m.def.size * 0.3)) {
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
    const first = m.boss && !p.flags[m.def.flag], k = m.boss && !first ? 0.25 : 1, gold = Math.round(m.def.gold * k), exp = Math.round(m.def.exp * k);
    p.stats.gold += gold; addExp(p, exp); p.kills = (p.kills || 0) + 1;
    if (m.boss) { m.broken = 0; m.shieldOn = false; m.shield.visible = false; p.flags[m.def.flag] = true; }
    if (countKill(p, m.kind)) this.api.ui.toast('Quest done! Go back to the board');
    else this.api.ui.toast(`+${exp} EXP   +${gold} ●`);
    if (first && m.def.flag === 'boss1') this.api.ui.dialogue([{ who: 'Ngọc', en: `I defeated the Slime King! (+${gold} gold, +${exp} EXP)`, vi: 'Con đã thắng Vua Slime! Ở cấp 18, Golem Cổ sẽ thức dậy ở cánh đồng đá phía Đông Nam.' }]);
    if (first && m.def.flag === 'boss3') this.api.ui.dialogue([{ who: 'Ngọc', en: `I defeated the Mushroom Queen! The forest remembers its words again! (+${gold} gold, +${exp} EXP)`, vi: 'Con đã thắng Nữ hoàng Nấm, trùm của Rừng Ký Ức!' }]);
    if (first && m.def.flag === 'boss2') this.api.ui.dialogue([{ who: 'Ngọc', en: `I defeated the Ancient Golem! (+${gold} gold, +${exp} EXP)`, vi: p.stats.level >= 20 ? 'Cổng Map 2 đã mở!' : 'Đạt cấp 20 (qua cổng Cú Mèo) là mở được Map 2.' }]);
    this.api.save(); this.api.onChange();
  }
  /** E near the board, or near the shielded boss. */
  interact(pos) {
    if (!this.root.visible) return null;
    const p = this.api.profile();
    for (const b of this.bosses) if (b.g.visible && b.shieldOn && this.here(b, p) && Math.hypot(pos.x - b.x, pos.z - b.z) < 2.2 + b.def.size * 0.5) return { text: 'E · Phá khiên chữ của ' + BOSS_NAMES[b.def.flag], run: () => this.api.quiz(b.def.name, (ok) => {
      if (ok) { b.shieldOn = false; b.shield.visible = false; b.broken += 1; this.api.sfx('fanfare'); this.api.ui.toast('Shield broken!'); }
      else { b.hp = Math.min(b.def.hp * [1, 0.75, 0.5][b.broken], b.hp + b.def.hp * 0.07); this.api.sfx('wrong'); }
      this.api.onChange(); }) };
    for (const bd of this.boards) if (bd.region === this.region && Math.hypot(pos.x - bd.at.x, pos.z - bd.at.z) < 2.2) {
      if (bd.region === 'forest' && !(p && p.flags.map2)) return { text: 'Bảng nhiệm vụ rừng: mở khi tới Map 2', run() {} };
      return { text: 'E · Bảng nhiệm vụ săn quái', run: () => this.board() };
    }
    return null;
  }
  board() {
    const { ui, profile } = this.api, p = profile(), list = huntsOf(this.region), h = hunt(p, this.region), q = list[h.i % list.length], name = MONSTERS[q.kind].name;
    if (!h.active) { ui.dialogue([{ who: 'Quest board', en: huntLine(q, p.grade), vi: `Nhiệm vụ: hạ ${q.need} ${name}. Thưởng ${q.gold} vàng, ${q.exp} EXP.` }], () => { h.active = true; h.got = 0; this.api.sfx('tick'); this.api.save(); this.api.onChange(); }); return; }
    if (h.got < q.need) { ui.dialogue([{ who: 'Quest board', en: `${name}: ${h.got} of ${q.need}. Keep going!` }]); return; }
    p.stats.gold += q.gold; addExp(p, q.exp); h.done += 1; h.i += 1; h.active = false; h.got = 0; this.api.sfx('fanfare');
    ui.dialogue([{ who: 'Quest board', en: `Thank you, hero! (+${q.gold} gold, +${q.exp} EXP)`, vi: 'Quay lại bảng để nhận nhiệm vụ mới.' }]); this.api.save(); this.api.onChange();
  }
  /** Short text for the HUD while a hunt of this region's board is running. */
  huntNote() { const p = this.api.profile(); if (!p) return ''; const k = this.region === 'forest' ? 'hunt2' : 'hunt', h = p[k]; if (!h || !h.active) return ''; const list = huntsOf(this.region), q = list[h.i % list.length]; return `⚔ ${Math.min(h.got, q.need)}/${q.need}`; }
  update(dt, frozen) {
    if (!this.root.visible) return;
    const { player, profile } = this.api, p = profile(); if (!p) return;
    this.t += dt; this.cool = Math.max(0, this.cool - dt); this.rollCool = Math.max(0, (this.rollCool || 0) - dt); this.iframes = Math.max(0, (this.iframes || 0) - dt);
    if (this.slash.visible) { this.slashT -= dt; this.slash.material.opacity = Math.max(0, this.slashT / 0.16); if (this.slashT <= 0) this.slash.visible = false; }
    const hpMax = maxHp(p); if (p.stats.hp === undefined || p.stats.hp > hpMax) p.stats.hp = hpMax;
    let fighting = false;
    for (const m of this.mobs) {
      if (!this.here(m, p)) { if (m.g.visible) m.g.visible = false; continue; }
      if (!m.boss && !m.dead && !m.g.visible) { m.g.visible = true; this.place(m); }
      if (m.boss && p.stats.level < m.def.level) { m.g.visible = false; continue; }
      if (m.boss && !m.dead && !m.g.visible) { m.g.visible = true; this.place(m); }
      if (m.dead) { m.dead -= dt; if (m.dead <= 0) { m.dead = 0; m.hp = m.def.hp; if (m.boss) { m.broken = 0; m.shieldOn = false; m.shield.visible = false; } m.x = m.home.x; m.z = m.home.z; m.g.visible = true; this.place(m); } continue; }
      const dx = player.pos.x - m.x, dz = player.pos.z - m.z, d = Math.hypot(dx, dz), far = Math.hypot(m.x - m.home.x, m.z - m.home.z);
      let vx = 0, vz = 0;
      if (!frozen && d < 9 && far < 13) { fighting = true; if (d > 0.9) { vx = dx / d; vz = dz / d; } }
      else if (far > 0.6) { vx = (m.home.x - m.x) / far; vz = (m.home.z - m.z) / far; if (far > 2) m.hp = Math.min(m.def.hp, m.hp + dt * 12); }
      const nx = m.x + vx * m.def.speed * dt, nz = m.z + vz * m.def.speed * dt; if ((vx || vz) && L.walkable(nx, nz, 0.45)) { m.x = nx; m.z = nz; }
      const hop = Math.abs(Math.sin(this.t * (m.kind === 'golem' ? 3 : 5) + m.ph)) * (vx || vz ? 0.22 : 0.08);
      m.g.position.set(m.x, L.groundHeight(m.x, m.z) + hop, m.z); if (vx || vz) m.g.rotation.y = Math.atan2(vx, vz);
      if (m.g.userData.wings) for (const [k, w] of m.g.userData.wings.entries()) w.rotation.z = (k ? -1 : 1) * Math.sin(this.t * 14 + m.ph) * 0.6;   // bats flap
      m.flash = Math.max(0, m.flash - dt); m.body.material.emissiveIntensity = m.flash > 0 ? 1.4 : 0.12;
      if (m.shieldOn) m.shield.rotation.y += dt * 1.5;
      m.bar.scale.x = Math.max(0.001, m.hp / m.def.hp); const show = m.hp < m.def.hp || d < 9; m.bar.visible = m.back.visible = show;
      m.hitCool = Math.max(0, m.hitCool - dt);
      if (!frozen && !this.iframes && d < 0.95 + m.def.size * 0.35 && m.hitCool <= 0) {
        m.hitCool = 1.1; if (!p.god) p.stats.hp -= hurt(m.def.atk, p); this.api.sfx('wrong'); this.api.onChange();      // god: admin's no-damage switch
        if (p.stats.hp <= 0) { p.stats.hp = hpMax; this.api.save(); this.api.respawn(); return; }
      }
    }
    if (!fighting && p.stats.hp < hpMax) { this.regen += dt; if (this.regen > 0.5) { this.regen = 0; p.stats.hp = Math.min(hpMax, p.stats.hp + 3); this.api.onChange(); } }
  }
  markers() {
    if (!this.root.visible) return [];
    const p = this.api.profile(), out = [];
    if (p && (this.region === 'village' || p.flags.map2)) {
      const list = huntsOf(this.region), h = hunt(p, this.region), q = list[h.i % list.length], at = this.region === 'forest' ? FOREST_BOARD : BOARD;
      if (!h.active || h.got >= q.need) out.push({ x: at.x, z: at.z, text: '!', color: '#ffd23c' });
    }
    for (const b of this.bosses) if (b.g.visible && !b.dead && this.here(b, p)) out.push({ x: b.x, z: b.z, text: '♛', color: ({ boss1: '#8fd8ff', boss2: '#e0c890', boss3: '#f08ac0' })[b.def.flag] });
    return out.concat(this.mobs.filter((m) => !m.dead && !m.boss && this.here(m, p)).map((m) => ({ x: m.x, z: m.z, text: '', color: ({ golem: '#8a8490', red: '#ff6a5a', bat: '#9a7ad0', shroom: '#e2483e' })[m.kind] || '#6ad05a', small: true })));
  }
}
