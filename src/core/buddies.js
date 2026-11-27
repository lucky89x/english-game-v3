// (27/11, turn 66) Two friends of the hero's own age, in every land: "one or two friends (NPCs) who walk along now and then, chat,
// ask how the hero is, and ask for help; their quests run through all twelve maps and tie in with the main story".
//  - KIT, a boy who builds things: he starts as a rival ("I will find the pieces first!") and becomes a friend. His jobs are
//    about fighting (defeat monsters, finish a job from the hunt board); each one done, he tunes the hero's weapon (+1 attack).
//  - MAI, a girl who keeps a word diary: her jobs are about learning (new words, a lesson with the land's keeper, labels at
//    home, a guest at home); each one done, she gives a lucky charm (+6 health) and a page of her diary, and the twelve pages
//    tell who Lord Hush was as a boy, in step with what he says after each compass piece (game/saga.js HUSH).
// One job per friend per map, in order: map N's job opens when the hero has reached map N and done the friend's job of map N-1.
// Pure rules, tested in node. The people themselves (models, walking along, talk) are in main.js.
import { learned } from './review.js';
import { opened } from './world.js';
import { mobGold } from './progress.js';

export const BUDDIES = {
  kit: { id: 'kit', who: 'Kit', hello: ["Hey! I'm Kit. I build things, and I am going to find the compass pieces before you do!", "Don't look so worried. If you help me now and then, I might help you too."], vi: 'Kit, cậu bạn thích chế tạo. Lúc đầu thích ganh đua, sau thành bạn thân. Giúp Kit xong mỗi việc, cậu ấy mài lại vũ khí cho con (+1 công).' },
  mai: { id: 'mai', who: 'Mai', hello: ["Hello! I'm Mai. I write every new word in my diary.", 'Lord Hush took so many words. Will you help me find them again?'], vi: 'Mai, cô bạn giữ cuốn nhật ký từ. Giúp Mai xong mỗi việc, bạn ấy tặng một bùa may (+6 máu) và một trang nhật ký kể về Hugh.' },
};
export const MAP_IDS = ['village', 'harbor', 'forest', 'desert', 'mountain', 'ruins', 'sky', 'fairy', 'volcano', 'crystal', 'city', 'dream'];
export const KIT_ATK = 1, MAI_HP = 6;

/** What a job counts. Each reads the profile and returns a number that only grows. */
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + (Number(b) || 0), 0);
export const COUNTERS = {
  kills: (p) => p.kills || 0,
  hunts: (p) => ['hunt', 'hunt2', 'hunt3', 'hunt4', 'hunt5', 'hunt6', 'hunt7', 'hunt8', 'hunt9', 'hunt10', 'hunt11', 'hunt12'].reduce((n, k) => n + ((p[k] && p[k].done) || 0), 0),
  words: (p) => learned(p.words || {}),
  lessons: (p) => sum(p.lessons),
  labels: (p) => Object.keys((p.home && p.home.labels) || {}).length,
  guests: (p) => sum(p.guests),
};
const TASK_VI = { kills: (n) => `Hạ ${n} con quái (ở vùng nào cũng được).`, hunts: (n) => `Làm xong ${n} việc ở bảng săn quái.`, words: (n) => `Học thêm ${n} từ mới (bong bóng chữ, rương, chữ rơi từ quái, hũ chữ…).`, lessons: (n) => `Học ${n} buổi với người giữ vùng (5 từ + trang ngữ pháp).`, labels: (n) => `Về nhà dán nhãn tiếng Anh cho ${n} món đồ (đứng cạnh món đồ bấm F).`, guests: (n) => `Tiếp ${n} vị khách tới thăm nhà (bấm F cạnh khách).` };

