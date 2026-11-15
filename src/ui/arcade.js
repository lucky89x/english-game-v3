// Arcade overlay: a canvas board over the 3D world for the skill games that are not played with Ngọc's body.
// Each game is { title, help, start(api), draw(ctx, w, h, t), click(x, y), key(code), done() -> result | null }.
import { N, KINDS, idx, newBoard, move, hasMove, candyReward } from '../core/match3.js';
import * as BL from '../core/blocks.js';
import * as SP from '../core/spell.js';

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
    this.t += dt; g.update(dt, held); g.draw(this.ctx, this.cv.width, this.cv.height, this.t);
    this.el.querySelector('#arcinfo').textContent = g.info();
    const res = g.done(); if (res) this.close(res);
  }
}

const GEMS = [['#e8443a', '●'], ['#f6c62e', '◆'], ['#4fb85a', '▲'], ['#3d8fd6', '■'], ['#b684e8', '★'], ['#ff8fc0', '♥']];
/** Candy Match: swap two neighbouring sweets to line up three. 25 moves. */
export function candyGame(rnd = Math.random) {
  const g = { title: '🍬 Candy Match', help: 'Bấm 2 viên kẹo cạnh nhau để đổi chỗ. Xếp 3 viên giống nhau thành hàng. 25 lượt.', board: newBoard(rnd), sel: -1, moves: 25, score: 0, flash: 0, combo: 0, pop: [] };
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
export function blocksGame(rnd = Math.random) {
  const bag = []; const next = () => { if (!bag.length) { const ks = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ks[i], ks[j]] = [ks[j], ks[i]]; } bag.push(...ks); } return bag.shift(); };
  const g = { title: '🧱 Falling Blocks', help: 'Phím ← → (hoặc A D) di chuyển · ↑ (W) xoay · ↓ (S) rơi nhanh · Space thả ngay. Xếp kín một hàng để xóa hàng.',
    board: BL.empty(), piece: BL.spawn(next()), nextK: next(), score: 0, lines: 0, timer: 0, over: false, endT: 0, flash: 0 };
  const speed = () => Math.max(0.12, 0.8 - Math.floor(g.lines / 5) * 0.08);
  const land = () => {
    const n = BL.lock(g.board, g.piece); g.lines += n; g.score += BL.LINE_SCORE[n] + 5; if (n) g.flash = 0.25;
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
  g.update = (dt) => {
    g.flash = Math.max(0, g.flash - dt); if (g.over) { g.endT += dt; return; }
    g.timer += dt; if (g.timer >= speed()) { g.timer = 0; const q = BL.shift(g.board, g.piece, 0, 1); if (q === g.piece) land(); else g.piece = q; }
  };
  g.done = () => (g.over && g.endT > 0.7 ? { id: 'blocks', score: g.score, ...BL.blocksReward(g.score), text: `Falling Blocks: ${g.score} points, ${g.lines} lines!` } : null);
  g.draw = (c, w, h) => {
    const cs = 26, ox = 70, oy = 20;
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, w, h);
    c.fillStyle = g.flash ? '#fff8c8' : '#3a2a1e'; c.fillRect(ox - 4, oy - 4, BL.W * cs + 8, BL.H * cs + 8);
    const sq = (x, y, k, a = 1) => { c.globalAlpha = a; c.fillStyle = BCOL[k]; c.fillRect(ox + x * cs + 1, oy + y * cs + 1, cs - 2, cs - 2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(ox + x * cs + 3, oy + y * cs + 3, cs - 6, 5); c.globalAlpha = 1; };
    for (let y = 0; y < BL.H; y++) for (let x = 0; x < BL.W; x++) { const k = g.board[y * BL.W + x]; if (k) sq(x, y, k); else { c.fillStyle = (x + y) % 2 ? '#47362a' : '#4d3b2e'; c.fillRect(ox + x * cs, oy + y * cs, cs, cs); } }
    if (!g.over) { for (const [x, y] of BL.cells(BL.drop(g.board, g.piece))) if (y >= 0) sq(x, y, g.piece.k + 1, 0.25); for (const [x, y] of BL.cells(g.piece)) if (y >= 0) sq(x, y, g.piece.k + 1); }
    c.fillStyle = '#4a2a10'; c.font = '800 20px sans-serif'; c.textAlign = 'left'; c.fillText('Next', 370, 50);
    for (const [x, y] of BL.cells({ k: g.nextK, r: 0, x: 0, y: 0 })) { c.fillStyle = BCOL[g.nextK + 1]; c.fillRect(372 + x * 26, 66 + y * 26, 24, 24); }
    c.fillStyle = '#4a2a10'; c.fillText(`Score ${g.score}`, 370, 190); c.fillText(`Lines ${g.lines}`, 370, 222); c.fillText(`Speed ${Math.floor(g.lines / 5) + 1}`, 370, 254);
    if (g.over) { c.fillStyle = 'rgba(255,244,220,.9)'; c.fillRect(ox, 230, BL.W * cs, 80); c.fillStyle = '#c8352e'; c.font = '800 30px sans-serif'; c.textAlign = 'center'; c.fillText('Game over!', ox + BL.W * cs / 2, 280); }
  };
  return g;
}

