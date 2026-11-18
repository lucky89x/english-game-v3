// Beauty Salon (Map 2, 18/11: "mini games like the girls' games, with English"). An original makeover game: each
// customer asks in English for a hair style and colour, and (from the first tier) lipstick, eyeshadow and nail colours
// ("I'd like curly pink hair and red lipstick, please."). The child picks the tab (style, hair, lips, eyes, nails), then
// the style or colour, and the customer changes at once; DONE checks the look. Hair words, parts of the face and colours
// are the words practised. Higher tiers ask for more. Same board interface as the other arcade games.
import { speak } from './speech.js';
import { COLORS } from './style.js';

export const STYLES = ['short', 'long', 'curly', 'wavy', 'ponytail', 'braids'];
export const TABS = [{ id: 'style', label: 'Style', name: 'hair style' }, { id: 'hair', label: 'Hair', name: 'hair colour' }, { id: 'lips', label: 'Lips', name: 'lipstick' }, { id: 'eyes', label: 'Eyes', name: 'eyeshadow' }, { id: 'nails', label: 'Nails', name: 'nail polish' }];
export const DEFAULT_LOOK = { style: 'short', hair: 'brown', lips: null, eyes: null, nails: null };
const an = (w) => (/^[aeiou]/.test(w) ? 'an' : 'a');
const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]);
export const hairText = (style, col) => ({ short: `short ${col} hair`, long: `long ${col} hair`, curly: `curly ${col} hair`, wavy: `wavy ${col} hair`, ponytail: `${an(col)} ${col} ponytail`, braids: `${col} braids` })[style];

/** An order: a hair style and colour, plus one (tier 1), two or all three of lips, eyes and nails. Never the look the customer already has. */
export function makeOrder(rnd, tier = 1) {
  const cols = Object.keys(COLORS), pick = (a) => a[Math.floor(rnd() * a.length)], o = { k: Math.floor(rnd() * 3) };
  do { o.style = pick(STYLES); o.hair = pick(cols); } while (o.style === DEFAULT_LOOK.style && o.hair === DEFAULT_LOOK.hair);
  const extras = ['lips', 'eyes', 'nails']; for (let i = extras.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [extras[i], extras[j]] = [extras[j], extras[i]]; }
  for (const e of extras.slice(0, Math.min(3, Math.max(1, tier)))) o[e] = pick(cols);
  return o;
}
const body = (o) => list([hairText(o.style, o.hair), ...(o.lips ? [`${o.lips} lipstick`] : []), ...(o.eyes ? [`${o.eyes} eyeshadow`] : []), ...(o.nails ? [`${o.nails} nails`] : [])]);
export const orderText = (o) => [`I'd like ${body(o)}, please.`, `Could you give me ${body(o)}, please?`, `I want ${body(o)}, please.`][o.k % 3];
/** Points for a look: 20 for each asked part done right (style, hair colour, lips, eyes, nails), minus 5 for each of lips, eyes, nails done when nobody asked. */
export function scoreLook(o, look) {
  const asked = ['style', 'hair', 'lips', 'eyes', 'nails'].filter((k) => o[k]), right = asked.filter((k) => look[k] === o[k]).length;
  const extra = ['lips', 'eyes', 'nails'].filter((k) => look[k] && !o[k]).length;
  return { right, total: asked.length, extra, points: Math.max(0, right * 20 - extra * 5) };
}

