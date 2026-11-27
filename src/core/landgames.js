// (27/11, turn 68) Mini games made for a land (the lands of maps 4-12 only had the village's games under another name).
// Three to start with, each with English inside the play and a prize for the HOME instead of gold:
//  - BAZAAR BARGAIN (Golden Desert): a customer asks "How much are two apples and a melon?"; the prices hang on the stall
//    in figures, the three answers are number WORDS. Questions, plurals, numbers (the desert lost its questions).
//  - SNOW SLIDE (Snowy Peaks): a sledge on three lanes; every gate has three forms of an adjective and the sentence above
//    needs the comparative ("An elephant is ___ than a mouse."). The peaks lost their comparing words.
//  - GEM MINE (Crystal Cave): ten strokes of the pick on a wall of 25 rocks; some gems are locked behind a word of the unit.
// Then three more (same turn): RUNE DECODER (Ancient Ruins, word order), BALLOON RIDE (Sky Kingdom, spelling from memory),
// ROBOT BUILDER (Future City, reading an order: colours, "the same as", "not", an if-sentence).
// Pure rules and data here (tested in node); the drawing is in ui/landgames.js.

/** The prize of each game: a thing for the home, given the first time the score reaches `score`. */
export const PRIZES = {
  bazaar: { item: 'gm_carpet', score: 6, of: 8 },
  slide: { item: 'gm_snowman', score: 9, of: 12 },
  mine: { item: 'gm_gemchest', score: 10, of: 0 },
  rune: { item: 'gm_runestone', score: 5, of: 6 },
  balloon: { item: 'gm_starlamp', score: 4, of: 5 },
  robot: { item: 'gm_robot', score: 5, of: 6 },
};

// ---------------------------------------------------------------- Bazaar Bargain
export const GOODS = [
  { en: 'apple', pl: 'apples', icon: '🍎', price: 2 }, { en: 'egg', pl: 'eggs', icon: '🥚', price: 1 }, { en: 'carrot', pl: 'carrots', icon: '🥕', price: 1 }, { en: 'loaf of bread', pl: 'loaves of bread', icon: '🍞', price: 3 },
  { en: 'fish', pl: 'fish', icon: '🐟', price: 6 }, { en: 'melon', pl: 'melons', icon: '🍉', price: 5 }, { en: 'cake', pl: 'cakes', icon: '🍰', price: 7 }, { en: 'orange', pl: 'oranges', icon: '🍊', price: 4 },
  { en: 'lemon', pl: 'lemons', icon: '🍋', price: 2 }, { en: 'basket', pl: 'baskets', icon: '🧺', price: 8 }, { en: 'candle', pl: 'candles', icon: '🕯️', price: 3 }, { en: 'teapot', pl: 'teapots', icon: '🫖', price: 9 },
];
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
/** A number in words, 0 to 99. */
export const numberWord = (n) => (n < 20 ? NUM[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + NUM[n % 10] : ''));
const an = (w) => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
const some = (n, g) => (n === 1 ? an(g.en) : `${numberWord(n)} ${g.pl}`);
/**
 * One customer. round: 0-7 (later rounds ask for two kinds and bigger numbers).
 * Returns { shelf: six goods on the stall, ask: the question in English, total, options: three number words, a: index of the right one }.
 */
export function bazaarRound(round, rnd = Math.random) {
  const pick = (arr) => arr[Math.floor(rnd() * arr.length) % arr.length], shelf = [...GOODS].sort(() => rnd() - 0.5).slice(0, 6);
  const g1 = shelf[0], n1 = 1 + Math.floor(rnd() * (round < 2 ? 2 : 3)), two = round >= 2, g2 = two ? shelf[1] : null, n2 = two ? 1 + Math.floor(rnd() * (round < 5 ? 2 : 3)) : 0;
  const total = g1.price * n1 + (g2 ? g2.price * n2 : 0), plural = n1 > 1 || two;
  const ask = `How much ${plural ? 'are' : 'is'} ${some(n1, g1)}${g2 ? ` and ${some(n2, g2)}` : ''}?`;
  const wrong = new Set(); for (let k = 0; k < 40 && wrong.size < 2; k++) { const w = total + pick([-3, -2, -1, 1, 2, 3, g1.price, -g1.price]); if (w > 0 && w !== total && w < 100) wrong.add(w); }
  for (let w = total + 4; wrong.size < 2; w++) wrong.add(w);
  const nums = [total, ...wrong].sort(() => rnd() - 0.5);
  return { shelf: shelf.sort((a, b) => a.en.localeCompare(b.en)), ask, total, options: nums.map(numberWord), a: nums.indexOf(total), buy: [[g1, n1], ...(g2 ? [[g2, n2]] : [])] };
}

