// Starter Village (Chapter I): open square, Tom's hall, shop, cottages, Ben's market,
// river with the curved bridge and the south bridge, dock, farm, orchard and the forest gate.
import { makeRegion, P, gauss, smooth, BRIDGE_LEN } from '../regionkit.js';
const riverX = (z) => 22 + 3 * Math.sin(z * 0.08);
const bw = (b) => [b.x - BRIDGE_LEN / 2 - 0.8, b.z], be = (b) => [b.x + BRIDGE_LEN / 2 + 0.8, b.z];
export const GATE = { x: -30, z: -44 };
/** D1: things that fill the empty south fields (windmill, pond, training dummies, campsite). */
export const SOUTH = { mill: [-30, 41], pond: [-6, 50], dummies: [[13, 45], [15, 48], [6, 52]], tent: [-15, 53], fire: [-11.5, 50] };
export default makeRegion({
  name: 'village', title: 'Starter Village', size: 140, playRadius: 62, seed: 4242, trees: 230, rocks: 40, roughness: 0.3, treeMix: [0.3, 0.85],
  riverX, riverHalf: () => 3.4, riverStart: -52, waterfall: true,
  bridges: [{ id: 'village', z: 6, name: 'Village Bridge' }, { id: 'south', z: 40, name: 'South Bridge', closed: true }], stonesZ: null,
  landmarks: [
    { id: 'hall', en: 'village hall', vi: 'nhà trưởng làng', label: 'Village Hall', x: 0, z: -25, spot: [0, -16.5] },
    { id: 'square', en: 'square', vi: 'quảng trường', label: 'Square', x: 0, z: 4 },
    { id: 'shop', en: 'shop', vi: 'cửa hàng', label: 'Shop', x: 12, z: -8 },
    { id: 'market', en: 'market', vi: 'chợ', label: "Ben's Market", x: -8, z: 19, spot: [-5.5, 21.5] },
    { id: 'dock', en: 'dock', vi: 'bến thuyền', label: 'Dock', x: 16, z: 18 },
    { id: 'farm', en: 'farm', vi: 'nông trại', label: 'Farm', x: -24, z: 31 },
    { id: 'orchard', en: 'orchard', vi: 'vườn cây ăn quả', label: 'Orchard', x: 40, z: 8 },
    { id: 'wild', en: 'wild meadow', vi: 'đồng hoang', label: 'Wild Meadow ⚔', x: 40, z: -24 },
    { id: 'gate', en: 'forest gate', vi: 'cổng rừng', label: 'Forest Gate', x: GATE.x, z: GATE.z },
    // D1: the south fields
    { id: 'mill', en: 'windmill', vi: 'cối xay gió', label: 'Windmill', x: SOUTH.mill[0], z: SOUTH.mill[1] },
    { id: 'pond', en: 'pond', vi: 'cái ao', label: 'Pond', x: SOUTH.pond[0], z: SOUTH.pond[1] },
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
  thinTrees: 0.55,            // fewer trees inside the village (feedback 17/11, twice: too many trees)
  thinOuter: 0.35,            // and in the scenery ring around it
  treeScale: 1.45,            // taller trees, in proportion with the people (feedback 17/11: "the trees are too low")
  // Quest Square (feedback 17/11): a round paved square with a fountain in the middle, where Tom, Anna and the quest
  // board stand; roads leave it towards every part of the village.
  latePaths: () => [P(2.4, [-2, 34], [-8, 42], [-16, 46], [-27, 44]), P(2.2, [-2, 34], [3, 41], [9, 44]),
    P(17, [0, 3.6], [0, 4.4]),                                               // the square itself
    P(2.6, [33.5, 6], [33, -4], [30, -12], [36, -20], [40, -24]),            // across the bridge to the Wild Meadow
    P(2.4, [0, -17], [-10, -19], [-20, -14]),                                // hall to the forest road
    P(2.4, [-10, 8], [-13, 18], [-16, 30]),                                  // west houses to the farm
    P(2.4, [0, -17], [8, -13], [8, -6]),                                     // hall to the shop
    P(2.2, [-10, -1], [-14, -16], [-12, -30], [-4, -36]),                    // west lane past the hall to the hill
  ],
  lateSolids: [{ x: 0, z: 4, r: 1.9 }],                                      // the fountain
  lateClear: (x, z) => x > -36 && x < 16 && z > 37 && z < 57,
  hills: (x, z, h) => h + 3.2 * gauss(Math.hypot(x + 44, z + 20), 12) + 2.4 * gauss(Math.hypot(x - 46, z + 30), 11)
    + 8.5 * (1 - smooth(-57.5, -52.5, z)) * smooth(-4, 8, x),      // north-east cliff with the waterfall
  treeFree: (x, z) => (Math.abs(x) < 20 && z > -34 && z < 26) || (x < -12 && x > -36 && z > 22 && z < 40) || (x > 30 && x < 52 && z > -4 && z < 26),
  keepClear: [{ x: 0, z: 4, r: 9 }, { x: 16, z: 18, r: 5 }],
  solids: [
    { x: 0, z: -25.5, r: 7.2 }, { x: 12.5, z: -8, r: 4.6 }, { x: -14.5, z: -8, r: 4.4 }, { x: -15, z: 9, r: 4.6 },
    { x: -8.6, z: 18.2, r: 1.5 }, { x: -8.6, z: 20.8, r: 1.5 },               // Ben's stall
    { x: GATE.x - 3.4, z: GATE.z, r: 0.9 }, { x: GATE.x + 3.4, z: GATE.z, r: 0.9 },
    ...[[36, 0], [42, 3], [46, 9], [38, 20], [45, 18], [34, 13]].map(([x, z]) => ({ x, z, r: 0.6 })),   // orchard trees
    { x: -27, z: 27, r: 1.0 },                                                // scarecrow
    { x: SOUTH.mill[0], z: SOUTH.mill[1], r: 2.4 }, { x: SOUTH.pond[0], z: SOUTH.pond[1], r: 3.6 }, { x: SOUTH.tent[0], z: SOUTH.tent[1], r: 1.7 },
    { x: SOUTH.fire[0], z: SOUTH.fire[1], r: 0.6 }, ...SOUTH.dummies.map(([x, z]) => ({ x, z, r: 0.45 })),
  ],
});
export const ORCHARD_TREES = [[36, 0], [42, 3], [46, 9], [38, 20], [45, 18], [34, 13]];
