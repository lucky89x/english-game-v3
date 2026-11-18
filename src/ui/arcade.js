// Arcade overlay: a canvas board over the 3D world for the skill games that are not played with Ngọc's body.
// Each game is { title, help, start(api), draw(ctx, w, h, t), click(x, y), key(code), done() -> result | null }.
import { rule, TIER_NAME } from '../core/tiers.js';
import { N, KINDS, idx, newBoard, move, hasMove, candyReward } from '../core/match3.js';
import * as BL from '../core/blocks.js';
import * as SP from '../core/spell.js';
import { speak } from './speech.js';

export class Arcade {
  constructor(onFinish) {
    this.onFinish = onFinish; this.game = null;
    const el = document.createElement('div'); el.id = 'arcade'; el.className = 'hidden';
    el.innerHTML = '<div class="card box"><div class="head"><b id="arctitle"></b><span id="arcinfo"></span><button id="arcquit">Thoát ✕</button></div><canvas id="arccv" width="560" height="560"></canvas><div class="help" id="archelp"></div></div>';
    document.body.appendChild(el); this.el = el; this.cv = el.querySelector('#arccv'); this.ctx = this.cv.getContext('2d');
    const at = (e) => { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) * this.cv.width / r.width, (e.clientY - r.top) * this.cv.height / r.height]; };
    this.cv.addEventListener('click', (e) => { if (this.game && this.game.click) this.game.click(...at(e)); });
    this.cv.addEventListener('pointerdown', (e) => { if (this.game && this.game.down) { this.cv.setPointerCapture(e.pointerId); this.game.down(...at(e)); } });
    this.cv.addEventListener('pointermove', (e) => { if (this.game && this.game.drag) this.game.drag(...at(e)); });
    this.cv.addEventListener('pointerup', (e) => { if (this.game && this.game.up) this.game.up(...at(e)); });
    el.querySelector('#arcquit').addEventListener('click', () => this.close(null));
  }
  get open() { return !!this.game; }
  start(game) { this.game = game; this.t = 0; this.el.classList.remove('hidden'); this.el.querySelector('#arctitle').textContent = game.title; this.el.querySelector('#archelp').textContent = game.help; }
  close(result) { const g = this.game; this.game = null; this.el.classList.add('hidden'); if (g) this.onFinish(g, result); }
  key(code) { if (!this.game) return false; if (code === 'Escape') this.close(null); else if (this.game.key) this.game.key(code); return true; }
  update(dt, held = new Set()) {
    const g = this.game; if (!g) return;
    this.t += dt;
    try { g.update(dt, held); g.draw(this.ctx, this.cv.width, this.cv.height, this.t); }
    catch (e) { console.error('arcade game failed', e); this.close(null); return; }      // a broken game closes instead of freezing the screen (18/11)
    this.el.querySelector('#arcinfo').textContent = g.info();
    const res = g.done(); if (res) this.close(res);
  }
}

