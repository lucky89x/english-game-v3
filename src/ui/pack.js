// The bag (key V, 20/11): a grid of slots with stacked potions and food, the gear that is not worn, the three worn pieces on
// top, and the four quick slots (keys 5-8) that the hero can drink from during a fight. Pure rules live in core/rules.js.
import { ITEMS, bag, wear, consumables, spareGear, quick, setQuick, useItem } from '../core/rules.js';
import { gearIcon } from '../game/gear.js';
import { ICONS } from './shop.js';
import { sellable } from '../core/goods.js';

const CSS = `
#packwin { position:fixed; inset:0; z-index:41; display:flex; align-items:center; justify-content:flex-start; padding-left:12px; background:linear-gradient(90deg, rgba(30,16,6,.5), rgba(30,16,6,0) 60%); pointer-events:none; }
#packwin .bk { pointer-events:auto; } @media (max-width:700px) { #packwin { justify-content:center; padding-left:0; background:rgba(30,16,6,.55); } }
#packwin.hidden { display:none; }
#packwin .bk { width:min(560px, calc(100vw - 20px)); max-height:calc(100vh - 24px); overflow:auto; border-radius:18px; border:6px solid #5a3410; padding:12px 16px 14px; color:#3a2008;
  background:linear-gradient(#fff4dc,#f1d9a8); box-shadow:0 12px 36px rgba(0,0,0,.45); }
#packwin header { display:flex; align-items:center; gap:10px; } #packwin h2 { margin:0; flex:1; font-size:22px; }
#packwin button { font:inherit; font-weight:800; border:2px solid #5a3410; border-radius:9px; background:#ffe2a0; padding:3px 10px; cursor:pointer; color:#3a2008; }
#packwin button:disabled { opacity:.45; cursor:default; }
#packwin .worn { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:8px 0; }
#packwin .wslot { background:#fff9ea; border:2px solid #c99a50; border-radius:12px; padding:6px 8px; text-align:center; font-size:13px; min-height:62px; cursor:pointer; }
#packwin .wslot .ic { font-size:26px; display:block; } #packwin .wslot small { color:#7a5a30; display:block; }
#packwin .grid { display:grid; grid-template-columns:repeat(6, 1fr); gap:6px; margin:8px 0; }
#packwin .cell { position:relative; aspect-ratio:1; border-radius:11px; border:2px solid #b98a4a; background:#fff9ea; font-size:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; }
#packwin .cell.empty { background:rgba(255,249,234,.45); border-style:dashed; cursor:default; } #packwin .cell.sel { border-color:#e8443a; box-shadow:0 0 0 3px rgba(232,68,58,.35); }
#packwin .cell img { width:80%; height:80%; object-fit:contain; } #packwin .cell .n { position:absolute; right:3px; bottom:1px; font:900 13px system-ui; color:#fff; background:#5a3410; border-radius:8px; padding:0 5px; }
#packwin .cell.potion.hp { border-color:#e8443a; } #packwin .cell.potion.mp { border-color:#3f8cff; }
#packwin .info { background:#fff9ea; border:2px solid #c99a50; border-radius:12px; padding:8px 10px; min-height:70px; font-size:14px; }
#packwin .info b { font-size:16px; } #packwin .info .row { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
#packwin .qs { display:flex; gap:8px; justify-content:center; margin:6px 0; } #packwin .q { width:60px; height:60px; border-radius:12px; border:3px solid #5a3410; background:#fff9ea; position:relative; font-size:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; }
#packwin .q .k { position:absolute; left:3px; top:0; font:800 12px system-ui; color:#7a5a30; } #packwin .q .n { position:absolute; right:3px; bottom:0; font:900 13px system-ui; color:#fff; background:#5a3410; border-radius:8px; padding:0 5px; }
#packwin .note { font-size:12.5px; color:#7a5a30; text-align:center; } #packwin .prev { background:#fff1b8; border-color:#e2b04a; }`;

