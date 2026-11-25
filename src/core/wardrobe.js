// The wardrobe (19/11): pieces the child earns by serving customers perfectly at the Style Boutique and the Beauty Salon
// ("a pink hat", "a red hair bow") and then wears on Ngọc. Pure rules; the profile keeps wardrobe = { owned: [ids], worn: { slot: id } }.
// An item id is "kind:color", e.g. "hat:pink".
export const KINDS = {
  hat: { slot: 'head', en: 'hat', vi: 'mũ', icon: '🎩' }, bow: { slot: 'hair', en: 'hair bow', vi: 'nơ cài tóc', icon: '🎀' }, headband: { slot: 'hair', en: 'headband', vi: 'băng đô', icon: '👑' },
  glasses: { slot: 'face', en: 'glasses', vi: 'kính', icon: '👓' }, scarf: { slot: 'neck', en: 'scarf', vi: 'khăn quàng', icon: '🧣' }, bag: { slot: 'back', en: 'bag', vi: 'túi xách', icon: '🎒' },
  bracelet: { slot: 'wrist', en: 'bracelet', vi: 'vòng tay', icon: '📿' }, shoes: { slot: 'feet', en: 'sneakers', vi: 'giày thể thao', icon: '👟' },
  // (batch 6, 19/11) clothes and hair colour the body itself: Ngọc v04 has tintable hair / top / bottom materials and 6 hair styles
  top: { slot: 'top', en: 'T-shirt', vi: 'áo phông', icon: '👕' }, skirt: { slot: 'bottom', en: 'skirt', vi: 'váy', icon: '🩳' }, trousers: { slot: 'bottom', en: 'trousers', vi: 'quần dài', icon: '👖' },
  dress: { slot: 'body', en: 'dress', vi: 'đầm', icon: '👗' },
  // (20/11, Blender batch 19) clothes with their own shape on Ngọc v05 (Top_*, Bottom_*, Dress_* objects)
  hoodie: { slot: 'top', en: 'hoodie', vi: 'áo hoodie', icon: '🧥' }, jacket: { slot: 'top', en: 'jacket', vi: 'áo khoác', icon: '🥼' }, aodai: { slot: 'top', en: 'long silk tunic', vi: 'áo dài', icon: '👘' },      // (21/11) an English name, read aloud in English
  shorts: { slot: 'bottom', en: 'shorts', vi: 'quần short', icon: '🩳' }, gown: { slot: 'body', en: 'party dress', vi: 'đầm công chúa', icon: '👸' },
  haircolor: { slot: 'haircolor', en: 'hair', vi: 'màu tóc', icon: '🎨' },
  hairstyle: { slot: 'style', en: 'hair', vi: 'kiểu tóc', icon: '💇', vals: ['short', 'long', 'curly', 'wavy', 'ponytail', 'braids'] },
  // (21/11) "a T-shirt comes in many designs, not only colours; shoes too": printed versions of the Blender clothes (base: the
  // shape worn, pat: the print drawn on it by game/tint.js) and four new kinds of shoes drawn in game/outfit.js
  tee_stripe: { slot: 'top', base: 'top', pat: 'stripes', en: 'striped T-shirt', vi: 'áo phông kẻ sọc', icon: '👕' },
  tee_dots: { slot: 'top', base: 'top', pat: 'dots', en: 'polka-dot T-shirt', vi: 'áo phông chấm bi', icon: '👕' },
  tee_raglan: { slot: 'top', base: 'top', pat: 'raglan', en: 'baseball T-shirt', vi: 'áo phông tay phối màu', icon: '⚾' },
  tee_block: { slot: 'top', base: 'top', pat: 'twotone', en: 'colour-block T-shirt', vi: 'áo phông hai màu', icon: '👕' },
  tee_dye: { slot: 'top', base: 'top', pat: 'ombre', en: 'tie-dye T-shirt', vi: 'áo phông loang màu', icon: '🌈' },
  shirt_check: { slot: 'top', base: 'jacket', pat: 'check', en: 'checked shirt', vi: 'áo sơ mi caro', icon: '👔' },
  hoodie_block: { slot: 'top', base: 'hoodie', pat: 'twotone', en: 'two-tone hoodie', vi: 'áo hoodie hai màu', icon: '🧥' },
  skirt_check: { slot: 'bottom', base: 'skirt', pat: 'check', en: 'plaid skirt', vi: 'váy caro', icon: '🩳' },
  skirt_dots: { slot: 'bottom', base: 'skirt', pat: 'dots', en: 'polka-dot skirt', vi: 'váy chấm bi', icon: '🩳' },
  trackpants: { slot: 'bottom', base: 'trousers', pat: 'sidestripe', en: 'track pants', vi: 'quần thể thao sọc', icon: '👖' },
  dress_dots: { slot: 'body', base: 'dress', pat: 'dots', en: 'polka-dot dress', vi: 'đầm chấm bi', icon: '👗' },
  dress_stripe: { slot: 'body', base: 'dress', pat: 'stripes', en: 'striped dress', vi: 'đầm kẻ sọc', icon: '👗' },
  dress_dye: { slot: 'body', base: 'dress', pat: 'ombre', en: 'ombre dress', vi: 'đầm loang màu', icon: '👗' },
  hightops: { slot: 'feet', en: 'high-top sneakers', vi: 'giày cổ cao', icon: '👟' }, boots: { slot: 'feet', en: 'boots', vi: 'bốt', icon: '🥾' },
  sandals: { slot: 'feet', en: 'sandals', vi: 'dép quai hậu', icon: '🩴' }, flats: { slot: 'feet', en: 'ballet flats', vi: 'giày búp bê', icon: '🥿' },
  // (19/11) jewellery sold at Mia's tailor shop in the village: metal or gem colours
  necklace: { slot: 'chain', en: 'necklace', vi: 'dây chuyền', icon: '💎', vals: ['gold', 'silver', 'pink', 'blue', 'green', 'purple'] },
  earrings: { slot: 'ears', en: 'earrings', vi: 'bông tai', icon: '✨', vals: ['gold', 'silver', 'pink', 'blue', 'green', 'purple'] },
  tiara: { slot: 'head', en: 'tiara', vi: 'vương miện', icon: '👸', vals: ['gold', 'silver', 'pink', 'blue', 'green', 'purple'] },
  hairclip: { slot: 'hair', en: 'hair clip', vi: 'kẹp tóc', icon: '🌸', vals: ['gold', 'silver', 'pink', 'blue', 'green', 'purple'] },
};
/** Colours that are not in the ten clothes colours (the jewellery metals). */
export const JEWEL_HEX = { gold: '#f2c23a', silver: '#d4d8e0' };
/** Gold price of each kind at Mia's shop (19/11: "kiếm vàng để mua quần áo trang sức thay thế"). */
export const PRICE = { tee_stripe: 60, tee_dots: 60, tee_raglan: 65, tee_block: 65, tee_dye: 80, shirt_check: 85, hoodie_block: 90, skirt_check: 65, skirt_dots: 60, trackpants: 70, dress_dots: 130, dress_stripe: 130, dress_dye: 150, hightops: 85, boots: 95, sandals: 55, flats: 70, hoodie: 70, jacket: 90, aodai: 110, shorts: 40, gown: 160, top: 50, skirt: 50, trousers: 50, dress: 120, shoes: 70, hat: 60, bow: 30, headband: 40, glasses: 70, scarf: 50, bag: 80, bracelet: 60, haircolor: 40, hairstyle: 80, necklace: 150, earrings: 120, tiara: 220, hairclip: 45 };
/** (25/11) Styles drawn in Blender for the Tripo hero (tools/acc/build_hero_acc.py -> assets/models/acc_<kind>_v01.glb, drawn in her own coordinates).
 *  Each accessory type has its first look (the older kind: hat, bow ...) plus four more here; a style is its own kind, shown in the shop as a "style" row. */