const GEMS = [['#e8443a', '●'], ['#f6c62e', '◆'], ['#4fb85a', '▲'], ['#3d8fd6', '■'], ['#b684e8', '★'], ['#ff8fc0', '♥']];
/** Candy Match: swap two neighbouring sweets to line up three. 25 moves. */
export function candyGame(rnd = Math.random, tier = 1) {
  const R = rule('candy', tier);
  const g = { title: '🍬 Candy Match', help: 'Bấm 2 viên kẹo cạnh nhau để đổi chỗ. Xếp 3 viên giống nhau thành hàng. ' + R.moves + ' lượt.', board: newBoard(rnd), sel: -1, moves: R.moves, score: 0, flash: 0, combo: 0, pop: [] };
  const cell = 560 / N;
  g.info = () => `Điểm ${g.score} · Còn ${g.moves} lượt`;
  g.update = (dt) => { g.flash = Math.max(0, g.flash - dt); g.pop = g.pop.filter((p) => (p.t -= dt) > 0); };
  g.click = (x, y) => {
    const i = idx(Math.floor(y / cell), Math.floor(x / cell)); if (g.moves <= 0 || i < 0 || i >= N * N) return;
    if (g.sel < 0 || g.sel === i) { g.sel = g.sel === i ? -1 : i; return; }
    const r = move(g.board, g.sel, i, rnd);
    if (r.ok) { g.moves -= 1; g.score += r.score; g.combo = r.combo; g.flash = 0.5; g.pop.push({ x, y, t: 0.9, text: '+' + r.score + (r.combo > 1 ? '  x' + r.combo : '') }); g.sel = -1; if (!hasMove(g.board)) g.board = newBoard(rnd); }
    else g.sel = i;
  };
  g.done = () => (g.moves <= 0 && g.flash <= 0 ? { id: 'candy', score: g.score, ...candyReward(g.score), text: `Candy Match: ${g.score} points!` } : null);
  g.draw = (c, w, h, t) => {
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const i = idx(r, k), [col, sym] = GEMS[g.board[i] % KINDS], x = k * cell, y = r * cell, on = i === g.sel, bob = on ? Math.sin(t * 9) * 3 : 0;
      c.fillStyle = (r + k) % 2 ? '#f8e6c0' : '#fdf0d2'; c.fillRect(x, y, cell, cell);
      c.beginPath(); c.arc(x + cell / 2, y + cell / 2 + bob, cell * 0.38, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = on ? 5 : 2.5; c.strokeStyle = on ? '#4a2a10' : 'rgba(74,42,16,.45)'; c.stroke();
      c.beginPath(); c.arc(x + cell * 0.38, y + cell * 0.36 + bob, cell * 0.1, 0, 7); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
      c.fillStyle = 'rgba(255,255,255,.92)'; c.font = `800 ${Math.round(cell * 0.34)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sym, x + cell / 2, y + cell / 2 + 2 + bob);
    }
    for (const p of g.pop) { c.globalAlpha = Math.min(1, p.t * 2); c.fillStyle = '#4a2a10'; c.font = '800 30px sans-serif'; c.textAlign = 'center'; c.fillText(p.text, p.x, p.y - (0.9 - p.t) * 60); c.globalAlpha = 1; }
  };
  return g;
}

const BCOL = ['#f0f0f0', '#4fc8e8', '#f6c62e', '#b684e8', '#5fb84a', '#e8443a', '#3d6fc6', '#f08a2c'];
/** Falling Blocks: arrows or WASD move, up/W turns, down/S drops faster, Space drops at once. Ends when the stack reaches the top. */
/** cards: the unit's words; each cleared line shows and reads one of them (18/11: English inside the game). */
export function blocksGame(rnd = Math.random, cards = [], tier = 1) {
  const R = rule('blocks', tier);
  const bag = []; const next = () => { if (!bag.length) { const ks = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ks[i], ks[j]] = [ks[j], ks[i]]; } bag.push(...ks); } return bag.shift(); };
  const g = { title: '🧱 Falling Blocks', help: 'Bấm chuột để xoay · ← → (A D) di chuyển · ↓ (S) rơi nhanh · Space thả ngay. Mỗi hàng xóa được tặng một từ tiếng Anh, nhớ nó: cuối trò bác Max sẽ hỏi!',
    board: BL.empty(), piece: BL.spawn(next()), nextK: next(), score: 0, lines: 0, timer: 0, over: false, endT: 0, flash: 0, words: [], word: null };
  const pool = [...cards].sort(() => rnd() - 0.5);
  const speed = () => Math.max(0.07, R.fall - Math.floor(g.lines / 3) * 0.04);      // faster again (18/11: "still a bit slow")
  const land = () => {
    const n = BL.lock(g.board, g.piece); g.lines += n; g.score += BL.LINE_SCORE[n] + 5; if (n) g.flash = 0.25;
    if (n && pool.length) { const c = pool[g.words.length % pool.length]; if (!g.words.includes(c)) g.words.push(c); g.word = c; g.wordT = 3.5; speak(c.word, true, 0.8); }      // a word for every clear
    g.piece = BL.spawn(g.nextK); g.nextK = next(); if (!BL.fits(g.board, g.piece)) g.over = true;
  };
  g.info = () => `Điểm ${g.score} · Hàng ${g.lines}`;
  g.key = (code) => {
    if (g.over) return; const p = g.piece;
    if (code === 'ArrowLeft' || code === 'KeyA') g.piece = BL.shift(g.board, p, -1, 0);
    else if (code === 'ArrowRight' || code === 'KeyD') g.piece = BL.shift(g.board, p, 1, 0);
    else if (code === 'ArrowUp' || code === 'KeyW') g.piece = BL.shift(g.board, p, 0, 0, 1);
    else if (code === 'ArrowDown' || code === 'KeyS') { const q = BL.shift(g.board, p, 0, 1); if (q === p) land(); else { g.piece = q; g.score += 1; } g.timer = 0; }
    else if (code === 'Space') { g.piece = BL.drop(g.board, p); g.score += 2; land(); g.timer = 0; }
  };
  g.click = () => { if (!g.over) g.piece = BL.shift(g.board, g.piece, 0, 0, 1); };      // a click turns the piece (17/11)
  g.update = (dt) => {
    g.flash = Math.max(0, g.flash - dt); g.wordT = Math.max(0, (g.wordT || 0) - dt); if (g.over) { g.endT += dt; return; }
    g.timer += dt; if (g.timer >= speed()) { g.timer = 0; const q = BL.shift(g.board, g.piece, 0, 1); if (q === g.piece) land(); else g.piece = q; }
  };
  g.done = () => (g.over && g.endT > 0.7 ? { id: 'blocks', score: g.score, ...BL.blocksReward(g.score), words: g.words, text: `Falling Blocks: ${g.score} points, ${g.lines} lines!` } : null);
  g.draw = (c, w, h) => {
    const cs = 26, ox = 70, oy = 20;
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, w, h);
    c.fillStyle = g.flash ? '#fff8c8' : '#3a2a1e'; c.fillRect(ox - 4, oy - 4, BL.W * cs + 8, BL.H * cs + 8);
    const sq = (x, y, k, a = 1) => { c.globalAlpha = a; c.fillStyle = BCOL[k]; c.fillRect(ox + x * cs + 1, oy + y * cs + 1, cs - 2, cs - 2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(ox + x * cs + 3, oy + y * cs + 3, cs - 6, 5); c.globalAlpha = 1; };
    for (let y = 0; y < BL.H; y++) for (let x = 0; x < BL.W; x++) { const k = g.board[y * BL.W + x]; if (k) sq(x, y, k); else { c.fillStyle = (x + y) % 2 ? '#47362a' : '#4d3b2e'; c.fillRect(ox + x * cs, oy + y * cs, cs, cs); } }
    if (!g.over) { for (const [x, y] of BL.cells(BL.drop(g.board, g.piece))) if (y >= 0) sq(x, y, g.piece.k + 1, 0.25); for (const [x, y] of BL.cells(g.piece)) if (y >= 0) sq(x, y, g.piece.k + 1); }
    c.fillStyle = '#4a2a10'; c.font = '800 20px sans-serif'; c.textAlign = 'left'; c.fillText('Next', 370, 50);
    for (const [x, y] of BL.cells({ k: g.nextK, r: 0, x: 0, y: 0 })) { c.fillStyle = BCOL[g.nextK + 1]; c.fillRect(372 + x * 26, 66 + y * 26, 24, 24); }
    c.fillStyle = '#4a2a10'; c.fillText(`Score ${g.score}`, 370, 190); c.fillText(`Lines ${g.lines}`, 370, 222); c.fillText(`Speed ${Math.floor(g.lines / 3) + 1}`, 370, 254);
    // the word won by the last cleared line, and how many words were collected
    c.fillStyle = g.wordT > 0 ? '#fff1b8' : '#f8e6c0'; c.beginPath(); c.roundRect(360, 290, 186, 150, 14); c.fill(); c.strokeStyle = '#b98a52'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#7a4a1a'; c.font = '700 15px sans-serif'; c.fillText(`📖 Words: ${g.words.length}`, 372, 314);
    if (g.word) { c.fillStyle = '#2a5a9a'; c.font = `900 ${g.word.word.length > 10 ? 20 : 26}px sans-serif`; c.fillText(g.word.word, 372, 356, 166); c.fillStyle = '#7a3e00'; c.font = '700 15px sans-serif'; c.fillText(g.word.vi, 372, 386, 166); }
    else { c.fillStyle = '#9a8060'; c.font = '600 14px sans-serif'; c.fillText('Xóa một hàng', 372, 356); c.fillText('để nhận từ mới!', 372, 378); }
    if (g.over) { c.fillStyle = 'rgba(255,244,220,.9)'; c.fillRect(ox, 230, BL.W * cs, 80); c.fillStyle = '#c8352e'; c.font = '800 30px sans-serif'; c.textAlign = 'center'; c.fillText('Game over!', ox + BL.W * cs / 2, 280); }
  };
  return g;
}

/** Slingshot: drag back from the sling and let go; the pebble flies in an arc. 12 pebbles, target drones and clay discs. */
export function slingGame(rnd = Math.random, tier = 1) {
  const R = rule('sling', tier);
  const SX = 280, SY = 470, G = 520;
  const g = { title: '🎯 Slingshot', help: 'Nhấn giữ chuột ở ná, kéo ngược về sau rồi thả. Kéo càng xa bay càng mạnh. Bắn trúng drone bia và đĩa bay. ' + R.shots + ' viên.',
    shots: R.shots, score: 0, hits: 0, aim: null, rock: null, pop: [], t: 0, endT: 0, targets: [] };
  // targets (18/11: "too childish for grades 6-8"): hovering target drones and flying clay discs
  const add = () => { const row = Math.floor(rnd() * 3), drone = rnd() < 0.6, dir = rnd() < 0.5 ? 1 : -1, y = 90 + row * 85 + rnd() * 20;
    g.targets.push({ x: dir > 0 ? -30 : 590, y, yy: y, vx: dir * (26 + rnd() * 34 + row * 8) * R.speed, r: (drone ? 22 : 17) * R.size, drone, col: drone ? ['#e8443a', '#2f6fd0', '#2e9a5a'][Math.floor(rnd() * 3)] : '#f08a2c', ph: rnd() * 6 }); };   // yy set at once: a new target is drawn before its first update
  for (let i = 0; i < 5; i++) { add(); g.targets[i].x = 60 + i * 100; }
  g.info = () => `Điểm ${g.score} · Còn ${g.shots + (g.rock ? 1 : 0)} viên`;
  g.down = (x, y) => { if (!g.rock && g.shots > 0 && Math.hypot(x - SX, y - SY) < 90) g.aim = { x, y }; };
  g.drag = (x, y) => { if (g.aim) { const dx = x - SX, dy = y - SY, d = Math.hypot(dx, dy), m = Math.min(d, 120) / (d || 1); g.aim = { x: SX + dx * m, y: SY + dy * m }; } };
  g.up = () => { if (!g.aim) return; const dx = SX - g.aim.x, dy = SY - g.aim.y; g.aim = null; if (Math.hypot(dx, dy) < 15) return; g.rock = { x: SX, y: SY, vx: dx * 6.2, vy: dy * 6.2 }; g.shots -= 1; };
  g.update = (dt) => {
    g.t += dt; g.pop = g.pop.filter((p) => (p.t -= dt) > 0);
    for (const tg of g.targets) { tg.x += tg.vx * dt; tg.yy = tg.y + Math.sin(g.t * 3 + tg.ph) * 8; }
    g.targets = g.targets.filter((tg) => tg.x > -60 && tg.x < 620 && !tg.dead); while (g.targets.length < 5) add();
    const r = g.rock; if (r) {
      r.vy += G * dt; r.x += r.vx * dt; r.y += r.vy * dt;
      for (const tg of g.targets) if (!tg.dead && Math.hypot(r.x - tg.x, r.y - tg.yy) < tg.r + 7) { tg.dead = true; const pts = Math.round(10 + Math.abs(tg.vx) / 3); g.score += pts; g.hits += 1; g.pop.push({ x: tg.x, y: tg.yy, t: 0.8, text: '+' + pts }); }
      if (r.y > 600 || r.x < -40 || r.x > 600) g.rock = null;
    }
    if (g.shots <= 0 && !g.rock) g.endT += dt;
  };
  g.done = () => (g.endT > 0.8 ? { id: 'sling', score: g.score, gold: Math.min(30, Math.floor(g.score / 12)), exp: Math.min(40, Math.floor(g.score / 8)), text: `Slingshot: ${g.hits} hits, ${g.score} points!` } : null);
  // drawing: sky with clouds and hills; the pebble is shaded
  const shade = (c, x, y, r, col, light) => { const gr = c.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.1); gr.addColorStop(0, light); gr.addColorStop(0.55, col); gr.addColorStop(1, col); return gr; };
  g.draw = (c, w, h, t = 0) => {
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#7cc8ff'); sky.addColorStop(0.7, '#d8f0ff'); sky.addColorStop(1, '#f4fbff'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,236,150,.9)'; c.beginPath(); c.arc(480, 70, 34, 0, 7); c.fill(); c.fillStyle = 'rgba(255,236,150,.25)'; c.beginPath(); c.arc(480, 70, 52, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)';
    for (const [cx, cy, k] of [[90, 60, 1], [300, 40, 0.8], [420, 150, 0.7], [160, 190, 0.6]]) { const x = ((cx + g.t * 8 * k) % (w + 160)) - 80; for (const [dx, dy, r] of [[0, 0, 22], [22, -8, 26], [46, 0, 20], [24, 8, 20]]) { c.beginPath(); c.arc(x + dx * k * 1.4, cy + dy * k, r * k * 1.3, 0, 7); c.fill(); } }
    c.fillStyle = '#a8d98a'; c.beginPath(); c.moveTo(0, 470); for (let x = 0; x <= w; x += 20) c.lineTo(x, 455 - Math.sin(x / 70) * 18); c.lineTo(w, 520); c.lineTo(0, 520); c.fill();
    c.fillStyle = '#7fcf5a'; c.fillRect(0, 500, w, 60); c.fillStyle = '#5fae3c'; for (let x = 0; x < w; x += 40) { c.beginPath(); c.arc(x + 20, 500, 22, Math.PI, 0); c.fill(); }
    for (const tg of g.targets) {
      const x = tg.x, y = tg.yy, r = tg.r; if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (tg.drone) {          // a round target board carried by a little quad drone
        c.fillStyle = 'rgba(30,40,60,.12)'; c.beginPath(); c.ellipse(x, y + r * 1.6, r * 0.9, r * 0.18, 0, 0, 7); c.fill();
        c.strokeStyle = '#3a3f48'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - r * 1.3, y - r * 1.15); c.lineTo(x + r * 1.3, y - r * 1.15); c.stroke();
        for (const sx of [-1, 1]) { const px = x + sx * r * 1.3, spin = Math.abs(Math.sin(g.t * 40 + sx)); c.fillStyle = '#2a2e35'; c.fillRect(px - 3, y - r * 1.3, 6, 8); c.fillStyle = 'rgba(200,210,225,.75)'; c.beginPath(); c.ellipse(px, y - r * 1.32, r * 0.55 * spin + 2, 2.5, 0, 0, 7); c.fill(); }
        c.strokeStyle = '#3a3f48'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - r * 1.15); c.lineTo(x, y - r); c.stroke();
        for (const [k, col] of [[1, '#ffffff'], [0.8, tg.col], [0.6, '#ffffff'], [0.4, tg.col], [0.18, '#ffd23c']]) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r * k, 0, 7); c.fill(); }
        c.strokeStyle = '#2a2e35'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.45, r * 0.3, r * 0.14, -0.5, 0, 7); c.fill();
      } else {                 // clay disc flying with a little tilt and a motion trail
        const tilt = Math.sin(g.t * 3 + tg.ph) * 0.25, dir = Math.sign(tg.vx) || 1;
        c.fillStyle = 'rgba(240,138,44,.18)'; c.beginPath(); c.ellipse(x - dir * r * 1.4, y + 1, r * 1.3, r * 0.22, 0, 0, 7); c.fill();
        c.save(); c.translate(x, y); c.rotate(tilt);
        c.fillStyle = '#b8561a'; c.beginPath(); c.ellipse(0, 3, r, r * 0.34, 0, 0, 7); c.fill();
        c.fillStyle = tg.col; c.beginPath(); c.ellipse(0, 0, r, r * 0.34, 0, 0, 7); c.fill();
        c.strokeStyle = '#7a3a10'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, r * 0.55, r * 0.18, 0, 0, 7); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.1, r * 0.25, r * 0.07, 0, 0, 7); c.fill();
        c.restore();
      }
    }
    c.strokeStyle = '#7a4a26'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(SX, 560); c.lineTo(SX, SY + 25); c.lineTo(SX - 28, SY - 18); c.moveTo(SX, SY + 25); c.lineTo(SX + 28, SY - 18); c.stroke();
    const pull = g.aim || { x: SX, y: SY };
    c.strokeStyle = '#4a2a10'; c.lineWidth = 3; c.beginPath(); c.moveTo(SX - 28, SY - 18); c.lineTo(pull.x, pull.y); c.lineTo(SX + 28, SY - 18); c.stroke();
    if (g.aim) { let x = SX, y = SY, vx = (SX - g.aim.x) * 6.2, vy = (SY - g.aim.y) * 6.2; c.fillStyle = 'rgba(74,42,16,.35)'; for (let i = 0; i < 14; i++) { for (let k = 0; k < 4; k++) { vy += G / 120; x += vx / 120; y += vy / 120; } c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } }
    const pebble = (x, y) => { c.fillStyle = shade(c, x, y, 8, '#8f8a84', '#e0dcd6'); c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); c.strokeStyle = '#5a5650'; c.lineWidth = 1.5; c.stroke(); };
    if (!g.rock && g.shots > 0) pebble(pull.x, pull.y);
    if (g.rock) pebble(g.rock.x, g.rock.y);
    for (const p of g.pop) { c.globalAlpha = Math.min(1, p.t * 2); c.fillStyle = '#4a2a10'; c.font = '800 26px sans-serif'; c.textAlign = 'center'; c.fillText(p.text, p.x, p.y - (0.8 - p.t) * 50); c.globalAlpha = 1; }
  };
  return g;
}

/** Letter lock: the Vietnamese meaning is shown; click the letter tiles in order to spell the English word. */
export function spellGame(card, rnd = Math.random) {
  const tl = SP.tiles(card.word, rnd), st = { word: card.word, typed: '', wrong: 0 };
  const cols = Math.min(7, tl.length), rows = Math.ceil(tl.length / cols), size = Math.min(70, Math.floor(500 / cols) - 8);
  const tileAt = (i) => { const r = Math.floor(i / cols), k = i % cols, n = Math.min(cols, tl.length - r * cols); return [280 - (n * (size + 8)) / 2 + k * (size + 8) + 4, 330 + r * (size + 10)]; };
  const g = { title: '🔒 Word Chest', help: 'Ghép chữ tiếng Anh theo nghĩa tiếng Việt: bấm các chữ cái theo đúng thứ tự. Bấm sai không sao, chỉ ít vàng hơn.', shake: 0, endT: 0, hint: false, card };
  g.info = () => `Sai ${st.wrong} lần`;
  g.click = (x, y) => {
    if (st.typed.length === SP.letters(card.word).length) return;
    for (let i = 0; i < tl.length; i++) { const [tx, ty] = tileAt(i); if (x >= tx && x <= tx + size && y >= ty && y <= ty + size) { const r = SP.press(st, tl, i); if (r === 'wrong') { g.shake = 0.35; if (st.wrong >= 3) g.hint = true; } return; } }
  };
  g.key = (code) => { const m = /^Key([A-Z])$/.exec(code); if (!m) return; const ch = m[1].toLowerCase(), i = tl.findIndex((t) => !t.used && t.ch === ch); const r = i >= 0 ? SP.press(st, tl, i) : (st.wrong += 1, 'wrong'); if (r === 'wrong') { g.shake = 0.35; if (st.wrong >= 3) g.hint = true; } };
  g.update = (dt) => { g.shake = Math.max(0, g.shake - dt); if (st.typed.length === SP.letters(card.word).length) g.endT += dt; };
  g.done = () => (g.endT > 0.9 ? { id: 'chest', card, wrong: st.wrong, ...SP.chestReward(st.wrong), text: `The chest is open: "${card.word}"!` } : null);
  g.state = st; g.tiles = tl; g.tileAt = tileAt; g.size = size;
  g.draw = (c, w, h, t) => {
    const grd = c.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#5a3a20'); grd.addColorStop(1, '#3a2414'); c.fillStyle = grd; c.fillRect(0, 0, w, h);
    c.fillStyle = '#9a5a2c'; c.fillRect(150, 40, 260, 120); c.fillStyle = '#e2b04a'; c.fillRect(150, 92, 260, 14); c.fillRect(268, 40, 24, 120);
    const sx = Math.sin(t * 60) * g.shake * 14, done = g.endT > 0;
    c.fillStyle = done ? '#7fd86a' : '#ffd23c'; c.beginPath(); c.roundRect(258 + sx, 112, 44, 40, 8); c.fill();
    c.fillStyle = '#fff4dc'; c.font = '700 24px sans-serif'; c.textAlign = 'center'; c.fillText(card.vi, 280, 205);
    c.font = '800 38px monospace'; c.fillStyle = done ? '#9be45a' : '#ffffff'; c.fillText(SP.shown(st).split('').join(' '), 280 + sx, 262);
    if (g.hint && !done) { c.font = '600 17px sans-serif'; c.fillStyle = '#ffd88a'; c.fillText('Gợi ý: chữ cái tiếp theo đang sáng', 280, 300); }
    const need = SP.letters(card.word)[st.typed.length];
    tl.forEach((tt, i) => {
      const [x, y] = tileAt(i); if (tt.used) { c.globalAlpha = 0.25; }
      c.fillStyle = g.hint && !tt.used && tt.ch === need ? '#ffe28a' : '#fff4dc'; c.beginPath(); c.roundRect(x, y, size, size, 10); c.fill(); c.strokeStyle = '#b98a52'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#4a2a10'; c.font = `800 ${Math.round(size * 0.55)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tt.ch, x + size / 2, y + size / 2 + 2); c.textBaseline = 'alphabetic'; c.globalAlpha = 1;
    });
    if (done) { c.fillStyle = '#ffe28a'; c.font = '800 34px sans-serif'; c.fillText('Opened!', 280, 525); }
  };
  return g;
}

