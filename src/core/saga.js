// The backbone story (19/11, docs/COT_TRUYEN.md, approved by the parent): the child is an apprentice Word Keeper. Lord Hush
// broke the Language Compass into ten pieces and hid them in ten lands; each land's last boss guards one piece. Pure rules,
// no DOM: the ten lands, the Word Keeper ranks (with a small bonus each),, the pieces found. (The drained-colour idea was
// dropped on 20/11: the parent wants the full colours from the start.)

/** The ten lands. map: the map number; piece: the flag of the boss that guards that land's compass piece (null: not built yet). */
export const LANDS = [
  { map: 1, en: 'Starter Village', vi: 'Làng Khởi Đầu và Đồng Hoang', piece: 'boss1', guard: 'Slime King' },
  { map: 2, en: 'Sunny Harbor', vi: 'Biển cả: Cảng Mặt Trời và Đảo Kho Báu', piece: 'boss4', guard: 'Captain Octopus' },
  { map: 3, en: 'Forest of Memories', vi: 'Rừng xanh: Rừng Ký Ức', piece: 'boss2', guard: 'Ancient Golem' },
  { map: 4, en: 'Golden Desert', vi: 'Sa mạc cát vàng', piece: null },
  { map: 5, en: 'Mountains', vi: 'Núi non', piece: null },
  { map: 6, en: 'Sky Kingdom', vi: 'Vương quốc trên trời', piece: null },
  { map: 7, en: 'Ancient Ruins', vi: 'Khu di tích cổ', piece: null },
  { map: 8, en: 'Fairy Isle', vi: 'Đảo thần tiên', piece: null },
  { map: 9, en: 'Volcano Valley', vi: 'Thung lũng núi lửa', piece: null },
  { map: 10, en: 'Crystal Cave', vi: 'Hang tinh thể', piece: null },
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
/** 0 before Tom's badge, 1 Apprentice, 2 Explorer when the sea opens (map2 flag), 3 Ranger after the level-10 exam, 4 Pathfinder after the level-20 exam (24/11). */
export function rankOf(p) {
  if (!f(p).badge1) return 0;
  let r = 1; if (f(p).map2) r = 2; if (p.gates && p.gates[10]) r = 3; if (p.gates && p.gates[20]) r = 4; return r;
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
  if (!fl.boss1) return 'Lên cấp 4–5 ở các bãi quái của làng và đánh bại Vua Slime ở phía Bắc Đồng Hoang.';
  if (!fl.map2) return 'Lên cấp 5 (cấp cao nhất của làng) và vượt cổng ôn tập của Cú Mèo để lên hạng Thám hiểm, rồi đi thuyền sang Biển cả.';
  if (!fl.boss4) return 'Lên cấp 9–10 ở Biển cả (cấp 5–10) và đánh bại Thuyền trưởng Bạch Tuộc ở mũi hải đăng để lấy mảnh La Bàn.';
  if (!(p.gates && p.gates[10])) return 'Lên cấp 10 và vượt bài thi của Cú Mèo để lên hạng Kiểm lâm, mở Rừng Ký Ức.';
  if (!fl.boss2) return 'Lên cấp 19–20 trong Rừng Ký Ức (cấp 10–20) và đánh bại Golem Cổ ở khoảng trống phía Đông Bắc.';
  if (!(p.gates && p.gates[20])) return 'Lên cấp 20 và vượt bài thi của Cú Mèo để lên hạng Dẫn đường.';
  return 'Sa mạc cát vàng (Map 4) đang được xây. Mảnh la bàn tiếp theo đang chờ!';
}
