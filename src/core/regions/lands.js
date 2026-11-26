// (26/11) Maps 4-7: the Golden Desert, the Snowy Peaks, the Ancient Ruins and the Sky Kingdom. One file for the four, because
// they are built the same way: a dry land without a river, a town by the south gate (keeper, merchant, hunt board), roads out to
// the hunting grounds and a boss arena in the north. Pure data (ground, roads, places, things that stand in the way); the
// scenery is drawn by world/lands.js from `decor` and `scatter`, the people and the rules read LAND below.
// Each land has its own shape of roads so the four do not feel like one map: a town by an oasis with long caravan trails,
// a winding valley road, a square of old streets, a ring road round a palace.
import { makeRegion, P, smooth, gauss } from '../regionkit.js';

const DRY = { riverX: () => 999, riverHalf: () => 0, riverStart: 9999, riverEnd: 9999, bridges: [], stonesZ: null };
/** [file, x, z, rot, solid radius (0 = walk through), scale] */
const D = (f, x, z, rot = 0, r = 0, s = 1) => ({ f, x, z, rot, r, s });
const solidsOf = (decor) => decor.filter((d) => d.r > 0).map((d) => ({ x: d.x, z: d.z, r: d.r }));
const clearOf = (decor, more = []) => [...decor.filter((d) => d.r >= 2).map((d) => ({ x: d.x, z: d.z, r: d.r + 3 })), ...more];

// ---------------------------------------------------------------- Map 4: the Golden Desert (Unit 4)
const DESERT_DECOR = [
  D('map3_oasis_pool_v01', 12, 20, 0.3, 4.4), D('map3_inn_oasis_v01', -15, 15, 0.35, 5.6), D('map3_house_sand_a_v01', -17, 33, 1.2, 4.4), D('map3_house_sand_b_v01', 17, 36, -0.8, 3.8),
  D('map3_house_tower_v01', 22, 8, 0, 2.6), D('map3_tent_bazaar_v01', 6.5, 31.5, 0, 2.4), D('map3_well_v01', -4, 20, 0, 1.2), D('map3_house_home_v01', -30, 22, 0.9, 5),
  D('map3_palm_date_a_v01', 17, 15, 0, 0.5), D('map3_palm_date_b_v01', 8, 13, 1, 0.5), D('map3_palm_date_a_v01', 16.5, 25.5, 2, 0.5), D('map3_palm_date_b_v01', -9, 10, 3, 0.5), D('map3_palm_date_a_v01', -22, 40, 1.4, 0.5),
  D('map3_temple_gate_v01', 0, -46, 0, 0), D('map3_obelisk_v01', -6.5, -44, 0, 0.8), D('map3_obelisk_v01', 6.5, -44, 0, 0.8), D('map3_obelisk_v01', 46, -6, 0.4, 0.8, 1.6),
  D('map3_ruin_arch_v01', -48, -12, 0.5, 0), D('map3_ruin_pillar_v01', -44, -8, 0, 0.9), D('map3_ruin_pillar_v01', -52, -17, 1, 0.9), D('map3_ruin_pillar_v01', -43, -18, 2, 0.9),
  D('map3_camel_v01', 30, 31, -1, 1.1), D('map3_camel_v01', 33, 35, 0.6, 1.1), D('vil_tent_v01', 36, 30, 0.8, 2.2), D('map3_crate_sack_v01', 10, 34, 0.4, 0.9), D('map3_carpet_v01', 4, 29, 0.2, 0),
  D('map3_skeleton_v01', -36, 44, 1.1, 0), D('map3_sand_skiff_v01', -40, 8, 0.7, 1.4), D('map3_signpost_v01', 2.6, 44, 0, 0.5), D('map3_signpost_v01', 2.4, 2, 0.6, 0.5),
  D('map3_lantern_pole_v01', -3, 40, 0, 0.3), D('map3_lantern_pole_v01', 3, 12, 0, 0.3), D('map3_lantern_pole_v01', -3, -20, 0, 0.3), D('map3_sandstorm_post_v01', 3, -34, 0, 0.4),
];
const desert = makeRegion({
  name: 'desert', title: 'Golden Desert', land: true, size: 200, playRadius: 82, seed: 20261126, trees: 0, rocks: 26, roughness: 0.3, ...DRY,
  palette: { a: 0xe8d08c, b: 0xf2dea2, far: 0xdcbc74, path: 0xd0ac70, dirt: 0xc8a062, sand: 0xf4e4b4, rock: 0xc9a070, rockL: 0xdcb88a }, flora: 'none', sun: 1.1,
  landmarks: [
    { id: 'oasis', en: 'oasis', vi: 'ốc đảo', label: 'Oasis', x: 12, z: 20, spot: [6, 22] },
    { id: 'inn', en: 'inn', vi: 'quán trọ', label: 'Oasis Inn', x: -15, z: 15, spot: [-9, 19] },
    { id: 'bazaar', en: 'bazaar', vi: 'chợ', label: 'Bazaar', x: 6.5, z: 31.5, spot: [3, 31] },
    { id: 'temple', en: 'temple', vi: 'ngôi đền', label: 'Sun Temple', x: 0, z: -46, spot: [0, -40] },
    { id: 'obelisk', en: 'obelisk', vi: 'cột đá', label: 'Obelisk', x: 46, z: -6, spot: [43, -3] },
    { id: 'ruins', en: 'ruins', vi: 'tàn tích', label: 'Sand Ruins', x: -48, z: -12, spot: [-44, -13] },
    { id: 'camp', en: 'camel camp', vi: 'trại lạc đà', label: 'Camel Camp', x: 33, z: 32, spot: [29, 28] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'forest', label: 'Cổng dịch chuyển' }],
  paths: () => [
    P(3.2, [0, 67], [0, 46], [0, 26], [0, 8]), P(2.8, [0, 8], [-2, -14], [2, -30], [0, -41]), P(2.6, [0, -41], [0, -52]),
    P(2.4, [0, 26], [14, 30], [28, 30]), P(2.4, [0, 8], [22, 2], [40, -4]), P(2.4, [0, 8], [-22, 2], [-42, -10]),
    P(2.2, [0, 46], [-18, 46], [-32, 40]), P(2.2, [28, 30], [34, 40]), P(2.2, [-2, -14], [-24, -22], [-38, -22]), P(2.2, [2, -30], [18, -36], [24, -38]),
  ],
  hills: (x, z, h) => {
    const town = smooth(22, 40, Math.hypot(x, z - 22)), road = smooth(2, 9, Math.abs(x)) * 0.6 + 0.4;
    const dune = Math.max(0, Math.sin(x * 0.12 + Math.sin(z * 0.06) * 1.6) * Math.cos(z * 0.1 - 0.4)) * 1.5 + Math.max(0, Math.sin((x - z) * 0.09 + 1.2)) * 0.8;
    h = 0.45 + (h - 0.35) * 0.5 + dune * town * road;
    h += 1.6 * gauss(Math.hypot(x, z + 58), 14);            // the temple stands on a rise
    return Math.max(0.2, h);
  },
  decor: DESERT_DECOR, keepClear: clearOf(DESERT_DECOR, [{ x: 0, z: -60, r: 12 }]), solids: solidsOf(DESERT_DECOR),
  scatter: [['map3_cactus_a_v01', 46, 1.2], ['map3_cactus_b_v01', 46, 1.2], ['map3_cactus_flower_v01', 34, 1.3], ['map3_dry_bush_v01', 70, 1.3], ['map3_dune_rock_a_v01', 30, 1.2], ['map3_dune_rock_b_v01', 16, 1.1], ['map3_dune_rock_c_v01', 8, 1]],
});

