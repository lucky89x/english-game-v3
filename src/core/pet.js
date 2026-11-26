// The sea pet (19/11): a seagull, an otter or a hermit crab that follows the hero. It is cared for in English: it asks for a
// food by name ("I'd like some apples, please") and the child picks the picture; it learns tricks from English commands
// ("Sit!", "Roll over!") that the child matches to their meaning. Care raises the bond, the bond gives a small gold bonus
// and a daily gift. Pure rules; the profile keeps pet = { kind, name, hunger, joy, bond, tricks, at, day, cares, gift }.
export const PETS = {
  gull: { en: 'seagull', vi: 'hải âu', icon: '🕊️', name: 'Skye', says: 'Squawk! Hello, friend!' },
  otter: { en: 'otter', vi: 'rái cá', icon: '🐾', name: 'Ollie', says: "Eek eek! Let's play!" },
  crab: { en: 'hermit crab', vi: 'cua ẩn sĩ', icon: '🦀', name: 'Coral', says: 'Click clack! Hi there!' },
  // (21/11) "a pet shop where the hero buys a pet to keep and care for every day": Penny's shop in the village (Map 1)
  puppy: { en: 'puppy', vi: 'chó con', icon: '🐶', name: 'Buddy', says: "Woof woof! Let's go!", price: 120, shop: true },
  kitten: { en: 'kitten', vi: 'mèo con', icon: '🐱', name: 'Mimi', says: 'Meow! Nice to meet you!', price: 120, shop: true },
  bunny: { en: 'bunny', vi: 'thỏ con', icon: '🐰', name: 'Hoppy', says: 'Hop hop! Hello!', price: 90, shop: true },
  ember: { en: 'ember fox', vi: 'cáo lửa', icon: '🦊', name: 'Blaze', says: 'Yip yip! My tail is warm!', price: 260, shop: true },
  duckling: { en: 'duckling', vi: 'vịt con', icon: '🐥', name: 'Ducky', says: 'Quack quack!', price: 70, shop: true },
};
/** The pets the hero owns (the one following is p.pet; the others wait at home in p.pets[kind]). */
export const owned = (p) => [...new Set([...(p.pet ? [p.pet.kind] : []), ...Object.keys(p.pets || {})])];
/** Buys a shop pet: { ok, why: 'have' | 'gold' | 'none' }. It starts following at once (the old one goes home). */
export function buyPet(p, kind, day = 0, now = Date.now()) {
  const info = PETS[kind]; if (!info || !info.shop) return { ok: false, why: 'none' };
  if (owned(p).includes(kind)) return { ok: false, why: 'have' };
  if ((p.stats.gold || 0) < info.price) return { ok: false, why: 'gold' };
  p.stats.gold -= info.price; if (p.pet) (p.pets || (p.pets = {}))[p.pet.kind] = p.pet; p.pet = null; adopt(p, kind, day, now); return { ok: true };
}
/** Takes another owned pet along; the current one waits at home with its bars and tricks. */
export function switchPet(p, kind) {
  if (!p.pets || !p.pets[kind]) return false; const next = p.pets[kind]; delete p.pets[kind];
  if (p.pet) p.pets[p.pet.kind] = p.pet; p.pet = next; return true;
}
export const FOODS = [
  { id: 'fish', en: 'fish', vi: 'cá', icon: '🐟' }, { id: 'apple', en: 'apple', vi: 'quả táo', icon: '🍎' }, { id: 'bread', en: 'bread', vi: 'bánh mì', icon: '🍞' },
  { id: 'carrot', en: 'carrot', vi: 'cà rốt', icon: '🥕' }, { id: 'cheese', en: 'cheese', vi: 'phô mai', icon: '🧀' }, { id: 'shrimp', en: 'shrimp', vi: 'con tôm', icon: '🦐' },
  { id: 'egg', en: 'egg', vi: 'quả trứng', icon: '🥚' }, { id: 'banana', en: 'banana', vi: 'quả chuối', icon: '🍌' },
];
export const TRICKS = [
  { id: 'sit', en: 'Sit!', vi: 'ngồi xuống', icon: '🧎' }, { id: 'jump', en: 'Jump!', vi: 'nhảy lên', icon: '⤴️' }, { id: 'spin', en: 'Spin around!', vi: 'quay vòng', icon: '🔄' },
  { id: 'roll', en: 'Roll over!', vi: 'lăn người', icon: '🌀' }, { id: 'dance', en: 'Dance!', vi: 'nhảy múa', icon: '💃' }, { id: 'wave', en: 'Wave hello!', vi: 'vẫy chào', icon: '👋' },
];
export const MAX_CARES = 6;      // care actions a day that still raise the bond
const clamp = (v) => Math.max(0, Math.min(100, v));
export function adopt(p, kind, day = 0, now = Date.now()) { if (!PETS[kind] || p.pet) return null; p.pet = { kind, name: PETS[kind].name, hunger: 80, joy: 60, bond: 0, tricks: [], at: now, day, cares: 0, gift: 0 }; return p.pet; }
/** Hunger falls about 12 points an hour; joy falls when it is hungry. */
export function tick(pet, now = Date.now()) {
  const min = Math.max(0, (now - (pet.at ?? now)) / 60000); pet.at = now;
  pet.hunger = clamp(pet.hunger - min * 0.2); if (pet.hunger < 30) pet.joy = clamp(pet.joy - min * 0.15); return pet;
}
export const bondLevel = (pet) => Math.floor(Math.sqrt((pet.bond || 0) / 10));
/** Gold multiplier from the pet: +4% per bond level (up to +20%) while it is not starving. */
export const goldMul = (p) => (p.pet && p.pet.hunger >= 25 ? 1 + 0.04 * Math.min(5, bondLevel(p.pet)) : 1);
function care(pet, day, bond) { if (pet.day !== day) { pet.day = day; pet.cares = 0; } pet.cares += 1; const paid = pet.cares <= MAX_CARES; if (paid) pet.bond += bond; return paid; }
/** A feeding question: the pet names a food; the child picks the picture among three. */
export function foodQuestion(rnd = Math.random) {
  const food = FOODS[Math.floor(rnd() * FOODS.length)], others = FOODS.filter((f) => f.id !== food.id).sort(() => rnd() - 0.5).slice(0, 2), options = [food, ...others].sort(() => rnd() - 0.5);
  return { kind: 'food', say: `I'm hungry! I'd like some ${food.en}, please.`, answer: food.id, options, a: options.findIndex((o) => o.id === food.id), word: food };
}
/** A training question: the pet hears a command in English; the child picks its meaning. */
export function trickQuestion(rnd = Math.random) {
  const t = TRICKS[Math.floor(rnd() * TRICKS.length)], others = TRICKS.filter((x) => x.id !== t.id).sort(() => rnd() - 0.5).slice(0, 2), options = [t, ...others].sort(() => rnd() - 0.5);
  return { kind: 'trick', say: t.en, answer: t.id, options, a: options.findIndex((o) => o.id === t.id), word: t };
}
/** Feeds the pet for a right answer. Returns { paid }. */
export function feed(p, day) { const pet = p.pet; pet.hunger = clamp(pet.hunger + 25); pet.joy = clamp(pet.joy + 8); return { paid: care(pet, day, 3) }; }
/** A right answer to a command: the pet learns (or practises) the trick. Returns { isNew, paid }. */
export function train(p, trickId, day) { const pet = p.pet, isNew = !pet.tricks.includes(trickId); if (isNew) pet.tricks.push(trickId); pet.joy = clamp(pet.joy + 10); return { isNew, paid: care(pet, day, isNew ? 6 : 3) }; }
/** Once a day a happy, fed pet digs up some gold: { gold } or null. */
export function dailyGift(p, day) { const pet = p.pet; if (!pet || pet.gift === day || pet.hunger < 25 || pet.joy < 40) return null; pet.gift = day; const gold = 8 + 6 * bondLevel(pet); p.stats.gold += gold; return { gold }; }
