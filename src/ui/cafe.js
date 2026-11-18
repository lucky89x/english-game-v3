// Seaside Café (Map 2, 18/11: "cooking game with English"). An original cooking game: each customer orders in English
// ("I'd like a burger with cheese and tomato, please."); the child picks the dish on the tabs, taps the ingredients that
// go on it, and from the third tier adds the drink. SERVE checks the plate. Dishes, foods and drinks are the words
// practised; tapping a food says its name aloud. Same board interface as the other arcade games.
import { speak } from './speech.js';

export const DISHES = {
  sandwich: { art: 'a sandwich', fill: ['cheese', 'tomato', 'lettuce', 'ham', 'egg', 'cucumber'] },
  burger: { art: 'a burger', fill: ['beef', 'cheese', 'tomato', 'lettuce', 'onion', 'egg'] },
  pizza: { art: 'a pizza', fill: ['cheese', 'tomato', 'mushroom', 'ham', 'pepper', 'olives'] },
  salad: { art: 'a salad', fill: ['lettuce', 'tomato', 'cucumber', 'carrot', 'corn', 'egg'] },
};
export const DISH_IDS = Object.keys(DISHES);
export const DRINKS = ['orange juice', 'apple juice', 'milk', 'tea', 'lemonade', 'water'];
const DRINK_COL = { 'orange juice': '#ff9a2a', 'apple juice': '#e8c040', milk: '#ffffff', tea: '#a8602a', lemonade: '#f6ee90', water: '#bfe6ff' };
const container = (d) => (d === 'tea' ? 'a cup of tea' : `a glass of ${d}`);
const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]);

/** One customer's order: a dish, its fillings (2 at tier 1, 3 after) and, from tier 3, a drink. */
export function makeOrder(rnd, tier = 1) {
  const dish = DISH_IDS[Math.floor(rnd() * DISH_IDS.length)], pool = [...DISHES[dish].fill], n = tier <= 1 ? 2 : 3, fill = [];
  while (fill.length < n) fill.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return { dish, fill, drink: tier >= 3 ? DRINKS[Math.floor(rnd() * DRINKS.length)] : null, k: Math.floor(rnd() * 3) };
}
export function orderText(o) {
  const food = `${DISHES[o.dish].art} with ${list(o.fill)}`, all = o.drink ? `${food} and ${container(o.drink)}` : food;
  return [`I'd like ${all}, please.`, `Could I have ${all}, please?`, `I'll have ${all}, please.`][o.k % 3];
}
/** Points for a plate: 20 for the right dish, 15 for each asked ingredient on it, 15 for the right drink; minus 5 for each
 *  ingredient nobody asked for and for a wrong drink. */
export function scoreOrder(o, made) {
  const dish = made.dish === o.dish, fills = o.fill.filter((f) => made.fill.includes(f)).length, drink = !!(o.drink && made.drink === o.drink);
  const extra = made.fill.filter((f) => !o.fill.includes(f)).length + (made.drink && made.drink !== o.drink ? 1 : 0);
  const total = 1 + o.fill.length + (o.drink ? 1 : 0), right = (dish ? 1 : 0) + fills + (drink ? 1 : 0);
  return { right, total, extra, points: Math.max(0, (dish ? 20 : 0) + fills * 15 + (drink ? 15 : 0) - extra * 5) };
}
const spokenAsked = (o) => `${DISHES[o.dish].art.replace(/^a /, '')} with ${list(o.fill)}${o.drink ? ` and ${o.drink}` : ''}`;

