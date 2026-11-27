// (27/11, turn 72) The review notes panel of the admin account, on F1 ("I note what I want changed right where it is, then
// export one file"). Writing a note keeps the place by itself: the land and the spot, what the hero stands beside, the open
// talk or window, the spell just cast, and a small picture of the screen. "Chỉ vào một chỗ" lets the parent click any thing on
// the screen (a button, a line of a talk, a spot in the world) so the note says exactly which. The spell row casts any spell
// for free, slowly if wanted, to look at an effect and note about it. "Xuất file" writes every note into one .json file.
import * as N from '../core/notes.js';

const CSS = `
#notes { position:fixed; right:10px; top:56px; bottom:12px; z-index:70; width:min(430px, calc(100vw - 20px)); display:flex; flex-direction:column; background:#18222e; color:#eaf2ff; border:3px solid #f0b040;
  border-radius:14px; font:13px/1.4 system-ui, sans-serif; box-shadow:0 10px 30px rgba(0,0,0,.5); }
#notes.hidden { display:none; } #notes.picking { opacity:.25; pointer-events:none; }
#notes header { padding:8px 10px; border-bottom:1px solid #3a4c62; display:flex; gap:6px; align-items:center; flex-wrap:wrap; } #notes header b { font-size:15px; flex:1; }
#notes .body { overflow:auto; padding:8px 10px 10px; flex:1; }
#notes button, #notes select { font:inherit; border:1px solid #6a8ab0; border-radius:7px; background:#2c3d52; color:#fff; padding:3px 8px; cursor:pointer; }
#notes button:hover { background:#3d5674; } #notes button.go { background:#2f7a3a; border-color:#58c06a; font-weight:700; } #notes button.warn { background:#8a2a22; } #notes button.on { background:#b07a10; border-color:#f0b040; }
#notes textarea { width:100%; box-sizing:border-box; min-height:74px; font:14px/1.4 system-ui, sans-serif; border:2px solid #f0b040; border-radius:8px; background:#0f1620; color:#fff; padding:6px 8px; resize:vertical; }
#notes .where { background:#0f1620; border:1px solid #3a4c62; border-radius:8px; padding:5px 8px; margin:0 0 6px; color:#bcd4f0; font-size:12.5px; } #notes .where b { color:#ffd98a; }
#notes .row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin:6px 0; } #notes label { cursor:pointer; }
#notes details { margin:8px 0; border:1px solid #3a4c62; border-radius:8px; padding:4px 8px; } #notes summary { cursor:pointer; font-weight:700; color:#9cc4ff; }
#notes .spells { display:grid; grid-template-columns:repeat(4, 1fr); gap:4px; margin:6px 0; } #notes .spells button { padding:4px 2px; font-size:12px; }
#notes .spells .fire { border-color:#ff8a1e; } #notes .spells .ice { border-color:#8fe0ff; } #notes .spells .wind { border-color:#7ef0a0; } #notes .spells .thunder { border-color:#fff060; }
#notes .note { border:1px solid #3a4c62; border-left:5px solid #f0b040; border-radius:8px; padding:6px 8px; margin:6px 0; background:#1f2c3a; } #notes .note.done { opacity:.55; border-left-color:#58c06a; }
#notes .note.nice { border-left-color:#6ab0ff; } #notes .note.idea { border-left-color:#b08af0; }
#notes .note .t { white-space:pre-wrap; margin:3px 0; font-size:13.5px; } #notes .note .w { color:#9fb6d0; font-size:12px; } #notes .note img { width:120px; border-radius:6px; float:right; margin:0 0 4px 8px; cursor:zoom-in; border:1px solid #6a8ab0; }
#notes .tip { color:#8ea4bc; font-size:12px; margin-top:6px; } #notes h4 { margin:10px 0 2px; font-size:13px; color:#ffd98a; }
#notesbig { position:fixed; inset:0; z-index:80; background:rgba(0,0,0,.85); display:flex; align-items:center; justify-content:center; cursor:zoom-out; } #notesbig.hidden { display:none; } #notesbig img { max-width:94vw; max-height:92vh; border-radius:10px; }
`;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class NotesPanel {
  /** api: { allowed() -> the admin is playing, context() -> the place now (core/notes.js cleanWhere fields), capture() -> small picture (data URL) or '',
   *         pickWorld(clientX, clientY) -> { picked, px, pz } or null, go(note), spells() -> [{ id, en, vi, el }], demo(id) -> '' or why not, slow(k),
   *         marks(notes or null), guard(on) -> the hero takes no damage while the panel is open, meta() -> { build, quality, screen, gpu }, saveFile(name, text) -> where it was written or '', toast(text), sfx(name) } */
  constructor(api) {
    this.api = api; this.list = N.load(); this.pick = null; this.editing = 0; this.armed = 0; this.slow = false; this.withShot = true; this.spell = '';
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'notes'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.big = document.createElement('div'); this.big.id = 'notesbig'; this.big.className = 'hidden'; this.big.onclick = () => this.big.classList.add('hidden'); document.body.appendChild(this.big);
    this.el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) this.act(b.dataset.a, b.dataset.v); else if (e.target.tagName === 'IMG') { this.big.innerHTML = `<img src="${e.target.src}">`; this.big.classList.remove('hidden'); } });
    this.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.tagName === 'TEXTAREA') { this.act('save'); e.preventDefault(); } if (e.key === 'F1') { this.hide(); e.preventDefault(); } e.stopPropagation(); });
    this.el.addEventListener('change', (e) => { if (e.target.id === 'nshot') this.withShot = e.target.checked; });
  }
  get open() { return !this.el.classList.contains('hidden'); }
  toggle() { if (this.open) this.hide(); else this.show(); }
  show() { if (!this.api.allowed()) return; this.el.classList.remove('hidden'); this.render(); clearInterval(this.timer); this.timer = setInterval(() => this.place(), 1000); this.api.marks(this.list); if (this.api.guard) this.api.guard(true); }
  hide() { if (!this.open) return; this.el.classList.add('hidden'); clearInterval(this.timer); this.api.marks(null); if (this.api.guard) this.api.guard(false); if (this.slow) { this.slow = false; this.api.slow(1); } }
  /** The place of a note written now: where the game says the hero is, plus what was pointed at and the spell being looked at. */
  where() { const w = { ...this.api.context(), ...(this.pick || {}) }; if (this.spell) w.spell = this.spell; return N.cleanWhere(w); }
  place() { const box = this.el.querySelector('.where'); if (box && this.open) box.innerHTML = '📍 <b>Ghi chú sẽ gắn vào:</b> ' + esc(N.whereLine(this.where()) || 'chưa rõ chỗ'); }
  draft() { const t = this.el.querySelector('textarea'), k = this.el.querySelector('#nkind'), l = this.el.querySelector('#nlevel'); return { text: t ? t.value : '', kind: k ? k.value : 'other', level: l ? l.value : 'must' }; }
  act(a, v) {
    const api = this.api; if (api.sfx) api.sfx('tick');
    if (a === 'close') { this.hide(); return; }
    if (a === 'pick') { this.startPick(); return; }
    if (a === 'unpick') { this.pick = null; this.spell = ''; this.render(); return; }
    if (a === 'save') {
      const d = this.draft(); if (!d.text.trim()) { api.toast('Viết vài chữ vào ô ghi chú đã nhé'); return; }
      if (this.editing) { const n = this.list.find((x) => x.id === this.editing); if (n) { n.text = d.text.trim(); n.kind = d.kind; n.level = d.level; } this.editing = 0; }
      else { const shot = this.withShot ? api.capture() : ''; N.add(this.list, { ...d, where: this.where(), shot }); }
      const r = N.save(this.list); api.toast(!r.ok ? 'Không lưu được ghi chú (bộ nhớ trình duyệt đầy): hãy Xuất file rồi xoá bớt' : r.dropped ? `Đã lưu. Bộ nhớ gần đầy nên ${r.dropped} ảnh cũ đã bị bỏ (chữ vẫn còn)` : `Đã lưu ghi chú #${this.list[this.list.length - 1].id}`);
      this.pick = null; this.spell = ''; this.keep = { text: '', kind: d.kind, level: d.level }; this.render(); api.marks(this.list); return;      // what was pointed at and the spell looked at belong to the note just saved, not to the next one
    }
    if (a === 'edit') { const n = this.list.find((x) => x.id === Number(v)); if (n) { this.editing = n.id; this.keep = { text: n.text, kind: n.kind, level: n.level }; this.render(); const t = this.el.querySelector('textarea'); if (t) t.focus(); } return; }
    if (a === 'cancel') { this.editing = 0; this.keep = null; this.render(); return; }
    if (a === 'done') { const n = this.list.find((x) => x.id === Number(v)); if (n) { n.done = !n.done; N.save(this.list); this.render(); } return; }
    if (a === 'del') { const id = Number(v); if (this.armed !== id) { this.armed = id; this.render(); return; } this.armed = 0; N.remove(this.list, id); N.save(this.list); this.render(); api.marks(this.list); return; }
    if (a === 'go') { const n = this.list.find((x) => x.id === Number(v)); if (n) api.go(n); return; }
    if (a === 'cast') { const why = api.demo(v); if (why) api.toast(why === 'place' ? 'Ở đây không dùng phép được: ra ngoài vùng có quái rồi thử lại' : 'Chưa thử được chiêu này (' + why + ')'); else { this.spell = v; this.place(); const b = this.el.querySelector('#nspell'); if (b) b.textContent = '✏️ Ghi chú về chiêu ' + v; } return; }
    if (a === 'slow') { this.slow = !this.slow; api.slow(this.slow ? 0.25 : 1); this.keepDraft(); this.render(); return; }
    if (a === 'aboutspell') { if (!this.spell) { api.toast('Bấm một chiêu ở trên để xem trước đã'); return; } this.keepDraft(); this.keep.kind = 'vfx'; this.render(); const t = this.el.querySelector('textarea'); if (t) t.focus(); return; }
    if (a === 'export') { const text = N.exportFile(this.list, api.meta()), name = N.fileName(); const at = api.saveFile(name, text); api.toast(at ? `Đã ghi ${this.list.length} ghi chú vào: ${at}` : `Đã tải file ${name} về thư mục Tải xuống (Downloads)`); return; }
    if (a === 'copy') { const text = N.exportText(this.list); const ok = () => api.toast('Đã chép phần chữ của các ghi chú (không có ảnh): dán vào khung trò chuyện là được'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, () => this.copyOld(text, ok)); else this.copyOld(text, ok); return; }
    if (a === 'clear') { if (this.armed !== -1) { this.armed = -1; this.render(); return; } this.armed = 0; this.list.length = 0; N.save(this.list); this.render(); api.marks(this.list); }
  }
  copyOld(text, ok) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch { this.api.toast('Không chép được: dùng nút Xuất file'); } t.remove(); }
  keepDraft() { this.keep = this.draft(); }
  /** The next click anywhere on the screen names what the note is about (it does not reach the game). */
  startPick() {
    this.keepDraft(); this.el.classList.add('picking'); this.api.toast('Bấm vào thứ anh muốn ghi chú: một nút, một dòng chữ, hay một chỗ trong cảnh. Esc để thôi.');
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); }, end = () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key, true); this.el.classList.remove('picking'); setTimeout(() => document.removeEventListener('click', stop, true), 400); this.render(); };
    const down = (e) => {
      stop(e); document.addEventListener('click', stop, true);
      if (e.target.tagName === 'CANVAS') { const p = this.api.pickWorld(e.clientX, e.clientY); this.pick = p || { picked: 'một chỗ trong cảnh' }; }
      else { const box = e.target.closest('button, li, .card, .route, .node, [data-id], [data-a]') || e.target, own = box.closest('[id]'); this.pick = { picked: (box.innerText || box.alt || box.title || '').replace(/\s+/g, ' ').trim().slice(0, 200) + (own ? ` [#${own.id}]` : '') }; }
      end();
    };
    const key = (e) => { if (e.key === 'Escape') { stop(e); end(); } };
    document.addEventListener('pointerdown', down, true); document.addEventListener('keydown', key, true);
  }
  render() {
    if (!this.open) return;
    const k = this.keep || this.draft(); this.keep = null; const open = this.list.filter((n) => !n.done).length, spells = this.api.spells(), els = [...new Set(spells.map((s) => s.el))];
    const opts = (table, cur) => table.map(([id, vi]) => `<option value="${id}"${id === cur ? ' selected' : ''}>${esc(vi)}</option>`).join('');
    const lab = !!(this.el.querySelector('details') || {}).open;
    this.el.innerHTML = `<header><b>📝 Sổ góp ý (F1) · ${open} ghi chú</b><button class="go" data-a="export">💾 Xuất file</button><button data-a="copy">📋 Chép chữ</button><button data-a="close">✕</button></header>
      <div class="body"><div class="where"></div>
        <div class="row"><button data-a="pick">🎯 Chỉ vào một chỗ trên màn hình</button>${this.pick || this.spell ? '<button data-a="unpick">Bỏ chỗ đã chỉ</button>' : ''}</div>
        <div class="row"><select id="nkind">${opts(N.KINDS, k.kind)}</select><select id="nlevel">${opts(N.LEVELS, k.level)}</select></div>
        <textarea placeholder="Viết điều anh muốn sửa ở chỗ này… (Ctrl+Enter để lưu)">${esc(k.text)}</textarea>
        <div class="row"><button class="go" data-a="save">${this.editing ? '✔ Lưu sửa ghi chú #' + this.editing : '✔ Lưu ghi chú'}</button>${this.editing ? '<button data-a="cancel">Thôi sửa</button>' : `<label><input type="checkbox" id="nshot"${this.withShot ? ' checked' : ''}> kèm ảnh màn hình</label>`}</div>
        <details${lab ? ' open' : ''}><summary>✨ Xem hiệu ứng chiêu (không tốn mana, hệ nào cũng dùng được)</summary>
          ${els.map((el) => `<div class="spells">${spells.filter((s) => s.el === el).map((s) => `<button class="${el}" data-a="cast" data-v="${s.id}" title="${esc(s.vi || '')}">${esc(s.en || s.id)}</button>`).join('')}</div>`).join('')}
          <div class="row"><button data-a="slow" class="${this.slow ? 'on' : ''}">🐢 Xem chậm ¼ ${this.slow ? '(đang bật)' : ''}</button><button data-a="aboutspell" id="nspell">✏️ Ghi chú về chiêu ${esc(this.spell || '…')}</button></div>
          <div class="tip">Đứng gần vài con quái rồi bấm tên chiêu. Muốn xem kỹ thì bật "Xem chậm". Ghi chú sẽ ghi rõ là nói về chiêu nào.</div></details>
        <h4>Các ghi chú đã lưu (${this.list.length})</h4>
        ${this.list.length ? [...this.list].reverse().map((n) => `<div class="note ${n.level}${n.done ? ' done' : ''}">${n.shot ? `<img src="${n.shot}" alt="">` : ''}<b>#${n.id}</b> · ${esc(N.kindVi(n.kind))} · ${esc(N.levelVi(n.level))}${n.done ? ' · ✓ xong' : ''}
          <div class="t">${esc(n.text)}</div><div class="w">${esc(N.whereLine(n.where))}</div>
          <div class="row"><button data-a="go" data-v="${n.id}">Tới đó</button><button data-a="edit" data-v="${n.id}">Sửa</button><button data-a="done" data-v="${n.id}">${n.done ? 'Chưa xong' : '✓ Xong'}</button><button data-a="del" data-v="${n.id}" class="${this.armed === n.id ? 'warn' : ''}">${this.armed === n.id ? 'Bấm lần nữa để xoá' : 'Xoá'}</button></div></div>`).join('') : '<div class="tip">Chưa có ghi chú nào. Đi tới chỗ anh muốn sửa, viết vào ô ở trên rồi bấm Lưu.</div>'}
        ${this.list.length ? `<div class="row"><button data-a="clear" class="${this.armed === -1 ? 'warn' : ''}">${this.armed === -1 ? 'Bấm lần nữa để xoá HẾT ghi chú' : '🗑 Xoá hết (sau khi đã xuất file)'}</button></div>` : ''}
        <div class="tip">Ghi chú được giữ trong máy này cho tới khi anh xoá. "Xuất file" gom tất cả (cả ảnh) vào một file .json: gửi file đó cho Claude. "Chép chữ" chỉ lấy phần chữ để dán thẳng vào khung trò chuyện. Ảnh chỉ chụp cảnh 3D, không chụp các bảng và hộp thoại (chữ của hộp thoại được ghi kèm).</div></div>`;
    this.place();
  }
}
