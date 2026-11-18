// Style Studio (Map 2 boutique, 18/11: "mini games like the girls' games, with English"). An original dress-up game:
// each customer asks in English for clothes of given colours ("I'd like a pink hat and blue shoes, please."); the child
// picks a clothes type from the tabs, then a colour, and dresses the model; "Done" checks the outfit. Colours and
// clothes are the words practised. Higher tiers ask for more items. Same board interface as the arcade games.
import { speak } from './speech.js';

export const COLORS = { red: '#e8443a', blue: '#2f6fd0', yellow: '#f6c62e', green: '#3fae4a', pink: '#ff8fc0', purple: '#9a5ae0', black: '#2a2a30', white: '#f4f4f4', orange: '#ff8a1a', brown: '#8a5a30' };
export const CLOTHES = ['hat', 'T-shirt', 'skirt', 'trousers', 'dress', 'shoes', 'bag', 'glasses', 'scarf'];
const ART = { hat: 'a hat', 'T-shirt': 'a T-shirt', skirt: 'a skirt', trousers: 'trousers', dress: 'a dress', shoes: 'shoes', bag: 'a bag', glasses: 'glasses', scarf: 'a scarf' };
/** Where each piece is worn: a dress covers both the top and the bottom. */
const SLOT = { hat: 'head', 'T-shirt': 'top', skirt: 'bottom', trousers: 'bottom', dress: 'body', shoes: 'feet', bag: 'hand', glasses: 'face', scarf: 'neck' };
const article = (c, item) => (ART[item].startsWith('a ') ? `${/^[aeiou]/.test(c) ? 'an' : 'a'} ${c} ${item}` : `${c} ${item}`);

/** An order of n different pieces that can be worn together. */
export function makeOrder(rnd, n) {
  const out = [], used = new Set(), cols = Object.keys(COLORS);
  for (let t = 0; out.length < n && t < 60; t++) {
    const item = CLOTHES[Math.floor(rnd() * CLOTHES.length)], slot = SLOT[item];
    const clash = used.has(slot) || (slot === 'body' && (used.has('top') || used.has('bottom'))) || ((slot === 'top' || slot === 'bottom') && used.has('body'));
    if (clash) continue;
    used.add(slot); out.push({ item, color: cols[Math.floor(rnd() * cols.length)] });
  }
  return out;
}
export const orderText = (o) => { const p = o.map((x) => article(x.color, x.item)); return `I'd like ${p.length > 1 ? p.slice(0, -1).join(', ') + ' and ' + p[p.length - 1] : p[0]}, please.`; };
/** Points for an outfit: 20 per asked piece worn in the right colour, minus 5 for each other piece put on. */
export function scoreOutfit(order, worn) {
  let right = 0; for (const o of order) if (worn[o.item] === o.color) right += 1;
  const extra = Object.keys(worn).filter((k) => worn[k] && !order.some((o) => o.item === k && o.color === worn[k])).length;
  return { right, total: order.length, points: Math.max(0, right * 20 - extra * 5) };
}