export const STYLES = {
  hat: [['hat_cap', 'baseball cap', 'mũ lưỡi trai', '🧢'], ['hat_beanie', 'knit beanie', 'mũ len', '🧶'], ['hat_bucket', 'bucket hat', 'mũ tai bèo', '👒'], ['hat_wizard', 'wizard hat', 'mũ phù thủy', '🧙']],
  glasses: [['glasses_round', 'round glasses', 'kính tròn', '👓'], ['glasses_sun', 'sunglasses', 'kính râm', '🕶️'], ['glasses_heart', 'heart glasses', 'kính trái tim', '💖'], ['glasses_star', 'star glasses', 'kính ngôi sao', '🤩']],
  headband: [['headband_cat', 'cat-ear headband', 'băng đô tai mèo', '🐱'], ['headband_bunny', 'bunny-ear headband', 'băng đô tai thỏ', '🐰'], ['headband_sport', 'sports headband', 'băng đô thể thao', '🏃'], ['headband_pearl', 'pearl headband', 'băng đô ngọc trai', '⚪']],
  bow: [['bow_side', 'side bow', 'nơ cài bên', '🎀'], ['bow_top', 'big top bow', 'nơ to trên đầu', '🎀'], ['bow_pair', 'pair of bows', 'cặp nơ', '🎀'], ['bow_ribbon', 'ribbon band', 'dải ruy băng', '🎗️']],
  tiara: [['tiara_crown', 'crown', 'vương miện', '👑'], ['tiara_flower', 'flower crown', 'vòng hoa', '🌼'], ['tiara_laurel', 'laurel wreath', 'vòng nguyệt quế', '🌿'], ['tiara_stars', 'star tiara', 'vương miện ngôi sao', '⭐']],
  hairclip: [['hairclip_star', 'star hair clip', 'kẹp ngôi sao', '⭐'], ['hairclip_flower', 'flower hair clip', 'kẹp hoa', '🌸'], ['hairclip_butterfly', 'butterfly hair clip', 'kẹp bướm', '🦋'], ['hairclip_heart', 'heart hair clip', 'kẹp trái tim', '💗']],
  earrings: [['earrings_hoop', 'hoop earrings', 'bông tai vòng', '⭕'], ['earrings_stud', 'stud earrings', 'bông tai nụ', '✨'], ['earrings_drop', 'drop earrings', 'bông tai giọt', '💧'], ['earrings_star', 'star earrings', 'bông tai ngôi sao', '🌟']],
  necklace: [['necklace_pearl', 'pearl necklace', 'dây chuyền ngọc trai', '📿'], ['necklace_heart', 'heart necklace', 'dây chuyền trái tim', '💗'], ['necklace_choker', 'choker', 'vòng cổ ngắn', '🎀'], ['necklace_star', 'star necklace', 'dây chuyền ngôi sao', '⭐']],
  scarf: [['scarf_muffler', 'long muffler', 'khăn len dài', '🧣'], ['scarf_bandana', 'bandana', 'khăn bandana', '🏴‍☠️'], ['scarf_ribbon', 'neck bow', 'nơ cổ', '🎀'], ['scarf_fluffy', 'fluffy collar', 'cổ lông xù', '☁️']],
  bracelet: [['bracelet_beads', 'bead bracelet', 'vòng hạt', '📿'], ['bracelet_watch', 'wrist watch', 'đồng hồ', '⌚'], ['bracelet_charm', 'charm bracelet', 'vòng đính charm', '💎'], ['bracelet_cuff', 'cuff bracelet', 'vòng cổ tay bản rộng', '🔶']],
  bag: [['bag_satchel', 'satchel', 'túi đeo chéo', '👜'], ['bag_pack', 'mini backpack', 'ba lô nhỏ', '🎒'], ['bag_round', 'round bag', 'túi tròn', '🔘'], ['bag_wings', 'fairy wings', 'cánh tiên', '🧚']],
};
const STYLE_SLOT = { hat: 'head', tiara: 'head', glasses: 'face', bow: 'hair', headband: 'hair', hairclip: 'hair', scarf: 'neck', necklace: 'chain', earrings: 'ears', bracelet: 'wrist', bag: 'back' };
const STYLE_PRICE = { hat: 70, glasses: 65, headband: 50, bow: 40, tiara: 240, hairclip: 55, earrings: 130, necklace: 160, scarf: 60, bracelet: 70, bag: 90 };
for (const [type, list] of Object.entries(STYLES)) {
  for (const [kind, en, vi, icon] of list) {
    KINDS[kind] = { slot: STYLE_SLOT[type], acc: type, hero: true, en, vi, icon, ...(KINDS[type].vals ? { vals: KINDS[type].vals } : {}) };
    PRICE[kind] = STYLE_PRICE[type];
  }
}
/** The accessory type of a kind ("hat_cap" -> "hat"); other kinds are their own type. */
export const typeOf = (kind) => (KINDS[kind] && KINDS[kind].acc) || kind;
/** Every look of one accessory type, the first (older) one first. */
export const stylesOf = (type) => [type, ...(STYLES[type] || []).map((x) => x[0])];
/** True for the styles drawn only for the hero (the older Ngọc has none of them). */
export const heroOnly = (kind) => !!(KINDS[kind] && KINDS[kind].hero);
export const priceOf = (id) => { const it = parse(id); if (!it) return 0; return PRICE[it.kind] * (it.color === 'gold' ? 2 : it.color === 'silver' ? 1.5 : 1); };
export const SLOTS = [{ id: 'head', en: 'Head', vi: 'đầu' }, { id: 'hair', en: 'Hair', vi: 'tóc' }, { id: 'style', en: 'Hair style', vi: 'kiểu tóc' }, { id: 'haircolor', en: 'Hair colour', vi: 'màu tóc' }, { id: 'top', en: 'Top', vi: 'áo' }, { id: 'bottom', en: 'Bottom', vi: 'quần, váy' }, { id: 'body', en: 'Dress', vi: 'đầm' }, { id: 'face', en: 'Face', vi: 'mặt' }, { id: 'neck', en: 'Neck', vi: 'cổ' }, { id: 'chain', en: 'Necklace', vi: 'dây chuyền' }, { id: 'ears', en: 'Earrings', vi: 'bông tai' }, { id: 'back', en: 'Back', vi: 'lưng' }, { id: 'wrist', en: 'Wrist', vi: 'cổ tay' }, { id: 'feet', en: 'Feet', vi: 'chân' }];
export const COLOR_NAMES = ['red', 'blue', 'yellow', 'green', 'pink', 'purple', 'black', 'white', 'orange', 'brown'];
/** Every [kind, value] pair that can exist. */
export const allItems = () => Object.entries(KINDS).flatMap(([k, v]) => (v.vals || COLOR_NAMES).map((c) => [k, c]));
export const itemId = (kind, color) => `${kind}:${color}`;
export const parse = (id) => { const [kind, color] = String(id).split(':'); return KINDS[kind] && (KINDS[kind].vals || COLOR_NAMES).includes(color) ? { kind, color, slot: KINDS[kind].slot } : null; };
/** The shape a kind is worn as (a printed T-shirt is worn as the T-shirt) and its print. */
export const baseOf = (kind) => (KINDS[kind] && KINDS[kind].base) || kind;
export const patOf = (kind) => (KINDS[kind] && KINDS[kind].pat) || '';
export const itemName = (id) => { const it = parse(id); if (!it) return id; return it.kind === 'hairstyle' ? (it.color === 'ponytail' || it.color === 'braids' ? it.color : `${it.color} hair`) : `${it.color} ${KINDS[it.kind].en}`; };
export const wardrobe = (p) => p.wardrobe || (p.wardrobe = { owned: [], worn: {} });
/** Adds a piece; true when it is new. */
export function unlock(p, kind, color) { const id = itemId(kind, color), w = wardrobe(p); if (!parse(id) || w.owned.includes(id)) return false; w.owned.push(id); return true; }
/** Puts a piece on (or takes it off when it is already worn). Returns what is worn in that slot afterwards. */
export function wear(p, id) {
  const it = parse(id), w = wardrobe(p); if (!it || !w.owned.includes(id)) return null;
  w.worn[it.slot] = w.worn[it.slot] === id ? null : id;
  if (w.worn[it.slot]) { if (it.slot === 'body') w.worn.top = w.worn.bottom = null; else if (it.slot === 'top' || it.slot === 'bottom') w.worn.body = null; }     // a dress replaces top and bottom
  return w.worn[it.slot];
}
/** Buys a piece with gold and puts it on. { ok, why: 'gold' | 'owned' | 'bad', cost } */
export function buyPiece(p, id) {
  const it = parse(id); if (!it) return { ok: false, why: 'bad' };
  const w = wardrobe(p), cost = priceOf(id);
  if (w.owned.includes(id)) { if (w.worn[it.slot] !== id) wear(p, id); return { ok: true, why: 'owned', cost: 0 }; }
  if ((p.stats.gold || 0) < cost) return { ok: false, why: 'gold', cost };
  p.stats.gold -= cost; w.owned.push(id); if (w.worn[it.slot] !== id) wear(p, id); return { ok: true, why: 'new', cost };
}
/** The look picked in the character creator: the pieces are free starters, owned and worn. */
export function starterLook(p, pieces) {
  const w = wardrobe(p);
  for (const slot of ['style', 'haircolor', 'top', 'bottom', 'body']) w.worn[slot] = null;
  for (const [kind, color] of pieces) { const id = itemId(kind, color), it = parse(id); if (!it) continue; if (!w.owned.includes(id)) w.owned.push(id); w.worn[it.slot] = id; }
  return w;
}
/** Wearable pieces from a customer the child served perfectly at the Boutique: the asked pieces that can be worn. */
export const fromStyleOrder = (order) => order.map((o) => ({ kind: o.item === 'T-shirt' ? 'top' : o.item, color: o.color })).filter((o) => KINDS[o.kind]);
/** From a perfect Salon customer: a bow in the hair colour, a headband in the eyeshadow colour, a bracelet in the nail colour. */
export function fromSalonOrder(o) {
  const out = []; if (o.style) out.push({ kind: 'hairstyle', color: o.style }); if (o.hair) out.push({ kind: 'haircolor', color: o.hair }); if (o.hair) out.push({ kind: 'bow', color: o.hair }); if (o.eyes) out.push({ kind: 'headband', color: o.eyes }); if (o.nails) out.push({ kind: 'bracelet', color: o.nails }); return out;
}
