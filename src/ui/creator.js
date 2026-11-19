// Character creator (19/11: "khi tạo nhân vật cho chọn được khuôn mặt, kiểu tóc, quần áo"). A card on the left; the hero
// stands on the right, seen from the front, and changes at once. Every name is English (read aloud on a click) with the
// Vietnamese beside it. mode 'new': the whole look, the picked clothes become free starter pieces in the wardrobe.
// mode 'mirror' (the mirror at home): face and skin only, free, any time.
import { FACES, FACE_NAMES, SKINS, SKIN_NAMES, lookOf } from '../game/faces.js';
import { COLORS } from './style.js';
import { HAIR_STYLES } from '../game/tint.js';
import { wardrobe, starterLook, parse, COLOR_NAMES } from '../core/wardrobe.js';
import { speak } from './speech.js';

const CSS = `
#creator { position:fixed; left:12px; top:12px; bottom:12px; width:min(410px, calc(100vw - 24px)); z-index:44; overflow:auto; background:linear-gradient(#fffaf0,#ffeccc); border:6px solid #c8782a; border-radius:18px; padding:12px 14px; color:#3a2410; box-shadow:0 12px 36px rgba(0,0,0,.4); }
#creator.hidden { display:none; } #creator h2 { margin:0 0 2px; font-size:22px; color:#a0541a; } #creator .sub { font-size:13px; color:#7a5a3a; margin-bottom:6px; }
#creator h3 { margin:10px 0 4px; font-size:15px; } #creator h3 small { font-weight:400; color:#8a6a4a; }
#creator .row { display:flex; flex-wrap:wrap; gap:6px; }
#creator button { font:inherit; font-weight:800; border:2px solid #c8782a; border-radius:9px; background:#fff3d8; padding:4px 9px; cursor:pointer; color:#3a2410; }
#creator button.on { background:#ffe28a; border-color:#a0541a; box-shadow:0 0 0 2px #a0541a inset; }
#creator .face { padding:2px; width:86px; font-size:12px; } #creator .face img { display:block; width:78px; height:71px; border-radius:7px; margin:0 auto 1px; }
#creator .sw { width:34px; height:34px; padding:0; border-radius:50%; } #creator .sw.on { box-shadow:0 0 0 3px #fff inset, 0 0 0 2px #a0541a; }
#creator .go { display:flex; gap:8px; margin-top:12px; position:sticky; bottom:-12px; background:#ffeccc; padding:8px 0 4px; }
#creator .go button { flex:1; font-size:17px; padding:8px; } #creator .go .main { background:#7cc46a; border-color:#3f8a33; color:#fff; }
#creator .hint { font-size:12px; color:#8a6a4a; margin-top:4px; }
body.creating #view { filter:none !important; }
body.creating #hud, body.creating #clue, body.creating #prompt, body.creating #mapbox, body.creating #gear, body.creating #xbar { visibility:hidden; }
@media (max-width:700px) { #creator { top:auto; height:52vh; } }`;

const HAIR_VI = { short: 'tóc ngắn', long: 'tóc dài', curly: 'tóc xoăn', wavy: 'tóc gợn sóng', ponytail: 'tóc đuôi ngựa', braids: 'tóc tết' };
const HAIR_EN = { short: 'short hair', long: 'long hair', curly: 'curly hair', wavy: 'wavy hair', ponytail: 'a ponytail', braids: 'braids' };
const OUTFIT = [{ id: 'trousers', en: 'T-shirt + trousers', vi: 'áo + quần dài' }, { id: 'skirt', en: 'T-shirt + skirt', vi: 'áo + váy' }, { id: 'dress', en: 'Dress', vi: 'đầm' }];
const COL_VI = { red: 'đỏ', blue: 'xanh dương', yellow: 'vàng', green: 'xanh lá', pink: 'hồng', purple: 'tím', black: 'đen', white: 'trắng', orange: 'cam', brown: 'nâu' };
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

