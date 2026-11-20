// The child's house upgrades (20/11: "start with one floor, later the child buys two or three floors, a villa, a bigger garden").
// Pure rules (no three.js): what can be bought, in what order, and which room each piece of furniture stands in.
export const house = (profile) => profile.house || (profile.house = { floors: 1, villa: false, garden: 0 });
/** The upgrade list shown inside the house, with the English name children read and the Vietnamese meaning. */
export const UPGRADES = [
  { id: 'garden1', en: 'Bigger Garden', vi: 'Vườn vừa: thêm luống rau, bồn hoa, một cây ăn quả', cost: 250, level: 4, needs: (h) => h.garden === 0 },
  { id: 'floor2', en: 'Second Floor', vi: 'Tầng 2: phòng ngủ chuyển lên tầng trên, có cầu thang', cost: 400, level: 5, needs: (h) => h.floors === 1 },
  { id: 'garden2', en: 'Big Garden', vi: 'Vườn rộng: nhiều luống rau, bồn hoa, ao nhỏ, cổng hoa', cost: 600, level: 10, needs: (h) => h.garden === 1 },
  { id: 'floor3', en: 'Third Floor', vi: 'Tầng 3: phòng nhạc ở tầng áp mái', cost: 700, level: 10, needs: (h) => h.floors === 2 },
  { id: 'villa', en: 'Villa Style', vi: 'Biệt thự: cột đá, sàn đá hoa, đèn chùm, nhà ngoài sang trọng', cost: 1500, level: 20, needs: (h) => h.floors >= 2 && !h.villa },
];
export const upgradeState = (profile, id) => {
  const u = UPGRADES.find((x) => x.id === id), h = house(profile); if (!u) return { ok: false, why: 'none' };
  if (isDone(h, id)) return { ok: false, why: 'have' };
  if (!u.needs(h)) return { ok: false, why: 'need' };
  if (profile.stats.level < u.level) return { ok: false, why: 'level' };
  if (profile.stats.gold < u.cost) return { ok: false, why: 'gold' };
  return { ok: true, why: '' };
};
const isDone = (h, id) => (id === 'garden1' ? h.garden >= 1 : id === 'garden2' ? h.garden >= 2 : id === 'floor2' ? h.floors >= 2 : id === 'floor3' ? h.floors >= 3 : h.villa);
export function buyUpgrade(profile, id) {
  const s = upgradeState(profile, id); if (!s.ok) return s;
  const u = UPGRADES.find((x) => x.id === id), h = house(profile); profile.stats.gold -= u.cost;
  if (id === 'garden1') h.garden = 1; else if (id === 'garden2') h.garden = 2; else if (id === 'floor2') h.floors = 2; else if (id === 'floor3') h.floors = 3; else h.villa = true;
  return { ok: true, why: '' };
}
/** Furniture groups: each room of the house gets one group (the item ids keep their place inside the room). */
export const GROUPS = {
  living: ['sofa', 'lamp', 'plant', 'picture', 'clock', 'rug'],
  study: ['table', 'bookcase', 'desk'],
  bedroom: ['bed', 'wardrobe', 'mirror'],
  music: ['guitar', 'piano', 'drum', 'violin'],
};
/** Each floor has four rooms in a 2 x 2 block: back-left, back-right, front-left, front-right. A room name or '' for an empty room.
 *  With one floor everything is on the ground floor; the second floor takes the bedroom, the third the music room. */
export function floorPlan(h) {
  if (h.floors >= 3) return [['living', 'study', '', ''], ['bedroom', '', '', ''], ['music', '', '', '']];
  if (h.floors === 2) return [['living', 'study', '', 'music'], ['bedroom', '', '', '']];
  return [['living', 'study', 'bedroom', 'music']];
}
/** The garden: how many vegetable beds and flower beds, trees, and whether the pond and the flower gate are there. */
export const gardenOf = (h) => ({ veg: 2 + h.garden, flowers: 2 + h.garden, trees: h.garden, pond: h.garden >= 2, arch: h.garden >= 2 });