/** Slingshot: drag back from the sling and let go; the pebble flies in an arc. 12 pebbles, moving slimes and balloons. */
export function slingGame(rnd = Math.random) {
  const SX = 280, SY = 470, G = 520;
  const g = { title: '🎯 Slingshot', help: 'Nhấn giữ chuột ở ná, kéo ngược về sau rồi thả. Kéo càng xa bay càng mạnh. Bắn trúng slime và bóng bay. 12 viên.',
    shots: 12, score: 0, hits: 0, aim: null, rock: null, pop: [], t: 0, endT: 0, targets: [] };
  const add = () => { const row = Math.floor(rnd() * 3), slime = rnd() < 0.6, dir = rnd() < 0.5 ? 1 : -1;
    g.targets.push({ x: dir > 0 ? -30 : 590, y: 90 + row * 85 + rnd() * 20, vx: dir * (50 + rnd() * 70 + row * 15), r: slime ? 24 : 19, slime, col: slime ? ['#7fd86a', '#ff7a6a', '#6fc8ff'][Math.floor(rnd() * 3)] : ['#f6c62e', '#ff8fc0', '#b684e8'][Math.floor(rnd() * 3)], ph: rnd() * 6 }); };
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
      for (const tg of g.targets) if (!tg.dead && Math.hypot(r.x - tg.x, r.y - tg.yy) < tg.r + 7) { tg.dead = true; const pts = Math.round(10 + Math.abs(tg.vx) / 6); g.score += pts; g.hits += 1; g.pop.push({ x: tg.x, y: tg.yy, t: 0.8, text: '+' + pts }); }
      if (r.y > 600 || r.x < -40 || r.x > 600) g.rock = null;
    }
    if (g.shots <= 0 && !g.rock) g.endT += dt;
  };
  g.done = () => (g.endT > 0.8 ? { id: 'sling', score: g.score, gold: Math.min(30, Math.floor(g.score / 12)), exp: Math.min(40, Math.floor(g.score / 8)), text: `Slingshot: ${g.hits} hits, ${g.score} points!` } : null);
  g.draw = (c, w, h) => {
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(1, '#e8f6ff'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#7fcf5a'; c.fillRect(0, 500, w, 60); c.fillStyle = '#5fae3c'; for (let x = 0; x < w; x += 40) { c.beginPath(); c.arc(x + 20, 500, 22, Math.PI, 0); c.fill(); }
    for (const tg of g.targets) {
      if (tg.slime) { c.fillStyle = tg.col; c.beginPath(); c.ellipse(tg.x, tg.yy, tg.r, tg.r * 0.8, 0, 0, 7); c.fill(); c.fillStyle = '#24140c'; for (const s of [-1, 1]) { c.beginPath(); c.arc(tg.x + s * 8, tg.yy - 3, 3.5, 0, 7); c.fill(); } }
      else { c.strokeStyle = '#8a6a48'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tg.x, tg.yy + tg.r); c.lineTo(tg.x + 4, tg.yy + tg.r + 30); c.stroke(); c.fillStyle = tg.col; c.beginPath(); c.ellipse(tg.x, tg.yy, tg.r * 0.85, tg.r, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(tg.x - 6, tg.yy - 7, 4, 0, 7); c.fill(); }
    }
    c.strokeStyle = '#7a4a26'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(SX, 560); c.lineTo(SX, SY + 25); c.lineTo(SX - 28, SY - 18); c.moveTo(SX, SY + 25); c.lineTo(SX + 28, SY - 18); c.stroke();
    const pull = g.aim || { x: SX, y: SY };
    c.strokeStyle = '#4a2a10'; c.lineWidth = 3; c.beginPath(); c.moveTo(SX - 28, SY - 18); c.lineTo(pull.x, pull.y); c.lineTo(SX + 28, SY - 18); c.stroke();
    if (g.aim) { let x = SX, y = SY, vx = (SX - g.aim.x) * 6.2, vy = (SY - g.aim.y) * 6.2; c.fillStyle = 'rgba(74,42,16,.35)'; for (let i = 0; i < 14; i++) { for (let k = 0; k < 4; k++) { vy += G / 120; x += vx / 120; y += vy / 120; } c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } }
    if (!g.rock && g.shots > 0) { c.fillStyle = '#8f8a84'; c.beginPath(); c.arc(pull.x, pull.y, 8, 0, 7); c.fill(); }
    if (g.rock) { c.fillStyle = '#8f8a84'; c.beginPath(); c.arc(g.rock.x, g.rock.y, 8, 0, 7); c.fill(); }
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

/** Pumpkin Cart Race: hold ← → (A D) to steer on a winding road, dodge rocks, collect coins. 45 seconds, 3 hearts. */
export function raceGame(rnd = Math.random) {
  const g = { title: '🏎 Pumpkin Cart Race', help: 'Giữ phím ← → (hoặc A D) để lái. Né đá và vũng bùn, nhặt đồng xu. Đường càng lúc càng nhanh. 45 giây, 3 tim.',
    x: 280, time: 45, hearts: 3, coins: 0, dist: 0, speed: 260, things: [], next: 0.4, hurt: 0, endT: 0, curve: 0 };
  const roadAt = (y) => 280 + Math.sin((g.dist - y) / 260) * 90;          // centre of the road at screen height y
  g.info = () => `❤ ${g.hearts} · ● ${g.coins} · ⏱ ${Math.max(0, Math.ceil(g.time))} s`;
  g.update = (dt, held) => {
    if (g.time <= 0 || g.hearts <= 0) { g.endT += dt; return; }
    g.time -= dt; g.speed = 260 + (45 - g.time) * 7; g.dist += g.speed * dt; g.hurt = Math.max(0, g.hurt - dt);
    const steer = ((held.has('ArrowRight') || held.has('KeyD')) ? 1 : 0) - ((held.has('ArrowLeft') || held.has('KeyA')) ? 1 : 0);
    g.x = Math.max(40, Math.min(520, g.x + steer * 330 * dt)); g.steer = steer;
    g.next -= dt;
    if (g.next <= 0) { g.next = Math.max(0.28, 0.75 - (45 - g.time) * 0.008) * (0.7 + rnd() * 0.6); const kind = rnd() < 0.42 ? 'coin' : rnd() < 0.7 ? 'rock' : 'mud'; g.things.push({ kind, off: (rnd() - 0.5) * 150, y: -30 }); }
    for (const t of g.things) {
      t.y += g.speed * dt; const tx = roadAt(t.y) + t.off;
      if (!t.hit && Math.abs(t.y - 470) < 26 && Math.abs(tx - g.x) < (t.kind === 'coin' ? 30 : 34)) {
        t.hit = true;
        if (t.kind === 'coin') g.coins += 1; else if (g.hurt <= 0) { g.hearts -= t.kind === 'rock' ? 1 : 0; g.hurt = t.kind === 'rock' ? 1.0 : 0.6; if (t.kind === 'mud') g.speed *= 0.6; }
      }
    }
    // leaving the road slows the cart a lot
    if (Math.abs(g.x - roadAt(470)) > 110) g.dist -= g.speed * dt * 0.5;
    g.things = g.things.filter((t) => t.y < 600 && !(t.hit && t.kind === 'coin'));
  };
  const score = () => g.coins * 10 + Math.floor(g.dist / 100) + g.hearts * 20;
  g.done = () => (g.endT > 0.8 ? { id: 'race2', score: score(), gold: Math.min(30, g.coins * 2 + g.hearts * 2), exp: Math.min(40, Math.floor(score() / 6)), text: g.hearts > 0 ? `Race finished: ${g.coins} coins, ${score()} points!` : `Crash! ${g.coins} coins, ${score()} points.` } : null);
  g.draw = (c, w, h, t) => {
    c.fillStyle = '#6cc044'; c.fillRect(0, 0, w, h);
    for (let y = -20; y < h + 20; y += 20) { const cx = roadAt(y); c.fillStyle = '#d9c08a'; c.fillRect(cx - 120, y, 240, 21); c.fillStyle = Math.floor((g.dist - y) / 40) % 2 ? '#fff4dc' : '#e2483e'; c.fillRect(cx - 128, y, 8, 21); c.fillRect(cx + 120, y, 8, 21);
      if (Math.floor((g.dist - y) / 60) % 2) { c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(cx - 3, y, 6, 21); } }
    for (let i = 0; i < 9; i++) { const y = ((i * 97 + g.dist * 1.0) % (h + 80)) - 40, side = i % 2 ? 1 : -1, cx = roadAt(y) + side * (170 + (i % 3) * 25); c.fillStyle = '#3f9a3a'; c.beginPath(); c.arc(cx, y, 22, 0, 7); c.fill(); c.fillStyle = '#5fbe3f'; c.beginPath(); c.arc(cx - 6, y - 6, 12, 0, 7); c.fill(); }
    for (const tg of g.things) { const x = roadAt(tg.y) + tg.off;
      if (tg.kind === 'coin') { c.fillStyle = '#ffd23c'; c.beginPath(); c.ellipse(x, tg.y, 12 * Math.abs(Math.cos(t * 5 + tg.off)) + 3, 13, 0, 0, 7); c.fill(); c.strokeStyle = '#b07a1c'; c.lineWidth = 2; c.stroke(); }
      else if (tg.kind === 'rock') { c.fillStyle = '#8f8a84'; c.beginPath(); c.ellipse(x, tg.y, 24, 18, 0, 0, 7); c.fill(); c.fillStyle = '#b5b0aa'; c.beginPath(); c.ellipse(x - 6, tg.y - 5, 10, 6, 0, 0, 7); c.fill(); }
      else { c.fillStyle = 'rgba(110,70,30,.75)'; c.beginPath(); c.ellipse(x, tg.y, 34, 14, 0, 0, 7); c.fill(); } }
    if (!(g.hurt > 0 && Math.floor(t * 12) % 2)) { c.save(); c.translate(g.x, 470); c.rotate((g.steer || 0) * 0.15);
      c.fillStyle = '#7a4a26'; c.fillRect(-26, -10, 52, 34); c.fillStyle = '#3a2410'; for (const [wx, wy] of [[-28, -4], [28, -4], [-28, 18], [28, 18]]) { c.fillRect(wx - 5, wy - 8, 10, 16); }
      c.fillStyle = '#f08a2c'; c.beginPath(); c.ellipse(0, -2, 22, 18, 0, 0, 7); c.fill(); c.fillStyle = '#4f8a3a'; c.fillRect(-3, -24, 6, 8);
      c.fillStyle = '#c9322c'; c.beginPath(); c.arc(0, 18, 9, 0, 7); c.fill(); c.restore(); }
    if (g.time <= 0 || g.hearts <= 0) { c.fillStyle = 'rgba(255,244,220,.9)'; c.fillRect(130, 230, 300, 80); c.fillStyle = '#4a2a10'; c.font = '800 32px sans-serif'; c.textAlign = 'center'; c.fillText(g.hearts > 0 ? 'Finish!' : 'Crash!', 280, 282); }
  };
  return g;
}
