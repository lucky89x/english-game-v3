// Starter Village (Chapter I): open square, Tom's hall, shop, cottages, Ben's market,
// river with the curved bridge and the south bridge, dock, farm, orchard and the forest gate.
import { makeRegion, P, gauss, smooth, BRIDGE_LEN } from '../regionkit.js';
const riverX = (z) => 22 + 3 * Math.sin(z * 0.08);
const bw = (b) => [b.x - BRIDGE_LEN / 2 - 0.8, b.z], be = (b) => [b.x + BRIDGE_LEN / 2 + 0.8, b.z];
export const GATE = { x: -30, z: -44 };
/** D1: things that fill the empty south fields (windmill, pond, training dummies, campsite). */
export const SOUTH = { mill: [-30, 41], dummies: [[14, 45], [16, 48], [10, 52]], tent: [-21.5, 54.5], fire: [-15.5, 47] };      // (24/11) the pond is gone ("it looks ugly"); the tent is big now (TENT_SCALE)
export const FIRE_SCALE = 1.5, TENT_SCALE = 2.1;
/** (24/11) Ben's word-jar market moved from the square (next to Lily's old stall) to the campfire in the south: his stall, the four jars the
 *  customers want, where Ben stands and the spot the hero walks to. */
export const BEN_MARKET = { stall: [-9.5, 47.5], jars: [[-7.3, 45.2], [-7.3, 46.75], [-7.3, 48.3], [-7.3, 49.85]], npc: [-10.8, 47.5], spot: [-6.4, 49.5], centre: [-7.5, 47.5] };
/** 18/11: the children's own homes, two lots in the empty west fields, doors facing east (+x) like Lily's house; the
 *  furniture shop stands south of them. Each yard is the strip between the door and the lane at x = -40. */
export const HOMES = [-31.5, -10.5, 10.5, 31.5].map((z) => ({ x: -50, z, door: [-45.4, z], yard: [-42.6, z] }));      // (24/11) four lots, each a bigger plot (see PLOT in game/homes.js)
/** (24/11) the landmark of each mini game, a few metres from its sign and host: a candy shop, a shooting range, a start arch, a block tower.
 *  yaw: the way the front faces (radians, 0 = +z, so PI/2 faces west); r: its solid. Pure data: world/arcade_sites.js draws them. */
export const MINI_BUILDINGS = [
  { id: 'candy', kind: 'candy', x: -11, z: -17, yaw: -Math.PI / 2, r: 2.8 },
  { id: 'sling', kind: 'range', x: -3.2, z: -35.8, yaw: -Math.PI / 4, r: 2.6 },
  { id: 'race2', kind: 'arch', x: 6, z: 28, yaw: Math.PI / 2, r: 2.2 },
  { id: 'blocks', kind: 'tower', x: -35, z: 4.5, yaw: -Math.PI / 2, r: 2.2 },
];
export const FURNITURE = { x: -31, z: -26, door: [-26.1, -26] };      // east of the lane, out of the way of the lots
/** Two market stalls (18/11): Ben's fruit and vegetables south of his jar stall, Anna's instruments near her house. at: where E works. */
export const STALLS = { produce: { x: -7.5, z: 24.8, yaw: Math.PI / 2, at: [-4.6, 24.8] }, music: { x: -19, z: 21.5, yaw: Math.PI / 2, at: [-16.4, 21.5] },
  tailor: { x: 9.5, z: 21.5, yaw: Math.PI, at: [9.5, 18.9] },
  pets: { x: 13.6, z: 2, yaw: -Math.PI / 2, at: [11.0, 2] } };      // (21/11) Penny's pet shop east of the square: puppies, kittens, bunnies      // (20/11) potions and basic gear, beside the square where a fainted hero wakes up      // Mia's tailor shop (19/11), on the grass east of the square-to-market road, facing the square
