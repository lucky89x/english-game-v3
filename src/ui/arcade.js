// Arcade overlay: a canvas board over the 3D world for the skill games that are not played with Ngọc's body.
import { gameMusic, endMusic, stopEngine, startEngine, engineSpeed, raceSfx } from '../audio.js';
// Each game is { title, help, start(api), draw(ctx, w, h, t), click(x, y), key(code), done() -> result | null }.
import { rule, TIER_NAME } from '../core/tiers.js';
import { N, KINDS, idx, newBoard, move, hasMove, candyReward, matches, groups, shapeBonus, collapseWithFall, adjacent } from '../core/match3.js';
import * as BL from '../core/blocks.js';
import * as SP from '../core/spell.js';
import { speak } from './speech.js';

export class Arcade {
  constructor(onFinish) {
    this.onFinish = onFinish; this.game = null;
    const el = document.createElement('div'); el.id = 'arcade'; el.className = 'hidden';
    el.innerHTML = '<div class="card box"><div class="head"><b id="arctitle"></b><span id="arcinfo"></span><button id="arcquit">Thoát ✕</button></div><canvas id="arccv" width="560" height="560"></canvas><div class="help" id="archelp"></div></div>';
    document.body.appendChild(el); this.el = el; this.cv = el.querySelector('#arccv'); this.ctx = this.cv.getContext('2d');
    // (21/11) "Candy Match looks blurry": the board is drawn at the screen's pixel density (560 logical units, up to 3× pixels)
    this.W = 560; this.H = 560; const sharp = () => { const k = Math.min(3, Math.max(1, (globalThis.devicePixelRatio || 1) * 1.15)), n = Math.round(this.W * k), m = Math.round(this.H * k); if (this.cv.width !== n || this.cv.height !== m) { this.cv.width = n; this.cv.height = m; } this.k = n / this.W; }; sharp(); this.sharp = sharp;
    const at = (e) => { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) * this.W / r.width, (e.clientY - r.top) * this.H / r.height]; };
    this.cv.addEventListener('click', (e) => { if (this.game && this.game.click) this.game.click(...at(e)); });
    this.cv.addEventListener('pointerdown', (e) => { if (this.game && this.game.down) { this.cv.setPointerCapture(e.pointerId); this.game.down(...at(e)); } });
    this.cv.addEventListener('pointermove', (e) => { if (this.game && this.game.drag) this.game.drag(...at(e)); });
    this.cv.addEventListener('pointerup', (e) => { if (this.game && this.game.up) this.game.up(...at(e)); });
    this.cv.addEventListener('pointercancel', (e) => { this.game?.up?.(...at(e)); });
    el.querySelector('#arcquit').addEventListener('click', () => this.close(null));
  }
  get open() { return !!this.game; }
  start(game) { const tune = game.music || [['🍬', 'candy'], ['🧱', 'blocks'], ['🎯', 'sling'], ['🏎', 'race'], ['🍳', 'jazz'], ['💇', 'lofi'], ['👗', 'synthwave'], ['🎣', 'fish'], ['🔒', 'chiptune']].find(([k]) => game.title.startsWith(k))?.[1]; if (tune) gameMusic(tune);      // (21/11) each mini game has its own tune
    this.H = this.W / (game.aspect || 1); this.el.style.setProperty('--ar', String(game.aspect || 1)); this.game = game; this.t = 0; this.cv.style.touchAction = game.directTouch ? 'none' : ''; this.el.classList.toggle('big', !!game.big); this.el.classList.remove('hidden'); this.el.querySelector('#arctitle').textContent = game.title; this.el.querySelector('#archelp').textContent = game.help; if (game.directTouch) this.update(0); }
  close(result) { const g = this.game; this.game = null; endMusic(); stopEngine(); if (g && g.dispose) g.dispose(); this.el.classList.add('hidden'); if (g) this.onFinish(g, result); }
  key(code) { if (!this.game) return false; if (code === 'Escape') this.close(null); else if (this.game.key) this.game.key(code); return true; }
  update(dt, held = new Set()) {
    const g = this.game; if (!g) return;
    this.t += dt;
    try { g.update(dt, held); this.sharp(); this.ctx.setTransform(this.k, 0, 0, this.k, 0, 0); this.ctx.imageSmoothingQuality = 'high'; g.draw(this.ctx, this.W, this.H, this.t); }
    catch (e) { console.error('arcade game failed', e); this.close(null); return; }      // a broken game closes instead of freezing the screen (18/11)
    this.el.querySelector('#arcinfo').textContent = g.info();
    const res = g.done(); if (res) this.close(res);
  }
}

const GEMS = [['#e8443a', '●'], ['#f6c62e', '◆'], ['#4fb85a', '▲'], ['#3d8fd6', '■'], ['#b684e8', '★'], ['#ff8fc0', '♥']];
/** Candy Match: swap two neighbouring sweets to line up three. 25 moves. */
/** Kart Race sprites rendered in Blender (tools/sprites/kart.py). */
const RACE_IMG = typeof Image === 'undefined' ? {} : Object.fromEntries(['kart_red', 'kart_blue', 'kart_green', 'kart_purple', 'rock', 'cone', 'coin', 'mud', 'tree'].map((n) => [n.replace('kart_', 'k_'), Object.assign(new Image(), { src: `./assets/ui/race_${n}.png` })]));
const KART_OF = { '#e8443a': 'k_red', '#2f6fd0': 'k_blue', '#2e9a5a': 'k_green', '#8a4ad0': 'k_purple' };
/** Candy pieces rendered in Blender (tools/sprites/candy.py); the round gems stay as a fallback until they load. */
const CANDY_IMG = typeof Image === 'undefined' ? [] : Array.from({ length: 6 }, (_, k) => Object.assign(new Image(), { src: `./assets/ui/candy_${k}.png` }));
const CANDY_COL = ['#f0283a', '#ff8c14', '#ffd21a', '#3fcf4a', '#2f7dff', '#b048f0'];
const SHAPE_WORD = { 4: 'Sweet!', 5: 'Tasty!', 6: 'Divine!', L: 'Delicious!' };
/** Candy Match (18/11: "the balls look ugly, add effects like Candy Crush"): a swap slides, matched candies swell and
 *  burst into sparks, the ones above fall into place, new ones drop in, and chains repeat with a growing combo. Four,
 *  five, six in a line and L / T shapes pay a bonus with a big word. */
