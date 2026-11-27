// (27/11, turn 69) "Chơi chung": the panel where a child opens a room or enters a friend's code, sees who is in the room,
// and picks one of the ready-made English lines to say (key C). There is no box for free typing but the room code.
import { PHRASES, CODE_LEN, ROOM_MAX } from '../core/net.js';

const CSS = `
#online { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index:60; width:min(520px, calc(100vw - 24px)); max-height:calc(100vh - 40px); overflow:auto;
  background:#fff8e8; color:#3a2410; border:4px solid #2f7fa8; border-radius:18px; padding:14px 18px 16px; font:16px/1.4 "Nunito", system-ui, sans-serif; box-shadow:0 12px 40px rgba(0,0,0,.45); }
#online.hidden, #saybar.hidden { display:none; }
#online h3 { margin:0 0 8px; font-size:21px; color:#1d5f86; } #online .x { float:right; }
#online button { font:700 16px "Nunito", system-ui, sans-serif; border:3px solid #2f7fa8; border-radius:12px; background:#e4f6ff; color:#1d3d55; padding:7px 14px; margin:4px 6px 4px 0; cursor:pointer; }
#online button:hover { background:#fff3c0; } #online button.go { background:#bfeec2; border-color:#3a9a48; } #online button.out { background:#ffe0dc; border-color:#c4584c; }
#online input { font:800 24px/1 ui-monospace, monospace; letter-spacing:5px; text-transform:uppercase; width:190px; padding:7px 10px; border:3px solid #2f7fa8; border-radius:12px; text-align:center; }
#online .code { font:800 40px/1.1 ui-monospace, monospace; letter-spacing:9px; color:#b3541e; margin:6px 0 2px; user-select:all; }
#online .note { color:#b23a2e; font-weight:700; margin:6px 0; } #online .tip { color:#6a5a48; font-size:13.5px; margin-top:8px; }
#online ul { list-style:none; padding:0; margin:6px 0; } #online li { padding:5px 9px; margin:3px 0; border-radius:9px; background:#eef7ff; } #online li.far { opacity:.72; background:#f1eee6; }
#saybar { position:fixed; left:50%; bottom:118px; transform:translateX(-50%); z-index:58; width:min(640px, calc(100vw - 20px)); display:grid; grid-template-columns:1fr 1fr; gap:5px;
  background:rgba(255,248,232,.97); border:3px solid #2f7fa8; border-radius:14px; padding:9px; box-shadow:0 8px 24px rgba(0,0,0,.4); }
#saybar button { text-align:left; font:700 15px "Nunito", system-ui, sans-serif; border:2px solid #9cc4dc; border-radius:9px; background:#fff; padding:6px 9px; cursor:pointer; }
#saybar button:hover { background:#fff3c0; } #saybar button small { color:#7a6a58; font-weight:600; } #saybar .h { grid-column:1 / -1; font:800 14px system-ui; color:#1d5f86; }
`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class OnlinePanel {
  /** api: { online, landVi(id) -> name of a land, sfx(name) } */
  constructor(api) {
    this.api = api; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'online'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.bar = document.createElement('div'); this.bar.id = 'saybar'; this.bar.className = 'hidden'; document.body.appendChild(this.bar);
    this.el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) this.act(b.dataset.a); });
    this.el.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT' && e.key === 'Enter') this.act('join'); if (e.key === 'Escape') this.hide(); e.stopPropagation(); });
    this.bar.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { this.api.online.say(Number(b.dataset.k)); this.hideSay(); } });
    this.bar.innerHTML = '<div class="h">💬 Chọn một câu để nói với bạn (Esc để đóng)</div>' + PHRASES.map((p, k) => `<button data-k="${k}">${esc(p.en)} <small>· ${esc(p.vi)}</small></button>`).join('');
  }
  get open() { return !this.el.classList.contains('hidden'); }
  get saying() { return !this.bar.classList.contains('hidden'); }
  show() { this.hideSay(); this.el.classList.remove('hidden'); this.render(); }
  hide() { this.el.classList.add('hidden'); }
  toggle() { if (this.open) this.hide(); else this.show(); }
  showSay() { if (!this.api.online.on) return; this.hide(); this.bar.classList.remove('hidden'); }
  hideSay() { this.bar.classList.add('hidden'); }
  /** true when the key was for the panel. */
  key(code) {
    if (this.saying) { if (code === 'Escape' || code === 'KeyC') { this.hideSay(); return true; } return false; }
    if (this.open) { if (code === 'Escape' || code === 'KeyY') { this.hide(); return true; } return true; }      // the panel takes the keys while it is open
    return false;
  }
  act(a) {
    const on = this.api.online; if (this.api.sfx) this.api.sfx('tick');
    if (a === 'close') this.hide();
    else if (a === 'new') on.create();
    else if (a === 'join') { const inp = this.el.querySelector('input'); on.join(inp ? inp.value : ''); }
    else if (a === 'again') { let last = ''; try { last = localStorage.getItem('eq-room') || ''; } catch { /* no storage */ } on.join(last); }
    else if (a === 'leave') on.leave();
    else if (a === 'say') this.showSay();
    this.render();
  }
  /** Called by the game whenever the room changed. */
  render() {
    const on = this.api.online; if (on.on && on.code) { try { localStorage.setItem('eq-room', on.code); } catch { /* no storage */ } }
    if (!this.open) return;
    const typed = (this.el.querySelector('input') || {}).value || '', head = '<h3>👫 Chơi chung với bạn <button class="x" data-a="close">✕</button></h3>';
    let last = ''; try { last = localStorage.getItem('eq-room') || ''; } catch { /* no storage */ }
    const note = on.note ? `<div class="note">${esc(on.note)}</div>` : '';
    if (!on.ready) { this.el.innerHTML = head + '<p>Máy này chưa có địa chỉ máy chủ phòng. Bố mẹ nhập địa chỉ trong bảng Quản trị (mục "Chơi chung qua mạng").</p>'; return; }
    if (on.state === 'connecting' || on.state === 'retry') { this.el.innerHTML = head + `<p>${on.state === 'retry' ? 'Mất kết nối, đang nối lại' : 'Đang vào phòng'} <b>${esc(on.code)}</b>…</p><button class="out" data-a="leave">Thôi</button>`; return; }
    if (on.on) {
      const list = on.friends;
      this.el.innerHTML = head + `<div>Mã phòng (đọc cho bạn để bạn vào):</div><div class="code">${esc(on.code)}</div>
        <div>Trong phòng: ${list.length + 1}/${ROOM_MAX} bạn</div><ul><li>🙂 <b>Con</b> · ${esc(this.api.landVi(on.r))}</li>
        ${list.map((f) => `<li class="${f.here ? '' : 'far'}">🙂 <b>${esc(f.n)}</b> · Lv ${f.lv} · ${esc(this.api.landVi(f.r))}${f.here ? ' · đang ở cùng vùng' : ''}</li>`).join('')}</ul>
        ${list.length ? '' : '<div class="tip">Chưa có ai khác. Bạn của con mở game, bấm 👫 rồi gõ mã ở trên.</div>'}
        <button class="go" data-a="say">💬 Nói một câu (C)</button><button class="out" data-a="leave">Rời phòng</button>
        <div class="tip">Hai bạn thấy nhau khi đứng cùng một vùng. Quái, nhiệm vụ và đồ đạc của mỗi bạn vẫn là của riêng bạn đó.</div>`;
      return;
    }
    this.el.innerHTML = head + `<p>Tạo một phòng rồi đọc mã cho bạn, hoặc gõ mã mà bạn đọc cho con.</p>
      <button class="go" data-a="new">➕ Tạo phòng mới</button>${last ? `<button data-a="again">↩ Vào lại phòng ${esc(last)}</button>` : ''}
      <div style="margin-top:8px">Mã phòng của bạn: <input maxlength="${CODE_LEN + 1}" value="${esc(typed)}" placeholder="${'·'.repeat(CODE_LEN)}" autocomplete="off" spellcheck="false"> <button data-a="join">Vào phòng</button></div>
      ${note}<div class="tip">Chỉ đưa mã phòng cho bạn bè con quen. Trong phòng chỉ nói được các câu tiếng Anh có sẵn của game.</div>`;
  }
}
