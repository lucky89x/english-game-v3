// Inside a child's home (18/11): the room is drawn behind (world/interior.js 'home'); this card lists what stands in
// the house and the yard, and what can still be bought, with the English name and the shop that sells it.
import { ITEMS, home, buy } from '../core/rules.js';
import { house, UPGRADES, upgradeState, buyUpgrade, WALL_COLORS, FLOOR_COLORS, paintOf, paintCost, ownsPaint, buyPaint } from '../core/house.js';

const CSS = `
#homewin { position:fixed; inset:0; z-index:41; display:flex; align-items:center; justify-content:center; background:rgba(30,16,6,.5); }
#homewin.hidden { display:none; }
#homewin .book { width:min(640px, calc(100vw - 24px)); max-height:calc(100vh - 30px); overflow:auto; background:linear-gradient(#fffaf0, #f6e6c4); border:6px solid #7a4a1a; border-radius:18px; padding:12px 16px; color:#3a2008; box-shadow:0 12px 36px rgba(0,0,0,.45); }
#homewin header { display:flex; gap:8px; align-items:center; } #homewin h2 { margin:0; flex:1; font-size:22px; }
#homewin button { font:inherit; font-weight:800; border:2px solid #7a4a1a; border-radius:9px; background:#ffd98a; padding:3px 10px; cursor:pointer; }
#homewin .book { position:relative; } #homewin .x { position:absolute; top:6px; right:8px; width:34px; height:34px; border-radius:50%; font-size:18px; line-height:1; padding:0; background:#e8443a; color:#fff; border-color:#8a2a22; } #homewin header { padding-right:42px; }
#homewin .sws { display:flex; flex-wrap:wrap; gap:6px; margin:4px 0; } #homewin .sw { display:flex; flex-direction:column; align-items:center; font-size:11px; } #homewin .sw button { width:30px; height:30px; padding:0; border-radius:50%; }
#homewin .it button { margin-top:3px; font-size:12px; padding:1px 8px; } #homewin .it button:disabled { opacity:.5; cursor:default; } #homewin .flash { background:#fff3c8; border:2px solid #c8782a; border-radius:10px; padding:5px 9px; margin:5px 0; font-size:13px; }
#homewin .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:6px; margin:8px 0; }
#homewin .it { background:#fff; border:2px solid #d9b98a; border-radius:10px; padding:5px 7px; font-size:13px; } #homewin .it b { display:block; font-size:14px; }
#homewin .it.no { opacity:.5; border-style:dashed; } #homewin .note { font-size:13px; color:#6a4a20; margin:4px 0; }
#homewin .up { display:flex; gap:8px; align-items:center; background:#fff; border:2px solid #d9b98a; border-radius:10px; padding:5px 8px; margin:5px 0; font-size:13px; } #homewin .up b { font-size:14px; } #homewin .up .t { flex:1; } #homewin .up button:disabled { opacity:.5; cursor:default; }
#homehint { position:fixed; left:50%; bottom:14px; transform:translateX(-50%); z-index:30; padding:7px 16px; border-radius:20px; background:rgba(40,24,8,.82); color:#fff; font:800 14px system-ui,sans-serif; display:none; pointer-events:none; } #homehint.on { display:block; }
body.inroom #homewin { background:transparent; justify-content:flex-end; } body.inroom #homewin .book { width:min(560px, 56vw); margin-right:12px; }
`;

