// The treasure map card (phím M on Treasure Isle, 19/11): the map is a few English sentences. Listen to them, read them,
// walk the steps (one step = one metre; north is up on the minimap) and press E to dig. A hint shows the Vietnamese.
import { Panel } from './panel.js';
import { MAX_DAILY, state } from '../core/treasure.js';

export class TreasurePanel {
  /** api: { profile(), map() -> the current map or null, speak(text) } */
  constructor(api) { this.api = api; this.hint = false; this.panel = new Panel({ id: 'trwin', onAction: (a) => this.act(a) }); }
  get open() { return this.panel.open; }
  key(code) { return this.panel.key(code); }
  show() { this.hint = false; this.draw(true); }
  act(a) { if (a === 'hint') this.hint = !this.hint; if (a === 'say') { const m = this.api.map(); if (m) this.api.speak(m.lines.join(' ')); } this.draw(); }
  draw(first) {
    const m = this.api.map(), t = state(this.api.profile());
    const body = m ? `<div style="background:#f6e6b8;border:3px dashed #8a5a2a;border-radius:10px;padding:10px 14px;font-size:18px;font-weight:700;line-height:1.5;color:#4a2a10">${m.lines.map((l) => `<div>${l}</div>`).join('')}</div>
      ${this.hint ? `<div class="note" style="font-size:14px;margin:8px 0">💡 ${m.vi.join('<br>')}</div>` : ''}
      <div class="row"><button data-a="say">🔊 Nghe</button><button data-a="hint" class="${this.hint ? 'on' : ''}">💡 Gợi ý tiếng Việt</button></div>
      <div class="note"><b>La bàn:</b> north ↑ (lên trên bản đồ nhỏ) · south ↓ · east → · west ←. <b>1 step = 1 mét.</b> Đi từng bước theo bản đồ, tới nơi bấm <b>E</b> để đào. Đào sai: kho báu sẽ nói "hot / warm / cool / cold" cho con biết gần hay xa.</div>`
      : `<div class="note" style="font-size:15px">Hôm nay con đã tìm đủ ${MAX_DAILY} kho báu rồi. Ngày mai sẽ có bản đồ mới. 🏴‍☠️</div>`;
    const head = `<div class="note">Kho báu hôm nay: ${Math.min(t.n, MAX_DAILY)}/${MAX_DAILY} · Tổng đã tìm: ${t.total}</div>`;
    if (first) this.panel.show('🗺️', 'Treasure map · Bản đồ kho báu', head + body); else this.panel.draw('🗺️', 'Treasure map · Bản đồ kho báu', head + body);
  }
}
