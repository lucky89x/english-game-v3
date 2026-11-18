// Quest journal (18/11: "daily quests, and main story quests to level up and unlock new maps"). Pure rules, no DOM.
// Main quests follow the story in order; each one is checked against the save, so quests already done in older saves
// count at once, and the reward is claimed in the journal. Daily quests: three picked for each day from a pool, with
// counters fed by game events (track); each pays when claimed, all three pay a bonus.

const VILLAGE_ORDER = ['arrive', 'letter_find', 'letter_return', 'jars', 'jars_play', 'tom_bridge', 'bridge', 'gather', 'plan', 'open', 'done'];
const past = (p, step) => VILLAGE_ORDER.indexOf((p.quests && p.quests.village && p.quests.village.step) || 'arrive') > VILLAGE_ORDER.indexOf(step);
const gate = (p, n) => !!(p.gates && p.gates[n]);

/** id, English title, Vietnamese "what to do / where", check, reward, what it unlocks. */
export const MAIN = [
  { id: 'letter', en: "Tom's lost letter", vi: 'Tìm bức thư của Tom gần nhà trưởng làng, đọc rồi mang về cho Tom.', done: (p) => past(p, 'letter_return'), gold: 20, exp: 40 },
  { id: 'jars', en: "Ben's word jars", vi: 'Giúp Ben ở chợ đưa đúng hũ chữ cho khách.', done: (p) => past(p, 'jars_play'), gold: 25, exp: 60 },
  { id: 'bridge', en: 'Fix the South Bridge', vi: 'Gặp Sam ở cầu phía Nam, tìm dây thừng, khúc gỗ, rìu rồi sửa cầu.', done: (p) => !!p.flags.bridge_fixed, gold: 40, exp: 90 },
  { id: 'gate', en: 'The forest gate opens', vi: 'Báo tin cho Tom ở quảng trường để mở cổng Rừng Ký Ức.', done: (p) => !!p.flags.forest_open, gold: 20, exp: 50 },
  { id: 'crystals', en: 'Echoes of the Forest', vi: 'Vào Rừng Ký Ức, theo lời Pip tìm 5 viên pha lê và đặt vào cây cổ thụ.', done: (p) => !!(p.quests && p.quests.forest && p.quests.forest.step === 'done'), gold: 60, exp: 150 },
  { id: 'owl5', en: "The Owl's first review", vi: 'Lên cấp 5 rồi gặp Cú Mèo cạnh chợ để ôn tập.', done: (p) => gate(p, 5), gold: 30, exp: 0 },
  { id: 'boss1', en: 'The Slime King', vi: 'Đạt cấp 8, vào Đồng Hoang (bên kia cầu làng) đánh bại Vua Slime.', done: (p) => !!p.flags.boss1, gold: 80, exp: 0 },
  { id: 'owl10', en: "The Owl's second review", vi: 'Lên cấp 10 rồi ôn tập với Cú Mèo (có câu ngữ pháp).', done: (p) => gate(p, 10), gold: 40, exp: 0 },
  { id: 'owl15', en: 'Halfway hero', vi: 'Lên cấp 15 và qua cổng ôn tập của Cú Mèo.', done: (p) => gate(p, 15), gold: 50, exp: 0 },
  { id: 'boss2', en: 'The Ancient Golem', vi: 'Đạt cấp 18, tới cánh đồng đá phía Đông Nam đánh bại Golem Cổ.', done: (p) => !!p.flags.boss2, gold: 120, exp: 0 },
  { id: 'map2', en: 'Open Map 2', vi: 'Lên cấp 20, làm bài kiểm tra 10 câu của Cú Mèo (đúng 8/10, đề mỗi lần khác): Map 2 (Rừng Ký Ức, từ Unit 2) mở ra.', done: (p) => !!p.flags.map2, gold: 150, exp: 0, unlock: 'Map 2' },
  { id: 'hunt2', en: 'Forest hunter', vi: 'Hoàn thành 2 việc ở bảng săn quái trong rừng.', done: (p) => !!(p.hunt2 && p.hunt2.done >= 2), gold: 120, exp: 300 },
  { id: 'owl25', en: 'Forest scholar', vi: 'Lên cấp 25 và qua cổng ôn tập của Cú Mèo (từ Unit 2).', done: (p) => gate(p, 25), gold: 120, exp: 0 },
  { id: 'boss3', en: 'The Mushroom Queen', vi: 'Đạt cấp 30, tìm bãi trống phía Tây tàn tích và đánh bại Nữ hoàng Nấm.', done: (p) => !!p.flags.boss3, gold: 300, exp: 0, unlock: 'Map 3 (đang xây)' },
];
export const mainState = (p) => p.mainClaimed || (p.mainClaimed = {});
/** The first main quest not yet finished (null when all are done). */
export const mainCurrent = (p) => MAIN.find((q) => !q.done(p)) || null;
/** Main quests that are finished but not claimed yet. */
export const mainToClaim = (p) => MAIN.filter((q) => q.done(p) && !mainState(p)[q.id]);
export function claimMain(p, id) { const q = MAIN.find((x) => x.id === id); if (!q || !q.done(p) || mainState(p)[id]) return null; mainState(p)[id] = true; return { gold: q.gold, exp: q.exp }; }

