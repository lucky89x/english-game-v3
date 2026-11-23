// The world card and the world map (24/11).
//  - chooser: pressing E at a portal lists the maps it leads to (one or more), each open or locked with what is still missing.
//  - map: the ten maps of the world with the roads between them; the maps the child can reach light up, the others show what they need.
//    The background is `assets/ui/world_map.jpg` when the user's map picture is there, a painted parchment otherwise.
import { MAPS, ROADS, canGo, mapById, neighbours, portalAt } from '../core/world.js';

const CSS = `#worldwin { position:fixed; inset:0; z-index:58; display:flex; align-items:center; justify-content:center; background:rgba(30,16,6,.55); font-family:system-ui,sans-serif; }
#worldwin.hidden { display:none; }
#worldwin .box { width:min(560px, calc(100vw - 24px)); max-height:calc(100vh - 24px); overflow:auto; position:relative; background:linear-gradient(#fffaf0,#f6e6c4); border:6px solid #7a4a1a; border-radius:18px; padding:14px 16px; color:#3a2008; box-shadow:0 12px 36px rgba(0,0,0,.45); }
#worldwin.map .box { width:min(900px, calc(100vw - 24px)); }
#worldwin h2 { margin:0 0 4px; font-size:21px; } #worldwin .sub { font-size:13px; color:#6a4a20; margin-bottom:8px; }
#worldwin .x { position:absolute; top:8px; right:10px; width:32px; height:32px; border-radius:50%; font:900 17px system-ui; padding:0; background:#e8443a; color:#fff; border:2px solid #8a2a22; cursor:pointer; }
#worldwin .route { display:flex; gap:10px; align-items:center; background:#fff; border:2px solid #d9b98a; border-radius:12px; padding:8px 10px; margin:7px 0; }
#worldwin .route.lock { opacity:.82; background:#f4eee2; } #worldwin .route .t { flex:1; } #worldwin .route b { font-size:17px; } #worldwin .route small { display:block; color:#6a4a20; }
#worldwin .route .need { color:#b0452a; font-size:13px; }
#worldwin button.go { font:800 15px system-ui; border:3px solid #2a7a3a; border-radius:11px; background:#8fdc8a; padding:6px 14px; cursor:pointer; color:#12361a; } #worldwin button.go:disabled { border-color:#999; background:#ddd; color:#777; cursor:default; }
#worldwin .world { position:relative; width:100%; aspect-ratio:16/9; border:3px solid #7a4a1a; border-radius:12px; overflow:hidden; background:radial-gradient(circle at 30% 40%, #efe0b2, #d9c28a 60%, #c4a870); }
#worldwin .world img.bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; } #worldwin .world svg { position:absolute; inset:0; width:100%; height:100%; }
#worldwin .node { position:absolute; transform:translate(-50%,-50%); width:76px; text-align:center; font:800 11px system-ui; cursor:pointer; }
#worldwin .node i { display:block; margin:0 auto 2px; width:36px; height:36px; border-radius:50%; border:3px solid #7a4a1a; background:#bba; font:900 17px/30px system-ui; font-style:normal; color:#fff; }
#worldwin .node.open i { background:#3fae52; border-color:#1f6a30; } #worldwin .node.lock i { background:#c8a14a; border-color:#7a5a1a; } #worldwin .node.soon i { background:#9a948a; border-color:#6a665e; opacity:.8; }
#worldwin .node span { display:block; background:rgba(255,248,226,.92); border-radius:6px; padding:1px 3px; color:#3a2008; } #worldwin .node.here i { box-shadow:0 0 0 4px #fff, 0 0 0 7px #e8443a; }
#worldwin .info { margin-top:8px; min-height:68px; font-size:14px; } #worldwin .info .need { color:#b0452a; }
#warp { position:fixed; inset:0; z-index:70; background:#fff; opacity:0; pointer-events:none; transition:opacity .35s; } #warp.on { opacity:1; pointer-events:auto; }`;

