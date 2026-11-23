// Play areas with no English in them: fishing at the dock, apple catching in the orchard, a ring race round
// the west meadow and twelve hidden stars. They exist so the village is fun between lessons; rewards are small.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { pay, FULL_PLAYS } from '../core/rules.js';
import { today } from '../core/review.js';
import { gameMusic, endMusic } from '../audio.js';
import { addGood } from '../core/goods.js';
import { ORCHARD_TREES, ORCHARD_CROWN, ORCHARD_R } from '../core/regions/village.js';
/** Tells the child when today's full pay for this game is used up (T1: skill games are for fun, not for farming gold). */
export const payNote = (r) => (!r.full ? `Hôm nay trò này chỉ còn thưởng 20%. Đi đánh quái, làm nhiệm vụ để được nhiều hơn!` : r.left === 0 ? `Đã hết ${FULL_PLAYS} lượt thưởng đầy đủ hôm nay của trò này.` : '');

export const STARS = [[-36, 20], [-38, -34], [-12, -38], [30, -30], [48, -12], [52, 20], [44, 38], [10, 50], [-22, 50], [-35, 38], [-30, 14], [8, -36]];
export const RACE = [[-20, 2], [-32, 4], [-42, 14], [-40, 28], [-34, 42], [-22, 47], [-6, 44], [-8, 30], [-20, 2]];
// Each skill game has its own spot, well apart from the others, and a host who runs it (18/11: "one NPC for each mini
// game"). host: villager model, tint, name, a short greeting shown when the game starts. The fishing spot is Sam's dock.
// The ring race was dropped (17/11): the cart race board is the racing game.
export const STARTS = [
  { id: 'fish', x: 18.4, z: 19.2, text: 'E · Câu cá (trò chơi)', sign: '🎣 Fishing' },
  { id: 'apple', x: 33.5, z: 6, text: 'E · Hứng táo với cô Hana', sign: '🍎 Apple catch', host: { name: 'Hana', file: 'npc_ben_merchant_v02', tint: [0.85, 1.12, 0.85], hello: 'The apples are falling! Catch them!' } },
  { id: 'candy', x: -15, z: -17, text: 'E · Xếp kẹo với cô Mimi', sign: '🍬 Candy Match', board: true, host: { name: 'Mimi', file: 'npc_ben_merchant_v02', tint: [1.15, 0.88, 1.0], hello: 'Sweet! Let\'s match the candies!' } },
  { id: 'sling', x: -6, z: -33, text: 'E · Bắn ná với chú Rex', sign: '🎯 Slingshot', board: true, host: { name: 'Rex', file: 'npc_forge_blacksmith_v01', tint: [1.05, 0.95, 0.82], hello: 'Aim high and let go!' } },
  { id: 'race2', x: 10, z: 28, text: 'E · Đua xe bí ngô với anh Leo', sign: '🏎 Cart Race', board: true, host: { name: 'Leo', file: 'npc_sam_fisherman_v02', tint: [1.12, 0.95, 0.8], hello: 'Ready, steady, go!' } },
  { id: 'blocks', x: -31, z: 4.5, text: 'E · Xếp hình với bác Max', sign: '🧱 Blocks', board: true, host: { name: 'Max', file: 'npc_forge_blacksmith_v01', tint: [0.88, 0.92, 1.08], hello: 'Fill a whole line!' } },
];
export const ORCHARD = { x: 40, z: 11, r: 8 };

/** Pure rules, tested without a browser. */
export const fishHit = (pos, centre, width) => Math.abs(pos - centre) <= width / 2;
export const fishGold = (caught) => caught * 2;
export const appleGold = (score) => Math.min(15, Math.floor(score / 2));
export const raceGold = (seconds) => (seconds < 30 ? 12 : seconds < 40 ? 8 : 5);
export const fishBar = (pos, centre, width, n = 23) => { let s = ''; const m = Math.round(pos * (n - 1)); for (let i = 0; i < n; i++) { const x = i / (n - 1); s += i === m ? '◆' : Math.abs(x - centre) <= width / 2 ? '█' : '─'; } return s; };