/** Kart Race (18/11: "no mission, no rivals, ugly carts"): hold ← → (A D) to steer on a winding road, race three rival
 *  karts and spell English words: the Vietnamese meaning is shown at the top, letter coins lie on the road, drive
 *  through the next letter of the word. A finished word is read aloud and scores a bonus; a wrong letter slows you.
 *  Rocks cost a heart, mud slows you down. 60 seconds, 3 hearts; the final place pays extra. */
export function raceGame(rnd = Math.random, cards = [], tier = 1) {
  const R = rule('race', tier);
  const words = cards.filter((c) => SP.spellable(c.word) && SP.letters(c.word).length >= 3 && SP.letters(c.word).length <= 9).sort(() => rnd() - 0.5);
  const g = { title: '🏎 Kart Race', help: 'Giữ ← → (A D) để lái. Ăn đồng xu vàng, né đá, tránh bùn, vượt 3 xe đối thủ trong 60 giây.', help: 'Giữ ← → (A D) để lái. Đi qua đồng xu có CHỮ CÁI TIẾP THEO của từ tiếng Anh (nghĩa ở trên cùng) để ghép từ. Né đá, tránh bùn, vượt 3 xe đối thủ. 60 giây, 3 tim.',
    x: 280, coins: 0, time: 60, hearts: 3, dist: 0, speed: 250, things: [], next: 0.5, hurt: 0, endT: 0, steer: 0, done_: [], wi: 0, got: 0, bad: 0, flash: 0, bonus: 0,
    rivals: [['#2f6fd0', 160, 0.98], ['#2e9a5a', 300, 1.0], ['#8a4ad0', 440, 1.02]].map(([col, ahead, k], i) => ({ col, d: ahead, k: k + R.rival, off: (i - 1) * 60, ph: i * 2, num: i + 2 })) };
  const roadAt = (y) => 280 + Math.sin((g.dist - y) / 260) * 90;          // centre of the road at screen height y
  const word = () => words[g.wi % Math.max(1, words.length)], need = () => (word() ? SP.letters(word().word)[g.got] : '');
  const place = () => 1 + g.rivals.filter((r) => r.d > g.dist).length;
  g.info = () => `❤ ${g.hearts} · 🏁 hạng ${place()}/4 · 🔤 ${g.done_.length} từ · ⏱ ${Math.max(0, Math.ceil(g.time))} s`;
  g.update = (dt, held) => {
    g.flash = Math.max(0, g.flash - dt);
    if (g.time <= 0 || g.hearts <= 0) { g.endT += dt; return; }
    g.time -= dt; g.speed = Math.min(g.speed + dt * 40, 250 + (60 - g.time) * 6); g.dist += g.speed * dt; g.hurt = Math.max(0, g.hurt - dt);
    const steer = ((held.has('ArrowRight') || held.has('KeyD')) ? 1 : 0) - ((held.has('ArrowLeft') || held.has('KeyA')) ? 1 : 0);
    g.x = Math.max(40, Math.min(520, g.x + steer * 330 * dt)); g.steer = steer;
    for (const r of g.rivals) {               // rivals keep a steady pace near the player's best, weaving a little
      r.d += (235 + (60 - g.time) * 5.2) * r.k * dt; r.off = Math.sin((r.d + r.ph * 100) / 180) * 70;
      const ry = 470 - (r.d - g.dist), rx = roadAt(ry) + r.off;
      if (Math.abs(ry - 470) < 44 && Math.abs(rx - g.x) < 40) { g.speed *= 0.86; g.x += Math.sign(g.x - rx || 1) * 18; r.d += 6; }   // bump
    }
    g.next -= dt;
    if (g.next <= 0) {
      g.next = Math.max(0.3, 0.7 - (60 - g.time) * 0.005) * (0.75 + rnd() * 0.5) * R.gap;
      const roll = rnd(), off = (rnd() - 0.5) * 160;
      if (roll < 0.5 && word()) { const right = rnd() < 0.55, abc = 'abcdefghijklmnopqrstuvwxyz'; let ch = need(); if (!right) { do ch = abc[Math.floor(rnd() * 26)]; while (ch === need()); } g.things.push({ kind: 'letter', ch, off, y: -30 }); }
      else if (roll < 0.45) g.things.push({ kind: 'coin', off, y: -30 });      // 18/11: no spelling while racing, just coins
      else g.things.push({ kind: roll < 0.8 ? 'rock' : 'mud', off, y: -30 });
    }
    for (const t of g.things) {
      t.y += g.speed * dt; const tx = roadAt(t.y) + t.off;
      if (!t.hit && Math.abs(t.y - 470) < 26 && Math.abs(tx - g.x) < 32) {
        t.hit = true;
        if (t.kind === 'coin') { g.coins += 1; g.bonus += 6; }
        else if (t.kind === 'letter') {
          if (t.ch === need()) { g.got += 1; g.bonus += 5; if (g.got >= SP.letters(word().word).length) { g.done_.push(word()); g.bonus += 40; speak(word().word, true, 0.85); g.wi += 1; g.got = 0; g.flash = 0.8; } }
          else { g.bad += 1; g.speed *= 0.8; g.hurt = 0.3; }
        } else if (g.hurt <= 0) { if (t.kind === 'rock') g.hearts -= 1; g.hurt = t.kind === 'rock' ? 1.0 : 0.6; g.speed *= t.kind === 'rock' ? 0.5 : 0.65; }
      }
    }
    if (Math.abs(g.x - roadAt(470)) > 110) { g.dist -= g.speed * dt * 0.5; g.speed *= 0.99; }      // off the road: slow
    g.things = g.things.filter((t) => t.y < 600 && !(t.hit && (t.kind === 'letter' || t.kind === 'coin')));
  };
  const score = () => Math.floor(g.dist / 100) + g.hearts * 20 + g.bonus + (4 - place()) * 30;
  g.done = () => (g.endT > 0.8 ? { id: 'race2', score: score(), gold: Math.min(40, g.done_.length * 6 + g.coins * 2 + (4 - place()) * 4 + g.hearts * 2), exp: Math.min(50, Math.floor(score() / 6)), words: g.done_,
    text: g.hearts > 0 ? `Race over: place ${place()} of 4, ${g.coins} coins!` : `Crash! Place ${place()}, ${g.coins} coins.` } : null);
  // drawing: grass with flowers, a curbed road with lane marks, shaded rocks, mud with ripples, letter coins, top-down karts
  const kart = (c, x, y, col, num, tilt, ghost) => {
    c.save(); c.translate(x, y); c.rotate(tilt); if (ghost) c.globalAlpha = 0.5;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(4, 6, 26, 34, 0, 0, 7); c.fill();
    c.fillStyle = '#1c1c22'; for (const [wx, wy] of [[-24, -18], [24, -18], [-25, 18], [25, 18]]) { c.beginPath(); c.roundRect(wx - 7, wy - 10, 14, 20, 4); c.fill(); c.fillStyle = '#6a6a74'; c.fillRect(wx - 2, wy - 6, 4, 12); c.fillStyle = '#1c1c22'; }
    const body = c.createLinearGradient(-20, 0, 20, 0); body.addColorStop(0, col); body.addColorStop(0.5, '#ffffff'); body.addColorStop(0.55, col); body.addColorStop(1, col);
    c.fillStyle = body; c.beginPath(); c.moveTo(-16, -34); c.quadraticCurveTo(0, -42, 16, -34); c.lineTo(19, 26); c.quadraticCurveTo(0, 32, -19, 26); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#222'; c.fillRect(-22, 24, 44, 7);                   // rear wing
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(0, -16, 7, 0, 7); c.fill(); c.fillStyle = '#222'; c.font = '800 10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(num, 0, -15.5);
    const helm = c.createRadialGradient(-3, 2, 1, 0, 4, 10); helm.addColorStop(0, '#ffffff'); helm.addColorStop(1, col === '#e8443a' ? '#ffd23c' : '#d8d8e0'); c.fillStyle = helm; c.beginPath(); c.arc(0, 5, 9, 0, 7); c.fill();
    c.fillStyle = '#2a3440'; c.fillRect(-6, -1, 12, 4);                 // visor
    c.restore(); c.textBaseline = 'alphabetic';
  };
  g.draw = (c, w, h, t) => {
    c.fillStyle = '#5fb03c'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const y = ((i * 53 + g.dist) % (h + 40)) - 20, x = (i * 137) % w; c.fillStyle = i % 3 ? '#6cc044' : '#f6e27a'; c.fillRect(x, y, 3, 3); }
    for (let y = -20; y < h + 20; y += 20) {
      const cx = roadAt(y), band = Math.floor((g.dist - y) / 40) % 2;
      c.fillStyle = '#5a5e66'; c.fillRect(cx - 120, y, 240, 21);
      c.fillStyle = band ? '#ffffff' : '#e2483e'; c.fillRect(cx - 132, y, 12, 21); c.fillRect(cx + 120, y, 12, 21);
      if (Math.floor((g.dist - y) / 60) % 2) { c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(cx - 42, y, 4, 21); c.fillRect(cx + 38, y, 4, 21); }
    }
    for (let i = 0; i < 9; i++) { const y = ((i * 97 + g.dist) % (h + 80)) - 40, side = i % 2 ? 1 : -1, cx = roadAt(y) + side * (180 + (i % 3) * 25);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(cx + 8, y + 10, 24, 14, 0, 0, 7); c.fill();
      const tr = c.createRadialGradient(cx - 8, y - 8, 3, cx, y, 26); tr.addColorStop(0, '#8fdc5a'); tr.addColorStop(1, '#2f8a34'); c.fillStyle = tr; c.beginPath(); c.arc(cx, y, 24, 0, 7); c.fill(); }
    for (const tg of g.things) { const x = roadAt(tg.y) + tg.off, y = tg.y;
      if (tg.kind === 'coin' || tg.kind === 'letter') {
        const wob = Math.abs(Math.cos(t * 4 + tg.off));
        const coin = c.createRadialGradient(x - 5, y - 6, 2, x, y, 18); coin.addColorStop(0, '#fff6c0'); coin.addColorStop(1, '#e0a020'); c.fillStyle = coin;
        c.beginPath(); c.ellipse(x, y, 17 * (0.7 + 0.3 * wob), 17, 0, 0, 7); c.fill(); c.strokeStyle = '#9a6a10'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = '#4a2a10'; c.font = '900 20px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tg.kind === 'coin' ? '$' : tg.ch.toUpperCase(), x, y + 1); c.textBaseline = 'alphabetic';
      } else if (tg.kind === 'rock') {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + 5, y + 8, 24, 10, 0, 0, 7); c.fill();
        const rk = c.createRadialGradient(x - 8, y - 8, 2, x, y, 26); rk.addColorStop(0, '#d8d4ce'); rk.addColorStop(1, '#6e6a64'); c.fillStyle = rk;
        c.beginPath(); c.moveTo(x - 22, y + 6); c.lineTo(x - 14, y - 14); c.lineTo(x + 4, y - 18); c.lineTo(x + 20, y - 6); c.lineTo(x + 18, y + 10); c.lineTo(x - 6, y + 14); c.closePath(); c.fill(); c.strokeStyle = '#4a4640'; c.lineWidth = 2; c.stroke();
      } else {
        c.fillStyle = 'rgba(96,62,28,.85)'; c.beginPath(); c.ellipse(x, y, 36, 15, 0, 0, 7); c.fill();
        c.strokeStyle = 'rgba(160,120,70,.7)'; c.lineWidth = 1.5; for (const k of [0.45, 0.75]) { c.beginPath(); c.ellipse(x + 3, y, 36 * k, 15 * k, 0, 0, 7); c.stroke(); }
      } }
    for (const r of g.rivals) { const ry = 470 - (r.d - g.dist); if (ry > -60 && ry < h + 60) kart(c, roadAt(ry) + r.off, ry, r.col, r.num, Math.cos((r.d + r.ph * 100) / 180) * 0.25, false); }
    if (!(g.hurt > 0 && Math.floor(t * 12) % 2)) kart(c, g.x, 470, '#e8443a', 1, g.steer * 0.18, false);
    // the word to spell: Vietnamese meaning, then the letters found so far
    const wd = word();
    c.fillStyle = g.flash > 0 ? 'rgba(255,241,184,.95)' : 'rgba(255,248,230,.92)'; c.beginPath(); c.roundRect(110, 8, 340, 64, 14); c.fill(); c.strokeStyle = '#b98a52'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#7a3e00'; c.font = '700 16px sans-serif';
    if (wd) { c.fillText(`Spell: "${wd.vi}"`, 280, 32, 320); const L2 = SP.letters(wd.word); c.font = '900 22px monospace'; c.fillStyle = '#2a5a9a'; c.fillText(L2.map((ch, i) => (i < g.got ? ch.toUpperCase() : '_')).join(' '), 280, 60, 320); }
    else { c.fillText(`🪙 ${g.coins} xu · Né đá, vượt đối thủ!`, 280, 46); }
    if (g.time <= 0 || g.hearts <= 0) { c.fillStyle = 'rgba(255,244,220,.94)'; c.fillRect(110, 220, 340, 100); c.fillStyle = '#4a2a10'; c.font = '800 30px sans-serif'; c.fillText(g.hearts > 0 ? `Finish! Place ${place()}` : 'Crash!', 280, 262); c.font = '700 18px sans-serif'; c.fillText(`${g.done_.length} words spelled`, 280, 296); }
  };
  return g;
}

/** Marks a game with its tier: the name shows the version and the result carries the tier so the pay can grow with it. */
export function withTier(g, tier) {
  g.title += ` · ${TIER_NAME[tier]}`; g.tier = tier;
  const done = g.done; g.done = () => { const r = done(); if (r) r.tier = tier; return r; };
  return g;
}
