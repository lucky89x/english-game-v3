// Story lines of the backbone (19/11, docs/COT_TRUYEN.md approved): Tom's Word Keeper badge, the forest's memory of Lord
// Hush, the bosses waking up from the Dark Wind, the compass pieces and Lord Hush's short scenes. Original texts, short
// sentences for grades 6-9, one Vietnamese line per page for what to do.

/** Tom, when the bridge is fixed and the village has all its colours back: the badge, the compass, the forest. */
export const BADGE = (name) => [
  { who: 'Tom', en: `Look, ${name}! Our village has its words back. You did it!` },
  { who: 'Tom', en: 'You helped us with English words. You are a real Word Keeper now!' },
  { who: '🥉 Word Keeper badge', en: 'Rank: Apprentice Word Keeper.', vi: 'Con nhận huy hiệu Người Giữ Chữ hạng Tập sự (xem ở thẻ Hành trình trong sổ nhiệm vụ, phím N). Mỗi lần lên hạng con mạnh hơn.' },
  { who: 'Tom', en: 'One piece of the Language Compass is hidden in this land. The Slime King took it to the Wild Meadow, across the river.' },
  { who: 'Tom', en: 'Grow stronger first. The sea opens at level 5, and the forest at level 10. Good luck!', vi: 'Làng chỉ cho lên tới cấp 5. Lên cấp 5, đánh Vua Slime, qua cổng Cú Mèo để mở Biển cả; lên cấp 10 để mở Rừng Ký Ức (cổng ★ ở phía Tây Bắc làng).' },
];

/** The ancient tree gets its memories back: what Lord Hush did here. */
export const FOREST_MEMORY = (right) => [
  { who: 'Ancient Tree', en: `My memories are back! You named ${right} of 3 on the first try.` },
  { who: 'Pip', en: 'Look! The crystals are showing an old memory…' },
  { who: '🌑 A forest memory', en: 'Long ago, Lord Hush came to this forest. He wanted a world with no words, no songs and no laughter.' },
  { who: '🌑 A forest memory', en: 'He gave the Compass piece of this land to the Ancient Golem. "Keep it. Let no one take it!" he said.' },
  { who: 'Pip', en: 'The Ancient Golem lives in the clearing in the north-east of this forest. We must be strong to beat it.', vi: 'Mảnh La Bàn của rừng ở chỗ Golem Cổ (khoảng trống phía Đông Bắc rừng, cần cấp 19). Trước đó: luyện cấp ở các bãi quái, đánh Nữ hoàng Nấm.' },
];

