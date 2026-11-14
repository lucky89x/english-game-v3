// Starter Village (Chapter I): square with a well, Tom's hall, shop, cottages, Ben's market,
// river with the curved bridge and the south bridge, dock, farm, orchard and the forest gate.
import { makeRegion, P, gauss, BRIDGE_LEN } from '../regionkit.js';
const riverX = (z) => 22 + 3 * Math.sin(z * 0.08);
const bw = (b) => [b.x - BRIDGE_LEN / 2 - 0.8, b.z], be = (b) => [b.x + BRIDGE_LEN / 2 + 0.8, b.z];
export const GATE = { x: -30, z: -44 };
export default makeRegion({
  name: 'village', title: 'Starter Village', size: 140, playRadius: 62, seed: 4242, trees: 230, rocks: 40, roughness: 0.3, treeMix: [0.3, 0.85],
  riverX, riverHalf: () => 3.4, riverStart: -90,
  bridges: [{ id: 'village', z: 6, name: 'Village Bridge' }, { id: 'south', z: 40, name: 'South Bridge' }], stonesZ: null,
  landmarks: [
    { id: 'hall', en: 'village hall', vi: 'nhà trưởng làng', label: 'Village Hall', x: 0, z: -25, spot: [0, -16.5] },
    { id: 'square', en: 'square', vi: 'quảng trường', label: 'Square', x: 0, z: 4 },
    { id: 'shop', en: 'shop', vi: 'cửa hàng', label: 'Shop', x: 12, z: -8 },
    { id: 'market', en: 'market', vi: 'chợ', label: "Ben's Market", x: -8, z: 19, spot: [-5.5, 21.5] },
    { id: 'dock', en: 'dock', vi: 'bến thuyền', label: 'Dock', x: 16, z: 18 },
    { id: 'farm', en: 'farm', vi: 'nông trại', label: 'Farm', x: -24, z: 31 },
    { id: 'orchard', en: 'orchard', vi: 'vườn cây ăn quả', label: 'Orchard', x: 40, z: 8 },
    { id: 'gate', en: 'forest gate', vi: 'cổng rừng', label: 'Forest Gate', x: GATE.x, z: GATE.z },
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
  hills: (x, z, h) => h + 3.2 * gauss(Math.hypot(x + 44, z + 20), 12) + 2.4 * gauss(Math.hypot(x - 46, z + 30), 11),
  treeFree: (x, z) => (Math.abs(x) < 20 && z > -34 && z < 26) || (x < -12 && x > -36 && z > 22 && z < 40) || (x > 30 && x < 52 && z > -4 && z < 26),
  keepClear: [{ x: 0, z: 4, r: 9 }, { x: 16, z: 18, r: 5 }],
  solids: [
    { x: 0, z: -25.5, r: 7.2 }, { x: 12.5, z: -8, r: 4.6 }, { x: -14.5, z: -8, r: 4.4 }, { x: -15, z: 9, r: 4.6 },
    { x: 0, z: 4, r: 1.35 },                                                  // well
    { x: -8.6, z: 18.2, r: 1.5 }, { x: -8.6, z: 20.8, r: 1.5 },               // Ben's stall
    { x: GATE.x - 3.4, z: GATE.z, r: 0.9 }, { x: GATE.x + 3.4, z: GATE.z, r: 0.9 },
    ...[[36, 0], [42, 3], [46, 9], [38, 20], [45, 18], [34, 13]].map(([x, z]) => ({ x, z, r: 0.6 })),   // orchard trees
    { x: -27, z: 27, r: 1.0 },                                                // scarecrow
  ],
});
export const ORCHARD_TREES = [[36, 0], [42, 3], [46, 9], [38, 20], [45, 18], [34, 13]];