export function salonGame(rnd = Math.random, tier = 1) {
  const CUSTOMERS = 5, COLS = Object.keys(COLORS);
  const g = { title: '💇 Beauty Salon', help: 'Đọc yêu cầu tiếng Anh của khách. Chọn kiểu tóc, màu tóc, son môi, phấn mắt, sơn móng ở hàng trên, rồi chọn kiểu hoặc màu. Xong bấm DONE.',
    score: 0, n: 0, tab: 'style', look: { ...DEFAULT_LOOK }, order: makeOrder(rnd, tier), msg: '', msgT: 0, endT: 0, happy: 0, pops: [] };
  g.info = () => `Khách ${Math.min(g.n + 1, CUSTOMERS)}/${CUSTOMERS} · Điểm ${g.score}`;
  const say = () => speak(orderText(g.order), true, 0.9);
  setTimeout(say, 300);
  g.update = (dt) => { g.msgT = Math.max(0, g.msgT - dt); g.happy = Math.max(0, g.happy - dt); for (const p of g.pops) p.t -= dt; g.pops = g.pops.filter((p) => p.t > 0); if (g.n >= CUSTOMERS) g.endT += dt; };
  g.click = (x, y) => {
    if (g.n >= CUSTOMERS) return;
    if (y > 92 && y < 130 && x > 232) { const i = Math.floor((x - 236) / 63); if (TABS[i] && (x - 236) % 63 < 60) { g.tab = TABS[i].id; speak(TABS[i].name, true, 0.9); } return; }      // tabs
    if (y >= 156 && y < 366 && x > 236 && g.tab === 'style') {
      const c = Math.floor((x - 236) / 108), r = Math.floor((y - 156) / 106), k = r * 3 + c;
      if (c < 3 && (y - 156) % 106 < 98 && STYLES[k]) { g.look.style = STYLES[k]; speak(STYLES[k] === 'ponytail' || STYLES[k] === 'braids' ? STYLES[k] : `${STYLES[k]} hair`, true, 0.9); }
      return;
    }
    if (y >= 156 && y < 410 && x > 236) {
      const c = Math.floor((x - 236) / 108), r = Math.floor((y - 156) / 62), k = r * 3 + c, col = COLS[k];
      if (c < 3 && (y - 156) % 62 < 56 && col) { const t = g.tab; if (t !== 'hair' && g.look[t] === col) g.look[t] = null; else { g.look[t] = col; speak(col, true, 0.9); } }
      return;
    }
    if (y > 486 && y < 540 && x > 400) {          // DONE
      const s = scoreLook(g.order, g.look), asked = body(g.order); g.score += s.points; g.n += 1;
      const perfect = s.right === s.total && !s.extra;
      g.msg = perfect ? 'Wow! I look beautiful!' : `Hmm, I asked for ${asked}.`; g.msgT = 2.8; g.happy = perfect ? 1.8 : 0; speak(g.msg, true, 0.95); g.pops.push({ x: 115, y: 120, t: 1.4, text: '+' + s.points });
      if (g.n < CUSTOMERS) { g.order = makeOrder(rnd, tier); g.look = { ...DEFAULT_LOOK }; g.tab = 'style'; setTimeout(say, 2800); }
      return;
    }
    if (y > 486 && y < 540 && x > 236 && x < 390) say();      // hear again
  };
  g.done = () => (g.n >= CUSTOMERS && g.endT > 1.2 ? { id: 'salon', score: g.score, gold: Math.min(35, Math.floor(g.score / 12)), exp: Math.min(45, Math.floor(g.score / 9)), text: `Beauty Salon: ${g.score} points!` } : null);
  g.draw = (c, w, h, t) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f6eaff'); bg.addColorStop(1, '#ffe4ee'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(10, 8, 540, 74, 16); c.fill(); c.strokeStyle = '#a860c8'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#5a2a7a'; c.font = '800 15px sans-serif'; c.textAlign = 'left'; c.fillText(g.n < CUSTOMERS ? `Customer ${g.n + 1}:` : 'All done!', 22, 32);
    const say_ = g.n < CUSTOMERS ? orderText(g.order) : 'Thank you! The salon is closed for today.', long_ = say_.length > 62;
    c.font = long_ ? '700 16px sans-serif' : '700 17px sans-serif'; c.fillStyle = '#2a1a3a'; wrap(c, say_, 22, long_ ? 52 : 56, 516, long_ ? 20 : 21);
    girl(c, 115, 205, g.look, t, g.happy > 0);
    // tabs and what they choose
    TABS.forEach((tb, i) => { const x = 236 + i * 63, on = tb.id === g.tab; c.fillStyle = on ? '#a860c8' : '#fff'; c.beginPath(); c.roundRect(x, 94, 60, 34, 9); c.fill(); c.strokeStyle = '#a860c8'; c.lineWidth = 2; c.stroke();
      c.fillStyle = on ? '#fff' : '#5a2a7a'; c.font = '800 13px sans-serif'; c.textAlign = 'center'; c.fillText(tb.label, x + 30, 116); });
    c.fillStyle = '#5a2a7a'; c.font = '800 16px sans-serif'; c.textAlign = 'center'; c.fillText(TABS.find((x) => x.id === g.tab).name, 393, 148);
    if (g.tab === 'style') STYLES.forEach((st, k) => { const x = 236 + (k % 3) * 108, y = 156 + Math.floor(k / 3) * 106, on = g.look.style === st;
      c.fillStyle = on ? '#fff3a0' : 'rgba(255,255,255,.8)'; c.beginPath(); c.roundRect(x, y, 102, 98, 12); c.fill(); if (on) { c.strokeStyle = '#a860c8'; c.lineWidth = 3; c.stroke(); }
      c.save(); c.translate(x + 51, y + 29); c.scale(0.33, 0.33); head(c, 0, 0, { ...g.look, style: st, lips: null, eyes: null }, 0, false, true); c.restore();
      c.fillStyle = '#2a1a3a'; c.font = '700 14px sans-serif'; c.textAlign = 'center'; c.fillText(st, x + 51, y + 93); });
    else COLS.forEach((col, k) => { const x = 236 + (k % 3) * 108, y = 156 + Math.floor(k / 3) * 62, on = g.look[g.tab] === col;
      c.fillStyle = on ? '#fff3a0' : 'rgba(255,255,255,.8)'; c.beginPath(); c.roundRect(x, y, 102, 56, 10); c.fill(); if (on) { c.strokeStyle = '#a860c8'; c.lineWidth = 3; c.stroke(); }
      swatch(c, g.tab, COLORS[col], x + 28, y + 28); c.fillStyle = '#2a1a3a'; c.font = '700 13px sans-serif'; c.textAlign = 'left'; c.fillText(col, x + 54, y + 33); });
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(236, 488, 150, 50, 12); c.fill(); c.fillStyle = '#5a2a7a'; c.font = '800 16px sans-serif'; c.textAlign = 'center'; c.fillText('🔊 Listen again', 311, 519);
    c.fillStyle = '#a860c8'; c.beginPath(); c.roundRect(400, 488, 150, 50, 12); c.fill(); c.fillStyle = '#fff'; c.font = '900 20px sans-serif'; c.fillText('DONE ✓', 475, 520);
    for (const p of g.pops) { c.globalAlpha = Math.min(1, p.t); c.fillStyle = '#a860c8'; c.font = '900 26px sans-serif'; c.fillText(p.text, p.x, p.y - (1.4 - p.t) * 40); c.globalAlpha = 1; }
    if (g.msgT > 0) { c.globalAlpha = Math.min(1, g.msgT); c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.roundRect(14, 330, 200, 64, 12); c.fill(); c.fillStyle = '#2a1a3a'; c.font = '700 13px sans-serif'; c.textAlign = 'left'; wrap(c, g.msg, 22, 350, 184, 16); c.globalAlpha = 1; }
    c.textAlign = 'left';
  };
  return g;
}

