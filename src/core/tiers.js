// Mini game versions (18/11: "each mini game has different versions, upgraded with the level"). Three tiers by level;
// the arcade games read their numbers from here and the pay grows with the tier. Pure rules, no DOM.
export const tierOf = (level) => (level >= 20 ? 3 : level >= 10 ? 2 : 1);
export const TIER_NAME = ['', 'Bậc 1 · Làm quen', 'Bậc 2 · Thử thách', 'Bậc 3 · Cao thủ'];
export const TIER_PAY = [1, 1, 1.4, 1.8];
/** Per game and tier: candy moves; blocks first fall time (s); sling shots, target speed and size; race rival pace and how thick the road gets. */
export const TIER_RULES = {
  candy: [0, { moves: 25 }, { moves: 22 }, { moves: 20 }],
  blocks: [0, { fall: 0.36 }, { fall: 0.30 }, { fall: 0.25 }],
  sling: [0, { shots: 12, speed: 1, size: 1 }, { shots: 11, speed: 1.25, size: 0.92 }, { shots: 10, speed: 1.5, size: 0.84 }],
  race: [0, { rival: 0, gap: 1 }, { rival: 0.03, gap: 0.88 }, { rival: 0.06, gap: 0.78 }],
};
export const rule = (game, tier) => TIER_RULES[game][tier] || TIER_RULES[game][1];
