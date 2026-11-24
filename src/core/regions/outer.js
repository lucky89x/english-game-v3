// (24/11) The outer ring of the harbour and the forest maps (grown to play radius 92): cottages for the new houses, planted round the edge.
// Pure data (no three.js): each cottage is also a solid of its region (lateSolids), so nothing walks through it or grows in it.
// The spots were found by a probe over the real terrain: land above the water line, gentle slope, away from paths, trees and landmarks.
const FILES = ['bld_anna_house', 'bld_lily_house', 'bld_cottage_red_v02', 'bld_house_blue_v02'];
const spot = (list) => list.map(([x, z], i) => ({ file: FILES[i % FILES.length], x, z, yaw: Math.atan2(-x, -z) + (i % 3 - 1) * 0.18, r: 3.2, scale: 1.3 }));
export const OUTER = {
  harbor: spot([[10, 80.5], [8, -55.5], [-15, -63], [-35.5, -43.5], [-61, -38.5], [-58, -2], [-79.5, 9], [-55.5, 29.5], [-59, 54], [-35, 71]]),
  forest: spot([[10.5, 82.5], [-67.5, -50], [-80.5, -30.5], [-56, -5], [-79, 34.5], [-63, 57], [-44, 70.5], [-28, 80.5]]),
};
export const outerSolids = (name) => (OUTER[name] || []).map((b) => ({ x: b.x, z: b.z, r: b.r }));
