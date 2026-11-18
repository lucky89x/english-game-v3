// Inside a child's home (18/11): the room is drawn behind (world/interior.js 'home'); this card lists what stands in
// the house and the yard, and what can still be bought, with the English name and the shop that sells it.
import { ITEMS, home } from '../core/rules.js';

const SHOP = { home: "Bram's furniture (west fields)", garden: "Lily's garden corner (furniture shop)", music: "Anna's instruments (stall by Anna's house)" };
const CSS = `
#homewin { position:fixed; inset:0; z-index:41; display:flex; align-items:center; justify-content:center; background:rgba(30,16,6,.5); }
#homewin.hidden { display:none; }
#homewin .book { width:min(640px, calc(100vw - 24px)); max-height:calc(100vh - 30px); overflow:auto; background:linear-gradient(#fffaf0, #f6e6c4); border:6px solid #7a4a1a; border-radius:18px; padding:12px 16px; color:#3a2008; box-shadow:0 12px 36px rgba(0,0,0,.45); }
#homewin header { display:flex; gap:8px; align-items:center; } #homewin h2 { margin:0; flex:1; font-size:22px; }
#homewin button { font:inherit; font-weight:800; border:2px solid #7a4a1a; border-radius:9px; background:#ffd98a; padding:3px 10px; cursor:pointer; }
#homewin .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:6px; margin:8px 0; }
#homewin .it { background:#fff; border:2px solid #d9b98a; border-radius:10px; padding:5px 7px; font-size:13px; } #homewin .it b { display:block; font-size:14px; }
#homewin .it.no { opacity:.5; border-style:dashed; } #homewin .note { font-size:13px; color:#6a4a20; margin:4px 0; }
body.inroom #homewin { background:transparent; justify-content:flex-end; } body.inroom #homewin .book { width:min(560px, 56vw); margin-right:12px; }
`;

export class HomePanel {
  /** api: { onClose(), profile(), today(), changed(), sfx(name), track(ev) } */
  constructor(api) {
    this.api = api; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'homewin'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if ((b && b.dataset.a === 'close') || e.target === this.el) { this.close(); return; }
      if (b && b.dataset.a === 'quiz') this.startQuiz();
      if (b && b.dataset.a === 'ans') this.answer(Number(b.dataset.v));
    });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  /** owner: the profile whose home it is; mine: the child playing now owns it (a visitor only looks). */
  show(owner, mine) { this.owner = owner; this.mine = mine; this.quiz = null; this.paint(); this.el.classList.remove('hidden'); }
  paint() {
    const owner = this.owner, mine = this.mine;
    const have = home(owner).items, row = (slot) => Object.entries(ITEMS).filter(([, it]) => it.slot === slot)
      .map(([id, it]) => `<div class="it ${have.includes(id) ? '' : 'no'}"><b>${it.en}</b>${it.vi}${have.includes(id) ? ' ✔' : `<br><small>${it.cost} ● · ${SHOP[it.seller] || ''}</small>`}</div>`).join('');
    const n = have.length, total = Object.values(ITEMS).filter((it) => it.slot === 'home' || it.slot === 'yard').length;
    this.el.innerHTML = `<div class="book"><header><span style="font-size:28px">🏠</span><h2>${mine ? 'My home' : `${owner.name}'s home`} · Nhà của ${owner.name}</h2><button data-a="close">✕</button></header>
      <div class="note">${mine ? 'Nhà của con. Mua đồ ở cửa hàng nội thất (phía Tây, cạnh nhà), quầy nhạc cụ của Anna; đồ mua về tự đặt vào nhà hoặc sân.' : `Con đang thăm nhà của ${owner.name}. Chỉ ${owner.name} mới mua được đồ cho nhà này.`} (${n}/${total})</div>
      ${this.quizBox(mine)}
      <h3>In the house · Trong nhà</h3><div class="grid">${row('home')}</div><h3>In the yard · Ngoài sân</h3><div class="grid">${row('yard')}</div></div>`;
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
  close() { if (!this.open) return; this.el.classList.add('hidden'); if (this.api.onClose) this.api.onClose(); }
  key(code) { if (this.open && (code === 'Escape' || code === 'KeyE')) { this.close(); return true; } return this.open; }
}