/** Emoji or picture of an item for the bag and the quick slots. */
export const itemIcon = (id) => {
  const it = ITEMS[id], img = gearIcon(id);
  if (img) return `<img src="${img}" alt="">`;
  return ICONS[id] || (it && (it.kind === 'staff' ? '🪄' : it.kind === 'sword' ? '⚔️' : it.slot === 'weapon' ? '🗡️' : it.slot === 'armor' ? '🛡️' : it.slot === 'charm' ? '🍀' : '🍽️')) || '❔';
};

export class PackUI {
  /** api: { profile(), sfx(name), toast(text), changed(), hpMax() } */
  constructor(api) {
    this.api = api; this.sel = null;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'packwin'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) return this.close();
      const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
      const a = b.dataset.a, id = b.dataset.id, p = this.api.profile(), bg = bag(p);
      if (a === 'close') return this.close();
      if (a === 'sel') { this.unpreview(); this.sel = this.sel === id ? null : id; const it = this.sel && !this.sel.startsWith('good:') && ITEMS[this.sel]; if (it && it.slot && it.slot !== 'food' && bg[it.slot] !== this.sel) { this.prev = { slot: it.slot, was: bg[it.slot] || '' }; bg[it.slot] = this.sel; wear(p); this.api.look(); } }      // (21/11) try the piece on: the hero beside the bag shows it
      if (a === 'use') this.use(id);
      if (a === 'quick') { setQuick(p, Number(b.dataset.i), id); this.api.sfx('tick'); this.api.changed(); }
      if (a === 'clearq') { setQuick(p, Number(b.dataset.i), ''); this.api.changed(); }
      if (a === 'wear') { const it = ITEMS[id]; if (this.prev && this.prev.slot === it.slot) { this.prev = null; bg[it.slot] = id; } else bg[it.slot] = bg[it.slot] === id ? '' : id; wear(p); this.api.sfx('tick'); this.api.look(); this.api.changed(); if (this.api.swing) this.api.swing(); }
      if (a === 'off') { this.unpreview(); bg[b.dataset.slot] = ''; wear(p); this.api.sfx('tick'); this.api.look(); this.api.changed(); }
      this.draw();
    });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  key(code) { if (code === 'KeyV' && !this.open) { this.show(); return true; } if (this.open && (code === 'Escape' || code === 'KeyV' || code === 'KeyE')) { this.close(); return true; } return this.open; }
  show() { this.el.classList.remove('hidden'); this.sel = null; this.prev = null; if (this.api.focus) this.api.focus(true); this.draw(); this.api.sfx('tick'); }
  close() { if (!this.open) return; this.unpreview(); this.el.classList.add('hidden'); if (this.api.focus) this.api.focus(false); }
  /** Takes off a piece only tried on (not bought into the worn slot with Mặc). */
  unpreview() { if (!this.prev) return; const p = this.api.profile(), bg = bag(p); bg[this.prev.slot] = this.prev.was; this.prev = null; wear(p); this.api.look(); }
  /** Drinks or eats one item; returns true when something was used (also used by the keys 5-8). */
  use(id) {
    const p = this.api.profile(), r = useItem(p, id, this.api.hpMax()), it = ITEMS[id];
    if (!r.ok) { this.api.toast(r.why === 'full' ? (it.mana ? 'Mana đã đầy.' : 'Máu đã đầy.') : 'Hết rồi.'); return false; }
    this.api.sfx('correct'); this.api.toast(r.heal ? `+${r.heal} máu` : `+${r.mana} mana`); this.api.changed(); return true;
  }
  draw() {
    const p = this.api.profile(); if (!p) return;
    const b = bag(p), cons = consumables(p), spare = spareGear(p), q = quick(p), goods = sellable(p), items = [...cons.map((c) => ({ id: c.id, n: c.n })), ...spare.map((id) => ({ id, n: 0 })), ...goods.map((g) => ({ id: 'good:' + g.id, n: g.n, good: g }))];
    const SLOTS = Math.max(24, Math.ceil(items.length / 6) * 6);
    const cell = (i) => { const x = items[i]; if (!x) return '<div class="cell empty"></div>'; if (x.good) return `<button class="cell ${this.sel === x.id ? 'sel' : ''}" data-a="sel" data-id="${x.id}" title="${x.good.en}">${x.good.icon}<span class="n">${x.n}</span></button>`; const it = ITEMS[x.id];
      return `<button class="cell ${it.potion ? 'potion ' + (it.mana ? 'mp' : 'hp') : ''} ${this.sel === x.id ? 'sel' : ''}" data-a="sel" data-id="${x.id}" title="${it.en}">${itemIcon(x.id)}${x.n ? `<span class="n">${x.n}</span>` : ''}</button>`; };
    const worn = ['weapon', 'armor', 'charm'].map((s) => { const id = b[s], it = ITEMS[id]; return `<div class="wslot" ${id ? `data-a="off" data-slot="${s}" title="Bấm để cởi"` : ''}><span class="ic">${id ? itemIcon(id) : { weapon: '🗡️', armor: '🛡️', charm: '🍀' }[s]}</span>${id ? it.en : '—'}<small>${{ weapon: 'Vũ khí', armor: 'Giáp', charm: 'Bùa' }[s]}</small></div>`; }).join('');
    const gsel = this.sel && this.sel.startsWith('good:') ? goods.find((g) => 'good:' + g.id === this.sel) : null;
    const sel = this.sel && (cons.some((c) => c.id === this.sel) || spare.includes(this.sel)) ? ITEMS[this.sel] : null;
    let info = '<span class="note">Bấm một món trong túi để xem và dùng. Máu và mana: đặt vào ô nhanh để bấm phím 5–8 khi đang đánh.</span>';
    if (sel) {
      const n = cons.find((c) => c.id === this.sel);
      const effect = [sel.heal && `hồi ${sel.heal} máu`, sel.mana && `hồi ${sel.mana} mana`, sel.atk && `công +${sel.atk}`, sel.def && `thủ +${sel.def}`, sel.hp && !sel.heal && `máu +${sel.hp}`].filter(Boolean).join(' · ');
      info = `<b>${itemIcon(this.sel).startsWith('<img') ? '' : itemIcon(this.sel)} ${sel.en}</b> <small>${sel.vi}</small><br>${effect}${n ? ` · có ${n.n}` : ''}
        <div class="row">${n ? `<button data-a="use" data-id="${this.sel}">Dùng</button>${[0, 1, 2, 3].map((i) => `<button data-a="quick" data-i="${i}" data-id="${this.sel}">Ô ${i + 5}</button>`).join('')}` : `<button data-a="wear" data-id="${this.sel}">${this.prev ? '✔ Mặc luôn món này' : 'Mặc / cởi'}</button>${this.prev ? ' <small>Đang thử trên người (nhìn nhân vật bên phải). Bấm món khác hoặc đóng túi thì bỏ thử.</small>' : ''}`}</div>`;
    }
    if (gsel) info = `<b>${gsel.icon} ${gsel.en}</b> <small>${gsel.vi}</small><br>Có ${gsel.n} · bán ${gsel.price} ● mỗi cái (tổng ${gsel.price * gsel.n} ●) ở quầy chợ trong <b>Village Shop</b> (hoặc chợ cá ở cảng).`;
    const qs = q.map((id, i) => { const n = id ? consumables(p).find((c) => c.id === id) : null; return `<button class="q" ${id ? `data-a="clearq" data-i="${i}" title="Bấm để bỏ khỏi ô"` : ''}><span class="k">${i + 5}</span>${id ? itemIcon(id) : ''}${id ? `<span class="n">${n ? n.n : 0}</span>` : ''}</button>`; }).join('');
    this.el.innerHTML = `<div class="bk"><header><h2>🎒 Túi đồ · <small>${p.stats.gold} vàng</small></h2><button data-a="close">Đóng (V)</button></header>
      <div class="worn">${worn}</div><div class="note">Ô nhanh (phím 5–8)</div><div class="qs">${qs}</div>
      <div class="grid">${Array.from({ length: SLOTS }, (_, i) => cell(i)).join('')}</div><div class="info">${info}</div></div>`;
  }
}
