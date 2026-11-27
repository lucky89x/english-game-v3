// (27/11, turn 67) Other young explorers on the roads: "a few copies of other players (played by the computer) so the child feels
// the game has many players; now and then they meet, exchange a few words, tell something". Three of them travel through the
// same lands as the hero: they walk between the places of a land, stop, wave, and when spoken to (E) tell a little thing in
// English: where they are going, what they found, a small story, or they ask the hero a question. Pure data and rules here
// (tested in node); the walking is in game/crowd.js. They are part of the story world (other Word Keepers in training), and their
// name tags look like other players' tags.
import { opened } from './world.js';
import { mobGold } from './progress.js';
export const BOTS = [
  { id: 'minh', name: 'Minh', file: 'npc_desert_guide_v01', mul: [0.85, 1.05, 1.25], scale: 0.86, up: 1 },
  { id: 'sora', name: 'Sora', file: 'npc_mia_tailor_v01', tint: { hair: '#3a2a50', top: '#7ad8c0', bottom: '#f4f0e0' }, scale: 0.84, up: 0 },
  { id: 'bella', name: 'Bella', file: 'npc_mia_tailor_v01', tint: { hair: '#e0a030', top: '#f07aa8', bottom: '#6a5ad0' }, scale: 0.88, up: 2 },
];
/** The level on an explorer's name tag in a land whose levels run lo…hi: near the hero's, never above the land's top. */
export const botLevel = (bot, lo, hi) => Math.max(1, Math.min(hi, lo + bot.up));
/** What they call out when the hero walks by. */
export const HELLOS = ['Hi there!', 'Hello!', 'Nice to see you!', 'Good luck out there!', 'See you around!', 'Hey! Are you new here?', 'What a day!', 'Watch out for the monsters!'];
/** Little things they tell: [English, Vietnamese help]. Simple sentences a child of grade 6 can read; past, present and future on purpose. */
export const TALES = [
  ['Yesterday I fell into a river. I was wet all day!', 'Hôm qua bạn ấy ngã xuống sông, ướt cả ngày.'],
  ['I am saving my gold for a new sword.', 'Bạn ấy đang để dành vàng mua kiếm mới.'],
  ['My pet follows me everywhere. Do you have a pet?', 'Thú cưng đi theo bạn ấy khắp nơi.'],
  ['I learned twelve new words today. The owl was happy!', 'Hôm nay bạn ấy học được 12 từ mới.'],
  ['I lost a fight this morning, so I ate some bread and tried again.', 'Sáng nay bạn ấy thua một trận, ăn bánh rồi thử lại.'],
  ['My house has two floors now. I put a fish tank in the living room.', 'Nhà bạn ấy đã có hai tầng, có bể cá trong phòng khách.'],
  ['When I am strong enough, I will go to the next land.', 'Khi đủ mạnh, bạn ấy sẽ sang vùng tiếp theo.'],
  ['A friend visited my home yesterday. She asked me to move the lamp!', 'Hôm qua có bạn tới thăm nhà và nhờ dời cái đèn.'],
  ['I always read the word bubbles. They give a little EXP.', 'Bạn ấy luôn đọc bong bóng chữ để có thêm EXP.'],
  ['Kit told me he would find the pieces first. He is funny.', 'Kit bảo sẽ tìm được các mảnh La Bàn trước. Cậu ấy vui tính lắm.'],
  ['Mai showed me a page of her diary. It was about a boy called Hugh.', 'Mai cho bạn ấy xem một trang nhật ký kể về cậu bé Hugh.'],
  ['I sleep in my own bed every day. Then the monsters give more EXP.', 'Ngày nào bạn ấy cũng ngủ ở nhà để quái cho thêm EXP.'],
];
const low = (s) => String(s).replace(/[^A-Za-z0-9'’\- ]/g, '').replace(/\s+/g, ' ').trim().replace(/^The /, 'the ');      // a label may carry a sign ("Wild Meadow ⚔"): words only
/**
 * What an explorer says when the hero talks to them. places: the land's landmarks [{ label, vi }]; top: the level of the land's
 * strongest hunting ground; n: a counter (each call tells the next thing). Returns { en, vi }.
 */
export function tale(bot, { places = [], top = 0, n = 0 } = {}) {
  const k = n % 4, pl = places.length ? places[(n * 3 + bot.id.length) % places.length] : null;
  if (k === 0 && pl) return { en: `I am going to the ${low(pl.label)}. Do you want to come?`, vi: `${bot.name} đang đi tới ${pl.vi || pl.label}.` };
  if (k === 1 && pl) return { en: `I found a chest near the ${low(pl.label)} last week. Have a look!`, vi: `${bot.name} từng thấy một cái rương gần ${pl.vi || pl.label}.` };
  if (k === 2 && top) return { en: `Be careful! The strongest monsters here are level ${top}.`, vi: `Quái mạnh nhất vùng này ở cấp ${top}.` };
  const t = TALES[(n * 5 + bot.id.charCodeAt(0)) % TALES.length]; return { en: t[0], vi: t[1] };
}

// ---------------------------------------------------------------- (27/11, turn 68) small favours
// "the computer's explorers can give the hero side jobs too (fewer than Kit and Mai)": twelve favours in all, ONE for each land,
// taken in turn by the three explorers (four each). They are about the things Kit and Mai do not ask for: word bubbles, chests,
// mini games and right answers. A favour pays gold only (the caller adds a little learning EXP); nothing lasts forever, so a
// child who skips them loses nothing. Counted from the moment the favour is taken (p.tally, filled by main.js track()).
const MAPS = ['village', 'harbor', 'forest', 'desert', 'mountain', 'ruins', 'sky', 'fairy', 'volcano', 'crystal', 'city', 'dream'];
export const TALLIES = ['bubble', 'chest', 'mini', 'right'];
/** Adds an event to the profile's running totals (only the kinds the favours count). */
export function count(p, ev, n = 1) { if (!TALLIES.includes(ev)) return; const t = p.tally || (p.tally = {}); t[ev] = (t[ev] || 0) + n; }
const TASK_VI = { bubble: (n) => `Đọc ${n} bong bóng chữ.`, chest: (n) => `Mở ${n} rương khoá chữ.`, mini: (n) => `Chơi xong ${n} ván mini game.`, right: (n) => `Trả lời đúng ${n} câu hỏi tiếng Anh (câu nào cũng tính).` };
const F = [      // [who, kind, how many, what they say, thanks]
  ['minh', 'bubble', 5, 'I am making a word list, but I am slow. Can you read five word bubbles for me?', 'Five new lines for my list. Thanks a lot!'],
  ['sora', 'chest', 3, 'I cannot open the word chests here. Can you open three and tell me how?', 'So you spell the word! Now I understand. Thank you!'],
  ['bella', 'mini', 2, 'Are the games in this land fun? Please play two and tell me!', 'They sound great. I will play them tonight!'],
  ['minh', 'right', 20, 'The sand hides the questions. Answer twenty questions right and show me it can be done!', 'Twenty! You are much better than me.'],
  ['sora', 'bubble', 8, 'My hands are too cold to hold a book. Can you read eight word bubbles for me?', 'I feel warmer already. Thank you!'],
  ['bella', 'chest', 4, 'I am afraid of the old chests in the ruins. Can you open four of them?', 'No ghosts inside? Good. Thank you!'],
  ['minh', 'mini', 3, 'I want to know which game is the best up here. Can you play three?', 'Now I know where to spend my gold!'],
  ['sora', 'right', 30, 'The fairies only talk to good students. Can you answer thirty questions right?', 'The fairies are smiling at you. Thank you!'],
  ['bella', 'bubble', 10, 'It is too hot to walk around. Can you read ten word bubbles for me?', 'You are the coolest explorer in the valley!'],
  ['minh', 'chest', 5, 'It is so dark in this cave. Can you find and open five chests?', 'You have sharp eyes. Thanks, friend!'],
  ['sora', 'mini', 4, 'The city has so many games! Can you try four of them for me?', 'What a report! Thank you very much.'],
  ['bella', 'right', 40, 'This is the last land. Show me forty right answers, Word Keeper!', 'Forty! Lord Hush should be afraid of you.'],
];
export const FAVOURS = F.map(([who, kind, need, en, thanks], i) => ({ id: 'fav' + (i + 1), who, map: i + 1, region: MAPS[i], kind, need, en, thanks, vi: TASK_VI[kind](need) }));
const rec = (p) => { const r = p.favours || (p.favours = {}); r.done = r.done || {}; r.active = r.active || {}; return r; };
const tally = (p, kind) => (p.tally && p.tally[kind]) || 0;
/** How many favours the hero has done (for the notebook and the name tag talk). */
export const favoursDone = (p) => Object.keys(rec(p).done).length;
/**
 * What an explorer has for the hero: the first favour of theirs that is not done and whose land the hero has reached.
 * Returns { status: 'none' | 'offer' | 'active' | 'ready', favour, got, need }.
 */
export function favourState(p, who) {
  const r = rec(p), a = r.active[who], f = a ? FAVOURS.find((x) => x.id === a.id) : FAVOURS.find((x) => x.who === who && !r.done[x.id] && opened(p, x.region));
  if (!f) return { status: 'none', favour: null, got: 0, need: 0 };
  if (a) { const got = Math.max(0, Math.min(f.need, tally(p, f.kind) - a.base)); return { status: got >= f.need ? 'ready' : 'active', favour: f, got, need: f.need }; }
  return { status: 'offer', favour: f, got: 0, need: f.need };
}
export function favourAccept(p, who) { const s = favourState(p, who); if (s.status !== 'offer') return null; rec(p).active[who] = { id: s.favour.id, base: tally(p, s.favour.kind) }; return s.favour; }
/** Hands a favour in: { favour, gold } or null. Half of what a job for Kit or Mai pays. */
export function favourTurnIn(p, who) {
  const s = favourState(p, who); if (s.status !== 'ready') return null; const r = rec(p); delete r.active[who]; r.done[s.favour.id] = true;
  return { favour: s.favour, gold: Math.max(10, Math.round(mobGold(p.stats.level) * 6 / 5) * 5) };
}