export function styleGame(rnd = Math.random, tier = 1) {
  const per = [0, 2, 3, 4][tier] || 2, CUSTOMERS = 5;
  const g = { title: '👗 Style Studio', help: 'Đọc yêu cầu tiếng Anh của khách. Chọn loại đồ ở hàng trên, rồi chọn màu. Xong bấm DONE.', score: 0, n: 0, tab: 'hat', worn: {}, order: makeOrder(rnd, per), msg: '', msgT: 0, endT: 0, happy: 0 };
  const COLS = Object.keys(COLORS);
  g.info = () => `Khách ${Math.min(g.n + 1, CUSTOMERS)}/${CUSTOMERS} · Điểm ${g.score}`;
  const say = () => speak(orderText(g.order), true, 0.9);
  setTimeout(say, 300);
  const wear = (item, color) => {
    const slot = SLOT[item];
    if (g.worn[item] === color) { delete g.worn[item]; return; }
    for (const k of Object.keys(g.worn)) { const s = SLOT[k]; if (s === slot || (slot === 'body' && (s === 'top' || s === 'bottom')) || ((slot === 'top' || slot === 'bottom') && s === 'body')) delete g.worn[k]; }
    g.worn[item] = color;
  };
  g.update = (dt) => { g.msgT = Math.max(0, g.msgT - dt); g.happy = Math.max(0, g.happy - dt); if (g.n >= CUSTOMERS) g.endT += dt; };
  g.click = (x, y) => {
    if (g.n >= CUSTOMERS) return;
    if (y > 92 && y < 128 && x > 226) { const i = Math.floor((x - 228) / 36); if (CLOTHES[i]) g.tab = CLOTHES[i]; return; }      // tabs
    if (y > 150 && y < 470 && x > 236) { const c = Math.floor((x - 236) / 108), r = Math.floor((y - 150) / 64), k = r * 3 + c; if (c < 3 && COLS[k]) wear(g.tab, COLS[k]); return; }      // colours
    if (y > 486 && y < 540 && x > 400) {          // DONE
      const s = scoreOutfit(g.order, g.worn); g.score += s.points; g.n += 1;
      g.msg = s.right === s.total ? 'Perfect! I love it!' : s.right ? `Nice, but I asked for: ${orderText(g.order).replace("I'd like ", '').replace(', please.', '')}` : `Oh no! I asked for ${orderText(g.order).replace("I'd like ", '').replace(', please.', '')}`;
      g.msgT = 2.6; g.happy = s.right === s.total ? 1.4 : 0; speak(g.msg, true, 0.95);
      if (g.n < CUSTOMERS) { g.order = makeOrder(rnd, per); g.worn = {}; setTimeout(say, 2600); }
      return;
    }
    if (y > 486 && y < 540 && x > 236 && x < 390) say();          // hear again
  };
  g.done = () => (g.n >= CUSTOMERS && g.endT > 1.2 ? { id: 'style', score: g.score, gold: Math.min(35, Math.floor(g.score / 10)), exp: Math.min(45, Math.floor(g.score / 7)), text: `Style Studio: ${g.score} points!` } : null);
  g.draw = (c, w, h, t) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#ffeef6'); bg.addColorStop(1, '#ffe0c8'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    // the order bubble
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(10, 8, 540, 74, 16); c.fill(); c.strokeStyle = '#d07aa8'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#7a2a5a'; c.font = '800 15px sans-serif'; c.textAlign = 'left'; c.fillText(g.n < CUSTOMERS ? `Customer ${g.n + 1}:` : 'All done!', 22, 32);
    c.font = '700 17px sans-serif'; c.fillStyle = '#3a1a2a'; wrap(c, g.n < CUSTOMERS ? orderText(g.order) : 'Thank you! The boutique is closed for today.', 22, 56, 516, 21);
    // the model
    drawModel(c, 115, 300, g.worn, t, g.happy > 0);
    // tabs
    CLOTHES.forEach((it, i) => { const x = 228 + i * 36, on = it === g.tab; c.fillStyle = on ? '#d07aa8' : '#fff'; c.beginPath(); c.roundRect(x, 94, 33, 32, 8); c.fill(); c.strokeStyle = '#d07aa8'; c.lineWidth = 2; c.stroke();
      c.save(); c.translate(x + 16.5, 110); c.scale(0.3, 0.3); piece(c, it, on ? '#fff' : '#b06090', 0, 0); c.restore(); });
    c.fillStyle = '#7a2a5a'; c.font = '800 16px sans-serif'; c.textAlign = 'center'; c.fillText(g.tab, 395, 144);
    // colour swatches of the chosen piece
    COLS.forEach((col, k) => { const x = 236 + (k % 3) * 108, y = 150 + Math.floor(k / 3) * 64, on = g.worn[g.tab] === col;
      c.fillStyle = on ? '#fff3a0' : 'rgba(255,255,255,.75)'; c.beginPath(); c.roundRect(x, y, 102, 58, 10); c.fill(); if (on) { c.strokeStyle = '#d07aa8'; c.lineWidth = 3; c.stroke(); }
      c.save(); c.translate(x + 28, y + 30); c.scale(0.42, 0.42); piece(c, g.tab, COLORS[col], 0, 0); c.restore();
      c.fillStyle = '#3a1a2a'; c.font = '700 13px sans-serif'; c.textAlign = 'left'; c.fillText(col, x + 54, y + 34); });
    // buttons
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(236, 488, 150, 50, 12); c.fill(); c.fillStyle = '#7a2a5a'; c.font = '800 16px sans-serif'; c.textAlign = 'center'; c.fillText('🔊 Listen again', 311, 519);
    c.fillStyle = '#d07aa8'; c.beginPath(); c.roundRect(400, 488, 150, 50, 12); c.fill(); c.fillStyle = '#fff'; c.font = '900 20px sans-serif'; c.fillText('DONE ✓', 475, 520);
    if (g.msgT > 0) { c.globalAlpha = Math.min(1, g.msgT); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.roundRect(20, 400, 200, 76, 12); c.fill(); c.fillStyle = '#7a2a5a'; c.font = '700 13px sans-serif'; c.textAlign = 'left'; wrap(c, g.msg, 30, 420, 184, 16); c.globalAlpha = 1; }
    c.textAlign = 'left';
  };
  return g;
}

