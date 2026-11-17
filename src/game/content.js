// Original quest texts for "Echoes of the Forest" (Chapter II opening), one version per grade.
// English is the language being learned; Vietnamese appears only in hint levels 3-4 and for controls.
// key = the phrase that hint level 2 highlights. Grade 6 clues name the place; grade 9 clues paraphrase it.
export const CLUES = {
  waterfall: {
    6: ['The crystal is near the waterfall.', 'waterfall'],
    7: ['Walk north along the river until you see the waterfall.', 'waterfall'],
    8: ["I don't fancy getting wet, but the crystal is hiding beside the waterfall.", 'waterfall'],
    9: ['If I were you, I would search where the river falls from the cliff.', 'the river falls from the cliff'],
  },
  cave: {
    6: ['Look for the crystal at the cave.', 'cave'],
    7: ['Go east. The crystal is in front of a dark cave.', 'cave'],
    8: ['I love exploring! Follow the eastern path to the cave with blue lights.', 'cave'],
    9: ['It lies at the mouth of a hole in the rock, which glows blue in the dark.', 'a hole in the rock'],
  },
  camp: {
    6: ['The crystal is at the camp, next to the tent.', 'camp'],
    7: ['Somebody is cooking at the camp. Look near the fire.', 'camp'],
    8: ['Travellers enjoy sleeping outdoors at the camp. Check beside their fire.', 'camp'],
    9: ['Look where travellers put up a tent and spend the night outdoors.', 'put up a tent'],
  },
  bridge: {
    6: ['Go to the bridge in the south.', 'bridge'],
    7: ['Cross the river on the wooden bridge in the south.', 'bridge'],
    8: ['After you cross the southern bridge, look on your right.', 'bridge'],
    9: ['It is waiting at the end of the wooden thing that carries the path over the river in the south.', 'carries the path over the river'],
  },
  mushroom: {
    6: ['The crystal is under a big red mushroom.', 'mushroom'],
    7: ['Find the red mushrooms. They are taller than you!', 'mushrooms'],
    8: ['I adore those giant mushrooms with white dots. Look between them.', 'mushrooms'],
    9: ['Search among the plants that look like huge red umbrellas with white spots.', 'huge red umbrellas'],
  },
  tower: {
    6: ['Go up the hill to the tower.', 'tower'],
    7: ['Climb the hill in the north-east. The crystal is at the tower.', 'tower'],
    8: ['The guard prefers watching the forest from the tower on the hill.', 'tower'],
    9: ['It was left at the foot of the tall wooden building from which guards watch the forest.', 'tall wooden building'],
  },
  cottage: {
    6: ['The crystal is at the cottage with a red roof.', 'cottage'],
    7: ['A woodcutter lives in a small cottage in the west. Look there.', 'cottage'],
    8: ["The woodcutter doesn't mind visitors. Try the garden of his cottage.", 'cottage'],
    9: ['Try the garden of the small house in the west, where firewood is piled up outside.', 'small house'],
  },
  ruins: {
    6: ['Find the old ruins in the north-west.', 'ruins'],
    7: ['There are old stone ruins on a hill in the north-west.', 'ruins'],
    8: ['Nobody lives in the ruins any more, but a crystal still shines there.', 'ruins'],
    9: ['It rests among the broken stones of a building that was built long ago.', 'broken stones of a building'],
  },
};
export const DEFINITIONS = {
  waterfall: 'water that falls from a high place', cave: 'a big hole in a rock or a mountain',
  camp: 'a place with tents where people sleep outdoors', bridge: 'you walk on it to cross a river',
  mushroom: 'it looks like a small umbrella and grows in the forest', tower: 'a tall, narrow building',
  cottage: 'a small house in the countryside', ruins: 'broken parts of very old buildings',
};
export const TOM_INTRO = (name) => [
  { who: 'Tom', en: `Welcome to the forest, ${name}! Five crystals are hiding here.` },
  { who: 'Pip', en: "Hi! I'm Pip. Follow my clues and find them!", vi: 'Đi tới viên pha lê Pip nhắc đến rồi nhấn E. Nhấn H khi cần gợi ý. Bấm vào bản đồ nhỏ để tự đi.' },
];
export const SAM_LINES = [
  { who: 'Sam', en: 'Hello! I am cooking fish soup.' },
];