// ---------------------------------------------------------------- Map 5: the Snowy Peaks (Unit 5)
const MOUNTAIN_DECOR = [
  D('bld_guest_inn', -12, 30, 1.2, 5.4), D('vil_tent_v01', 10, 36, -0.6, 2.2), D('vil_campfire_logs_v01', 4, 30, 0, 1.2, 0.8), D('for_stall_willow_v01', 9, 26, 0, 1.8),
  D('ev_tree_xmas_v01', -2, 22, 0, 1.2, 1.4), D('ev_snowman_v01', 14, 44, -0.6, 0.7), D('ev_snowman_v01', -24, 18, 0.9, 0.7), D('ev_snowman_v01', 28, 2, 2.4, 0.7),
  D('for_cave_v01', -50, -30, 0.9, 4.2), D('for_tower_v01', 40, 8, 0.4, 2.4), D('for_gate_arch_v01', 4, -44, 0, 0), D('for_bridge_wood_v01', -20, -6, 1.2, 0),
  D('for_woodpile_v01', -18, 36, 0.3, 1.2), D('nat_rock_c_v01', 30, -30, 1, 2.2), D('nat_rock_c_v01', -34, 12, 2, 2.2), D('nat_rock_cluster_v01', 20, 20, 0.5, 1.4), D('nat_rock_cluster_v01', -8, -24, 1.5, 1.4),
  D('nat_log_v01', 16, 30, 0.8, 0.7), D('vil_lamp_v01', -3, 40, 0, 0.3), D('vil_lamp_v01', 3, 12, 0, 0.3), D('vil_lamp_v01', 12, -18, 0, 0.3), D('vil_lamp_v01', -3, 52, 0, 0.3),
];
const valley = (z) => 14 * Math.sin((z - 40) * 0.045);      // the road winds up the valley
const mountain = makeRegion({
  name: 'mountain', title: 'Snowy Peaks', land: true, size: 200, playRadius: 82, seed: 20261127, trees: 240, rocks: 60, treeMix: [1, 1], roughness: 0.5, ...DRY,
  palette: { a: 0xf2f6fc, b: 0xe0eaf6, far: 0xcfdcee, path: 0xbcc8d6, dirt: 0xaab6c4, sand: 0xdde6f0, rock: 0x8f98a8, rockL: 0xb6becb }, flora: 'none', snow: true,
  landmarks: [
    { id: 'lodge', en: 'lodge', vi: 'nhà nghỉ trên núi', label: 'Mountain Lodge', x: -12, z: 30, spot: [-6, 31] },
    { id: 'lake', en: 'frozen lake', vi: 'hồ băng', label: 'Frozen Lake', x: -26, z: -4, spot: [-20, -2] },
    { id: 'tower', en: 'watchtower', vi: 'tháp canh', label: 'Watchtower', x: 40, z: 8, spot: [36, 10] },
    { id: 'cave', en: 'ice cave', vi: 'hang băng', label: 'Ice Cave', x: -50, z: -30, spot: [-45, -27] },
    { id: 'gate', en: 'summit gate', vi: 'cổng đỉnh núi', label: 'Summit Gate', x: 4, z: -44, spot: [4, -40] },
    { id: 'tree', en: 'winter tree', vi: 'cây mùa đông', label: 'Winter Tree', x: -2, z: 22, spot: [1, 24] },
    { id: 'camp', en: 'campfire', vi: 'lửa trại', label: 'Campfire', x: 4, z: 30, spot: [5, 33] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'desert', label: 'Cổng dịch chuyển' }],
  paths: () => { const pts = []; for (let z = 46; z >= -40; z -= 8) pts.push([valley(z), z]); return [
    P(3.0, [0, 67], [0, 54], [valley(46), 46]), P(2.8, ...pts), P(2.6, [valley(-34), -34], [4, -44], [6, -54]),
    P(2.2, [valley(30), 30], [-10, 34]), P(2.2, [valley(14), 14], [22, 10], [36, 10]), P(2.2, [valley(-2), -2], [-14, -4], [-20, -2]),
    P(2.2, [valley(38), 38], [20, 42], [34, 38]), P(2.2, [-10, 34], [-24, 40], [-32, 42]), P(2.2, [valley(-18), -18], [-24, -26], [-44, -27]), P(2.2, [36, 10], [44, -6]),
  ]; },
  hills: (x, z, h) => {
    h = 0.5 + (h - 0.35) * 0.8;
    h += 2.6 * gauss(Math.hypot(x - 40, z - 8), 11) + 2.2 * gauss(Math.hypot(x + 50, z + 30), 12) + 1.8 * gauss(Math.hypot(x - 6, z + 60), 14);      // the watchtower knoll, the cave slope, the summit
    h -= 0.5 * gauss(Math.hypot(x + 26, z + 4), 9);      // the lake lies in a hollow
    return Math.max(0.22, h);
  },
  decor: MOUNTAIN_DECOR, keepClear: clearOf(MOUNTAIN_DECOR, [{ x: 6, z: -60, r: 12 }, { x: -26, z: -4, r: 10 }, { x: 0, z: 30, r: 16 }]), solids: solidsOf(MOUNTAIN_DECOR),
  scatter: [['nat_rock_a_v01', 60, 1.2], ['nat_rock_b_v01', 26, 1.1], ['nat_stump_v01', 24, 1], ['nat_log_v01', 14, 1]],
});

// ---------------------------------------------------------------- Map 6: the Ancient Ruins (Unit 6)
const RUINS_DECOR = [
  D('for_gate_arch_v01', 0, 48, 0, 0), D('for_ruins_v01', -14, 24, 0.3, 4.4), D('for_stall_willow_v01', 10, 30, 0, 1.8), D('vil_campfire_logs_v01', 3, 34, 0, 1.2, 0.8), D('vil_tent_v01', 14, 38, -0.5, 2.2),
  D('map3_ruin_arch_v01', 0, 6, 0, 0), D('map3_ruin_arch_v01', 28, -8, 1.57, 0), D('map3_ruin_arch_v01', -28, -8, 1.57, 0), D('map3_temple_gate_v01', 0, -44, 0, 0),
  D('for_tower_v01', 42, -24, 0.6, 2.4), D('for_ruins_v01', -40, 2, 2.2, 4.4), D('map3_obelisk_v01', 30, 30, 0, 0.8, 1.5), D('map3_obelisk_v01', -30, 30, 0, 0.8, 1.5), D('map3_obelisk_v01', 30, -36, 0, 0.8, 1.5), D('map3_obelisk_v01', -30, -36, 0, 0.8, 1.5),
  D('map3_ruin_pillar_v01', -6, 12, 0, 0.9), D('map3_ruin_pillar_v01', 6, 12, 1, 0.9), D('map3_ruin_pillar_v01', -6, 0, 2, 0.9), D('map3_ruin_pillar_v01', 6, 0, 3, 0.9),
  D('map3_ruin_pillar_v01', 22, -2, 0.5, 0.9), D('map3_ruin_pillar_v01', 34, -2, 1.5, 0.9), D('map3_ruin_pillar_v01', -22, -2, 2.5, 0.9), D('map3_ruin_pillar_v01', -34, -14, 0.2, 0.9),
  D('map3_ruin_pillar_v01', -5, -38, 0, 0.9), D('map3_ruin_pillar_v01', 5, -38, 1.2, 0.9), D('nat_mushroom_big_v01', -20, 40, 0, 0.6, 1.4), D('nat_rock_c_v01', 20, 14, 0.4, 2.2), D('nat_rock_cluster_v01', -18, -24, 1, 1.4),
  D('vil_lamp_v01', -3, 42, 0, 0.3), D('vil_lamp_v01', 3, 18, 0, 0.3), D('vil_lamp_v01', -3, -20, 0, 0.3), D('map3_chest_v01', -41, -1, 0.6, 0.6),
];
const ruins = makeRegion({
  name: 'ruins', title: 'Ancient Ruins', land: true, size: 200, playRadius: 82, seed: 20261128, trees: 170, rocks: 70, treeMix: [0.12, 0.8], roughness: 0.45, ...DRY,
  palette: { a: 0x6fa65a, b: 0x93bd6c, far: 0x4f8a4a, path: 0xb9b3a4, dirt: 0x9c968a, sand: 0xc8c2ae, rock: 0x8e8b86, rockL: 0xb0aca4 }, flora: 'sparse',
  landmarks: [
    { id: 'gate', en: 'old gate', vi: 'cổng cũ', label: 'Old Gate', x: 0, z: 48, spot: [0, 44] },
    { id: 'hall', en: 'broken hall', vi: 'sảnh đổ nát', label: 'Broken Hall', x: -14, z: 24, spot: [-8, 26] },
    { id: 'court', en: 'pillar court', vi: 'sân cột đá', label: 'Pillar Court', x: 0, z: 6, spot: [0, 9] },
    { id: 'tower', en: 'fallen tower', vi: 'tháp đổ', label: 'Fallen Tower', x: 42, z: -24, spot: [38, -21] },
    { id: 'library', en: 'lost library', vi: 'thư viện bị lãng quên', label: 'Lost Library', x: -40, z: 2, spot: [-34, 3] },
    { id: 'vault', en: 'vault door', vi: 'cửa hầm', label: 'Vault Door', x: 0, z: -44, spot: [0, -39] },
    { id: 'sundial', en: 'sundial', vi: 'đồng hồ mặt trời', label: 'Sundial', x: 30, z: 30, spot: [27, 27] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'mountain', label: 'Cổng dịch chuyển' }],
  paths: () => [      // old streets on a square grid
    P(3.2, [0, 67], [0, 40], [0, 16]), P(2.8, [0, 16], [0, -6], [0, -40]), P(2.6, [0, -40], [0, -52]),
    P(2.6, [-34, 16], [0, 16], [34, 16]), P(2.6, [-34, -8], [0, -8], [34, -8]), P(2.4, [-34, 30], [-34, 16], [-34, -8], [-34, -30]), P(2.4, [34, 30], [34, 16], [34, -8], [34, -30]),
    P(2.2, [34, -8], [48, -10]), P(2.2, [-34, -8], [-46, -14]), P(2.2, [0, 40], [20, 40], [34, 30]), P(2.2, [0, 40], [-20, 40], [-34, 30]),
  ],
  hills: (x, z, h) => {
    h = 0.5 + (h - 0.35) * 0.7 + 2.4 * gauss(Math.hypot(x - 42, z + 24), 11) + 1.8 * gauss(Math.hypot(x, z + 58), 14) + 1.4 * gauss(Math.hypot(x + 40, z - 2), 12);
    return Math.max(0.22, h);
  },
  decor: RUINS_DECOR, keepClear: clearOf(RUINS_DECOR, [{ x: 0, z: -58, r: 12 }, { x: 0, z: 6, r: 12 }, { x: 4, z: 34, r: 14 }]), solids: solidsOf(RUINS_DECOR),
  scatter: [['map3_ruin_pillar_v01', 34, 1.1], ['nat_rock_a_v01', 50, 1.2], ['nat_rock_b_v01', 24, 1.1], ['nat_mushroom_big_v01', 30, 1.2], ['nat_stump_v01', 20, 1]],
});

