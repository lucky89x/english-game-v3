// The wardrobe card (phím V, 19/11): the pieces earned at the Style Boutique and the Beauty Salon; click one to put it on Ngọc or take it off.
import { Panel } from './panel.js';
import { KINDS, SLOTS, wardrobe, parse, itemName, wear } from '../core/wardrobe.js';
import { COLORS } from './style.js';

export class WardrobePanel {
  /** api: { profile(), changed() } */
  constructor(api) { this.api = api; this.panel = new Panel({ id: 'wardwin', onAction: (a, v) => this.act(a, v) }); }
  get open() { return this.panel.open; }
  key(code) { return this.panel.key(code); }
  act(a, v) { const p = this.api.profile(); if (a === 'wear') wear(p, v); if (a === 'off') wardrobe(p).worn = {}; this.api.changed(); this.draw(); }
  show() { this.draw(true); }
  draw(first) {
    const p = this.api.profile(), w = wardrobe(p), owned = w.owned.map(parse).filter(Boolean);
    const body = owned.length ? SLOTS.map((s) => { const list = w.owned.filter((id) => (parse(id) || {}).slot === s.id); if (!list.length) return '';
      return `<h3>${s.en} · ${s.vi}</h3><div class="grid">${list.map((id) => { const it = parse(id), on = w.worn[s.id] === id;
        return `<button class="it ${on ? 'on' : ''}" data-a="wear" data-v="${id}" style="cursor:pointer"><span class="ic" style="text-shadow:0 0 0 ${COLORS[it.color]}">${KINDS[it.kind].icon}</span><b>${itemName(id)}</b><span style="display:inline-block;width:46px;height:8px;border-radius:4px;background:${COLORS[it.color]};border:1px solid #888"></span><br><small>${on ? '✔ đang mặc' : 'bấm để mặc'}</small></button>`; }).join('')}</div>`; }).join('')
      : '<div class="note">Tủ đồ còn trống. Vào <b>Style Boutique</b> và <b>Beauty Salon</b> ở cảng: phục vụ khách <b>hoàn hảo</b> (đúng hết mọi yêu cầu) để nhận mũ, kính, khăn, túi, giày, nơ cài tóc, băng đô, vòng tay đúng màu khách gọi.</div>';
    const head = `<div class="row"><span class="note">Đã có ${owned.length} món. Mỗi món có tên tiếng Anh: màu + loại (ví dụ: pink hat).</span><button data-a="off">Cởi hết</button></div>`;
    if (first) this.panel.show('👗', 'Wardrobe · Tủ đồ', head + body); else this.panel.draw('👗', 'Wardrobe · Tủ đồ', head + body);
  }
}