export function cafeGame(rnd = Math.random, tier = 1) {
  const CUSTOMERS = 5, big = tier < 3;      // up to tier 2 the food tiles are big; tier 3 makes room for the drinks
  const g = { title: '🍳 Seaside Café', help: 'Đọc món khách gọi. Chọn món ở hàng trên (sandwich, burger, pizza, salad), bấm các nguyên liệu khách muốn' + (tier >= 3 ? ', chọn thêm đồ uống' : '') + '. Xong bấm SERVE.',
    score: 0, n: 0, dish: 'sandwich', fill: [], drink: null, order: makeOrder(rnd, tier), msg: '', msgT: 0, endT: 0, mood: 0, moodT: 0, pops: [] };
  g.info = () => `Khách ${Math.min(g.n + 1, CUSTOMERS)}/${CUSTOMERS} · Điểm ${g.score}`;
  const say = () => speak(orderText(g.order), true, 0.9);
  setTimeout(say, 300);
  const th = big ? 148 : 72, row = th + 8, shelf = () => DISHES[g.dish].fill;
  g.update = (dt) => { g.msgT = Math.max(0, g.msgT - dt); g.moodT = Math.max(0, g.moodT - dt); for (const p of g.pops) p.t -= dt; g.pops = g.pops.filter((p) => p.t > 0); if (g.n >= CUSTOMERS) g.endT += dt; };
  g.click = (x, y) => {
    if (g.n >= CUSTOMERS) return;
    if (y > 92 && y < 130 && x > 232) { const d = DISH_IDS[Math.floor((x - 236) / 79)]; if (d && d !== g.dish) { g.dish = d; g.fill = []; speak(DISHES[d].art.replace(/^a /, ''), true, 0.9); } return; }      // dish tabs
    if (y >= 146 && y < 146 + row * 2 && x > 236) {          // ingredient tiles
      const c = Math.floor((x - 236) / 108), r = Math.floor((y - 146) / row), f = shelf()[r * 3 + c];
      if (c < 3 && f && (y - 146) % row < th) { const i = g.fill.indexOf(f); if (i >= 0) g.fill.splice(i, 1); else { g.fill.push(f); speak(f, true, 0.9); } }
      return;
    }
    if (!big && y >= 322 && y < 322 + 118 && x > 236) {      // drinks (tier 3)
      const c = Math.floor((x - 236) / 108), r = Math.floor((y - 322) / 62), d = DRINKS[r * 3 + c];
      if (c < 3 && d && (y - 322) % 62 < 54) { g.drink = g.drink === d ? null : d; if (g.drink) speak(d, true, 0.9); }
      return;
    }
    if (y > 486 && y < 540 && x > 400) {          // SERVE
      const s = scoreOrder(g.order, { dish: g.dish, fill: g.fill, drink: g.drink }); g.score += s.points; g.n += 1;
      const perfect = s.right === s.total && !s.extra;
      g.msg = perfect ? 'Perfect! It looks delicious!' : `Hmm, I asked for ${spokenAsked(g.order)}.`; g.msgT = 2.8; g.mood = perfect ? 1 : -1; g.moodT = 2.4; speak(g.msg, true, 0.95);
      g.pops.push({ x: 115, y: 250, t: 1.4, text: '+' + s.points });
      if (g.n < CUSTOMERS) { g.order = makeOrder(rnd, tier); g.fill = []; g.drink = null; g.dish = 'sandwich'; setTimeout(say, 2800); }
      return;
    }
    if (y > 486 && y < 540 && x > 236 && x < 390) say();      // hear again
  };
  g.done = () => (g.n >= CUSTOMERS && g.endT > 1.2 ? { id: 'cafe', score: g.score, gold: Math.min(35, Math.floor(g.score / 12)), exp: Math.min(45, Math.floor(g.score / 8)), text: `Seaside Café: ${g.score} points!` } : null);
  g.draw = (c, w, h, t) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#e6f6fa'); bg.addColorStop(1, '#ffe9c8'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(10, 8, 540, 74, 16); c.fill(); c.strokeStyle = '#3a9ab0'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#1f6a80'; c.font = '800 15px sans-serif'; c.textAlign = 'left'; c.fillText(g.n < CUSTOMERS ? `Customer ${g.n + 1}:` : 'All done!', 22, 32);
    const say_ = g.n < CUSTOMERS ? orderText(g.order) : 'Thank you! The café is closed for today.', long_ = say_.length > 62;
    c.font = long_ ? '700 16px sans-serif' : '700 17px sans-serif'; c.fillStyle = '#10303a'; wrap(c, say_, 22, long_ ? 52 : 56, 516, long_ ? 20 : 21);
    customer(c, 115, 170, g.n, g.mood > 0 && g.moodT > 0 ? 1 : g.mood < 0 && g.moodT > 0 ? -1 : 0, t);
    // the counter and the plate
    c.fillStyle = '#a8743f'; c.fillRect(10, 352, 206, 120); c.fillStyle = '#c89058'; c.beginPath(); c.roundRect(4, 330, 218, 24, 8); c.fill(); c.strokeStyle = '#7a4a1a'; c.lineWidth = 2; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '800 13px sans-serif'; c.textAlign = 'center'; c.fillText('Chef Leo’s Kitchen', 113, 392); c.font = '600 12px sans-serif'; c.fillText(g.dish === 'pizza' || g.dish === 'salad' ? 'Tap the foods to add them' : 'Tap foods: they pile up!', 113, 412);
    plate(c, 113, 342, g.dish, g.fill, g.drink);
    // tabs
    DISH_IDS.forEach((d, i) => { const x = 236 + i * 79, on = d === g.dish; c.fillStyle = on ? '#3a9ab0' : '#fff'; c.beginPath(); c.roundRect(x, 94, 76, 34, 9); c.fill(); c.strokeStyle = '#3a9ab0'; c.lineWidth = 2; c.stroke();
      c.fillStyle = on ? '#fff' : '#1f6a80'; c.font = '800 14px sans-serif'; c.textAlign = 'center'; c.fillText(d, x + 38, 116); });
    // food tiles
    shelf().forEach((f, k) => { const x = 236 + (k % 3) * 108, y = 146 + Math.floor(k / 3) * row, on = g.fill.includes(f);
      tile(c, x, y, 102, th, on); c.save(); if (big) { c.translate(x + 51, y + 64); c.scale(1.45, 1.45); } else { c.translate(x + 51, y + 27); c.scale(0.62, 0.62); } icon(c, f, 0, 0); c.restore();
      c.fillStyle = '#10303a'; c.font = big ? '800 15px sans-serif' : '800 13px sans-serif'; c.textAlign = 'center'; c.fillText(f, x + 51, y + (big ? 134 : 63)); });
    if (!big) {          // drinks
      c.fillStyle = '#1f6a80'; c.font = '800 14px sans-serif'; c.textAlign = 'left'; c.fillText('Drinks', 238, 316);
      DRINKS.forEach((d, k) => { const x = 236 + (k % 3) * 108, y = 322 + Math.floor(k / 3) * 62, on = g.drink === d; tile(c, x, y, 102, 54, on);
        c.save(); c.translate(x + 22, y + 28); c.scale(0.55, 0.55); drink(c, d); c.restore(); c.fillStyle = '#10303a'; c.font = '700 12px sans-serif'; c.textAlign = 'left'; wrap(c, d, x + 42, y + 25, 58, 14); });
    }
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(236, 488, 150, 50, 12); c.fill(); c.fillStyle = '#1f6a80'; c.font = '800 16px sans-serif'; c.textAlign = 'center'; c.fillText('🔊 Listen again', 311, 519);
    c.fillStyle = '#e8743a'; c.beginPath(); c.roundRect(400, 488, 150, 50, 12); c.fill(); c.fillStyle = '#fff'; c.font = '900 20px sans-serif'; c.fillText('SERVE ✓', 475, 520);
    for (const p of g.pops) { c.globalAlpha = Math.min(1, p.t); c.fillStyle = '#e8743a'; c.font = '900 26px sans-serif'; c.fillText(p.text, p.x, p.y - (1.4 - p.t) * 40); c.globalAlpha = 1; }
    if (g.msgT > 0) { c.globalAlpha = Math.min(1, g.msgT); c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.roundRect(14, 424, 200, 56, 12); c.fill(); c.fillStyle = '#10303a'; c.font = '700 13px sans-serif'; c.textAlign = 'left'; wrap(c, g.msg, 22, 443, 184, 16); c.globalAlpha = 1; }
    c.textAlign = 'left';
  };
  return g;
}

