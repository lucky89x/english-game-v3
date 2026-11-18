// Admin panel (18/11: "an admin account, password 321, to go everywhere and check every quest").
// Only a profile marked admin sees the 🛠 button (and F2). From here a grown-up can jump to any place of any map,
// set the level, add gold, unlock everything, move the village story to any step, reset the forest quest, hunts and
// daily game limits, change the grade, and turn on "no damage". The password only keeps children from opening it
// by accident: it is not real security (anyone can read the game's files).
export const ADMIN_PASS = '321';
const STEPS = [['arrive', 'Gặp Tom lần đầu'], ['letter_find', 'Tìm bức thư'], ['letter_return', 'Mang thư về'], ['jars', 'Hũ chữ của Ben'], ['tom_bridge', 'Tom báo cầu gãy'],
  ['bridge', 'Gặp Sam ở cầu'], ['gather', 'Tìm dây, gỗ, rìu'], ['plan', 'Pip đọc kế hoạch'], ['open', 'Báo Tom (mở rừng)'], ['done', 'Xong Chương I']];
const CSS = `
#admin { position:fixed; right:14px; top:300px; z-index:45; width:min(420px, calc(100vw - 28px)); max-height:calc(100vh - 320px); overflow:auto; background:#1f2a36; color:#eaf2ff;
  border:3px solid #6a8ab0; border-radius:14px; padding:10px 12px; font:13px/1.35 system-ui, sans-serif; box-shadow:0 8px 24px rgba(0,0,0,.4); }
#admin.hidden, #adminbtn.hidden { display:none; }
#admin h3 { margin:2px 0 6px; font-size:15px; } #admin h4 { margin:10px 0 4px; font-size:13px; color:#9cc4ff; }
#admin button, #admin select, #admin input { font:inherit; border:1px solid #6a8ab0; border-radius:7px; background:#2c3d52; color:#fff; padding:3px 7px; margin:2px 2px 2px 0; cursor:pointer; }
#admin button:hover { background:#3d5674; } #admin .row { display:flex; flex-wrap:wrap; align-items:center; gap:2px; }
#adminbtn { position:fixed; right:14px; top:260px; z-index:44; font:700 14px system-ui; border:2px solid #6a8ab0; border-radius:10px; background:#1f2a36; color:#fff; padding:5px 10px; cursor:pointer; }
`;

export class AdminPanel {
  /** api: { profile(), places() -> [{region, name, x, z}], go(region, x, z), unlockAll(), setStep(step), resetForest(), setGrade(g),
   *         setLevel(n), addGold(n), changed(), toast(t) } */
  constructor(api) {
    this.api = api;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.btn = document.createElement('button'); this.btn.id = 'adminbtn'; this.btn.className = 'hidden'; this.btn.textContent = '🛠 Admin (F2)'; document.body.appendChild(this.btn);
    this.el = document.createElement('div'); this.el.id = 'admin'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.btn.onclick = () => this.toggle();
    this.el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) this.act(b.dataset.a, b.dataset.v); });
  }
  /** Shows the button only for the admin profile. */
  sync() { const p = this.api.profile(); const on = !!(p && p.admin); this.btn.classList.toggle('hidden', !on); if (!on) this.el.classList.add('hidden'); }
  toggle() { const p = this.api.profile(); if (!p || !p.admin) return; this.el.classList.toggle('hidden'); if (!this.el.classList.contains('hidden')) this.render(); }
  key(code) { if (code === 'F2') { this.toggle(); return true; } return false; }
  render() {
    const p = this.api.profile(), places = this.api.places(), by = {};
    for (const pl of places) (by[pl.region] = by[pl.region] || []).push(pl);
    const step = (p.quests.village && p.quests.village.step) || 'arrive';
    this.el.innerHTML = `<h3>🛠 Quản trị · ${p.name} · lớp ${p.grade} · cấp ${p.stats.level} · ${p.stats.gold} vàng <button data-a="close" style="float:right">✕</button></h3>
      <h4>Nhân vật</h4><div class="row">Cấp: <input id="adlv" type="number" min="1" max="60" value="${p.stats.level}" style="width:60px"><button data-a="level">Đặt cấp</button>
        <button data-a="gold" data-v="1000">+1000 vàng</button><button data-a="heal">Hồi đầy máu</button>
        <button data-a="god">${p.god ? '✔ ' : ''}Không mất máu</button></div>
      <div class="row">Lớp: ${[6, 7, 8, 9].map((g) => `<button data-a="grade" data-v="${g}">${g === p.grade ? '✔ ' : ''}Lớp ${g}</button>`).join('')}</div>
      <h4>Mở khóa</h4><div class="row"><button data-a="unlock">Mở hết (rừng, cầu, Map 2, boss, cổng Cú Mèo)</button><button data-a="limits">Xóa giới hạn mini game hôm nay</button>
        <button data-a="daily">Mở lại rương + bong bóng hôm nay</button></div>
      <h4>Nhiệm vụ làng (Chương I)</h4><div class="row">${STEPS.map(([k, t]) => `<button data-a="step" data-v="${k}">${k === step ? '✔ ' : ''}${t}</button>`).join('')}</div>
      <div class="row"><button data-a="forest">Làm lại nhiệm vụ pha lê Rừng Ký Ức</button><button data-a="hunts">Làm lại 3 bảng săn quái</button></div>
      ${Object.entries(by).map(([r, list]) => `<h4>Đi tới · ${r === 'village' ? 'Làng Khởi Đầu (Map 1)' : r === 'forest' ? 'Rừng Ký Ức' : r === 'harbor' ? 'Cảng Mặt Trời (Map 2)' : r}</h4><div class="row">${list.map((pl, i) => `<button data-a="go" data-v="${r}|${i}">${pl.name}</button>`).join('')}</div>`).join('')}`;
    this.list = by;
  }
  act(a, v) {
    const p = this.api.profile(), api = this.api;
    if (a === 'close') { this.el.classList.add('hidden'); return; }
    if (a === 'level') { const n = Math.max(1, Math.min(60, Number(this.el.querySelector('#adlv').value) || 1)); api.setLevel(n); api.toast(`Cấp ${n}`); }
    if (a === 'gold') { api.addGold(Number(v)); }
    if (a === 'heal') { p.stats.hp = undefined; api.toast('Đầy máu'); }
    if (a === 'god') { p.god = !p.god; api.toast(p.god ? 'Không mất máu: bật' : 'Không mất máu: tắt'); }
    if (a === 'grade') { api.setGrade(Number(v)); return; }
    if (a === 'unlock') { api.unlockAll(); api.toast('Đã mở hết'); }
    if (a === 'limits') { delete p.plays; api.toast('Mini game được thưởng đầy đủ lại'); }
    if (a === 'daily') { p.chests = {}; p.spots = {}; api.toast('Rương và bong bóng chữ mở lại'); }
    if (a === 'step') { api.setStep(v); api.toast('Nhiệm vụ làng: ' + (STEPS.find((s) => s[0] === v) || [, v])[1]); }
    if (a === 'forest') { api.resetForest(); api.toast('Nhiệm vụ pha lê làm lại từ đầu'); }
    if (a === 'hunts') { delete p.hunt; delete p.hunt2; delete p.hunt3; api.toast('Bảng săn quái làm lại'); }
    if (a === 'go') { const [r, i] = v.split('|'), pl = this.list[r][Number(i)]; api.go(pl.region, pl.x, pl.z); }
    api.changed(); this.render();
  }
}