export class HomePanel {
  /** api: { onClose(), profile(), today(), changed(), sfx(name), track(ev) } */
  constructor(api) {
    this.api = api; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'homewin'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.hint = document.createElement('div'); this.hint.id = 'homehint'; this.base = 'WASD / bấm chuột: đi lại · L: danh sách, nâng cấp, màu nhà · B: sắp xếp đồ · E: ra ngoài'; this.hint.textContent = this.base; document.body.appendChild(this.hint); this.inside = false;
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if ((b && b.dataset.a === 'close') || e.target === this.el) { this.hide(); return; }
      if (b && b.dataset.a === 'exit') { this.close(); return; }
      if (b && b.dataset.a === 'up') { this.upgrade(b.dataset.v); return; }
      if (b && (b.dataset.a === 'wall' || b.dataset.a === 'floor')) { this.paintBuy(b.dataset.a, b.dataset.v); return; }
      if (b && b.dataset.a === 'buy') { this.buyItem(b.dataset.v); return; }
      if (b && b.dataset.a === 'arrange') { this.hide(); if (this.api.setEditing) this.api.setEditing(true); return; }
      if (b && b.dataset.a === 'quiz') this.startQuiz();
      if (b && b.dataset.a === 'ans') this.answer(Number(b.dataset.v));
    });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  /** The line at the bottom while inside: the arrange-mode help, or the keys. */
  setHint(t) { this.hint.textContent = t || this.base; }
  /** owner: the profile whose home it is; mine: the child playing now owns it (a visitor only looks). */
  show(owner, mine) { this.owner = owner; this.mine = mine; this.quiz = null; this.msg = ''; this.inside = true; this.paint(); this.el.classList.remove('hidden'); this.hint.classList.remove('on'); }
  /** The list can be shut while the hero stays inside the house (E leaves). */
  hide() { this.el.classList.add('hidden'); if (this.inside) this.hint.classList.add('on'); }
  /** (24/11) A wall or floor colour costs gold (once). */
  paintBuy(kind, key) {
    if (!this.mine) return; const r = buyPaint(this.owner, kind, key);
    if (!r.ok) { this.api.sfx('wrong'); this.msg = r.why === 'gold' ? `Chưa đủ vàng: màu này giá ${r.cost} ●.` : 'Màu này chưa có.'; this.paint(); return; }
    this.api.sfx(r.cost ? 'correct' : 'tick'); this.msg = r.cost ? `Đã sơn màu mới (−${r.cost} ●)!` : 'Đã đổi màu (màu con đã mua rồi).'; this.api.changed(); if (this.api.rebuild) this.api.rebuild(this.owner); this.paint();
  }
  /** (24/11) Furniture and garden things are bought here, inside the house. */
  buyItem(id) {
    if (!this.mine) return; const it = ITEMS[id], r = buy(this.owner, id);
    if (!r.ok) { this.api.sfx('wrong'); this.msg = r.why === 'gold' ? `Chưa đủ vàng: ${it.en} giá ${it.cost} ●.` : r.why === 'level' ? `Cần cấp ${it.level} mới mua ${it.en}.` : 'Con đã có đồ này rồi.'; this.paint(); return; }
    this.api.sfx('correct'); this.msg = `Đã mua ${it.en} (−${it.cost} ●), đồ tự đặt vào nhà. Phím B để dời chỗ.`; this.api.changed(); if (this.api.rebuild) this.api.rebuild(this.owner); this.paint();
  }
  upgrade(id) {
    const r = buyUpgrade(this.owner, id), u = UPGRADES.find((x) => x.id === id);
    if (!r.ok) { this.api.sfx('wrong'); this.msg = r.why === 'gold' ? 'Chưa đủ vàng.' : r.why === 'level' ? `Cần cấp ${u.level}.` : r.why === 'need' ? 'Cần nâng cấp trước đó.' : 'Con đã có rồi.'; this.paint(); return; }
    this.api.sfx('fanfare'); this.msg = `Đã nâng cấp: ${u.en}! Nhà đang được xây lại…`; this.api.changed(); if (this.api.rebuild) this.api.rebuild(this.owner); this.paint();
  }
  paint() {
    const owner = this.owner, mine = this.mine;
    const have = home(owner).items, lvl = owner.stats.level, gold = owner.stats.gold, row = (slot) => Object.entries(ITEMS).filter(([, it]) => it.slot === slot)
      .map(([id, it]) => `<div class="it ${have.includes(id) ? '' : 'no'}"><b>${it.en}</b>${it.vi}${have.includes(id) ? ' ✔' : `<br><small>${it.cost} ● · cần cấp ${it.level}</small>${mine ? `<br><button data-a="buy" data-v="${id}" ${lvl < it.level ? 'disabled title="Chưa đủ cấp"' : gold < it.cost ? 'title="Chưa đủ vàng"' : ''}>Mua</button>` : ''}`}</div>`).join('');
    const n = have.length, total = Object.values(ITEMS).filter((it) => it.slot === 'home' || it.slot === 'yard').length;
    this.el.innerHTML = `<div class="book"><header><span style="font-size:28px">🏠</span><h2>${mine ? 'My home' : `${owner.name}'s home`} · Nhà của ${owner.name}</h2><button data-a="exit">Ra ngoài (E)</button></header><button class="x" data-a="close" title="Đóng (X)">✕</button>
      <div class="note">${mine ? 'Nhà của con. Mua đồ, sơn tường ngay ở đây (tốn vàng, con có ${owner.stats.gold} ●); đồ mua về tự đặt vào nhà hoặc sân. Bấm ✕ góc trên bên phải để đóng.' : `Con đang thăm nhà của ${owner.name}. Chỉ ${owner.name} mới mua được đồ cho nhà này.`} (${n}/${total})</div>
      ${this.msg ? `<div class="flash"><b>${this.msg}</b></div>` : ''}${mine ? this.paintBox() : ''}
      ${this.upgradesBox(mine)}
      ${this.quizBox(mine)}
      <h3>🛒 In the house · Cửa hàng đồ trong nhà</h3><div class="grid">${row('home')}</div><h3>🌳 In the yard · Đồ ngoài sân</h3><div class="grid">${row('yard')}</div></div>`;
  }
  /** (21/11) "change the colours as the owner likes; arrange the furniture" */
  paintBox() {
    const h = house(this.owner), pt = paintOf(h), sw = (kind, list, on) => `<div class="sws">${Object.entries(list).map(([k, v]) => { const c = paintCost(kind, k), own = ownsPaint(h, kind, k); return `<span class="sw"><button data-a="${kind}" data-v="${k}" title="${v.vi}${own ? '' : ' · ' + c + ' ●'}" style="background:#${v.hex.toString(16).padStart(6, '0')};${k === on ? 'box-shadow:0 0 0 3px #fff inset, 0 0 0 2px #7a4a1a;' : ''}"></button><small>${own ? '✔' : c + '●'}</small></span>`; }).join('')}</div>`;
    return `<h3>🎨 Colours & furniture · Màu nhà (mua một lần, đổi lại miễn phí)</h3><div class="note">Tường: ${sw('wall', WALL_COLORS, pt.wall)}</div><div class="note">Sàn: ${sw('floor', FLOOR_COLORS, pt.floor)}</div>
      <div class="note"><button data-a="arrange">🛠 Sắp xếp đồ (phím B)</button> bấm vào một đồ trong nhà để nhấc lên, di chuột tới chỗ mới, R để xoay, bấm để đặt.</div>`;
  }
  upgradesBox(mine) {
    const o = this.owner, h = house(o); if (!mine) return `<div class="note">🏗 Nhà ${h.floors} tầng${h.villa ? ' (biệt thự)' : ''}, vườn cấp ${h.garden}.</div>`;
    const rows = UPGRADES.map((u) => { const st = upgradeState(o, u.id), have = st.why === 'have'; return `<div class="up"><div class="t"><b>${u.en}</b> · ${u.vi}<br><small>${have ? '✔ Đã có' : `${u.cost} ● · cần cấp ${u.level}${st.why === 'need' ? ' · cần nâng cấp trước' : ''}`}</small></div>${have ? '' : `<button data-a="up" data-v="${u.id}" ${st.why === 'need' ? 'disabled' : ''}>Mua</button>`}</div>`; }).join('');
    return `<h3>🏗 Upgrade your home · Nâng cấp nhà <small>(nhà ${h.floors} tầng${h.villa ? ', biệt thự' : ''}, vườn cấp ${h.garden})</small></h3>${rows}`;
  }
  quizBox(mine) {
    if (!mine) return '';
    const q = this.quiz, p = this.api.profile(), doneToday = p.homeQuiz === this.api.today();
    if (!q) return `<div class="note">📜 <b>Home words</b>: gọi tên 3 đồ trong nhà bằng tiếng Anh, mỗi câu đúng +5 vàng (mỗi ngày một lần). ${doneToday ? '✔ Hôm nay con làm rồi.' : '<button data-a="quiz">Bắt đầu</button>'}</div>`;
    if (q.done) return `<div class="note">📜 ${q.last || ''} ${q.done}</div>`;
    const it = ITEMS[q.list[q.n]];
    return `<div class="note">📜 ${q.last || ''} <b>${q.n + 1}/3</b> · "${it.vi}" in English is…<br>${q.opts.map((id, i) => `<button data-a="ans" data-v="${i}">${i + 1}. ${ITEMS[id].en}</button>`).join(' ')}</div>`;
  }
  /** Home word quiz (18/11: "the houses have no quests inside"): once a day, name three things for a home in English. */
  startQuiz() {
    const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].slot === 'home' || ITEMS[id].slot === 'yard').sort(() => Math.random() - 0.5);
    this.quiz = { list: ids.slice(0, 3), n: 0, right: 0, pool: ids }; this.ask();
  }
  ask() {
    const q = this.quiz, id = q.list[q.n], opts = [id, ...q.pool.filter((x) => x !== id).sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5);
    q.opts = opts; this.paint();
  }
  answer(i) {
    const q = this.quiz, ok = q.opts[i] === q.list[q.n]; if (ok) q.right += 1; this.api.sfx(ok ? 'correct' : 'wrong');
    q.last = ok ? 'Right!' : `It's "${ITEMS[q.list[q.n]].en}".`; q.n += 1;
    if (q.n < q.list.length) { this.ask(); return; }
    const p = this.api.profile(), gold = q.right * 5; p.stats.gold += gold; p.homeQuiz = this.api.today(); this.api.track('shopquest'); this.api.changed();
    q.done = `${q.right}/3 đúng · +${gold} vàng. Mai làm tiếp nhé!`; this.paint();
  }
  /** Leaves the house. */
  close() { if (!this.inside) return; this.inside = false; this.msg = ''; this.el.classList.add('hidden'); this.hint.classList.remove('on'); if (this.api.onClose) this.api.onClose(); }
  key(code) {
    if (!this.inside) return false;
    if (code === 'KeyE') { this.close(); return true; }
    if (code === 'Escape') { if (this.open) this.hide(); else this.close(); return true; }
    if (code === 'KeyL' && !this.open) { this.paint(); this.el.classList.remove('hidden'); this.hint.classList.remove('on'); return true; }
    return this.open;
  }
}
