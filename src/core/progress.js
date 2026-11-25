// How the hero grows, in one place (24/11, the child's rules): pure numbers, no three.js, tested in node.
//   1. The top level comes from the skills: a hero learns ONE element, seven lines (3 passives, 3 spells, 1 ultimate) of ten ranks
//      each, one skill point per level, so FULL_POINTS = 70 points = level 70. (All four elements together would be 280 points; the
//      child picks one and changing it gives the points back, so 70 is the number to reach.)
//   2. Every map has a hard level cap (the top of its range on the world map picture). Above it, nothing in that map pays any EXP:
//      grinding is pointless, the hero has to move on. EXP comes only from quests and from monsters.
//   3. A monster's strength, EXP and gold follow its level; so do the weapon and armour made for that level. The hero with the gear
//      of the level beats a monster of the level in a handful of hits; a hero in gear two tiers old needs about twice as many.
import { TREE, MAX_RANK } from './skills.js';
import { mapById } from './world.js';

// ---------------------------------------------------------------- the top level, from the skills
export const LINES_PER_ELEMENT = TREE.fire.length;                     // 7: three passives, the melee, single and area spells, the ultimate
export const POINTS_PER_ELEMENT = TREE.fire.length * MAX_RANK;         // every rank of one element
export const POINTS_ALL_ELEMENTS = Object.values(TREE).reduce((a, list) => a + list.length * MAX_RANK, 0);
/** One skill point per level (skills.js `earned`), so the full tree of one element is reached at this level. */
export const FULL_POINTS = POINTS_PER_ELEMENT;
export const MAX_LEVEL = FULL_POINTS;
/** The highest level any skill asks for (a spell with `needLevel`); the cap must be above it. */
export const HIGHEST_SKILL_LEVEL = Math.max(...Object.values(TREE).flat().map((n) => n.needLevel || 1));

// ---------------------------------------------------------------- EXP curve (it moved here from save.js, which re-exports it)
/** (24/11) the child asked for a longer bar: the old curve (90 + 45 per level) times EXP_K. */
export const EXP_K = 2;
export const expNeed = (level) => Math.round((90 + (level - 1) * 45) * EXP_K);
export const expTo = (level) => { let t = 0; for (let l = 1; l < level; l++) t += expNeed(l); return t; };

// ---------------------------------------------------------------- the level cap of every map
/** The map a region belongs to (the treasure isle is part of Map 2). */
export const MAP_OF_REGION = { village: 'village', harbor: 'harbor', isle: 'harbor', forest: 'forest' };
/** The hard cap of a map: the top of its level range. */
export const capOfMap = (id) => { const m = mapById(id); return m ? m.lv[1] : MAX_LEVEL; };
export const capOfRegion = (region) => capOfMap(MAP_OF_REGION[region] || region || 'village');
/** The cap that applies to this hero now: the map they are in (the admin has none). */
export const levelCap = (profile) => (profile && profile.admin ? MAX_LEVEL : Math.min(MAX_LEVEL, capOfRegion(profile && profile.region)));
/** The lowest level a map is meant for (the bottom of its range). */
export const floorOfMap = (id) => { const m = mapById(id); return m ? m.lv[0] : 1; };

// ---------------------------------------------------------------- what the gear of a level gives
/** The hero's plain attack at a level before gear and skills (rules.playerAtk). */
export const baseAtk = (level) => 10 + (level - 1) * 2;
/** The weapon made for a level adds 80% of the base attack. */
export const weaponAtk = (level) => Math.round(baseAtk(level) * 0.8);
/** Armour made for a level: defence and extra health. */
export const armorDef = (level) => Math.round(level * 0.45);
export const armorHp = (level) => Math.round(level * 6);
/** The hero's attack and health in the gear of the level. */
export const heroAtkAt = (level) => baseAtk(level) + weaponAtk(level);
export const heroHpAt = (level) => 100 + (level - 1) * 12 + armorHp(level);

