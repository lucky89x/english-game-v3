// "Read it aloud, and only a good reading earns the reward" (24/11). The child presses the microphone and says the English word;
// the browser's speech recognition (Web Speech API, English) hears it and we compare what it heard with the word.
// Pure comparison code (`heardOk`) is tested in node. The card is a small modal over the game.
//
// Honest limits: recognition needs a microphone permission and, in Chrome/Edge, the internet (the browser sends the sound to its
// speech service). The Electron app (.exe) has the API but no speech service key, so it answers "network": then `available()` says
// false after the first try and the game falls back to the old behaviour (the reward comes after listening to the word), and
// tells the parent. Nothing is recorded or stored.

/** Letters only, lower case, accents out ("Hello!" → "hello"). */
export const clean = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
/** Edit distance between two short strings. */
export function distance(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
/** 0..1: how close what was heard is to the target (1 = the same). */
export function similarity(heard, target) { const a = clean(heard), b = clean(target); if (!a || !b) return 0; return 1 - distance(a, b) / Math.max(a.length, b.length); }
/** Did any of the alternatives the recogniser offered match the target well enough? Longer phrases are allowed a little more slack. */
export function heardOk(alternatives, target, min = 0) {
  const t = clean(target);
  if (t.includes(' ')) {      // a phrase: every word of it must be heard (a near miss on one word is allowed only when the word is long)
    let best = 0; for (const a of alternatives || []) { const heard = clean(a).split(' '), per = t.split(' ').map((w) => Math.max(0, ...heard.map((h) => { const s = similarity(h, w); return w.length <= 3 ? (s === 1 ? 1 : 0) : s >= 0.8 ? s : 0; }))); const all = per.every((x) => x > 0); if (all) best = Math.max(best, per.reduce((x, y) => x + y, 0) / per.length); }
    return { ok: best > 0, score: best };
  }
  const need = min || (t.length <= 3 ? 1 : t.length <= 5 ? 0.8 : 0.72);
  let best = 0; for (const a of alternatives || []) { const s = similarity(a, target); if (s > best) best = s; if (clean(a).split(' ').includes(t) && t.indexOf(' ') < 0) best = Math.max(best, 1); }
  return { ok: best >= need, score: best };
}

const Rec = () => (typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null);
let broken = false;      // set when the service answers "network"/"service-not-allowed": the rest of the session skips the check
/** Can this machine check a reading? (false after the speech service failed once.) */
export const available = () => !!Rec() && !broken;
/** Tests and machines without a microphone: turn the check off (true) or on again (false). */
export const disable = (off = true) => { broken = off; };

/** Listens once. Resolves { ok, score, heard, error } — error: 'denied' | 'none' (heard nothing) | 'unavailable' | 'busy'. */
export function listen(target, { seconds = 6 } = {}) {
  return new Promise((done) => {
    const R = Rec(); if (!R || broken) return done({ ok: false, score: 0, heard: '', error: 'unavailable' });
    const r = new R(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 6; r.continuous = false;
    let finished = false; const end = (o) => { if (finished) return; finished = true; try { r.stop(); } catch { /* idle */ } clearTimeout(tm); done(o); };
    const tm = setTimeout(() => end({ ok: false, score: 0, heard: '', error: 'none' }), seconds * 1000 + 800);
    r.onresult = (e) => { const alts = []; for (const res of e.results) for (let i = 0; i < res.length; i++) alts.push(res[i].transcript); const v = heardOk(alts, target); end({ ...v, heard: alts[0] || '', error: '' }); };
    r.onerror = (e) => { const c = e.error; if (c === 'not-allowed' || c === 'audio-capture') end({ ok: false, score: 0, heard: '', error: 'denied' }); else if (c === 'network' || c === 'service-not-allowed' || c === 'language-not-supported') { broken = true; end({ ok: false, score: 0, heard: '', error: 'unavailable' }); } else if (c === 'no-speech' || c === 'aborted') end({ ok: false, score: 0, heard: '', error: 'none' }); else end({ ok: false, score: 0, heard: '', error: 'none' }); };
    r.onend = () => end({ ok: false, score: 0, heard: '', error: 'none' });
    try { r.start(); } catch { end({ ok: false, score: 0, heard: '', error: 'busy' }); }
  });
}

const CSS = `#readcard { position:fixed; inset:0; z-index:60; display:flex; align-items:center; justify-content:center; background:rgba(40,24,8,.55); font-family:system-ui,sans-serif; }
#readcard.hidden { display:none; } #readcard .box { width:min(420px, calc(100vw - 24px)); background:linear-gradient(#fffaf0,#ffeccc); border:6px solid #c8782a; border-radius:20px; padding:16px 18px; text-align:center; color:#3a2410; box-shadow:0 10px 30px rgba(0,0,0,.4); }
#readcard h2 { margin:0 0 4px; font-size:19px; color:#a0541a; } #readcard .w { font:900 40px system-ui; color:#2a5a9a; margin:6px 0 2px; } #readcard .vi { font-size:17px; color:#7a3e00; margin-bottom:8px; }
#readcard .st { min-height:44px; font-size:15px; margin:6px 0; } #readcard .st.ok { color:#2a8a3a; font-weight:800; } #readcard .st.bad { color:#c8352e; font-weight:700; }
#readcard .row { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:6px; }
#readcard button { font:800 16px system-ui; border:3px solid #c8782a; border-radius:12px; background:#fff3d8; padding:8px 14px; cursor:pointer; color:#3a2410; } #readcard button.mic { background:#e8443a; color:#fff; border-color:#a02820; } #readcard button.mic.on { animation:pulse .7s infinite; } #readcard button:disabled { opacity:.5; }
@keyframes pulse { 50% { transform:scale(1.08); box-shadow:0 0 0 8px rgba(232,68,58,.25); } }`;

/** The reading card. api: { speak(word) }. read(card, { tries }) resolves { ok, skipped }: ok when the child read it well (or when the
 *  machine cannot check readings, skipped:true, so the old reward flow still works). */
export class ReadAloud {
  constructor(api) {
    this.api = api; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'readcard'; this.el.className = 'hidden'; document.body.appendChild(this.el);
  }
  get open() { return !this.el.classList.contains('hidden'); }
  read(card, { tries = 3, title = 'Đọc to từ này nhé!' } = {}) {
    if (!available()) return Promise.resolve({ ok: true, skipped: true });
    return new Promise((done) => {
      let left = tries, busy = false;
      const close = (o) => { this.el.classList.add('hidden'); done(o); };
      const draw = (msg = '', cls = '') => {
        this.el.innerHTML = `<div class="box"><h2>🎤 ${title}</h2><div class="w">${card.word}</div><div class="vi">${card.vi || ''}</div><div class="st ${cls}">${msg || `Bấm 🎤 rồi đọc to từ trên. Còn ${left} lần thử.`}</div>
          <div class="row"><button data-a="hear">🔊 Nghe</button><button class="mic ${busy ? 'on' : ''}" data-a="mic" ${busy || left <= 0 ? 'disabled' : ''}>🎤 ${busy ? 'Đang nghe…' : 'Đọc'}</button>${left <= 0 ? '<button data-a="out">Đóng</button>' : ''}</div></div>`;
      };
      this.el.onclick = async (e) => {
        const b = e.target.closest('button'); if (!b || busy) return; const a = b.dataset.a;
        if (a === 'hear') { this.api.speak(card.word); return; }
        if (a === 'out') return close({ ok: false });
        if (a === 'mic') {
          busy = true; draw('Đang nghe… đọc to nào!'); const r = await listen(card.word); busy = false;
          if (r.error === 'unavailable') { draw('Máy này chưa kiểm tra được giọng đọc (cần Internet và micro). Con nghe lại từ rồi bấm Xong nhé.', 'bad'); this.el.querySelector('.row').insertAdjacentHTML('beforeend', '<button data-a="skip">Xong</button>'); return; }
          if (r.error === 'denied') { draw('Máy chưa có micro hoặc chưa cho dùng micro. Con nghe lại từ rồi bấm Bỏ qua nhé. (Bố mẹ: bấm biểu tượng khóa trên thanh địa chỉ để cho phép.)', 'bad'); this.el.querySelector('.row').insertAdjacentHTML('beforeend', '<button data-a="skip">Bỏ qua</button>'); return; }      // (26/11) this card had no way out without a microphone
          if (r.ok) { draw(`✔ Chuẩn rồi! (nghe thấy: "${r.heard}")`, 'ok'); setTimeout(() => close({ ok: true }), 900); return; }
          left -= 1; draw(r.error === 'none' ? 'Chưa nghe thấy gì. Đọc to hơn một chút nhé!' : `Nghe thấy: "${r.heard}". Chưa giống lắm, thử lại nhé!`, 'bad');
        }
        if (a === 'skip') return close({ ok: true, skipped: true });
      };
      this.el.classList.remove('hidden'); draw(); this.api.speak(card.word);
    });
  }
}
