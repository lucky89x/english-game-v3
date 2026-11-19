// The Sea Dex (phím G, 19/11): every sea creature met so far with its English name and meaning; the others are dark
// silhouettes. Fish come from the fishing pier, the monsters from the hunt. Milestones pay a bonus once.
import { Panel } from './panel.js';
import { FISH, MONSTER_ENTRIES, RARITY, RARITY_VI, MILESTONES, DEX_TOTAL, dex, dexCount, bucket, entry } from '../core/sea.js';

const COL = ['#5a6a78', '#2f8a3c', '#2f6fd0', '#c8782a'];
export class DexPanel {
  /** api: { profile(), onClose() } */
  constructor(api) { this.api = api; this.panel = new Panel({ id: 'dexwin', onClose: () => api.onClose && api.onClose() }); }
  get open() { return this.panel.open; }
  key(code) { return this.panel.key(code); }
  show() {
    const p = this.api.profile(), d = dex(p), n = dexCount(p), next = MILESTONES.find((m) => n < m.n);
    const tile = (e) => { const f = d[e.id]; return `<div class="it ${f ? '' : 'no'}"><span class="ic ${f ? '' : 'dark'}">${e.icon}</span><b>${f ? e.en : '???'}</b>${f ? e.vi : 'chưa gặp'}<br><small style="color:${COL[e.r || 0]}">${RARITY[e.r || 0]} · ${RARITY_VI[e.r || 0]}${f ? ` · ×${f.n}` : ''}</small></div>`; };
    const bk = Object.entries(bucket(p)).filter(([, c]) => c > 0).map(([id, c]) => `${(entry(id) || {}).icon || ''} ${(entry(id) || { en: id }).en} ×${c}`).join(' · ');
    this.panel.show('🐠', `Sea Dex · Album biển (${n}/${DEX_TOTAL})`, `<div class="bar"><i style="width:${Math.round(n / DEX_TOTAL * 100)}%"></i></div>
      <div class="note">${next ? `Gặp thêm ${next.n - n} sinh vật nữa để nhận thưởng ${next.gold} vàng.` : 'Con đã ghi đủ Album biển! 🎉'} Câu cá ở cầu tàu nhỏ (phía Nam cảng) hoặc đánh quái biển để ghi thêm.</div>
      <h3>Sea life · Cá và hải sản</h3><div class="grid">${FISH.map(tile).join('')}</div>
      <h3>Sea monsters · Quái biển</h3><div class="grid">${MONSTER_ENTRIES.map(tile).join('')}</div>
      <div class="note">🪣 Xô cá: ${bk || 'trống'} (bán ở chợ cá).</div>`);
  }
}
