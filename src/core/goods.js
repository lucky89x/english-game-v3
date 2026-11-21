// Goods (21/11: "fish caught and apples picked fall into the bag; the hero takes them to the shop and sells them for gold;
// the vegetable garden can be planted and sold; raise pigs and chickens too"). Pure rules; the profile keeps
// goods = { id: count } next to the fish bucket (core/sea.js keeps p.fish). Prices are small: farming tops up the gold
// from monsters and quests, it does not replace them.
import { entry as seaEntry, RIVER } from './sea.js';
const entry = (id) => seaEntry(id) || RIVER.find((f) => f.id === id) || null;

export const GOODS = {
  apple: { en: 'apple', vi: 'quả táo', icon: '🍎', price: 1 },
  gold_apple: { en: 'golden apple', vi: 'táo vàng', icon: '🍏', price: 4 },
  carrot: { en: 'carrot', vi: 'cà rốt', icon: '🥕', price: 3 },
  tomato: { en: 'tomato', vi: 'cà chua', icon: '🍅', price: 4 },
  cabbage: { en: 'cabbage', vi: 'bắp cải', icon: '🥬', price: 5 },
  corn: { en: 'corn', vi: 'bắp ngô', icon: '🌽', price: 6 },
  pumpkin: { en: 'pumpkin', vi: 'bí ngô', icon: '🎃', price: 12 },
  egg: { en: 'egg', vi: 'quả trứng', icon: '🥚', price: 2 },
  pig: { en: 'pig', vi: 'con lợn (đã lớn)', icon: '🐖', price: 60 },
};
export const goods = (p) => p.goods || (p.goods = {});
export function addGood(p, id, n = 1) { if (!GOODS[id] || n <= 0) return 0; const g = goods(p); g[id] = (g[id] || 0) + n; return n; }
/** Everything that can be sold, as [{ id, en, vi, icon, price, n, fish }] (goods first, then the fish bucket). */
export function sellable(p) {
  const out = [];
  for (const [id, n] of Object.entries(goods(p))) if (n > 0 && GOODS[id]) out.push({ id, ...GOODS[id], n, fish: false });
  for (const [id, n] of Object.entries(p.fish || {})) { const e = entry(id); if (n > 0 && e && e.price) out.push({ id, en: e.en, vi: e.vi, icon: e.icon, price: e.price, n, fish: true }); }
  return out;
}
/** Sells one kind (all of it) or, with no id, everything. Returns { gold, n }. */
export function sellGoods(p, id = null) {
  let gold = 0, n = 0;
  for (const it of sellable(p)) {
    if (id && it.id !== id) continue;
    gold += it.price * it.n; n += it.n;
    if (it.fish) delete p.fish[it.id]; else delete goods(p)[it.id];
  }
  p.stats.gold += gold; return { gold, n };
}
