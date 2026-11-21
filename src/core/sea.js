// Sea life of Sunny Harbor (19/11): the fish a child can catch at the fishing pier, the sea monsters from the hunt, the
// Sea Dex that records them (every English name with its Vietnamese meaning), and what the fish market pays.
// Pure rules, no DOM; the profile keeps `fish` (what is in the bucket) and `dex` (what was ever found).
export const RARITY = ['Common', 'Uncommon', 'Rare', 'Legendary'];
export const RARITY_VI = ['thường', 'khá hiếm', 'hiếm', 'huyền thoại'];
export const FISH = [
  { id: 'sardine', en: 'sardine', vi: 'cá mòi', r: 0, price: 3, icon: '🐟' }, { id: 'anchovy', en: 'anchovy', vi: 'cá cơm', r: 0, price: 3, icon: '🐟' },
  { id: 'mackerel', en: 'mackerel', vi: 'cá thu', r: 0, price: 4, icon: '🐟' }, { id: 'squid', en: 'squid', vi: 'mực ống', r: 0, price: 5, icon: '🦑' },
  { id: 'shrimp', en: 'shrimp', vi: 'con tôm', r: 1, price: 8, icon: '🦐' }, { id: 'salmon', en: 'salmon', vi: 'cá hồi', r: 1, price: 10, icon: '🐠' },
  { id: 'tuna', en: 'tuna', vi: 'cá ngừ', r: 1, price: 12, icon: '🐟' }, { id: 'lobster', en: 'lobster', vi: 'tôm hùm', r: 1, price: 14, icon: '🦞' },
  { id: 'pufferfish', en: 'pufferfish', vi: 'cá nóc', r: 2, price: 25, icon: '🐡' }, { id: 'seahorse', en: 'seahorse', vi: 'cá ngựa', r: 2, price: 30, icon: '🐴' },
  { id: 'swordfish', en: 'swordfish', vi: 'cá kiếm', r: 2, price: 35, icon: '🐟' }, { id: 'starfish', en: 'starfish', vi: 'sao biển', r: 2, price: 28, icon: '⭐' },
  { id: 'dolphin', en: 'dolphin', vi: 'cá heo', r: 3, price: 80, icon: '🐬' }, { id: 'turtle', en: 'sea turtle', vi: 'rùa biển', r: 3, price: 90, icon: '🐢' },
];
/** River fish of the village dock (Map 1): paid in gold on the spot (there is no fish market in the village). */
export const RIVER = [
  { id: 'minnow', en: 'minnow', vi: 'cá nhỏ', r: 0, price: 2, icon: '🐟' }, { id: 'carp', en: 'carp', vi: 'cá chép', r: 0, price: 3, icon: '🐟' },
  { id: 'trout', en: 'trout', vi: 'cá hồi suối', r: 1, price: 6, icon: '🐠' }, { id: 'catfish', en: 'catfish', vi: 'cá trê', r: 1, price: 8, icon: '🐟' },
  { id: 'eel', en: 'eel', vi: 'con lươn', r: 2, price: 15, icon: '🐍' }, { id: 'golden_carp', en: 'golden carp', vi: 'cá chép vàng', r: 3, price: 40, icon: '🐠' },
];
/** Things the line brings up besides fish. They sell for pennies and are not in the Dex. */
export const JUNK = [
  { id: 'boot', en: 'old boot', vi: 'chiếc giày cũ', price: 1, icon: '👢', junk: true }, { id: 'seaweed', en: 'seaweed', vi: 'rong biển', price: 2, icon: '🌿', junk: true },
  { id: 'can', en: 'tin can', vi: 'lon thiếc', price: 1, icon: '🥫', junk: true },
];
/** The hunt's monsters join the Dex when first defeated (kind = the MONSTERS key; the boss is 'octopus'). */
export const MONSTER_ENTRIES = [
  { id: 'crab', en: 'beach crab', vi: 'cua biển', r: 1, icon: '🦀', monster: true }, { id: 'jelly', en: 'jellyfish', vi: 'con sứa', r: 1, icon: '🟣', monster: true },
  { id: 'pirate', en: 'pirate', vi: 'cướp biển', r: 2, icon: '☠️', monster: true }, { id: 'octopus', en: 'octopus', vi: 'bạch tuộc', r: 3, icon: '🐙', monster: true },
];
export const CREATURES = [...FISH, ...MONSTER_ENTRIES];
export const DEX_TOTAL = CREATURES.length;
/** The picture of a creature (Blender render, 256 px); the junk items have none and keep their emoji. */
export const dexImage = (e) => (e && !e.junk ? `./assets/ui/dex_${e.id}.png` : null);
export const entry = (id) => CREATURES.find((c) => c.id === id) || JUNK.find((c) => c.id === id) || RIVER.find((c) => c.id === id) || null;      // (21/11) river fish ride in the same bucket
/** Dex milestones: found this many different creatures, get a bonus once. */
export const MILESTONES = [{ n: 5, gold: 50 }, { n: 10, gold: 120 }, { n: 15, gold: 250 }, { n: DEX_TOTAL, gold: 500 }];