function wrap(c, text, x, y, maxW, lh) {
  let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) c.fillText(line, x, y);
}
function tile(c, x, y, w, h, on) {
  c.fillStyle = on ? '#fff3a0' : 'rgba(255,255,255,.82)'; c.beginPath(); c.roundRect(x, y, w, h, 12); c.fill();
  c.strokeStyle = on ? '#e8743a' : 'rgba(58,154,176,.4)'; c.lineWidth = on ? 4 : 2; c.stroke();
  if (on) { c.fillStyle = '#e8743a'; c.font = '900 16px sans-serif'; c.textAlign = 'right'; c.fillText('✓', x + w - 8, y + 20); }
}
/** The customer: head, hair, a hat or glasses, and a face that smiles or frowns after the plate is served. */
function customer(c, x, y, n, mood, t) {
  const skin = ['#f6d2b0', '#e8b890', '#c98f64', '#f6d2b0', '#9a6a44'][n % 5], hair = ['#5a3418', '#2a1a10', '#d8a030', '#8a2a1a', '#3a3a5a'][n % 5], shirt = ['#e8443a', '#2f6fd0', '#3fae4a', '#9a5ae0', '#ff8a1a'][n % 5];
  c.save(); c.translate(x, y + Math.sin(t * 2 + n) * 1.5);
  c.fillStyle = shirt; c.beginPath(); c.roundRect(-62, 44, 124, 150, 36); c.fill();      // shoulders
  c.fillStyle = skin; c.fillRect(-10, 34, 20, 20);
  c.fillStyle = hair; c.beginPath(); c.arc(0, -4, 46, Math.PI * 0.95, Math.PI * 2.05); c.fill(); if (n % 2) c.fillRect(-46, -6, 14, 54); else c.fillRect(32, -6, 14, 30);
  c.fillStyle = skin; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill();
  c.fillStyle = hair; c.beginPath(); c.arc(0, -8, 40, Math.PI * 1.05, Math.PI * 1.95); c.fill();      // fringe
  c.fillStyle = '#2a1a10'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 15, 4, 4.5, 0, 7); c.fill(); }
  if (n % 3 === 0) { c.strokeStyle = '#2a2a30'; c.lineWidth = 3; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 15, 4, 11, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(-4, 4); c.lineTo(4, 4); c.stroke(); }
  c.strokeStyle = '#c0504a'; c.lineWidth = 3; c.beginPath(); if (mood < 0) c.arc(0, 30, 10, Math.PI + 0.3, -0.3); else c.arc(0, 16, mood > 0 ? 14 : 9, 0.2, Math.PI - 0.2); c.stroke();
  if (mood > 0) { c.fillStyle = 'rgba(255,120,140,.5)'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 27, 16, 7, 0, 7); c.fill(); } }
  if (n % 2 === 0) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-30, -64, 60, 26, 10); c.fill(); c.strokeStyle = '#ccc'; c.lineWidth = 2; c.stroke(); c.fillStyle = shirt; c.fillRect(-30, -44, 60, 6); }      // a cap
  c.restore();
}
/** The plate with what has been made so far. */
function plate(c, x, y, dish, fill, drinkId) {
  c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x + 3, y + 8, 94, 18, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.strokeStyle = '#b8c8d0'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, 90, 17, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#eef4f6'; c.beginPath(); c.ellipse(x, y, 66, 11, 0, 0, 7); c.fill();
  if (dish === 'sandwich' || dish === 'burger') {
    const bur = dish === 'burger', bw = bur ? 112 : 124; let top = y - 3;
    c.fillStyle = bur ? '#e0a050' : '#e2b26a'; c.strokeStyle = bur ? '#a8702a' : '#a8782e'; c.lineWidth = 2; c.beginPath(); c.roundRect(x - bw / 2, top - (bur ? 17 : 15), bw, bur ? 17 : 15, 7); c.fill(); c.stroke(); top -= bur ? 17 : 15;
    for (const f of fill) { const hh = f === 'beef' ? 17 : f === 'tomato' || f === 'egg' || f === 'onion' ? 10 : 8; layer(c, f, x, top, bw, hh); top -= hh - 1; }
    c.fillStyle = bur ? '#e8aa58' : '#e8bc78'; c.strokeStyle = bur ? '#a8702a' : '#a8782e'; c.beginPath();
    if (bur) { c.ellipse(x, top - 3, bw / 2 + 2, 34, 0, Math.PI, 0); c.closePath(); } else c.roundRect(x - bw / 2, top - 18, bw, 18, 8);
    c.fill(); c.stroke();
    if (bur) { c.fillStyle = '#fff3d0'; for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(x - 36 + k * 12, top - 16 - Math.sin(k / 6 * Math.PI) * 14, 3, 1.8, 0.3, 0, 7); c.fill(); } }
  } else if (dish === 'pizza') {
    c.fillStyle = '#e8b060'; c.strokeStyle = '#a8702a'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 14, 80, 30, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#e8553a'; c.beginPath(); c.ellipse(x, y - 14, 70, 25, 0, 0, 7); c.fill();
    fill.forEach((f, i) => { for (let k = 0; k < 5; k++) { const a = k * 1.256 + i * 0.7, r = 0.28 + ((k * 3 + i * 2) % 5) * 0.12; c.save(); c.translate(x + Math.cos(a) * 62 * r, y - 14 + Math.sin(a) * 21 * r); c.scale(0.3, 0.3); icon(c, f, 0, 0); c.restore(); } });
  } else {
    c.fillStyle = '#f4f4f4'; c.strokeStyle = '#9ab0b8'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y - 24, 62, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    fill.forEach((f, i) => { for (let k = 0; k < 4; k++) { const a = (k + i * 0.37) * 1.6, rr = 0.15 + ((k * 2 + i) % 4) * 0.2; c.save(); c.translate(x + Math.cos(a) * 52 * rr, y - 26 + Math.sin(a) * 9 * rr - 6 - Math.cos(a * 1.3) * 4); c.scale(0.33, 0.33); icon(c, f, 0, 0); c.restore(); } });
    c.fillStyle = '#f4f4f4'; c.strokeStyle = '#9ab0b8'; c.beginPath(); c.moveTo(x - 62, y - 24); c.quadraticCurveTo(x - 58, y + 14, x, y + 14); c.quadraticCurveTo(x + 58, y + 14, x + 62, y - 24); c.closePath(); c.fill(); c.stroke();
  }
  if (drinkId) { c.save(); c.translate(x + 78, y - 22); c.scale(0.7, 0.7); drink(c, drinkId); c.restore(); }
}
/** A flat layer of a sandwich or burger. */
function layer(c, f, x, top, bw, hh) {
  const col = { cheese: '#f6c62e', tomato: '#e8443a', lettuce: '#5cc04a', ham: '#f08aa0', egg: '#fff7d0', cucumber: '#8fd070', beef: '#8a4a2a', onion: '#e8d0f0' }[f] || '#ccc';
  c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; c.beginPath();
  if (f === 'lettuce') { c.moveTo(x - bw / 2 - 4, top); for (let k = 0; k <= 12; k++) c.lineTo(x - bw / 2 - 4 + k * (bw + 8) / 12, top - hh + (k % 2 ? -3 : 3)); c.lineTo(x + bw / 2 + 4, top); c.closePath(); }
  else if (f === 'cheese') { c.moveTo(x - bw / 2 - 3, top); c.lineTo(x + bw / 2 + 3, top); c.lineTo(x + bw / 2 - 6, top - hh); c.lineTo(x - bw / 2 + 12, top - hh); c.closePath(); }
  else c.roundRect(x - bw / 2 + 4, top - hh, bw - 8, hh, 5);
  c.fill(); c.stroke();
  if (f === 'egg') { c.fillStyle = '#ffcc20'; c.beginPath(); c.ellipse(x, top - hh / 2, 18, hh / 2 - 1, 0, 0, 7); c.fill(); }
}
const GREEN = '#3fae4a';
/** A food icon centred on (x, y), about 60 units across. */
export function icon(c, id, x, y) {
  c.save(); c.translate(x, y); c.lineWidth = 2.5; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineJoin = 'round';
  const blob = (col, rx, ry, rot = 0, px = 0, py = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(px, py, rx, ry, rot, 0, 7); c.fill(); c.stroke(); };
  if (id === 'cheese') { c.fillStyle = '#f6c62e'; c.beginPath(); c.moveTo(-28, 14); c.lineTo(28, 14); c.lineTo(28, -6); c.lineTo(-28, -22); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#e0a418'; for (const [px, py, r] of [[-12, 2, 4.5], [8, -2, 3.5], [16, 8, 3]]) { c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); } }
  else if (id === 'tomato') { blob('#e8443a', 22, 20, 0, 0, 3); c.fillStyle = GREEN; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * 0.628 - 1.57, r = k % 2 ? 5 : 12; c.lineTo(Math.cos(a) * r, -17 + Math.sin(a) * r * 0.6); } c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-9, -2, 5, 3, -0.6, 0, 7); c.fill(); }
  else if (id === 'lettuce') { for (const [px, py, r, col] of [[-14, 6, 15, '#5cc04a'], [14, 6, 15, '#5cc04a'], [0, -8, 17, '#7ad060'], [-6, 8, 13, '#6ac852'], [10, -6, 12, '#7ad060']]) { c.fillStyle = col; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); c.stroke(); } c.strokeStyle = '#3a8a34'; c.beginPath(); c.moveTo(0, 18); c.lineTo(0, -14); c.moveTo(0, 4); c.lineTo(-10, -4); c.moveTo(0, 4); c.lineTo(10, -4); c.stroke(); }
  else if (id === 'ham') { c.fillStyle = '#f08aa0'; c.beginPath(); c.roundRect(-27, -17, 54, 34, 12); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-14, -6); c.quadraticCurveTo(0, 2, 14, -8); c.moveTo(-16, 6); c.quadraticCurveTo(0, 12, 12, 4); c.stroke(); }
  else if (id === 'egg') { c.fillStyle = '#fff'; c.beginPath(); for (let k = 0; k < 7; k++) { const a = k * 0.9; c.arc(Math.cos(a) * 11, Math.sin(a) * 9, 13, 0, 7); } c.fill(); c.stroke(); c.fillStyle = '#ffcc20'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(-3, -3, 3, 0, 7); c.fill(); }
  else if (id === 'cucumber') { blob('#8fd070', 22, 22); c.fillStyle = '#c8eaa0'; c.beginPath(); c.arc(0, 0, 15, 0, 7); c.fill(); c.fillStyle = '#7ab85a'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(Math.cos(k * 1.05) * 8, Math.sin(k * 1.05) * 8, 2.2, 0, 7); c.fill(); } }
  else if (id === 'beef') { blob('#8a4a2a', 28, 17); c.strokeStyle = '#5a2a14'; c.lineWidth = 3; for (const px of [-12, 0, 12]) { c.beginPath(); c.moveTo(px - 5, -9); c.lineTo(px + 5, 9); c.stroke(); } }
  else if (id === 'onion') { c.fillStyle = 'rgba(0,0,0,0)'; c.lineWidth = 5; c.strokeStyle = '#c8a0d8'; for (const r of [20, 11]) { c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); } c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 20, 3.5, 4.4); c.stroke(); }
  else if (id === 'mushroom') { c.fillStyle = '#f2e6cc'; c.beginPath(); c.roundRect(-8, 2, 16, 20, 5); c.fill(); c.stroke(); c.fillStyle = '#c9a07a'; c.beginPath(); c.arc(0, 4, 25, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.6)'; for (const [px, py] of [[-10, -8], [6, -12], [12, -2]]) { c.beginPath(); c.arc(px, py, 3, 0, 7); c.fill(); } }
  else if (id === 'pepper') { c.fillStyle = GREEN; c.beginPath(); c.moveTo(-18, -10); c.bezierCurveTo(-26, 14, -12, 24, -6, 20); c.bezierCurveTo(0, 26, 8, 22, 10, 20); c.bezierCurveTo(24, 20, 26, -4, 18, -10); c.bezierCurveTo(10, -16, -10, -16, -18, -10); c.fill(); c.stroke(); c.fillStyle = '#2a7a2a'; c.fillRect(-3, -22, 6, 10); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-10, -4, 3, 7, 0.2, 0, 7); c.fill(); }
  else if (id === 'olives') { for (const [px, py] of [[-12, 4], [12, -4]]) { c.fillStyle = '#2a2a30'; c.beginPath(); c.ellipse(px, py, 14, 12, 0.4, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#c8a060'; c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill(); } }
  else if (id === 'carrot') { c.fillStyle = '#ff8a1a'; c.beginPath(); c.moveTo(-26, -9); c.lineTo(28, 0); c.lineTo(-26, 9); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#c85a0a'; c.lineWidth = 2; for (const px of [-12, 2, 14]) { c.beginPath(); c.moveTo(px, -4); c.lineTo(px + 4, 3); c.stroke(); } c.fillStyle = GREEN; for (const a of [-0.5, 0, 0.5]) { c.save(); c.translate(-26, 0); c.rotate(Math.PI + a); c.beginPath(); c.ellipse(9, 0, 9, 4, 0, 0, 7); c.fill(); c.restore(); } }
  else if (id === 'corn') { c.save(); c.rotate(-0.5); c.fillStyle = '#ffd23c'; c.beginPath(); c.ellipse(0, 0, 14, 26, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#e8b020'; for (let r = -4; r <= 3; r++) for (let q = -1; q <= 1; q++) { c.beginPath(); c.arc(q * 7, r * 5.5, 2.2, 0, 7); c.fill(); } c.fillStyle = '#6ac852'; c.beginPath(); c.ellipse(-12, 8, 6, 18, 0.35, 0, 7); c.fill(); c.beginPath(); c.ellipse(12, 8, 6, 18, -0.35, 0, 7); c.fill(); c.restore(); }
  c.restore();
}
/** A drink in a glass (a cup for tea), about 50 units tall. */
export function drink(c, id) {
  const col = DRINK_COL[id] || '#fff'; c.save(); c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = '#6a8aa0';
  if (id === 'tea') {
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-20, -14); c.lineTo(20, -14); c.lineTo(15, 20); c.quadraticCurveTo(0, 28, -15, 20); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(22, 0, 9, -1.3, 1.3); c.stroke(); c.fillStyle = col; c.beginPath(); c.ellipse(0, -13, 19, 4, 0, 0, 7); c.fill();
    c.strokeStyle = '#8a8a8a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(8, -13); c.quadraticCurveTo(24, -18, 16, -28); c.stroke(); c.fillStyle = '#f4f4f4'; c.fillRect(11, -32, 10, 7);
  } else {
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(-16, -24); c.lineTo(16, -24); c.lineTo(12, 24); c.lineTo(-12, 24); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = col; c.beginPath(); c.moveTo(-14.5, -10); c.lineTo(14.5, -10); c.lineTo(11.5, 22); c.lineTo(-11.5, 22); c.closePath(); c.fill();
    c.strokeStyle = '#e8443a'; c.lineWidth = 3; c.beginPath(); c.moveTo(6, -10); c.lineTo(12, -34); c.stroke();
    if (id === 'lemonade') { c.fillStyle = '#ffe94a'; c.strokeStyle = '#c8a818'; c.lineWidth = 2; c.beginPath(); c.arc(16, -22, 9, 0, 7); c.fill(); c.stroke(); }
    if (id === 'water') { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-7, -4, 8, 8); c.fillRect(2, 6, 7, 7); }
  }
  c.restore();
}
