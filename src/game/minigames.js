// Play areas with no English in them: fishing at the dock, apple catching in the orchard, a ring race round
// the west meadow and twelve hidden stars. They exist so the village is fun between lessons; rewards are small.
import * as THREE from 'three';
import * as L from '../core/layout.js';

export const STARS = [[-46, -6], [-38, -34], [-12, -38], [30, -30], [48, -12], [52, 20], [44, 38], [10, 50], [-22, 50], [-48, 30], [-30, 14], [8, -36]];
export const RACE = [[-20, 2], [-32, 4], [-42, 14], [-40, 28], [-34, 42], [-18, 46], [-6, 44], [-8, 30], [-20, 2]];
export const STARTS = [
  { id: 'fish', x: 19.8, z: 19.2, text: 'E · Câu cá (trò chơi)', sign: '🎣 Fishing' },
  { id: 'apple', x: 33.5, z: 6, text: 'E · Hứng táo (trò chơi)', sign: '🍎 Apple catch' },
  { id: 'race', x: -22, z: 4, text: 'E · Chạy vòng (trò chơi)', sign: '🏁 Ring race' },
  { id: 'candy', x: -4.4, z: -8.5, text: 'E · Xếp kẹo (trò chơi)', sign: '🍬 Candy Match', board: true },
  { id: 'sling', x: -20, z: -4, text: 'E · Bắn súng cao su (trò chơi)', sign: '🎯 Slingshot', board: true },
  { id: 'race2', x: 10, z: 28, text: 'E · Đua xe bí ngô (trò chơi)', sign: '🏎 Cart Race', board: true },
  { id: 'blocks', x: -26, z: -2, text: 'E · Xếp hình (trò chơi)', sign: '🧱 Blocks', board: true },
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
    const shape = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 0.2 : 0.46; shape[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); }
    const sg = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }); sg.translate(0, 0, -0.07);
    this.stars = STARS.map(([x, z], i) => { const m = new THREE.Mesh(sg, glow(0xffd23c)); m.position.set(x, V.groundHeight(x, z) + 1.0, z); m.castShadow = true; this.root.add(m); return { m, x, z, i }; });
    // race rings
    const rg = new THREE.TorusGeometry(1.25, 0.11, 8, 28);
    this.rings = RACE.slice(1).map(([x, z], i) => { const m = new THREE.Mesh(rg, glow(0x58c8ff, 1.2)); const [px, pz] = RACE[i]; m.position.set(x, V.groundHeight(x, z) + 1.45, z); m.rotation.y = Math.atan2(x - px, z - pz); m.visible = false; this.root.add(m); return { m, x, z }; });
    // falling apples (pool)
    const ag = new THREE.SphereGeometry(0.26, 12, 9), red = new THREE.MeshStandardMaterial({ color: 0xe23a2a, roughness: 0.45 }), gold = glow(0xffc83c, 1.2);
    this.apples = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(ag, red); m.visible = false; m.castShadow = true; this.root.add(m); return { m, live: false, red, gold }; });
    // start signs
    for (const s of STARTS) {
      const y = V.groundHeight(s.x, s.z), post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a30 })); post.position.set(s.x + 0.9, y + 0.95, s.z - 0.9); post.castShadow = true; this.root.add(post);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72; const c = cv.getContext('2d'); c.fillStyle = '#fff4dc'; c.strokeStyle = '#b98a52'; c.lineWidth = 6; c.beginPath(); c.roundRect(4, 4, 248, 64, 14); c.fill(); c.stroke(); c.fillStyle = '#4a2a10'; c.font = '700 30px sans-serif'; c.textAlign = 'center'; c.fillText(s.sign, 128, 47);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.scale.set(2.3, 0.65, 1); sp.position.set(s.x + 0.9, y + 2.25, s.z - 0.9); this.root.add(sp);
    }
    this.setRegion(L.NAME);
  }
  get data() { const p = this.api.profile(); if (!p) return { stars: [], best: {} }; return p.mini || (p.mini = { stars: [], best: {} }); }
  setRegion(name) { this.root.visible = name === 'village'; if (name !== 'village') this.stop(); this.syncStars(); }
  syncStars() { const got = this.data.stars; for (const s of this.stars) s.m.visible = !got.includes(s.i); }
  say(text) { if (text !== this.note) { this.note = text; this.api.onNote(); } }
  stop() { if (!this.active) return; this.active = null; for (const r of this.rings) r.m.visible = false; for (const a of this.apples) { a.live = false; a.m.visible = false; } this.say(''); }

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
    if (s.board) return this.api.board(id);
    if (id === 'fish') { this.active = { id, s, cast: 0, caught: 0, pos: 0, centre: 0.5, width: 0.26, speed: 1.6, wait: 0, msg: '' }; this.newCast(); }
    if (id === 'apple') this.active = { id, s, time: 30, score: 0, next: 0.5 };
    if (id === 'race') { this.active = { id, s, i: 0, time: 0 }; this.rings.forEach((r, k) => { r.m.visible = k === 0; }); }
  }
  newCast() { const a = this.active; a.cast += 1; a.centre = 0.2 + Math.random() * 0.6; a.width = Math.max(0.12, 0.28 - a.cast * 0.03); a.speed = 1.5 + a.cast * 0.35; a.wait = 0; a.hold = false; }
  pull() {
    const a = this.active; if (!a || a.id !== 'fish' || a.wait > 0) return;
    const ok = fishHit(a.pos, a.centre, a.width); if (ok) a.caught += 1;
    this.api.sfx(ok ? 'correct' : 'wrong'); a.msg = ok ? 'Got one!' : 'It got away…'; a.wait = 0.9;
  }
  finish(gold, text, key, score, lowerIsBetter) {
    const p = this.api.profile(), best = this.data.best, old = best[key];
    const record = old === undefined || (lowerIsBetter ? score < old : score > old); if (record) best[key] = score;
    p.stats.gold += gold; this.stop(); this.api.sfx('fanfare'); this.api.save();
    this.api.ui.dialogue([{ who: 'Ngọc', en: `${text} (+${gold} gold)`, vi: record ? 'Kỷ lục mới của con!' : undefined }]);
  }

  update(dt, pos) {
    if (!this.root.visible) return;
    this.t += dt;
    for (const s of this.stars) if (s.m.visible) {
      s.m.rotation.y = this.t * 1.8 + s.i; s.m.position.y += Math.sin(this.t * 2.4 + s.i) * 0.003;
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
      if (a.next <= 0) { a.next = 0.55 + Math.random() * 0.5; const f = this.apples.find((x) => !x.live); if (f) { const ang = Math.random() * 6.28, r = Math.sqrt(Math.random()) * ORCHARD.r; f.x = ORCHARD.x + Math.cos(ang) * r; f.z = ORCHARD.z + Math.sin(ang) * r; if (L.walkable(f.x, f.z, 0.5)) { f.live = true; f.y = 7; f.gold = Math.random() < 0.12; f.m.material = f.gold ? f.goldMat || (f.goldMat = this.apples[0].gold) : this.apples[0].red; f.m.visible = true; } } }
      for (const f of this.apples) if (f.live) {
        f.y -= dt * 3.4; const g = L.groundHeight(f.x, f.z); f.m.position.set(f.x, g + f.y, f.z);
        if (f.y < 2.0 && Math.hypot(pos.x - f.x, pos.z - f.z) < 1.25) { a.score += f.gold ? 3 : 1; this.api.sfx('correct'); f.live = false; f.m.visible = false; }
        else if (f.y <= 0.2) { f.live = false; f.m.visible = false; }
      }
      if (a.time <= 0) return this.finish(appleGold(a.score), `I caught ${a.score} apples!`, 'apple', a.score);
      this.say(`🍎 ${a.score}   ⏱ ${Math.ceil(a.time)} s`);
    } else if (a.id === 'race') {
      a.time += dt; const r = this.rings[a.i];
      r.m.scale.setScalar(1 + Math.sin(this.t * 5) * 0.06);
      if (Math.hypot(pos.x - r.x, pos.z - r.z) < 1.9) { r.m.visible = false; a.i += 1; this.api.sfx('tick'); if (a.i >= this.rings.length) return this.finish(raceGold(a.time), `I finished the ring race in ${a.time.toFixed(1)} seconds!`, 'race', +a.time.toFixed(1), true); this.rings[a.i].m.visible = true; }
      this.say(`🏁 ${a.i}/${this.rings.length}   ⏱ ${a.time.toFixed(1)} s`);
    }
  }
  takeStar(s) {
    const d = this.data; if (d.stars.includes(s.i)) return;
    d.stars.push(s.i); s.m.visible = false; const p = this.api.profile(); p.stats.gold += 3; this.api.sfx('correct');
    if (d.stars.length === STARS.length) { p.stats.gold += 20; this.api.sfx('fanfare'); this.api.ui.dialogue([{ who: 'Ngọc', en: 'I found all twelve stars! (+20 gold)' }]); }
    this.api.save(); this.api.onNote();
  }
  markers() { const a = this.active; if (!this.root.visible) return []; if (a && a.id === 'race') { const r = this.rings[a.i]; return [{ x: r.x, z: r.z, text: '🏁', color: '#8fd8ff' }]; } return a ? [] : STARTS.map((s) => ({ x: s.x, z: s.z, text: '♪', color: '#b8f0a0' })); }
}