/** Daily pool: event name, how many, text. */
export const DAILY = [
  { id: 'kill', ev: 'kill', need: 5, en: 'Defeat 5 monsters', vi: 'Hạ 5 con quái (Đồng Hoang hoặc trong rừng).' },
  { id: 'bubble', ev: 'bubble', need: 3, en: 'Learn 3 words from word bubbles', vi: 'Chạm 3 bong bóng chữ "Abc" dọc đường.' },
  { id: 'chest', ev: 'chest', need: 2, en: 'Open 2 word chests', vi: 'Mở 2 rương khóa chữ.' },
  { id: 'mini', ev: 'mini', need: 2, en: 'Play 2 mini games', vi: 'Chơi 2 trò chơi với các chủ trò trong làng.' },
  { id: 'right', ev: 'right', need: 5, en: 'Answer 5 English questions right', vi: 'Trả lời đúng 5 câu tiếng Anh (Cú Mèo, khiên boss, hũ chữ, rương…).' },
  { id: 'star', ev: 'star', need: 1, en: 'Find a hidden star', vi: 'Tìm một ngôi sao vàng còn giấu trong làng.' },
  { id: 'song', ev: 'song', need: 1, en: 'Sing a song with Anna', vi: 'Vào nhà Anna, nghe trọn một bài hát.' },
  { id: 'shop', ev: 'shopquest', need: 1, en: "Do a shopkeeper's word quest", vi: 'Vào cửa hàng, bấm 📜 Word quest của Bram hoặc Rose.' },
];
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
/** Today's three quests for this profile (same three all day); stars drop out once all twelve are found. */
export function dailyOf(p, day) {
  if (p.daily && p.daily.day === day) return p.daily;
  const pool = DAILY.filter((q) => q.id !== 'star' || !(p.mini && p.mini.stars && p.mini.stars.length >= 12));
  const ids = [...pool].sort((a, b) => hash(a.id + day + p.id) - hash(b.id + day + p.id)).slice(0, 3).map((q) => q.id);
  return (p.daily = { day, ids, prog: {}, claimed: {}, bonus: false });
}
/** Counts an event for today's quests; returns the quests it just finished. */
export function track(p, day, ev, n = 1) {
  const d = dailyOf(p, day), out = [];
  for (const id of d.ids) { const q = DAILY.find((x) => x.id === id); if (q.ev !== ev) continue; const was = d.prog[id] || 0; if (was >= q.need) continue; d.prog[id] = Math.min(q.need, was + n); if (d.prog[id] >= q.need) out.push(q); }
  return out;
}
export const dailyReward = (p) => ({ gold: 20 + p.stats.level * 2, exp: 30 + p.stats.level * 8 });
export function claimDaily(p, day, id) {
  const d = dailyOf(p, day), q = DAILY.find((x) => x.id === id);
  if (!q || !d.ids.includes(id) || d.claimed[id] || (d.prog[id] || 0) < q.need) return null;
  d.claimed[id] = true; const r = dailyReward(p);
  if (!d.bonus && d.ids.every((x) => d.claimed[x])) { d.bonus = true; r.gold += 30; r.bonusAll = true; }
  return r;
}
export const dailyDone = (p, day) => { const d = dailyOf(p, day); return d.ids.filter((id) => (d.prog[id] || 0) >= DAILY.find((q) => q.id === id).need).length; };
