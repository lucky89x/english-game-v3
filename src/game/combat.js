// Wild monsters to train on: real-time fights with the J / F key. No English here: this is the "play" part.
// Monsters chase when Ngọc comes close, hit on contact, respawn after a while. Defeat sends Ngọc back to the
// village square with full health and no loss, so young players are never punished hard.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PLAY } from '../core/regions/harbor.js';
import { ITEMS, bag, lootRoll, giveLoot, lootCloth, MONSTERS, SPAWNS, FOREST_SPAWNS, HARBOR_SPAWNS, HUNT_KEY, forestChapter, inSafe, CHASE, RESPAWN, playerAtk, hurt, inArc, huntsOf, hunt, countKill, huntLine, BOSSES, BOSS4, shieldDue } from '../core/rules.js';

// BOARD: on the Quest Square since 17/11 (was out at 29, -14), facing the fountain
export const BOARD = { x: -6.2, z: 0.6 }, BOSS_AT = { x: 38, z: -52 }, BOSS2_AT = { x: 49, z: -44 };      // (24/11) the Slime King in the meadow's far north, the Ancient Golem on the clearing in the north-east of the FOREST
/** Map 2: the forest board by the entrance path, the Mushroom Queen's glade west of the old ruins (17/11). */
export const FOREST_BOARD = { x: -33.5, z: 46 }, BOSS3_AT = { x: -46, z: -24 };
/** Map 2 (Sunny Harbor, 18/11): the board beside the harbour square, Captain Octopus's cove next to the lighthouse. */
export const HARBOR_BOARD = PLAY.board, BOSS4_AT = PLAY.boss;
const BOARD_OF = { village: BOARD, forest: FOREST_BOARD, harbor: HARBOR_BOARD };
const BOSS_NAMES = { boss1: 'Vua Slime', boss2: 'Golem Cổ', boss3: 'Nữ hoàng Nấm', boss4: 'Thuyền trưởng Bạch Tuộc' };
import { addExp, maxHp, killExp, atCap, capGold } from '../core/save.js';
import { levelCap } from '../core/progress.js';
import { compact, label } from '../world/common.js';
import { ZONES } from '../core/zones.js';
import { bossWake } from './saga.js';
import { ELEMENTS, elementFactor, comboOf, powers } from '../core/skills.js';