function wrap(c, text, x, y, maxW, lh) {
  let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) c.fillText(line, x, y);
}
/** One clothes piece centred at (x, y), about 100 px wide, in a colour. */
function piece(c, item, col, x, y) {
  c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.beginPath();
  if (item === 'hat') { c.ellipse(0, 18, 50, 12, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.roundRect(-28, -26, 56, 46, 18); }
  else if (item === 'T-shirt') { c.moveTo(-30, -40); c.lineTo(-58, -20); c.lineTo(-44, 0); c.lineTo(-30, -10); c.lineTo(-30, 45); c.lineTo(30, 45); c.lineTo(30, -10); c.lineTo(44, 0); c.lineTo(58, -20); c.lineTo(30, -40); c.quadraticCurveTo(0, -24, -30, -40); }
  else if (item === 'skirt') { c.moveTo(-26, -34); c.lineTo(26, -34); c.lineTo(48, 38); c.lineTo(-48, 38); }
  else if (item === 'trousers') { c.moveTo(-28, -45); c.lineTo(28, -45); c.lineTo(32, 48); c.lineTo(6, 48); c.lineTo(0, -10); c.lineTo(-6, 48); c.lineTo(-32, 48); }
  else if (item === 'dress') { c.moveTo(-22, -50); c.lineTo(22, -50); c.lineTo(28, -12); c.lineTo(52, 50); c.lineTo(-52, 50); c.lineTo(-28, -12); }
  else if (item === 'shoes') { c.ellipse(-22, 8, 22, 12, 0, 0, 7); c.moveTo(42, 8); c.ellipse(22, 8, 22, 12, 0, 0, 7); }
  else if (item === 'bag') { c.roundRect(-34, -14, 68, 50, 10); c.fill(); c.stroke(); c.beginPath(); c.lineWidth = 7; c.strokeStyle = col; c.arc(0, -14, 22, Math.PI, 0); c.stroke(); c.restore(); return; }
  else if (item === 'glasses') { c.lineWidth = 9; c.strokeStyle = col; c.arc(-24, 0, 18, 0, 7); c.moveTo(42, 0); c.arc(24, 0, 18, 0, 7); c.moveTo(-6, 0); c.lineTo(6, 0); c.stroke(); c.restore(); return; }
  else if (item === 'scarf') { c.roundRect(-40, -12, 80, 22, 10); c.fill(); c.stroke(); c.beginPath(); c.roundRect(14, 4, 20, 50, 8); }
  c.fill(); c.stroke(); c.restore();
}
/** The paper model in the middle of the shop, wearing what the child chose. */
function drawModel(c, x, y, worn, t, happy) {
  const skin = '#f6d2b0', b = Math.sin(t * 2) * 2 + (happy ? Math.abs(Math.sin(t * 10)) * -8 : 0);
  c.save(); c.translate(x, y + b);
  c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0, 190, 70, 12, 0, 0, 7); c.fill();
  c.fillStyle = skin; for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(sx * 18 - 9, 60, 18, 120, 8); c.fill(); c.beginPath(); c.roundRect(sx * 50 - 8, -60, 16, 100, 8); c.fill(); }      // legs, arms
  c.beginPath(); c.roundRect(-38, -70, 76, 140, 26); c.fill();                                             // body
  c.fillStyle = '#5a3418'; c.beginPath(); c.arc(0, -118, 46, Math.PI, 0); c.fill(); c.fillRect(-46, -120, 18, 70); c.fillRect(28, -120, 18, 70);      // hair
  c.fillStyle = skin; c.beginPath(); c.arc(0, -110, 38, 0, 7); c.fill();                                   // face
  c.fillStyle = '#2a1a10'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 13, -112, 4.5, 0, 7); c.fill(); }
  c.strokeStyle = '#c0504a'; c.lineWidth = 3; c.beginPath(); c.arc(0, -100, happy ? 12 : 8, 0.2, Math.PI - 0.2); c.stroke();
  const at = { hat: [0, -150, 0.9], 'T-shirt': [0, -22, 1.05], skirt: [0, 60, 1.0], trousers: [0, 90, 1.05], dress: [0, 15, 1.35], shoes: [0, 185, 0.9], bag: [62, 40, 0.6], glasses: [0, -112, 0.75], scarf: [0, -66, 0.85] };
  for (const item of ['trousers', 'skirt', 'dress', 'T-shirt', 'shoes', 'scarf', 'bag', 'glasses', 'hat']) if (worn[item]) { const [px, py, s] = at[item]; c.save(); c.translate(px, py); c.scale(s, s); piece(c, item, COLORS[worn[item]], 0, 0); c.restore(); }
  c.restore();
}