// ---------------------------------------------------------------- Map 7: the Sky Kingdom (Unit 7)
const RING = 34;      // the ring road round the palace
const ringPts = (a0, a1, n = 9) => Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * i / (n - 1); return [+(Math.sin(a) * RING).toFixed(1), +(-Math.cos(a) * RING + 4).toFixed(1)]; });
const SKY_DECOR = [
  D('for_gate_arch_v01', 0, 50, 0, 0), D('map3_house_tower_v01', 0, 4, 0, 2.8, 1.4), D('for_stall_willow_v01', 10, 44, 0, 1.8), D('vil_tent_v01', -11, 46, 0.5, 2.2),
  D('ev_arena_v01', 0, -58, 0, 0), D('for_portal_v01', 0, -30, 0, 0), D('map3_house_tower_v01', 44, 10, 0.4, 2.6), D('for_tower_v01', -44, 6, -0.4, 2.4),
  D('nat_blossom_v01', 14, 16, 0, 0.6), D('nat_blossom_v01', -14, 16, 1, 0.6), D('nat_blossom_v01', 16, -8, 2, 0.6), D('nat_blossom_v01', -16, -8, 3, 0.6), D('nat_blossom_v01', 30, 40, 1.4, 0.6), D('nat_blossom_v01', -30, 40, 0.4, 0.6),
  D('nat_blossom_v01', 46, -18, 0.9, 0.6), D('nat_blossom_v01', -46, -18, 2.2, 0.6), D('nat_autumn_v01', 24, -40, 0.3, 0.6), D('nat_autumn_v01', -24, -40, 1.3, 0.6),
  D('ev_lantern_star_v01', -28, -32, 0, 0.3), D('ev_lantern_star_v01', -32, -36, 1, 0.3), D('ev_lantern_star_v01', -25, -38, 2, 0.3), D('ev_lantern_star_v01', -34, -30, 3, 0.3), D('ev_lantern_star_v01', -30, -41, 1.5, 0.3),
  D('map3_obelisk_v01', 30, -34, 0, 0.8, 1.6), D('vil_lamp_v01', -3, 56, 0, 0.3), D('vil_lamp_v01', 3, 40, 0, 0.3), D('vil_lamp_v01', -3, -24, 0, 0.3), D('ev_ghost_friendly_v01', 36, 42, -0.8, 0.5),
];
const sky = makeRegion({
  name: 'sky', title: 'Sky Kingdom', land: true, size: 200, playRadius: 82, seed: 20261129, trees: 0, rocks: 18, roughness: 0.25, ...DRY,
  palette: { a: 0xa8e6c8, b: 0xd2f6e0, far: 0xf2faff, path: 0xfff0b8, dirt: 0xf2dc9c, sand: 0xfdf6e0, rock: 0xeef4fc, rockL: 0xffffff }, flora: 'sparse', noFar: true, clouds: true,
  landmarks: [
    { id: 'gate', en: 'sky gate', vi: 'cổng trời', label: 'Sky Gate', x: 0, z: 50, spot: [0, 46] },
    { id: 'palace', en: 'cloud palace', vi: 'cung điện mây', label: 'Cloud Palace', x: 0, z: 4, spot: [0, 10] },
    { id: 'belltower', en: 'wind bell tower', vi: 'tháp chuông gió', label: 'Wind Bell Tower', x: 44, z: 10, spot: [40, 12] },
    { id: 'lookout', en: 'lookout', vi: 'đài quan sát', label: 'Lookout', x: -44, z: 6, spot: [-40, 8] },
    { id: 'garden', en: 'star garden', vi: 'vườn sao', label: 'Star Garden', x: -30, z: -36, spot: [-27, -31] },
    { id: 'sundial', en: 'sun stone', vi: 'đá mặt trời', label: 'Sun Stone', x: 30, z: -34, spot: [27, -30] },
    { id: 'arena', en: 'sun arena', vi: 'đấu trường mặt trời', label: 'Sun Arena', x: 0, z: -58, spot: [0, -48] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'ruins', label: 'Cổng dịch chuyển' }],
  paths: () => [
    P(3.2, [0, 67], [0, 50], [0, 38]), P(2.8, ...ringPts(Math.PI, Math.PI * 3, 25)), P(2.6, [0, -30], [0, -48]), P(2.4, [0, 38], [0, 12]),
    P(2.2, [RING, 4], [40, 12]), P(2.2, [-RING, 4], [-40, 8]), P(2.2, [-24, -20], [-27, -31]), P(2.2, [24, -20], [27, -30]), P(2.2, [24, 28], [34, 40]), P(2.2, [-24, 28], [-34, 40]),
  ],
  hills: (x, z, h) => {
    const d = Math.hypot(x, z);
    h = 0.6 + (h - 0.35) * 0.4 + 1.2 * gauss(Math.hypot(x, z - 4), 10);      // the palace stands on a low mound
    h += 0.9 * Math.max(0, Math.sin(d * 0.16)) * smooth(40, 60, d);            // soft cloud terraces towards the rim
    return Math.max(0.25, h);
  },
  decor: SKY_DECOR, keepClear: clearOf(SKY_DECOR, [{ x: 0, z: -58, r: 13 }]), solids: solidsOf(SKY_DECOR),
  scatter: [['nat_rock_a_v01', 20, 1.2], ['nat_mushroom_big_v01', 14, 1.3]],
});

export { desert, mountain, ruins, sky };

