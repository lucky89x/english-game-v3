// The three modular heroes (22/11, from the user's own Blender set EnglishQuest_Modular_GLB): Ngọc, Hồng Liên and Hạo Thiên.
// Each hero is ONE body (file <id>_0.glb: a plain black under-suit, never shown alone) plus five outfits (<id>_1…5.glb): an outfit
// file holds the same body and the pieces that change (Tunic, Coat, Boots…), so wearing it = swapping those pieces on the body
// (src/game/hero.js). Outfit index i (0–4) is file i+1; outfit 0 is the free starting garb, the other four are bought at Mia's.
// profile.hero = { id, outfit, owned: [0, …] } — absent on the older profiles, which keep the little classic Ngọc.
// Pure rules, no three.js: unit-tested.

export const OUTFIT_PRICES = [0, 180, 280, 400, 550];       // outfit 0 (the starting garb) is free

export const HEROES = {
  ngoc: {
    id: 'ngoc', name: 'Ngọc', en: 'Ngoc', vi: 'Cô gái hiền, tóc bạc xanh', pic: 'ngoc',
    outfits: [
      { en: 'Sky Lotus Blue', vi: 'Sen xanh trời' }, { en: 'Peach Blossom Pink', vi: 'Hoa đào hồng' },
      { en: 'Phoenix Battle Red', vi: 'Giáp phượng hoàng đỏ' }, { en: 'Moonlight Oracle Purple', vi: 'Nữ tiên tri ánh trăng' }, { en: 'Emerald Ranger Green', vi: 'Kiểm lâm lục bảo' },
    ],
  },
  honglien: {
    id: 'honglien', name: 'Hồng Liên', en: 'Hong Lien', vi: 'Cô gái mạnh mẽ, tóc nâu dài', pic: 'honglien',
    outfits: [
      { en: 'Ember Phoenix Red', vi: 'Phượng lửa đỏ' }, { en: 'Rose Petal Pink', vi: 'Cánh hồng' },
      { en: 'Obsidian Commander Black', vi: 'Chỉ huy hắc diệu' }, { en: 'Snow Lotus White', vi: 'Sen tuyết trắng' }, { en: 'Frost Wave Blue', vi: 'Sóng băng xanh' },
    ],
  },
  haothien: {
    id: 'haothien', name: 'Hạo Thiên', en: 'Hao Thien', vi: 'Chàng trai kiếm khách', pic: 'haothien',
    outfits: [
      { en: 'Silver Dragon White', vi: 'Ngân long trắng' }, { en: 'Midnight Star Purple', vi: 'Sao đêm tím' },
      { en: 'Crimson Sun Red', vi: 'Xích nhật đỏ' }, { en: 'Jade Wanderer Green', vi: 'Lục ngọc lãng du' }, { en: 'Golden Guardian Gold', vi: 'Hộ vệ vàng kim' },
    ],
  },
};
export const HERO_IDS = Object.keys(HEROES);
export const heroBodyFile = (id) => `hero/${id}_0`;                  // under assets/models, no extension
export const heroFile = (id, outfit = 0) => `hero/${id}_${outfit + 1}`;      // outfit index 0–4 = file 1–5

/** The profile's hero record, or null for a profile that still has the classic little Ngọc. */
export const heroOf = (p) => (p && p.hero && HEROES[p.hero.id] ? p.hero : null);
export const priceOfOutfit = (i) => OUTFIT_PRICES[i] ?? 0;
export const outfitName = (id, i) => (HEROES[id] && HEROES[id].outfits[i] ? HEROES[id].outfits[i].en : '');
export const owns = (p, i) => { const h = heroOf(p); return !!h && (i === 0 || (h.owned || []).includes(i)); };

/** Picks (or changes) the hero: the starting garb is free; the outfits bought for a hero are kept when the child switches
 *  to another hero and back (the record of the hero she leaves goes to p.heroStore). */
export function chooseHero(p, id) {
  if (!HEROES[id]) return false;
  const h = heroOf(p);
  if (h && h.id === id) return true;
  const store = p.heroStore || (p.heroStore = {});
  if (h) store[h.id] = h;
  p.hero = store[id] || { id, outfit: 0, owned: [0] };
  delete store[id];
  return true;
}
/** Buys outfit i with gold. { ok, cost, why }: why = 'new' | 'owned' | 'broke' | 'bad'. Buying also wears it. */
export function buyOutfit(p, i) {
  const h = heroOf(p), cost = priceOfOutfit(i);
  if (!h || !(i >= 0 && i < OUTFIT_PRICES.length)) return { ok: false, cost: 0, why: 'bad' };
  if (owns(p, i)) { h.outfit = i; return { ok: true, cost: 0, why: 'owned' }; }
  if (p.stats.gold < cost) return { ok: false, cost, why: 'broke' };
  p.stats.gold -= cost; (h.owned || (h.owned = [0])).push(i); h.outfit = i;
  return { ok: true, cost, why: 'new' };
}
/** Wears an owned outfit (no gold). */
export function wearOutfit(p, i) { const h = heroOf(p); if (!h || !owns(p, i)) return false; h.outfit = i; return true; }
