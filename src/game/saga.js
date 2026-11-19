// Story lines of the backbone (19/11, docs/COT_TRUYEN.md approved): Tom's Word Keeper badge, the forest's memory of Lord
// Hush, the bosses waking up from the Dark Wind, the compass pieces and Lord Hush's short scenes. Original texts, short
// sentences for grades 6-9, one Vietnamese line per page for what to do.

/** Tom, when the bridge is fixed and the village has all its colours back: the badge, the compass, the forest. */
export const BADGE = (name) => [
  { who: 'Tom', en: `Look, ${name}! The colours are back in our village. You did it!` },
  { who: 'Tom', en: 'You helped us with English words. You are a real Word Keeper now!' },
  { who: '🥉 Word Keeper badge', en: 'Rank: Apprentice Word Keeper.', vi: 'Con nhận huy hiệu Người Giữ Chữ hạng Tập sự (xem ở thẻ Hành trình trong sổ nhiệm vụ, phím N). Mỗi lần lên hạng con mạnh hơn.' },
  { who: 'Tom', en: 'One piece of the Language Compass is hidden in this land. The forest remembers where it is.' },
  { who: 'Tom', en: 'Go to the forest gate. Pip is waiting for you there. Good luck!', vi: 'Cổng rừng ở phía Tây Bắc làng (dấu ★ trên bản đồ).' },
];

/** The ancient tree gets its memories back: what Lord Hush did here. */
export const FOREST_MEMORY = (right) => [
  { who: 'Ancient Tree', en: `My memories are back! You named ${right} of 3 on the first try.` },
  { who: 'Pip', en: 'Look! The crystals are showing an old memory…' },
  { who: '🌑 A forest memory', en: 'Long ago, Lord Hush came to this forest. He wanted a world with no words, no songs and no laughing.' },
  { who: '🌑 A forest memory', en: 'He gave the Compass piece of this land to the Ancient Golem. "Keep it. Let no one take it!" he said.' },
  { who: 'Pip', en: 'The Ancient Golem lives in the stone fields, south-east of the village. We must be strong to beat it.', vi: 'Mảnh La Bàn số 1 ở chỗ Golem Cổ (cánh đồng đá phía Đông Nam, cần cấp 18). Trước đó: luyện cấp, đánh Vua Slime, dơi, nấm và Nữ hoàng Nấm trong rừng.' },
];

/** First win against a boss: it wakes up from the Dark Wind. gold/exp are shown on the first page. */
export function bossWake(flag, gold, exp, level) {
  const got = `(+${gold} gold, +${exp} EXP)`;
  if (flag === 'boss1') return [
    { who: 'Ngọc', en: `I defeated the Slime King! ${got}` },
    { who: 'Slime King', en: 'Blub… where am I? The Dark Wind is gone from my head. Thank you, little Word Keeper!' },
    { who: 'Slime King', en: 'The forest is dark too. Pip needs your help there.', vi: 'Vua Slime đã tỉnh lại. Ở cấp 18, Golem Cổ thức dậy ở cánh đồng đá phía Đông Nam.' },
  ];
  if (flag === 'boss3') return [
    { who: 'Ngọc', en: `I defeated the Mushroom Queen! ${got}` },
    { who: 'Mushroom Queen', en: 'Oh… my head is clear now. Lord Hush\'s wind made me so angry. I am sorry!' },
    { who: 'Mushroom Queen', en: 'The Ancient Golem has the Compass piece. Go to the stone fields, brave one!', vi: 'Nữ hoàng Nấm tỉnh lại. Mảnh La Bàn ở chỗ Golem Cổ (cánh đồng đá phía Đông Nam, cấp 18).' },
  ];
  if (flag === 'boss2') return [
    { who: 'Ngọc', en: `I defeated the Ancient Golem! ${got}` },
    { who: 'Ancient Golem', en: 'Rumble… I was asleep for a long, long time. The Dark Wind is gone.' },
    { who: 'Ancient Golem', en: 'This belongs to the Word Keepers. Take it and keep it safe.' },
    { who: '🧭 Compass piece 1/10', en: 'You found the first piece of the Language Compass!', vi: 'Mảnh La Bàn số 1! Nó đã được đặt lên bệ La Bàn trong nhà của con.' },
    ...HUSH(1),
    { who: 'Pip', en: 'The piece is pointing to the sea… to Sunny Harbor!', vi: level >= 20 ? 'Qua bài thi của Cú Mèo (cấp 20) để lên hạng Thám hiểm, rồi ra bến thuyền đi tới Cảng Mặt Trời.' : 'Lên cấp 20, qua bài thi của Cú Mèo để lên hạng Thám hiểm, rồi đi thuyền tới Cảng Mặt Trời.' },
  ];
  if (flag === 'boss4') return [
    { who: 'Ngọc', en: `I defeated Captain Octopus! ${got}` },
    { who: 'Captain Octopus', en: 'Glub… the Dark Wind is gone from the sea. My eight arms feel free!' },
    { who: 'Captain Octopus', en: 'Lord Hush gave me this. It is yours now, Word Keeper.' },
    { who: '🧭 Compass piece 2/10', en: 'You found the second piece of the Language Compass!', vi: 'Mảnh La Bàn số 2! Đã đặt lên bệ La Bàn trong nhà của con.' },
    ...HUSH(2),
    { who: 'Pip', en: 'The two pieces are pointing to the Golden Wind Desert!', vi: 'Lên cấp 30 và qua bài thi lớn của Cú Mèo để lên hạng Kiểm lâm. Sa mạc Gió Vàng (Map 3) đang được xây.' },
  ];
  return null;
}

/** Lord Hush appears as a dark shadow after each compass piece. */
export function HUSH(n) {
  if (n === 1) return [
    { who: '🌑 Lord Hush', en: 'So… a little Word Keeper found one piece.' },
    { who: '🌑 Lord Hush', en: 'You will never find the other nine. My Dark Wind is waiting for you at the sea!' },
  ];
  return [
    { who: '🌑 Lord Hush', en: 'Two pieces?! Hmm. You are stronger than I thought.' },
    { who: '🌑 Lord Hush', en: 'But the desert is MY land. The sand will swallow your words!' },
  ];
}

/** The toast when a region gets colour back. */
export const COLOUR_TOAST = '🌈 Colour is coming back to this land!';
