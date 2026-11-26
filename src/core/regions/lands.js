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
};
export const LAND_IDS = Object.keys(LAND);
export const isLand = (name) => !!LAND[name];
