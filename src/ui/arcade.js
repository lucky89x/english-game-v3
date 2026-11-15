// Arcade overlay: a canvas board over the 3D world for the skill games that are not played with Ngọc's body.
// Each game is { title, help, start(api), draw(ctx, w, h, t), click(x, y), key(code), done() -> result | null }.
import { N, KINDS, idx, newBoard, move, hasMove, candyReward } from '../core/match3.js';

export class Arcade {
  constructor(onFinish) {
    this.onFinish = onFinish; this.game = null;
    const el = document.createElement('div'); el.id = 'arcade'; el.className = 'hidden';
    el.innerHTML = '<div class="card box"><div class="head"><b id="arctitle"></b><span id="arcinfo"></span><button id="arcquit">Thoát ✕</button></div><canvas id="arccv" width="560" height="560"></canvas><div class="help" id="archelp"></div></div>';
    document.body.appendChild(el); this.el = el; this.cv = el.querySelector('#arccv'); this.ctx = this.cv.getContext('2d');
    this.cv.addEventListener('click', (e) => { if (!this.game) return; const r = this.cv.getBoundingClientRect(); this.game.click((e.clientX - r.left) * this.cv.width / r.width, (e.clientY - r.top) * this.cv.height / r.height); });
    el.querySelector('#arcquit').addEventListener('click', () => this.close(null));
  }
  get open() { return !!this.game; }
  start(game) { this.game = game; this.t = 0; this.el.classList.remove('hidden'); this.el.querySelector('#arctitle').textContent = game.title; this.el.querySelector('#archelp').textContent = game.help; }
  close(result) { const g = this.game; this.game = null; this.el.classList.add('hidden'); if (g) this.onFinish(g, result); }
  key(code) { if (!this.game) return false; if (code === 'Escape') this.close(null); else if (this.game.key) this.game.key(code); return true; }
  update(dt) {
    const g = this.game; if (!g) return;
    this.t += dt; g.update(dt); g.draw(this.ctx, this.cv.width, this.cv.height, this.t);
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
