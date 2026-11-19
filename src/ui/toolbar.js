// A row of small round buttons under the quest button (19/11): Sea Dex, wardrobe, pet, treasure map, family ship.
// Each shows once its feature is open; the key that also opens it is written in the tooltip.
const CSS = `#xbar { position:fixed; left:14px; top:196px; z-index:25; display:flex; gap:6px; flex-wrap:wrap; max-width:230px; }
#xbar.hidden { display:none; } #xbar button { width:44px; height:44px; font-size:22px; border:3px solid #2f7fa8; border-radius:50%; background:#e4f6ff; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.25); position:relative; }
#xbar button:hover { background:#fff3c0; } #xbar button.hidden { display:none; } #xbar .dot { position:absolute; right:-4px; top:-4px; min-width:16px; border-radius:8px; background:#e8443a; color:#fff; font:800 11px system-ui; text-align:center; }`;
export class Toolbar {
  /** items: [{ id, icon, tip, show(profile) -> bool, badge?(profile) -> n, click() }] */
  constructor(items) {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.items = items; this.el = document.createElement('div'); this.el.id = 'xbar'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.btn = {}; for (const it of items) { const b = document.createElement('button'); b.id = 'xb-' + it.id; b.title = it.tip; b.innerHTML = it.icon; b.onclick = () => it.click(); b.className = 'hidden'; this.el.appendChild(b); this.btn[it.id] = b; }
  }
  sync(profile) {
    if (!profile) { this.el.classList.add('hidden'); return; }
    let any = false;
    for (const it of this.items) {
      const on = !!it.show(profile), b = this.btn[it.id]; b.classList.toggle('hidden', !on); any = any || on;
      const n = on && it.badge ? it.badge(profile) : 0, html = it.icon + (n ? `<span class="dot">${n}</span>` : ''); if (b.innerHTML !== html) b.innerHTML = html;
    }
    this.el.classList.toggle('hidden', !any);
  }
}