export class MiniGames {
  /** api: { scene, player, ui, sfx(name), profile() -> profile, save(), onNote(), board(id) -> opens an arcade board game } */
  constructor(api) {
    this.api = api; this.active = null; this.note = ''; this.t = 0; this.root = new THREE.Group(); api.scene.add(this.root);
    const V = L.REGIONS.village, glow = (hex, k = 1.6) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, roughness: 0.4 });
    // hidden stars
    // hidden stars (17/11: sharper): a bevelled gold star with a dark rim, a soft halo and a ring on the ground
    const shape = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 0.27 : 0.6; shape[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); }
    const sg = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.07, bevelSegments: 3 }); sg.translate(0, 0, -0.06); sg.computeVertexNormals();
    const starGold = new THREE.MeshStandardMaterial({ color: 0xffc928, emissive: 0xff9a00, emissiveIntensity: 0.35, metalness: 0.55, roughness: 0.28 });
    const rim = new THREE.MeshBasicMaterial({ color: 0x7a4300, side: THREE.BackSide });
    const ringG = new THREE.RingGeometry(0.5, 0.62, 28), ringM = new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    this.stars = STARS.map(([x, z], i) => {
      const mat = starGold.clone(), m = new THREE.Group(), star = new THREE.Mesh(sg, mat), edge = new THREE.Mesh(sg, rim); edge.scale.setScalar(1.08); star.castShadow = true; m.add(star, edge);
      const ring = new THREE.Mesh(ringG, ringM); ring.rotation.x = -Math.PI / 2; ring.scale.setScalar(0.45); ring.position.set(x, V.groundHeight(x, z) + 0.05, z); this.root.add(ring);
      m.scale.setScalar(0.42);      // (21/11) "the stars are too big: small and sparkling"
      m.position.set(x, V.groundHeight(x, z) + 0.9, z); this.root.add(m); return { m, x, z, i, ring, spin: star, edge, mat, y0: m.position.y };
    });
    // race rings
    const rg = new THREE.TorusGeometry(1.25, 0.11, 8, 28);
    this.rings = RACE.slice(1).map(([x, z], i) => { const m = new THREE.Mesh(rg, glow(0x58c8ff, 1.2)); const [px, pz] = RACE[i]; m.position.set(x, V.groundHeight(x, z) + 1.45, z); m.rotation.y = Math.atan2(x - px, z - pz); m.visible = false; this.root.add(m); return { m, x, z }; });
    // falling apples (pool)
    const ag = new THREE.SphereGeometry(0.26, 12, 9), red = new THREE.MeshStandardMaterial({ color: 0xe23a2a, roughness: 0.45 }), gold = glow(0xffc83c, 1.2);
    this.apples = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(ag, red); m.visible = false; m.castShadow = true; this.root.add(m); return { m, live: false, redMat: red, goldMat: gold }; });      // (21/11) not 'gold': that name is the golden-apple flag below
    // start signs
    for (const s of STARTS) {
      const y = V.groundHeight(s.x, s.z), post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a30 })); post.position.set(s.x + 0.9, y + 0.95, s.z - 0.9); post.castShadow = true; this.root.add(post);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72; const c = cv.getContext('2d'); c.fillStyle = '#fff4dc'; c.strokeStyle = '#b98a52'; c.lineWidth = 6; c.beginPath(); c.roundRect(4, 4, 248, 64, 14); c.fill(); c.stroke(); c.fillStyle = '#4a2a10'; c.font = '700 30px sans-serif'; c.textAlign = 'center'; c.fillText(s.sign, 128, 47);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.scale.set(2.3, 0.65, 1); sp.position.set(s.x + 0.9, y + 2.25, s.z - 0.9); this.root.add(sp);
    }
    this.setRegion(L.NAME);
  }
  /** Puts each game's host by its sign. load(name) -> Promise<gltf>, a fresh copy each call. */
  async addHosts(load) {
    this.hosts = [];
    for (const s of STARTS) if (s.host) {
      const gltf = await load(s.host.file), root = gltf.scene, mixer = new THREE.AnimationMixer(root), act = {};
      for (const c of gltf.animations) act[c.name] = mixer.clipAction(c);
      root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.material = o.material.clone(); o.material.color.multiply(new THREE.Color(...s.host.tint)); } });
      const y = L.REGIONS.village.walkHeight(s.x, s.z); root.position.set(s.x - 0.6, y, s.z + 0.4); root.rotation.y = 0.6; this.root.add(root);
      if (act.Idle) act.Idle.play();
      this.hosts.push({ s, root, mixer, act, cur: 'Idle' });
    }
  }
  get data() { const p = this.api.profile(); if (!p) return { stars: [], best: {} }; return p.mini || (p.mini = { stars: [], best: {} }); }
  setRegion(name) { this.root.visible = name === 'village'; if (name !== 'village') this.stop(); this.syncStars(); }
  syncStars() { const got = this.data.stars; for (const s of this.stars) s.m.visible = s.ring.visible = !got.includes(s.i); }
  say(text) { if (text !== this.note) { this.note = text; this.api.onNote(); } }
  stop() { if (!this.active) return; if (this.active.id === 'apple') endMusic(); this.active = null; for (const r of this.rings) r.m.visible = false; for (const a of this.apples) { a.live = false; a.m.visible = false; } this.say(''); }

  /** Interaction offered at the player's position, or null. */
  interact(pos) {
    if (!this.root.visible) return null;
    if (this.active && this.active.id === 'fish') return { text: 'E · Giật cần!', run: () => this.pull() };
    if (this.active) return null;
    for (const s of STARTS) if (Math.hypot(pos.x - s.x, pos.z - s.z) < 2.4) return { text: s.text, run: () => this.start(s.id) };
    return null;
  }
  start(id) {
    const s = STARTS.find((x) => x.id === id); this.api.sfx('tick');
    if (id === 'apple') {      // (20/11) Hana talks first; the apples only fall after her talk, from the crowns of the tall trees, slowly
      this.api.ui.dialogue([{ who: 'Hana', en: 'Welcome to my orchard! The apples are ripe.', vi: 'Chào mừng tới vườn táo của cô Hana! Táo chín rồi.' }, { who: 'Hana', en: 'Run under the trees and catch the apples. Gold apples are worth three!', vi: 'Chạy dưới các cây để hứng táo trong 30 giây. Táo vàng được 3 điểm.' }], () => { this.active = { id, s, time: 30, score: 0, next: 1.2 }; gameMusic('apple'); });
      return;
    }
    if (s.host && this.api.ui.toast) this.api.ui.toast(`${s.host.name}: ${s.host.hello}`);
    if (s.board) return this.api.board(id);
    if (id === 'fish') { this.active = { id, s, cast: 0, caught: 0, pos: 0, centre: 0.5, width: 0.3, speed: 0.6, wait: 0, msg: '' }; this.newCast(); }
    if (id === 'race') { this.active = { id, s, i: 0, time: 0 }; this.rings.forEach((r, k) => { r.m.visible = k === 0; }); }
  }
  newCast() { const a = this.active; a.cast += 1; a.centre = 0.2 + Math.random() * 0.6; a.width = Math.max(0.16, 0.32 - a.cast * 0.03); a.speed = 0.55 + a.cast * 0.12; a.wait = 0; a.hold = false; }     // slower marker (feedback 17/11: too fast)
  pull() {
    const a = this.active; if (!a || a.id !== 'fish' || a.wait > 0) return;
    const ok = fishHit(a.pos, a.centre, a.width); if (ok) a.caught += 1;
    this.api.sfx(ok ? 'correct' : 'wrong'); a.msg = ok ? 'Got one!' : 'It got away…'; a.wait = 0.9;
  }
  finish(gold, text, key, score, lowerIsBetter) {
    if (this.api.track) this.api.track('mini');
    const p = this.api.profile(), best = this.data.best, old = best[key];
    const record = old === undefined || (lowerIsBetter ? score < old : score > old); if (record) best[key] = score;
    const r = pay(p, key, today(), gold);
    p.stats.gold += r.gold; this.stop(); this.api.sfx('fanfare'); this.api.save();
    this.api.ui.dialogue([{ who: 'Ngọc', en: `${text} (+${r.gold} gold)`, vi: [record ? 'Kỷ lục mới của con!' : '', payNote(r)].filter(Boolean).join(' ') || undefined }]);
  }

  /** (21/11) "picked apples go into the bag, sold at the shop": the apples themselves are the reward (a fifth of them after
   *  today's three full plays), plus a little EXP. */
  finishApples(a) {
    if (this.api.track) this.api.track('mini');
    const p = this.api.profile(), best = this.data.best, record = best.apple === undefined || a.score > best.apple; if (record) best.apple = a.score;
    const n = (a.reds || 0) + (a.golds || 0), r = pay(p, 'apple', today(), n), k = n ? r.gold / n : 0, reds = Math.round((a.reds || 0) * k), golds = Math.round((a.golds || 0) * k);
    addGood(p, 'apple', reds); addGood(p, 'gold_apple', golds); this.stop(); this.api.sfx('fanfare'); this.api.save();
    this.api.ui.dialogue([{ who: 'Ngọc', en: `I picked ${reds} apples${golds ? ` and ${golds} golden apples` : ''}! They are in my bag.`, vi: [`Táo nằm trong túi đồ (phím V). Mang ra Village Shop bán lấy vàng nhé.`, record ? 'Kỷ lục mới của con!' : '', payNote(r)].filter(Boolean).join(' ') }]);
  }
  update(dt, pos) {
    if (!this.root.visible) return;
    this.t += dt;
    for (const h of this.hosts || []) {          // hosts turn to Ngọc and wave when she comes close
      const d = Math.hypot(pos.x - h.root.position.x, pos.z - h.root.position.z); if (d > 40) continue;
      if (d < 7) { let k = Math.atan2(pos.x - h.root.position.x, pos.z - h.root.position.z) - h.root.rotation.y; k = Math.atan2(Math.sin(k), Math.cos(k)); h.root.rotation.y += k * Math.min(1, dt * 4); }
      const want = d < 4 && h.act.Talk ? 'Talk' : 'Idle'; if (want !== h.cur && h.act[want]) { h.act[want].reset().play(); if (h.act[h.cur]) h.act[h.cur].crossFadeTo(h.act[want], 0.3, false); h.cur = want; }
      if (d < 30) h.mixer.update(dt);
    }
    for (const s of this.stars) if (s.m.visible) {
      s.spin.rotation.y = s.edge.rotation.y = this.t * 1.8 + s.i; s.m.position.y = s.y0 + Math.sin(this.t * 2.4 + s.i) * 0.08;
      // (23/11) "the star itself should glow and blink, not another thing scaled in and out over it": the gold shines on its own,
      // a slow breath of light and now and then a quick glint, all in the star's own material (the bloom does the rest)
      const breath = 0.5 + 0.5 * Math.sin(this.t * 2.2 + s.i * 1.7), glint = Math.pow(0.5 + 0.5 * Math.sin(this.t * 5.3 + s.i * 2.1), 10);
      s.mat.emissiveIntensity = 0.25 + 0.4 * breath + 1.1 * glint; s.mat.emissive.setHex(glint > 0.35 ? 0xffd860 : 0xff9a00);
      if (Math.hypot(pos.x - s.x, pos.z - s.z) < 1.3) this.takeStar(s);
    }
    const a = this.active; if (!a) return;
    if (Math.hypot(pos.x - a.s.x, pos.z - a.s.z) > (a.id === 'race' ? 90 : a.id === 'apple' ? 22 : 5)) { this.stop(); return; }
    if (a.id === 'fish') {
      if (a.wait > 0) { a.wait -= dt; if (a.wait <= 0) { if (a.cast >= 5) return this.finish(fishGold(a.caught), `I caught ${a.caught} fish!`, 'fish', a.caught); this.newCast(); } }
      else if (!a.hold) a.pos = 0.5 + 0.5 * Math.sin(this.t * a.speed * 2);      // hold: test hook, freezes the marker
      this.say(`🎣 ${a.cast}/5 · 🐟 ${a.caught}   ${a.wait > 0 ? a.msg : fishBar(a.pos, a.centre, a.width)}   (E)`);
    } else if (a.id === 'apple') {
      a.time -= dt; a.next -= dt;
      if (a.next <= 0) { a.next = 0.8 + Math.random() * 0.6; const f = this.apples.find((x) => !x.live); if (f) { const tr = ORCHARD_TREES[Math.floor(Math.random() * ORCHARD_TREES.length)], ang = Math.random() * 6.28, r = Math.sqrt(Math.random()) * ORCHARD_R * 0.8; f.x = tr[0] + Math.cos(ang) * r; f.z = tr[1] + Math.sin(ang) * r; if (L.walkable(f.x, f.z, 0.5)) { f.live = true; f.y = ORCHARD_CROWN - 0.6; f.gold = Math.random() < 0.12; f.m.material = f.gold ? f.goldMat : f.redMat; f.m.visible = true; } } }
      for (const f of this.apples) if (f.live) {
        f.y -= dt * 1.7; const g = L.groundHeight(f.x, f.z); f.m.position.set(f.x, g + f.y, f.z);      // slow: about 3 s from the crown
        if (f.y < 2.0 && Math.hypot(pos.x - f.x, pos.z - f.z) < 1.5) { a.score += f.gold ? 3 : 1; if (f.gold) a.golds = (a.golds || 0) + 1; else a.reds = (a.reds || 0) + 1; this.api.sfx('correct'); f.live = false; f.m.visible = false; }
        else if (f.y <= 0.2) { f.live = false; f.m.visible = false; }
      }
      if (a.time <= 0) return this.finishApples(a);
      this.say(`🍎 ${a.score}   ⏱ ${Math.ceil(a.time)} s`);
    } else if (a.id === 'race') {
      a.time += dt; const r = this.rings[a.i];
      r.m.scale.setScalar(1 + Math.sin(this.t * 5) * 0.06);
      if (Math.hypot(pos.x - r.x, pos.z - r.z) < 1.9) { r.m.visible = false; a.i += 1; this.api.sfx('tick'); if (a.i >= this.rings.length) return this.finish(raceGold(a.time), `I finished the ring race in ${a.time.toFixed(1)} seconds!`, 'race', +a.time.toFixed(1), true); this.rings[a.i].m.visible = true; }
      this.say(`🏁 ${a.i}/${this.rings.length}   ⏱ ${a.time.toFixed(1)} s`);
    }
  }
  takeStar(s) {
    if (this.api.track) this.api.track('star');
    const d = this.data; if (d.stars.includes(s.i)) return;
    d.stars.push(s.i); s.m.visible = s.ring.visible = false; const p = this.api.profile(); p.stats.gold += 3; this.api.sfx('correct');
    if (d.stars.length < STARS.length && this.api.ui.toast) this.api.ui.toast(`★ ${d.stars.length}/${STARS.length} · +3 vàng · đủ ${STARS.length} sao thưởng thêm 20 vàng`);
    if (d.stars.length === STARS.length) { p.stats.gold += 20; this.api.sfx('fanfare'); this.api.ui.dialogue([{ who: 'Ngọc', en: 'I found all twelve stars! (+20 gold)' }]); }
    this.api.save(); this.api.onNote();
  }
  markers() { const a = this.active; if (!this.root.visible) return []; if (a && a.id === 'race') { const r = this.rings[a.i]; return [{ x: r.x, z: r.z, text: '🏁', color: '#8fd8ff' }]; } return a ? [] : STARTS.map((s) => ({ x: s.x, z: s.z, text: '♪', color: '#b8f0a0' })); }
}