/** What bites: a fish (rarer ones are rarer), now and then junk. tier 1..3 makes the rare ones a little more likely. */
export function rollFish(rnd = Math.random, tier = 1) {
  if (rnd() < 0.14) return JUNK[Math.floor(rnd() * JUNK.length)];
  const k = rnd(), w = [0.6 - 0.04 * tier, 0.26, 0.11 + 0.02 * tier, 0.03 + 0.02 * tier];
  let r = 0, acc = 0; for (let i = 0; i < 4; i++) { acc += w[i]; if (k < acc) { r = i; break; } r = i; }
  const pool = FISH.filter((f) => f.r === r); return pool[Math.floor(rnd() * pool.length)];
}
export function rollRiver(rnd = Math.random, tier = 1) {
  if (rnd() < 0.14) return JUNK[Math.floor(rnd() * JUNK.length)];
  const k = rnd(), r = k < 0.55 ? 0 : k < 0.85 ? 1 : k < 0.85 + 0.1 + 0.01 * tier ? 2 : 3, pool = RIVER.filter((f) => f.r === r); return pool[Math.floor(rnd() * pool.length)];
}
export const dex = (p) => p.dex || (p.dex = {});
export const dexCount = (p) => Object.keys(dex(p)).length;
const claimed = (p) => p.dexClaimed || (p.dexClaimed = {});
/** Records a creature. Returns { isNew, gold, exp, bonus }: the first time pays by rarity, and crossing a milestone pays once. */
export function discover(p, id, day = 0) {
  const e = CREATURES.find((c) => c.id === id); if (!e) return { isNew: false, gold: 0, exp: 0, bonus: 0 };
  const d = dex(p); if (d[id]) { d[id].n += 1; return { isNew: false, gold: 0, exp: 0, bonus: 0 }; }
  d[id] = { n: 1, day }; let bonus = 0, n = dexCount(p);
  for (const m of MILESTONES) if (n >= m.n && !claimed(p)[m.n]) { claimed(p)[m.n] = true; bonus += m.gold; }
  return { isNew: true, gold: 10 + 15 * e.r, exp: 20 + 40 * e.r, bonus };
}
export const bucket = (p) => p.fish || (p.fish = {});
export const bucketCount = (p) => Object.values(bucket(p)).reduce((a, b) => a + b, 0);
export function keep(p, item) { const b = bucket(p); b[item.id] = (b[item.id] || 0) + 1; }
/** Sells everything in the bucket at the fish market. Returns { gold, n }. */
export function sellAll(p) {
  const b = bucket(p); let gold = 0, n = 0;
  for (const [id, c] of Object.entries(b)) { const e = entry(id); if (e) { gold += (e.price || 0) * c; n += c; } }
  p.fish = {}; p.stats.gold += gold; return { gold, n };
}
