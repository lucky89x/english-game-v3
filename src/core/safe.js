// Safe places (split out of rules.js on 24/11 so the hunting grounds in zones.js can avoid them without a circular import).
/** (21/11) Safe places: monsters never walk in and do not chase or shoot a hero standing inside (the village streets and
 *  shops, the players' homes, the apple orchard and every mini game; the harbour town, the market and the fishing pier). */
export const SAFE = {
  village: [{ x: 2, z: 4, r: 24 }, { x: 40, z: 10, r: 13 }, ...[[-25, -76], [-62, -60], [-61, 68], [-82, 32], [18.4, 19.2], [33.5, 6]].map(([x, z]) => ({ x, z, r: 7 })),      // the town, the orchard, each mini game
    { x: -46, z: 2, r: 15 }, { x: -40, z: -18, r: 7 }, { x: -3, z: 50, r: 9 }, { x: -18, z: 50, r: 8 }],
  harbor: [{ x: -12, z: 2, r: 22 }, { x: 2, z: 16, r: 9 }, { x: 34, z: 28, r: 6 }, { x: 22, z: 28.6, r: 5 }, { x: -65, z: 40, r: 7 }],
  forest: [{ x: -30, z: 50, r: 9 }, { x: -81, z: 20, r: 7 }],
};
export const inSafe = (region, x, z, pad = 0) => (SAFE[region] || []).some((s) => Math.hypot(x - s.x, z - s.z) < s.r + pad);
