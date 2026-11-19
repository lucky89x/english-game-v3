// Fishing at the pier (19/11, "câu cá + album biển"): five casts. Click to cast, wait for BITE!, then click when the
// sliding marker is inside the green zone. Rarer fish have a smaller zone. Every catch shows its English name with the
// Vietnamese meaning and is read aloud; the fish go in the bucket (sold at the fish market) and into the Sea Dex.
import { speak } from './speech.js';
import { rollFish, RARITY, RARITY_VI } from '../core/sea.js';

const EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
const COL = ['#5a6a78', '#2f8a3c', '#2f6fd0', '#c8782a'];
export function fishGame(rnd = Math.random, tier = 1) {
  const CASTS = 5, base = [0, 150, 125, 105][tier] || 150, speed = 0.8 + 0.18 * tier;
  const g = { title: '🎣 Fishing', help: 'Bấm chuột (hoặc Space) để thả câu. Khi thấy "BITE!", bấm đúng lúc thanh trượt nằm trong vùng xanh để kéo cá lên. Cá hiếm có vùng xanh nhỏ hơn.',
    n: 0, phase: 'ready', t: 0, wait: 1.5, caught: [], score: 0, item: null, zone: [0, 0], marker: 0, msg: '', endT: 0, ok: false };
  g.info = () => `Lần ${Math.min(g.n + 1, CASTS)}/${CASTS} · ${g.caught.filter((x) => !x.junk).length} con cá · ${g.score} điểm`;
  const next = () => { g.phase = g.n >= CASTS ? 'end' : 'ready'; g.t = 0; };
  const miss = (msg) => { g.n += 1; g.item = null; g.ok = false; g.msg = msg; g.phase = 'result'; g.t = 0; };
  const act = () => {
    if (g.phase === 'ready') { g.phase = 'wait'; g.t = 0; g.wait = 1 + rnd() * 1.8; return; }
    if (g.phase === 'wait') { miss('Too early! The fish swam away.'); return; }
    if (g.phase === 'bite') {
      if (g.marker >= g.zone[0] && g.marker <= g.zone[1]) { g.n += 1; g.ok = true; g.caught.push(g.item); g.score += g.item.price; g.msg = g.item.junk ? 'Oh! Just rubbish.' : 'You caught it!'; g.phase = 'result'; g.t = 0; speak(g.item.en, true, 0.85); }
      else miss('It got away!');
      return;
    }
    if (g.phase === 'result' && g.t > 0.7) next();
  };
  g.click = () => act(); g.key = (code) => { if (code === 'Space' || code === 'KeyE') act(); };
  g.update = (dt) => {
    g.t += dt;
    if (g.phase === 'wait' && g.t > g.wait) {
      g.item = rollFish(rnd, tier); const w = Math.max(40, base - 24 * (g.item.r || 0)), s = 100 + rnd() * (360 - w); g.zone = [s, s + w]; g.phase = 'bite'; g.t = 0;
    } else if (g.phase === 'bite') { const k = (g.t * speed) % 2; g.marker = (k < 1 ? k : 2 - k) * 360; if (g.t > 4.5) miss('Too slow! It got away.'); }
    else if (g.phase === 'result' && g.t > 2.6) next();
    else if (g.phase === 'end') g.endT += dt;
  };
  g.done = () => (g.phase === 'end' && g.endT > 1.4 ? { id: 'fish', score: g.score, gold: Math.min(25, Math.floor(g.score / 3)), exp: Math.min(40, g.caught.length * 7), fish: g.caught.map((c) => c.id), text: `Fishing: ${g.caught.length} catches!` } : null);
  g.draw = (c, w, h, t) => {
    const sky = c.createLinearGradient(0, 0, 0, 240); sky.addColorStop(0, '#9fdcff'); sky.addColorStop(1, '#e6f7ff'); c.fillStyle = sky; c.fillRect(0, 0, w, 240);
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(470, 70, 34, 0, 7); c.fill();
    const sea = c.createLinearGradient(0, 240, 0, h); sea.addColorStop(0, '#4fc6dd'); sea.addColorStop(1, '#0f7fb0'); c.fillStyle = sea; c.fillRect(0, 240, w, h - 240);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; for (let k = 0; k < 7; k++) { c.beginPath(); for (let x = 0; x <= w; x += 20) c.lineTo(x, 270 + k * 34 + Math.sin(t * 1.6 + x * 0.03 + k) * 4); c.stroke(); }
    c.fillStyle = '#b98a52'; c.fillRect(0, 500, w, 60); c.fillStyle = '#8a6030'; for (let x = 0; x < w; x += 58) c.fillRect(x, 500, 4, 60);      // the pier
    const bx = 330, by = 330 + Math.sin(t * 2) * 3 + (g.phase === 'bite' ? 18 + Math.sin(t * 24) * 5 : 0);
    c.strokeStyle = '#3a2410'; c.lineWidth = 5; c.beginPath(); c.moveTo(70, 520); c.lineTo(210, 300); c.stroke();      // the rod and the line
    c.strokeStyle = 'rgba(40,40,40,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(210, 300); c.quadraticCurveTo(280, 330, bx, by); c.stroke();
    if (g.phase !== 'ready' && g.phase !== 'end') { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (const r of [10, 18, 27]) { c.beginPath(); c.ellipse(bx, 352, r + ((t * 20) % 8), (r + ((t * 20) % 8)) * 0.35, 0, 0, 7); c.stroke(); }
      c.fillStyle = '#e8443a'; c.beginPath(); c.arc(bx, by, 9, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by - 4, 5, 0, 7); c.fill(); }
    c.textAlign = 'center'; c.fillStyle = '#10303f'; c.font = '800 20px sans-serif';
    if (g.phase === 'ready') c.fillText(g.n === 0 ? 'Click to cast your line!' : 'Click to cast again!', 280, 60);
    if (g.phase === 'wait') c.fillText('Wait for a bite…', 280, 60);
    if (g.phase === 'bite') {
      c.fillStyle = '#e8443a'; c.font = '900 40px sans-serif'; c.fillText('BITE!', 280, 66 + Math.sin(t * 18) * 3);
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.roundRect(90, 436, 380, 34, 17); c.fill(); c.fillStyle = '#4fd070'; c.beginPath(); c.roundRect(100 + g.zone[0], 440, g.zone[1] - g.zone[0], 26, 13); c.fill();
      c.fillStyle = '#10303f'; c.beginPath(); c.moveTo(100 + g.marker, 436); c.lineTo(94 + g.marker, 420); c.lineTo(106 + g.marker, 420); c.fill(); c.fillRect(98 + g.marker, 436, 4, 34);
      c.font = '700 15px sans-serif'; c.fillText('Click now when the line is in the green!', 280, 488);
    }
    if (g.phase === 'result') {
      c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.roundRect(130, 110, 300, 250, 18); c.fill(); c.strokeStyle = g.ok && g.item ? COL[g.item.r || 0] : '#8a98a4'; c.lineWidth = 5; c.stroke();
      c.fillStyle = '#10303f'; c.font = '800 20px sans-serif'; c.fillText(g.msg, 280, 146);
      if (g.item && g.ok) { c.font = `88px ${EMOJI}`; c.fillText(g.item.icon, 280, 245); c.font = '900 30px sans-serif'; c.fillStyle = '#10303f'; c.fillText(g.item.en, 280, 292); c.font = '700 17px sans-serif'; c.fillText(g.item.vi, 280, 318);
        c.fillStyle = g.item.junk ? '#8a98a4' : COL[g.item.r || 0]; c.font = '800 15px sans-serif'; c.fillText(g.item.junk ? 'rubbish · rác' : `${RARITY[g.item.r]} · ${RARITY_VI[g.item.r]}`, 280, 344); }
      else { c.font = `70px ${EMOJI}`; c.fillText('💦', 280, 235); }
    }
    if (g.phase === 'end') { c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.roundRect(110, 140, 340, 200, 18); c.fill(); c.fillStyle = '#10303f'; c.font = '900 28px sans-serif'; c.fillText('Nice fishing!', 280, 190);
      c.font = '700 18px sans-serif'; c.fillText(`${g.caught.filter((x) => !x.junk).length} fish · ${g.score} points`, 280, 228); c.font = '600 15px sans-serif'; c.fillText(g.caught.map((x) => x.en).join(', ') || 'No catches today', 280, 262, 300); }
    c.textAlign = 'left';
  };
  return g;
}
