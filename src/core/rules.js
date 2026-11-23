// Combat and reward numbers in one place (no three.js, tested in node).
import { rankAtk } from './saga.js';
import { powers, resisted, mpOf, restoreMp, FEEDS } from './skills.js';
// (20/11) el: the monster's element (core/skills.js): it decides which spells hurt it most and which resistance its hits meet
export const MONSTERS = {
  slime: { el: 'wind', name: 'Green Slime', level: 1, hp: 30, atk: 6, exp: 12, gold: 3, speed: 2.0, color: 0x7fd86a, size: 1.0 },
  red: { el: 'fire', name: 'Red Slime', level: 4, hp: 70, atk: 11, exp: 26, gold: 7, speed: 2.5, color: 0xff7a6a, size: 1.25 },
  golem: { el: 'thunder', name: 'Stone Golem', level: 8, elite: true, hp: 180, atk: 18, exp: 75, gold: 20, speed: 1.6, color: 0xa49aa6, size: 1.7 },
  // The Forest of Memories is the last chapter of Map 1 (19/11): levels 11-16, open once the forest gate is
  bat: { el: 'wind', name: 'Shadow Bat', level: 11, ranged: true, hp: 200, atk: 21, exp: 70, gold: 12, speed: 3.2, color: 0x6a4a9a, size: 1.0, fly: true, hover: 0.05 },      // hover: the Blender bat already floats 0.9 m up in its own file
  shroom: { el: 'ice', name: 'Angry Mushroom', level: 14, ranged: true, elite: true, hp: 320, atk: 26, exp: 100, gold: 16, speed: 1.8, color: 0xe2483e, size: 1.3 },
  // (20/11) CC0 monsters from Quaternius' Ultimate Monsters pack (tools/monsters/import_quaternius.py, assets/models/CREDITS.md):
  // 1 m tall in the file, `fit` is the height in the game; clips Idle, Walk, Weapon (attack), HitReact, Death
  goblin: { el: 'ice', name: 'Frost Goblin', level: 5, ranged: true, hp: 110, atk: 12, exp: 40, gold: 10, speed: 2.4, color: 0x4f9ad0, size: 1.0, model: 'goblin', fit: 1.35 },
  imp: { el: 'fire', name: 'Ember Imp', level: 9, ranged: true, hp: 210, atk: 19, exp: 80, gold: 16, speed: 2.7, color: 0xd8402e, size: 1.0, model: 'imp', fit: 1.45 },
  orc: { el: 'wind', name: 'Gale Orc', level: 15, elite: true, hp: 420, atk: 28, exp: 130, gold: 22, speed: 2.1, color: 0x6fae3a, size: 1.15, model: 'orc', fit: 1.6 },
  // (20/11) lô 22: bunny (Quaternius), wisp / fox / gull (Blender, real size in the file; the wisp and the gull float on their own)
  bunny: { el: 'ice', name: 'Frost Bunny', level: 2, hp: 50, atk: 8, exp: 16, gold: 4, speed: 2.6, color: 0xbfe8ff, size: 1.0, model: 'bunny', fit: 0.85 },
  wisp: { el: 'thunder', name: 'Storm Wisp', level: 12, ranged: true, hp: 230, atk: 23, exp: 85, gold: 14, speed: 2.8, color: 0xffe14a, size: 1.0, fly: true, hover: 0.05, model: 'wisp', fit: 1.3 },
  fox: { el: 'fire', name: 'Ember Fox', level: 13, hp: 270, atk: 25, exp: 95, gold: 15, speed: 3.0, color: 0xff8a3a, size: 1.0, model: 'fox', fit: 1.0 },
  gull: { el: 'wind', name: 'Storm Gull', level: 23, ranged: true, hp: 320, atk: 36, exp: 140, gold: 25, speed: 3.0, color: 0xc8d4e0, size: 1.0, fly: true, hover: 0.05, model: 'gull', fit: 1.2 },
  // Map 2 (Sunny Harbor, levels 21-30): the Blender models in assets/models/harbor_mob_*; `fit` scales the model, `model` names it
  crab: { el: 'ice', name: 'Beach Crab', level: 21, hp: 300, atk: 34, exp: 130, gold: 24, speed: 2.3, color: 0xe2483e, size: 1.0, model: 'crab', fit: 1.0 },
  jelly: { el: 'thunder', name: 'Glow Jellyfish', level: 24, ranged: true, hp: 340, atk: 38, exp: 150, gold: 26, speed: 1.9, color: 0xb48ae8, size: 1.0, fly: true, model: 'jelly', fit: 1.2 },
  pirate: { el: 'fire', name: 'Little Pirate', level: 27, ranged: true, elite: true, hp: 520, atk: 44, exp: 210, gold: 36, speed: 2.4, color: 0x2f4f8a, size: 1.2, model: 'pirate', fit: 1.15 },
};
/** Monsters of the Memory Forest, the last chapter of Map 1: [kind, x, z] (open ground away from crystals, paths and the gate). */
export const FOREST_SPAWNS = [
  ['bat', -25, -43], ['bat', 35, -34], ['bat', -16, -31], ['bat', 38, -19], ['bat', -46, -4],
  ['shroom', 14, -7], ['shroom', -19, 14], ['shroom', 17, 26], ['shroom', -40, 26], ['shroom', 2, 20],
  ['orc', 18, -10], ['orc', 21, 22], ['orc', 6, 16],
  ['wisp', -30, -22], ['wisp', 26, -26], ['wisp', -8, 22], ['fox', 28, 4], ['fox', -33, 8], ['fox', 10, -36],      // (20/11) lô 22: Storm Wisps (thunder) and Ember Foxes (fire)      // (20/11) Gale Orcs, wind
];
/** Map 2 monsters in Sunny Harbor: crabs on the south beach, jellyfish along the north shore, little pirates round the lighthouse point. */
export const HARBOR_SPAWNS = [
  ['crab', 9, 41], ['crab', 17, 45], ['crab', 7, 51], ['crab', 21, 48], ['crab', 12, 57],
  ['jelly', 8, -19], ['jelly', 15, -28], ['jelly', 22, -34], ['jelly', 44, -32],
  ['pirate', 32, -29], ['pirate', 14, -40], ['pirate', 40, -40], ['pirate', 12, -46], ['pirate', 26, -37],
  ['gull', 12, -24], ['gull', 18, -31], ['gull', 30, -33],      // (20/11) Storm Gulls over the north shore
];
/** Where monsters live in the Starter Village region: [kind, x, z]. The Wild Meadow is north-east, golems guard the south-east. */
export const SPAWNS = [
  ['slime', 36, -14], ['slime', 32, -24], ['slime', 38, -30], ['slime', 34, -8], ['slime', 48, -26],
  ['red', 44, -36], ['red', 50, -16], ['red', 30, -38], ['golem', 52, 30], ['golem', 38, 48],
  ['bunny', 28, -18], ['bunny', 30, -32], ['bunny', 40, -9],      // (20/11) lô 22: Frost Bunnies near the meadow gate
  ['goblin', 40, -18], ['goblin', 42, -28], ['goblin', 44, -10], ['imp', 48, 26], ['imp', 42, 44], ['imp', 46, 34],      // (20/11) Frost Goblins (ice) in the meadow, Ember Imps (fire) in the golem fields
];
/** (21/11) Safe places: monsters never walk in and do not chase or shoot a hero standing inside (the village streets and
 *  shops, the players' homes, the apple orchard and every mini game; the harbour town, the market and the fishing pier). */