// ================================================================ (26/11, turn 63) Maps 8-12 on the same frame
// Fairy Isle, Volcano Valley, the Crystal Cave, the Future City and the Dream Kingdom. Their own scenery (giant flowers, lava,
// crystals, towers of glass, stars) is drawn in code by world/lands.js from the lists below (`lava`, `towers`, `gems` …), so a
// land can be built before any model exists; models from Blender or Tripo replace the code pieces later, one by one.
/** A round thing drawn in code that stands in the way: [x, z, r]. */
const blocks = (list) => list.map(([x, z, r]) => ({ x, z, r }));

// ---------------------------------------------------------------- Map 8: Fairy Isle (Unit 8)
const FAIRY_DECOR = [
  D('for_gate_arch_v01', 0, 50, 0, 0), D('nat_mushroom_big_v01', -14, 36, 0.4, 3.0, 5), D('nat_mushroom_big_v01', 15, 40, 1.2, 2.6, 4.2), D('nat_mushroom_big_v01', -24, 24, 2.2, 2.4, 3.8),
  D('stall_flowers', 9, 30, 0, 1.8), D('stall_sweets', -6, 27, 0.3, 1.6), D('for_waterfall_v01', -54, -4, 0.9, 6), D('vil_windmill_v01', 46, 6, -0.6, 3.2), D('for_portal_v01', 0, -44, 0, 0),
  D('nat_blossom_v01', 10, 14, 0, 0.6), D('nat_blossom_v01', -10, 14, 1, 0.6), D('nat_blossom_v01', 12, -6, 2, 0.6), D('nat_blossom_v01', -12, -6, 3, 0.6), D('nat_blossom_v01', 24, 46, 1.4, 0.6), D('nat_blossom_v01', -24, 46, 0.4, 0.6),
  D('nat_blossom_v01', 40, -30, 0.9, 0.6), D('nat_blossom_v01', -40, -30, 2.2, 0.6), D('nat_blossom_v01', 6, -34, 0.3, 0.6), D('nat_blossom_v01', -6, -34, 1.3, 0.6),
  D('nat_mushroom_group_v01', 20, 22, 0, 1.2, 4), D('nat_mushroom_group_v01', -34, 12, 1, 1.2, 4), D('nat_mushroom_group_v01', 34, -12, 2, 1.2, 4), D('yard_flowerbed_v01', 4, 40, 0, 0.8), D('yard_flowerbed_v01', -5, 42, 1.57, 0.8),
  D('vil_lantern_hang_v01', -3, 44, 0, 0.3), D('vil_lantern_hang_v01', 3, 22, 0, 0.3), D('vil_lantern_hang_v01', -3, -26, 0, 0.3), D('yard_bench_v01', 6, 36, -1.2, 0.7),
];
const fairy = makeRegion({
  name: 'fairy', title: 'Fairy Isle', land: true, size: 200, playRadius: 82, seed: 20261201, trees: 150, rocks: 30, treeMix: [0.7, 0.95], roughness: 0.4, ...DRY,
  palette: { a: 0x86d67a, b: 0xb4ee98, far: 0x5fb07a, path: 0xf2cfe6, dirt: 0xe0b8d2, sand: 0xf8e6f2, rock: 0xa9a4c0, rockL: 0xcfc8e6 }, flora: 'full', noFar: true,
  landmarks: [
    { id: 'gate', en: 'fairy gate', vi: 'cổng tiên', label: 'Fairy Gate', x: 0, z: 50, spot: [0, 46] },
    { id: 'house', en: 'mushroom house', vi: 'nhà nấm', label: 'Mushroom House', x: -14, z: 36, spot: [-9, 37] },
    { id: 'pond', en: 'moon pond', vi: 'hồ trăng', label: 'Moon Pond', x: 0, z: 4, spot: [0, 13] },
    { id: 'flower', en: 'giant flower', vi: 'bông hoa khổng lồ', label: 'Giant Flower', x: -34, z: -24, spot: [-30, -20] },
    { id: 'waterfall', en: 'waterfall', vi: 'thác nước', label: 'Rainbow Falls', x: -52, z: -4, spot: [-46, -2] },
    { id: 'mill', en: 'windmill', vi: 'cối xay gió', label: 'Petal Mill', x: 46, z: 6, spot: [41, 8] },
    { id: 'ring', en: 'fairy ring', vi: 'vòng tròn tiên', label: 'Thorn Garden', x: 0, z: -44, spot: [0, -40] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'sky', label: 'Cổng dịch chuyển' }],
  paths: () => [      // two arcs that part at the gate and meet again in the north: the shape of a leaf
    P(3.2, [0, 67], [0, 46], [0, 26]), P(2.6, [0, 26], [-18, 20], [-30, 4], [-28, -16], [-14, -32], [0, -40]), P(2.6, [0, 26], [18, 20], [30, 4], [28, -16], [14, -32], [0, -40]),
    P(2.6, [0, -40], [0, -50]), P(2.4, [0, 26], [0, 13]), P(2.2, [-30, 4], [-46, -2]), P(2.2, [30, 4], [41, 8]), P(2.2, [-28, -16], [-30, -20]),
    P(2.2, [0, 46], [-16, 46], [-30, 42]), P(2.2, [0, 46], [16, 46], [30, 42]), P(2.2, [28, -16], [42, -22]),
  ],
  hills: (x, z, h) => {
    h = 0.55 + (h - 0.35) * 0.6 + 1.6 * gauss(Math.hypot(x + 52, z + 6), 12) + 1.4 * gauss(Math.hypot(x - 46, z - 6), 11) + 1.2 * gauss(Math.hypot(x, z + 58), 14);
    h -= 0.35 * gauss(Math.hypot(x, z - 4), 8);      // the pond lies in a hollow
    return Math.max(0.25, h);
  },
  decor: FAIRY_DECOR, keepClear: clearOf(FAIRY_DECOR, [{ x: 0, z: -58, r: 12 }, { x: 0, z: 4, r: 9 }, { x: 2, z: 34, r: 14 }, { x: -34, z: -24, r: 6 }]), solids: [...solidsOf(FAIRY_DECOR), ...blocks([[-34, -24, 2.2]])],
  scatter: [['nat_mushroom_big_v01', 40, 1.5], ['nat_mushroom_group_v01', 40, 2.4], ['nat_stump_v01', 14, 1], ['nat_rock_a_v01', 18, 1]],
  flowers: [[-34, -24, 9, 0xff7ac8], [22, 30, 4.5, 0xffd24a], [-20, -40, 5, 0xb48cff], [36, -34, 5.5, 0xff9a5a], [-44, 24, 4.5, 0x7ad8ff], [50, 26, 4, 0xff7ac8]],      // [x, z, height, colour]
});