export class Creator {
  /** api: { profile(), apply() (redraws the hero), focus(on) (camera on the hero's front), sfx(name) } */
  constructor(api) {
    this.api = api; this.resolve = null;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'creator'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.a) this.act(b.dataset.a, b.dataset.v); });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  /** Keys go nowhere else while the card is open; Esc closes the mirror (the first creation needs the button). */
  key(code) { if (!this.open) return false; if (code === 'Escape' && this.mode === 'mirror') this.finish(); return true; }
  show(mode = 'new') {
    const p = this.api.profile(), w = wardrobe(p), val = (slot, d) => { const it = w.worn[slot] && parse(w.worn[slot]); return it ? it.color : d; };
    const body = w.worn.body && parse(w.worn.body), bottom = w.worn.bottom && parse(w.worn.bottom);
    if (mode === 'new') p.lookPending = true;      // closed half way (the game shut): the creator opens again next time
    this.mode = mode; this.before = JSON.stringify({ look: p.look || null, worn: w.worn });
    this.d = { ...lookOf(p), style: val('style', 'short'), hair: val('haircolor', 'brown'), outfit: body ? 'dress' : bottom ? bottom.kind : 'trousers', top: val('top', 'white'), bottom: bottom ? bottom.color : 'brown', dress: body ? body.color : 'pink' };
    this.el.classList.remove('hidden'); this.api.focus(true); this.preview(); this.draw();
    return new Promise((ok) => (this.resolve = ok));
  }
  /** Puts the draft on the hero (the pieces are only owned once the child presses the button). */
  preview() {
    const p = this.api.profile(), d = this.d; p.look = { face: d.face, skin: d.skin };
    if (this.mode === 'new') {
      const w = wardrobe(p); w.worn.style = `hairstyle:${d.style}`; w.worn.haircolor = `haircolor:${d.hair}`;
      if (d.outfit === 'dress') { w.worn.body = `dress:${d.dress}`; w.worn.top = w.worn.bottom = null; }
      else { w.worn.body = null; w.worn.top = `top:${d.top}`; w.worn.bottom = `${d.outfit}:${d.bottom}`; }
    }
    this.api.apply();
  }
  act(a, v) {
    const d = this.d; this.api.sfx('tick');
    if (a === 'face') { d.face = v; speak(`a ${FACE_NAMES[v].toLowerCase()} face`); }
    else if (a === 'skin') d.skin = v;
    else if (a === 'style') { d.style = v; speak(HAIR_EN[v]); }
    else if (a === 'hair') { d.hair = v; speak(`${v} hair`); }
    else if (a === 'outfit') { d.outfit = v; speak(v === 'dress' ? 'a dress' : v === 'skirt' ? 'a T-shirt and a skirt' : 'a T-shirt and trousers'); }
    else if (a === 'top') { d.top = v; speak(`a ${v} T-shirt`); }
    else if (a === 'bottom') { d.bottom = v; speak(d.outfit === 'skirt' ? `a ${v} skirt` : `${v} trousers`); }
    else if (a === 'dress') { d.dress = v; speak(`a ${v} dress`); }
    else if (a === 'random') Object.assign(d, { face: pickOne(FACES), skin: pickOne(Object.keys(SKINS)), style: pickOne(HAIR_STYLES), hair: pickOne(COLOR_NAMES), outfit: pickOne(OUTFIT).id, top: pickOne(COLOR_NAMES), bottom: pickOne(COLOR_NAMES), dress: pickOne(COLOR_NAMES) });
    else if (a === 'done') return this.finish();
    else if (a === 'cancel') return this.cancel();
    this.preview(); this.draw();
  }
  finish() {
    const p = this.api.profile(), d = this.d;
    p.look = { face: d.face, skin: d.skin };
    delete p.lookPending;
    if (this.mode === 'new') starterLook(p, [['hairstyle', d.style], ['haircolor', d.hair], ...(d.outfit === 'dress' ? [['dress', d.dress]] : [['top', d.top], [d.outfit, d.bottom]])]);
    this.close(true);
  }
  cancel() { const p = this.api.profile(), b = JSON.parse(this.before); if (b.look) p.look = b.look; else delete p.look; wardrobe(p).worn = b.worn; this.api.apply(); this.close(false); }
  close(saved) { this.el.classList.add('hidden'); this.api.focus(false); this.api.sfx(saved ? 'correct' : 'tick'); const r = this.resolve; this.resolve = null; if (r) r(saved); }
  draw() {
    const d = this.d, p = this.api.profile(), on = (x, y) => (x === y ? ' on' : '');
    const swatches = (act, cur) => `<div class="row">${COLOR_NAMES.map((c) => `<button class="sw${on(c, cur)}" data-a="${act}" data-v="${c}" title="${c} · ${COL_VI[c]}" style="background:${COLORS[c]}"></button>`).join('')}</div>`;
    const name = String(p.name).replace(/[&<>"]/g, '');
    let html = `<h2>${this.mode === 'new' ? `✨ Create your hero` : '🪞 Magic mirror'}</h2><div class="sub">${this.mode === 'new' ? `Tạo nhân vật của <b>${name}</b>. Bấm để chọn, nhân vật bên phải đổi ngay. Kéo chuột trên nhân vật để xoay.` : 'Gương thần: đổi khuôn mặt và màu da miễn phí.'}</div>
      <h3>Face <small>· khuôn mặt</small></h3><div class="row">${FACES.map((f) => `<button class="face${on(f, d.face)}" data-a="face" data-v="${f}"><img src="./assets/tex/face_${f}_thumb.jpg" alt="">${FACE_NAMES[f]}</button>`).join('')}</div>
      <h3>Skin <small>· màu da</small></h3><div class="row">${Object.keys(SKINS).map((s) => `<button class="sw${on(s, d.skin)}" data-a="skin" data-v="${s}" title="${SKIN_NAMES[s]}" style="background:${SKINS[s]}"></button>`).join('')}</div>`;
    if (this.mode === 'new') {
      html += `<h3>Hair style <small>· kiểu tóc</small></h3><div class="row">${HAIR_STYLES.map((h) => `<button class="${on(h, d.style)}" data-a="style" data-v="${h}" title="${HAIR_VI[h]}">${h}</button>`).join('')}</div>
        <h3>Hair colour <small>· màu tóc: ${d.hair} (${COL_VI[d.hair]})</small></h3>${swatches('hair', d.hair)}
        <h3>Clothes <small>· trang phục</small></h3><div class="row">${OUTFIT.map((o) => `<button class="${on(o.id, d.outfit)}" data-a="outfit" data-v="${o.id}" title="${o.vi}">${o.en}</button>`).join('')}</div>`;
      if (d.outfit === 'dress') html += `<h3>Dress <small>· đầm: ${d.dress} (${COL_VI[d.dress]})</small></h3>${swatches('dress', d.dress)}`;
      else html += `<h3>T-shirt <small>· áo: ${d.top} (${COL_VI[d.top]})</small></h3>${swatches('top', d.top)}<h3>${d.outfit === 'skirt' ? 'Skirt <small>· váy' : 'Trousers <small>· quần'}: ${d.bottom} (${COL_VI[d.bottom]})</small></h3>${swatches('bottom', d.bottom)}`;
      html += `<div class="hint">Sau này kiếm vàng để mua thêm quần áo, trang sức ở <b>Tiệm may của cô Mia</b> trong làng.</div>`;
    }
    html += `<div class="go"><button data-a="random">🎲 Random</button>${this.mode === 'mirror' ? '<button data-a="cancel">Thôi</button>' : ''}<button class="main" data-a="done">${this.mode === 'new' ? 'Xong! Bắt đầu ▶' : 'Xong ✔'}</button></div>`;
    const top = this.el.scrollTop; this.el.innerHTML = html; this.el.scrollTop = top;
  }
}
