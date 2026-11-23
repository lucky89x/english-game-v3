// The wardrobe card (phím U, 19/11): the pieces earned at the Style Boutique and the Beauty Salon; click one to put it on Ngọc or take it off.
import { Panel } from './panel.js';
import { KINDS, SLOTS, wardrobe, parse, itemName, wear, JEWEL_HEX } from '../core/wardrobe.js';
import { COLORS } from './style.js';
import { HEROES, heroOf, owns, wearOutfit } from '../core/heroes.js';

export class WardrobePanel {
  /** api: { profile(), changed(), mirror() } */
  constructor(api) { this.api = api; this.panel = new Panel({ id: 'wardwin', onAction: (a, v) => this.act(a, v) }); }
  get open() { return this.panel.open; }
  key(code) { return this.panel.key(code); }
  act(a, v) { const p = this.api.profile(); if (a === 'mirror') { this.panel.close(); this.api.mirror(); return; } if (a === 'wear') wear(p, v); if (a === 'outfit') wearOutfit(p, +v); if (a === 'off') wardrobe(p).worn = {}; this.api.changed(); this.draw(); }
  show() { this.draw(true); }
  draw(first) {
    const p = this.api.profile(), w = wardrobe(p), owned = w.owned.map(parse).filter(Boolean), hero = heroOf(p);
    if (hero) {      // (22/11) the modular heroes: the outfits bought at Mia's, pressing one puts it on
      const H = HEROES[hero.id], list = H.outfits.map((o, i) => (owns(p, i) ? `<button class="it ${hero.outfit === i ? 'on' : ''}" data-a="outfit" data-v="${i}" style="cursor:pointer"><img src="./assets/ui/hero_${hero.id}_${i}.png" alt="" style="width:72px;height:108px;object-fit:contain"><b>${o.en}</b><small>${o.vi}</small></button>` : '')).join('');
      const head = `<div class="row"><span class="note">${H.name}: đã có ${hero.owned.length}/${H.outfits.length} bộ. Mua thêm ở <b>Tiệm may của cô Mia</b>.</span><button data-a="mirror">🪞 Gương thần (đổi nhân vật)</button></div>`;
      if (first) this.panel.show('👗', 'Wardrobe · Tủ đồ', `${head}<div class="grid">${list}</div>`); else this.panel.draw('👗', 'Wardrobe · Tủ đồ', `${head}<div class="grid">${list}</div>`); return;
    }
    const body = owned.length ? SLOTS.map((s) => { const list = w.owned.filter((id) => (parse(id) || {}).slot === s.id); if (!list.length) return '';
      return `<h3>${s.en} · ${s.vi}</h3><div class="grid">${list.map((id) => { const it = parse(id), on = w.worn[s.id] === id;
        return `<button class="it ${on ? 'on' : ''}" data-a="wear" data-v="${id}" style="cursor:pointer"><span class="ic" style="text-shadow:0 0 0 ${(COLORS[it.color] || JEWEL_HEX[it.color])}">${KINDS[it.kind].icon}</span><b>${itemName(id)}</b><span style="display:inline-block;width:46px;height:8px;border-radius:4px;background:${(COLORS[it.color] || JEWEL_HEX[it.color])};border:1px solid #888"></span><br><small>${on ? '✔ đang mặc' : 'bấm để mặc'}</small></button>`; }).join('')}</div>`; }).join('')
      : '<div class="note">Tủ đồ còn trống. Mua quần áo, trang sức ở <b>Tiệm may của cô Mia</b> trong làng, hoặc vào <b>Style Boutique</b> và <b>Beauty Salon</b> ở cảng: phục vụ khách <b>hoàn hảo</b> (đúng hết mọi yêu cầu) để nhận mũ, kính, khăn, túi, giày, nơ cài tóc, băng đô, vòng tay đúng màu khách gọi.</div>';
    const head = `<div class="row"><span class="note">Đã có ${owned.length} món. Mỗi món có tên tiếng Anh: màu + loại (ví dụ: pink hat).</span><button data-a="mirror">🪞 Gương thần</button><button data-a="off">Cởi hết</button></div>`;
    if (first) this.panel.show('👗', 'Wardrobe · Tủ đồ', head + body); else this.panel.draw('👗', 'Wardrobe · Tủ đồ', head + body);
  }
}