export const SAFE = {
  village: [{ x: 2, z: 4, r: 24 }, { x: 40, z: 10, r: 13 }, ...[[-15, -17], [-6, -33], [10, 28], [-31, 4.5], [18.4, 19.2], [33.5, 6]].map(([x, z]) => ({ x, z, r: 7 })),      // the town, the orchard, each mini game
    { x: -46, z: 2, r: 15 }, { x: -40, z: -18, r: 7 }, { x: -3, z: 50, r: 9 }, { x: -18, z: 50, r: 8 }],
  harbor: [{ x: -12, z: 2, r: 22 }, { x: 2, z: 16, r: 9 }, { x: 34, z: 28, r: 6 }, { x: 22, z: 28.6, r: 5 }],
  forest: [{ x: -30, z: 50, r: 9 }],
};
export const inSafe = (region, x, z, pad = 0) => (SAFE[region] || []).some((s) => Math.hypot(x - s.x, z - s.z) < s.r + pad);
/** (21/11) Monsters walk towards the hero at this share of their speed ("they rush in too fast"); they come back to life after RESPAWN seconds. */
export const CHASE = 0.62, RESPAWN = { normal: 35, elite: 70, boss: 300 };
/** The hero's attack: grows with the level, weapon adds on top. */
export const playerAtk = (profile) => 10 + (profile.stats.level - 1) * 2 + ((profile.gear && profile.gear.atk) || 0) + rankAtk(profile) + powers(profile).atk;      // + skill points (Fire Heart)      // + the Word Keeper rank (saga.js)
/** Damage a monster deals after armour (never below 1). */
export const hurt = (atk, profile, el = '') => resisted(profile, Math.max(1, atk - ((profile.gear && profile.gear.def) || 0) - powers(profile).def), el);      // + Ice Skin and the element resistance (20/11)
/** A target is hit when it is close and roughly in front of the attacker. */
export function inArc(px, pz, yaw, tx, tz, reach = 2.4, minDot = 0.25) {
  const dx = tx - px, dz = tz - pz, d = Math.hypot(dx, dz); if (d > reach) return false; if (d < 0.6) return true;
  return (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d >= minDot;
}

// ---------------------------------------------------------------- shop and equipment
/** slot: weapon | armor | charm | food. Names are plain English words the child meets while shopping (no quiz). */
export const ITEMS = {
  wood_sword: { en: 'Wooden Sword', vi: 'kiếm gỗ', slot: 'weapon', cost: 40, level: 1, atk: 5, color: 0xb98a4a, seller: 'forge' },
  iron_sword: { en: 'Iron Sword', vi: 'kiếm sắt', slot: 'weapon', cost: 110, level: 5, atk: 12, color: 0xc8ced6, seller: 'forge' },
  crystal_blade: { en: 'Crystal Blade', vi: 'kiếm pha lê', slot: 'weapon', cost: 300, level: 10, atk: 22, color: 0x7fd6ff, seller: 'forge' },
  leather_vest: { en: 'Leather Vest', vi: 'áo da', slot: 'armor', cost: 45, level: 2, def: 2, hp: 20, seller: 'forge' },
  iron_armor: { en: 'Iron Armor', vi: 'giáp sắt', slot: 'armor', cost: 160, level: 7, def: 5, hp: 50, seller: 'forge' },
  clover: { en: 'Lucky Clover', vi: 'cỏ bốn lá may mắn', slot: 'charm', cost: 90, level: 4, hp: 30, seller: 'rose' },
  bread: { en: 'Honey Bread', vi: 'bánh mì mật ong (hồi 50 máu, phím Q hoặc túi đồ V)', slot: 'food', cost: 6, level: 1, heal: 50, seller: 'rose' },
  // (20/11) potions: stack in the pantry like food, but Q never drinks them (they are for the quick slots 5-8 and the bag, key V).
  // Prices are about one fight's gold per small potion; the hero's health is 100 at level 1 and about 450 at level 30.
  hp_s: { en: 'Small Health Potion', vi: 'bình máu nhỏ (+40 máu)', slot: 'food', potion: true, heal: 40, cost: 6, level: 1, seller: 'healer' },
  hp_m: { en: 'Health Potion', vi: 'bình máu vừa (+120 máu)', slot: 'food', potion: true, heal: 120, cost: 18, level: 8, seller: 'healer' },
  hp_l: { en: 'Big Health Potion', vi: 'bình máu lớn (+300 máu)', slot: 'food', potion: true, heal: 300, cost: 45, level: 20, seller: 'healer' },
  mp_s: { en: 'Small Mana Potion', vi: 'bình mana nhỏ (+60 mana)', slot: 'food', potion: true, mana: 60, cost: 6, level: 1, seller: 'healer' },
  mp_m: { en: 'Mana Potion', vi: 'bình mana vừa (+150 mana)', slot: 'food', potion: true, mana: 150, cost: 14, level: 8, seller: 'healer' },
  mp_l: { en: 'Big Mana Potion', vi: 'bình mana lớn (+400 mana)', slot: 'food', potion: true, mana: 400, cost: 35, level: 20, seller: 'healer' },
  // rare drops of the elite monsters and the bosses (never sold in a shop; selling one back pays half of `cost`)
  dawn_blade: { en: 'Dawnbreaker Blade', vi: 'kiếm Rạng Đông (hiếm)', slot: 'weapon', rare: true, cost: 360, level: 9, atk: 26, color: 0xffe08a },
  silver_mail: { en: 'Silverleaf Mail', vi: 'giáp lá bạc (hiếm)', slot: 'armor', rare: true, cost: 340, level: 10, def: 8, hp: 80, color: 0xcfd8e8 },
  lucky_star: { en: 'Lucky Star Charm', vi: 'bùa Sao May Mắn (hiếm)', slot: 'charm', rare: true, cost: 300, level: 8, hp: 70, color: 0xffd23c },
  tide_blade: { en: 'Tidecaller Blade', vi: 'kiếm Gọi Thủy Triều (hiếm)', slot: 'weapon', rare: true, cost: 1300, level: 25, atk: 46, color: 0x6fd0ff },
  coral_mail: { en: 'Coralheart Mail', vi: 'giáp Tim San Hô (hiếm)', slot: 'armor', rare: true, cost: 1250, level: 26, def: 13, hp: 130, color: 0xff8a7a },
  sun_charm: { en: 'Sunstone Charm', vi: 'bùa Đá Mặt Trời (hiếm)', slot: 'charm', rare: true, cost: 1100, level: 24, hp: 110, color: 0xffb03c },
  // (20/11) element gear, Map 1. Swords (kind: 'sword') make the close spells of their element stronger (near), staffs
  // (kind: 'staff') the far spells and ultimates (far); a weapon also gives its element to the plain J attack.
  ember_sword: { en: 'Ember Sword', vi: 'kiếm than hồng (hệ Lửa)', slot: 'weapon', kind: 'sword', el: 'fire', near: 0.2, cost: 220, level: 6, atk: 14, color: 0xff6a2a, seller: 'forge' },
  frost_sword: { en: 'Frost Sword', vi: 'kiếm sương giá (hệ Băng)', slot: 'weapon', kind: 'sword', el: 'ice', near: 0.2, cost: 220, level: 6, atk: 14, color: 0x6fd0ff, seller: 'forge' },
  gale_sword: { en: 'Gale Sword', vi: 'kiếm gió lốc (hệ Gió)', slot: 'weapon', kind: 'sword', el: 'wind', near: 0.2, cost: 220, level: 6, atk: 14, color: 0x6fe08a, seller: 'forge' },
  spark_sword: { en: 'Spark Sword', vi: 'kiếm tia lửa điện (hệ Sét)', slot: 'weapon', kind: 'sword', el: 'thunder', near: 0.2, cost: 220, level: 6, atk: 14, color: 0xffd23c, seller: 'forge' },
  ember_staff: { en: 'Ember Staff', vi: 'gậy phép than hồng (hệ Lửa)', slot: 'weapon', kind: 'staff', el: 'fire', far: 0.25, cost: 250, level: 8, atk: 10, color: 0xff6a2a, seller: 'forge' },
  frost_staff: { en: 'Frost Staff', vi: 'gậy phép sương giá (hệ Băng)', slot: 'weapon', kind: 'staff', el: 'ice', far: 0.25, cost: 250, level: 8, atk: 10, color: 0x6fd0ff, seller: 'forge' },
  gale_staff: { en: 'Gale Staff', vi: 'gậy phép gió lốc (hệ Gió)', slot: 'weapon', kind: 'staff', el: 'wind', far: 0.25, cost: 250, level: 8, atk: 10, color: 0x6fe08a, seller: 'forge' },
  spark_staff: { en: 'Spark Staff', vi: 'gậy phép tia sét (hệ Sét)', slot: 'weapon', kind: 'staff', el: 'thunder', far: 0.25, cost: 250, level: 8, atk: 10, color: 0xffd23c, seller: 'forge' },
  fire_amulet: { en: 'Fire Amulet', vi: 'bùa Lửa (+15% phép Lửa, kháng Gió)', slot: 'charm', el: 'fire', eldmg: 0.15, resist: 0.15, cost: 150, level: 5, hp: 20, seller: 'rose' },
  ice_amulet: { en: 'Ice Amulet', vi: 'bùa Băng (+15% phép Băng, kháng Lửa)', slot: 'charm', el: 'ice', eldmg: 0.15, resist: 0.15, cost: 150, level: 5, hp: 20, seller: 'rose' },
  wind_amulet: { en: 'Wind Amulet', vi: 'bùa Gió (+15% phép Gió, kháng Sét)', slot: 'charm', el: 'wind', eldmg: 0.15, resist: 0.15, cost: 150, level: 5, hp: 20, seller: 'rose' },
  thunder_amulet: { en: 'Thunder Amulet', vi: 'bùa Sét (+15% phép Sét, kháng Băng)', slot: 'charm', el: 'thunder', eldmg: 0.15, resist: 0.15, cost: 150, level: 5, hp: 20, seller: 'rose' },
  // Map 2 gear (18/11), sold by Willow at the forest camp once Map 2 is open
  oak_blade: { en: 'Oakheart Blade', vi: 'kiếm lõi sồi', slot: 'weapon', cost: 550, level: 21, atk: 32, color: 0x9a6a3a, seller: 'forest' },
  moon_sword: { en: 'Moonlight Sword', vi: 'kiếm ánh trăng', slot: 'weapon', cost: 1100, level: 27, atk: 44, color: 0xbfd8ff, seller: 'forest' },
  ranger_cloak: { en: 'Ranger Cloak', vi: 'áo choàng kiểm lâm', slot: 'armor', cost: 700, level: 22, def: 9, hp: 90, seller: 'forest' },
  bark_armor: { en: 'Barkskin Armor', vi: 'giáp vỏ cây', slot: 'armor', cost: 1300, level: 28, def: 14, hp: 140, seller: 'forest' },
  owl_feather: { en: 'Owl Feather', vi: 'lông cú (bùa)', slot: 'charm', cost: 600, level: 24, hp: 70, seller: 'forest' },
  // (20/11) element gear, Map 2 (Willow's stall at the harbor)
  blaze_blade: { en: 'Blaze Blade', vi: 'kiếm hỏa diệm (hệ Lửa)', slot: 'weapon', kind: 'sword', el: 'fire', near: 0.35, eldmg: 0.1, cost: 1200, level: 23, atk: 38, color: 0xff6a2a, seller: 'forest' },
  glacier_blade: { en: 'Glacier Blade', vi: 'kiếm băng hà (hệ Băng)', slot: 'weapon', kind: 'sword', el: 'ice', near: 0.35, eldmg: 0.1, cost: 1200, level: 23, atk: 38, color: 0x6fd0ff, seller: 'forest' },
  tempest_blade: { en: 'Tempest Blade', vi: 'kiếm cuồng phong (hệ Gió)', slot: 'weapon', kind: 'sword', el: 'wind', near: 0.35, eldmg: 0.1, cost: 1200, level: 23, atk: 38, color: 0x6fe08a, seller: 'forest' },
  storm_blade: { en: 'Storm Blade', vi: 'kiếm lôi đình (hệ Sét)', slot: 'weapon', kind: 'sword', el: 'thunder', near: 0.35, eldmg: 0.1, cost: 1200, level: 23, atk: 38, color: 0xffd23c, seller: 'forest' },
  inferno_staff: { en: 'Inferno Staff', vi: 'trượng hỏa ngục (hệ Lửa)', slot: 'weapon', kind: 'staff', el: 'fire', far: 0.4, eldmg: 0.1, cost: 1250, level: 24, atk: 28, color: 0xff6a2a, seller: 'forest' },
  glacier_staff: { en: 'Glacier Staff', vi: 'trượng băng hà (hệ Băng)', slot: 'weapon', kind: 'staff', el: 'ice', far: 0.4, eldmg: 0.1, cost: 1250, level: 24, atk: 28, color: 0x6fd0ff, seller: 'forest' },
  tempest_staff: { en: 'Tempest Staff', vi: 'trượng cuồng phong (hệ Gió)', slot: 'weapon', kind: 'staff', el: 'wind', far: 0.4, eldmg: 0.1, cost: 1250, level: 24, atk: 28, color: 0x6fe08a, seller: 'forest' },
  storm_staff: { en: 'Storm Staff', vi: 'trượng lôi đình (hệ Sét)', slot: 'weapon', kind: 'staff', el: 'thunder', far: 0.4, eldmg: 0.1, cost: 1250, level: 24, atk: 28, color: 0xffd23c, seller: 'forest' },
  flame_mail: { en: 'Flame Mail', vi: 'giáp lửa (kháng Gió 30%)', slot: 'armor', el: 'fire', resist: 0.3, eldmg: 0.05, cost: 1100, level: 25, def: 11, hp: 110, seller: 'forest' },
  frost_mail: { en: 'Frost Mail', vi: 'giáp băng (kháng Lửa 30%)', slot: 'armor', el: 'ice', resist: 0.3, eldmg: 0.05, cost: 1100, level: 25, def: 11, hp: 110, seller: 'forest' },
  wind_cloak: { en: 'Wind Cloak', vi: 'áo choàng gió (kháng Sét 30%)', slot: 'armor', el: 'wind', resist: 0.3, eldmg: 0.05, cost: 1100, level: 25, def: 11, hp: 110, seller: 'forest' },
  storm_plate: { en: 'Storm Plate', vi: 'giáp sấm (kháng Băng 30%)', slot: 'armor', el: 'thunder', resist: 0.3, eldmg: 0.05, cost: 1100, level: 25, def: 11, hp: 110, seller: 'forest' },
  forest_stew: { en: 'Forest Stew', vi: 'súp rừng (hồi 120 máu, phím Q)', slot: 'food', cost: 15, level: 21, heal: 120, seller: 'forest' },
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
/** (24/11) "furniture and decorations cost too little: dearer, so the children must plan": everything for the house and yard is 2.5 times the old price. */
export const HOME_PRICE_K = 2.5;
for (const it of Object.values(ITEMS)) if (it.slot === 'home' || it.slot === 'yard') it.cost = Math.round(it.cost * HOME_PRICE_K / 5) * 5;
export const bag = (profile) => profile.inv || (profile.inv = { owned: [], weapon: '', armor: '', charm: '', food: 0 });
/** What a child has put in their home (18/11): furniture and instruments inside, garden things in the yard. */
export const home = (profile) => profile.home || (profile.home = { items: [] });
const pantry = (b) => b.pantry || (b.pantry = {});
/** The children who own the home lots (four since 24/11): the first four players made on this computer (the admin does not get one). */
export const owners = (profiles, lots = 4) => profiles.filter((p) => p && !p.admin).slice(0, lots);
/** How many of a food the bag holds (bread, stew, or fruit and vegetables from Ben). */
export const foodCount = (profile, id) => { const b = bag(profile); return id === 'bread' ? b.food : id === 'forest_stew' ? (b.stew || 0) : (pantry(b)[id] || 0); };
/** Recomputes profile.gear from what is worn. */
export function wear(profile) {
  const b = bag(profile), g = { atk: 0, def: 0, hp: 0, el: '', near: 0, far: 0, resist: {}, eldmg: {} };
  for (const slot of ['weapon', 'armor', 'charm']) {
    const it = ITEMS[b[slot]]; if (!it) continue; g.atk += it.atk || 0; g.def += it.def || 0; g.hp += it.hp || 0;
    if (it.el) {      // (20/11) element gear: the weapon gives its element to the plain J attack; every piece adds its bonuses
      if (slot === 'weapon') { g.el = it.el; g.near += it.near || 0; g.far += it.far || 0; }
      if (it.resist) g.resist[FEEDS[it.el]] = (g.resist[FEEDS[it.el]] || 0) + it.resist;      // (24/11) it resists the element that beats its own
      if (it.eldmg) g.eldmg[it.el] = (g.eldmg[it.el] || 0) + it.eldmg;
    }
  }
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
  const b = bag(profile), hp = profile.stats.hp ?? hpMax, P = pantry(b), fruit = Object.keys(P).filter((k) => P[k] > 0 && ITEMS[k] && !ITEMS[k].potion);
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

// ---------------------------------------------------------------- the bag (key V), potions and quick slots 5-8, rare drops (20/11)
/** Everything that can be used from the bag, stacked: [{ id, n }] (bread and stew first, then fruit, then potions). */
export function consumables(profile) {
  const b = bag(profile), P = pantry(b), out = [];
  if (b.food > 0) out.push({ id: 'bread', n: b.food }); if (b.stew > 0) out.push({ id: 'forest_stew', n: b.stew });
  for (const k of Object.keys(P)) if (P[k] > 0 && ITEMS[k] && !ITEMS[k].potion) out.push({ id: k, n: P[k] });
  for (const k of Object.keys(P)) if (P[k] > 0 && ITEMS[k] && ITEMS[k].potion) out.push({ id: k, n: P[k] });
  return out;
}
/** Gear in the bag that is not worn: [{ id }] (what the child owns minus the three worn pieces). */
export const spareGear = (profile) => { const b = bag(profile); return b.owned.filter((id) => ITEMS[id] && b[ITEMS[id].slot] !== id); };
/** Quick slots 5-8: item ids (or ''). */
export const quick = (profile) => { const b = bag(profile); if (!Array.isArray(b.quick)) b.quick = ['', '', '', '']; return b.quick; };
export function setQuick(profile, i, id) {
  const q = quick(profile); if (i < 0 || i > 3) return false;
  if (id && !(ITEMS[id] && ITEMS[id].slot === 'food')) return false;
  if (id) for (let k = 0; k < 4; k++) if (q[k] === id) q[k] = '';      // one slot per item
  q[i] = id || ''; return true;
}
/** Uses one of an item from the bag. hpMax: the health cap. Mana comes from core/skills.js. Returns { ok, heal, mana, why }. */
export function useItem(profile, id, hpMax) {
  const it = ITEMS[id]; if (!it || it.slot !== 'food') return { ok: false, why: 'none' };
  if (foodCount(profile, id) <= 0) return { ok: false, why: 'empty' };
  const hp = profile.stats.hp ?? hpMax;
  if (it.mana) { const max = powers(profile).mpMax, now = mpOf(profile); if (now >= max) return { ok: false, why: 'full' }; const got = Math.min(max - now, it.mana); take(profile, id); restoreMp(profile, got); return { ok: true, heal: 0, mana: got }; }
  if (hp >= hpMax) return { ok: false, why: 'full' };
  take(profile, id); const after = Math.min(hpMax, hp + it.heal); profile.stats.hp = after; return { ok: true, heal: after - hp, mana: 0 };
}
function take(profile, id) { const b = bag(profile); if (id === 'bread') b.food -= 1; else if (id === 'forest_stew') b.stew -= 1; else pantry(b)[id] -= 1; }
export const useQuick = (profile, i, hpMax) => { const id = quick(profile)[i]; return id ? { ...useItem(profile, id, hpMax), id } : { ok: false, why: 'none' }; };
/** Elite monsters (tougher kinds) and bosses drop rare gear, rarely: 5% an elite kill, 25% a boss's first defeat, 12% after that. */
export const LOOT = { elite: 0.05, boss: 0.25, bossAgain: 0.12 };
export const isElite = (kind) => !!(MONSTERS[kind] && MONSTERS[kind].elite);
/** Rolls a rare drop for a defeated monster. def: the monster or boss definition; first: the boss's first defeat. Returns an item id or null. */
export function lootRoll(profile, def, first = false, rnd = Math.random) {
  const boss = !!def.hp && !!def.flag, chance = boss ? (first ? LOOT.boss : LOOT.bossAgain) : isElite(def.id || def.kind) ? LOOT.elite : 0;
  if (!chance || rnd() >= chance) return null;
  const b = bag(profile), lv = profile.stats.level, pool = Object.keys(ITEMS).filter((id) => ITEMS[id].rare && ITEMS[id].level <= lv + 3 && !b.owned.includes(id));
  return pool.length ? pool[Math.floor(rnd() * pool.length) % pool.length] : null;
}
/** Rare clothes and jewellery that elites and bosses may drop besides gear (20/11): 3% an elite kill, 35% a boss's first defeat, 15% after that. */
export const CLOTH_LOOT = [{ kind: 'tiara', color: 'gold' }, { kind: 'necklace', color: 'purple' }, { kind: 'earrings', color: 'blue' }, { kind: 'gown', color: 'purple' }, { kind: 'aodai', color: 'red' }, { kind: 'jacket', color: 'black' }, { kind: 'hoodie', color: 'pink' }, { kind: 'hairclip', color: 'pink' }];
export function lootCloth(profile, def, first = false, rnd = Math.random, owned = () => false) {
  const boss = !!def.hp && !!def.flag, chance = boss ? (first ? 0.35 : 0.15) : isElite(def.id || def.kind) ? 0.03 : 0;
  if (!chance || rnd() >= chance) return null;
  const pool = CLOTH_LOOT.filter((c) => !owned(c)); return pool.length ? pool[Math.floor(rnd() * pool.length) % pool.length] : null;
}
/** Adds a dropped piece to the bag (not worn: the child decides). */
export function giveLoot(profile, id) { const b = bag(profile); if (!ITEMS[id] || b.owned.includes(id)) return false; b.owned.push(id); return true; }
export const shopList = (seller) => Object.entries(ITEMS).filter(([, it]) => it.seller === seller).map(([id]) => id);

// ---------------------------------------------------------------- hunting quests and the boss
/** English lines are original and short; grades 8-9 get longer sentences with the same job. */
export const HUNTS = [
  { kind: 'slime', need: 3, gold: 20, exp: 40, en: { easy: 'Please defeat three green slimes. They are eating my carrots!', hard: "Could you get rid of three green slimes? They've been eating my carrots all week." } },
  { kind: 'red', need: 2, gold: 35, exp: 70, en: { easy: 'Two red slimes are near the river. Please stop them!', hard: "Two red slimes have been seen near the river. Would you mind stopping them?" } },
  { kind: 'slime', need: 5, gold: 35, exp: 70, en: { easy: 'Five green slimes are in the meadow. Can you help?', hard: 'The meadow is full of green slimes again. Could you defeat five of them?' } },
  { kind: 'golem', need: 1, gold: 60, exp: 120, en: { easy: 'A big stone golem is by the farm. Be careful!', hard: "A stone golem is standing near the farm. It's dangerous, so please be careful!" } },
  { kind: 'goblin', need: 3, gold: 40, exp: 90, en: { easy: 'Frost goblins froze our water bucket! Please stop three of them.', hard: "Three frost goblins have frozen the water in our buckets. Could you chase them away? Fire works well on ice!" } },
  { kind: 'imp', need: 3, gold: 60, exp: 150, en: { easy: 'Little fire imps are burning the grass. Please stop three!', hard: "Some fire imps keep setting the grass on fire near the golem fields. Would you stop three of them? Wind blows fire out!" } },
];
/** The Forest of Memories (last chapter of Map 1) has its own board by the forest entrance, with its own jobs (17/11, retuned 19/11). */
export const FOREST_HUNTS = [
  { kind: 'bat', need: 3, gold: 40, exp: 150, en: { easy: 'Shadow bats are flying over the path. Please chase away three of them!', hard: "Three shadow bats keep scaring travellers on the path. Could you chase them away?" } },
  { kind: 'shroom', need: 2, gold: 55, exp: 200, en: { easy: 'Two angry mushrooms are near the camp. Please stop them!', hard: "Two angry mushrooms have been stamping around the camp. Would you mind stopping them?" } },
  { kind: 'bat', need: 5, gold: 65, exp: 260, en: { easy: 'More bats are here tonight. Can you defeat five?', hard: "The bats have come back in a big group. Could you defeat five of them?" } },
  { kind: 'shroom', need: 4, gold: 90, exp: 360, en: { easy: 'Four angry mushrooms are in the forest. Be brave!', hard: "Four angry mushrooms are hiding among the trees. You'll need to be brave!" } },
  { kind: 'wisp', need: 3, gold: 80, exp: 300, en: { easy: 'Storm wisps are flickering over the trees. Please chase away three!', hard: "Three storm wisps keep flickering over the trees and frightening the deer. Could you chase them away? Wind slows them down!" } },
  { kind: 'fox', need: 3, gold: 90, exp: 340, en: { easy: 'Ember foxes are running through the camp. Please stop three!', hard: "Some ember foxes keep running through the camp and singeing our blankets. Would you stop three of them? Ice cools them down!" } },
  { kind: 'orc', need: 3, gold: 100, exp: 420, en: { easy: 'Gale orcs are blowing down our tents. Please stop three!', hard: "Three gale orcs keep blowing our tents down at night. Could you stop them? Thunder beats wind!" } },
];
/** Map 2 (Sunny Harbor) board: crabs, jellyfish and pirates (18/11). */
export const HARBOR_HUNTS = [
  { kind: 'crab', need: 3, gold: 70, exp: 320, en: { easy: 'Beach crabs are pinching the fishermen. Please chase away three of them!', hard: "The beach crabs keep pinching the fishermen's toes. Could you chase three of them away?" } },
  { kind: 'jelly', need: 3, gold: 90, exp: 420, en: { easy: 'Purple jellyfish are floating near the rocks. Please stop three!', hard: "Glowing jellyfish are drifting near the rocks and scaring the swimmers. Would you mind stopping three of them?" } },
  { kind: 'pirate', need: 2, gold: 120, exp: 560, en: { easy: 'Two little pirates are stealing fish by the lighthouse!', hard: "Two little pirates have been stealing fish near the lighthouse. Please put a stop to it!" } },
  { kind: 'crab', need: 5, gold: 130, exp: 650, en: { easy: 'More crabs came with the tide. Can you defeat five?', hard: "The tide has brought a big group of crabs onto the beach. Could you defeat five of them?" } },
  { kind: 'gull', need: 3, gold: 140, exp: 700, en: { easy: 'Storm gulls are stealing our fish! Please chase away three.', hard: "Three storm gulls keep diving down and stealing the fishermen's lunch. Could you chase them away? Thunder works well on them!" } },
  { kind: 'pirate', need: 4, gold: 190, exp: 900, en: { easy: 'Four pirates are hiding near the rocks. Be brave!', hard: "Four pirates are hiding among the rocks. You'll need to be brave!" } },
];
export const huntsOf = (region) => (region === 'forest' ? FOREST_HUNTS : region === 'harbor' ? HARBOR_HUNTS : HUNTS);
export const huntLine = (h, grade) => h.en[grade >= 8 ? 'hard' : 'easy'];
/** The hunt in progress for a board: profile.hunt (village), profile.hunt2 (forest) or profile.hunt3 (harbor). */
export const HUNT_KEY = { village: 'hunt', forest: 'hunt2', harbor: 'hunt3' };
export const hunt = (profile, region = 'village') => { const k = HUNT_KEY[region] || 'hunt'; return profile[k] || (profile[k] = { i: 0, got: 0, active: false, done: 0 }); };
/** Counts a defeated monster for the active hunt on either board. Returns true when this kill finished one. */
export function countKill(profile, kind) {
  let done = false;
  for (const region of ['village', 'forest', 'harbor']) {
    const h = hunt(profile, region), list = huntsOf(region), q = list[h.i % list.length];
    if (!h.active || q.kind !== kind || h.got >= q.need) continue;
    h.got += 1; if (h.got >= q.need) done = true;
  }
  return done;
}
export const BOSS = { id: 'king', el: 'ice', flag: 'boss1', name: 'Slime King', level: 8, hp: 600, atk: 16, exp: 400, gold: 150, speed: 1.4, color: 0x5fd0ff, size: 2.6 };
/** Map 1's last boss in the golem fields. Beating it at level 20 opens Map 2. */
export const BOSS2 = { id: 'ancient', el: 'thunder', flag: 'boss2', name: 'Ancient Golem', level: 18, hp: 1600, atk: 30, exp: 900, gold: 300, speed: 1.2, color: 0x9a8f7a, size: 3.0 };
/** The boss of the Forest chapter (last chapter of Map 1): the Mushroom Queen, deep in the west of the forest near the old ruins. Level 16, before the Ancient Golem. */
export const BOSS3 = { id: 'queen', el: 'wind', flag: 'boss3', name: 'Mushroom Queen', level: 16, hp: 1300, atk: 28, exp: 700, gold: 220, speed: 1.3, color: 0xc0397a, size: 3.0, region: 'forest' };
/** Map 2's main boss: Captain Octopus on the north point beside the lighthouse (the Blender octopus, 3 word shields). */
export const BOSS4 = { id: 'octopus', el: 'fire', flag: 'boss4', name: 'Captain Octopus', level: 28, hp: 3000, atk: 52, exp: 1800, gold: 500, speed: 1.4, color: 0xc0397a, size: 2.4, region: 'harbor', model: 'octopus', fit: 1.0 };
export const BOSSES = [BOSS, BOSS2, BOSS3, BOSS4];
/** Map 2 opens once the Ancient Golem is beaten and the hero has reached level 20 (owl gate passed or waiting). */
export const map2Ready = (profile) => !!(profile.flags.boss2 && profile.stats.level >= 20);
/** Map 3 (the desert, still to be built) opens once Captain Octopus is beaten and the hero has reached level 30 (owl exam passed or waiting). */
/** The forest chapter of Map 1 (monsters, hunt board, the Mushroom Queen) wakes once the crystal quest is done, so a young hero finds the forest quiet at first. */
export const forestChapter = (profile) => !!(profile.quests && profile.quests.forest && profile.quests.forest.step === 'done');
export const map3Ready = (profile) => !!(profile.flags.boss4 && profile.stats.level >= 30);

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
