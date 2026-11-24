// Sunny Harbor (Map 2, 18/11: "a completely new map, not like Map 1"). Reached by boat from the village dock once Map 2
// is open. The sea fills the east side, with a sandy beach along a wavy coast; two wooden piers run out over the water
// (the ground under each pier is raised just above the sea, so they are walkable without bridge code). The town sits
// on the gentle western slope: a paved harbour square, the fish market, and three shops with mini games (boutique,
// café, salon). A lighthouse stands on the rocky point in the north-east.
import { makeRegion, P, smooth, gauss } from '../regionkit.js';

/** x of the shoreline at z: the sea is east of it. */
export const coastX = (z) => 20 + 5 * Math.sin(z * 0.06) + 3 * Math.sin(z * 0.17 + 1);
/** The two piers: z of the centre line, x where they start and end, half width. */
export const PIERS = [{ id: 'main', z: 2, x0: 12, x1: 48, half: 2.1 }, { id: 'fishing', z: 28, x0: 14, x1: 36, half: 1.6 }];
/** Buildings (x, z, door facing yaw) and the places the mini games and NPCs use. */
export const HARBOR = {
  square: { x: -12, z: 2 },
  boutique: { x: -30, z: -8, door: [-25.4, -8] },
  cafe: { x: -30, z: 14, door: [-25.4, 14] },
  salon: { x: -12, z: -24, door: [-12, -19.4] },
  market: { x: 2, z: 16 },
  lighthouse: { x: 34, z: -40 },
  ship: { x: 60, z: 14 },
  isle: { x: 22, z: 28.6 },      // the boat to Treasure Isle waits at the west end of the fishing pier (19/11)
  fishing: { x: 34, z: 28 },      // the end of the fishing pier: E to fish (19/11)
  shop: { x: -7.5, z: 9.5 },      // Willow's harbor stall: the Map 2 gear (the same counter as her forest camp)
  yard: { x: 3, z: -8.5 },      // container yard north of the main pier, with the quay crane beside it
  crane: { x: 14.5, z: -10 },
};
/** Map 2 play places (pure data, so node tests can check them): the hunt board by the square, Captain Octopus's cove beside the
 *  lighthouse, six word chests and ten word bubbles. */
export const PLAY = {
  board: { x: -3.2, z: -1.6 }, boss: { x: 33, z: -47 },
  chests: [[4, 44], [-2, -30], [-40, -26], [16, 36], [-34, 20], [22, -38]],
  spots: [[-16, 6], [-20, -9], [-20, 12], [-12, -14], [3, 13], [22, 2], [12, 36], [26, 28], [1, -26], [28, -34]],
};
const onPier = (x, z) => PIERS.some((p) => Math.abs(z - p.z) < p.half && x > p.x0 - 2 && x < p.x1 + 1);