/** First win against a boss: it wakes up from the Dark Wind. gold/exp are shown on the first page. */
export function bossWake(flag, gold, exp, level) {
  const got = `(+${gold} gold, +${exp} EXP)`;
  if (flag === 'boss1') return [
    { who: 'Ngọc', en: `I defeated the Slime King! ${got}` },
    { who: 'Slime King', en: 'Blub… where am I? The Dark Wind is gone from my head. Thank you, little Word Keeper!' },
    { who: 'Slime King', en: 'Lord Hush gave me this. It is yours now.' },
    { who: '🧭 Compass piece 1/10', en: 'You found the first piece of the Language Compass!', vi: 'Mảnh La Bàn số 1! Nó đã được đặt lên bệ La Bàn trong nhà của con.' },
    ...HUSH(1),
    { who: 'Pip', en: 'The piece is pointing to the sea… to Sunny Harbor!', vi: level >= 5 ? 'Qua cổng ôn tập của Cú Mèo (cấp 5) để lên hạng Thám hiểm, rồi ra bến thuyền đi tới Biển cả.' : 'Lên cấp 5, qua cổng ôn tập của Cú Mèo để lên hạng Thám hiểm, rồi đi thuyền tới Biển cả.' },
  ];
  if (flag === 'boss3') return [
    { who: 'Ngọc', en: `I defeated the Mushroom Queen! ${got}` },
    { who: 'Mushroom Queen', en: 'Oh… my head is clear now. Lord Hush\'s wind made me so angry. I am sorry!' },
    { who: 'Mushroom Queen', en: 'The Ancient Golem has the Compass piece. Go to the north-east clearing, brave one!', vi: 'Nữ hoàng Nấm tỉnh lại. Mảnh La Bàn của rừng ở chỗ Golem Cổ (khoảng trống phía Đông Bắc rừng, cấp 19).' },
  ];
  if (flag === 'boss2') return [
    { who: 'Ngọc', en: `I defeated the Ancient Golem! ${got}` },
    { who: 'Ancient Golem', en: 'Rumble… I was asleep for a long, long time. The Dark Wind is gone.' },
    { who: 'Ancient Golem', en: 'This belongs to the Word Keepers. Take it and keep it safe.' },
    { who: '🧭 Compass piece 3/10', en: 'You found the third piece of the Language Compass!', vi: 'Mảnh La Bàn số 3! Đã đặt lên bệ La Bàn trong nhà của con.' },
    ...HUSH(3),
    { who: 'Pip', en: 'The pieces are pointing to the Golden Desert!', vi: level >= 20 ? 'Qua bài thi của Cú Mèo (cấp 20) để lên hạng Dẫn đường. Sa mạc (Map 4) đang được xây.' : 'Lên cấp 20 và qua bài thi của Cú Mèo để lên hạng Dẫn đường. Sa mạc (Map 4) đang được xây.' },
  ];
  if (flag === 'boss4') return [
    { who: 'Ngọc', en: `I defeated Captain Octopus! ${got}` },
    { who: 'Captain Octopus', en: 'Glub… the Dark Wind is gone from the sea. My eight arms feel free!' },
    { who: 'Captain Octopus', en: 'Lord Hush gave me this. It is yours now, Word Keeper.' },
    { who: '🧭 Compass piece 2/10', en: 'You found the second piece of the Language Compass!', vi: 'Mảnh La Bàn số 2! Đã đặt lên bệ La Bàn trong nhà của con.' },
    ...HUSH(2),
    { who: 'Pip', en: 'The second piece is pointing to the Forest of Memories!', vi: 'Lên cấp 10 và qua bài thi 10 câu của Cú Mèo để lên hạng Kiểm lâm: Rừng Ký Ức (Map 3) mở ra.' },
  ];
  const L4 = LAND_WAKE[flag];      // (26/11) maps 4-7: the guard wakes, gives the piece, Lord Hush shows a little more of himself, Pip points to the next land
  if (L4) return [
    { who: 'Ngọc', en: `I defeated the ${L4.name}! ${got}` },
    { who: L4.name, en: L4.wake, vi: L4.wakeVi },
    { who: `🧭 Compass piece ${L4.n}/10`, en: `You found piece number ${L4.n} of the Language Compass!`, vi: `Mảnh La Bàn số ${L4.n}! Đã đặt lên bệ La Bàn trong nhà của con. ${L4.back}` },
    ...HUSH(L4.n),
    { who: 'Pip', en: L4.next, vi: L4.nextVi },
  ];
  return null;
}
/** What the guards of maps 4-7 say when the Dark Wind leaves them, and where the piece points. Each land had lost one kind of words. */
const LAND_WAKE = {
  boss5: { n: 4, name: 'Sand Dragon', wake: 'Hrrr… the sand is quiet. Where am I? Oh! I can ask questions again!', wakeVi: 'Rồng Cát tỉnh lại: sa mạc lấy lại được các CÂU HỎI.', back: 'Người sa mạc lại hỏi được "Where?", "How much?".',
    next: 'The piece is pointing to the Snowy Peaks!', nextVi: 'Lên cấp 25, vượt bài thi của Cú Mèo ở Sa mạc để mở Núi tuyết (cấp 25–30, Unit 5).' },
  boss6: { n: 5, name: 'Ice Dragon', wake: 'Brrr… I feel warmer. This peak is higher than the clouds, and now I can say so!', wakeVi: 'Rồng Băng tỉnh lại: núi lấy lại được các LỜI SO SÁNH.', back: 'Người miền núi lại nói được cái nào cao hơn, đường nào an toàn hơn.',
    next: 'The piece is pointing to the Ancient Ruins!', nextVi: 'Lên cấp 30, vượt bài thi của Cú Mèo ở Núi tuyết để mở Di tích cổ (cấp 30–35, Unit 6).' },
  boss7: { n: 6, name: 'Stone Giant', wake: 'Rumble… I remember now. Long ago, children played here. I guarded their stories.', wakeVi: 'Người Khổng Lồ Đá tỉnh lại: di tích lấy lại được các CÂU CHUYỆN đã qua.', back: 'Những bức tường lại kể được chuyện ngày xưa.',
    next: 'The piece is pointing up… to the Sky Kingdom!', nextVi: 'Lên cấp 35, vượt bài thi của Cú Mèo ở Di tích để mở Vương quốc trên trời (cấp 35–45, Unit 7).' },
  boss8: { n: 7, name: 'Sun Dragon', wake: 'Aaah… the wind is gentle again. Tomorrow I will fly over every land. I can make wishes again!', wakeVi: 'Rồng Mặt Trời tỉnh lại: bầu trời lấy lại được các LỜI ƯỚC cho ngày mai.', back: 'Người trên trời lại nói được ngày mai mình sẽ làm gì.',
    next: 'Seven pieces! The Compass is pointing to an island far away…', nextVi: 'Lên cấp 45 và vượt bài thi của Cú Mèo. Đảo thần tiên (Map 8) còn chìm trong Gió Đen, sắp mở.' },
};

