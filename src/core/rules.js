// Combat and reward numbers in one place (no three.js, tested in node).
export const MONSTERS = {
  slime: { name: 'Green Slime', level: 1, hp: 30, atk: 6, exp: 12, gold: 3, speed: 2.0, color: 0x7fd86a, size: 1.0 },
  red: { name: 'Red Slime', level: 4, hp: 70, atk: 11, exp: 26, gold: 7, speed: 2.5, color: 0xff7a6a, size: 1.25 },
  golem: { name: 'Stone Golem', level: 8, hp: 180, atk: 18, exp: 75, gold: 20, speed: 1.6, color: 0xa49aa6, size: 1.7 },
  // Map 2 (Memory Forest, levels 21-40): they appear only once Map 2 is open
  bat: { name: 'Shadow Bat', level: 21, hp: 260, atk: 32, exp: 120, gold: 22, speed: 3.2, color: 0x6a4a9a, size: 1.0, fly: true },
  shroom: { name: 'Angry Mushroom', level: 26, hp: 420, atk: 40, exp: 170, gold: 30, speed: 1.8, color: 0xe2483e, size: 1.3 },
};
/** Map 2 monsters in the Memory Forest: [kind, x, z] (open ground away from crystals, paths and the gate). */
export const FOREST_SPAWNS = [
  ['bat', -25, -43], ['bat', 35, -34], ['bat', -16, -31], ['bat', 38, -19], ['bat', -46, -4],
  ['shroom', 14, -7], ['shroom', -19, 14], ['shroom', 17, 26], ['shroom', -40, 26], ['shroom', 2, 20],
];
/** Where monsters live in the Starter Village region: [kind, x, z]. The Wild Meadow is north-east, golems guard the south-east. */
export const SPAWNS = [
  ['slime', 36, -14], ['slime', 32, -24], ['slime', 38, -30], ['slime', 34, -8], ['slime', 48, -26],
  ['red', 44, -36], ['red', 50, -16], ['red', 30, -38], ['golem', 52, 30], ['golem', 38, 48],
];
/** Ngọc's attack: grows with the level, weapon adds on top. */
export const playerAtk = (profile) => 10 + (profile.stats.level - 1) * 2 + ((profile.gear && profile.gear.atk) || 0);
/** Damage a monster deals after armour (never below 1). */
export const hurt = (atk, profile) => Math.max(1, atk - ((profile.gear && profile.gear.def) || 0));
/** A target is hit when it is close and roughly in front of the attacker. */
export function inArc(px, pz, yaw, tx, tz, reach = 2.4, minDot = 0.25) {
  const dx = tx - px, dz = tz - pz, d = Math.hypot(dx, dz); if (d > reach) return false; if (d < 0.6) return true;
  return (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d >= minDot;
}

// ---------------------------------------------------------------- shop and equipment
/** slot: weapon | armor | charm | food. Names are plain English words the child meets while shopping (no quiz). */
export const ITEMS = {
  wood_sword: { en: 'Wooden Sword', vi: 'kiếm gỗ', slot: 'weapon', cost: 40, level: 1, atk: 5, color: 0xb98a4a, seller: 'forge' },
  iron_sword: { en: 'Iron Sword', vi: 'kiếm sắt', slot: 'weapon', cost: 150, level: 5, atk: 12, color: 0xc8ced6, seller: 'forge' },
  crystal_blade: { en: 'Crystal Blade', vi: 'kiếm pha lê', slot: 'weapon', cost: 400, level: 10, atk: 22, color: 0x7fd6ff, seller: 'forge' },
  leather_vest: { en: 'Leather Vest', vi: 'áo da', slot: 'armor', cost: 60, level: 2, def: 2, hp: 20, seller: 'forge' },
  iron_armor: { en: 'Iron Armor', vi: 'giáp sắt', slot: 'armor', cost: 220, level: 7, def: 5, hp: 50, seller: 'forge' },
  clover: { en: 'Lucky Clover', vi: 'cỏ bốn lá may mắn', slot: 'charm', cost: 120, level: 4, hp: 30, seller: 'rose' },
  bread: { en: 'Honey Bread', vi: 'bánh mì mật ong (hồi 50 máu, phím Q)', slot: 'food', cost: 8, level: 1, heal: 50, seller: 'rose' },
  // Map 2 gear (18/11), sold by Willow at the forest camp once Map 2 is open
  oak_blade: { en: 'Oakheart Blade', vi: 'kiếm lõi sồi', slot: 'weapon', cost: 700, level: 21, atk: 32, color: 0x9a6a3a, seller: 'forest' },
  moon_sword: { en: 'Moonlight Sword', vi: 'kiếm ánh trăng', slot: 'weapon', cost: 1500, level: 27, atk: 44, color: 0xbfd8ff, seller: 'forest' },
  ranger_cloak: { en: 'Ranger Cloak', vi: 'áo choàng kiểm lâm', slot: 'armor', cost: 900, level: 22, def: 9, hp: 90, seller: 'forest' },
  bark_armor: { en: 'Barkskin Armor', vi: 'giáp vỏ cây', slot: 'armor', cost: 1800, level: 28, def: 14, hp: 140, seller: 'forest' },
  owl_feather: { en: 'Owl Feather', vi: 'lông cú (bùa)', slot: 'charm', cost: 800, level: 24, hp: 70, seller: 'forest' },
  forest_stew: { en: 'Forest Stew', vi: 'súp rừng (hồi 120 máu, phím Q)', slot: 'food', cost: 20, level: 21, heal: 120, seller: 'forest' },
  // 18/11: Ben's fruit and vegetables (eaten with Q after the bread runs out)
  apple: { en: 'Apple', vi: 'quả táo (hồi 20 máu)', slot: 'food', cost: 4, level: 1, heal: 20, seller: 'produce' },
  carrot: { en: 'Carrot', vi: 'củ cà rốt (hồi 15 máu)', slot: 'food', cost: 3, level: 1, heal: 15, seller: 'produce' },
  banana: { en: 'Banana', vi: 'quả chuối (hồi 25 máu)', slot: 'food', cost: 5, level: 1, heal: 25, seller: 'produce' },
  corn: { en: 'Corn', vi: 'bắp ngô (hồi 30 máu)', slot: 'food', cost: 6, level: 1, heal: 30, seller: 'produce' },
  watermelon: { en: 'Watermelon', vi: 'quả dưa hấu (hồi 60 máu)', slot: 'food', cost: 12, level: 3, heal: 60, seller: 'produce' },
  // 18/11: things for the children's homes. Bram makes furniture, Lily sells garden things, Anna sells instruments.
  bed: { en: 'Bed', vi: 'cái giường', slot: 'home', cost: 120, level: 1, seller: 'home' },
  wardrobe: { en: 'Wardrobe', vi: 'tủ quần áo', slot: 'home', cost: 150, level: 1, seller: 'home' },
  mirror: { en: 'Mirror', vi: 'cái gương', slot: 'home', cost: 80, level: 1, seller: 'home' },
  table: { en: 'Table and Chairs', vi: 'bàn và ghế', slot: 'home', cost: 100, level: 1, seller: 'home' },
  sofa: { en: 'Sofa', vi: 'ghế sô-pha', slot: 'home', cost: 180, level: 3, seller: 'home' },
  lamp: { en: 'Lamp', vi: 'đèn cây', slot: 'home', cost: 60, level: 1, seller: 'home' },
  bookcase: { en: 'Bookcase', vi: 'giá sách', slot: 'home', cost: 140, level: 2, seller: 'home' },
  desk: { en: 'Desk', vi: 'bàn học', slot: 'home', cost: 110, level: 1, seller: 'home' },
  clock: { en: 'Clock', vi: 'đồng hồ treo tường', slot: 'home', cost: 70, level: 1, seller: 'home' },
  picture: { en: 'Picture', vi: 'bức tranh', slot: 'home', cost: 50, level: 1, seller: 'home' },
  rug: { en: 'Rug', vi: 'tấm thảm', slot: 'home', cost: 60, level: 1, seller: 'home' },
  plant: { en: 'Pot Plant', vi: 'chậu cây', slot: 'home', cost: 30, level: 1, seller: 'home' },
  flowers: { en: 'Flower Bed', vi: 'luống hoa', slot: 'yard', cost: 40, level: 1, seller: 'garden' },
  veg_patch: { en: 'Vegetable Patch', vi: 'luống rau', slot: 'yard', cost: 90, level: 1, seller: 'garden' },
  fruit_tree: { en: 'Fruit Tree', vi: 'cây ăn quả', slot: 'yard', cost: 120, level: 2, seller: 'garden' },
  bench: { en: 'Garden Bench', vi: 'ghế đá trong vườn', slot: 'yard', cost: 70, level: 1, seller: 'garden' },
  mailbox: { en: 'Mailbox', vi: 'hòm thư', slot: 'yard', cost: 30, level: 1, seller: 'garden' },
  garden_lamp: { en: 'Garden Lamp', vi: 'đèn vườn', slot: 'yard', cost: 50, level: 1, seller: 'garden' },
  guitar: { en: 'Guitar', vi: 'đàn ghi-ta', slot: 'home', cost: 150, level: 1, seller: 'music' },
  piano: { en: 'Piano', vi: 'đàn piano', slot: 'home', cost: 400, level: 8, seller: 'music' },
  drum: { en: 'Drum', vi: 'cái trống', slot: 'home', cost: 200, level: 3, seller: 'music' },
  violin: { en: 'Violin', vi: 'đàn vi-ô-lông', slot: 'home', cost: 250, level: 5, seller: 'music' },
};
export const bag = (profile) => profile.inv || (profile.inv = { owned: [], weapon: '', armor: '', charm: '', food: 0 });
/** What a child has put in their home (18/11): furniture and instruments inside, garden things in the yard. */
export const home = (profile) => profile.home || (profile.home = { items: [] });
const pantry = (b) => b.pantry || (b.pantry = {});
/** The children who own the two home lots: the first two players made on this computer (the admin does not get one). */
export const owners = (profiles, lots = 2) => profiles.filter((p) => p && !p.admin).slice(0, lots);
/** How many of a food the bag holds (bread, stew, or fruit and vegetables from Ben). */
export const foodCount = (profile, id) => { const b = bag(profile); return id === 'bread' ? b.food : id === 'forest_stew' ? (b.stew || 0) : (pantry(b)[id] || 0); };
/** Recomputes profile.gear from what is worn. */
export function wear(profile) {
  const b = bag(profile), g = { atk: 0, def: 0, hp: 0 };
  for (const slot of ['weapon', 'armor', 'charm']) { const it = ITEMS[b[slot]]; if (it) { g.atk += it.atk || 0; g.def += it.def || 0; g.hp += it.hp || 0; } }
  profile.gear = g; return g;
}
/** Buys (and puts on) an item. Returns { ok, why } — why: 'gold' | 'level' | 'owned'. */
export function buy(profile, id) {
  const it = ITEMS[id], b = bag(profile); if (!it) return { ok: false, why: 'none' };
  const placed = it.slot === 'home' || it.slot === 'yard';
  if (placed && home(profile).items.includes(id)) return { ok: false, why: 'have' };
  if (!placed && it.slot !== 'food' && b.owned.includes(id)) { b[it.slot] = id; wear(profile); return { ok: true, why: 'owned' }; }
  if (profile.stats.level < it.level) return { ok: false, why: 'level' };
  if (profile.stats.gold < it.cost) return { ok: false, why: 'gold' };
  profile.stats.gold -= it.cost;
  if (placed) home(profile).items.push(id);
  else if (it.slot === 'food') { if (id === 'forest_stew') b.stew = (b.stew || 0) + 1; else if (id === 'bread') b.food += 1; else pantry(b)[id] = (pantry(b)[id] || 0) + 1; } else { b.owned.push(id); b[it.slot] = id; wear(profile); }
  return { ok: true, why: '' };
}
/** Eats one bread. Returns the health restored (0 when there is none or health is full). */
export function eat(profile, hpMax) {
  const b = bag(profile), hp = profile.stats.hp ?? hpMax, P = pantry(b), fruit = Object.keys(P).filter((k) => P[k] > 0 && ITEMS[k]);
  if ((b.food <= 0 && !(b.stew > 0) && !fruit.length) || hp >= hpMax) return 0;
  let heal;
  if (b.stew > 0 && hpMax - hp > ITEMS.bread.heal) { b.stew -= 1; heal = ITEMS.forest_stew.heal; }      // stew for big wounds
  else if (b.food > 0) { b.food -= 1; heal = ITEMS.bread.heal; }
  else if (b.stew > 0) { b.stew -= 1; heal = ITEMS.forest_stew.heal; }
  else { const k = fruit.sort((x, y) => ITEMS[y].heal - ITEMS[x].heal)[0]; P[k] -= 1; heal = ITEMS[k].heal; }      // then the biggest fruit or vegetable
  const after = Math.min(hpMax, hp + heal); profile.stats.hp = after; return after - hp;
}
/** Selling back pays half the price (bread: half too, rounded down). Worn items are taken off first. */
export const SELL_RATE = 0.5;
export const sellPrice = (id) => Math.floor(ITEMS[id].cost * SELL_RATE);
export function sell(profile, id) {
  const it = ITEMS[id], b = bag(profile); if (!it) return 0;
  if (it.slot === 'food') { if (id === 'bread' || id === 'forest_stew') { const k = id === 'forest_stew' ? 'stew' : 'food'; if (!(b[k] > 0)) return 0; b[k] -= 1; } else { const P = pantry(b); if (!(P[id] > 0)) return 0; P[id] -= 1; } }
  else if (it.slot === 'home' || it.slot === 'yard') { const h = home(profile), i = h.items.indexOf(id); if (i < 0) return 0; h.items.splice(i, 1); }
  else { const i = b.owned.indexOf(id); if (i < 0) return 0; b.owned.splice(i, 1); if (b[it.slot] === id) b[it.slot] = ''; wear(profile); }
  const g = sellPrice(id); profile.stats.gold += g; return g;
}
export const shopList = (seller) => Object.entries(ITEMS).filter(([, it]) => it.seller === seller).map(([id]) => id);

// ---------------------------------------------------------------- hunting quests and the boss
/** English lines are original and short; grades 8-9 get longer sentences with the same job. */
export const HUNTS = [
  { kind: 'slime', need: 3, gold: 20, exp: 40, en: { easy: 'Please defeat three green slimes. They are eating my carrots!', hard: "Could you get rid of three green slimes? They've been eating my carrots all week." } },
  { kind: 'red', need: 2, gold: 35, exp: 70, en: { easy: 'Two red slimes are near the river. Please stop them!', hard: "Two red slimes have been seen near the river. Would you mind stopping them?" } },
  { kind: 'slime', need: 5, gold: 35, exp: 70, en: { easy: 'Five green slimes are in the meadow. Can you help?', hard: 'The meadow is full of green slimes again. Could you defeat five of them?' } },
  { kind: 'golem', need: 1, gold: 60, exp: 120, en: { easy: 'A big stone golem is by the farm. Be careful!', hard: "A stone golem is standing near the farm. It's dangerous, so please be careful!" } },
];
/** Map 2 (Forest of Memories) has its own board by the forest entrance, with its own jobs (17/11). */
export const FOREST_HUNTS = [
  { kind: 'bat', need: 3, gold: 60, exp: 300, en: { easy: 'Shadow bats are flying over the path. Please chase away three of them!', hard: "Three shadow bats keep scaring travellers on the path. Could you chase them away?" } },
  { kind: 'shroom', need: 2, gold: 80, exp: 380, en: { easy: 'Two angry mushrooms are near the camp. Please stop them!', hard: "Two angry mushrooms have been stamping around the camp. Would you mind stopping them?" } },
  { kind: 'bat', need: 5, gold: 90, exp: 450, en: { easy: 'More bats are here tonight. Can you defeat five?', hard: "The bats have come back in a big group. Could you defeat five of them?" } },
  { kind: 'shroom', need: 4, gold: 120, exp: 600, en: { easy: 'Four angry mushrooms are in the forest. Be brave!', hard: "Four angry mushrooms are hiding among the trees. You'll need to be brave!" } },
];
export const huntsOf = (region) => (region === 'forest' ? FOREST_HUNTS : HUNTS);
export const huntLine = (h, grade) => h.en[grade >= 8 ? 'hard' : 'easy'];
/** The hunt in progress for a board: profile.hunt (village) or profile.hunt2 (forest). */
export const hunt = (profile, region = 'village') => { const k = region === 'forest' ? 'hunt2' : 'hunt'; return profile[k] || (profile[k] = { i: 0, got: 0, active: false, done: 0 }); };
/** Counts a defeated monster for the active hunt on either board. Returns true when this kill finished one. */
export function countKill(profile, kind) {
  let done = false;
  for (const region of ['village', 'forest']) {
    const h = hunt(profile, region), list = huntsOf(region), q = list[h.i % list.length];
    if (!h.active || q.kind !== kind || h.got >= q.need) continue;
    h.got += 1; if (h.got >= q.need) done = true;
  }
  return done;
}
export const BOSS = { id: 'king', flag: 'boss1', name: 'Slime King', level: 8, hp: 600, atk: 16, exp: 400, gold: 150, speed: 1.4, color: 0x5fd0ff, size: 2.6 };
/** Map 1's last boss in the golem fields. Beating it at level 20 opens Map 2. */
export const BOSS2 = { id: 'ancient', flag: 'boss2', name: 'Ancient Golem', level: 18, hp: 1600, atk: 30, exp: 900, gold: 300, speed: 1.2, color: 0x9a8f7a, size: 3.0 };
/** Map 2's boss: the Mushroom Queen, deep in the west of the Forest of Memories near the old ruins. */
export const BOSS3 = { id: 'queen', flag: 'boss3', name: 'Mushroom Queen', level: 30, hp: 2600, atk: 46, exp: 1600, gold: 450, speed: 1.3, color: 0xc0397a, size: 3.0, region: 'forest' };
export const BOSSES = [BOSS, BOSS2, BOSS3];
/** Map 2 opens once the Ancient Golem is beaten and the hero has reached level 20 (owl gate passed or waiting). */
export const map2Ready = (profile) => !!(profile.flags.boss2 && profile.stats.level >= 20);

// ---------------------------------------------------------------- mini game pay
/** Each skill game pays in full for its first FULL_PLAYS games of the day, then LATER_PAY of it, so gold and EXP
 *  come mostly from training and quests. Returns the factor and counts this play. */
export const FULL_PLAYS = 3, LATER_PAY = 0.2;
export function payFactor(profile, game, day) {
  const r = profile.plays && profile.plays.day === day ? profile.plays : (profile.plays = { day, n: {} });
  r.n[game] = (r.n[game] || 0) + 1;
  return r.n[game] <= FULL_PLAYS ? 1 : LATER_PAY;
}
/** Applies payFactor to a reward {gold, exp}; rounds down but never to zero for a non-zero reward. */
export function pay(profile, game, day, gold, exp = 0) {
  const k = payFactor(profile, game, day), f = (v) => (v > 0 ? Math.max(1, Math.floor(v * k)) : 0);
  return { gold: f(gold), exp: f(exp), full: k === 1, left: Math.max(0, FULL_PLAYS - profile.plays.n[game]) };
}
/** The boss raises a word shield each time its health drops past one of these fractions. */
export const SHIELDS = [0.75, 0.5, 0.25];
export const shieldDue = (hp, max, broken) => broken < SHIELDS.length && hp / max <= SHIELDS[broken];
