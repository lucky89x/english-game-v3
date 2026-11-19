// The wardrobe (19/11): pieces the child earns by serving customers perfectly at the Style Boutique and the Beauty Salon
// ("a pink hat", "a red hair bow") and then wears on Ngọc. Pure rules; the profile keeps wardrobe = { owned: [ids], worn: { slot: id } }.
// An item id is "kind:color", e.g. "hat:pink".
export const KINDS = {
  hat: { slot: 'head', en: 'hat', vi: 'mũ', icon: '🎩' }, bow: { slot: 'hair', en: 'hair bow', vi: 'nơ cài tóc', icon: '🎀' }, headband: { slot: 'hair', en: 'headband', vi: 'băng đô', icon: '👑' },
  glasses: { slot: 'face', en: 'glasses', vi: 'kính', icon: '👓' }, scarf: { slot: 'neck', en: 'scarf', vi: 'khăn quàng', icon: '🧣' }, bag: { slot: 'back', en: 'bag', vi: 'túi xách', icon: '🎒' },
  bracelet: { slot: 'wrist', en: 'bracelet', vi: 'vòng tay', icon: '📿' }, shoes: { slot: 'feet', en: 'shoes', vi: 'giày', icon: '👟' },
  // (batch 6, 19/11) clothes and hair colour the body itself: Ngọc v04 has tintable hair / top / bottom materials and 6 hair styles
  top: { slot: 'top', en: 'T-shirt', vi: 'áo phông', icon: '👕' }, skirt: { slot: 'bottom', en: 'skirt', vi: 'váy', icon: '🩳' }, trousers: { slot: 'bottom', en: 'trousers', vi: 'quần dài', icon: '👖' },
  dress: { slot: 'body', en: 'dress', vi: 'đầm', icon: '👗' }, haircolor: { slot: 'haircolor', en: 'hair', vi: 'màu tóc', icon: '🎨' },
  hairstyle: { slot: 'style', en: 'hair', vi: 'kiểu tóc', icon: '💇', vals: ['short', 'long', 'curly', 'wavy', 'ponytail', 'braids'] },
};
export const SLOTS = [{ id: 'head', en: 'Head', vi: 'đầu' }, { id: 'hair', en: 'Hair', vi: 'tóc' }, { id: 'style', en: 'Hair style', vi: 'kiểu tóc' }, { id: 'haircolor', en: 'Hair colour', vi: 'màu tóc' }, { id: 'top', en: 'Top', vi: 'áo' }, { id: 'bottom', en: 'Bottom', vi: 'quần, váy' }, { id: 'body', en: 'Dress', vi: 'đầm' }, { id: 'face', en: 'Face', vi: 'mặt' }, { id: 'neck', en: 'Neck', vi: 'cổ' }, { id: 'back', en: 'Back', vi: 'lưng' }, { id: 'wrist', en: 'Wrist', vi: 'cổ tay' }, { id: 'feet', en: 'Feet', vi: 'chân' }];
export const COLOR_NAMES = ['red', 'blue', 'yellow', 'green', 'pink', 'purple', 'black', 'white', 'orange', 'brown'];
/** Every [kind, value] pair that can exist. */
export const allItems = () => Object.entries(KINDS).flatMap(([k, v]) => (v.vals || COLOR_NAMES).map((c) => [k, c]));
export const itemId = (kind, color) => `${kind}:${color}`;
export const parse = (id) => { const [kind, color] = String(id).split(':'); return KINDS[kind] && (KINDS[kind].vals || COLOR_NAMES).includes(color) ? { kind, color, slot: KINDS[kind].slot } : null; };
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
/** Wearable pieces from a customer the child served perfectly at the Boutique: the asked pieces that can be worn. */
export const fromStyleOrder = (order) => order.map((o) => ({ kind: o.item === 'T-shirt' ? 'top' : o.item, color: o.color })).filter((o) => KINDS[o.kind]);
/** From a perfect Salon customer: a bow in the hair colour, a headband in the eyeshadow colour, a bracelet in the nail colour. */
export function fromSalonOrder(o) {
  const out = []; if (o.style) out.push({ kind: 'hairstyle', color: o.style }); if (o.hair) out.push({ kind: 'haircolor', color: o.hair }); if (o.hair) out.push({ kind: 'bow', color: o.hair }); if (o.eyes) out.push({ kind: 'headband', color: o.eyes }); if (o.nails) out.push({ kind: 'bracelet', color: o.nails }); return out;
}