// ---------------------------------------------------------------- Snow Slide
/** [adjective, the right comparative, two wrong forms, a sentence with ___ ]. */
export const COMPARE = [
  ['big', 'bigger', 'biger', 'more big', 'An elephant is ___ than a mouse.'], ['small', 'smaller', 'smallier', 'more small', 'A cat is ___ than a horse.'],
  ['hot', 'hotter', 'hoter', 'more hot', 'The desert is ___ than the mountain.'], ['cold', 'colder', 'coldder', 'more cold', 'Ice is ___ than water.'],
  ['happy', 'happier', 'happyer', 'more happy', 'Today I am ___ than yesterday.'], ['easy', 'easier', 'easyer', 'more easy', 'Walking is ___ than climbing.'],
  ['beautiful', 'more beautiful', 'beautifuler', 'most beautiful', 'This flower is ___ than that one.'], ['dangerous', 'more dangerous', 'dangerouser', 'most dangerous', 'A yeti is ___ than a bunny.'],
  ['good', 'better', 'gooder', 'more good', 'My new sword is ___ than my old one.'], ['bad', 'worse', 'badder', 'more bad', 'A storm is ___ than a little rain.'],
  ['tall', 'taller', 'tallier', 'more tall', 'The tower is ___ than the lodge.'], ['fast', 'faster', 'fastter', 'more fast', 'A sledge is ___ than a snowman.'],
  ['heavy', 'heavier', 'heavyer', 'more heavy', 'A rock is ___ than a snowball.'], ['expensive', 'more expensive', 'expensiver', 'most expensive', 'A helmet is ___ than a hat.'],
  ['far', 'farther', 'farer', 'more far', 'The summit is ___ than the lake.'], ['nice', 'nicer', 'niceer', 'more nice', 'Hot soup is ___ than cold soup.'],
  ['thin', 'thinner', 'thiner', 'more thin', 'Ice on the lake is ___ than ice on the peak.'], ['interesting', 'more interesting', 'interestinger', 'most interesting', 'This story is ___ than that one.'],
];
/** One gate: { adj, sentence, signs: the three forms in lane order, a: the lane of the right one }. */
export function slideGate(k, order, rnd = Math.random) {
  const [adj, right, w1, w2, sentence] = COMPARE[order[k % order.length]], signs = [right, w1, w2].sort(() => rnd() - 0.5);
  return { adj, sentence, right, signs, a: signs.indexOf(right) };
}
/** The order the adjectives come in this run. */
export const slideOrder = (rnd = Math.random) => COMPARE.map((_, i) => i).sort(() => rnd() - 0.5);

// ---------------------------------------------------------------- Gem Mine
export const MINE_SIDE = 5, MINE_PICKS = 10;
/** The wall: 25 rocks, each 'gem', 'lock' (a gem behind a word) or 'none'. About ten gems and six locked ones. */
export function mineWall(rnd = Math.random) {
  const cells = Array.from({ length: MINE_SIDE * MINE_SIDE }, (_, i) => (i < 10 ? 'gem' : i < 16 ? 'lock' : 'none'));
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  return cells;
}
/** What a stroke on a rock gives: 1 gem, 0, or a question (a locked gem is worth 2 when the word is right). */
export const mineGems = (kind, right) => (kind === 'gem' ? 1 : kind === 'lock' ? (right ? 2 : 0) : 0);
/** A question for a locked gem: { card, options: three meanings, a } or null when the unit has too few words. */
export function mineQuestion(cards, rnd = Math.random) {
  const pool = cards.filter((c) => c && c.word && c.vi && c.word.length <= 18); if (pool.length < 4) return null;
  const card = pool[Math.floor(rnd() * pool.length) % pool.length], others = pool.filter((c) => c.id !== card.id && c.vi !== card.vi).sort(() => rnd() - 0.5).slice(0, 2), opts = [card, ...others].sort(() => rnd() - 0.5);
  return { card, options: opts.map((c) => c.vi), a: opts.indexOf(card) };
}
/** Has this result earned the game's prize? */
export const wonPrize = (id, score) => !!(PRIZES[id] && score >= PRIZES[id].score);
const shuffle = (a, rnd) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ---------------------------------------------------------------- (27/11, turn 68) three more: Rune Decoder, Balloon Ride, Robot Builder
/** Rune Decoder (the Ancient Ruins): put the stone tiles in order to make the sentence. Sentences written for the game. */
export const RUNES = [
  'The stone door opened very slowly.', 'We found a map under the bridge.', 'My friend can read these old words.', 'The giant slept for a hundred years.',
  'There are three keys in the box.', 'She is drawing a picture of the tower.', 'Do you know the way to the gate?', 'The keeper told us a long story.',
  'I have never seen a golden statue.', 'They were walking when the rain started.', 'Please do not touch the glowing stone.', 'What did you find in the cave?',
  'The ruins are older than the village.', 'He will come back before the night.',
];
export const RUNE_ROUNDS = 6;
/** Round k: { text, words (in order, the last one carries the full stop or question mark), tiles (the same words, mixed) }. */
export function runeRound(k, order, rnd = Math.random) {
  const text = RUNES[order[k % order.length]], words = text.split(' '); let tiles = shuffle(words, rnd);
  for (let i = 0; i < 6 && tiles.join(' ') === text; i++) tiles = shuffle(words, rnd);      // never handed over already in order
  if (tiles.join(' ') === text) tiles = [...words.slice(1), words[0]];
  return { text, words, tiles };
}
export const runeOrder = (rnd = Math.random) => shuffle(RUNES.map((_, i) => i), rnd);