export class WorldUI {
  /** api: { profile(), here() -> region id, go(to) -> Promise, sfx(name) } */
  constructor(api) {
    this.api = api; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'worldwin'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.warp = document.createElement('div'); this.warp.id = 'warp'; document.body.appendChild(this.warp);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'), n = e.target.closest('.node');
      if (e.target === this.el || (b && b.dataset.a === 'close')) { this.hide(); return; }
      if (b && b.dataset.a === 'go') { this.travel(b.dataset.v); return; }
      if (n) { this.sel = n.dataset.id; this.drawInfo(); }
    });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  hide() { this.el.classList.add('hidden'); }
  /** The portal card: routes = [{ to, map, ok, missing[] }]. */
  chooser(routes, title = 'Cổng dịch chuyển') {
    this.mode = 'portal'; this.el.className = '';
    const rows = routes.map((r) => `<div class="route ${r.ok ? '' : 'lock'}"><div class="t"><b>${r.ok ? '✨' : '🔒'} ${r.map.vi}</b><small>${r.map.en} · cấp ${r.map.lv[0]}–${r.map.lv[1]}</small>${r.ok ? '' : `<div class="need">${r.missing.join(' ')}</div>`}</div><button class="go" data-a="go" data-v="${r.to}" ${r.ok ? '' : 'disabled'}>${r.ok ? 'Đi' : 'Khóa'}</button></div>`).join('');
    this.el.innerHTML = `<div class="box"><button class="x" data-a="close" title="Đóng">✕</button><h2>🌀 ${title}</h2><div class="sub">${routes.length > 1 ? 'Hai đường đi: chọn nơi con muốn tới.' : 'Con muốn đi tới nơi này?'}</div>${rows}</div>`;
  }
  /** The world map. Travelling from it needs a portal: the button shows only next to the right portal. */
  map(near = null) {
    this.mode = 'map'; this.el.className = 'map'; this.near = near; this.sel = this.sel || this.api.here();
    const p = this.api.profile(), here = this.api.here();
    const pos = (m) => `left:${m.at[0] * 100}%;top:${m.at[1] * 100}%`;
    const lines = ROADS.map((r) => { const a = mapById(r.a), b = mapById(r.b), live = a.built && b.built; return `<line x1="${a.at[0] * 100}%" y1="${a.at[1] * 100}%" x2="${b.at[0] * 100}%" y2="${b.at[1] * 100}%" stroke="${live ? '#7a4a1a' : '#8a8478'}" stroke-width="${live ? 4 : 3}" stroke-dasharray="${live ? '' : '7 6'}" stroke-linecap="round" opacity=".85"/>`; }).join('');
    const nodes = MAPS.map((m) => { const st = !m.built ? 'soon' : (m.id === here || neighbours(m.id).some((n) => canGo(p, n, m.id).ok && (n === 'village' || n === here))) || (p && p.admin) ? 'open' : 'lock'; return `<div class="node ${st} ${m.id === here ? 'here' : ''}" data-id="${m.id}" style="${pos(m)}"><i>${m.no}</i><span>${m.vi.split(' · ')[0]}</span></div>`; }).join('');
    this.el.innerHTML = `<div class="box"><button class="x" data-a="close" title="Đóng">✕</button><h2>🌍 Bản đồ thế giới</h2><div class="sub">Mười vùng đất nối với nhau bằng các cổng dịch chuyển. Bấm vào một vùng để xem.</div>
      <div class="world"><img class="bg" src="./assets/ui/world_map.jpg" alt="" onerror="this.remove()"><svg>${lines}</svg>${nodes}</div><div class="info"></div></div>`;
    this.drawInfo();
  }
  drawInfo() {
    const box = this.el.querySelector('.info'); if (!box) return; const m = mapById(this.sel), p = this.api.profile(), here = this.api.here();
    this.el.querySelectorAll('.node').forEach((n) => n.style.outline = n.dataset.id === this.sel ? '2px dashed #e8443a' : '');
    if (!m) { box.textContent = ''; return; }
    let body = '';
    if (!m.built) body = '<div class="need">Vùng này sắp mở, đang được xây.</div>';
    else if (m.id === here) body = '<div>📍 Con đang ở đây.</div>';
    else { const c = canGo(p, here, m.id); const portal = this.near; const rt = portal && portal.routes.includes(m.id);
      body = c.built && c.ok ? (rt ? `<button class="go" data-a="go" data-v="${m.id}">Đi tới ${m.vi}</button>` : '<div>Đường đã mở. Hãy tới cổng dịch chuyển ở rìa bản đồ để đi.</div>') : `<div class="need">🔒 ${c.missing.join(' ')}</div>`; }
    box.innerHTML = `<b style="font-size:17px">${m.no}. ${m.vi}</b> <small>(${m.en} · cấp ${m.lv[0]}–${m.lv[1]})</small>${body}`.replace(/<\/small>(?=<)/, '</small><br>');
  }
  /** Fades to white, runs the move, fades back. */
  async travel(to) {
    this.hide(); this.api.sfx('fanfare'); this.warp.classList.add('on'); await new Promise((r) => setTimeout(r, 380));
    try { await this.api.go(to); } finally { this.warp.classList.remove('on'); }
  }
  /** Called with the hero's place: the portal he stands at (or null). */
  nearPortal(region, x, z) { return portalAt(region, x, z); }
}