/** Kit's twelve jobs: [kind, how many, what he says]. */
const KIT = [
  ['kills', 5, "I can beat five monsters before lunch. Can you? Show me!"],
  ['kills', 8, "Captain Octopus has eight arms. Beat eight monsters and I will believe you can face him."],
  ['kills', 12, "The forest is full of old, angry things. Beat twelve of them, and I will tell you what I saw near the Ancient Golem."],
  ['hunts', 1, "OK, you are faster than me. Let's work together! Finish a job from the hunt board, and I will check the road to the Sun Temple."],
  ['kills', 15, "It is so cold that my tools are frozen! Beat fifteen monsters to keep warm, and I will fix your blade for the Ice Dragon."],
  ['hunts', 1, "These ruins were a school once. Finish a job from the board, and I will look for the door the Stone Giant is guarding."],
  ['kills', 20, "I built wings, but they do not work yet. Beat twenty monsters up here while I repair them!"],
  ['hunts', 1, "The fairies cannot start their games. Finish a job from the board, and I will build them a starting bell."],
  ['kills', 20, "The ground was shaking when I woke up! Beat twenty monsters, and I will make you a shield against the heat."],
  ['hunts', 1, "My lamp went out in the dark. Finish a job from the board, and I will make a crystal lamp for both of us."],
  ['kills', 25, "Robots! I love robots. But these ones are angry. Beat twenty-five of them, and I will find out who is giving the orders."],
  ['kills', 25, "This is the last land. Beat twenty-five nightmares with me beside you. Then we will go to Hugh together."],
];
/** Mai's twelve jobs and the page of her diary each one earns. */
const MAI = [
  ['words', 5, 'My diary is nearly empty. Learn five new words, and I will write them down.', 'Page 1. Long ago, a small boy called Hugh came to the Word Keepers. He was the youngest of them all.'],
  ['words', 6, 'The sea has so many words! Learn six new ones for my diary, please.', 'Page 2. Hugh spoke slowly. When he read aloud, the other children finished before him.'],
  ['words', 8, 'The old trees remember things. Learn eight new words, and maybe they will tell us more.', 'Page 3. Hugh liked the forest because the trees never hurried him.'],
  ['lessons', 1, 'Zara knows the words of the desert. Have a lesson with her, and tell me what you learned.', 'Page 4. One day Hugh asked a question in class. Everybody laughed. He did not ask again.'],
  ['labels', 3, 'I want to see your home! Put English labels on three things there, and I will come and read them.', 'Page 5. The others said Hugh was slower than them. Nobody said that he was more careful.'],
  ['words', 8, 'These walls were a school. Learn eight new words here, where children learned them long ago.', 'Page 6. This was his school. On the last wall I found his name, written very small: Hugh.'],
  ['lessons', 1, 'Aria rings the wind bells. Have a lesson with her. I will listen from here.', 'Page 7. Hugh wished for a quiet world, where nobody could laugh at him.'],
  ['guests', 1, 'Friends should visit each other. Welcome a guest at your home, and tell me about it!', 'Page 8. He never won a game. Nobody ever said "Well done" to him.'],
  ['words', 8, 'I am a little afraid of the volcano. Learn eight new words with me, so I think of something else.', 'Page 9. While the others were playing, Hugh was reading alone. Silence was his only friend.'],
  ['lessons', 1, 'Opal can send messages with crystals. Have a lesson with her, and we will send one too.', 'Page 10. Hugh never had anyone to write to. So I am writing to him now.'],
  ['labels', 3, 'Your home must be full of things by now! Label three more of them in English.', 'Page 11. If somebody had been kind to him, he would not have taken the words.'],
  ['words', 10, 'This is the last page of my diary. Learn ten new words, and I will write the ending.', 'Page 12. Hugh is not a monster. He is a boy who needs a friend. Let us tell him: "Well done for trying."'],
];
/** All the jobs: { id, who, map, kind, need, en, vi, page? }. */
export const QUESTS = [...KIT.map(([kind, need, en], i) => ({ id: 'kit' + (i + 1), who: 'kit', map: i + 1, kind, need, en, vi: TASK_VI[kind](need) })),
  ...MAI.map(([kind, need, en, page], i) => ({ id: 'mai' + (i + 1), who: 'mai', map: i + 1, kind, need, en, vi: TASK_VI[kind](need), page }))];

/** The hero's record with the friends: how many jobs each has had done, the job in hand, the diary pages. */
export const record = (p) => p.buddy || (p.buddy = { kit: 0, mai: 0, active: {}, met: {} });
/** Has the hero reached this map (1-12)? */
export const reached = (p, map) => (p && p.admin ? true : opened(p, MAP_IDS[map - 1]));
/** The friend's next job, or null when all twelve are done. */
export const nextQuest = (p, who) => QUESTS.find((q) => q.who === who && q.map === record(p)[who] + 1) || null;
/**
 * Where the hero stands with this friend: { status, quest, got, need }.
 * status: 'done' (all twelve) | 'later' (the next job is in a land not reached yet) | 'offer' | 'active' | 'ready'.
 */
