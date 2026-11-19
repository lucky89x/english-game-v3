// A small modal card for the Map 2 extras (Sea Dex, wardrobe, pet, treasure map): the same look as the bag and the home card.
// The caller draws the body; every <button data-a="name" data-v="value"> inside calls onAction(name, value).
const CSS = `
.xpanel { position:fixed; inset:0; z-index:42; display:flex; align-items:center; justify-content:center; background:rgba(20,30,50,.5); }
.xpanel.hidden { display:none; }
.xpanel .book { width:min(680px, calc(100vw - 24px)); max-height:calc(100vh - 30px); overflow:auto; background:linear-gradient(#f4fbff, #d8eefa); border:6px solid #2f7fa8; border-radius:18px; padding:12px 16px; color:#10303f; box-shadow:0 12px 36px rgba(0,0,0,.45); }
.xpanel header { display:flex; gap:8px; align-items:center; } .xpanel h2 { margin:0; flex:1; font-size:22px; }
.xpanel button { font:inherit; font-weight:800; border:2px solid #2f7fa8; border-radius:9px; background:#bfe6ff; padding:3px 10px; cursor:pointer; color:#10303f; }
.xpanel button:disabled { opacity:.45; cursor:default; } .xpanel button.on { background:#ffe28a; border-color:#c8782a; }
.xpanel .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:6px; margin:8px 0; }
.xpanel .it { background:#fff; border:2px solid #9ccbe4; border-radius:10px; padding:5px 7px; font-size:13px; text-align:center; }
.xpanel .it b { display:block; font-size:14px; } .xpanel .it.no { opacity:.55; border-style:dashed; } .xpanel .it.on { border-color:#c8782a; background:#fff6d0; }
.xpanel .it .ic { font-size:30px; line-height:1.2; display:block; } .xpanel .it .ic.dark { filter:brightness(0) opacity(.45); }
.xpanel .note { font-size:13px; color:#3a6a82; margin:4px 0; } .xpanel .bar { height:12px; border-radius:6px; background:#cfe3ee; overflow:hidden; margin:3px 0 7px; } .xpanel .bar i { display:block; height:100%; background:#3fae6a; }
.xpanel .row { display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0; } .xpanel h3 { margin:8px 0 2px; font-size:15px; }
body.inroom .xpanel { background:transparent; justify-content:flex-end; } body.inroom .xpanel .book { margin-right:12px; }
`;
let styled = false;
export class Panel {
  /** opts: { id, onAction(a, v), onClose() } */
  constructor({ id, onAction, onClose }) {
    if (!styled) { styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
    this.onAction = onAction; this.onClose = onClose;
    this.el = document.createElement('div'); this.el.id = id; this.el.className = 'xpanel hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if ((b && b.dataset.a === 'close') || e.target === this.el) { this.close(); return; }
      if (b && b.dataset.a && !b.disabled && this.onAction) this.onAction(b.dataset.a, b.dataset.v, b);
    });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  /** Draws the card (header with icon and title, then the body html) and shows it. */
  show(icon, title, body) { this.draw(icon, title, body); this.el.classList.remove('hidden'); }
  draw(icon, title, body) { this.el.innerHTML = `<div class="book"><header><span style="font-size:28px">${icon}</span><h2>${title}</h2><button data-a="close">✕</button></header>${body}</div>`; }
  close() { if (!this.open) return; this.el.classList.add('hidden'); if (this.onClose) this.onClose(); }
  /** Esc or E closes an open card; returns true while it is open (so the game ignores other keys). */
  key(code) { if (this.open && (code === 'Escape' || code === 'KeyE')) { this.close(); return true; } return this.open; }
}