// ---------------------------------------------------------------- monsters of a level
/** role: normal | ranged (spits magic, a bit weaker) | elite (a hard fight, pays well). */
export const ROLES = {
  normal: { hp: 1, atk: 1, exp: 1, gold: 1 },
  ranged: { hp: 0.85, atk: 0.9, exp: 1.05, gold: 1.1 },
  elite: { hp: 2.2, atk: 1.3, exp: 2.5, gold: 2.2 },
};
/** Hits of a hero in the gear of the level needed to kill a normal monster of that level (3.25 at level 1, 10 at the top). */
/** Bites of a normal monster of a level that take a hero in the gear of that level from full to nothing (25/11: was 14). */
export const MOB_BITES = 10;
/** Share of the hero's base attack without a weapon (25/11 "đánh tay không cũng giết quái dễ"). */
export const UNARMED = 0.6;
export const hitsToKill = (level) => Math.min(10, 3 + level * 0.25);      // (25/11 "quái hơi yếu") was 2 + 0.2·level, max 7
/** Kills of normal monsters of a level that fill one level of EXP (quests give the rest). */
export const killsPerLevel = (level) => 15 + level * 0.35;      // (25/11 "lên cấp hơi nhanh") was 10 + 0.3·level
export const mobGold = (level) => Math.round(2 + level * 0.9);
export function mobStats(level, role = 'normal') {
  const r = ROLES[role] || ROLES.normal;
  return {
    hp: Math.round(heroAtkAt(level) * hitsToKill(level) * r.hp),
    atk: Math.max(4, Math.round(heroHpAt(level) / MOB_BITES * r.atk)),
    exp: Math.max(1, Math.round(expNeed(level) / killsPerLevel(level) * r.exp)),
    gold: Math.max(1, Math.round(mobGold(level) * r.gold)),
  };
}
/** A boss of a level: a long fight, a big first reward. */
export function bossStats(level) {
  return { hp: Math.round(heroAtkAt(level) * (hitsToKill(level) + 4) * 3.2), atk: Math.round(heroHpAt(level) / 8),      // (25/11) was / 11
           exp: Math.round(expNeed(level) * 0.65), gold: Math.round(mobGold(level) * 14) };
}
/** Share of a monster's EXP the hero gets: full when the monster is at or above the hero's level, 20% less for every level the hero
 *  is above it (never below 15%), and none at all when the map's cap is reached (grinding the same ground pays nothing). */
export function expFactor(heroLevel, monsterLevel) { const d = heroLevel - monsterLevel; return d <= 0 ? 1 : Math.max(0.15, 1 - 0.2 * d); }

// ---------------------------------------------------------------- weapons and armour by level
/** The tiers of gear, one set per map step: the weapon of a tier needs this level and adds `weaponAtk(level)`; the price is 15 kills' gold. */
export const GEAR_LEVELS = [1, 3, 5, 7, 10, 13, 16, 20, 25, 30, 35, 40, 45, 50, 55, 60];
export const tierGearLevel = (level) => GEAR_LEVELS.filter((l) => l <= level).pop() || 1;
export const weaponCost = (level) => Math.max(40, Math.round(mobGold(level) * 15 / 5) * 5);
export const armorCost = (level) => Math.max(45, Math.round(mobGold(level) * 19 / 5) * 5);

// ---------------------------------------------------------------- mini games: a fee to play, no pay afterwards
/** Gold to enter a mini game (the child answers questions too). It grows with the level like the gold of the monsters. */
export const GAME_FEE_K = { candy: 1, blocks: 1, sling: 1, race: 1.5, style: 1.5, cafe: 1.5, salon: 1.5, fishing: 0.8, apples: 0.8, lantern_fair: 1.5 };
export const gameFee = (game, level) => Math.max(5, Math.round((8 + 2 * level) * (GAME_FEE_K[game] || 1) / 5) * 5);

// ---------------------------------------------------------------- at the top level of a map: gold fades away too (24/11)
/** At the cap a monster or a quest gives no EXP and only half its gold, and the gold fades by a little with every reward until it is none
 *  at all, so the child goes on to the next map. `n` = how many rewards were already taken at this cap. */
export const CAP_GOLD = { start: 0.5, steps: 30 };
export const capGoldFactor = (n) => CAP_GOLD.start * Math.max(0, 1 - n / CAP_GOLD.steps);