// ---------------------------------------------------------------- Map 9: Volcano Valley (Unit 9)
const LAVA = [[-22, 38, 5], [26, 22, 6], [-30, -2, 7], [30, -16, 5.5], [-20, -36, 6], [48, 40, 6], [-52, 20, 5]];      // pools of lava: [x, z, r]
const VOLCANO_DECOR = [
  D('bld_village_forge', -13, 46, 1.4, 4.8), D('vil_tent_v01', 11, 48, -0.6, 2.2), D('vil_campfire_logs_v01', 4, 42, 0, 1.2, 0.8), D('for_stall_willow_v01', 10, 38, 0, 1.8),
  D('for_tower_v01', -44, -18, 0.6, 2.4), D('for_cave_v01', 50, -6, -0.9, 4.2), D('map3_ruin_arch_v01', 0, -42, 0, 0), D('map3_obelisk_v01', -6, -40, 0, 0.8, 1.4), D('map3_obelisk_v01', 6, -40, 0, 0.8, 1.4),
  D('nat_rock_c_v01', 14, 30, 1, 2.2), D('nat_rock_c_v01', -12, 16, 2, 2.2), D('nat_rock_c_v01', 12, -4, 0.4, 2.2), D('nat_rock_c_v01', -14, -22, 1.7, 2.2), D('nat_rock_c_v01', 40, 6, 2.6, 2.2), D('nat_rock_c_v01', -44, 36, 0.8, 2.2),
  D('nat_rock_cluster_v01', 36, 34, 0.5, 1.4), D('nat_rock_cluster_v01', -36, 12, 1.5, 1.4), D('nat_rock_cluster_v01', 22, -34, 2.5, 1.4), D('for_woodpile_v01', -18, 40, 0.3, 1.2), D('map3_skeleton_v01', 34, -30, 0.6, 0),
  D('vil_lamp_v01', -3, 52, 0, 0.3), D('vil_lamp_v01', 3, 36, 0, 0.3), D('vil_lamp_v01', -3, -30, 0, 0.3), D('map3_signpost_v01', 2.6, 34, 0, 0.5),
];
const volcano = makeRegion({
  name: 'volcano', title: 'Volcano Valley', land: true, size: 200, playRadius: 82, seed: 20261202, trees: 0, rocks: 90, roughness: 0.6, ...DRY,
  palette: { a: 0x7c665a, b: 0x8e7566, far: 0x5c4a42, path: 0xb89070, dirt: 0x90705a, sand: 0x8a766a, rock: 0x4a4040, rockL: 0x645656 }, flora: 'none', hour: 16.8, embers: true,
  landmarks: [
    { id: 'forge', en: 'forge', vi: 'lò rèn', label: 'Ember Forge', x: -13, z: 46, spot: [-7, 45] },
    { id: 'camp', en: 'camp', vi: 'trại', label: 'Ember Camp', x: 4, z: 42, spot: [5, 45] },
    { id: 'pool', en: 'lava pool', vi: 'hồ dung nham', label: 'Lava Pool', x: 26, z: 22, spot: [18, 20] },
    { id: 'tower', en: 'fire watch', vi: 'chòi canh lửa', label: 'Fire Watch', x: -44, z: -18, spot: [-39, -15] },
    { id: 'cave', en: 'ash cave', vi: 'hang tro', label: 'Ash Cave', x: 50, z: -6, spot: [44, -4] },
    { id: 'gate', en: 'fire gate', vi: 'cổng lửa', label: 'Fire Gate', x: 0, z: -42, spot: [0, -38] },
    { id: 'mountain', en: 'volcano', vi: 'núi lửa', label: 'Fire Mountain', x: 0, z: -58, spot: [0, -48] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'fairy', label: 'Cổng dịch chuyển' }],
  paths: () => [      // a road that zigzags up between the pools of lava
    P(3.0, [0, 67], [0, 50], [0, 34]), P(2.8, [0, 34], [-10, 26], [8, 12], [-12, -2], [10, -16], [0, -30], [0, -40]), P(2.6, [0, -40], [0, -50]),
    P(2.2, [8, 12], [18, 20]), P(2.2, [-12, -2], [-26, -10], [-39, -15]), P(2.2, [10, -16], [28, -4], [44, -4]), P(2.2, [0, 50], [20, 52], [34, 50]), P(2.2, [0, 50], [-22, 54], [-36, 50]), P(2.2, [-10, 26], [-34, 26], [-40, 28]),
  ],
  hills: (x, z, h) => {
    h = 0.5 + (h - 0.35) * 0.9 + 2.4 * gauss(Math.hypot(x + 44, z + 18), 10) + 2.0 * gauss(Math.hypot(x - 50, z + 6), 12) + 2.2 * gauss(Math.hypot(x, z + 62), 13);
    for (const [lx, lz, r] of LAVA) h -= 0.45 * gauss(Math.hypot(x - lx, z - lz), r);      // every pool lies in a dip
    return Math.max(0.2, h);
  },
  decor: VOLCANO_DECOR, lava: LAVA, keepClear: clearOf(VOLCANO_DECOR, [{ x: 0, z: -58, r: 12 }, { x: 3, z: 42, r: 13 }, ...LAVA.map(([x, z, r]) => ({ x, z, r: r + 2 }))]), solids: [...solidsOf(VOLCANO_DECOR), ...blocks(LAVA)],
  scatter: [['nat_rock_a_v01', 70, 1.3], ['nat_rock_b_v01', 40, 1.2], ['nat_stump_v01', 36, 1.1], ['nat_log_v01', 16, 1], ['map3_dune_rock_a_v01', 20, 1.3]],
});

// ---------------------------------------------------------------- Map 10: the Crystal Cave (Unit 10)
const HUB = 15, hubPts = (n = 25) => Array.from({ length: n }, (_, i) => { const a = i / (n - 1) * Math.PI * 2; return [+(Math.sin(a) * HUB).toFixed(1), +(Math.cos(a) * HUB + 4).toFixed(1)]; });
const GEMS = [[46, -22, 9, 0x6ad8ff], [-48, -20, 8, 0xd08cff], [44, 32, 7, 0xff8ad8], [-44, 34, 7, 0x8affc8], [0, -44, 6, 0xb48cff], [14, 22, 4, 0x6ad8ff], [-14, 22, 4, 0xff8ad8], [22, -8, 4.5, 0x8affc8], [-22, -8, 4.5, 0xd08cff]];      // great crystals: [x, z, height, colour]
const CRYSTAL_DECOR = [
  D('vil_tent_v01', -12, 42, 0.6, 2.2), D('for_stall_willow_v01', 10, 38, 0, 1.8), D('harbor_crate_stack_v01', -6, 46, 0.4, 1.0), D('for_woodpile_v01', 14, 46, 0.3, 1.2), D('vil_campfire_logs_v01', 3, 42, 0, 1.2, 0.8),
  D('for_cave_v01', -58, 6, 1.5, 4.2), D('for_cave_v01', 58, 4, -1.5, 4.2), D('for_gate_arch_v01', 0, -42, 0, 0), D('map3_chest_v01', 46, 28, -0.6, 0.6),
  D('nat_rock_c_v01', 28, 14, 1, 2.2), D('nat_rock_c_v01', -28, 14, 2, 2.2), D('nat_rock_c_v01', 30, -30, 0.4, 2.2), D('nat_rock_c_v01', -30, -30, 1.7, 2.2), D('nat_rock_c_v01', 20, 50, 2.6, 2.2), D('nat_rock_c_v01', -22, 52, 0.8, 2.2),
  D('nat_rock_cluster_v01', 8, -24, 0.5, 1.4), D('nat_rock_cluster_v01', -8, -24, 1.5, 1.4), D('vil_lamp_v01', -3, 52, 0, 0.3), D('vil_lamp_v01', 3, 30, 0, 0.3), D('vil_lamp_v01', -3, -30, 0, 0.3), D('vil_lamp_v01', 30, 2, 0, 0.3), D('vil_lamp_v01', -30, 2, 0, 0.3),
];
const crystal = makeRegion({
  name: 'crystal', title: 'Crystal Cave', land: true, size: 200, playRadius: 82, seed: 20261203, trees: 0, rocks: 110, roughness: 0.55, ...DRY,
  palette: { a: 0x3c3868, b: 0x4e4a84, far: 0x2a2650, path: 0x8a84c0, dirt: 0x6a64a0, sand: 0x9a94cc, rock: 0x45416e, rockL: 0x6e6aa8 }, flora: 'none', hour: 21.5,
  landmarks: [
    { id: 'camp', en: 'miners\' camp', vi: 'trại thợ mỏ', label: 'Miners\' Camp', x: -12, z: 42, spot: [-7, 43] },
    { id: 'lake', en: 'glow lake', vi: 'hồ phát sáng', label: 'Glow Lake', x: 0, z: 4, spot: [0, 21] },
    { id: 'blue', en: 'blue crystal', vi: 'tinh thể xanh', label: 'Echo Crystal', x: 46, z: -22, spot: [40, -18] },
    { id: 'purple', en: 'purple crystal', vi: 'tinh thể tím', label: 'Whisper Crystal', x: -48, z: -20, spot: [-42, -17] },
    { id: 'tunnel', en: 'tunnel', vi: 'đường hầm', label: 'West Tunnel', x: -58, z: 6, spot: [-51, 6] },
    { id: 'mine', en: 'mine', vi: 'hầm mỏ', label: 'East Mine', x: 58, z: 4, spot: [51, 4] },
    { id: 'hollow', en: 'dragon\'s hollow', vi: 'hốc rồng', label: 'Dragon\'s Hollow', x: 0, z: -42, spot: [0, -38] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'volcano', label: 'Cổng dịch chuyển' }],
  paths: () => [      // a ring round the Glow Lake and tunnels out to every chamber, like the spokes of a wheel
    P(3.0, [0, 67], [0, 46], [0, 19]), P(2.6, ...hubPts()), P(2.6, [0, -11], [0, -38], [0, -50]),
    P(2.4, [13, -3.5], [28, -12], [40, -18]), P(2.4, [-13, -3.5], [-28, -12], [-42, -17]), P(2.4, [15, 4], [34, 4], [51, 4]), P(2.4, [-15, 4], [-34, 4], [-51, 6]),
    P(2.2, [10.6, 14.6], [26, 26], [40, 30]), P(2.2, [-10.6, 14.6], [-26, 26], [-40, 32]), P(2.2, [0, 46], [-18, 50], [-32, 50]), P(2.2, [0, 46], [18, 50], [32, 50]),
  ],
  hills: (x, z, h) => {
    const d = Math.hypot(x, z);
    h = 0.5 + (h - 0.35) * 0.9 + 2.2 * gauss(Math.hypot(x - 58, z - 4), 10) + 2.2 * gauss(Math.hypot(x + 58, z - 6), 10) + 1.8 * gauss(Math.hypot(x, z + 60), 13);
    h -= 0.5 * gauss(Math.hypot(x, z - 4), 9);      // the lake
    h += 5 * smooth(84, 98, d);                     // the walls of the cave rise round the rim
    return Math.max(0.22, h);
  },
  decor: CRYSTAL_DECOR, gems: GEMS, keepClear: clearOf(CRYSTAL_DECOR, [{ x: 0, z: -58, r: 12 }, { x: 0, z: 4, r: 11 }, { x: 2, z: 42, r: 13 }, ...GEMS.map(([x, z, hgt]) => ({ x, z, r: hgt * 0.5 + 2 }))]), solids: [...solidsOf(CRYSTAL_DECOR), ...blocks(GEMS.map(([x, z, hgt]) => [x, z, hgt * 0.28]))],
  scatter: [['nat_rock_a_v01', 70, 1.3], ['nat_rock_b_v01', 40, 1.2], ['map3_dune_rock_b_v01', 20, 1.2]],
});