/** Round badge texture per element, drawn once: a coloured disc with a light rim and the element's emoji (🔥 ❄️ 🌪️ ⚡). */
const ELTEX = {}, LVTEX = {};
function elementTex(el) {
  if (ELTEX[el]) return ELTEX[el];
  const e = ELEMENTS[el], cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d');
  c.beginPath(); c.arc(48, 48, 44, 0, 7); c.fillStyle = '#2a1c14'; c.fill();
  c.beginPath(); c.arc(48, 48, 38, 0, 7); c.fillStyle = e.color; c.fill(); c.lineWidth = 4; c.strokeStyle = '#fff6dc'; c.stroke();
  c.font = '48px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e.icon, 48, 53);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (ELTEX[el] = t);
}
export class Wild {
  /** api: { scene, player, ui, sfx(name), profile() -> profile, save(), onChange(), respawn(), quiz(bossName, done(ok)) } */
  constructor(api) {
    this.api = api; this.shots = []; this.root = new THREE.Group(); api.scene.add(this.root); this.cool = 0; this.t = 0; this.regen = 0;
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
    this.bosses = BOSSES.filter((def) => def.region !== 'harbor').map((def, k) => this.makeBoss(def, [BOSS_AT, BOSS2_AT, BOSS3_AT][k], eye));      // Captain Octopus is built with the harbor (addHarbor)
    this.boss = this.bosses[0];
    // quest boards: the Quest Square in the village, the entrance path in the forest
    this.boards = [];
    for (const [at, region] of [[BOARD, 'village'], [FOREST_BOARD, 'forest'], [HARBOR_BOARD, 'harbor']]) {
      const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 }), g = new THREE.Group();
      for (const sx of [-0.7, 0.7]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 6), wood); p.position.set(sx, 1.1, 0); g.add(p); }
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 0.1), new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.9 })); b.position.y = 1.6; g.add(b);
      for (const [x, y, c] of [[-0.45, 1.7, 0xfff4dc], [0.15, 1.55, 0xfff4dc], [0.55, 1.75, 0xffd8a0]]) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.02), new THREE.MeshStandardMaterial({ color: c })); n.position.set(x, y, 0.06); n.rotation.z = (x * 3) % 0.2; g.add(n); }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.5), wood); roof.position.y = 2.2; g.add(roof);
      compact(g); g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      g.position.set(at.x, L.REGIONS[region].groundHeight(at.x, at.z), at.z); g.rotation.y = region === 'village' ? Math.atan2(-at.x, 4 - at.z) : region === 'harbor' ? 0.55 : Math.PI / 2; g.scale.setScalar(1.25); this.root.add(g);
      this.boards.push({ at, region, g }); if (region === 'village') this.boardMesh = g;
    }
    // (24/11) a floating sign over the middle of every hunting ground: its name, its level, one kind of monster only
    this.signs = [];
    for (const [region, list] of Object.entries(ZONES)) for (const z of list) {
      const def = MONSTERS[z.kind], sp = label(`${z.icon} ${z.vi}\nLv ${def.level}${def.elite ? ' · tinh anh' : ''}`, { size: 30, scale: 1.1 }); sp.position.set(z.x, L.REGIONS[region].groundHeight(z.x, z.z) + 4.6, z.z); sp.renderOrder = 7; sp.userData.region = region; sp.visible = false; this.root.add(sp); this.signs.push(sp);
    }
    // sword slash arc shown for a moment in front of Ngọc
    this.slash = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.09, 6, 20, Math.PI * 0.9), new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.9, depthWrite: false })); this.slash.rotation.x = Math.PI / 2; this.slash.visible = false; api.scene.add(this.slash);
    // (21/11) target lock: a red ring under the locked monster, a soft white one under the monster the mouse points at
    const ringOf = (hex, o) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.9, 36), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); r.rotation.x = -Math.PI / 2; r.visible = false; r.renderOrder = 3; api.scene.add(r); return r; };
    this.target = null; this.hover = null; this.tRing = ringOf(0xff4a3a, 0.85); this.hRing = ringOf(0xffffff, 0.45);
    this.setRegion(L.NAME);
  }
  /** Locks a monster as the target (null clears). Spells aim at it and the hero keeps hitting it while in reach. */
  setTarget(m) { this.target = m && !m.dead ? m : null; }
  /** The monster closest to screen point (sx, sy) in pixels, within 60 px, or null. project(v) -> {x, y} in pixels. */
  pick(sx, sy, project) {
    let best = null, bd = 60; const p = this.api.profile();
    for (const m of this.targets(p)) { const s = project(m.x, L.groundHeight(m.x, m.z) + 0.7 * m.def.size * (m.def.fit || 1), m.z); if (!s) continue; const d = Math.hypot(s.x - sx, s.y - sy); if (d < bd) { bd = d; best = m; } }
    return best;
  }
  /** Reach of the hero's sword against this monster. */
  reach(m) { return 2.3 + m.def.size * 0.3; }
  /** Swings at the locked target when it is in reach (auto attack), turning the hero to face it. Returns true when it swung. */
  autoHit() {
    const m = this.target, { player } = this.api; if (!m || m.dead || this.cool > 0) return false;
    const d = Math.hypot(m.x - player.pos.x, m.z - player.pos.z); if (d > this.reach(m)) return false;
    player.yaw = Math.atan2(m.x - player.pos.x, m.z - player.pos.z); this.attack(); return true;
  }
  syncRings() {
    const t = this.target, h = this.hover && this.hover !== t ? this.hover : null, k = 1 + Math.sin(this.t * 6) * 0.06;
    for (const [r, m] of [[this.tRing, t], [this.hRing, h]]) { r.visible = !!m && m.g.visible && !m.dead; if (r.visible) { r.position.set(m.x, L.groundHeight(m.x, m.z) + 0.06, m.z); r.scale.setScalar(m.def.size * (m.boss ? 1.1 : 0.85) * k); } }
  }
  /** Captain Octopus (Blender model with a word shield) or, when it did not load, a purple blob with a captain's hat. */
  glbBoss(def, at, gl, eye) {
    let g, parts = {}, body = null, top = 1.6, centre = 0.6, rad = 0.9;
    if (gl) { parts = this.glbBody(def, gl); g = parts.g; const sz = parts.box.getSize(new THREE.Vector3()), c = parts.box.getCenter(new THREE.Vector3()); top = parts.box.max.y + 0.25; centre = c.y; rad = Math.max(sz.x, sz.z) * 0.55; }
    else {
      g = new THREE.Group(); body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 18, 12), new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.35, emissive: def.color, emissiveIntensity: 0.12 })); body.position.y = 0.6; body.castShadow = true; g.add(body);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), eye); e.position.set(sx * 0.2, 0.7, 0.54); g.add(e); }
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x1f2f5a })); hat.position.y = 1.35; g.add(hat);
    }
    const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 1), new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.3, wireframe: true, depthWrite: false })); shield.position.y = centre; shield.visible = false; g.add(shield);
    const { bar, back } = this.mobBars(g, top, true); g.scale.setScalar(def.size); this.root.add(g); g.visible = false;
    const m = { i: this.mobs.length, kind: def.id, boss: true, region: def.region, def, g, body, bar, back, shield, home: { ...at }, x: at.x, z: at.z, hp: def.hp, dead: 0, hitCool: 0, flash: 0, ph: 0, broken: 0, shieldOn: false, mats: parts.mats, mixer: parts.mixer, idle: parts.idle, walk: parts.walk, cur: parts.idle };
    this.mobs.push(m); return m;
  }
  makeBoss(def, at, eye, gltf) {
    if (def.model) return this.glbBoss(def, at, gltf, eye);
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
    this.clearShots(); this.target = this.hover = null; this.region = name; this.root.visible = name === 'village' || name === 'forest' || name === 'harbor'; for (const b of this.boards || []) b.g.visible = b.region === name;
    for (const m of this.mobs) { if (m.region === name) this.place(m); else m.g.visible = false; if (!m.lvTag && m.bar) this.tagLevel(m); }
    for (const sg of this.signs || []) sg.visible = sg.userData.region === name;
  }
  /** (24/11) the level of a monster over its health bar (cached textures: one per level). */
  tagLevel(m) {
    const lv = m.boss ? m.def.level + 1 : m.def.level; LVTEX[lv] = LVTEX[lv] || label(`Lv ${lv}`, { size: 34, color: '#fff6dc', bg: 'rgba(58,36,16,0.85)', scale: 1 }).material.map;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: LVTEX[lv], depthTest: false, transparent: true })); sp.scale.set(0.55, 0.3, 1); sp.position.set(0, m.bar.position.y + 0.3, 0); sp.renderOrder = 7; m.g.add(sp); m.lvTag = sp;
  }
  /** The region's fighting content is on: always in the village; the forest after the crystal quest (last chapter of Map 1); the harbor once Map 2 is open. */
  on(region, p) { return region === 'village' || region === 'forest' || !!(p && p.flags.map2); }      // (24/11) the forest is only reached at level 10, so its monsters are always awake
  /** A monster takes part when it lives in this region and that region's fighting content is on. */
  here(m, p) { return m.region === this.region && this.on(m.region, p); }
  /** A monster made from a Blender model (rigged, with Idle and Walk clips). Own copies of the materials, so a hit can flash it. */
  glbBody(def, gltf) {
    const g = new THREE.Group(), inner = SkeletonUtils.clone(gltf.scene), mats = [];
    inner.scale.setScalar((def.fit || 1) / def.size);
    inner.traverse((o) => { if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false; const c = o.material.clone(); o.material = c; mats.push({ mat: c, e: c.emissive ? c.emissive.clone() : null, k: c.emissiveIntensity === undefined ? 1 : c.emissiveIntensity }); });
    inner.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(inner); g.add(inner);
    const mixer = new THREE.AnimationMixer(inner), act = {}; for (const c of gltf.animations) act[c.name] = mixer.clipAction(c);
    if (!act.Attack && (act.Weapon || act.Punch)) act.Attack = act.Weapon || act.Punch;      // (20/11) Quaternius clip names
    if (!act.Hit && act.HitReact) act.Hit = act.HitReact;
    if (!act.Walk && act.Move) act.Walk = act.Move;      // (24/11) the new monsters name their walk 'Move'
    const idle = act.Idle || Object.values(act)[0] || null, walk = act.Walk || idle; if (idle) idle.play();
    return { g, mats, mixer, idle, walk, acts: act, top: box.max.y, box };
  }
  mobBars(g, top, thin) {
    const bar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xe23a2a, depthTest: false })); bar.center.set(0, 0.5); bar.scale.set(1, thin ? 0.07 : 0.12, 1); bar.position.set(-0.5, top, 0); bar.renderOrder = 6; g.add(bar);
    const back = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3a2410, depthTest: false })); back.center.set(0, 0.5); back.scale.set(1.04, thin ? 0.1 : 0.16, 1); back.position.set(-0.52, top, 0); back.renderOrder = 5; g.add(back);
    return { bar, back };
  }
  /** (20/11) the element badge left of the health bar: a round icon (flame, drop of ice, wind swirl, bolt), not a plain square.
   *  The badge shows the spell mark's element while one is on. */
  elementDot(m) {
    if (m.elDot || !m.def.el) return; const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: elementTex(m.def.el), transparent: true, depthTest: false })); d.scale.set(0.34, 0.34, 1); d.position.set(-0.72, m.bar.position.y, 0); d.renderOrder = 7; m.g.add(d); m.elDot = d; m.elShown = m.def.el;
  }
  /** Map 2 (Sunny Harbor): the crabs, jellyfish, pirates and Captain Octopus, built when the hero first sails there so the
   *  models are only fetched then. load(key) -> a loaded glTF ({ scene, animations }) or null. Falls back to plain blobs. */
  async addHarbor(load) {
    if (this.harbor) return; this.harbor = true;
    const src = {}; for (const k of ['crab', 'jelly', 'pirate', 'octopus', 'gull']) { try { src[k] = await load(k); } catch { src[k] = null; } }
    const eye = new THREE.MeshBasicMaterial({ color: 0x24140c }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    HARBOR_SPAWNS.forEach(([kind, x, z], n) => {
      const def = MONSTERS[kind], i = this.mobs.length, gl = src[def.model]; let g, body = null, parts = {}, top = 1.3;
      if (gl) { parts = this.glbBody(def, gl); g = parts.g; top = parts.top + 0.25; }
      else {          // the model did not load: a coloured blob with eyes
        g = new THREE.Group(); body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.4, emissive: def.color, emissiveIntensity: 0.12 })); body.position.y = def.fly ? 1.2 : 0.45; body.castShadow = true; g.add(body);
        for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), eye); e.position.set(sx * 0.17, body.position.y + 0.06, 0.44); g.add(e); }
      }
      const { bar, back } = this.mobBars(g, top, false); g.scale.setScalar(def.size); this.root.add(g);
      if (parts.idle) parts.idle.time = (n * 0.37) % parts.idle.getClip().duration;      // not all in step
      this.mobs.push({ i, kind, def, region: 'harbor', g, body, bar, back, home: { x, z }, x, z, hp: def.hp, dead: 0, hitCool: 0, flash: 0, ph: n * 1.3, mats: parts.mats, mixer: parts.mixer, idle: parts.idle, walk: parts.walk, cur: parts.idle });
      g.visible = false;
    });
    this.bosses.push(this.makeBoss(BOSS4, BOSS4_AT, eye, src.octopus));
    for (const m of this.mobs) if (m.region === 'harbor') { m.g.visible = this.region === 'harbor' && !m.boss; if (this.region === 'harbor') this.place(m); }
  }
  /** Map 1 (batch 13, 19/11): swaps the code-built meadow and forest monsters and the three bosses for the Blender models.
   *  load(kind) -> a loaded glTF or null; kinds are the monster keys (slime, red, golem, bat, shroom) and the boss ids (king, ancient, queen).
   *  The health bar, the word shield and the position stay; a model that did not load leaves the old shapes. */
  async addMap1(load) {
    const src = {}; for (const k of ['slime', 'red', 'golem', 'bat', 'shroom', 'king', 'ancient', 'queen', 'goblin', 'imp', 'orc', 'bunny', 'wisp', 'fox']) { try { src[k] = await load(k); } catch { src[k] = null; } }
    for (const m of this.mobs) {
      const gl = src[m.kind]; if (!gl || m.region === 'harbor' || m.mixer) continue;
      const keep = new Set([m.bar, m.back, m.shield]); for (const c of [...m.g.children]) if (!keep.has(c)) c.removeFromParent();
      const parts = this.glbBody(m.def, gl); m.g.add(parts.g); delete m.g.userData.wings;
      const sz = parts.box.getSize(new THREE.Vector3()), c = parts.box.getCenter(new THREE.Vector3());
      m.bar.position.y = m.back.position.y = parts.box.max.y + (m.boss ? 0.25 : 0.3);
      if (m.shield) { m.shield.geometry.dispose(); m.shield.geometry = new THREE.IcosahedronGeometry(Math.max(sz.x, sz.z) * 0.55, 1); m.shield.position.y = c.y; }
      Object.assign(m, { body: null, mats: parts.mats, mixer: parts.mixer, idle: parts.idle, walk: parts.walk, acts: parts.acts, cur: parts.idle });
      if (parts.idle) parts.idle.time = (m.ph * 0.7) % parts.idle.getClip().duration;
      m.lighted = undefined;
    }
  }
  /** Plays a one-shot clip (Attack, Hit) over the idle and walk; a hit does not cut an attack short. */
  cue(m, name) {
    const a = m.acts && m.acts[name]; if (!a) return;
    if (m.once && m.once.a !== a && m.once.t < 0.35 && name === 'Hit') return;
    a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; m.once = { a, t: 0 }; if (m.cur !== a) { const prev = m.cur; m.cur = a; a.reset().play(); if (prev) prev.crossFadeTo(a, 0.1, false); }
  }
  /** Lights a monster up for a moment when it is hit (Blender ones: all their materials). */
  lit(m, on) {
    if (m.lighted === on) return; m.lighted = on;
    if (m.mats) for (const t of m.mats) { if (!t.e) continue; if (on) { t.mat.emissive.setRGB(1, 0.85, 0.8); t.mat.emissiveIntensity = 1.1; } else { t.mat.emissive.copy(t.e); t.mat.emissiveIntensity = t.k; } }
    else if (m.body) m.body.material.emissiveIntensity = on ? 1.4 : 0.12;
  }
  place(m) { m.g.position.set(m.x, L.groundHeight(m.x, m.z), m.z); }
  /** K: a quick roll forward. Monsters cannot hurt Ngọc for half a second. */
  dodge() {
    const { player } = this.api; if (!this.root.visible || this.rollCool > 0) return false;
    this.rollCool = 0.8; this.iframes = 0.5; player.emote('Jump'); this.api.sfx('tick');
    let x = player.pos.x, z = player.pos.z; const dx = Math.sin(player.yaw), dz = Math.cos(player.yaw);
    for (let d = 0; d < 3.2; d += 0.2) { const nx = x + dx * 0.2, nz = z + dz * 0.2; if (!L.canStep(x, z, nx, nz)) break; x = nx; z = nz; }
    const yaw = player.yaw; player.place(x, z); player.yaw = yaw; return true;
  }
  /** The hero swings (J / F). Returns the number of monsters hit. The worn weapon's element rides on the swing (20/11). */
  attack() {
    const { player, profile } = this.api, p = profile(); if (!this.root.visible || this.cool > 0 || !p) return 0;
    this.cool = 0.85; if (player.swing && bag(p).weapon) player.swing();      // (24/11) "the left-click slash is too fast": one swing in 0.85 s
    else player.emote('Interact'); this.api.sfx('swish');
    const el = (p.gear && p.gear.el) || '';
    this.slash.material.color.set(el ? ELEMENTS[el].hex : 0xfff2a0);
    this.slash.visible = true; this.slashT = 0.16; this.slash.position.set(player.pos.x, player.pos.y + 0.9, player.pos.z); this.slash.rotation.z = -player.yaw + Math.PI * 0.05;
    let hits = 0; const atk = playerAtk(p);
    for (const m of this.targets(p)) if (inArc(player.pos.x, player.pos.z, player.yaw, m.x, m.z, 2.4 + m.def.size * 0.3)) { hits += 1; this.damage(m, atk, el, { knock: 0.9, mark: !!el }); }
    if (hits) this.api.sfx('correct');
    return hits;
  }
  /** The monsters the hero can hit now (alive, in this region, shown). */
  targets(p = this.api.profile()) { return this.root.visible && p ? this.mobs.filter((m) => !m.dead && this.here(m, p) && m.g.visible) : []; }
  /** One hit on a monster (20/11, magic): element factor (Fire > Ice > Thunder > Wind > Fire), the combo when the element
   *  feeding this one marked it, a critical hit, then the status (burn / slow / stun), the mark, a knock back and the
   *  floating number. A word shield still blocks everything: only English breaks it. Returns the damage dealt. */
  damage(m, amount, el = '', o = {}) {
    const p = this.api.profile(); if (!p || m.dead) return 0;
    if (m.shieldOn) { m.flash = 0.1; if (!this.shieldTold) { this.shieldTold = true; this.api.ui.toast('Word shield! Press E'); } return 0; }
    const pw = powers(p), f = elementFactor(el, m.def.el), combo = el && m.mark && m.mark.t > 0 ? comboOf(m.mark.el, el) : null;
    const crit = Math.random() < pw.crit, dmg = Math.max(1, Math.round(amount * f * (combo ? 1 + combo.bonus : 1) * (crit ? 1.8 : 1)));
    m.hp -= dmg; m.flash = 0.18; this.cue(m, 'Hit');
    if (pw.lifesteal && o.spell) { const max = maxHp(p); p.stats.hp = Math.min(max, (p.stats.hp ?? max) + Math.max(1, Math.round(dmg * pw.lifesteal))); }
    if (o.burn) m.burn = { t: o.burn, dps: Math.max(1, Math.round(dmg * 0.2)) };
    if (o.slow) m.slow = Math.max(m.slow || 0, o.slow);
    if (o.stun) m.stun = Math.max(m.stun || 0, o.stun);
    if (combo && combo.stun) m.stun = Math.max(m.stun || 0, combo.stun);
    if (o.mark !== false && el) m.mark = { el, t: 4 };
    if (combo) { m.mark = null; this.api.floater(m.x, m.z, `${combo.en}!`, '#ffffff', 1.25);
      if (combo.chain || combo.spread) { const near = this.targets(p).filter((x) => x !== m && Math.hypot(x.x - m.x, x.z - m.z) < 4).slice(0, combo.chain || combo.spread);
        for (const x of near) this.damage(x, amount * 0.5, '', { burn: combo.spread ? 3 : 0, mark: false }); } }
    const { player } = this.api;
    if (o.knock) { const dx = m.x - player.pos.x, dz = m.z - player.pos.z, d = Math.hypot(dx, dz) || 1, k = m.boss ? o.knock * 0.3 : o.knock, nx = m.x + dx / d * k, nz = m.z + dz / d * k; if (L.walkable(nx, nz, 0.5)) { m.x = nx; m.z = nz; } }
    this.api.floater(m.x, m.z, (crit ? '💥' : '') + dmg + (f > 1 ? ' ▲' : f < 1 ? ' ▼' : ''), f > 1 ? '#ffe04a' : f < 1 ? '#b8c4d0' : el ? ELEMENTS[el].color : '#ffffff', crit ? 1.15 : 0.9);
    if (m.boss && shieldDue(m.hp, m.def.hp, m.broken)) { m.shieldOn = true; m.shield.visible = true; this.shieldTold = false; this.api.ui.toast('Word shield! Press E'); this.api.sfx('wrong'); m.hp = Math.max(m.hp, 1); }
    if (m.hp <= 0) this.kill(m, p);
    return dmg;
  }
  kill(m, p) {
    m.dead = m.boss ? RESPAWN.boss : m.def.elite ? RESPAWN.elite : RESPAWN.normal; m.burn = null; m.stun = 0; m.slow = 0; m.mark = null;      // (21/11) slower comeback
    const death = m.acts && m.acts.Death;      // (20/11) monsters with a Death clip fall down first, then vanish
    if (death) { death.setLoop(THREE.LoopOnce, 1); death.clampWhenFinished = true; const prev = m.cur; death.reset().play(); if (prev && prev !== death) prev.crossFadeTo(death, 0.1, false); m.cur = death; m.once = null; m.dying = Math.min(1.4, death.getClip().duration); if (m.bar) m.bar.visible = m.back.visible = false; if (m.elDot) m.elDot.visible = false; }
    else m.g.visible = false;
    const first = m.boss && !p.flags[m.def.flag], k = m.boss && !first ? 0.25 : 1, gold = capGold(p, Math.round(m.def.gold * k * (this.api.goldMul ? this.api.goldMul() : 1))), exp = killExp(p, Math.round(m.def.exp * k), m.def.level);      // (24/11) less for a monster far below the hero, none at the map's top level
    p.stats.gold += gold; addExp(p, exp); p.kills = (p.kills || 0) + 1; if (this.api.onKill) this.api.onKill(m);
    if (m.boss) { m.broken = 0; m.shieldOn = false; m.shield.visible = false; p.flags[m.def.flag] = true; }
    if (countKill(p, m.kind)) this.api.ui.toast('Quest done! Go back to the board');
    else this.api.ui.toast(exp ? `+${exp} EXP   +${gold} ●` : `+${gold} ●   (đã tối đa cấp ${levelCap(p)} ở vùng này: sang vùng mới để lên cấp)`);
    if (first) { const pages = bossWake(m.def.flag, gold, exp, p.stats.level); if (pages) this.api.ui.dialogue(pages); }      // the boss wakes up from the Dark Wind (saga, 19/11)
    const drop = lootRoll(p, m.boss ? m.def : { id: m.kind }, first);      // (20/11) rare gear from elites and bosses, low chance
    if (drop && giveLoot(p, drop)) { this.api.sfx('fanfare'); this.api.ui.toast(`✨ Rớt trang bị hiếm: ${ITEMS[drop].en}! Mở túi (V) để mặc.`); }
    const cl = this.api.gainItems && lootCloth(p, m.boss ? m.def : { id: m.kind }, first, Math.random, (c) => this.api.owns && this.api.owns(c));      // (20/11) rare clothes and jewellery too
    if (cl) { this.api.sfx('fanfare'); this.api.gainItems([cl]); }
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
      if (!this.on(bd.region, p)) return { text: bd.region === 'harbor' ? 'Bảng nhiệm vụ: mở khi tới Map 2' : 'Bảng nhiệm vụ rừng: làm xong nhiệm vụ pha lê của Pip để mở', run() {} };
      return { text: 'E · Bảng nhiệm vụ săn quái', run: () => this.board() };
    }
    return null;
  }
  board() {
    const { ui, profile } = this.api, p = profile(), list = huntsOf(this.region), h = hunt(p, this.region), q = list[h.i % list.length], name = MONSTERS[q.kind].name;
    if (!h.active) { ui.dialogue([{ who: 'Quest board', en: huntLine(q, p.grade), vi: `Nhiệm vụ: hạ ${q.need} ${name}. Thưởng ${q.gold} vàng, ${q.exp} EXP.` }], () => { h.active = true; h.got = 0; this.api.sfx('tick'); this.api.save(); this.api.onChange(); }); return; }
    if (h.got < q.need) { ui.dialogue([{ who: 'Quest board', en: `${name}: ${h.got} of ${q.need}. Keep going!` }]); return; }
    const capped = atCap(p), jobGold = capGold(p, q.gold); p.stats.gold += jobGold; addExp(p, q.exp); h.done += 1; h.i += 1; h.active = false; h.got = 0; this.api.sfx('fanfare'); if (this.api.onJob) this.api.onJob(this.region);
    ui.dialogue([{ who: 'Quest board', en: `Thank you, hero! (+${jobGold} gold, +${capped ? 0 : q.exp} EXP)`, vi: capped ? `Con đã ở cấp tối đa của vùng này: vàng giảm dần, không còn EXP. Sang vùng mới để chơi tiếp nhé!` : 'Quay lại bảng để nhận nhiệm vụ mới.' }]); this.api.save(); this.api.onChange();
  }
  /** Short text for the HUD while a hunt of this region's board is running. */
  huntNote() { const p = this.api.profile(); if (!p) return ''; const k = HUNT_KEY[this.region] || 'hunt', h = p[k]; if (!h || !h.active) return ''; const list = huntsOf(this.region), q = list[h.i % list.length]; return `⚔ ${Math.min(h.got, q.need)}/${q.need}`; }
  update(dt, frozen) {
    if (!this.root.visible) return;
    const { player, profile } = this.api, p = profile(); if (!p) return;
    this.t += dt; this.cool = Math.max(0, this.cool - dt); this.rollCool = Math.max(0, (this.rollCool || 0) - dt); this.iframes = Math.max(0, (this.iframes || 0) - dt);
    if (this.slash.visible) { this.slashT -= dt; this.slash.material.opacity = Math.max(0, this.slashT / 0.16); if (this.slashT <= 0) this.slash.visible = false; }
    const hpMax = maxHp(p); if (p.stats.hp === undefined || p.stats.hp > hpMax) p.stats.hp = hpMax;
    let fighting = false; const safe = inSafe(this.region, player.pos.x, player.pos.z);      // (21/11) no fights in the safe places
    for (const m of this.mobs) {
      if (!this.here(m, p)) { if (m.g.visible) m.g.visible = false; continue; }
      if (!m.boss && !m.dead && !m.g.visible) { m.g.visible = true; this.place(m); }
      if (m.boss && p.stats.level < m.def.level) { m.g.visible = false; continue; }
      if (m.boss && !m.dead && !m.g.visible) { m.g.visible = true; this.place(m); }
      if (m.dying > 0) { m.dying -= dt; if (m.mixer) m.mixer.update(dt); if (m.dying <= 0) m.g.visible = false; }
      if (m.dead) { m.dead -= dt; if (m.dead <= 0) { if (m.acts && m.acts.Death) { m.acts.Death.stop(); if (m.idle) { m.idle.reset().play(); m.cur = m.idle; } } m.dying = 0; m.dead = 0; m.hp = m.def.hp; if (m.boss) { m.broken = 0; m.shieldOn = false; m.shield.visible = false; } m.x = m.home.x; m.z = m.home.z; m.g.visible = true; this.place(m); } continue; }
      const dx = player.pos.x - m.x, dz = player.pos.z - m.z, d = Math.hypot(dx, dz), far = Math.hypot(m.x - m.home.x, m.z - m.home.z);
      let vx = 0, vz = 0, chasing = false;
      const keep = m.def.ranged && !m.boss ? 5.5 : 0.9;      // (20/11) ranged monsters stop at about 5.5 m and cast
      if (!frozen && !safe && d < (m.def.ranged ? 10 : 8) && far < 13) { fighting = chasing = true; if (d > keep) { vx = dx / d; vz = dz / d; } else if (m.def.ranged && !m.boss) m.g.rotation.y = Math.atan2(dx, dz); }
      else if (far > 0.6) { vx = (m.home.x - m.x) / far; vz = (m.home.z - m.z) / far; if (far > 2) m.hp = Math.min(m.def.hp, m.hp + dt * 12); }
      // (20/11) spells: stunned monsters stand still, slowed ones walk at half speed, burning ones lose health, marks fade
      if (m.stun > 0) { m.stun -= dt; vx = vz = 0; }
      if (m.slow > 0) m.slow -= dt;
      if (m.mark && (m.mark.t -= dt) <= 0) m.mark = null;
      if (m.burn) { m.burn.t -= dt; m.burnTick = (m.burnTick || 0) + dt; if (m.burnTick >= 1) { m.burnTick = 0; m.hp -= m.burn.dps; m.flash = 0.08; this.api.floater(m.x, m.z, String(m.burn.dps), '#ff8a3a', 0.75); if (m.hp <= 0) { m.burn = null; this.kill(m, p); continue; } } if (m.burn && m.burn.t <= 0) m.burn = null; }
      if (!m.elDot) this.elementDot(m);
      if (m.elDot) { m.elDot.position.y = m.bar.position.y; const want = m.mark ? m.mark.el : m.def.el; if (m.elShown !== want) { m.elShown = want; m.elDot.material.map = elementTex(want); m.elDot.material.needsUpdate = true; } }
      const sp = m.def.speed * (chasing ? CHASE : 1) * (m.slow > 0 ? 0.5 : 1), nx = m.x + vx * sp * dt, nz = m.z + vz * sp * dt; if ((vx || vz) && L.walkable(nx, nz, 0.45) && !inSafe(this.region, nx, nz, 1)) { m.x = nx; m.z = nz; }
      let hop = Math.abs(Math.sin(this.t * (m.kind === 'golem' ? 3 : 5) + m.ph)) * (vx || vz ? 0.22 : 0.08);
      if (m.mixer) {          // Blender monsters walk and idle by their own clips; jellyfish float
        if (m.once) { m.once.t += dt; if (m.once.t >= m.once.a.getClip().duration) m.once = null; }
        const want = m.once ? m.once.a : vx || vz ? m.walk : m.idle; if (want && m.cur !== want) { const prev = m.cur; m.cur = want; want.reset().play(); if (prev) prev.crossFadeTo(want, 0.25, false); }
        m.mixer.update(dt); if (m.idle || m.def.fly) hop = m.def.fly ? (m.def.hover === undefined ? 0.8 : m.def.hover) + Math.sin(this.t * 2 + m.ph) * 0.12 : 0;
      }
      m.g.position.set(m.x, L.groundHeight(m.x, m.z) + hop, m.z); if (vx || vz) m.g.rotation.y = Math.atan2(vx, vz);
      if (m.g.userData.wings) for (const [k, w] of m.g.userData.wings.entries()) w.rotation.z = (k ? -1 : 1) * Math.sin(this.t * 14 + m.ph) * 0.6;   // bats flap
      m.flash = Math.max(0, m.flash - dt); this.lit(m, m.flash > 0);
      if (m.shieldOn) m.shield.rotation.y += dt * 1.5;
      m.bar.scale.x = Math.max(0.001, m.hp / m.def.hp); const show = m.hp < m.def.hp || d < 9; m.bar.visible = m.back.visible = show; if (m.elDot) m.elDot.visible = show;
      m.hitCool = Math.max(0, m.hitCool - dt);
      if (m.shotCool === undefined) m.shotCool = 1 + (m.ph % 2);      // not all at once
      m.shotCool -= dt;
      if (!frozen && !safe && !m.dead && !m.stun && (m.def.ranged || m.boss) && m.shotCool <= 0 && d > 2.6 && d < (m.boss ? 14 : 11)) {
        m.shotCool = m.boss ? 3.6 : 2.4 + (m.ph % 1.2); this.cue(m, m.acts && m.acts.Cast ? 'Cast' : 'Attack'); this.shoot(m, player.pos, m.boss ? 3 : 1);
      }
      if (!frozen && !safe && !this.iframes && d < 0.95 + m.def.size * 0.35 && m.hitCool <= 0) {
        m.hitCool = 1.1; this.cue(m, 'Attack');
        if (m.stun > 0) m.hitCool = 0.3;      // stunned: no hit
        else if (Math.random() < powers(p).dodge) this.api.floater(player.pos.x, player.pos.z, 'Miss!', '#9fe8ff', 0.9);      // Wind Steps: a dodge
        else { if (!p.god) p.stats.hp -= hurt(m.def.atk, p, m.def.el); this.api.sfx('wrong'); this.api.onChange(); }      // god: admin's no-damage switch
        if (p.stats.hp <= 0) { p.stats.hp = Math.max(1, Math.ceil(hpMax * 0.3)); this.api.save(); this.api.respawn(); return; }
      }
    }
    if (this.target && (this.target.dead || !this.here(this.target, p) || !this.target.g.visible || Math.hypot(this.target.x - player.pos.x, this.target.z - player.pos.z) > 25)) this.target = null;
    if (this.hover && (this.hover.dead || !this.hover.g.visible)) this.hover = null;
    this.syncRings(); this.fighting = fighting;
    this.updateShots(dt, p, hpMax, frozen);
    if (!fighting && p.stats.hp < hpMax) { this.regen += dt; if (this.regen > 0.5) { this.regen = 0; p.stats.hp = Math.min(hpMax, p.stats.hp + 3); this.api.onChange(); } }
  }
  /** (20/11) A monster casts: a glowing ball of its element flies at where the hero stands (n balls in a fan for bosses).
   *  The hero dodges with K (the roll's invulnerable moment) or by walking away; the ball hurts like the monster's hit at 80%. */
  shoot(m, at, n = 1) {
    const el = m.def.el || 'fire', hex = ELEMENTS[el].hex;
    for (let k = 0; k < n; k++) {
      const a = Math.atan2(at.x - m.x, at.z - m.z) + (n > 1 ? (k - (n - 1) / 2) * 0.28 : 0);
      const g = new THREE.Group(), core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: hex, toneMapped: false })), halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: elementTex(el), transparent: true, depthWrite: false }));
      halo.scale.set(0.9, 0.9, 1); g.add(core, halo);
      const y = L.groundHeight(m.x, m.z) + (m.def.fly ? 1.2 : 0.9) * (m.def.fit || 1);
      g.position.set(m.x + Math.sin(a) * 0.5, y, m.z + Math.cos(a) * 0.5); this.root.add(g);
      this.shots.push({ g, vx: Math.sin(a) * 7, vz: Math.cos(a) * 7, t: 1.9, el, atk: m.def.atk * (m.boss ? 0.7 : 0.8), spin: Math.random() * 6 });
    }
    this.api.sfx('tick');
  }
  updateShots(dt, p, hpMax, frozen) {
    const player = this.api.player;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]; s.t -= dt; s.g.position.x += s.vx * dt; s.g.position.z += s.vz * dt; s.spin += dt * 9; s.g.children[1].material.rotation = s.spin;
      const dx = player.pos.x - s.g.position.x, dz = player.pos.z - s.g.position.z, hit = Math.hypot(dx, dz) < 0.75 && Math.abs(s.g.position.y - (player.pos.y + 0.8)) < 1.4;
      if (hit && !frozen && !this.iframes && !inSafe(this.region, player.pos.x, player.pos.z)) {
        if (Math.random() < powers(p).dodge) this.api.floater(player.pos.x, player.pos.z, 'Miss!', '#9fe8ff', 0.9);
        else { if (!p.god) p.stats.hp -= hurt(s.atk, p, s.el); this.api.sfx('wrong'); this.api.onChange(); this.api.floater(player.pos.x, player.pos.z, '💥', ELEMENTS[s.el].color, 0.8); }
        if (p.stats.hp <= 0) { p.stats.hp = Math.max(1, Math.ceil(hpMax * 0.3)); this.clearShots(); this.api.save(); this.api.respawn(); return; }
      }
      if (hit || s.t <= 0) { s.g.removeFromParent(); s.g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); this.shots.splice(i, 1); }
    }
  }
  clearShots() { for (const s of this.shots) s.g.removeFromParent(); this.shots.length = 0; }
  /** Where the hunt board sends the hero: the nearest living monster of the asked kind, or the board when the job is done. */
  guide(pos) {
    const p = this.api.profile(); if (!p || !this.root.visible || !this.on(this.region, p)) return null;
    const list = huntsOf(this.region), h = hunt(p, this.region), q = list[h.i % list.length], at = BOARD_OF[this.region] || BOARD;
    if (!h.active) return null;
    if (h.got >= q.need) return { x: at.x, z: at.z, text: 'Bảng nhiệm vụ' };
    let best = null, bd = 1e9;
    for (const m of this.mobs) if (!m.dead && !m.boss && m.kind === q.kind && this.here(m, p)) { const d = Math.hypot(m.x - pos.x, m.z - pos.z); if (d < bd) { bd = d; best = m; } }
    return best ? { x: best.x, z: best.z, text: `Săn: ${MONSTERS[q.kind].name}` } : null;
  }
  markers() {
    if (!this.root.visible) return [];
    const p = this.api.profile(), out = [];
    if (p && this.on(this.region, p)) {
      const list = huntsOf(this.region), h = hunt(p, this.region), q = list[h.i % list.length], at = BOARD_OF[this.region] || BOARD;
      if (!h.active || h.got >= q.need) out.push({ x: at.x, z: at.z, text: '!', color: '#ffd23c' });
    }
    for (const b of this.bosses) if (b.g.visible && !b.dead && this.here(b, p)) out.push({ x: b.x, z: b.z, text: '♛', color: ({ boss1: '#8fd8ff', boss2: '#e0c890', boss3: '#f08ac0', boss4: '#d070e0' })[b.def.flag] });
    return out.concat(this.mobs.filter((m) => !m.dead && !m.boss && this.here(m, p)).map((m) => ({ x: m.x, z: m.z, text: '', color: ({ golem: '#8a8490', red: '#ff6a5a', bat: '#9a7ad0', shroom: '#e2483e', crab: '#ff7a3c', jelly: '#b48ae8', pirate: '#3f6fd0', goblin: '#4f9ad0', imp: '#d8402e', orc: '#6fae3a', bunny: '#bfe8ff', wisp: '#ffe14a', fox: '#ff8a3a', gull: '#c8d4e0' })[m.kind] || '#6ad05a', small: true })));
  }
}
