// Mia's tailor shop in the village (19/11: "kiếm vàng để mua quần áo trang sức thay thế và khi thay thế cũng hiển thị luôn
// trên nhân vật"). The card sits on the left, the hero stands on the right seen from the front (the creator's camera):
// pick a kind and a colour to try it on, buy it with gold to keep it. Names are English ("a pink scarf"), read aloud.
import { KINDS, COLOR_NAMES, JEWEL_HEX, wardrobe, parse, itemId, itemName, priceOf, buyPiece, typeOf, stylesOf } from '../core/wardrobe.js';
import { COLORS } from './style.js';
import { speak } from './speech.js';

const CSS = `
#tailor { position:fixed; left:12px; top:12px; bottom:12px; width:min(410px, calc(100vw - 24px)); z-index:44; overflow:auto; background:linear-gradient(#fff6fb,#ffe0ef); border:6px solid #c0508a; border-radius:18px; padding:12px 14px; color:#3a1028; box-shadow:0 12px 36px rgba(0,0,0,.4); }
#tailor.hidden { display:none; } #tailor h2 { margin:0; font-size:22px; color:#a03070; flex:1; } #tailor header { display:flex; align-items:center; gap:8px; }
#tailor .say { font-size:14px; margin:4px 0 6px; } #tailor .say small { color:#8a5070; } #tailor h3 { margin:10px 0 4px; font-size:15px; } #tailor h3 small { font-weight:400; color:#8a5070; }
#tailor .row { display:flex; flex-wrap:wrap; gap:6px; }
#tailor button { font:inherit; font-weight:800; border:2px solid #c0508a; border-radius:9px; background:#ffeef6; padding:4px 9px; cursor:pointer; color:#3a1028; }
#tailor button.on { background:#ffd0e6; box-shadow:0 0 0 2px #a03070 inset; } #tailor button:disabled { opacity:.5; cursor:default; }
#tailor .tabs button { font-size:14px; } #tailor .k { min-width:84px; font-size:13px; } #tailor .k i { font-style:normal; font-size:22px; display:block; }
#tailor .sw { width:36px; height:36px; padding:0; border-radius:50%; position:relative; } #tailor .sw.on { box-shadow:0 0 0 3px #fff inset, 0 0 0 2px #a03070; }
#tailor .sw.own::after { content:'✔'; position:absolute; right:-4px; bottom:-4px; font-size:12px; background:#fff; border-radius:50%; padding:0 2px; color:#2a8a3a; }
#tailor .txt { min-width:70px; }
#tailor .buy { position:sticky; bottom:-12px; background:#ffe0ef; padding:8px 0 4px; margin-top:10px; display:flex; gap:8px; align-items:center; }
#tailor .buy b { flex:1; font-size:15px; } #tailor .buy .main { background:#7cc46a; border-color:#3f8a33; color:#fff; font-size:16px; padding:7px 12px; }
#tailor .note { font-size:12px; color:#8a5070; }`;

const TABS = [
  { id: 'tops', en: 'Tops', vi: 'áo', kinds: ['top', 'tee_stripe', 'tee_dots', 'tee_raglan', 'tee_block', 'tee_dye', 'shirt_check', 'hoodie', 'hoodie_block', 'jacket', 'aodai'] },
  { id: 'bottoms', en: 'Bottoms', vi: 'quần, váy', kinds: ['shorts', 'trousers', 'trackpants', 'skirt', 'skirt_check', 'skirt_dots'] },
  { id: 'dresses', en: 'Dresses', vi: 'đầm', kinds: ['dress', 'dress_dots', 'dress_stripe', 'dress_dye', 'gown'] },
  { id: 'shoes', en: 'Shoes', vi: 'giày dép', kinds: ['shoes', 'hightops', 'boots', 'flats', 'sandals'] },
  { id: 'acc', en: 'Accessories', vi: 'phụ kiện', kinds: ['hat', 'bow', 'headband', 'glasses', 'scarf', 'bag', 'bracelet'] },
  { id: 'jewel', en: 'Jewellery', vi: 'trang sức', kinds: ['necklace', 'earrings', 'tiara', 'hairclip'] },
  { id: 'hair', en: 'Hair', vi: 'tóc', kinds: ['hairstyle', 'haircolor'] },
];
/** (25/11) The hero's clothes are one painted outfit that takes colours (game/herotint.js), not different shapes: her tabs offer the colour kinds. */
const HERO_ONLY_KINDS = { tops: ['top'], bottoms: ['skirt'], dresses: ['dress'], shoes: ['boots'], hair: ['haircolor'] };
const VAL_VI = { red: 'đỏ', blue: 'xanh dương', yellow: 'vàng', green: 'xanh lá', pink: 'hồng', purple: 'tím', black: 'đen', white: 'trắng', orange: 'cam', brown: 'nâu', gold: 'vàng kim', silver: 'bạc', short: 'ngắn', long: 'dài', curly: 'xoăn', wavy: 'gợn sóng', ponytail: 'đuôi ngựa', braids: 'tết' };
const hex = (c) => COLORS[c] || JEWEL_HEX[c];
/** "a pink scarf", "pink trousers", "earrings", "a ponytail" for reading aloud. */
export function phrase(id) {
  const it = parse(id); if (!it) return id;
  if (it.kind === 'hairstyle') return it.color === 'ponytail' ? 'a ponytail' : it.color === 'braids' ? 'braids' : `${it.color} hair`;
  if (it.kind === 'haircolor') return `${it.color} hair`;
  const n = itemName(id); return /trousers|pants|earrings|glasses|shoes|sneakers|boots|sandals|flats/.test(n) ? n : `${/^[aeiou]/.test(n) ? 'an' : 'a'} ${n}`;
}