function wrap(c, text, x, y, maxW, lh) {
  let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) c.fillText(line, x, y);
}
const SKIN = '#f6d2b0';
/** A small picture of what a colour tile paints: a bead of hair, lips, eyeshadow, a nail. */
function swatch(c, tab, col, x, y) {
  c.save(); c.translate(x, y); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; c.fillStyle = col;
  if (tab === 'lips') { c.beginPath(); c.moveTo(-17, 2); c.quadraticCurveTo(-8, -12, 0, -4); c.quadraticCurveTo(8, -12, 17, 2); c.quadraticCurveTo(0, 16, -17, 2); c.fill(); c.stroke(); }
  else if (tab === 'eyes') { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 4, 15, 9, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = col; c.beginPath(); c.ellipse(0, -4, 16, 8, 0, Math.PI, 0); c.fill(); c.fillStyle = '#3a2a20'; c.beginPath(); c.arc(0, 5, 5, 0, 7); c.fill(); }
  else if (tab === 'nails') { c.fillStyle = SKIN; c.beginPath(); c.roundRect(-10, -4, 20, 22, 6); c.fill(); c.stroke(); c.fillStyle = col; c.beginPath(); c.roundRect(-8, -14, 16, 20, 6); c.fill(); c.stroke(); }
  else { c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-6, -7, 6, 3, -0.6, 0, 7); c.fill(); }
  c.restore();
}
/** The customer: the head with its hair (also used small on the style tiles), shoulders, and two hands showing the nails. */
function girl(c, x, y, look, t, happy) {
  const b = Math.sin(t * 2) * 1.5 + (happy ? Math.abs(Math.sin(t * 9)) * -6 : 0);
  c.save(); c.translate(0, b);
  if (look.style === 'long' || look.style === 'wavy' || look.style === 'curly') { /* hair falls behind the shoulders (drawn inside head) */ }
  head(c, x, y, look, t, happy);
  c.restore();
  hands(c, 115, 440, look.nails);
}
function hands(c, x, y, col) {
  for (const sx of [-1, 1]) {
    c.save(); c.translate(x + sx * 52, y); c.rotate(sx * 0.12); c.fillStyle = SKIN; c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2;
    c.beginPath(); c.roundRect(-24, -6, 48, 46, 16); c.fill(); c.stroke();
    for (let k = 0; k < 4; k++) { const fx = -19 + k * 12.6, fh = 30 + (k === 1 || k === 2 ? 6 : 0); c.fillStyle = SKIN; c.beginPath(); c.roundRect(fx - 5, -fh, 10, fh + 6, 5); c.fill(); c.stroke(); c.fillStyle = col ? COLORS[col] : '#f8d8c8'; c.beginPath(); c.roundRect(fx - 4, -fh + 1, 8, 11, 4); c.fill(); if (col) { c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(fx - 2, -fh + 3, 2, 5); } }
    c.fillStyle = SKIN; c.beginPath(); c.roundRect(sx > 0 ? -34 : 20, 8, 14, 22, 7); c.fill(); c.stroke(); c.fillStyle = col ? COLORS[col] : '#f8d8c8'; c.beginPath(); c.roundRect(sx > 0 ? -33 : 21, 6, 12, 9, 4); c.fill();
    c.restore();
  }
}
/** Head centred on (x, y): hair behind, face, features, hair in front. Scale it with the canvas for the small tiles. */
function head(c, x, y, look, t, happy, mini = false) {
  const hair = COLORS[look.hair] || '#6a3f1f', shade = 'rgba(0,0,0,.18)';
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  const fill = (col) => { c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2.5; c.stroke(); };
  // shoulders and neck (behind the hair, so long hair falls over them)
  if (!mini) { c.beginPath(); c.roundRect(-64, 78, 128, 140, 40); fill('#8fd0e8'); c.beginPath(); c.roundRect(-14, 44, 28, 44, 8); fill(SKIN); }
  // hair behind the head
  c.beginPath();
  if (look.style === 'short') { c.roundRect(-64, -66, 128, 124, 46); fill(hair); }
  else if (look.style === 'long') { c.roundRect(-66, -68, 132, 232, 52); fill(hair); }
  else if (look.style === 'wavy') {
    c.moveTo(-60, -30); for (let k = 0; k < 6; k++) c.quadraticCurveTo(-60 + (k % 2 ? 12 : -12), -30 + k * 28 + 14, -60, -30 + (k + 1) * 28);
    c.quadraticCurveTo(0, 170, 60, 138); for (let k = 5; k >= 0; k--) c.quadraticCurveTo(60 + (k % 2 ? -12 : 12), -30 + k * 28 + 14, 60, -30 + k * 28); c.closePath(); fill(hair);
    c.beginPath(); c.ellipse(0, -10, 60, 64, 0, 0, 7); fill(hair);
  }
  else if (look.style === 'curly') { c.fillStyle = hair; const pts = []; for (let k = 0; k < 8; k++) pts.push([-58 + (k % 2) * 8, -30 + k * 22]), pts.push([58 - (k % 2) * 8, -30 + k * 22]); for (let k = 0; k < 9; k++) pts.push([-56 + k * 14, -58 - Math.sin(k / 8 * Math.PI) * 10]); for (const [px, py] of pts) { c.beginPath(); c.arc(px, py, 21, 0, 7); fill(hair); } c.beginPath(); c.ellipse(0, -8, 56, 62, 0, 0, 7); fill(hair); }
  else if (look.style === 'ponytail') { c.ellipse(0, -8, 58, 64, 0, 0, 7); fill(hair); c.beginPath(); c.ellipse(70, 38, 17, 52, 0.4, 0, 7); fill(hair); c.beginPath(); c.arc(54, -12, 9, 0, 7); fill('#ff5a8a'); }
  else if (look.style === 'braids') { c.ellipse(0, -8, 58, 64, 0, 0, 7); fill(hair); for (const sx of [-1, 1]) { for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(sx * (58 + (k % 2) * 3), 20 + k * 17, 12, 10, 0, 0, 7); fill(hair); } c.beginPath(); c.arc(sx * 59, 140, 8, 0, 7); fill('#ff5a8a'); } }
  // the face
  c.beginPath(); c.ellipse(0, 0, 50, 58, 0, 0, 7); fill(SKIN);
  for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 50, 4, 7, 11, 0, 0, 7); fill(SKIN); }
  c.fillStyle = 'rgba(255,120,140,.35)'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 30, 26, 11, 7, 0, 0, 7); c.fill(); }
  // eyes (with eyeshadow), brows, nose
  for (const sx of [-1, 1]) {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(sx * 19, 4, 11, 9, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = look.eyes ? COLORS[look.eyes] : 'rgba(210,150,130,.35)'; c.globalAlpha = look.eyes ? 0.9 : 1; c.beginPath(); c.ellipse(sx * 19, -3, 14, 8, 0, Math.PI, 0); c.fill(); c.globalAlpha = 1;
    c.fillStyle = '#4a2a1a'; c.beginPath(); c.arc(sx * 19, 5, 5.5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * 19 + 2, 3, 1.8, 0, 7); c.fill();
    c.strokeStyle = '#4a2a1a'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx * 9, -14); c.quadraticCurveTo(sx * 20, -20, sx * 31, -13); c.stroke();
  }
  c.strokeStyle = 'rgba(160,100,80,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 12); c.quadraticCurveTo(-4, 22, 2, 24); c.stroke();
  // lips
  const lip = look.lips ? COLORS[look.lips] : '#e0948c'; c.fillStyle = lip; c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.8; c.beginPath();
  if (happy) { c.moveTo(-17, 36); c.quadraticCurveTo(0, 56, 17, 36); c.quadraticCurveTo(0, 40, -17, 36); } else { c.moveTo(-15, 38); c.quadraticCurveTo(-7, 30, 0, 35); c.quadraticCurveTo(7, 30, 15, 38); c.quadraticCurveTo(0, 50, -15, 38); }
  c.fill(); c.stroke();
  // hair in front: the fringe
  c.beginPath(); c.moveTo(-54, -2); c.bezierCurveTo(-62, -78, 62, -78, 54, -2); c.quadraticCurveTo(46, -30, 20, -36); c.quadraticCurveTo(-4, -22, -30, -34); c.quadraticCurveTo(-48, -26, -54, -2); fill(hair);
  if (look.style === 'curly') for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-40 + k * 16, -44 - Math.sin(k / 5 * Math.PI) * 10, 13, 0, 7); fill(hair); }
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4; c.beginPath(); c.arc(0, -8, 46, Math.PI * 1.15, Math.PI * 1.5); c.stroke();
  c.restore();
}
