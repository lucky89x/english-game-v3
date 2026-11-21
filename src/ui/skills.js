// Skill UI (20/11, one element since 21/11): the hotbar (spell slots, keys 1-4, mana bar) and the skill book (key T): the
// element choice, the chosen element's passives and skills, a page to change element, the element ring (who beats whom).
import * as SK from '../core/skills.js';
import { quick, consumables, ITEMS } from '../core/rules.js';
import { itemIcon } from './pack.js';

const CSS = `
#hotbar { position:fixed; left:50%; bottom:10px; transform:translateX(-50%); z-index:24; display:flex; flex-direction:column; align-items:center; gap:4px; pointer-events:none; }
#hotbar.hidden { display:none; } #hotbar .mp { position:relative; width:330px; max-width:calc(100vw - 20px); height:18px; border-radius:9px; background:rgba(20,30,60,.7); overflow:hidden; border:2px solid rgba(255,255,255,.85); }
#hotbar .mp u { display:block; height:100%; background:linear-gradient(90deg,#2f6fe8,#7fd0ff); } #hotbar .mp b { position:absolute; inset:0; text-align:center; font:800 12px/16px system-ui,sans-serif; color:#fff; text-shadow:0 1px 2px #000; }
#hotbar .sep { width:2px; background:rgba(255,255,255,.4); margin:4px 2px; } #hotbar .sl.pt .n { position:absolute; right:3px; bottom:2px; font:900 12px system-ui; background:#5a3410; border-radius:8px; padding:0 5px; } #hotbar .sl.pt .ic { font-size:24px; } #hotbar .sl.pt .ic img { width:30px; height:30px; object-fit:contain; }
#hotbar .slots { display:flex; gap:6px; pointer-events:auto; }
#hotbar .sl { position:relative; width:54px; height:54px; border-radius:12px; border:3px solid #fff3d6; background:rgba(40,30,20,.72); color:#fff; font:800 11px system-ui, sans-serif; cursor:pointer; padding:0; overflow:hidden; }
#hotbar .sl .ic { display:block; font-size:22px; line-height:26px; } #hotbar .sl .k { position:absolute; left:3px; top:1px; font-size:11px; opacity:.85; }
#hotbar .sl .nm { display:block; font-size:9px; line-height:10px; white-space:nowrap; overflow:hidden; } #hotbar .sl .cd { position:absolute; left:0; right:0; bottom:0; background:rgba(0,0,0,.6); }
#hotbar .sl.empty { opacity:.55; border-style:dashed; } #hotbar .sl.low { filter:grayscale(.8); }
#hotbar .book { width:54px; height:54px; border-radius:12px; border:3px solid #ffd23c; background:#5a3a8a; color:#fff; font:800 11px system-ui; cursor:pointer; position:relative; }
#hotbar .book .dot { position:absolute; right:-4px; top:-6px; min-width:18px; border-radius:9px; background:#e8443a; font-size:12px; }
#skillbook { position:fixed; inset:0; z-index:42; display:flex; align-items:center; justify-content:center; background:rgba(20,16,40,.55); }
#skillbook.hidden { display:none; }
#skillbook .bk { width:min(860px, calc(100vw - 20px)); max-height:calc(100vh - 24px); overflow:auto; background:linear-gradient(#fbf7ff,#e8e0fa); border:6px solid #5a3a8a; border-radius:18px; padding:12px 16px; color:#24183a; box-shadow:0 12px 36px rgba(0,0,0,.45); }
#skillbook header { display:flex; gap:8px; align-items:center; flex-wrap:wrap; } #skillbook h2 { margin:0; flex:1; font-size:22px; }
#skillbook button { font:inherit; font-weight:800; border:2px solid #5a3a8a; border-radius:9px; background:#e2d6ff; padding:3px 10px; cursor:pointer; color:#24183a; }
#skillbook button:disabled { opacity:.45; cursor:default; } #skillbook button.on { background:#5a3a8a; color:#fff; }
#skillbook .cols { display:grid; grid-template-columns:1fr 1fr; gap:10px; } @media (max-width:700px) { #skillbook .cols { grid-template-columns:1fr; } }
#skillbook .node { background:#fff; border:2px solid #cbbcef; border-radius:12px; padding:7px 9px; margin:6px 0; }
#skillbook .node b { font-size:15px; } #skillbook .node .vi { font-size:12.5px; color:#5a4a7a; } #skillbook .node .row { display:flex; gap:5px; align-items:center; flex-wrap:wrap; margin-top:4px; }
#skillbook .pips { display:inline-flex; gap:2px; } #skillbook .pips i { width:9px; height:9px; border-radius:2px; background:#ddd2f2; display:inline-block; } #skillbook .pips i.on { background:var(--c); }
#skillbook .note { font-size:13px; color:#5a4a7a; margin:4px 0; } #skillbook h3 { margin:8px 0 2px; font-size:16px; }
#skillbook .ring { display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; } #skillbook .ring div { background:#fff; border-radius:12px; padding:8px; border:2px solid #cbbcef; font-size:14px; }`;