export class Tailor {
  /** api: { profile(), apply(), focus(on), sfx(name), changed(), toast(text) } */
  constructor(api) {
    this.api = api; this.tab = 'tops'; this.kind = 'top'; this.sel = null;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'tailor'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.a && !b.disabled) this.act(b.dataset.a, b.dataset.v); });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  key(code) { if (!this.open) return false; if (code === 'Escape' || code === 'KeyE') this.close(); return true; }
  show() {
    const w = wardrobe(this.api.profile()); this.orig = { ...w.worn }; this.sel = null; this.say = { en: "Hello! I'm Mia. I make clothes and jewellery. What would you like?", vi: 'Chọn món, chọn màu để thử. Thích thì mua bằng vàng.' };
    this.el.classList.remove('hidden'); this.api.focus(true); this.draw(); speak(this.say.en);
  }
  close() { if (!this.open) return; const w = wardrobe(this.api.profile()); w.worn = { ...this.orig }; this.api.apply(); this.el.classList.add('hidden'); this.api.focus(false); this.api.sfx('tick'); }
  /** Try a piece on: what was worn when the shop opened, plus this one piece. */
  tryOn(id) {
    const w = wardrobe(this.api.profile()), it = parse(id); w.worn = { ...this.orig }; this.sel = id;
    w.worn[it.slot] = id; if (it.slot === 'body') w.worn.top = w.worn.bottom = null; else if (it.slot === 'top' || it.slot === 'bottom') w.worn.body = null;
    this.api.apply();
  }
  act(a, v) {
    const p = this.api.profile(), w = wardrobe(p);
    if (a === 'close') return this.close();
    if (a === 'tab') { this.tab = v; this.kind = this.kindsOf(v)[0]; this.api.sfx('tick'); }
    else if (a === 'kind') { this.kind = v; this.api.sfx('tick'); speak(KINDS[v].en === 'hair' ? (v === 'hairstyle' ? 'hair style' : 'hair colour') : KINDS[v].en); }
    else if (a === 'pick') { this.tryOn(v); this.api.sfx('tick'); speak(phrase(v)); }
    else if (a === 'off') { const it = parse(v); this.orig[it.slot] = null; w.worn = { ...this.orig }; this.sel = null; this.api.apply(); this.api.changed(); }
    else if (a === 'buy' && this.sel) {
      const id = this.sel, r = buyPiece(p, id);
      if (!r.ok) { this.api.sfx('wrong'); this.say = { en: `Sorry, ${phrase(id)} costs ${r.cost} gold.`, vi: `Chưa đủ vàng (cần ${r.cost} ●). Đánh quái, chơi mini game, làm nhiệm vụ để kiếm thêm.` }; speak(this.say.en); }
      else { this.orig = { ...w.worn }; this.api.sfx(r.why === 'new' ? 'correct' : 'tick'); this.say = { en: r.why === 'new' ? `Here you are: ${phrase(id)}. You look great!` : `You are wearing ${phrase(id)} now.`, vi: r.why === 'new' ? `Đã mua (−${r.cost} ●) và mặc ngay. Món này nằm trong Tủ đồ (phím V).` : 'Món này con đã có, mặc lại miễn phí.' }; speak(this.say.en); this.api.changed(); }
    }
    this.draw();
  }
  /** the kinds a tab offers for this player (the hero: colours only for clothes, hair colour, all the accessory styles) */
  kindsOf(tabId) { const t = TABS.find((x) => x.id === tabId); return this.api.profile().avatar === 'hero' && HERO_ONLY_KINDS[tabId] ? HERO_ONLY_KINDS[tabId] : t.kinds; }
  draw() {
    const p0 = this.api.profile();
    if (p0.avatar === 'girl1' || p0.avatar === 'girl2') { this.el.innerHTML = `<header><span style="font-size:28px">🧵</span><h2>Mia's Tailor Shop</h2><button data-a="close">✕</button></header><div class="say">💬 <b>Mia:</b> What a lovely outfit! I do not have clothes for it yet.<br><small>Bộ đồ của nhân vật này đã may sẵn. Tiệm sẽ có đồ riêng cho bạn ấy sau.</small></div>`; return; }
    const p = this.api.profile(), w = wardrobe(p), tab = TABS.find((t) => t.id === this.tab), K = KINDS[this.kind], vals = K.vals || COLOR_NAMES, owned = new Set(w.owned);
    const kindBtn = (k) => `<button class="k${k === typeOf(this.kind) ? ' on' : ''}" data-a="kind" data-v="${k}"><i>${KINDS[k].icon}</i>${k === 'hairstyle' ? 'hair style' : k === 'haircolor' ? 'hair colour' : KINDS[k].en}<br><small>${KINDS[k].vi}</small></button>`;
    const valBtn = (c) => { const id = itemId(this.kind, c), cls = `${id === this.sel ? ' on' : ''}${owned.has(id) ? ' own' : ''}`;
      return this.kind === 'hairstyle' ? `<button class="txt${cls}" data-a="pick" data-v="${id}">${c}${owned.has(id) ? ' ✔' : ''}</button>` : `<button class="sw${cls}" data-a="pick" data-v="${id}" title="${c} · ${VAL_VI[c] || ''}" style="background:${hex(c)}"></button>`; };
    const worn = this.orig[K.slot], sel = this.sel && parse(this.sel);
    // (25/11) the hero has five looks of each accessory (the first one is the older kind): a "style" row under the kinds
    const styles = p.avatar === 'hero' ? stylesOf(typeOf(this.kind)) : [];
    const styleRow = styles.length > 1 ? `<h3>Style <small>· kiểu (${styles.length})</small></h3><div class="row">${styles.map((k) => `<button class="k${k === this.kind ? ' on' : ''}" data-a="kind" data-v="${k}"><i>${KINDS[k].icon}</i>${KINDS[k].en}<br><small>${KINDS[k].vi}</small></button>`).join('')}</div>` : '';
    let buy = '<b class="note">Bấm một màu để thử lên người.</b>';
    if (sel) { const own = owned.has(this.sel), cost = priceOf(this.sel);
      buy = `<b>${phrase(this.sel)} <small>(${VAL_VI[sel.color] || ''} · ${KINDS[sel.kind].vi})</small></b><button class="main" data-a="buy">${own ? 'Mặc' : `Mua · ${cost} ●`}</button>`; }
    this.el.innerHTML = `<header><span style="font-size:28px">🧵</span><h2>Mia's Tailor Shop</h2><button data-a="close">✕</button></header>
      <div class="say">💬 <b>Mia:</b> ${this.say.en}<br><small>${this.say.vi}</small></div>
      <div class="note">Vàng của con: <b>${p.stats.gold} ●</b></div>
      <div class="row tabs" style="margin-top:6px">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-a="tab" data-v="${t.id}">${t.en} <small>· ${t.vi}</small></button>`).join('')}</div>
      <h3>${tab.en} <small>· ${tab.vi}</small></h3><div class="row">${this.kindsOf(tab.id).map(kindBtn).join('')}</div>
      ${styleRow}
      <h3>${K.icon} ${this.kind === 'hairstyle' ? 'Hair style' : this.kind === 'haircolor' ? 'Hair colour' : K.en} <small>· ${K.vi} · ${priceOf(itemId(this.kind, vals[0]))} ●${K.vals && K.vals.includes('gold') ? ' (gold ×2, silver ×1,5)' : ''}</small></h3>
      <div class="row">${vals.map(valBtn).join('')}</div>
      ${worn ? `<div class="note" style="margin-top:6px">Đang mặc: ${phrase(worn)} <button data-a="off" data-v="${worn}">Cởi</button></div>` : ''}
      <div class="buy">${buy}</div>`;
  }
}