// "Fix the Bridge" (Chapter I, after Ben's market). Original texts for grades 6-9;
// another grade is told the plan is not written yet and the bridge opens by itself (nothing borrowed).
// need: what Sam asks for. items: the right object and its look-alike decoy, with the line Sam says when the
// decoy is picked. plan: Pip reads it, then asks the steps in order (options never carry First/Next words).
export const BRIDGE = {
  6: {
    need: [
      { who: 'Sam', en: 'Oh no! The storm broke the bridge.' },
      { who: 'Sam', en: 'We need a rope, a log and an axe. Ben has an axe.', vi: 'Tìm sợi dây thừng và khúc gỗ gần đường đi, xin Ben cái rìu.' },
    ],
    items: {
      rope: { en: 'rope', vi: 'dây thừng', decoy: 'chain', wrong: 'That is a chain. It is too heavy. We need a rope.', wrongVi: 'chain = dây xích. Rope = dây thừng (mềm, bằng sợi).' },
      log: { en: 'log', vi: 'khúc gỗ', decoy: 'boulder', wrong: 'That is a big rock. We cannot cut a rock! We need a log.', wrongVi: 'rock = hòn đá. Log = khúc gỗ (thân cây đã đốn).' },
    },
    plan: [
      { who: 'Pip', en: 'I can read the plan! First, cut the log with the axe.' },
      { who: 'Pip', en: 'Next, put the log across the river. Then, tie the log with the rope.' },
      { who: 'Pip', en: 'Finally, walk across slowly. Now, tell me the steps!' },
    ],
    steps: ['Cut the log with the axe.', 'Put the log across the river.', 'Tie the log with the rope.', 'Walk across slowly.'],
    ask: ['What do we do first?', 'What do we do next?', 'And then?', 'What do we do last?'],
    hint: 'Đọc lại lời Pip: First → Next → Then → Finally.',
  },
  // Grade 7, Unit 1 Hobbies: present simple for habits, liking verbs + V-ing (not yet checked against the book)
  7: {
    need: [
      { who: 'Sam', en: 'Oh no! The storm broke the bridge. People cannot go to the market now.' },
      { who: 'Sam', en: 'We need a rope, a log and an axe. Ben has an axe at his stall.', vi: 'Tìm sợi dây thừng và khúc gỗ gần đường đi, xin Ben cái rìu.' },
    ],
    items: {
      rope: { en: 'rope', vi: 'dây thừng', decoy: 'chain', wrong: 'That is a chain. It is too heavy to tie. We need a rope.', wrongVi: 'chain = dây xích. Rope = dây thừng (mềm, bằng sợi).' },
      log: { en: 'log', vi: 'khúc gỗ', decoy: 'boulder', wrong: 'That is a big rock. Nobody can cut a rock! We need a log.', wrongVi: 'rock / boulder = tảng đá. Log = khúc gỗ.' },
    },
    plan: [
      { who: 'Pip', en: 'I can read the plan! Sam enjoys chopping wood, so first, he cuts the log with the axe.' },
      { who: 'Pip', en: 'Next, we put the log across the river. Then, I tie it with the rope. I love tying knots!' },
      { who: 'Pip', en: 'Finally, everybody walks across slowly. Now, tell me the steps!' },
    ],
    steps: ['Cut the log with the axe.', 'Put the log across the river.', 'Tie the log with the rope.', 'Walk across slowly.'],
    ask: ['What do we do first?', 'What do we do next?', 'And then?', 'What do we do last?'],
    hint: 'Đọc lại lời Pip: First → Next → Then → Finally. (enjoy / love + V-ing: chopping, tying)',
  },
  8: {
    need: [
      { who: 'Sam', en: "I'm afraid the storm has broken the bridge." },
      { who: 'Sam', en: "We'll need a strong rope, a long log and a sharp axe. Ben keeps an axe at his market.", vi: 'Tìm dây thừng và khúc gỗ gần đường đi; rìu ở chỗ Ben.' },
    ],
    items: {
      rope: { en: 'rope', vi: 'dây thừng', decoy: 'chain', wrong: "That's a metal chain. It's far too heavy to tie a log with.", wrongVi: 'chain = dây xích kim loại. Rope = dây thừng.' },
      log: { en: 'log', vi: 'khúc gỗ', decoy: 'boulder', wrong: "That's a boulder, not a log. You can't build a bridge with a rock you can't even lift!", wrongVi: 'boulder = tảng đá lớn. Log = khúc gỗ.' },
    },
    // Unit 1 grade 8 grammar: verbs of liking + V-ing (love, enjoy, fancy, don't mind, hate…). The order of the
    // steps still comes from First / Next / Then / Finally; the liking verbs say who does which job.
    plan: [
      { who: 'Pip', en: "I can read the plan! Sam loves chopping wood, so first, he'll cut the log to the right length." },
      { who: 'Pip', en: "You don't mind carrying heavy things, so next, you'll put the log across the river. I enjoy tying knots, so then I'll tie the log to the posts." },
      { who: 'Pip', en: "Nobody fancies falling into the river! Finally, we'll test the bridge carefully. Can you put the steps in order?" },
    ],
    steps: ['Cut the log to the right length.', 'Put the log across the river.', 'Tie the log to the posts.', 'Test the bridge carefully.'],
    ask: ['Which step comes first?', 'What happens after that?', 'And then?', 'What do we do last?'],
    hint: 'Đọc lại lời Pip: First → Next → Then → Finally. (love / enjoy / don\'t mind / fancy + V-ing: chopping, carrying, tying, falling)',
  },
  // Grade 9, Unit 1 Local community: question words + to-infinitive, phrasal verbs (not yet checked against the book)
  9: {
    need: [
      { who: 'Sam', en: "The storm has broken the bridge, so the villagers can't get to the market." },
      { who: 'Sam', en: "We've run out of materials: we need a rope, a log and an axe. Ben will hand over his axe if you help him.", vi: 'Tìm dây thừng và khúc gỗ gần đường đi; giúp Ben thì Ben đưa rìu.' },
    ],
    items: {
      rope: { en: 'rope', vi: 'dây thừng', decoy: 'chain', wrong: "That's a metal chain. It's far too heavy to tie a log with.", wrongVi: 'chain = dây xích kim loại. Rope = dây thừng.' },
      log: { en: 'log', vi: 'khúc gỗ', decoy: 'boulder', wrong: "That's a boulder, not a log. Nobody knows how to build a bridge out of a rock!", wrongVi: 'boulder = tảng đá lớn. Log = khúc gỗ.' },
    },
    plan: [
      { who: 'Pip', en: "I've found the builders' old plan! It tells us what to do first: cut the log to the right length with the axe." },
      { who: 'Pip', en: "Next, we put the log across the river. Then, the plan shows where to tie it: to the two posts, with the rope." },
      { who: 'Pip', en: "Finally, we must decide when to let people cross: only after we have tested it carefully. Can you put the steps in order?" },
    ],
    steps: ['Cut the log to the right length.', 'Put the log across the river.', 'Tie the log to the posts.', 'Test the bridge carefully.'],
    ask: ['What should we do first?', 'What comes after that?', 'And then?', 'What must we do before anyone crosses?'],
    hint: 'Đọc lại lời Pip: first → next → then → finally. (what / where / when + to V: what to do, where to tie, when to let)',
  },
};
/** Where the bridge things lie in the Starter Village (x, z). Decoys sit next to the path too. */
export const BRIDGE_SPOTS = { rope: [7, 43.5], chain: [10.5, 36.6], log: [-6, 36.5], boulder: [2.5, 44.5], sam: [12.6, 42.6], pip: [13.5, 37.5] };

// Friends in the Starter Village (original lines, simple English for every grade).
export const FRIENDS = {
  forge: { who: 'Bram', file: 'npc_forge_blacksmith_v01', at: [6.2, -13.4, -0.5], shop: 'forge', lines: ['Clang, clang! I am Bram, the blacksmith. What would you like?'] },
  lily: { who: 'Lily', file: 'npc_lily_druid_v01', at: [-12.5, 26.5, 1.2], lines: ['Hi! I am Lily. I look after the plants.', 'The flowers are happy today. Can you smell them?'] },
  rose: { who: 'Rose', file: 'npc_rose_baker_v01', at: [5.8, -8.6, 0.6], shop: 'rose', lines: ['Hello! I am Rose. My bread is warm and soft. What would you like?'] },
  anna: { who: 'Anna', file: 'npc_anna_bard_v01', at: [-3.6, 7.6, 0.9], lines: ['Hi, I am Anna! I love singing in the square.', 'Listen… the river sings too. La la la!'] },
};
