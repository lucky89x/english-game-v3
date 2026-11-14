// Forest of Memories (Chapter II). Layout follows the forest reference painting.
import { makeRegion, P, smooth, gauss, BRIDGE_LEN } from '../regionkit.js';
const riverX = (z) => -6 + 12 * Math.sin((z + 50) * 0.05) + 5 * Math.sin(z * 0.11);
const bw = (b) => [b.x - BRIDGE_LEN / 2 - 0.8, b.z], be = (b) => [b.x + BRIDGE_LEN / 2 + 0.8, b.z];
export default makeRegion({
  name: 'forest', title: 'Forest of Memories', size: 150, playRadius: 68, seed: 20261113, trees: 420, rocks: 70, waterfall: true,
  riverX, riverHalf: (z) => 3.4 + 2.6 * gauss(z - 22, 5), riverStart: -52,
  bridges: [{ id: 'north', z: -14, name: 'North Bridge' }, { id: 'south', z: 34, name: 'South Bridge' }], stonesZ: 8,
  landmarks: [
  { id: 'waterfall', en: 'waterfall', vi: 'thác nước', label: 'Waterfall', x: -2.5, z: -52, spot: [10, -43.5] },
  { id: 'tree', en: 'ancient tree', vi: 'cây cổ thụ', label: 'Ancient Tree', x: 17, z: -30, spot: [20.5, -24.5] },
  { id: 'ruins', en: 'ruins', vi: 'tàn tích', label: 'Old Ruins', x: -44, z: -40, spot: [-41, -35] },
  { id: 'cottage', en: 'cottage', vi: 'nhà tranh', label: 'Cottage', x: -41, z: 7, spot: [-35, 11] },
  { id: 'cave', en: 'cave', vi: 'hang động', label: 'Crystal Cave', x: 55, z: 2, spot: [49.5, 3] },
  { id: 'mushroom', en: 'mushroom', vi: 'cây nấm', label: 'Giant Mushrooms', x: 40, z: 21, spot: [36.5, 21.5] },
  { id: 'camp', en: 'camp', vi: 'khu cắm trại', label: 'Camp', x: 34, z: 47, spot: [29.5, 43.5] },
  { id: 'tower', en: 'tower', vi: 'tháp canh', label: 'Watchtower', x: 49, z: -44, spot: [45.5, -39.5] },
  { id: 'bridge', en: 'bridge', vi: 'cây cầu', label: 'South Bridge', x: riverX(34), z: 34, spot: [riverX(34) + 8.2, 36.2] },
],
  entrance: { x: -30, z: 58 }, spawn: { x: -30, z: 49 },
  exits: [{ x: -30, z: 57.5, r: 2.6, to: 'village', label: 'Về Làng Khởi Đầu' }],
  paths: (R) => { const [n, s] = R.BRIDGES, st = R.STONES; return [
    P(3.0, [-30, 60.5], [-32, 50], [-27, 37], bw(s)),
    P(3.0, be(s), [0, 38], [18, 43], [29, 45.5]),
    P(2.6, [-27, 37], [-36, 22], [-37, 12], [-34, -3], [-20, -12], bw(n)),
    P(2.6, be(n), [13, -20], [16.5, -25]),
    P(2.4, [-20, -12], [-33, -25], [-41, -35]),
    P(2.6, be(n), [24, -8], [40, -2], [49, 2.5]),
    P(2.4, [24, -8], [33, 8], [36.5, 20], [35, 33], [31, 43]),
    P(2.4, [24, -8], [34, -22], [42, -33], [46, -40]),
    P(2.2, [16.5, -25], [13, -37], [10.5, -43]),
    P(2.0, [-36, 14], [-20, 10], [st[0].x - 1.6, 8]),
    P(2.0, [st[6].x + 1.6, 8], [16, 4], [24, -6]),
  ]; },
  hills: (x, z, h) => {
    h += 5.2 * gauss(Math.hypot(x - 49, z + 44), 12);            // watchtower hill
    h += 3.0 * gauss(Math.hypot(x + 44, z + 40), 10);            // ruins rise
    h += 2.2 * gauss(Math.hypot(x - 17, z + 30), 7);             // ancient tree mound
    h += 9.0 * (1 - smooth(-57.5, -52.5, z));                    // north cliff with the waterfall
    h += 8.0 * smooth(58, 64, x) * (1 - 0.6 * gauss(z - 2, 3.2) * (1 - smooth(60, 66, x)));  // east rock wall (cave)
    return h;
  },
  keepClear: [{ x: 17, z: -30, r: 7.5 }, { x: -44, z: -40, r: 8 }, { x: -41, z: 7, r: 8.5 }, { x: 55, z: 2, r: 7 }, { x: 40, z: 21, r: 6.5 }, { x: 34, z: 47, r: 8 }, { x: 49, z: -44, r: 6.5 }, { x: -48, z: 48, r: 5 }],
  solids: [
    { x: 17, z: -30, r: 3.3 }, { x: -41, z: 7, r: 4.6 }, { x: -46.5, z: 11.5, r: 1.6 }, { x: 49, z: -44, r: 2.3 }, { x: 36.5, z: 49.5, r: 2.3 }, { x: 31.5, z: 47.5, r: 0.9 },
    { x: 41.5, z: 19, r: 1.3 }, { x: 43.5, z: 23.5, r: 1.0 }, { x: 39, z: 24.5, r: 0.7 },
    { x: -47, z: -43, r: 1.0 }, { x: -41.5, z: -44.5, r: 1.0 }, { x: -48.5, z: -37.5, r: 0.9 }, { x: -44.2, z: -40.5, r: 1.1 }, { x: -48, z: 48, r: 1.1 },
    { x: -33.4, z: 61, r: 0.9 }, { x: -26.6, z: 61, r: 0.9 },
  ],
});
