// Quest journal window (N key or the 📜 button): two tabs, the main story quests in order (done / current / locked)
// and today's three daily quests with progress bars. Rewards are claimed here.
import { MAIN, mainCurrent, mainState, DAILY, dailyOf, dailyReward } from '../core/quests.js';

const CSS = `
#jbtn { position:fixed; left:14px; top:150px; z-index:25; font:800 14px system-ui, sans-serif; border:3px solid #b07a3c; border-radius:12px; background:#fff3d6; color:#4a2a10; padding:5px 10px; cursor:pointer; box-shadow:0 3px 0 rgba(74,42,16,.25); }
#jbtn.hidden, #journal.hidden { display:none; } #jbtn .dot { display:inline-block; min-width:18px; border-radius:9px; background:#e8443a; color:#fff; font-size:12px; margin-left:4px; text-align:center; }
#journal { position:fixed; inset:0; z-index:41; display:flex; align-items:center; justify-content:center; background:rgba(30,16,6,.5); }
#journal .book { width:min(760px, calc(100vw - 24px)); max-height:calc(100vh - 30px); overflow:auto; background:linear-gradient(#fffaf0, #f6e6c4); border:6px solid #7a4a1a; border-radius:18px; padding:12px 16px; color:#3a2008; box-shadow:0 12px 36px rgba(0,0,0,.45); }
#journal header { display:flex; gap:8px; align-items:center; } #journal header h2 { margin:0; flex:1; font-size:22px; }
#journal button { font:inherit; font-weight:800; border:2px solid #7a4a1a; border-radius:9px; background:#ffd98a; padding:3px 10px; cursor:pointer; }
#journal button.tab.on { background:#7a4a1a; color:#fff; } #journal button:disabled { opacity:.45; cursor:default; }
#journal .q { display:grid; grid-template-columns:34px 1fr auto; gap:8px; align-items:center; background:#fff; border:2px solid #d9b98a; border-radius:12px; padding:8px 10px; margin:8px 0; }
#journal .q.cur { border-color:#e2a52f; background:#fff6d8; box-shadow:0 0 0 3px rgba(226,165,47,.25); } #journal .q.lock { opacity:.5; }
#journal .q .ic { font-size:24px; text-align:center; } #journal .q b { font-size:16px; } #journal .q .vi { font-size:13px; color:#6a4a20; }
#journal .q .rw { font-size:12px; font-weight:800; color:#9a6a00; } #journal .bar { height:8px; background:#eadcbc; border-radius:5px; margin-top:4px; overflow:hidden; } #journal .bar u { display:block; height:100%; background:#5fb84a; }
#journal .note { font-size:13px; color:#6a4a20; margin:6px 0; }
`;

export class Journal {
  /** api: { profile(), today(), claimMain(id), claimDaily(id) } */
  constructor(api) {
    this.api = api; this.tab = 'main';
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.btn = document.createElement('button'); this.btn.id = 'jbtn'; this.btn.className = 'hidden'; document.body.appendChild(this.btn);
    this.el = document.createElement('div'); this.el.id = 'journal'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.btn.onclick = () => this.show();
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) { if (e.target === this.el) this.close(); return; }
      if (b.dataset.a === 'close') return this.close();
      if (b.dataset.a === 'tab') this.tab = b.dataset.v;
      if (b.dataset.a === 'main') this.api.claimMain(b.dataset.v);
      if (b.dataset.a === 'daily') this.api.claimDaily(b.dataset.v);
      this.render();
    });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  show(tab) { if (tab) this.tab = tab; this.el.classList.remove('hidden'); this.render(); }
  close() { this.el.classList.add('hidden'); if (this.api.onClose) this.api.onClose(); }
  key(code) { if (code === 'KeyN' && !this.open) { this.show(); return true; } if (this.open && (code === 'Escape' || code === 'KeyN' || code === 'KeyE')) { this.close(); return true; } return this.open; }
  /** The button under the HUD: how many rewards wait to be claimed. */
  sync() {
    const p = this.api.profile(); if (!p) { this.btn.classList.add('hidden'); return; }
    const day = this.api.today(), d = dailyOf(p, day), ready = MAIN.filter((q) => q.done(p) && !mainState(p)[q.id]).length + d.ids.filter((id) => !d.claimed[id] && (d.prog[id] || 0) >= DAILY.find((q) => q.id === id).need).length;
    const html = `📜 Nhiệm vụ (N)${ready ? `<span class="dot">${ready}</span>` : ''}`; if (this.btn.innerHTML !== html) this.btn.innerHTML = html;
    this.btn.classList.remove('hidden'); if (this.open) this.render();
  }
  render() {
    const p = this.api.profile(), day = this.api.today(), cur = mainCurrent(p), claimed = mainState(p);
    let body = '';
    if (this.tab === 'main') {
      let seenCur = false;
      body = `<div class="note">Nhiệm vụ chính tuyến: làm lần lượt để lên cấp và mở map mới. Xong việc nào bấm <b>Nhận thưởng</b>.</div>` + MAIN.map((q) => {
        const done = q.done(p), isCur = q === cur, lock = !done && !isCur && seenCur; if (isCur) seenCur = true;
        const reward = [q.gold && `${q.gold} vàng`, q.exp && `${q.exp} EXP`, q.unlock && `mở ${q.unlock}`].filter(Boolean).join(' · ');
        return `<div class="q ${isCur ? 'cur' : ''} ${lock ? 'lock' : ''}"><span class="ic">${done ? '✅' : isCur ? '⭐' : '🔒'}</span><div><b>${q.en}</b><div class="vi">${lock ? 'Làm xong nhiệm vụ trước để mở.' : q.vi}</div><div class="rw">Thưởng: ${reward}</div></div>
          <div>${done ? (claimed[q.id] ? '<span class="rw">Đã nhận</span>' : `<button data-a="main" data-v="${q.id}">Nhận thưởng</button>`) : ''}</div></div>`;
      }).join('');
    } else {
      const d = dailyOf(p, day), r = dailyReward(p);
      body = `<div class="note">Mỗi ngày 3 việc mới. Mỗi việc thưởng ${r.gold} vàng, ${r.exp} EXP; xong cả 3 được thêm 30 vàng.</div>` + d.ids.map((id) => {
        const q = DAILY.find((x) => x.id === id), n = d.prog[id] || 0, ok = n >= q.need;
        return `<div class="q ${ok && !d.claimed[id] ? 'cur' : ''}"><span class="ic">${d.claimed[id] ? '✅' : ok ? '🎁' : '📅'}</span><div><b>${q.en}</b><div class="vi">${q.vi}</div><div class="bar"><u style="width:${Math.round(n / q.need * 100)}%"></u></div><div class="rw">${n}/${q.need}</div></div>
          <div>${d.claimed[id] ? '<span class="rw">Đã nhận</span>' : `<button data-a="daily" data-v="${id}" ${ok ? '' : 'disabled'}>Nhận thưởng</button>`}</div></div>`;
      }).join('');
    }
    this.el.innerHTML = `<div class="book"><header><span style="font-size:28px">📜</span><h2>Sổ nhiệm vụ</h2><button class="tab ${this.tab === 'main' ? 'on' : ''}" data-a="tab" data-v="main">Chính tuyến</button>
      <button class="tab ${this.tab === 'daily' ? 'on' : ''}" data-a="tab" data-v="daily">Hằng ngày</button><button data-a="close">✕</button></header>${body}</div>`;
  }
}
