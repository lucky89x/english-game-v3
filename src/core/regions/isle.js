// Treasure Isle (19/11): a small island east of the fishing pier, reached by boat. Seven named places (old boat, palm tree,
// big rock, stone hut, red flag, campfire, cave) are the landmarks of the English treasure maps: "Start at the old boat. Walk
// eight steps north, then five steps east. Dig there!" Pure data and ground; the scenery is in world/isle.js.
import { makeRegion, P, smooth, gauss } from '../regionkit.js';

/** The named places: where they stand and their solid radius. */
export const MARKS = {
  boat: { en: 'old boat', vi: 'chiếc thuyền cũ', x: -10, z: 10, r: 1.8 },
  palm: { en: 'big palm tree', vi: 'cây dừa lớn', x: 4, z: -14, r: 0.9 },
  rock: { en: 'big rock', vi: 'tảng đá lớn', x: -8, z: -11, r: 2.0 },
  hut: { en: 'stone hut', vi: 'túp lều đá', x: 9, z: 14, r: 2.4 },
  flag: { en: 'red flag', vi: 'lá cờ đỏ', x: 16, z: 3, r: 0.5 },
  fire: { en: 'campfire', vi: 'đống lửa trại', x: 0, z: 2, r: 0.8 },
  cave: { en: 'cave', vi: 'cái hang', x: 15, z: -12, r: 2.5 },
};
export const CENTER = { x: 2, z: 2 };
export const SPAWN_AT = { x: -20, z: 2 };

export default makeRegion({
  name: 'isle', title: 'Treasure Isle', sea: true, size: 90, playRadius: 38, seed: 20261119, trees: 0, rocks: 0,
  riverX: () => 999, riverHalf: () => 0, riverStart: 9999, riverEnd: 9999, bridges: [], stonesZ: null,
  lowSand: () => true, rim: () => 0,
  landmarks: Object.entries(MARKS).map(([id, m]) => ({ id, en: m.en, vi: m.vi, label: m.en, x: m.x, z: m.z, spot: [m.x - (m.r + 1.4) * 0.7, m.z + (m.r + 1.4) * 0.7] })),
  entrance: { x: -21, z: 2 }, spawn: SPAWN_AT,
  exits: [{ x: -23.6, z: 2, r: 3.2, to: 'harbor', label: 'Đi thuyền về Cảng Mặt Trời' }],
  paths: () => [P(2.4, [-20, 2], [-3, 2])],      // a boardwalk from the beach to the campfire
  hills: (x, z, h) => {
    const d = Math.hypot(x - CENTER.x, z - CENTER.z), ring = smooth(23, 31, d);
    h = 0.45 + 0.5 * h + 1.1 * gauss(Math.hypot(x - 10, z + 8), 7) + 0.6 * gauss(Math.hypot(x + 6, z - 6), 6);      // a gentle island with two low rises
    return h * (1 - ring) - 2.6 * ring;
  },
  keepClear: [], solids: Object.values(MARKS).map((m) => ({ x: m.x, z: m.z, r: m.r })),
});