export function candyGame(rnd = Math.random, tier = 1) {
  const R = rule('candy', tier);
  const g = { title: '🍬 Candy Match', help: 'Bấm 2 viên kẹo cạnh nhau để đổi chỗ. Xếp 3 viên giống nhau thành hàng dọc hoặc ngang; 4, 5, 6 viên hay hình chữ L được thưởng thêm. ' + R.moves + ' lượt.',
    board: newBoard(rnd), sel: -1, moves: R.moves, score: 0, flash: 0, combo: 0, pop: [], parts: [], words: [], fall: new Array(N * N).fill(0), burst: null, swap: null, phase: 'idle', pt: 0 };
  const cell = 560 / N, centre = (i) => [(i % N + 0.5) * cell, (Math.floor(i / N) + 0.5) * cell];
  g.info = () => `Điểm ${g.score} · Còn ${g.moves} lượt${g.combo > 1 ? ` · Combo x${g.combo}` : ''}`;
  const startBurst = () => {          // the matched groups light up; points and the shape word come now
    const gs = groups(g.board); if (!gs.length) { g.phase = 'idle'; g.combo = 0; if (!hasMove(g.board)) g.board = newBoard(rnd); return; }
    g.combo += 1; const cells = new Set(); let pts = 0;
    for (const gr of gs) { for (const i of gr.cells) cells.add(i); pts += gr.cells.length * 10 * g.combo + shapeBonus(gr.shape); if (SHAPE_WORD[gr.shape]) { const [x, y] = centre(gr.cells[Math.floor(gr.cells.length / 2)]); g.words.push({ x, y, t: 1.2, text: SHAPE_WORD[gr.shape], big: gr.shape === 6 || gr.shape === 'L' }); } }
    g.score += pts; g.flash = 0.6; const [px, py] = centre([...cells][0]); g.pop.push({ x: px, y: py, t: 0.9, text: '+' + pts + (g.combo > 1 ? '  x' + g.combo : '') });
    g.burst = { cells, t: 0 }; g.phase = 'burst'; g.pt = 0;
  };
  const explode = () => {             // sparks and stars fly out of each burst candy, then everything above falls
    for (const i of g.burst.cells) { const [x, y] = centre(i), col = CANDY_COL[g.board[i] % 6];
      for (let n = 0; n < 5; n++) { const a = n / 5 * Math.PI * 2 + rnd() * 0.5, sp = 90 + rnd() * 140; g.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, t: 0.55 + rnd() * 0.35, col, star: n % 3 === 0, r: 4 + rnd() * 5 }); } }
    g.fall = collapseWithFall(g.board, g.burst.cells, rnd); g.burst = null; g.phase = 'fall'; g.pt = 0;
  };
  g.update = (dt) => {
    g.flash = Math.max(0, g.flash - dt); g.pop = g.pop.filter((p) => (p.t -= dt) > 0); g.words = g.words.filter((p) => (p.t -= dt) > 0);
    g.parts = g.parts.filter((p) => { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; return p.t > 0; });
    g.pt += dt;
    if (g.phase === 'swap' && g.pt >= 0.16) { if (g.swap.back) { g.swap = null; g.phase = 'idle'; } else { g.swap = null; startBurst(); } }
    else if (g.phase === 'burst') { g.burst.t = g.pt; if (g.pt >= 0.3) explode(); }
    else if (g.phase === 'fall' && g.pt >= 0.32) { g.fall.fill(0); startBurst(); }
  };
  g.click = (x, y) => {
    const i = idx(Math.floor(y / cell), Math.floor(x / cell)); if (g.moves <= 0 || g.phase !== 'idle' || i < 0 || i >= N * N) return;
    if (g.sel < 0 || g.sel === i || !adjacent(g.sel, i)) { g.sel = g.sel === i ? -1 : i; return; }
    const a = g.sel, b = i; g.sel = -1;
    [g.board[a], g.board[b]] = [g.board[b], g.board[a]];
    const ok = matches(g.board).size > 0;
    if (!ok) [g.board[a], g.board[b]] = [g.board[b], g.board[a]];
    else { g.moves -= 1; g.combo = 0; }
    g.swap = { a, b, back: !ok }; g.phase = 'swap'; g.pt = 0;
  };
  g.done = () => (g.moves <= 0 && g.phase === 'idle' && g.flash <= 0 ? { id: 'candy', score: g.score, ...candyReward(g.score), text: `Candy Match: ${g.score} points!` } : null);
  g.draw = (c, w, h, t) => {
    // (23/11) "pale and off the game's tone": a warm caramel tray in the colours of the game's paper and wood, so the sweets stand out
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#8a4f24'); bg.addColorStop(1, '#5e3416'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    const vg = c.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75); vg.addColorStop(0, 'rgba(255,200,120,.16)'); vg.addColorStop(1, 'rgba(30,12,0,.32)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) { c.fillStyle = (r + k) % 2 ? 'rgba(255,226,170,.20)' : 'rgba(255,226,170,.11)'; c.beginPath(); c.roundRect(k * cell + 3, r * cell + 3, cell - 6, cell - 6, 12); c.fill(); }
    const ease = (x) => 1 - (1 - Math.min(1, x)) ** 3;
    for (let i = 0; i < N * N; i++) {
      const v = g.board[i]; if (v < 0) continue;
      let [x, y] = centre(i), s = 1;
      if (g.phase === 'fall' && g.fall[i]) y -= g.fall[i] * cell * (1 - ease(g.pt / 0.32));
      if (g.swap) { const o = i === g.swap.a ? g.swap.b : i === g.swap.b ? g.swap.a : -1; if (o >= 0) { const [ox, oy] = centre(o), k = g.swap.back ? Math.sin(Math.min(1, g.pt / 0.16) * Math.PI) * 0.5 : 1 - Math.min(1, g.pt / 0.16); x += (ox - x) * k; y += (oy - y) * k; } }
      if (g.burst && g.burst.cells.has(i)) s = 1 + g.burst.t * 0.45;      // (21/11) "the match effect flashes too much": a gentler swell
      if (i === g.sel) { s *= 1.08 + Math.sin(t * 9) * 0.05; c.fillStyle = 'rgba(255,236,170,.55)'; c.beginPath(); c.arc(x, y, cell * 0.47, 0, 7); c.fill(); c.strokeStyle = '#ffe28a'; c.lineWidth = 3; c.stroke(); }
      const img = CANDY_IMG[v % 6]; let sz = cell * 0.98 * s;
      if (g.burst && g.burst.cells.has(i)) { c.globalAlpha = Math.max(0, 1 - g.burst.t / 0.3); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(x, y, cell * 0.5 * s, 0, 7); c.fill(); }
      const idle = !(g.burst && g.burst.cells.has(i)) && g.phase !== 'fall';
      if (idle) {      // (20/11) shadow, a soft coloured glow and a breathing size so the board feels alive
        const br = 1 + 0.015 * Math.sin(t * 2.4 + i * 0.77), col = CANDY_COL[v % 6];
        c.save(); c.globalAlpha = 0.28; c.fillStyle = '#2a0a30'; c.beginPath(); c.ellipse(x + cell * 0.04, y + cell * 0.36, cell * 0.34 * s, cell * 0.1 * s, 0, 0, 7); c.fill(); c.restore();
        const gl = c.createRadialGradient(x, y, cell * 0.1, x, y, cell * 0.55); gl.addColorStop(0, col + '55'); gl.addColorStop(1, col + '00'); c.fillStyle = gl; c.beginPath(); c.arc(x, y, cell * 0.55, 0, 7); c.fill();
        s *= br; sz = cell * 0.98 * s; y -= Math.sin(t * 2.4 + i * 0.77) * cell * 0.012;
      }
      if (img && img.complete && img.naturalWidth) c.drawImage(img, x - sz / 2, y - sz / 2, sz, sz);
      else { const [col, sym] = GEMS[v % KINDS]; c.beginPath(); c.arc(x, y, cell * 0.38 * s, 0, 7); c.fillStyle = col; c.fill(); c.fillStyle = '#fff'; c.font = `800 ${Math.round(cell * 0.34)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sym, x, y + 2); }
      if (idle) {      // twinkle: a four-point star flashes on a few candies in turn
        const ph = (t * 0.9 + i * 0.41) % 11;
        if (ph < 0.6) { const k = Math.sin(ph / 0.6 * Math.PI) * 0.8, r = cell * 0.15 * k, sx = x - cell * 0.17, sy = y - cell * 0.2; c.save(); c.globalAlpha = k; c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(sx, sy - r); c.quadraticCurveTo(sx, sy, sx + r, sy); c.quadraticCurveTo(sx, sy, sx, sy + r); c.quadraticCurveTo(sx, sy, sx - r, sy); c.quadraticCurveTo(sx, sy, sx, sy - r); c.fill(); c.restore(); }
      }
      c.globalAlpha = 1;
    }
    for (const p of g.parts) { c.globalAlpha = Math.min(1, p.t * 2.5); c.fillStyle = p.star ? '#fffbe0' : p.col;
      if (p.star) { c.save(); c.translate(p.x, p.y); c.rotate(p.t * 8); c.beginPath(); for (let n = 0; n < 10; n++) { const rr = n % 2 ? p.r * 0.45 : p.r * 1.2, a = n * Math.PI / 5; c[n ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } c.fill(); c.restore(); }
      else { c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); } }
    c.globalAlpha = 1; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    for (const p of g.pop) { c.globalAlpha = Math.min(1, p.t * 2); c.lineWidth = 5; c.strokeStyle = '#4a2208'; c.font = '900 28px sans-serif'; c.strokeText(p.text, p.x, p.y - (0.9 - p.t) * 60); c.fillStyle = '#ffe28a'; c.fillText(p.text, p.x, p.y - (0.9 - p.t) * 60); }
    for (const p of g.words) { const k = 1.2 - p.t, sc = (p.big ? 1.25 : 1) * (k < 0.15 ? k / 0.15 * 1.2 : 1); c.globalAlpha = Math.min(1, p.t * 2.5); c.save(); c.translate(w / 2, h / 2 - 40); c.scale(sc, sc);
      c.font = '900 44px sans-serif'; c.lineWidth = 7; c.strokeStyle = '#7a1a5a'; c.strokeText(p.text, 0, 0); const gr = c.createLinearGradient(0, -40, 0, 10); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(1, '#ff7ab8'); c.fillStyle = gr; c.fillText(p.text, 0, 0); c.restore(); }
    c.globalAlpha = 1;
  };
  return g;
}

const BCOL = ['#f0f0f0', '#4fc8e8', '#f6c62e', '#b684e8', '#5fb84a', '#e8443a', '#3d6fc6', '#f08a2c'];
/** Falling Blocks: arrows or WASD move, up/W turns, down/S drops faster, Space drops at once. Ends when the stack reaches the top. */
/** cards: the unit's words; each cleared line shows and reads one of them (18/11: English inside the game). */
export function blocksGame(rnd = Math.random, cards = [], tier = 1) {
  const R = rule('blocks', tier);
  const bag = []; const next = () => { if (!bag.length) { const ks = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ks[i], ks[j]] = [ks[j], ks[i]]; } bag.push(...ks); } return bag.shift(); };
  const g = { title: '🧱 Falling Blocks', help: 'Bấm chuột để xoay · ← → (A D) di chuyển · giữ ↓ (S) để rơi nhanh · Space thả ngay. Mỗi hàng xóa được tặng một từ tiếng Anh, nhớ nó: cuối trò bác Max sẽ hỏi!',
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
  g.update = (dt, held) => {
    g.flash = Math.max(0, g.flash - dt); g.wordT = Math.max(0, (g.wordT || 0) - dt); if (g.over) { g.endT += dt; return; }
    const soft = !!held && (held.has('ArrowDown') || held.has('KeyS'));      // (24/11) hold S or ↓ and the piece keeps falling fast
    g.timer += dt; if (g.timer >= (soft ? Math.min(speed(), 0.045) : speed())) { g.timer = 0; const q = BL.shift(g.board, g.piece, 0, 1); if (q === g.piece) land(); else { g.piece = q; if (soft) g.score += 1; } }
  };
  g.done = () => (g.over && g.endT > 0.7 ? { id: 'blocks', score: g.score, ...BL.blocksReward(g.score), words: g.words, text: `Falling Blocks: ${g.score} points, ${g.lines} lines!` } : null);
  g.draw = (c, w, h) => {
    const cs = 26, ox = 70, oy = 20;
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, w, h);
    c.fillStyle = g.flash ? '#fff8c8' : '#3a2a1e'; c.fillRect(ox - 4, oy - 4, BL.W * cs + 8, BL.H * cs + 8);
    const sq = (x, y, k, a = 1) => { c.globalAlpha = a; c.fillStyle = BCOL[k]; c.fillRect(ox + x * cs + 1, oy + y * cs + 1, cs - 2, cs - 2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(ox + x * cs + 3, oy + y * cs + 3, cs - 6, 5); c.globalAlpha = 1; };
    for (let y = 0; y < BL.H; y++) for (let x = 0; x < BL.W; x++) { const k = g.board[y * BL.W + x]; if (k) sq(x, y, k); else { c.fillStyle = (x + y) % 2 ? '#47362a' : '#4d3b2e'; c.fillRect(ox + x * cs, oy + y * cs, cs, cs); } }
    if (!g.over) { for (const [x, y] of BL.cells(g.piece)) if (y >= 0) sq(x, y, g.piece.k + 1); }      // (24/11) no landing ghost: the child judges where it will fall
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

/** Archery (21/11: "the top targets are hard to hit with the slingshot: shoot arrows in a straight line instead; a hit target
 *  should fall on a true path"): drag back from the bow and let go, the arrow flies straight along the aim line (shown
 *  in full while aiming). The hit test sweeps the arrow's whole step, so a fast arrow never passes through a target.
 *  The middle of a board scores more (bullseye ×3). A hit target keeps its speed, tips over and falls under gravity with
 *  the arrow stuck in it; drones lose their rotors. Same id 'sling', same rewards. */
export function slingGame(rnd = Math.random, tier = 1) {
  const R = rule('sling', tier);
  const SX = 280, SY = 486, G = 900, SPEED = 1150;
  const g = { title: '🎯 Archery Range', help: 'Nhấn giữ chuột ở cây cung, kéo ngược về sau để ngắm (vạch thẳng chỉ đường bay), thả tay để bắn. Mũi tên bay thẳng. Trúng tâm bia được ×3 điểm. ' + R.shots + ' mũi tên.',
    shots: R.shots, score: 0, hits: 0, aim: null, arrow: null, pop: [], t: 0, endT: 0, targets: [], falling: [], stuck: [] };
  const add = () => { const row = Math.floor(rnd() * 3), drone = rnd() < 0.6, dir = rnd() < 0.5 ? 1 : -1, y = 90 + row * 85 + rnd() * 20;
    g.targets.push({ x: dir > 0 ? -30 : 590, y, yy: y, vx: dir * (26 + rnd() * 34 + row * 8) * R.speed, r: (drone ? 22 : 17) * R.size, drone, col: drone ? ['#e8443a', '#2f6fd0', '#2e9a5a'][Math.floor(rnd() * 3)] : '#f08a2c', ph: rnd() * 6 }); };
  for (let i = 0; i < 5; i++) { add(); g.targets[i].x = 60 + i * 100; }
  g.info = () => `Điểm ${g.score} · Còn ${g.shots + (g.arrow ? 1 : 0)} mũi tên`;
  const dirOf = (a) => { const dx = SX - a.x, dy = SY - a.y, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d, pull: Math.min(d, 110) }; };
  g.down = (x, y) => { if (!g.arrow && g.shots > 0 && Math.hypot(x - SX, y - SY) < 110) g.aim = { x, y }; };
  g.drag = (x, y) => { if (g.aim) { const dx = x - SX, dy = Math.max(-20, y - SY), d = Math.hypot(dx, dy), m = Math.min(d, 110) / (d || 1); g.aim = { x: SX + dx * m, y: SY + dy * m }; } };
  g.up = () => { if (!g.aim) return; const a = g.aim, d = dirOf(a); g.aim = null; if (d.pull < 14 || d.y > -0.05) return; g.arrow = { x: SX, y: SY, vx: d.x * SPEED, vy: d.y * SPEED }; g.shots -= 1; };
  /** Closest approach of the segment p→q to the circle centre c: the fraction along the step and the distance. */
  const sweep = (px, py, qx, qy, cx, cy) => { const vx = qx - px, vy = qy - py, L2 = vx * vx + vy * vy || 1, k = Math.max(0, Math.min(1, ((cx - px) * vx + (cy - py) * vy) / L2)); return { k, d: Math.hypot(px + vx * k - cx, py + vy * k - cy) }; };
  g.update = (dt) => {
    g.t += dt; g.pop = g.pop.filter((p) => (p.t -= dt) > 0);
    for (const tg of g.targets) { tg.x += tg.vx * dt; tg.yy = tg.y + Math.sin(g.t * 3 + tg.ph) * 8; }
    g.targets = g.targets.filter((tg) => tg.x > -60 && tg.x < 620 && !tg.dead); while (g.targets.length < 5) add();
    for (const f of g.falling) { f.vy += G * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.spin * dt; for (const pc of f.bits || []) { pc.vy += G * dt; pc.x += pc.vx * dt; pc.y += pc.vy * dt; pc.r += pc.s * dt; } }
    g.falling = g.falling.filter((f) => f.y < 640);
    const a = g.arrow; if (a) {
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt; let best = null;
      for (const tg of g.targets) if (!tg.dead) { const h = sweep(a.x, a.y, nx, ny, tg.x, tg.yy); if (h.d < tg.r + 3 && (!best || h.k < best.h.k)) best = { tg, h }; }
      if (best) {
        const { tg, h } = best, ix = a.x + (nx - a.x) * h.k, iy = a.y + (ny - a.y) * h.k, off = Math.hypot(ix - tg.x, iy - tg.yy) / tg.r, mul = off < 0.25 ? 3 : off < 0.6 ? 2 : 1;
        tg.dead = true; const pts = Math.round((10 + Math.abs(tg.vx) / 3) * mul); g.score += pts; g.hits += 1;
        g.pop.push({ x: tg.x, y: tg.yy, t: 0.9, text: (mul === 3 ? 'BULLSEYE! ' : mul === 2 ? 'Great! ' : '') + '+' + pts });
        const ang = Math.atan2(a.vy, a.vx);
        g.falling.push({ ...tg, y: tg.yy, vx: tg.vx * 0.6 + a.vx * 0.06, vy: -120 + a.vy * 0.05, rot: 0, spin: (tg.vx > 0 ? 1 : -1) * (2 + Math.random() * 3), arrow: { dx: ix - tg.x, dy: iy - tg.yy, ang },
          bits: tg.drone ? [-1, 1].map((sx) => ({ x: tg.x + sx * tg.r * 1.3, y: tg.yy - tg.r * 1.3, vx: sx * (80 + Math.random() * 60), vy: -200 - Math.random() * 80, r: 0, s: sx * 9 })) : null });
        g.arrow = null;
      } else { a.x = nx; a.y = ny; if (a.y < -40 || a.x < -40 || a.x > 600) g.arrow = null; }
    }
    if (g.shots <= 0 && !g.arrow) g.endT += dt;
  };
  g.done = () => (g.endT > 0.8 && !g.falling.length ? { id: 'sling', score: g.score, gold: Math.min(30, Math.floor(g.score / 12)), exp: Math.min(40, Math.floor(g.score / 8)), text: `Archery: ${g.hits} hits, ${g.score} points!` } : null);
  const arrowShape = (c, x, y, ang, len = 46) => { c.save(); c.translate(x, y); c.rotate(ang);
    c.strokeStyle = '#7a4a26'; c.lineWidth = 3; c.beginPath(); c.moveTo(-len, 0); c.lineTo(0, 0); c.stroke();
    c.fillStyle = '#5a5e66'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-6, -5); c.lineTo(-4, 0); c.lineTo(-6, 5); c.closePath(); c.fill();
    c.fillStyle = '#e8443a'; for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(-len, 0); c.lineTo(-len - 8, sy * 6); c.lineTo(-len + 8, sy * 6); c.lineTo(-len + 12, 0); c.closePath(); c.fill(); } c.restore(); };
  const board = (c, x, y, r, col, rot = 0) => { c.save(); c.translate(x, y); c.rotate(rot);
    for (const [k, cc] of [[1, '#ffffff'], [0.8, col], [0.6, '#ffffff'], [0.4, col], [0.2, '#ffd23c']]) { c.fillStyle = cc; c.beginPath(); c.arc(0, 0, r * k, 0, 7); c.fill(); }
    c.strokeStyle = '#2a2e35'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.45, r * 0.3, r * 0.14, -0.5, 0, 7); c.fill(); c.restore(); };
  g.draw = (c, w, h) => {
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#7cc8ff'); sky.addColorStop(0.7, '#d8f0ff'); sky.addColorStop(1, '#f4fbff'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,236,150,.9)'; c.beginPath(); c.arc(480, 70, 34, 0, 7); c.fill(); c.fillStyle = 'rgba(255,236,150,.25)'; c.beginPath(); c.arc(480, 70, 52, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)';
    for (const [cx, cy, k] of [[90, 60, 1], [300, 40, 0.8], [420, 150, 0.7], [160, 190, 0.6]]) { const x = ((cx + g.t * 8 * k) % (w + 160)) - 80; for (const [dx, dy, r] of [[0, 0, 22], [22, -8, 26], [46, 0, 20], [24, 8, 20]]) { c.beginPath(); c.arc(x + dx * k * 1.4, cy + dy * k, r * k * 1.3, 0, 7); c.fill(); } }
    c.fillStyle = '#a8d98a'; c.beginPath(); c.moveTo(0, 470); for (let x = 0; x <= w; x += 20) c.lineTo(x, 455 - Math.sin(x / 70) * 18); c.lineTo(w, 520); c.lineTo(0, 520); c.fill();
    c.fillStyle = '#7fcf5a'; c.fillRect(0, 500, w, 60); c.fillStyle = '#5fae3c'; for (let x = 0; x < w; x += 40) { c.beginPath(); c.arc(x + 20, 500, 22, Math.PI, 0); c.fill(); }
    for (const tg of g.targets) {
      const x = tg.x, y = tg.yy, r = tg.r; if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (tg.drone) {
        c.strokeStyle = '#3a3f48'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - r * 1.3, y - r * 1.15); c.lineTo(x + r * 1.3, y - r * 1.15); c.stroke();
        for (const sx of [-1, 1]) { const px = x + sx * r * 1.3, spin = Math.abs(Math.sin(g.t * 40 + sx)); c.fillStyle = '#2a2e35'; c.fillRect(px - 3, y - r * 1.3, 6, 8); c.fillStyle = 'rgba(200,210,225,.75)'; c.beginPath(); c.ellipse(px, y - r * 1.32, r * 0.55 * spin + 2, 2.5, 0, 0, 7); c.fill(); }
        c.strokeStyle = '#3a3f48'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - r * 1.15); c.lineTo(x, y - r); c.stroke(); board(c, x, y, r, tg.col);
      } else { const tilt = Math.sin(g.t * 3 + tg.ph) * 0.25; c.save(); c.translate(x, y); c.rotate(tilt); c.fillStyle = '#b8561a'; c.beginPath(); c.ellipse(0, 3, r, r * 0.34, 0, 0, 7); c.fill(); c.fillStyle = tg.col; c.beginPath(); c.ellipse(0, 0, r, r * 0.34, 0, 0, 7); c.fill(); c.restore(); }
    }
    for (const f of g.falling) {      // a hit target tumbles down with the arrow in it
      if (f.drone) board(c, f.x, f.y, f.r, f.col, f.rot); else { c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.fillStyle = f.col; c.beginPath(); c.ellipse(0, 0, f.r, f.r * 0.34, 0, 0, 7); c.fill(); c.restore(); }
      if (f.arrow) { const ca = Math.cos(f.rot), sa = Math.sin(f.rot); arrowShape(c, f.x + f.arrow.dx * ca - f.arrow.dy * sa, f.y + f.arrow.dx * sa + f.arrow.dy * ca, f.arrow.ang + f.rot, 30); }
      for (const pc of f.bits || []) { c.save(); c.translate(pc.x, pc.y); c.rotate(pc.r); c.fillStyle = '#2a2e35'; c.fillRect(-10, -2, 20, 4); c.restore(); }
    }
    // the bow: a curved limb with a string pulled back to the hand
    const pull = g.aim || { x: SX, y: SY + 0.01 }, d = dirOf(pull), ang = Math.atan2(d.y, d.x), nx = -d.y, ny = d.x, bow = 46;
    const tip1 = { x: SX + nx * bow - d.x * 8, y: SY + ny * bow - d.y * 8 }, tip2 = { x: SX - nx * bow - d.x * 8, y: SY - ny * bow - d.y * 8 };
    c.strokeStyle = '#6a3a18'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(tip1.x, tip1.y); c.quadraticCurveTo(SX + d.x * 34, SY + d.y * 34, tip2.x, tip2.y); c.stroke();
    c.strokeStyle = '#f4f0e6'; c.lineWidth = 2; c.beginPath(); c.moveTo(tip1.x, tip1.y); c.lineTo(pull.x, pull.y); c.lineTo(tip2.x, tip2.y); c.stroke();
    if (g.aim) {      // the full straight aim line, fading out, with a ring where it meets the first target
      let hit = null; for (const tg of g.targets) { const s2 = sweep(SX, SY, SX + d.x * 900, SY + d.y * 900, tg.x, tg.yy); if (s2.d < tg.r && (!hit || s2.k < hit.k)) hit = { k: s2.k, tg }; }
      const len = hit ? hit.k * 900 : 900; c.setLineDash([10, 9]); c.strokeStyle = hit ? 'rgba(232,68,58,.9)' : 'rgba(40,40,60,.45)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(SX, SY); c.lineTo(SX + d.x * len, SY + d.y * len); c.stroke(); c.setLineDash([]);
      if (hit) { c.strokeStyle = '#e8443a'; c.lineWidth = 3; c.beginPath(); c.arc(hit.tg.x, hit.tg.yy, hit.tg.r + 5, 0, 7); c.stroke(); }
    }
    if (!g.arrow && g.shots > 0) arrowShape(c, pull.x + d.x * 46, pull.y + d.y * 46, ang);
    if (g.arrow) arrowShape(c, g.arrow.x, g.arrow.y, Math.atan2(g.arrow.vy, g.arrow.vx));
    for (let i = 0; i < g.shots - (g.arrow ? 0 : 1); i++) arrowShape(c, 30 + i * 9, 548, -Math.PI / 2, 26);      // the quiver
    for (const p of g.pop) { c.globalAlpha = Math.min(1, p.t * 2); c.fillStyle = p.text.startsWith('BULL') ? '#c0361a' : '#4a2a10'; c.font = '800 24px sans-serif'; c.textAlign = 'center'; c.fillText(p.text, p.x, p.y - (0.9 - p.t) * 50); c.globalAlpha = 1; }
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
  const g = { big: true, title: '🏎 Kart Race', help: 'Giữ ← → (A D) để lái. Ăn đồng xu vàng, né đá, tránh bùn, vượt 3 xe đối thủ trong 60 giây.', help: 'Giữ ← → (A D) để lái. Đi qua đồng xu có CHỮ CÁI TIẾP THEO của từ tiếng Anh (nghĩa ở trên cùng) để ghép từ. Né đá, tránh bùn, vượt 3 xe đối thủ. 60 giây, 3 tim.',
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
      if (Math.abs(ry - 470) < 44 && Math.abs(rx - g.x) < 40) { g.speed *= 0.86; g.x += Math.sign(g.x - rx || 1) * 18; r.d += 6; raceSfx('bump'); }   // bump
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
      if (!t.hit && Math.abs(t.y - 470) < 24 && Math.abs(tx - g.x) < (t.kind === 'mud' ? 30 : 24)) {
        t.hit = true;
        if (t.kind === 'coin') { g.coins += 1; g.bonus += 6; raceSfx('coin'); }
        else if (t.kind === 'letter') {
          if (t.ch === need()) { g.got += 1; g.bonus += 5; if (g.got >= SP.letters(word().word).length) { g.done_.push(word()); g.bonus += 40; speak(word().word, true, 0.85); g.wi += 1; g.got = 0; g.flash = 0.8; raceSfx('boost'); g.speed += 80; } }
          else { g.bad += 1; g.speed *= 0.8; g.hurt = 0.3; raceSfx('skid'); }
        } else if (g.hurt <= 0) { raceSfx(t.kind === 'rock' ? 'bump' : 'skid'); if (t.kind === 'rock') { g.hearts -= 1; g.shake = 1; } g.hurt = t.kind === 'rock' ? 1.0 : 0.6; g.speed *= t.kind === 'rock' ? 0.5 : 0.65; }
      }
    }
    if (Math.abs(g.x - roadAt(470)) > 162) { g.dist -= g.speed * dt * 0.5; g.speed *= 0.99; }      // off the road: slow
    g.things = g.things.filter((t) => t.y < 600 && !(t.hit && (t.kind === 'letter' || t.kind === 'coin')));
  };
  const score = () => Math.floor(g.dist / 100) + g.hearts * 20 + g.bonus + (4 - place()) * 30;
  g.done = () => (g.endT > 0.8 ? { id: 'race2', score: score(), gold: Math.min(40, g.done_.length * 6 + g.coins * 2 + (4 - place()) * 4 + g.hearts * 2), exp: Math.min(50, Math.floor(score() / 6)), words: g.done_,
    text: g.hearts > 0 ? `Race over: place ${place()} of 4, ${g.coins} coins!` : `Crash! Place ${place()}, ${g.coins} coins.` } : null);
  // drawing: grass with flowers, a curbed road with lane marks, shaded rocks, mud with ripples, letter coins, top-down karts
  const kart = (c, x, y, col, num, tilt, ghost) => {
    const img = RACE_IMG[KART_OF[col]];
    if (img && img.complete && img.naturalWidth) {      // Blender sprite (18/11: "the kart is too big for the road")
      c.save(); c.translate(x, y); c.rotate(tilt); if (ghost) c.globalAlpha = 0.5;
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(3, 5, 17, 25, 0, 0, 7); c.fill();
      c.drawImage(img, -19, -29, 38, 57); c.restore(); return;
    }
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
  // (21/11) "the race graphics look dull": a chase view behind the kart. The game still runs in the flat top-down space
  // above (y down the screen, the kart at y 470); only the drawing projects it: depth d = 500 - y, scale s = K / (d + Z0).
  const HOR = 196, CAMH = 286, Z0 = 92, K = 122, view = { x: 280, shake: 0 }, dust = [];
  const proj = (x, y) => { const d = 500 - y, z = d + Z0; if (z < 24) return null; const s = K / z; return { x: 280 + (x - view.x) * s, y: HOR + CAMH * s, s }; };
  const rearKart = (c, p, col, num, tilt, me) => {
    const s = p.s * (me ? 1.15 : 1); c.save(); c.translate(p.x, p.y); c.scale(s, s); c.rotate(tilt * 0.6);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 4, 40, 9, 0, 0, 7); c.fill();
    c.fillStyle = '#18181e'; for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(sx * 30 - 9, -22, 18, 26, 5); c.fill(); }
    c.fillStyle = '#3a3a44'; for (const sx of [-1, 1]) c.fillRect(sx * 30 - 6, -16, 12, 3);
    const b = c.createLinearGradient(0, -38, 0, 0); b.addColorStop(0, '#ffffff'); b.addColorStop(0.25, col); b.addColorStop(1, col); c.fillStyle = b;
    c.beginPath(); c.moveTo(-24, 0); c.lineTo(-20, -26); c.quadraticCurveTo(0, -34, 20, -26); c.lineTo(24, 0); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#22222a'; c.fillRect(-26, -40, 52, 7); c.fillRect(-3, -34, 6, 8);      // rear wing on its post
    c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(-9, -15, 18, 11, 3); c.fill(); c.fillStyle = '#222'; c.font = '800 9px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(num, 0, -9.5);
    const hm = c.createRadialGradient(-4, -50, 2, 0, -46, 13); hm.addColorStop(0, '#ffffff'); hm.addColorStop(1, me ? '#ffd23c' : '#d0d4dc'); c.fillStyle = hm; c.beginPath(); c.arc(0, -46, 11, 0, 7); c.fill();
    c.fillStyle = me ? '#e8443a' : col; c.fillRect(-11, -47, 22, 3);
    c.fillStyle = '#ff5a3a'; for (const sx of [-1, 1]) c.fillRect(sx * 17 - 3, -6, 6, 3);      // tail lights
    c.restore(); c.textBaseline = 'alphabetic';
  };
  g.draw = (c, w, h, t) => {
    if (!g.engineOn && g.time > 0 && g.hearts > 0) { g.engineOn = true; startEngine(); }
    if (g.engineOn) { engineSpeed(Math.min(1.2, g.speed / 560) * (g.time > 0 && g.hearts > 0 ? 1 : 0.2)); if (g.time <= 0 || g.hearts <= 0) { g.engineOn = false; stopEngine(); } }
    if (g.shake) { view.shake = g.shake; g.shake = 0; } view.x += (g.x - view.x) * 0.12; view.shake = Math.max(0, view.shake - 0.05);
    const sk = view.shake ? (Math.random() - 0.5) * 8 * view.shake : 0; c.save(); c.translate(sk, sk * 0.5);
    // sky, sun, clouds and hills that drift on the curves
    const sky = c.createLinearGradient(0, 0, 0, HOR + 20); sky.addColorStop(0, '#5fb2f0'); sky.addColorStop(1, '#cfeeff'); c.fillStyle = sky; c.fillRect(-10, -10, w + 20, HOR + 30);
    const bend = Math.sin(g.dist / 260) * 60; c.fillStyle = 'rgba(255,246,200,.9)'; c.beginPath(); c.arc(430 - bend * 0.3, 60, 26, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) { const cx = ((i * 170 - bend * 0.5 + t * 6) % 760) - 100, cy = 40 + (i % 2) * 34; c.beginPath(); c.ellipse(cx, cy, 44, 13, 0, 0, 7); c.ellipse(cx + 24, cy - 8, 26, 12, 0, 0, 7); c.fill(); }
    for (const [col, amp, off, base] of [['#8fc8a0', 26, 0.7, HOR - 6], ['#5fa860', 18, 1.6, HOR + 2]]) { c.fillStyle = col; c.beginPath(); c.moveTo(-10, HOR + 30); for (let x = -10; x <= w + 10; x += 20) c.lineTo(x, base - amp * (0.6 + 0.4 * Math.sin((x - bend * off) / 70)) - 10 * Math.sin((x - bend) / 23)); c.lineTo(w + 10, HOR + 30); c.closePath(); c.fill(); }
    // ground and road, far to near, as trapezoids between projected rows
    let prev = null;
    for (let y = -40; y <= 600; y += 8) {
      const cx = roadAt(y), a = proj(cx, y); if (!a) continue;
      if (prev) {
        const band = Math.floor((g.dist - y) / 48) % 2 === 0, s0 = prev.s, s1 = a.s, edge = (p, s, k) => p.x + k * s;
        c.fillStyle = band ? '#5fb03c' : '#6cbc46'; c.fillRect(-10, prev.y, w + 20, a.y - prev.y + 1);
        const quad = (k0, k1, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(edge(prev, s0, k0), prev.y); c.lineTo(edge(prev, s0, k1), prev.y); c.lineTo(edge(a, s1, k1), a.y + 1); c.lineTo(edge(a, s1, k0), a.y + 1); c.closePath(); c.fill(); };
        quad(-212, 212, band ? '#c8b07a' : '#bfa56e');      // dirt shoulder   (23/11: the road is wider, 340 instead of 240)
        quad(-186, 186, band ? '#ffffff' : '#e2483e');      // curbs
        quad(-170, 170, band ? '#62666e' : '#5a5e66');      // asphalt
        if (Math.floor((g.dist - y) / 70) % 2) { quad(-62, -54, 'rgba(255,255,255,.8)'); quad(54, 62, 'rgba(255,255,255,.8)'); }
      }
      prev = a;
    }
    // everything standing on the track, far first: trees and flowers beside it, the things, the rivals, the player
    const items = [];
    for (let i = 0; i < 14; i++) { const y = ((i * 71 + g.dist) % 660) - 40, side = i % 2 ? 1 : -1; items.push({ y, draw: (p) => { const ti = RACE_IMG.tree, sz = 96 * p.s; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(p.x, p.y, sz * 0.4, sz * 0.1, 0, 0, 7); c.fill(); if (ti && ti.complete && ti.naturalWidth) c.drawImage(ti, p.x - sz / 2, p.y - sz * 0.9, sz, sz); else { c.fillStyle = '#7a4a24'; c.fillRect(p.x - 4 * p.s, p.y - 30 * p.s, 8 * p.s, 30 * p.s); c.fillStyle = '#3f9a3a'; c.beginPath(); c.arc(p.x, p.y - 44 * p.s, 26 * p.s, 0, 7); c.fill(); } }, x: roadAt(y) + side * (200 + (i % 3) * 40) }); }
    for (const tg of g.things) items.push({ y: tg.y, x: roadAt(tg.y) + tg.off, draw: (p) => {
      const spr = RACE_IMG[tg.kind];
      if (tg.kind === 'coin' || tg.kind === 'letter') { const r = 20 * p.s, wob = 0.75 + 0.25 * Math.abs(Math.cos(t * 4 + tg.off)), cy = p.y - r * 1.3;
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.25, 0, 0, 7); c.fill();
        const co = c.createRadialGradient(p.x - r * 0.3, cy - r * 0.35, 1, p.x, cy, r); co.addColorStop(0, '#fff6c0'); co.addColorStop(1, '#e0a020'); c.fillStyle = co; c.beginPath(); c.ellipse(p.x, cy, r * wob, r, 0, 0, 7); c.fill(); c.strokeStyle = '#9a6a10'; c.lineWidth = Math.max(1, 2.5 * p.s); c.stroke();
        c.fillStyle = '#4a2a10'; c.font = `900 ${Math.max(8, Math.round(24 * p.s))}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tg.kind === 'coin' ? '$' : tg.ch.toUpperCase(), p.x, cy + 1); c.textBaseline = 'alphabetic'; return; }
      if (spr && spr.complete && spr.naturalWidth) { const sz = (tg.kind === 'mud' ? 80 : 54) * p.s; c.drawImage(spr, p.x - sz / 2, p.y - sz * (tg.kind === 'mud' ? 0.35 : 0.8), sz, sz * (tg.kind === 'mud' ? 0.5 : 1)); return; }
      if (tg.kind === 'rock') { const r = 24 * p.s; c.fillStyle = '#7a7670'; c.beginPath(); c.ellipse(p.x, p.y - r * 0.5, r, r * 0.7, 0, 0, 7); c.fill(); }
      else { c.fillStyle = 'rgba(96,62,28,.85)'; c.beginPath(); c.ellipse(p.x, p.y, 38 * p.s, 10 * p.s, 0, 0, 7); c.fill(); } } });
    for (const r of g.rivals) { const ry = 470 - (r.d - g.dist); if (ry > -60 && ry < 620) items.push({ y: ry, x: roadAt(ry) + r.off, draw: (p) => rearKart(c, p, r.col, r.num, Math.cos((r.d + r.ph * 100) / 180) * 0.25, false) }); }
    items.push({ y: 470, x: g.x, draw: (p) => { if (!(g.hurt > 0 && Math.floor(t * 12) % 2)) rearKart(c, p, '#e8443a', 1, g.steer * 0.18, true); } });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) { const p = proj(it.x, it.y); if (p && p.y < h + 80) it.draw(p); }
    // dust behind the wheels, speed lines on a fast stretch
    const me = proj(g.x, 470); if (me && g.time > 0) { const off = Math.abs(g.x - roadAt(470)) > 162; if (Math.random() < (off ? 0.9 : 0.35)) for (const sx of [-1, 1]) dust.push({ x: me.x + sx * 34 * me.s, y: me.y, vx: sx * 20 + (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 40, t: 0, col: off ? '#b89a60' : '#d8d8d8' }); }
    for (const d of dust) { d.t += 1 / 60; d.x += d.vx / 60; d.y += d.vy / 60; c.globalAlpha = Math.max(0, 0.5 - d.t); c.fillStyle = d.col; c.beginPath(); c.arc(d.x, d.y, 4 + d.t * 30, 0, 7); c.fill(); } c.globalAlpha = 1;
    for (let i = dust.length - 1; i >= 0; i--) if (dust[i].t > 0.5) dust.splice(i, 1);
    if (g.speed > 420) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + t, r0 = 200 + ((t * 600 + i * 70) % 160); c.beginPath(); c.moveTo(280 + Math.cos(a) * r0, 330 + Math.sin(a) * r0 * 0.6); c.lineTo(280 + Math.cos(a) * (r0 + 40), 330 + Math.sin(a) * (r0 + 40) * 0.6); c.stroke(); } }
    c.restore();
    // the word to spell: Vietnamese meaning, then the letters found so far; the place and speed
    const wd = word();
    c.fillStyle = g.flash > 0 ? 'rgba(255,241,184,.95)' : 'rgba(255,248,230,.92)'; c.beginPath(); c.roundRect(110, 8, 340, 64, 14); c.fill(); c.strokeStyle = '#b98a52'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#7a3e00'; c.font = '700 16px sans-serif';
    if (wd) { c.fillText(`Spell: "${wd.vi}"`, 280, 32, 320); const L2 = SP.letters(wd.word); c.font = '900 22px monospace'; c.fillStyle = '#2a5a9a'; c.fillText(L2.map((ch, i) => (i < g.got ? ch.toUpperCase() : '_')).join(' '), 280, 60, 320); }
    else { c.fillText(`🪙 ${g.coins} xu · Né đá, vượt đối thủ!`, 280, 46); }
    c.fillStyle = 'rgba(20,20,30,.6)'; c.beginPath(); c.roundRect(12, 500, 120, 48, 10); c.fill(); c.fillStyle = '#fff'; c.font = '900 22px system-ui'; c.textAlign = 'left'; c.fillText(`${Math.round(g.speed / 4)} km/h`, 22, 532); c.font = '800 20px system-ui'; c.textAlign = 'right'; c.fillStyle = 'rgba(20,20,30,.6)'; c.beginPath(); c.roundRect(w - 112, 500, 100, 48, 10); c.fill(); c.fillStyle = '#ffd23c'; c.fillText(`${place()}/4`, w - 24, 532); c.textAlign = 'center';
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