export class SkillUI {
  /** api: { profile(), spells, sfx(name), changed(), toast(text) } */
  constructor(api) {
    this.api = api; this.tab = 'mine';
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.bar = document.createElement('div'); this.bar.id = 'hotbar'; this.bar.className = 'hidden'; document.body.appendChild(this.bar);
    this.el = document.createElement('div'); this.el.id = 'skillbook'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.q !== undefined) this.api.usePotion(Number(b.dataset.q)); else if (b.dataset.slot) this.api.spells.castSlot(Number(b.dataset.slot)); else if (b.dataset.a === 'book') this.show(); });
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if ((!b && e.target === this.el) || (b && b.dataset.a === 'close')) return this.close(); if (!b || b.disabled) return;
      const p = this.api.profile(), a = b.dataset.a, v = b.dataset.v;
      if (a === 'tab') this.tab = v;
      if (a === 'el') { const had = SK.elOf(p); if (had && !confirm(`Đổi sang hệ ${SK.ELEMENTS[v].vi}? Mọi điểm kỹ năng được trả lại.`)) return; const r = SK.chooseEl(p, v); if (!r.ok) this.api.toast(`Cần ${r.cost} vàng để đổi hệ.`); else { const melee = SK.spellsOf(v)[0]; if (melee && SK.learn(p, melee.id)) SK.assign(p, 0, melee.id); this.tab = 'mine'; this.api.sfx('fanfare'); this.api.toast(`${SK.ELEMENTS[v].icon} Con đã chọn hệ ${SK.ELEMENTS[v].vi}! Phím 1: ${melee.en}`); this.api.changed(); } }
      if (a === 'learn' && SK.learn(p, v)) { this.api.sfx('correct'); this.api.changed(); }
      if (a === 'slot') { SK.assign(p, Number(b.dataset.i), v); this.api.sfx('tick'); this.api.changed(); }
      if (a === 'reset') { if (!confirm(`Lấy lại toàn bộ điểm kỹ năng? (${SK.resetCost(p) ? SK.resetCost(p) + ' vàng' : 'lần đầu miễn phí'})`)) return; const r = SK.reset(p); if (!r.ok) this.api.toast(`Cần ${r.cost} vàng để tẩy điểm.`); else { this.api.sfx('fanfare'); this.api.changed(); } }
      this.draw();
    });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  key(code) { if (code === 'KeyT' && !this.open) { this.show(); return true; } if (this.open && (code === 'Escape' || code === 'KeyT' || code === 'KeyE')) { this.close(); return true; } return this.open; }
  show() { this.el.classList.remove('hidden'); this.draw(); this.api.sfx('tick'); }
  close() { this.el.classList.add('hidden'); }
  /** The hotbar under the screen (called every frame; redraws only when something changed). */
  sync(show) {
    const p = this.api.profile(); if (!p || !show) { this.bar.classList.add('hidden'); return; }
    this.bar.classList.remove('hidden');
    const m = SK.magic(p), mp = SK.mpOf(p), max = SK.powers(p).mpMax, free = SK.free(p), sp = this.api.spells;
    const q = quick(p), cons = consumables(p), qn = q.map((id) => (id ? (cons.find((c) => c.id === id) || { n: 0 }).n : -1));
    const key = JSON.stringify([m.bar, Math.floor(mp), max, free, m.bar.map((id) => (id ? Math.ceil(sp.wait(id) * 4) : 0)), q, qn]); if (key === this.sig) return; this.sig = key;
    const slot = (id, i) => { if (!id) return `<button class="sl empty" data-slot="${i}" title="Ô trống"><span class="k">${i + 1}</span><span class="ic">＋</span><span class="nm">trống</span></button>`;
      const n = SK.NODES[id], w = sp.wait(id), cd = w > 0 ? Math.min(100, w / SK.spellCool(p, id) * 100) : 0;
      return `<button class="sl ${mp < SK.spellCost(id) ? 'low' : ''}" data-slot="${i}" title="${n.en} · ${n.vi} (${SK.spellCost(id)} mana)" style="border-color:${SK.ELEMENTS[n.el].color}"><span class="k">${i + 1}</span><span class="ic">${SK.ELEMENTS[n.el].icon}</span><span class="nm">${n.en}</span>${cd ? `<span class="cd" style="height:${cd}%"></span>` : ''}</button>`; };
    const pot = (id, i) => `<button class="sl pt ${id && qn[i] <= 0 ? 'low' : ''} ${id ? '' : 'empty'}" data-q="${i}" title="${id ? ITEMS[id].en + ' (phím ' + (i + 5) + ')' : 'Ô nhanh ' + (i + 5) + ': mở túi (V) để đặt bình máu/mana'}"><span class="k">${i + 5}</span><span class="ic">${id ? itemIcon(id) : '＋'}</span>${id ? `<span class="n">${Math.max(0, qn[i])}</span>` : '<span class="nm">trống</span>'}</button>`;
    this.bar.innerHTML = `<div class="mp" title="Mana ${Math.floor(mp)}/${max}"><u style="width:${Math.round(mp / max * 100)}%"></u><b>MANA ${Math.floor(mp)}/${max}</b></div><div class="slots">${m.bar.map(slot).join('')}<span class="sep"></span>${q.map(pot).join('')}<button class="book" data-a="book" title="Kỹ năng (phím T)">✨<br>T${free > 0 ? `<span class="dot">${free}</span>` : ''}</button></div>`;
  }
  draw() {
    const p = this.api.profile(); if (!p) return;
    const free = SK.free(p), mine = SK.elOf(p), E = SK.ELEMENTS, cost = SK.resetCost(p);
    const TYPE = { melee: '⚔️ cận chiến', single: '🎯 đánh đơn', aoe: '💥 diện rộng' };
    const pick = (el, cur) => { const c = SK.changeCost(p); return `<div class="node" style="--c:${E[el].color};border-color:${E[el].color}"><b style="font-size:18px">${E[el].icon} ${E[el].en} · ${E[el].vi}</b>
      <div class="vi">Khắc ${E[SK.BEATS[el]].icon} ${E[SK.BEATS[el]].vi} · ${SK.BEAT_WHY[el]}</div>
      <div class="vi">${SK.spellsOf(el).map((n) => `${TYPE[n.type]}: <b>${n.en}</b>`).join(' · ')}</div>
      <div class="vi">Nội tại: ${SK.TREE[el].filter((n) => n.kind === 'inner').map((n) => n.en).join(', ')}</div>
      <div class="row">${cur ? '<b>✔ Hệ của con</b>' : `<button data-a="el" data-v="${el}">${mine ? `Đổi sang hệ này (${c ? c + ' vàng' : 'miễn phí'})` : 'Chọn hệ này'}</button>`}</div></div>`; };
    let body = '', tabs = '';
    if (!mine) body = `<h3>Chọn hệ phép của con</h3><div class="note">Mỗi nhân vật học <b>một hệ</b>. Hệ nào cũng có nội tại (mạnh lên bản thân), một chiêu cận chiến, một chiêu đánh đơn bay theo mục tiêu và một chiêu diện rộng. Sau này đổi hệ được (lần đổi đầu miễn phí), điểm được trả lại hết.</div><div class="cols">${SK.EL_IDS.map((el) => pick(el, false)).join('')}</div>`;
    else {
      tabs = [{ id: 'mine', t: `${E[mine].icon} Hệ ${E[mine].vi}` }, { id: 'change', t: '🔄 Đổi hệ' }, { id: 'ring', t: '☯ Tương sinh – tương khắc' }].map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-a="tab" data-v="${t.id}">${t.t}</button>`).join('');
      if (!['mine', 'change', 'ring'].includes(this.tab)) this.tab = 'mine';
      if (this.tab === 'ring') body = this.ringHtml();
      else if (this.tab === 'change') body = `<div class="note">Đổi hệ: mọi điểm kỹ năng được trả lại để học hệ mới. Lần đổi đầu miễn phí, sau đó tốn vàng.</div><div class="cols">${SK.EL_IDS.map((el) => pick(el, el === mine)).join('')}</div>`;
      else {
        const el = mine, bar = SK.magic(p).bar;
        const node = (n) => { const r = SK.rank(p, n.id), why = SK.blocked(p, n.id);
          const extra = n.kind === 'outer' ? `<div class="vi">Mana ${n.cost} · chờ ${SK.spellCool(p, n.id)} giây${r ? ` · sát thương bây giờ: ${SK.spellDamage(p, n.id, this.api.atk())}` : ''}</div>` : '';
          const slots = n.kind === 'outer' && r ? `<span class="note">Ô phím:</span>${[0, 1, 2, 3].map((i) => `<button class="${bar[i] === n.id ? 'on' : ''}" data-a="slot" data-i="${i}" data-v="${n.id}">${i + 1}</button>`).join('')}` : '';
          return `<div class="node" style="--c:${E[el].color}"><b>${n.en}</b> · ${n.vi} <small>(${n.type ? TYPE[n.type] : '🛡 nội tại'})</small><div class="vi">${n.what}</div>${extra}
            <div class="row"><span class="pips">${Array.from({ length: SK.MAX_RANK }, (_, i) => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</span> <b>${r}/${SK.MAX_RANK}</b>
            <button data-a="learn" data-v="${n.id}" ${why ? 'disabled' : ''} title="${why}">＋ Học</button>${why && why !== 'đã tối đa' && why !== 'hết điểm' ? `<span class="note">${why}</span>` : ''} ${slots}</div></div>`; };
        body = `<div class="note">${E[el].icon} Hệ ${E[el].vi}: khắc hệ <b>${E[SK.BEATS[el]].vi}</b> (${SK.BEAT_WHY[el]}, sát thương ×1,5), bị hệ <b>${E[Object.keys(SK.BEATS).find((k) => SK.BEATS[k] === el)].vi}</b> khắc (×0,7).</div>
          <div class="cols"><div><h3>Nội tại · Passives <small>(mạnh lên bản thân)</small></h3>${SK.TREE[el].filter((n) => n.kind === 'inner').map(node).join('')}</div>
          <div><h3>Chiêu thức · Skills <small>(phím 1 2 3)</small></h3>${SK.TREE[el].filter((n) => n.kind === 'outer').map(node).join('')}</div></div>`;
      }
    }
    this.el.innerHTML = `<div class="bk"><header><span style="font-size:28px">✨</span><h2>Skills · Kỹ năng phép thuật</h2><b>Điểm còn: ${free}</b> <button data-a="reset" ${SK.spent(p) ? '' : 'disabled'}>Tẩy điểm (${cost ? cost + ' vàng' : 'miễn phí'})</button><button data-a="close">✕</button></header>
      <div class="note">Mỗi lần lên cấp được <b>1 điểm</b>. Đánh: <b>chuột trái</b> chém (bấm vào quái để chọn làm mục tiêu, vòng đỏ dưới chân), <b>chuột phải</b> đi tới. Rê chuột vào quái rồi bấm <b>1 2 3</b> để đánh phép vào đúng con đó; nhân vật tự chém tiếp mục tiêu khi đứng gần. <b>Tab</b> đổi sang con quái gần khác.</div>
      ${tabs ? `<div class="row" style="display:flex;gap:5px;flex-wrap:wrap;margin:6px 0">${tabs}</div>` : ''}${body}</div>`;
  }
  ringHtml() {
    const E = SK.ELEMENTS, ids = SK.EL_IDS;
    return `<h3>Tương khắc · Who beats whom</h3><div class="note">Đánh trúng hệ mình khắc: sát thương ×1,5 (số vàng có ▲). Đánh vào hệ khắc mình: ×0,7 (số xám có ▼). Chấm màu cạnh thanh máu quái cho biết hệ của nó.</div>
      <div class="ring">${ids.map((el) => `<div>${E[el].icon} <b>${E[el].en}</b> khắc ${E[SK.BEATS[el]].icon} <b>${E[SK.BEATS[el]].en}</b><br><small>${SK.BEAT_WHY[el]}</small></div>`).join('')}</div>
      <h3>Tương sinh · Combos</h3><div class="note">Phép trúng quái để lại <b>dấu hệ</b> 4 giây (chấm màu đổi màu). Phép tiếp theo nếu đúng hệ được dấu ấy <b>nuôi</b> sẽ nổ combo: hệ bị khắc nuôi hệ khắc nó.</div>
      <div class="ring">${Object.entries(SK.COMBOS).map(([k, c]) => { const [a, b] = k.split('>'); return `<div>${E[a].icon} rồi ${E[b].icon} → <b>${c.en}</b> · ${c.vi}<br><small>+${Math.round(c.bonus * 100)}% sát thương${c.stun ? `, choáng ${c.stun} giây` : ''}${c.chain ? `, lan sang ${c.chain} quái` : ''}${c.spread ? `, lửa lan sang ${c.spread} quái` : ''}</small></div>`; }).join('')}</div>
      <h3>Hệ của quái</h3><div class="note">Đồng Hoang: slime xanh 🌪️ Gió, slime đỏ 🔥 Lửa, golem đá ⚡ Sét, yêu tinh băng ❄️ Băng, quỷ lửa 🔥 Lửa · Rừng: dơi 🌪️ Gió, nấm ❄️ Băng, orc gió 🌪️ Gió · Cảng: cua ❄️ Băng, sứa ⚡ Sét, cướp biển 🔥 Lửa · Boss: Vua Slime ❄️, Nữ hoàng Nấm 🌪️, Golem Cổ ⚡, Bạch Tuộc 🔥.</div>`;
  }
}