/** Balloon Ride (the Sky Kingdom): catch the letters of a word in order. */
export const BALLOON_WORDS = [['cloud', 'đám mây'], ['kite', 'cái diều'], ['wind', 'gió'], ['rainbow', 'cầu vồng'], ['eagle', 'đại bàng'], ['storm', 'cơn bão'], ['castle', 'lâu đài'], ['feather', 'lông vũ']];
export const BALLOON_COLS = 5, BALLOON_N = 5;
/** Five words for a ride: the unit's own words when they are plain (3 to 8 letters), the sky words otherwise. */
export function balloonWords(cards = [], rnd = Math.random) {
  const plain = cards.filter((c) => /^[a-z]{3,8}$/i.test(c.word || '')).map((c) => ({ id: c.id, word: c.word.toLowerCase(), vi: c.vi })), own = BALLOON_WORDS.map(([word, vi]) => ({ word, vi }));
  return shuffle(plain.length >= BALLOON_N ? plain : [...plain, ...shuffle(own, rnd)].slice(0, Math.max(BALLOON_N, plain.length)), rnd).slice(0, BALLOON_N);
}
/** The row of clouds for letter i of the word: three letters in three different columns, one of them the right one. */
export function balloonRow(word, i, rnd = Math.random) {
  const right = word[i], abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((ch) => ch !== right), near = shuffle(word.split('').filter((ch) => ch !== right), rnd);
  const wrong = []; for (const ch of [...near.slice(0, 1), ...shuffle(abc, rnd)]) { if (!wrong.includes(ch)) wrong.push(ch); if (wrong.length === 2) break; }      // one decoy from the word itself when there is one
  const cols = shuffle([0, 1, 2, 3, 4], rnd).slice(0, 3), letters = shuffle([right, ...wrong], rnd);
  return { letters, cols, a: letters.indexOf(right) };
}

/** Robot Builder (the Future City): read the order, paint the three parts. */
export const ROBOT_COLOURS = ['red', 'blue', 'green', 'yellow', 'pink'], ROBOT_PARTS = ['head', 'body', 'legs'], ROBOT_ROUNDS = 6;
/** Round k: { text, want: { head, body, legs } }. Rounds 0-1 say it straight, 2-3 use "the same colour as" and "not", 4-5 an if-sentence. */
export function robotOrder(k, rnd = Math.random) {
  const C = ROBOT_COLOURS, pick = (not = []) => { const l = C.filter((c) => !not.includes(c)); return l[Math.floor(rnd() * l.length)]; };
  const head = pick(), legs = pick([head]);
  if (k < 2) { const body = pick([head, legs]); return { text: `Build a robot with a ${head} head, a ${body} body and ${legs} legs.`, want: { head, body, legs } }; }
  if (k < 4) { const same = rnd() < 0.5 ? 'head' : 'legs', body = same === 'head' ? head : legs; return { text: `The head is ${head}. The legs are ${legs}. The body is the same colour as the ${same}.`, want: { head, body, legs } }; }
  const body = pick([head, legs]), other = pick([head]), wrong = pick([body]);
  return { text: `The head is ${head}. If the head is ${head}, the body is ${body}. If the head is ${other}, the body is ${wrong}. The legs are not ${head}: they are ${legs}.`, want: { head, body, legs } };
}
export const robotRight = (want, got) => ROBOT_PARTS.every((p) => want[p] === got[p]);