export function state(p, who) {
  const r = record(p), q = nextQuest(p, who); if (!q) return { status: 'done', quest: null, got: 0, need: 0 };
  const a = r.active[who];
  if (a && a.id === q.id) { const got = Math.max(0, Math.min(q.need, COUNTERS[q.kind](p) - a.base)); return { status: got >= q.need ? 'ready' : 'active', quest: q, got, need: q.need }; }
  return { status: reached(p, q.map) ? 'offer' : 'later', quest: q, got: 0, need: q.need };
}
/** Takes the job the friend offers. Returns the quest or null. */
export function accept(p, who) { const s = state(p, who); if (s.status !== 'offer') return null; record(p).active[who] = { id: s.quest.id, base: COUNTERS[s.quest.kind](p) }; return s.quest; }
/** Hands the job in. Returns { quest, gold, page } or null when it is not done. The caller adds the gold and the EXP. */
export function turnIn(p, who) {
  const s = state(p, who); if (s.status !== 'ready') return null; const r = record(p); delete r.active[who]; r[who] += 1;
  return { quest: s.quest, gold: Math.max(20, Math.round(mobGold(p.stats.level) * 12 / 5) * 5), page: s.quest.page || null };
}
/** The diary pages the hero has (Mai's jobs done), in order. */
export const pages = (p) => QUESTS.filter((q) => q.who === 'mai' && q.map <= record(p).mai).map((q) => q.page);

// ---------------------------------------------------------------- talk
/** Small talk: the friend asks, the child picks an answer (all are fine English), the friend replies. */
export const CHATS = [
  { ask: 'How are you today?', vi: 'Hôm nay bạn thế nào?', answers: [["I'm great, thanks!", 'Good! Then let us go and find some words.'], ["I'm a bit tired.", 'Sit down for a minute. Have some bread!'], ["I'm hungry!", 'Me too! Rose bakes the best bread in the village.']] },
  { ask: 'What do you like doing in your free time?', vi: 'Lúc rảnh bạn thích làm gì?', answers: [['I like reading.', 'So do I! Books are full of new words.'], ['I like playing games.', 'Ha! I like games too, when I win.'], ['I like drawing.', 'Really? Will you draw me one day?']] },
  { ask: 'Which land do you like best?', vi: 'Bạn thích vùng đất nào nhất?', answers: [['I like the village best.', 'It feels like home, does it not?'], ['I like the sea.', 'I love the sound of the waves.'], ['I do not know yet.', 'Then we must see them all!']] },
  { ask: 'Are you afraid of Lord Hush?', vi: 'Bạn có sợ Chúa tể Im Lặng không?', answers: [['A little.', 'Me too. But we are braver together.'], ['No, I am not!', 'Wow. You are braver than I am.'], ['I feel sorry for him.', 'So do I. Maybe he is only lonely.']] },
  { ask: 'What is your favourite food?', vi: 'Bạn thích ăn món gì nhất?', answers: [['I love fruit.', 'Sweet oranges are the best!'], ['I love bread.', 'Warm bread with butter. Yum!'], ['I love noodles.', 'Oh! Now I am hungry.']] },
  { ask: 'What time do you usually go to bed?', vi: 'Bạn thường đi ngủ lúc mấy giờ?', answers: [['At nine o\'clock.', 'That is early! Good for you.'], ['At ten o\'clock.', 'Me too. Then I dream about adventures.'], ['Very late!', 'Oh no. A hero needs sleep!']] },
  { ask: 'Do you have any brothers or sisters?', vi: 'Bạn có anh chị em không?', answers: [['Yes, I do.', 'Lucky you! I would like to meet them.'], ['No, I do not.', 'Then I will be like one for you.'], ['I have a pet!', 'A pet is family too.']] },
  { ask: 'What will you do after the adventure?', vi: 'Sau chuyến phiêu lưu bạn sẽ làm gì?', answers: [['I will go home.', 'And I will visit you there!'], ['I will travel more.', 'Take me with you!'], ['I will help other people.', 'That is a hero\'s answer.']] },
];
/** Things a friend says while walking along. */
export const REMARKS = ['This way! Or… that way?', 'Wait for me!', 'Look at that! Is it not pretty?', 'I think I heard something.', 'Are you tired? I am not!', 'What is that word over there?', 'Stay close to me.', 'I am glad we are friends.', 'Do not forget to eat something.', 'One more word for the diary!'];
/** What the friend says first, by how the story stands: before the land's guard is beaten, or after. */
export function greeting(who, { bossDown = false, level = 1, cap = 5 } = {}) {
  if (who === 'kit') return bossDown ? 'You beat the guard of this land! OK, I am a little jealous.' : level >= cap - 1 ? 'You look strong enough for the guard of this land. Shall we go and see?' : 'Hey! Keep training. The guard of this land is not easy.';
  return bossDown ? 'The words of this land are back. Thank you! I wrote them all down.' : level >= cap - 1 ? 'You are nearly ready for the guard of this land. Be careful, please!' : 'Hello again! Have you found any new words today?';
}
