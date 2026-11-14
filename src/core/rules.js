// Combat and reward numbers in one place (no three.js, tested in node).
export const MONSTERS = {
  slime: { name: 'Green Slime', level: 1, hp: 30, atk: 6, exp: 12, gold: 3, speed: 2.0, color: 0x7fd86a, size: 1.0 },
  red: { name: 'Red Slime', level: 4, hp: 70, atk: 11, exp: 26, gold: 7, speed: 2.5, color: 0xff7a6a, size: 1.25 },
  golem: { name: 'Stone Golem', level: 8, hp: 180, atk: 18, exp: 75, gold: 20, speed: 1.6, color: 0xa49aa6, size: 1.7 },
};
/** Where monsters live in the Starter Village region: [kind, x, z]. The Wild Meadow is north-east, golems guard the south-east. */
export const SPAWNS = [
  ['slime', 36, -14], ['slime', 32, -24], ['slime', 38, -30], ['slime', 34, -8], ['slime', 48, -26],
  ['red', 44, -36], ['red', 50, -16], ['red', 30, -38], ['golem', 52, 30], ['golem', 38, 48],
];
export const WILD = { x: 40, z: -24, r: 20, label: 'Wild Meadow' };
/** Ngọc's attack: grows with the level, weapon adds on top. */
export const playerAtk = (profile) => 10 + (profile.stats.level - 1) * 2 + ((profile.gear && profile.gear.atk) || 0);
/** Damage a monster deals after armour (never below 1). */
export const hurt = (atk, profile) => Math.max(1, atk - ((profile.gear && profile.gear.def) || 0));
/** A target is hit when it is close and roughly in front of the attacker. */
export function inArc(px, pz, yaw, tx, tz, reach = 2.4, minDot = 0.25) {
  const dx = tx - px, dz = tz - pz, d = Math.hypot(dx, dz); if (d > reach) return false; if (d < 0.6) return true;
  return (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d >= minDot;
}