// ---------------------------------------------------------------- Map 11: the Future City (Unit 11)
/** Towers of glass drawn in code: [x, z, width, depth, height, colour of the lights]. They stand in the blocks between the avenues. */
const TOWERS = [
  [-18, 28, 9, 8, 22, 0x6ad8ff], [18, 27, 8, 9, 30, 0xff8ad8], [-19, 2, 10, 9, 38, 0x8affc8], [19, 1, 9, 10, 26, 0xffd24a], [-18, -26, 9, 8, 34, 0xb48cff], [18, -26, 10, 8, 42, 0x6ad8ff],
  [-52, 28, 9, 9, 28, 0xffd24a], [52, 27, 9, 8, 20, 0x8affc8], [-52, -26, 8, 9, 24, 0xff8ad8], [52, -27, 9, 9, 36, 0xb48cff], [-34, 58, 8, 7, 18, 0x6ad8ff], [34, 58, 8, 7, 24, 0xff8ad8],
];
const CITY_DECOR = [
  D('stall_potions', 9, 46, 0, 1.8), D('stall_gifts', -8, 48, 0.2, 1.8), D('harbor_lamp_post_v01', -4, 56, 0, 0.3), D('harbor_lamp_post_v01', 4, 34, 0, 0.3), D('harbor_lamp_post_v01', -4, 8, 0, 0.3), D('harbor_lamp_post_v01', 4, -30, 0, 0.3),
  D('harbor_lamp_post_v01', 32, 44, 0, 0.3), D('harbor_lamp_post_v01', -32, 44, 0, 0.3), D('harbor_lamp_post_v01', 40, 10, 0, 0.3), D('harbor_lamp_post_v01', -40, 10, 0, 0.3), D('harbor_lamp_post_v01', 32, -42, 0, 0.3), D('harbor_lamp_post_v01', -32, -42, 0, 0.3),
  D('harbor_container_blue_v01', 50, 4, 0.3, 2.4), D('harbor_container_orange_v01', 53, 0, 1.2, 2.4), D('harbor_crane_v01', -56, 0, 0.8, 3.0, 0.4), D('harbor_crate_stack_v01', -48, 6, 0.4, 1.0),
  D('nat_oak_a_v01', 14, -50, 0, 0.7), D('nat_oak_b_v01', -14, -50, 1, 0.7), D('nat_blossom_v01', 8, 20, 2, 0.6), D('nat_blossom_v01', -8, 20, 3, 0.6), D('yard_bench_v01', 6, 22, -1.2, 0.7), D('yard_bench_v01', -6, 22, 1.2, 0.7),
  D('yard_flowerbed_v01', 10, 8, 0, 0.8), D('yard_flowerbed_v01', -10, 8, 0, 0.8), D('ev_scoreboard_v01', -12, 40, 0.5, 1.0),
];
const city = makeRegion({
  name: 'city', title: 'Future City', land: true, size: 200, playRadius: 82, seed: 20261204, trees: 0, rocks: 0, roughness: 0.12, ...DRY,
  palette: { a: 0xa9b9c9, b: 0xbdcbd9, far: 0x8ea0b4, path: 0x3b444f, dirt: 0x59636f, sand: 0xd0dae4, rock: 0x7a8694, rockL: 0x9aa6b4 }, flora: 'none',
  landmarks: [
    { id: 'station', en: 'station', vi: 'nhà ga', label: 'Sky Station', x: 0, z: 50, spot: [0, 46] },
    { id: 'tower', en: 'solar tower', vi: 'tháp năng lượng mặt trời', label: 'Solar Tower', x: 0, z: -12, spot: [0, 1] },
    { id: 'park', en: 'park', vi: 'công viên', label: 'Green Park', x: 0, z: 20, spot: [0, 24] },
    { id: 'lab', en: 'laboratory', vi: 'phòng thí nghiệm', label: 'Nova\'s Lab', x: -19, z: 2, spot: [-12, 8] },
    { id: 'factory', en: 'factory', vi: 'nhà máy', label: 'Robot Factory', x: -54, z: 2, spot: [-46, 10] },
    { id: 'port', en: 'spaceport', vi: 'sân bay vũ trụ', label: 'Spaceport', x: 52, z: 2, spot: [44, 10] },
    { id: 'core', en: 'control centre', vi: 'trung tâm điều khiển', label: 'Warden\'s Core', x: 0, z: -46, spot: [0, -42] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'crystal', label: 'Cổng dịch chuyển' }],
  paths: () => [      // wide avenues on a grid; the Solar Tower stands in the middle of the main one, a ring road goes round it
    P(3.6, [0, 67], [0, 42], [0, 0]), P(3.0, ...ringPts(0, Math.PI * 2, 21).map(([x, z]) => [+(x * 12 / RING).toFixed(1), +((z - 4) * 12 / RING - 12).toFixed(1)])), P(3.2, [0, -24], [0, -40], [0, -50]),
    P(3.0, [-46, 42], [0, 42], [46, 42]), P(3.0, [-48, 14], [-12, 14], [0, 14], [12, 14], [48, 14]), P(3.0, [-46, -40], [0, -40], [46, -40]),
    P(2.8, [-36, 42], [-36, 14], [-36, -40]), P(2.8, [36, 42], [36, 14], [36, -40]), P(2.4, [-36, 14], [-46, 10]), P(2.4, [36, 14], [44, 10]),
  ],
  hills: (x, z, h) => Math.max(0.3, 0.5 + (h - 0.35) * 0.12 + 1.2 * gauss(Math.hypot(x, z + 60), 14)),      // a city is flat
  decor: CITY_DECOR, towers: TOWERS, keepClear: clearOf(CITY_DECOR, [{ x: 0, z: -58, r: 12 }, { x: 0, z: -12, r: 8 }, { x: 0, z: 46, r: 12 }]),
  solids: [...solidsOf(CITY_DECOR), ...blocks(TOWERS.map(([x, z, w, d]) => [x, z, Math.max(w, d) * 0.62])), ...blocks([[0, -12, 4.2]])],
  scatter: [],
});

