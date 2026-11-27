// (27/11, turn 67) Other young explorers on the roads: "a few copies of other players (played by the computer) so the child feels
// the game has many players; now and then they meet, exchange a few words, tell something". Three of them travel through the
// same lands as the hero: they walk between the places of a land, stop, wave, and when spoken to (E) tell a little thing in
// English: where they are going, what they found, a small story, or they ask the hero a question. Pure data and rules here
// (tested in node); the walking is in game/crowd.js. They are part of the story world (other Word Keepers in training), and their
// name tags look like other players' tags.
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
