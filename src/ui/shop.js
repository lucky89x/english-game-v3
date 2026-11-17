// "Inside the shop" window (feedback 17/11): opened at the shop door. A wooden room with two counters, Bram's
// weapons and armour and Rose's bread and charms, each item on a shelf card with its price, what it does and
// Buy / Wear / Sell buttons. Item names stay in English (shopping words), the help line is in Vietnamese.
import { ITEMS, bag, buy, sell, sellPrice, shopList, wear } from '../core/rules.js';

const ICON = { weapon: '🗡️', armor: '🛡️', charm: '🍀', food: '🍞' };
const CSS = `
#shopwin { position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center; background:rgba(40,22,8,.55); }
#shopwin.hidden { display:none; }
#shopwin .room { width:min(880px, calc(100vw - 32px)); max-height:calc(100vh - 32px); overflow:auto; border-radius:18px; border:4px solid #7a4a1a;
  background: repeating-linear-gradient(90deg, #c98d55 0 46px, #bd8049 46px 48px), #c98d55; box-shadow:0 10px 30px rgba(0,0,0,.4); padding:14px 16px 16px; color:#3a2008; font-family:inherit; }
#shopwin header { display:flex; align-items:center; gap:12px; background:#fff3d6; border:3px solid #7a4a1a; border-radius:12px; padding:8px 12px; }
#shopwin header h2 { margin:0; font-size:22px; flex:1; } #shopwin header .gold { font-weight:800; font-size:18px; color:#9a6a00; }
#shopwin header button { font:inherit; font-weight:800; border:3px solid #7a4a1a; border-radius:10px; background:#ffd98a; padding:4px 12px; cursor:pointer; }
#shopwin .counter { margin-top:12px; background:rgba(255,243,214,.92); border:3px solid #7a4a1a; border-radius:12px; padding:8px 10px 10px; }
#shopwin .counter h3 { margin:0 0 6px; font-size:16px; } #shopwin .counter h3 small { font-weight:600; color:#7a5a30; }
#shopwin .shelf { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:10px; border-bottom:8px solid #8a5a2a; padding-bottom:8px; }
#shopwin .card { background:#fffaf0; border:2px solid #b07a3c; border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:4px; }
#shopwin .card .ic { font-size:34px; line-height:1; } #shopwin .card b { font-size:15px; } #shopwin .card .vi { font-size:12px; color:#7a5a30; }
#shopwin .card .st { font-size:12px; font-weight:700; color:#2f6f2f; } #shopwin .card .pr { font-weight:800; color:#9a6a00; }
#shopwin .card .row { display:flex; gap:6px; flex-wrap:wrap; margin-top:auto; }
#shopwin .card button { font:inherit; font-size:13px; font-weight:800; border:2px solid #7a4a1a; border-radius:8px; padding:3px 8px; cursor:pointer; background:#ffe9b0; }
#shopwin .card button:disabled { opacity:.45; cursor:default; } #shopwin .card button.sell { background:#e8f4ff; } #shopwin .card .on { color:#2f6f2f; font-weight:800; font-size:13px; }
#shopwin .msg { margin-top:10px; min-height:22px; font-weight:700; text-align:center; background:#fff3d6; border-radius:10px; padding:4px; }
`;

export class ShopWindow {
  /** api: { profile(), changed(), sfx(name) } */
  constructor(api) {
    this.api = api; this.open = false;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'shopwin'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) { if (e.target === this.el) this.close(); return; }
      const id = b.dataset.id, act = b.dataset.act; if (act === 'close') return this.close();
      this.act(act, id);
    });
  }
  show(title = 'Village Shop') { this.title = title; this.open = true; this.msg = 'Chọn món đồ: Buy = mua, Wear = mặc vào, Sell = bán lại lấy nửa giá.'; this.render(); this.el.classList.remove('hidden'); }
  close() { this.open = false; this.el.classList.add('hidden'); }
  key(code) { if (!this.open) return false; if (code === 'Escape' || code === 'KeyE') this.close(); return true; }
  act(what, id) {
    const p = this.api.profile(), it = ITEMS[id], b = bag(p);
    if (what === 'buy') { const r = buy(p, id); this.msg = r.ok ? `You bought the ${it.en}!` : r.why === 'gold' ? `Not enough gold: the ${it.en} costs ${it.cost} ●.` : `The ${it.en} is for level ${it.level} heroes.`; this.api.sfx(r.ok ? 'correct' : 'wrong'); }
    if (what === 'wear') { b[it.slot] = b[it.slot] === id ? '' : id; wear(p); this.msg = b[it.slot] === id ? `You are wearing the ${it.en}.` : `You took off the ${it.en}.`; this.api.sfx('tick'); }
    if (what === 'sell') { const g = sell(p, id); this.msg = g ? `You sold the ${it.en} for ${g} gold.` : ''; this.api.sfx(g ? 'correct' : 'wrong'); }
    this.api.changed(); this.render();
  }
  card(id) {
    const p = this.api.profile(), it = ITEMS[id], b = bag(p), food = it.slot === 'food', own = !food && b.owned.includes(id), on = !food && b[it.slot] === id;
    const stat = [it.atk && `ATK +${it.atk}`, it.def && `DEF +${it.def}`, it.hp && `HP +${it.hp}`, it.heal && `+${it.heal} HP (Q)`].filter(Boolean).join(' · ');
    const canBuy = food || !own, lock = p.stats.level < it.level;
    return `<div class="card"><span class="ic">${ICON[it.slot]}</span><b>${it.en}</b><span class="vi">${it.vi}</span><span class="st">${stat}</span>
      <span class="pr">${it.cost} ● ${lock ? `<small>· cần cấp ${it.level}</small>` : ''}${food ? ` <small>· trong túi: ${b.food}</small>` : ''}</span>
      <div class="row">${canBuy ? `<button data-act="buy" data-id="${id}" ${lock || p.stats.gold < it.cost ? 'disabled' : ''}>Buy</button>` : ''}
        ${own ? `<button data-act="wear" data-id="${id}">${on ? 'Take off' : 'Wear'}</button>` : ''}${on ? '<span class="on">✔ wearing</span>' : ''}
        ${own || (food && b.food > 0) ? `<button class="sell" data-act="sell" data-id="${id}">Sell ${sellPrice(id)} ●</button>` : ''}</div></div>`;
  }
  render() {
    const p = this.api.profile();
    this.el.innerHTML = `<div class="room"><header><span style="font-size:28px">🏪</span><h2>${this.title}</h2><span class="gold">● ${p.stats.gold}</span><button data-act="close">Leave (Esc)</button></header>
      <div class="counter"><h3>⚒️ Bram's counter <small>· Weapons & Armour · vũ khí và giáp</small></h3><div class="shelf">${shopList('forge').map((id) => this.card(id)).join('')}</div></div>
      <div class="counter"><h3>🥖 Rose's counter <small>· Bread & Charms · bánh và bùa</small></h3><div class="shelf">${shopList('rose').map((id) => this.card(id)).join('')}</div></div>
      <div class="msg">${this.msg || ''}</div></div>`;
  }
}