// ---------------------------------------------------------------- Map 12: the Dream Kingdom (Unit 12)
const STAR = [90, 162, 234, 306, 18].map((deg) => { const a = deg * Math.PI / 180; return [+(Math.cos(a) * 46).toFixed(1), +(-Math.sin(a) * 46).toFixed(1)]; });      // the five points of the star of roads; the first one is in the north
const [S0, S1, S2, S3, S4] = STAR;
const DREAM_DECOR = [
  D('for_gate_arch_v01', 0, 52, 0, 0), D('stall_sweets', 9, 46, 0, 1.8), D('stall_gifts', -8, 48, 0.2, 1.8), D('bld_castle_villa_f3', 0, -84, 0, 0, 1.5), D('for_portal_v01', 0, -50, 0, 0),
  D('ev_lantern_star_v01', -4, 40, 0, 0.3), D('ev_lantern_star_v01', 4, 24, 1, 0.3), D('ev_lantern_star_v01', -4, 8, 2, 0.3), D('ev_lantern_star_v01', 4, -8, 3, 0.3), D('ev_lantern_star_v01', -4, -30, 1.5, 0.3),
  D('ev_lantern_star_v01', S1[0] + 3, S1[1], 0, 0.3), D('ev_lantern_star_v01', S4[0] - 3, S4[1], 0, 0.3), D('ev_lantern_star_v01', S2[0] - 3, S2[1] + 2, 0, 0.3), D('ev_lantern_star_v01', S3[0] + 3, S3[1] + 2, 0, 0.3),
  D('ev_gift_box_v01', 20, 14, 0.4, 1.6, 4), D('ev_gift_box_v01', -22, 10, 1.2, 1.6, 4), D('ev_candy_bucket_v01', 14, -24, 0, 1.0, 3.5), D('ev_candy_bucket_v01', -16, -22, 1, 1.0, 3.5), D('ev_ghost_friendly_v01', -12, 44, 0.8, 0.5),
  D('nat_blossom_v01', 30, 50, 0, 0.6), D('nat_blossom_v01', -30, 50, 1, 0.6), D('nat_blossom_v01', 52, 10, 2, 0.6), D('nat_blossom_v01', -52, 10, 3, 0.6), D('nat_autumn_v01', 34, -42, 0.3, 0.6), D('nat_autumn_v01', -34, -42, 1.3, 0.6),
  D('yard_bench_v01', 6, 4, -1.2, 0.7), D('yard_bench_v01', -6, 4, 1.2, 0.7),
];
const seg = (a, b, w = 2.6) => P(w, a, [+((a[0] + b[0]) / 2).toFixed(1), +((a[1] + b[1]) / 2).toFixed(1)], b);
const dream = makeRegion({
  name: 'dream', title: 'Dream Kingdom', land: true, size: 200, playRadius: 82, seed: 20261205, trees: 0, rocks: 14, roughness: 0.2, ...DRY,
  palette: { a: 0xc6b6f0, b: 0xe0d2fa, far: 0xf4ecff, path: 0xfff0c2, dirt: 0xeedca8, sand: 0xfaf2ff, rock: 0xd8ccf4, rockL: 0xffffff }, flora: 'none', noFar: true, clouds: true, hour: 18.7,
  landmarks: [
    { id: 'gate', en: 'dream gate', vi: 'cổng mộng mơ', label: 'Dream Gate', x: 0, z: 52, spot: [0, 48] },
    { id: 'fountain', en: 'star fountain', vi: 'đài phun nước ngôi sao', label: 'Star Fountain', x: 0, z: 0, spot: [0, 7] },
    { id: 'bridge', en: 'moon bridge', vi: 'cầu trăng', label: 'Moon Bridge', x: S1[0], z: S1[1], spot: [S1[0] + 4, S1[1] + 1] },
    { id: 'toys', en: 'toy box', vi: 'hộp đồ chơi', label: 'Toy Box', x: 20, z: 14, spot: [16, 17] },
    { id: 'garden', en: 'pillow garden', vi: 'vườn gối bông', label: 'Pillow Garden', x: S4[0], z: S4[1], spot: [S4[0] - 4, S4[1] + 1] },
    { id: 'castle', en: 'star castle', vi: 'lâu đài ngôi sao', label: 'Star Castle', x: 0, z: -84, spot: [0, -47] },
    { id: 'door', en: 'silent door', vi: 'cánh cửa im lặng', label: 'Silent Door', x: 0, z: -50, spot: [0, -42] },
  ],
  entrance: { x: 0, z: 64 }, spawn: { x: 0, z: 56 }, exits: [{ x: 0, z: 64, r: 2.6, to: 'city', label: 'Cổng dịch chuyển' }],
  paths: () => [      // five roads that cross to draw a star, with the fountain in its heart
    P(3.2, [0, 67], [0, 50], [0, 40]), P(2.6, S2, [0, 40], S3), seg(S0, S2), seg(S2, S4), seg(S4, S1), seg(S1, S3), seg(S3, S0), P(2.6, S0, [0, -52]), P(2.4, [0, 40], [0, 7]),
  ],
  hills: (x, z, h) => {
    const d = Math.hypot(x, z);
    h = 0.6 + (h - 0.35) * 0.3 + 0.8 * Math.max(0, Math.sin(d * 0.14 + 1)) * smooth(52, 70, d) + 1.6 * gauss(Math.hypot(x, z + 62), 13);
    return Math.max(0.25, h);
  },
  decor: DREAM_DECOR, keepClear: clearOf(DREAM_DECOR, [{ x: 0, z: -60, r: 13 }, { x: 0, z: 0, r: 7 }, { x: 0, z: 46, r: 12 }]), solids: [...solidsOf(DREAM_DECOR), ...blocks([[0, 0, 2.6]])],
  scatter: [['ev_lantern_star_v01', 26, 1], ['ev_gift_box_v01', 16, 1.8], ['ev_candy_bucket_v01', 12, 1.8]],
});

export { fairy, volcano, crystal, city, dream };