export default makeRegion({
  name: 'harbor', title: 'Sunny Harbor', sea: true, size: 220, playRadius: 92, seedRadius: 66, extraTrees: { n: 70, inner: 58, outer: 96, seed: 24118, free: (x, z) => x > -26 }, seed: 20261118, trees: 16, rocks: 24,      // an island town: few trees, only on the slope behind the shops
  treeFree: (x, z) => x > -30 || Math.hypot(x, z) > 58,
  riverX: () => 999, riverHalf: () => 0, riverStart: 9999, riverEnd: 9999,      // no river: the sea is made by the ground (hills)
  bridges: [], stonesZ: null, lowSand: (x, z) => x > coastX(z) - 15 || Math.hypot(x, z) > 74,      // sand along every shore
  rim: () => 0,      // no hills round the edge and no mountains: open sea to the horizon on every side
  landmarks: [
    { id: 'lighthouse', en: 'lighthouse', vi: 'ngọn hải đăng', label: 'Lighthouse', x: 34, z: -40, spot: [28, -35] },
    { id: 'pier', en: 'pier', vi: 'cầu tàu', label: 'Main Pier', x: 30, z: 2, spot: [26, 2] },
    { id: 'beach', en: 'beach', vi: 'bãi biển', label: 'Beach', x: 14, z: 40, spot: [12, 38] },
    { id: 'market', en: 'fish market', vi: 'chợ cá', label: 'Fish Market', x: 2, z: 16, spot: [2, 12] },
    { id: 'ship', en: 'ship', vi: 'con tàu', label: 'Big Ship', x: 60, z: 14, spot: [47, 6] },
    { id: 'boutique', en: 'boutique', vi: 'cửa hàng thời trang', label: 'Style Boutique', x: -30, z: -8, spot: [-23, -8] },
    { id: 'cafe', en: 'café', vi: 'quán cà phê', label: 'Seaside Café', x: -30, z: 14, spot: [-23, 14] },
    { id: 'salon', en: 'salon', vi: 'tiệm làm đẹp', label: 'Beauty Salon', x: -12, z: -24, spot: [-12, -17] },
    { id: 'rockpools', en: 'rock pool', vi: 'vũng đá', label: 'Rock Pools', x: 18, z: -24, spot: [12, -22] },
  ],
  entrance: { x: 44, z: 2 }, spawn: { x: 40, z: 2 },
  exits: [{ x: 46, z: 2, r: 2.4, to: 'village', label: 'Đi thuyền về Làng Khởi Đầu' }],
  paths: () => [
    P(14, [-12, 1.6], [-12, 2.4]),                                       // the harbour square
    P(4.0, [-5, 2], [PIERS[0].x0, 2]),                                   // square to the main pier
    P(3.0, [-12, 2], [-18, -8], [-24, -8]), P(3.0, [-12, 2], [-18, 12], [-24, 14]),     // boutique, café
    P(3.0, [-12, 2], [-12, -18]),                                         // salon
    P(3.0, [-5, 2], [0, 12], [2, 18], [8, 30], [12, 38]),                 // market and the beach
    P(2.4, [8, 30], [PIERS[1].x0, 28]),                                   // the fishing pier
    P(2.6, [-12, -18], [0, -26], [12, -24], [22, -32], [28, -36]),        // rock pools to the lighthouse
    P(2.4, [-24, -8], [-36, -20], [-44, -28]), P(2.4, [-24, 14], [-38, 26], [-46, 34]),   // trails into the hills
    P(2.4, [-46, 34], [-56, 38], [-63, 40]),                              // on to the Coast Race (24/11)
  ],
  hills: (x, z, h) => {
    const xc = coastX(z), point = gauss(Math.hypot(x - 32, z + 38), 9), ring = smooth(83, 92, Math.hypot(x, z));      // the sea also closes round the west, north and south: the harbour is an island
    const sea = Math.max(smooth(xc - 2, xc + 9, x) * (1 - Math.min(1, point * 1.6)), ring);      // the rocky point stays land
    h *= 0.6;                                                             // gentle ground: a harbour town, not hills
    h += 2.4 * smooth(-10, -40, x) * (1 - sea);                           // the town slope rises to the west
    h += 7.0 * gauss(Math.hypot(x - 34, z + 40), 12) + 3.0 * gauss(Math.hypot(x - 28, z + 33), 9);      // lighthouse point
    h = h * (1 - sea) + (-2.6) * sea;                                     // the sea
    if (onPier(x, z)) h = Math.max(h, 0.05);                              // under the piers: just above the water line
    return h;
  },
  lateClear: (x, z) => onPier(x, z) || x > coastX(z) - 7 || Math.hypot(x + 7.5, z - 9.5) < 3.6,              // no trees on the piers or the sand
  keepClear: [{ x: -12, z: 2, r: 10 }, { x: -30, z: -8, r: 7 }, { x: -30, z: 14, r: 7 }, { x: -12, z: -24, r: 7 }, { x: 2, z: 16, r: 6 }, { x: 34, z: -40, r: 6 }, { x: 5, z: -9, r: 9 }, { x: 14, z: 40, r: 9 }],
  solids: [
    { x: -30, z: -8, r: 4.6 }, { x: -30, z: 14, r: 4.6 }, { x: -12, z: -24, r: 4.6 },      // the three shops
    { x: 34, z: -40, r: 5.4 },                                            // lighthouse tower (x1.6)
    { x: 0, z: -8.5, r: 3.4 }, { x: 6.5, z: -8.5, r: 3.4 }, { x: 12, z: -8.5, r: 2.4 },      // container yard
    { x: 14.5, z: -15, r: 2.6 }, { x: 14.5, z: -5, r: 2.6 },              // quay crane legs
    { x: -1, z: 18, r: 1.6 }, { x: 5, z: 18, r: 1.6 },                    // fish market stalls
    { x: -7.5, z: 9.5, r: 1.9 },                                          // Willow's stall
    { x: -61, z: 40, r: 2.2 },                                            // the start arch of the Coast Race (24/11)
  ],
});
