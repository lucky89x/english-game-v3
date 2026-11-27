// (27/11, turn 68) The mini games made for a land, played on the arcade board (ui/arcade.js): Bazaar Bargain, Snow Slide, Gem Mine.
// Rules and words are in core/landgames.js; this file draws them and takes the clicks and keys.
// A game is { title, help, info(), update(dt, held), draw(ctx, w, h, t), click(x, y), key(code), done() -> result | null }.
import { speak } from './speech.js';
import { PRIZES, bazaarRound, slideGate, slideOrder, MINE_SIDE, MINE_PICKS, mineWall, mineGems, mineQuestion, RUNE_ROUNDS, runeRound, runeOrder, BALLOON_COLS, balloonWords, balloonRow, ROBOT_COLOURS, ROBOT_PARTS, ROBOT_ROUNDS, robotOrder, robotRight } from '../core/landgames.js';

const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
const text = (c, s, x, y, font, col = '#3a2008', align = 'center') => { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); };
/** Words wrapped to a width: the lines. */
function wrap(c, s, font, max) { c.font = font; const out = []; let line = ''; for (const w of s.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
const inBox = (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
const prizeNote = (id) => (PRIZES[id].of ? `Đúng ${PRIZES[id].score}/${PRIZES[id].of} trở lên lần đầu: nhận một món đồ trang trí cho nhà.` : `Được ${PRIZES[id].score} viên trở lên lần đầu: nhận một món đồ trang trí cho nhà.`);

// ---------------------------------------------------------------- Bazaar Bargain
export function bazaarGame(rnd = Math.random) {
  const ROUNDS = PRIZES.bazaar.of, TIME = 16;
  const g = { title: '🧺 Bazaar Bargain', help: 'Khách hỏi giá bằng tiếng Anh. Giá từng món ghi trên quầy; cộng lại rồi bấm đáp án đúng (số viết bằng chữ) hoặc phím 1, 2, 3. ' + prizeNote('bazaar'), music: 'jazz',
    n: 0, right: 0, left: TIME, q: null, shown: null, endT: 0, over: false };
  const btn = (i) => ({ x: 40 + i * 166, y: 468, w: 150, h: 62 });
  const next = () => { if (g.n >= ROUNDS) { g.over = true; return; } g.q = bazaarRound(g.n, rnd); g.left = TIME; g.shown = null; speak(g.q.ask, true, 0.9); };
  const answer = (i) => { if (g.over || g.shown || !g.q) return; const ok = i === g.q.a; if (ok) g.right += 1; g.shown = { i, ok, t: ok ? 0.9 : 2.2 }; if (ok) speak(`${g.q.options[g.q.a]} gold`, true); };
  g.info = () => `Khách ${Math.min(g.n + 1, ROUNDS)}/${ROUNDS} · đúng ${g.right} · ⏱ ${Math.max(0, Math.ceil(g.left))} s`;
  g.click = (x, y) => { for (let i = 0; i < 3; i++) if (inBox(x, y, btn(i))) answer(i); };
  g.key = (code) => { const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(code); if (i >= 0) answer(i); };
  g.update = (dt) => {
    if (!g.q && !g.over) next();
    if (g.over) { g.endT += dt; return; }
    if (g.shown) { g.shown.t -= dt; if (g.shown.t <= 0) { g.n += 1; next(); } return; }
    g.left -= dt; if (g.left <= 0) g.shown = { i: -1, ok: false, t: 2.2 };
  };
  g.done = () => (g.over && g.endT > 1.2 ? { id: 'bazaar', score: g.right, text: `Bazaar Bargain: ${g.right} of ${ROUNDS} customers got the right price!` } : null);
  g.draw = (c, w, h, t) => {
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#ffe2a8'); sky.addColorStop(1, '#f6c878'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8b25a'; c.fillRect(0, 430, w, 130);
    // the awning and the stall
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#e2483e' : '#fff6e0'; c.beginPath(); c.moveTo(20 + i * 65, 150); c.lineTo(85 + i * 65, 150); c.lineTo(85 + i * 65, 196); c.arc(52.5 + i * 65, 196, 32.5, 0, Math.PI); c.closePath(); c.fill(); }
    c.fillStyle = '#8a5a2a'; c.fillRect(20, 300, 520, 26); c.fillStyle = '#a8703a'; c.fillRect(30, 326, 500, 100);
    if (!g.q) return;
    g.q.shelf.forEach((gd, i) => { const x = 62 + i * 87, bob = Math.sin(t * 2 + i) * 2; text(c, gd.icon, x, 268 + bob, '44px sans-serif'); rr(c, x - 30, 336, 60, 44, 8); c.fillStyle = '#fff6e0'; c.fill(); c.strokeStyle = '#7a4a1a'; c.lineWidth = 2; c.stroke(); text(c, String(gd.price), x - 6, 352, '800 20px sans-serif'); text(c, '●', x + 16, 352, '16px sans-serif', '#d9a020'); text(c, gd.en, x, 370, '600 10px sans-serif', '#6a4a20'); });
    // the customer and what they ask
    text(c, ['🧕', '👳', '🧔', '👩'][g.n % 4], 70, 84, '64px sans-serif');
    rr(c, 120, 30, 420, 104, 16); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#7a4a1a'; c.lineWidth = 3; c.stroke();
    const lines = wrap(c, g.q.ask, '800 22px sans-serif', 390); lines.forEach((ln, i) => text(c, ln, 330, 82 - (lines.length - 1) * 14 + i * 28, '800 22px sans-serif'));
    for (let i = 0; i < 3; i++) { const b = btn(i), sh = g.shown, right = sh && i === g.q.a, bad = sh && sh.i === i && !sh.ok; rr(c, b.x, b.y, b.w, b.h, 14); c.fillStyle = right ? '#8fe0a0' : bad ? '#f6a090' : '#ffd98a'; c.fill(); c.strokeStyle = '#7a4a1a'; c.lineWidth = 3; c.stroke(); text(c, `${i + 1}. ${g.q.options[i]}`, b.x + b.w / 2, b.y + b.h / 2, '800 20px sans-serif'); }
    if (g.shown && !g.shown.ok) text(c, `${g.q.buy.map(([gd, n]) => `${n} × ${gd.price}`).join(' + ')} = ${g.q.total}`, 280, 446, '800 20px sans-serif', '#b0301e');
    else text(c, 'How much is it? · Tất cả bao nhiêu vàng?', 280, 446, '700 16px sans-serif', '#6a4a20');
    c.fillStyle = '#7a4a1a'; c.fillRect(40, 544, 480 * Math.max(0, g.left / TIME), 6);
    if (g.over) { c.fillStyle = 'rgba(255,244,220,.94)'; c.fillRect(90, 220, 380, 110); text(c, `${g.right} / ${ROUNDS}`, 280, 258, '800 40px sans-serif'); text(c, g.right >= PRIZES.bazaar.score ? 'The bazaar thanks you!' : 'Come back tomorrow!', 280, 302, '700 20px sans-serif'); }
  };
  return g;
}

// ---------------------------------------------------------------- Snow Slide
export function slideGame(rnd = Math.random) {
  const GATES = PRIZES.slide.of, LX = [130, 280, 430], order = slideOrder(rnd);
  const g = { title: '🛷 Snow Slide', help: 'Câu ở trên thiếu một từ so sánh. Lái xe trượt vào làn có dạng ĐÚNG: phím ← → (hoặc A D), hoặc bấm vào làn. Sai mất một ♥. ' + prizeNote('slide'), music: 'race',
    lane: 1, x: LX[1], k: 0, right: 0, hearts: 3, gate: null, y: -60, speed: 150, flash: null, endT: 0, over: false, t: 0 };
  const next = () => { if (g.k >= GATES || g.hearts <= 0) { g.over = true; return; } g.gate = slideGate(g.k, order, rnd); g.y = -70; g.speed = 150 + g.k * 9; speak(g.gate.sentence.replace('___', 'what'), true, 1); };
  g.info = () => `Cổng ${Math.min(g.k + 1, GATES)}/${GATES} · đúng ${g.right} · ${'♥'.repeat(Math.max(0, g.hearts))}`;
  g.key = (code) => { if (code === 'ArrowLeft' || code === 'KeyA') g.lane = Math.max(0, g.lane - 1); if (code === 'ArrowRight' || code === 'KeyD') g.lane = Math.min(2, g.lane + 1); };
  g.click = (x) => { g.lane = x < 205 ? 0 : x < 355 ? 1 : 2; };
  g.update = (dt) => {
    g.t += dt; g.x += (LX[g.lane] - g.x) * Math.min(1, dt * 12);
    if (!g.gate && !g.over) next();
    if (g.over) { g.endT += dt; return; }
    if (g.flash) { g.flash.t -= dt; if (g.flash.t <= 0) { g.flash = null; g.k += 1; next(); } return; }
    g.y += g.speed * dt;
    if (g.y >= 430) { const ok = g.lane === g.gate.a; if (ok) { g.right += 1; speak(g.gate.sentence.replace('___', g.gate.right), true, 1); } else g.hearts -= 1; g.flash = { ok, t: ok ? 0.8 : 2.0 }; }
  };
  g.done = () => (g.over && g.endT > 1.2 ? { id: 'slide', score: g.right, text: `Snow Slide: ${g.right} of ${GATES} gates!` } : null);
  g.draw = (c, w, h, t) => {
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#bfe2ff'); sky.addColorStop(0.35, '#eef7ff'); sky.addColorStop(1, '#ffffff'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#dcecfa'; for (let i = 0; i < 2; i++) c.fillRect(203 + i * 150, 120, 4, 440);
    for (let i = 0; i < 14; i++) { const yy = ((i * 47 + g.t * (g.over ? 0 : g.speed)) % 470) + 110, side = i % 2 ? 30 : 510; text(c, '🌲', side + Math.sin(i) * 14, yy, '30px sans-serif'); }
    rr(c, 20, 14, 520, 92, 14); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#3a6a9a'; c.lineWidth = 3; c.stroke();
    if (g.gate) { const shown = g.flash ? g.gate.sentence.replace('___', g.gate.right) : g.gate.sentence, lines = wrap(c, shown, '800 21px sans-serif', 490); lines.forEach((ln, i) => text(c, ln, 280, 46 - (lines.length - 1) * 13 + i * 26, '800 21px sans-serif', g.flash ? (g.flash.ok ? '#1e7a3a' : '#b0301e') : '#1e3a5a')); text(c, `(${g.gate.adj})`, 280, 88, '700 16px sans-serif', '#3a6a9a'); }
    if (g.gate && !g.over) g.gate.signs.forEach((s, i) => { const y = Math.min(g.y, 430), right = g.flash && i === g.gate.a, bad = g.flash && !g.flash.ok && i === g.lane; rr(c, LX[i] - 68, y - 24, 136, 48, 10); c.fillStyle = right ? '#8fe0a0' : bad ? '#f6a090' : '#ffe9a8'; c.fill(); c.strokeStyle = '#7a4a1a'; c.lineWidth = 3; c.stroke(); text(c, s, LX[i], y, `800 ${s.length > 14 ? 13 : 17}px sans-serif`); });
    text(c, '🛷', g.x, 492 + Math.sin(g.t * 9) * 2, '48px sans-serif');
    if (g.over) { c.fillStyle = 'rgba(255,255,255,.94)'; c.fillRect(90, 220, 380, 110); text(c, `${g.right} / ${GATES}`, 280, 258, '800 40px sans-serif'); text(c, g.hearts > 0 ? 'What a ride!' : 'Brr… try again!', 280, 302, '700 20px sans-serif'); }
  };
  return g;
}

// ---------------------------------------------------------------- Gem Mine
export function mineGame(cards = [], rnd = Math.random) {
  const N = MINE_SIDE, S = 86, X0 = (560 - N * S) / 2, Y0 = 74;
  const g = { title: '💎 Gem Mine', help: `Có ${MINE_PICKS} nhát cuốc. Bấm vào một tảng đá để đào. Có viên đá quý bị khoá sau một từ tiếng Anh: chọn đúng nghĩa (hoặc phím 1, 2, 3) được 2 viên. ` + prizeNote('mine'), music: 'chiptune',
    wall: mineWall(rnd), open: [], picks: MINE_PICKS, gems: 0, q: null, qi: -1, shown: null, pop: [], endT: 0, words: [] };
  const btn = (i) => ({ x: 60, y: 300 + i * 62, w: 440, h: 52 });
  const answer = (i) => { if (!g.q || g.shown) return; const ok = i === g.q.a; g.shown = { i, ok, t: ok ? 0.8 : 2.0 }; if (ok) { g.gems += mineGems('lock', true); g.open[g.qi] = 'gem2'; } else g.open[g.qi] = 'none'; g.words.push(g.q.card); speak(g.q.card.word, true); };
  g.info = () => `⛏ ${g.picks} nhát · 💎 ${g.gems}`;
  g.click = (x, y) => {
    if (g.q) { for (let i = 0; i < 3; i++) if (inBox(x, y, btn(i))) answer(i); return; }
    if (g.picks <= 0) return; const cx = Math.floor((x - X0) / S), cy = Math.floor((y - Y0) / S); if (cx < 0 || cy < 0 || cx >= N || cy >= N) return; const i = cy * N + cx; if (g.open[i]) return;
    g.picks -= 1; const kind = g.wall[i];
    if (kind === 'lock') { const q = mineQuestion(cards, rnd); if (q) { g.q = q; g.qi = i; g.open[i] = 'lock'; speak(q.card.word, true, 0.85); return; } g.open[i] = 'gem'; g.gems += 1; }
    else { g.open[i] = kind; g.gems += mineGems(kind); }
    g.pop.push({ x: X0 + cx * S + S / 2, y: Y0 + cy * S + S / 2, t: 0.7, s: kind === 'none' ? '…' : '+1' });
  };
  g.key = (code) => { const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(code); if (i >= 0) answer(i); };
  g.update = (dt) => {
    g.pop = g.pop.filter((p) => (p.t -= dt) > 0);
    if (g.shown) { g.shown.t -= dt; if (g.shown.t <= 0) { g.shown = null; g.q = null; } return; }
    if (g.picks <= 0 && !g.q) g.endT += dt;
  };
  g.done = () => (g.endT > 1.4 ? { id: 'mine', score: g.gems, words: g.words, text: `Gem Mine: ${g.gems} gems!` } : null);
  g.draw = (c, w, h, t) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a2650'); bg.addColorStop(1, '#4a4484'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    text(c, `⛏ × ${g.picks}`, 110, 38, '800 26px sans-serif', '#ffe9a8'); text(c, `💎 × ${g.gems}`, 450, 38, '800 26px sans-serif', '#9ae8ff');
    for (let i = 0; i < N * N; i++) { const x = X0 + (i % N) * S, y = Y0 + Math.floor(i / N) * S, o = g.open[i];
      rr(c, x + 4, y + 4, S - 8, S - 8, 12); c.fillStyle = o ? '#3a3668' : ['#6e6aa8', '#7a76b4', '#646098'][i % 3]; c.fill(); c.strokeStyle = o ? '#2a2650' : '#9a96d0'; c.lineWidth = 2; c.stroke();
      if (!o) text(c, '🪨', x + S / 2, y + S / 2, '38px sans-serif'); else if (o === 'gem') text(c, '💎', x + S / 2, y + S / 2 + Math.sin(t * 3 + i) * 2, '40px sans-serif'); else if (o === 'gem2') { text(c, '💎', x + S / 2 - 12, y + S / 2, '34px sans-serif'); text(c, '💎', x + S / 2 + 12, y + S / 2 + 4, '34px sans-serif'); } else if (o === 'lock') text(c, '🔒', x + S / 2, y + S / 2, '38px sans-serif'); }
    for (const p of g.pop) text(c, p.s, p.x, p.y - (0.7 - p.t) * 50, '800 24px sans-serif', '#fff');
    if (g.q) { c.fillStyle = 'rgba(20,16,50,.9)'; c.fillRect(30, 190, 500, 310); text(c, '🔒 What does it mean?', 280, 222, '700 18px sans-serif', '#c8c4ff'); text(c, g.q.card.word, 280, 262, '800 34px sans-serif', '#ffffff');
      for (let i = 0; i < 3; i++) { const b = btn(i), sh = g.shown, right = sh && i === g.q.a, bad = sh && sh.i === i && !sh.ok; rr(c, b.x, b.y, b.w, b.h, 12); c.fillStyle = right ? '#8fe0a0' : bad ? '#f6a090' : '#ffe9a8'; c.fill(); const s = `${i + 1}. ${g.q.options[i]}`; text(c, s.length > 44 ? s.slice(0, 43) + '…' : s, b.x + b.w / 2, b.y + b.h / 2, `700 ${s.length > 34 ? 14 : 18}px sans-serif`); } }
    if (g.picks <= 0 && !g.q) { c.fillStyle = 'rgba(255,255,255,.94)'; c.fillRect(90, 220, 380, 110); text(c, `💎 × ${g.gems}`, 280, 258, '800 40px sans-serif'); text(c, g.gems >= PRIZES.mine.score ? 'A rich day in the mine!' : 'Dig again tomorrow!', 280, 302, '700 20px sans-serif'); }
  };
  return g;
}

// ---------------------------------------------------------------- Rune Decoder (27/11)
export function runeGame(rnd = Math.random) {
  const ROUNDS = RUNE_ROUNDS, TIME = 40, order = runeOrder(rnd);
  const g = { title: '🗿 Rune Decoder', help: 'Các phiến đá bị xáo trộn. Bấm lần lượt từng phiến để xếp thành câu ĐÚNG thứ tự (chữ viết hoa đứng đầu câu). Sai quá một lần thì câu đó không tính điểm. ' + prizeNote('rune'), music: 'chiptune',
    k: 0, right: 0, q: null, placed: 0, used: [], miss: 0, bad: -1, badT: 0, left: TIME, shown: null, endT: 0, over: false, boxes: [] };
  const next = () => { if (g.k >= ROUNDS) { g.over = true; return; } g.q = runeRound(g.k, order, rnd); g.placed = 0; g.used = g.q.tiles.map(() => false); g.miss = 0; g.left = TIME; g.shown = null; g.boxes = []; };
  const finish = (ok) => { if (ok) g.right += 1; g.shown = { ok, t: ok ? 1.4 : 3 }; speak(g.q.text, true, 0.95); };
  g.info = () => `Câu ${Math.min(g.k + 1, ROUNDS)}/${ROUNDS} · đúng ${g.right} · ⏱ ${Math.max(0, Math.ceil(g.left))} s`;
  g.click = (x, y) => {
    if (g.over || g.shown || !g.q) return; const i = g.boxes.findIndex((b) => b && inBox(x, y, b)); if (i < 0 || g.used[i]) return;
    if (g.q.tiles[i] === g.q.words[g.placed]) { g.used[i] = true; g.placed += 1; if (g.placed === g.q.words.length) finish(g.miss <= 1); } else { g.miss += 1; g.bad = i; g.badT = 0.5; }
  };
  g.update = (dt) => {
    if (!g.q && !g.over) next();
    if (g.over) { g.endT += dt; return; }
    g.badT = Math.max(0, g.badT - dt);
    if (g.shown) { g.shown.t -= dt; if (g.shown.t <= 0) { g.k += 1; next(); } return; }
    g.left -= dt; if (g.left <= 0) finish(false);
  };
  g.done = () => (g.over && g.endT > 1.2 ? { id: 'rune', score: g.right, text: `Rune Decoder: ${g.right} of ${ROUNDS} sentences!` } : null);
  g.draw = (c, w, h, t) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#5a6a5a'); bg.addColorStop(1, '#2e3a34'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(160,255,210,.08)'; c.beginPath(); c.arc(60 + i * 110, 520 + Math.sin(t + i) * 6, 40, 0, 7); c.fill(); }
    rr(c, 24, 24, 512, 150, 14); c.fillStyle = '#e8e2cc'; c.fill(); c.strokeStyle = '#7a7a5a'; c.lineWidth = 3; c.stroke();
    if (!g.q) return;
    const done = g.shown ? g.q.text : g.q.words.slice(0, g.placed).join(' '), lines = wrap(c, done || '…', '800 23px sans-serif', 480); lines.forEach((ln, i) => text(c, ln, 280, 86 - (lines.length - 1) * 15 + i * 30, '800 23px sans-serif', g.shown ? (g.shown.ok ? '#1e7a3a' : '#b0301e') : '#2e3a34'));
    text(c, g.shown ? (g.shown.ok ? '✔ Well done!' : 'The right sentence:') : `${g.placed}/${g.q.words.length} words · sai ${g.miss}`, 280, 154, '700 15px sans-serif', '#6a6a4a');
    // the tiles, wrapped in rows
    c.font = '800 21px sans-serif'; let x = 30, y = 210; g.boxes = [];
    g.q.tiles.forEach((wd, i) => { const tw = Math.max(64, c.measureText(wd).width + 30); if (x + tw > 530) { x = 30; y += 70; } const b = { x, y, w: tw, h: 56 }; g.boxes[i] = b; x += tw + 12;
      if (g.used[i]) { rr(c, b.x, b.y, b.w, b.h, 10); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill(); return; }
      const bad = g.bad === i && g.badT > 0, dx = bad ? Math.sin(g.badT * 50) * 4 : 0; rr(c, b.x + dx, b.y, b.w, b.h, 10); c.fillStyle = bad ? '#f6a090' : '#cfd6c0'; c.fill(); c.strokeStyle = '#8ad8b0'; c.lineWidth = 3; c.stroke(); text(c, wd, b.x + dx + b.w / 2, b.y + 28, '800 21px sans-serif', '#2e3a34'); });
    c.fillStyle = '#8ad8b0'; c.fillRect(40, 544, 480 * Math.max(0, g.left / TIME), 6);
    if (g.over) { c.fillStyle = 'rgba(240,240,220,.95)'; c.fillRect(90, 220, 380, 110); text(c, `${g.right} / ${ROUNDS}`, 280, 258, '800 40px sans-serif'); text(c, g.right >= PRIZES.rune.score ? 'The runes shine again!' : 'The stones are still mixed up…', 280, 302, '700 19px sans-serif'); }
  };
  return g;
}

// ---------------------------------------------------------------- Balloon Ride (27/11)
export function balloonGame(cards = [], rnd = Math.random) {
  const list = balloonWords(cards, rnd), CX = (col) => 80 + col * 100;
  const g = { title: '🎈 Balloon Ride', help: 'Nghe và nhớ từ, rồi lái khinh khí cầu (← → hoặc A D, hoặc bấm vào cột) hứng các chữ cái THEO THỨ TỰ để đánh vần. Hứng nhầm mất một ♥. ' + prizeNote('balloon'), music: 'lofi',
    col: 2, x: CX(2), n: 0, i: 0, right: 0, hearts: 3, row: null, y: -50, showT: 0, flash: null, endT: 0, over: false, t: 0, words: [] };
  const word = () => list[g.n];
  const nextRow = () => { g.row = balloonRow(word().word, g.i, rnd); g.y = -50; };
  const nextWord = () => { if (g.n >= list.length || g.hearts <= 0) { g.over = true; return; } g.i = 0; g.showT = 2.2; g.row = null; speak(word().word, true, 0.85); };
  g.info = () => `Từ ${Math.min(g.n + 1, list.length)}/${list.length} · xong ${g.right} · ${'♥'.repeat(Math.max(0, g.hearts))}`;
  g.key = (code) => { if (code === 'ArrowLeft' || code === 'KeyA') g.col = Math.max(0, g.col - 1); if (code === 'ArrowRight' || code === 'KeyD') g.col = Math.min(BALLOON_COLS - 1, g.col + 1); };
  g.click = (x) => { g.col = Math.max(0, Math.min(BALLOON_COLS - 1, Math.round((x - 80) / 100))); };
  let started = false;
  g.update = (dt) => {
    g.t += dt; g.x += (CX(g.col) - g.x) * Math.min(1, dt * 12);
    if (!started) { started = true; nextWord(); }
    if (g.over) { g.endT += dt; return; }
    if (g.flash) { g.flash.t -= dt; if (g.flash.t <= 0) { const f = g.flash; g.flash = null; if (f.end) { g.n += 1; nextWord(); } else if (g.hearts <= 0) g.over = true; else nextRow(); } return; }
    if (g.showT > 0) { g.showT -= dt; if (g.showT <= 0) nextRow(); return; }
    g.y += (110 + g.n * 8) * dt;
    if (g.y >= 400) {
      const k = g.row.cols.indexOf(g.col);
      if (k < 0) { nextRow(); return; }      // flew between the clouds: the same letter comes again
      if (k === g.row.a) { g.i += 1; if (g.i >= word().word.length) { g.right += 1; g.words.push(word()); speak(word().word, true); g.flash = { ok: true, end: true, t: 1.3 }; } else g.flash = { ok: true, t: 0.25 }; }
      else { g.hearts -= 1; g.flash = { ok: false, t: 1.2 }; }
    }
  };
  g.done = () => (g.over && g.endT > 1.2 ? { id: 'balloon', score: g.right, words: g.words.filter((x) => x.id), text: `Balloon Ride: ${g.right} of ${list.length} words spelled!` } : null);
  g.draw = (c, w, h, t) => {
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#7ec8ff'); sky.addColorStop(1, '#e6f6ff'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const yy = ((i * 97 + g.t * 30) % 600) - 20; c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(60 + ((i * 173) % 460), yy, 46, 16, 0, 0, 7); c.fill(); }
    rr(c, 20, 14, 520, 92, 14); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#3a7ab0'; c.lineWidth = 3; c.stroke();
    const wd = word() || list[list.length - 1], full = g.showT > 0 || (g.flash && g.flash.end) || g.over;
    if (wd) { text(c, full ? wd.word.split('').join(' ') : wd.word.split('').map((ch, i) => (i < g.i ? ch : '_')).join(' '), 280, 46, '800 30px monospace', full ? '#1e7a3a' : '#1e3a5a'); text(c, `${wd.vi}${g.showT > 0 ? ' · Remember the word!' : ''}`, 280, 84, '700 16px sans-serif', '#6a7a8a'); }
    if (g.row && g.showT <= 0 && !g.over) g.row.cols.forEach((col, k) => { const y = Math.min(g.y, 400), right = g.flash && k === g.row.a && !g.flash.ok, bad = g.flash && !g.flash.ok && col === g.col; c.fillStyle = right ? '#8fe0a0' : bad ? '#f6a090' : '#ffffff'; c.beginPath(); c.ellipse(CX(col), y, 40, 26, 0, 0, 7); c.fill(); c.strokeStyle = '#8ab8e0'; c.lineWidth = 3; c.stroke(); text(c, g.row.letters[k], CX(col), y + 1, '800 28px sans-serif', '#1e3a5a'); });
    text(c, '🎈', g.x, 478 + Math.sin(g.t * 3) * 4, '54px sans-serif'); c.strokeStyle = '#7a5a3a'; c.lineWidth = 2; c.strokeRect(g.x - 9, 510, 18, 14);
    if (g.over) { c.fillStyle = 'rgba(255,255,255,.94)'; c.fillRect(90, 220, 380, 110); text(c, `${g.right} / ${list.length}`, 280, 258, '800 40px sans-serif'); text(c, g.hearts > 0 ? 'A lovely flight!' : 'The balloon came down…', 280, 302, '700 20px sans-serif'); }
  };
  return g;
}

// ---------------------------------------------------------------- Robot Builder (27/11)
const PAINT = { red: '#e2483e', blue: '#3a7bd5', green: '#3aa860', yellow: '#f2c230', pink: '#f08ab8', '': '#b8bcc4' };
export function robotGame(rnd = Math.random) {
  const ROUNDS = ROBOT_ROUNDS;
  const g = { title: '🤖 Robot Builder', help: 'Đọc đơn đặt hàng bằng tiếng Anh. Bấm vào đầu, thân, chân của robot (hoặc phím 1, 2, 3) để đổi màu, rồi bấm BUILD (Enter). ' + prizeNote('robot'), music: 'synthwave',
    k: 0, right: 0, q: null, got: {}, left: 0, time: 30, shown: null, endT: 0, over: false, t: 0 };
  const BOX = { head: { x: 215, y: 196, w: 130, h: 84 }, body: { x: 195, y: 288, w: 170, h: 110 }, legs: { x: 215, y: 404, w: 130, h: 70 } }, BUILD = { x: 400, y: 420, w: 130, h: 54 };
  const next = () => { if (g.k >= ROUNDS) { g.over = true; return; } g.q = robotOrder(g.k, rnd); g.got = { head: '', body: '', legs: '' }; g.time = g.k < 2 ? 25 : g.k < 4 ? 32 : 45; g.left = g.time; g.shown = null; speak(g.q.text, true, 0.95); };
  const turn = (p) => { if (g.over || g.shown || !g.q) return; const i = ROBOT_COLOURS.indexOf(g.got[p]); g.got[p] = ROBOT_COLOURS[(i + 1) % ROBOT_COLOURS.length]; };
  const build = () => { if (g.over || g.shown || !g.q) return; const ok = robotRight(g.q.want, g.got); if (ok) g.right += 1; g.shown = { ok, t: ok ? 1.3 : 3 }; };
  g.info = () => `Robot ${Math.min(g.k + 1, ROUNDS)}/${ROUNDS} · đúng ${g.right} · ⏱ ${Math.max(0, Math.ceil(g.left))} s`;
  g.click = (x, y) => { if (inBox(x, y, BUILD)) return build(); for (const p of ROBOT_PARTS) if (inBox(x, y, BOX[p])) turn(p); };
  g.key = (code) => { const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(code); if (i >= 0) turn(ROBOT_PARTS[i]); if (code === 'Enter' || code === 'NumpadEnter') build(); };
  g.update = (dt) => {
    g.t += dt; if (!g.q && !g.over) next();
    if (g.over) { g.endT += dt; return; }
    if (g.shown) { g.shown.t -= dt; if (g.shown.t <= 0) { g.k += 1; next(); } return; }
    g.left -= dt; if (g.left <= 0) g.shown = { ok: false, t: 3 };
  };
  g.done = () => (g.over && g.endT > 1.2 ? { id: 'robot', score: g.right, text: `Robot Builder: ${g.right} of ${ROUNDS} robots built right!` } : null);
  g.draw = (c, w, h, t) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1e2a4a'); bg.addColorStop(1, '#3a4a7a'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(120,220,255,.18)'; c.lineWidth = 1; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(0, 190 + i * 32); c.lineTo(w, 190 + i * 32); c.stroke(); }
    rr(c, 20, 14, 520, 160, 14); c.fillStyle = '#f2f8ff'; c.fill(); c.strokeStyle = '#5ad0ff'; c.lineWidth = 3; c.stroke();
    if (!g.q) return;
    const lines = wrap(c, g.q.text, '700 19px sans-serif', 490); lines.forEach((ln, i) => text(c, ln, 280, 94 - (lines.length - 1) * 13 + i * 26, '700 19px sans-serif', '#1e2a4a'));
    const show = g.shown && !g.shown.ok ? g.q.want : g.got, hop = g.shown && g.shown.ok ? Math.abs(Math.sin(g.t * 9)) * 10 : 0;
    const part = (p) => { const b = BOX[p]; rr(c, b.x, b.y - hop, b.w, b.h, 14); c.fillStyle = PAINT[show[p]] || PAINT['']; c.fill(); c.strokeStyle = '#0e1630'; c.lineWidth = 4; c.stroke(); };
    c.strokeStyle = '#0e1630'; c.lineWidth = 5; c.beginPath(); c.moveTo(280, 196 - hop); c.lineTo(280, 178 - hop); c.stroke(); c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(280, 174 - hop, 7, 0, 7); c.fill();
    part('head'); part('body'); part('legs'); c.fillStyle = '#3a4a7a'; c.fillRect(273, 410 - hop, 14, 64);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(252, 232 - hop, 12, 0, 7); c.arc(308, 232 - hop, 12, 0, 7); c.fill(); c.fillStyle = '#0e1630'; c.beginPath(); c.arc(252, 232 - hop, 5, 0, 7); c.arc(308, 232 - hop, 5, 0, 7); c.fill(); c.fillRect(255, 258 - hop, 50, 6);
    c.fillStyle = '#8a94a8'; c.fillRect(165, 300 - hop, 26, 80); c.fillRect(369, 300 - hop, 26, 80);
    ROBOT_PARTS.forEach((p, i) => { const b = BOX[p]; text(c, `${i + 1}. ${p}: ${show[p] || '?'}`, 28, b.y + b.h / 2, '700 17px sans-serif', '#d8ecff', 'left'); });
    rr(c, BUILD.x, BUILD.y, BUILD.w, BUILD.h, 12); c.fillStyle = '#ffd24a'; c.fill(); c.strokeStyle = '#0e1630'; c.lineWidth = 3; c.stroke(); text(c, 'BUILD ⏎', BUILD.x + BUILD.w / 2, BUILD.y + 28, '800 20px sans-serif', '#0e1630');
    if (g.shown) text(c, g.shown.ok ? '✔ Perfect!' : '✘ This is the right robot', 280, 500, '800 20px sans-serif', g.shown.ok ? '#8fe0a0' : '#ffb0a0');
    c.fillStyle = '#5ad0ff'; c.fillRect(40, 544, 480 * Math.max(0, g.left / g.time), 6);
    if (g.over) { c.fillStyle = 'rgba(240,248,255,.95)'; c.fillRect(90, 220, 380, 110); text(c, `${g.right} / ${ROUNDS}`, 280, 258, '800 40px sans-serif', '#1e2a4a'); text(c, g.right >= PRIZES.robot.score ? 'The workshop loves you!' : 'Read the order again!', 280, 302, '700 20px sans-serif', '#1e2a4a'); }
  };
  return g;
}