/** What stands where in each land (people, board, boss, chests, word bubbles) and what the land is called. The road in: `from`. */
export const LAND = {
  desert: { no: 4, from: 'forest', vi: 'Sa mạc Cát Vàng', keeper: [-4, 36, 2.6], merchant: [6.5, 34.4, 0], shopAt: [6.5, 36.2], board: { x: -8, z: 44 }, boss: { x: 0, z: -60 }, arrive: [0, 56],
    chests: [[10, 46], [28, 26], [-40, -14], [38, -8], [-6, -26]], spots: [[2, 50], [-2, 34], [14, 26], [-8, 24], [2, 14], [20, 4], [-20, 4], [-2, -8], [2, -24], [-26, -22]], safe: [[0, 56, 9], [0, 30, 15]] },
  mountain: { no: 5, from: 'desert', vi: 'Núi Tuyết', keeper: [-5, 34, 2.4], merchant: [9, 26.4, 0], shopAt: [9, 29], board: { x: 12, z: 50 }, boss: { x: 6, z: -60 }, arrive: [0, 56],
    chests: [[-28, 42], [34, 36], [-18, 0], [42, -4], [-40, -26]], spots: [[0, 50], [6, 42], [10, 32], [14, 22], [8, 10], [0, -2], [-8, -12], [-12, -22], [-6, -32], [4, -40]], safe: [[0, 56, 9], [2, 30, 14]] },
  ruins: { no: 6, from: 'mountain', vi: 'Di tích Cổ', keeper: [-5, 36, 2.6], merchant: [10, 30.4, 0], shopAt: [10, 33], board: { x: 9, z: 44 }, boss: { x: 0, z: -58 }, arrive: [0, 56],
    chests: [[-34, 30], [34, 30], [-34, -30], [34, -30], [0, -24]], spots: [[0, 50], [0, 28], [-16, 16], [16, 16], [-34, 4], [34, 4], [-16, -8], [16, -8], [0, -18], [0, -34]], safe: [[0, 56, 9], [3, 34, 13]] },
  sky: { no: 7, from: 'ruins', vi: 'Vương quốc trên Trời', keeper: [-4, 42, 2.8], merchant: [10, 44.4, 0], shopAt: [10, 47], board: { x: -9, z: 54 }, boss: { x: 0, z: -58 }, arrive: [0, 56],
    chests: [[34, 40], [-34, 40], [40, 14], [-40, 10], [26, -30]], spots: [[0, 46], [0, 24], [16, 34], [-16, 34], [34, 6], [-34, 6], [22, -22], [-22, -22], [0, -30], [0, -44]], safe: [[0, 56, 9], [0, 44, 11]] },
  // (26/11, turn 63) maps 8-12
  fairy: { no: 8, from: 'sky', vi: 'Đảo Thần Tiên', keeper: [-5, 40, 2.6], merchant: [9, 30.4, 0], shopAt: [9, 33], board: { x: 10, z: 52 }, boss: { x: 0, z: -58 }, arrive: [0, 56],
    chests: [[-30, 42], [30, 42], [-46, -2], [41, 8], [0, -34]], spots: [[0, 50], [0, 34], [-12, 22], [12, 22], [0, 13], [-30, 4], [30, 4], [-22, -24], [22, -24], [0, -40]], safe: [[0, 56, 9], [0, 38, 13]] },
  volcano: { no: 9, from: 'fairy', vi: 'Thung lũng Núi Lửa', keeper: [-6, 42, 2.4], merchant: [10, 38.4, 0], shopAt: [10, 41], board: { x: 10, z: 54 }, boss: { x: 0, z: -58 }, arrive: [0, 56],
    chests: [[34, 50], [-36, 50], [18, 20], [-39, -15], [44, -4]], spots: [[0, 50], [0, 40], [-5, 30], [0, 19], [-2, 5], [-1, -9], [5, -23], [0, -34], [-26, -10], [28, -4]], safe: [[0, 56, 9], [2, 44, 12]] },
  crystal: { no: 10, from: 'volcano', vi: 'Hang Tinh Thể', keeper: [-5, 40, 2.6], merchant: [10, 38.4, 0], shopAt: [10, 41], board: { x: 9, z: 54 }, boss: { x: 0, z: -58 }, arrive: [0, 56],
    chests: [[-32, 50], [32, 50], [40, 30], [-40, 32], [40, -18]], spots: [[0, 50], [0, 34], [0, 21], [15, 4], [-15, 4], [0, -11], [34, 4], [-34, 4], [0, -26], [0, -38]], safe: [[0, 56, 9], [2, 42, 12]] },
  city: { no: 11, from: 'crystal', vi: 'Thành phố Tương Lai', keeper: [-5, 44, 2.6], merchant: [9, 46.4, 0], shopAt: [9, 49], board: { x: -10, z: 56 }, boss: { x: 0, z: -58 }, arrive: [0, 56],
    chests: [[-46, 42], [46, 42], [-46, 10], [44, 10], [36, -40]], spots: [[0, 50], [0, 34], [0, 24], [-24, 14], [24, 14], [0, 1], [-36, -12], [36, -12], [0, -30], [0, -44]], safe: [[0, 56, 9], [0, 46, 12]] },
  dream: { no: 12, from: 'city', vi: 'Vương quốc Mộng Mơ', keeper: [-5, 44, 2.6], merchant: [9, 46.4, 0], shopAt: [9, 49], board: { x: -10, z: 56 }, boss: { x: 0, z: -60 }, arrive: [0, 56],
    chests: [[S2[0], S2[1] + 4], [S3[0], S3[1] + 4], [S1[0] + 4, S1[1] + 1], [S4[0] - 4, S4[1] + 1], [0, -38]], spots: [[0, 48], [0, 30], [0, 16], [0, 7], [-14, 18], [14, 18], [-22, -7], [22, -7], [-9, -18], [9, -18]], safe: [[0, 56, 9], [0, 46, 12]] },
};
export const LAND_IDS = Object.keys(LAND);
export const isLand = (name) => !!LAND[name];

// (26/11, turn 63) A game master in every land of maps 4-12, by the gate: somewhere to spend the gold of that land. For now each one runs
// a game the arcade already has (`game`; `variant` = the race circuit) under the land's own name; games made for a land replace them one by one
// (docs/THIET_KE_12_MAP.md lists what is planned).
export const LAND_GAMES = [
  { id: 'g_desert', game: 'race2', variant: 'desert', region: 'desert', x: 16, z: 52, text: 'E · Đua xe cồn cát với chú Kamal', sign: '🏎 Dune Rally', board: true, host: { name: 'Kamal', file: 'npc_sam_fisherman_v02', tint: [1.15, 1.0, 0.8], hello: 'The dunes are fast today!' } },
  { id: 'g_mountain', game: 'sling', region: 'mountain', x: -20, z: 52, text: 'E · Ném bóng tuyết với cô Ingrid', sign: '🎯 Snowball Shot', board: true, host: { name: 'Ingrid', file: 'npc_forest_herbalist', tint: [0.9, 1.0, 1.2], hello: 'Aim at the snowmen!' } },
  { id: 'g_ruins', game: 'blocks', region: 'ruins', x: 20, z: 52, text: 'E · Xếp đá cổ với bác Tobias', sign: '🧱 Rune Blocks', board: true, host: { name: 'Tobias', file: 'npc_forge_blacksmith_v01', tint: [0.95, 0.95, 0.85], hello: 'Every stone has its place.' } },
  { id: 'g_sky', game: 'candy', region: 'sky', x: -20, z: 52, text: 'E · Xếp kẹo mây với cô Skye', sign: '🍬 Cloud Candy', board: true, host: { name: 'Skye', file: 'npc_ben_merchant_v02', tint: [0.9, 1.05, 1.25], hello: 'Sweet clouds, three in a row!' } },
  { id: 'g_fairy', game: 'fireflies', region: 'fairy', x: 20, z: 52, text: 'E · Lối đom đóm với tiên Twinkle', sign: '✨ Firefly Path', board: true, host: { name: 'Twinkle', file: 'npc_ben_merchant_v02', tint: [1.25, 0.9, 1.15], hello: 'Follow the fireflies and join the letters!' } },
  { id: 'g_volcano', game: 'sling', region: 'volcano', x: -20, z: 52, text: 'E · Bắn đá lửa với chú Ash', sign: '🎯 Lava Shot', board: true, host: { name: 'Ash', file: 'npc_forge_blacksmith_v01', tint: [1.2, 0.85, 0.75], hello: 'Hit the targets before they melt!' } },
  { id: 'g_crystal', game: 'vault', region: 'crystal', x: -16, z: 52, text: 'E · Hầm khóa tinh thể với cô Jade', sign: '🔐 Crystal Vault', board: true, host: { name: 'Jade', file: 'npc_forest_herbalist', tint: [0.85, 1.15, 1.1], hello: 'Find the right word and the lock opens.' } },
  { id: 'g_city', game: 'race2', variant: 'city', region: 'city', x: 20, z: 52, text: 'E · Đua xe đèn neon với anh Turbo', sign: '🏎 Neon Grand Prix', board: true, host: { name: 'Turbo', file: 'npc_sam_fisherman_v02', tint: [0.8, 1.0, 1.3], hello: 'Three, two, one… go!' } },
  { id: 'g_city2', game: 'workshop', region: 'city', x: -20, z: 52, text: 'E · Hồ sơ xưởng robot với cô Pixel', sign: '🔎 Robot Workshop', board: true, host: { name: 'Pixel', file: 'npc_ben_merchant_v02', tint: [0.85, 1.1, 1.2], hello: 'Read the clues and find the broken robot!' } },
  { id: 'g_dream', game: 'candy', region: 'dream', x: 20, z: 52, text: 'E · Xếp kẹo mộng mơ với bé Sandy', sign: '🍬 Dream Candy', board: true, host: { name: 'Sandy', file: 'npc_ben_merchant_v02', tint: [1.2, 1.0, 1.25], hello: 'Sweet dreams are made of candy!' } },
  { id: 'g_dream2', game: 'race2', variant: 'dream', region: 'dream', x: -20, z: 52, text: 'E · Đua xe ngôi sao với anh Comet', sign: '🏎 Star Race', board: true, host: { name: 'Comet', file: 'npc_sam_fisherman_v02', tint: [1.1, 1.0, 1.3], hello: 'Race me across the stars!' } },
];