/** Lord Hush appears as a dark shadow after each compass piece. */
export function HUSH(n) {
  if (n === 1) return [
    { who: '🌑 Lord Hush', en: 'So… a little Word Keeper found one piece.' },
    { who: '🌑 Lord Hush', en: 'You will never find the other nine. My Dark Wind is waiting for you at the sea!' },
  ];
  if (n === 2) return [
    { who: '🌑 Lord Hush', en: 'Two pieces?! Hmm. You are stronger than I thought.' },
    { who: '🌑 Lord Hush', en: 'But the forest is full of old, angry memories. They will swallow your words!' },
  ];
  if (n === 3) return [
    { who: '🌑 Lord Hush', en: 'Three pieces?! Impossible!' },
    { who: '🌑 Lord Hush', en: 'But the desert is MY land. The sand will swallow your words!' },
  ];
  // (26/11) from the desert on he stops shouting: piece by piece the child learns why he hates words
  if (n === 4) return [
    { who: '🌑 Lord Hush', en: 'Shh… not so loud. You ask too many questions.' },
    { who: '🌑 Lord Hush', en: 'I asked a question once. Everybody laughed. Go home, little Keeper.' },
  ];
  if (n === 5) return [
    { who: '🌑 Lord Hush', en: 'Five pieces. You are better than I was. I was the smallest Word Keeper, you know.' },
    { who: '🌑 Lord Hush', en: 'They said I was slower than the others. Words only hurt. The ruins remember.' },
  ];
  if (n === 6) return [
    { who: '🌑 Lord Hush', en: 'So you found my old school in the ruins. My name was Hugh then.' },
    { who: 'Pip', en: 'He sounded sad. Is that strange?', vi: 'Nghe ông ấy buồn nhỉ. Ngày xưa ông ấy cũng là một Người Giữ Chữ nhỏ tuổi.' },
  ];
  return [
    { who: '🌑 Lord Hush', en: 'Seven pieces… I wished for a silent world. Is it so wrong to wish?' },
    { who: 'Pip', en: 'He does not shout any more. Maybe he needs a word that nobody ever said to him.', vi: 'Ông ấy không còn quát nữa. Có lẽ ông ấy cần một lời mà chưa ai từng nói với mình.' },
  ];
}

