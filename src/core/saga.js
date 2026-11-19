// The backbone story (19/11, docs/COT_TRUYEN.md, approved by the parent): the child is an apprentice Word Keeper. Lord Hush
// broke the Language Compass into ten pieces and hid them in ten lands; each land's last boss guards one piece. Pure rules,
// no DOM: the ten lands, the Word Keeper ranks (with a small bonus each), the pieces found, and how much colour each region
// has got back (the Dark Wind drained it; story quests return it).

/** The ten lands. map: the map number; piece: the flag of the boss that guards that land's compass piece (null: not built yet). */
export const LANDS = [
  { map: 1, en: 'Starter Village', vi: 'Làng Khởi Đầu, Đồng Hoang, Rừng Ký Ức', piece: 'boss2', guard: 'Ancient Golem' },
  { map: 2, en: 'Sunny Harbor', vi: 'Cảng Mặt Trời và Đảo Kho Báu', piece: 'boss4', guard: 'Captain Octopus' },
  { map: 3, en: 'Golden Wind Desert', vi: 'Sa mạc Gió Vàng', piece: null },
  { map: 4, en: 'Harvest Fair', vi: 'Hội chợ Mùa Gặt (ôn tập)', piece: null },
  { map: 5, en: 'Echo Mountains', vi: 'Núi Vọng Âm', piece: null },
  { map: 6, en: 'Coral Kingdom', vi: 'Vương quốc San Hô', piece: null },
  { map: 7, en: 'Lantern Bridge', vi: 'Cầu Đèn Lồng (ôn tập)', piece: null },
  { map: 8, en: 'Academy of Knowledge', vi: 'Học viện Tri Thức', piece: null },
  { map: 9, en: 'Future City', vi: 'Thành phố Tương Lai', piece: null },
  { map: 10, en: 'Sky Island', vi: 'Đảo Trời và Tháp Pha Lê', piece: null },
];
/** Word Keeper ranks: rank 1 comes with Tom's badge, then one more for each map exam passed. */
export const RANKS = [
  { en: 'Traveller', vi: 'Lữ khách', icon: '🎒' },
  { en: 'Apprentice', vi: 'Tập sự', icon: '🥉' },
  { en: 'Explorer', vi: 'Thám hiểm', icon: '🥈' },
  { en: 'Ranger', vi: 'Kiểm lâm', icon: '🥇' },
  { en: 'Pathfinder', vi: 'Dẫn đường', icon: '🧭' },
  { en: 'Guardian', vi: 'Hộ vệ', icon: '🛡️' },
  { en: 'Knight', vi: 'Hiệp sĩ', icon: '⚔️' },
  { en: 'Sage', vi: 'Hiền giả', icon: '📘' },
  { en: 'Champion', vi: 'Nhà vô địch', icon: '🏆' },
  { en: 'Grand Keeper', vi: 'Đại hộ chữ', icon: '👑' },
  { en: 'Word Master', vi: 'Đại sư Ngôn Từ', icon: '🌟' },
];
const f = (p) => (p && p.flags) || {};
/** 0 before Tom's badge, 1 Apprentice, 2 Explorer after the Map 1 exam (map2 flag), 3 Ranger after the Map 2 exam (gate 30). */
export function rankOf(p) {
  if (!f(p).badge1) return 0;
  let r = 1; if (f(p).map2) r = 2; if (p.gates && p.gates[30]) r = 3; return r;
}
export const rankName = (p) => RANKS[rankOf(p)];
/** A higher rank is stronger: +4 attack and +30 health for every rank above Apprentice. */
export const rankAtk = (p) => Math.max(0, rankOf(p) - 1) * 4;
export const rankHp = (p) => Math.max(0, rankOf(p) - 1) * 30;
/** Compass pieces found: the numbers of the lands whose guard is beaten. */
export const pieces = (p) => LANDS.filter((l) => l.piece && f(p)[l.piece]).map((l) => l.map);
/** The next thing the story wants, in one Vietnamese line (the Journey card). */
export function nextGoal(p) {
  const fl = f(p);
  if (!fl.badge1) return 'Giúp dân Làng Khởi Đầu (thư của Tom, hũ chữ của Ben, sửa cầu) để nhận huy hiệu Người Giữ Chữ.';
  if (!fl.boss2) return 'Tìm mảnh La Bàn số 1: Golem Cổ ở cánh đồng đá phía Đông Nam đang giữ nó (cần cấp 18).';
  if (!fl.map2) return 'Lên cấp 20 và vượt bài thi của Cú Mèo để lên hạng Thám hiểm, rồi đi thuyền sang Cảng Mặt Trời.';
  if (!fl.boss4) return 'Tìm mảnh La Bàn số 2: Thuyền trưởng Bạch Tuộc ở mũi hải đăng đang giữ nó (cần cấp 28).';
  if (!(p.gates && p.gates[30])) return 'Lên cấp 30 và vượt bài thi lớn của Cú Mèo để lên hạng Kiểm lâm.';
  return 'Sa mạc Gió Vàng (Map 3) đang được xây. Mảnh la bàn số 3 đang chờ!';
}

// ------------------------------------------------------------------ colour
const VILLAGE_ORDER = ['arrive', 'letter_find', 'letter_return', 'jars', 'jars_play', 'tom_bridge', 'bridge', 'gather', 'plan', 'open', 'done'];
const vStep = (p) => VILLAGE_ORDER.indexOf((p.quests && p.quests.village && p.quests.village.step) || 'arrive');
/** How much colour a region has (0..1 saturation; 1 = full colour). The Dark Wind drained every land; each story quest
 *  brings part of it back. Saves that are already past a quest have that colour at once. */
export function colourOf(p, region) {
  if (!p || p.admin) return 1;
  const fl = f(p);
  if (region === 'village') {
    const s = vStep(p);
    if (fl.bridge_fixed || s >= VILLAGE_ORDER.indexOf('open')) return 1;
    if (s >= VILLAGE_ORDER.indexOf('tom_bridge')) return 0.8;       // Ben's jars done
    if (s >= VILLAGE_ORDER.indexOf('jars')) return 0.65;            // the letter read and returned
    return 0.45;
  }
  if (region === 'forest') {
    if (fl.boss3) return 1;
    return p.quests && p.quests.forest && p.quests.forest.step === 'done' ? 0.8 : 0.5;
  }
  if (region === 'harbor') {
    if (fl.boss4) return 1;
    const shops = ['style', 'cafe', 'salon'].every((k) => p.mini && p.mini.best && p.mini.best[k] !== undefined);
    return 0.55 + (shops ? 0.15 : 0) + (p.hunt3 && p.hunt3.done >= 2 ? 0.15 : 0);
  }
  return 1;
}