/** No ponds in the village any more (24/11); the regionkit still supports them for other maps. */
export const PONDS = [];
export default makeRegion({
  ponds: PONDS,
  name: 'village', title: 'Starter Village', size: 140, playRadius: 62, seed: 4242, trees: 230, rocks: 40, roughness: 0.3, treeMix: [0.3, 0.85],
  riverX, riverHalf: () => 3.4, riverStart: -52, waterfall: true,
  bridges: [{ id: 'village', z: 6, name: 'Village Bridge' }, { id: 'south', z: 40, name: 'South Bridge', closed: true }], stonesZ: null,
  landmarks: [
    { id: 'hall', en: 'village hall', vi: 'nhà trưởng làng', label: 'Village Hall', x: 0, z: -25, spot: [0, -16.5] },
    { id: 'square', en: 'square', vi: 'quảng trường', label: 'Square', x: 0, z: 4 },
    { id: 'shop', en: 'shop', vi: 'cửa hàng', label: 'Shop', x: 12, z: -8 },
    { id: 'market', en: 'market', vi: 'chợ', label: "Ben's Word Jars", x: BEN_MARKET.stall[0] + 0.6, z: BEN_MARKET.stall[1], spot: BEN_MARKET.spot },
    { id: 'dock', en: 'dock', vi: 'bến thuyền', label: 'Dock', x: 16, z: 18 },
    { id: 'farm', en: 'farm', vi: 'nông trại', label: 'Farm', x: -24, z: 31 },
    { id: 'orchard', en: 'orchard', vi: 'vườn cây ăn quả', label: 'Orchard', x: 40, z: 8 },
    { id: 'wild', en: 'wild meadow', vi: 'đồng hoang', label: 'Wild Meadow ⚔', x: 40, z: -24 },
    { id: 'gate', en: 'forest gate', vi: 'cổng rừng', label: 'Forest Gate', x: GATE.x, z: GATE.z },
    // D1: the south fields
    { id: 'mill', en: 'windmill', vi: 'cối xay gió', label: 'Windmill', x: SOUTH.mill[0], z: SOUTH.mill[1] },
    { id: 'yard', en: 'training yard', vi: 'bãi tập', label: 'Training Yard', x: 12, z: 49 },
    { id: 'tent', en: 'campsite', vi: 'khu trại', label: 'Campsite', x: SOUTH.tent[0], z: SOUTH.tent[1] },
  ],
  entrance: GATE, spawn: { x: 0, z: 13 },
  exits: [{ x: GATE.x, z: GATE.z + 2.6, r: 2.6, to: 'forest', label: 'Vào Rừng Ký Ức', flag: 'forest_open' }],
  paths: (R) => { const [v, s] = R.BRIDGES; return [
    P(3.4, [0, -17], [0, -4], [0, 12], [-1, 24], [-2, 34], [4, 39.5], bw(s)),
    P(3.0, [0, 6], [8, 6], bw(v)),
    P(2.8, be(v), [36, 7], [41, 14], [40, 30], [36, 39], be(s)),
    P(2.8, [0, 0], [-10, -1], [-22, -14], [-28, -30], [GATE.x, GATE.z + 3]),
    P(2.4, [-1.5, 30], [-16, 30]),
    P(2.4, [-1, 19], [-5, 19.5]),
    P(2.4, [8, 6], [14, 12], [15.5, 16]),
    P(2.2, [0, -4], [8, -6]),
    P(2.2, [-10, -1], [-10, 8]),
  ]; },
  pathWiden: 1.7,
  lateRiverHalf: () => 4.6,   // wider river (feedback 17/11); the 11.5 m bridges still reach both banks
  thinTrees: 0.7,             // fewer trees inside the village (feedback 17/11, twice: too many trees)
  thinOuter: 0.55,            // and in the scenery ring around it
  treeScale: 1.85,            // taller trees, in proportion with the people (feedback 17/11: "the trees are too low")
  // Quest Square (feedback 17/11): a round paved square with a fountain in the middle, where Tom, Anna and the quest
  // board stand; roads leave it towards every part of the village.
  latePaths: () => [P(2.4, [-2, 34], [-8, 42], [-16, 46], [-27, 44]), P(2.2, [-12, 44.5], [-8.5, 51.5]), P(2.0, [-12.2, 47.2], [-14, 47.4]), P(2.2, [-2, 34], [3, 41], [9, 44]),
    P(17, [0, 3.6], [0, 4.4]),                                               // the square itself
    P(2.6, [33.5, 6], [33, -4], [30, -12], [36, -20], [40, -24]),            // across the bridge to the Wild Meadow
    P(2.4, [0, -17], [-10, -19], [-20, -14]),                                // hall to the forest road
    P(2.4, [-10, 8], [-13, 18], [-16, 30]),                                  // west houses to the farm
    P(2.4, [0, -17], [8, -13], [8, -6]),                                     // hall to the shop
    P(2.2, [-10, -1], [-14, -16], [-12, -30], [-4, -36]),                    // west lane past the hall to the hill
    P(2.2, [-17.4, -4], [-12, -3.6]), P(2.2, [-17.8, 12.5], [-11.4, 12.2]),     // garden paths to the two moved houses
    P(2.2, [-12.5, -1.5], [-19, 2.5], [-30, 4]),                              // lane to Max's blocks yard
    P(2.4, [-30, 4], [-36, 2.5], [-40, 2.5]), P(2.2, [-40, -34], [-40, 34]),    // lane to the children's homes (18/11), now past all four lots
    ...HOMES.map((h) => P(1.8, h.door, [-40, h.z])),                           // garden paths to the four front doors
    P(2.2, [-40, -14], [-30, -14], [-24, -16], [-24, -22], [-26.1, -26]),       // on to the furniture shop
  ],
  lateSolids: [{ x: 0, z: 4, r: 3.8 }, ...MINI_BUILDINGS.map((b) => ({ x: b.x, z: b.z, r: b.r })),                                      // the plaza fountain (model r 3.7)
    ...HOMES.map((h) => ({ x: h.x, z: h.z, r: 4.4 })), { x: FURNITURE.x, z: FURNITURE.z, r: 4.6 }, ...Object.values(STALLS).map((t) => ({ x: t.x, z: t.z, r: 1.7 })), { x: STALLS.tailor.x - 2.6, z: STALLS.tailor.z - 0.6, r: 0.6 }, { x: STALLS.tailor.x + 2.6, z: STALLS.tailor.z - 0.6, r: 0.6 }],      // homes and the furniture shop (18/11)
  // 18/11 ("the houses are too close together"): Lily's and Anna's houses move further west, each with a garden path
  lateMove: [{ from: [-14.5, -8], to: [-22, -4] }, { from: [-15, 9], to: [-22.5, 12.5] }],
  lateClear: (x, z) => (x > -36 && x < 16 && z > 37 && z < 57) || (x > -57 && x < -33 && z > -44 && z < 44),      // south fields; west homesteads (four lots)
  hills: (x, z, h) => h + 3.2 * gauss(Math.hypot(x + 44, z + 20), 12) + 2.4 * gauss(Math.hypot(x - 46, z + 30), 11)
    + 8.5 * (1 - smooth(-57.5, -52.5, z)) * smooth(-4, 8, x),      // north-east cliff with the waterfall
  treeFree: (x, z) => (Math.abs(x) < 20 && z > -34 && z < 26) || (x < -12 && x > -36 && z > 22 && z < 40) || (x > 30 && x < 52 && z > -4 && z < 26),
  keepClear: [{ x: 0, z: 4, r: 9 }, { x: 16, z: 18, r: 5 }],
  solids: [
    { x: 0, z: -25.5, r: 7.2 }, { x: 12.5, z: -8, r: 4.6 }, { x: -14.5, z: -8, r: 4.4 }, { x: -15, z: 9, r: 4.6 },
    { x: BEN_MARKET.stall[0], z: BEN_MARKET.stall[1] - 1.3, r: 1.5 }, { x: BEN_MARKET.stall[0], z: BEN_MARKET.stall[1] + 1.3, r: 1.5 },               // Ben's stall by the campfire
    { x: GATE.x - 3.4, z: GATE.z, r: 0.9 }, { x: GATE.x + 3.4, z: GATE.z, r: 0.9 },
    ...[[36, 0], [42, 3], [46, 9], [38, 20], [45, 18], [34, 13]].map(([x, z]) => ({ x, z, r: 0.6 })),   // orchard trees
    { x: -31.5, z: 28.5, r: 1.0 },                                            // scarecrow
    ...[-27.6, -23.2, -18.8].flatMap((x) => [26.5, 30.2, 33.9].map((z) => ({ x, z, r: 1.6 }))),      // the nine garden beds
    { x: SOUTH.mill[0], z: SOUTH.mill[1], r: 2.4 }, { x: SOUTH.tent[0], z: SOUTH.tent[1], r: 1.7 * TENT_SCALE * 0.8 },
    { x: SOUTH.fire[0], z: SOUTH.fire[1], r: 1.7 * FIRE_SCALE }, ...SOUTH.dummies.map(([x, z]) => ({ x, z, r: 0.45 })),
  ],
});
/** (20/11) orchard trees are taller (4.6 m trunk and crown 2.4 m): apples fall from the crown, about 5.9 m up, slowly. */
export const ORCHARD_H = 4.6, ORCHARD_R = 2.4, ORCHARD_CROWN = ORCHARD_H + ORCHARD_R * 0.55;
export const ORCHARD_TREES = [[36, 0], [42, 3], [46, 9], [38, 20], [45, 18], [34, 13]];
