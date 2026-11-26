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
  // (24/11) two new people from the user's designs: the professor by the Village Hall (opens the word book) and the herbalist at the forest camp (potions)
  professor: { who: 'Professor Finn', file: 'npc_village_professor', at: [-4.6, -16, 0.35], region: 'village', role: 'book', lines: ['Good day! I am Professor Finn. I love words.', 'Open my word book and read the new words aloud. A good reader is a good explorer!'] },
  herbalist: { who: 'Hazel', file: 'npc_forest_herbalist', at: [-29.5, 50.5, 0.7], region: 'forest', shop: 'healer', lines: ['Hello, traveller! I am Hazel, the forest herbalist.'] },
  greengrocer: { who: 'Poppy', file: 'npc_lily_druid_v02', tint: { hair: '#f0b030', top: '#e8603a', bottom: '#fff0d0' }, at: [-9.4, 24.8, Math.PI / 2], region: 'village', role: 'produce', lines: ['Hello! I am Poppy. I sell fruit and vegetables.', 'Fresh apples, sweet oranges and green cabbages! Take a look.'] },
  forge: { who: 'Bram', file: 'npc_forge_blacksmith_v01', at: [6.2, -13.4, -0.5], shop: 'forge', lines: ['Clang, clang! I am Bram, the blacksmith. What would you like?'] },
  lily: { who: 'Lily', file: 'npc_lily_druid_v02', tint: { hair: '#e0702c', top: '#8cc25a', bottom: '#f0e6cc' }, at: [-12.5, 26.5, 1.2], lines: ['Hi! I am Lily. I look after the plants.', 'The flowers are happy today. Can you smell them?'] },
  rose: { who: 'Rose', file: 'npc_rose_baker_v02', tint: { hair: '#ee8a94', top: '#fbf6ec', bottom: '#c8352e' }, at: [5.8, -8.6, 0.6], shop: 'rose', lines: ['Hello! I am Rose. My bread is warm and soft. What would you like?'] },
  mia: { who: 'Mia', file: 'npc_mia_tailor_v01', tint: { hair: '#8a3d2a', top: '#f4ead8', bottom: '#7a4ab0' }, at: [9.5, 21.2, Math.PI], lines: ['Hi! I am Mia, the tailor. I make clothes and jewellery.', 'Come to the front of my stall and press E to try things on!'] },
  // (26/11) maps 4-7: in each land a keeper who tells its story and gives the daily word lesson, a merchant, and the owl (the review and the exam of that land)
  zara: { who: 'Zara', file: 'npc_desert_elder_v01', at: [-4, 36, 2.6], region: 'desert', role: 'keeper', lines: [] },
  omar: { who: 'Omar', file: 'npc_desert_merchant_v01', at: [6.5, 34.4, 0], region: 'desert', role: 'merchant', lines: ['Welcome, traveller! Good blades and cool water. Take a look!'] },
  bjorn: { who: 'Bjorn', file: 'npc_forge_blacksmith_v01', at: [-5, 34, 2.4], region: 'mountain', role: 'keeper', lines: [] },
  greta: { who: 'Greta', file: 'npc_forest_herbalist', at: [9, 26.4, 0], region: 'mountain', role: 'merchant', lines: ['Come in from the cold! I have warm armour and hot soup.'] },
  ada: { who: 'Professor Ada', file: 'npc_village_professor', at: [-5, 36, 2.6], region: 'ruins', role: 'keeper', lines: [] },
  milo: { who: 'Milo', file: 'npc_desert_smith_v01', at: [10, 30.4, 0], region: 'ruins', role: 'merchant', lines: ['I dig up old swords and make them shine again. Have a look!'] },
  aria: { who: 'Aria', file: 'npc_desert_guide_v01', at: [-4, 42, 2.8], region: 'sky', role: 'keeper', lines: [] },
  nimbus: { who: 'Nimbus', file: 'npc_desert_merchant_v01', at: [10, 44.4, 0], region: 'sky', role: 'merchant', lines: ['Sky-forged gear, light as a cloud! What would you like?'] },
  owl4: { who: 'Owl', file: 'npc_owl_v01', at: [5, 46, 3.4], region: 'desert', role: 'owl', lines: [] },
  owl5: { who: 'Owl', file: 'npc_owl_v01', at: [-8, 46, 2.6], region: 'mountain', role: 'owl', lines: [] },
  owl6: { who: 'Owl', file: 'npc_owl_v01', at: [-8, 50, 2.6], region: 'ruins', role: 'owl', lines: [] },
  owl7: { who: 'Owl', file: 'npc_owl_v01', at: [8, 54, 3.6], region: 'sky', role: 'owl', lines: [] },
  // (26/11, turn 63) maps 8-12 (the people borrow models of the game until each land has its own: see docs/YEU_CAU_MO_HINH_TRIPO.md)
  flora: { who: 'Flora', file: 'npc_lily_druid_v02', tint: { hair: '#f6a8d8', top: '#b8f0c0', bottom: '#fff2c0' }, at: [-5, 40, 2.6], region: 'fairy', role: 'keeper', lines: [] },
  thistle: { who: 'Thistle', file: 'npc_mia_tailor_v01', tint: { hair: '#6cbf5a', top: '#f6e0f0', bottom: '#8a5ab0' }, at: [9, 30.4, 0], region: 'fairy', role: 'merchant', lines: ['Petal blades and dew armour, fresh this morning! Have a look.'] },
  brann: { who: 'Brann', file: 'npc_forge_blacksmith_v01', at: [-6, 42, 2.4], region: 'volcano', role: 'keeper', lines: [] },
  cinder: { who: 'Cinder', file: 'npc_desert_smith_v01', at: [10, 38.4, 0], region: 'volcano', role: 'merchant', lines: ['Hot from the forge! Ember blades do not melt. What would you like?'] },
  opal: { who: 'Opal', file: 'npc_desert_guide_v01', at: [-5, 40, 2.6], region: 'crystal', role: 'keeper', lines: [] },
  flint: { who: 'Flint', file: 'npc_desert_merchant_v01', at: [10, 38.4, 0], region: 'crystal', role: 'merchant', lines: ['I cut these blades from the clearest crystals. Take a look!'] },
  nova: { who: 'Nova', file: 'npc_village_professor', at: [-5, 44, 2.6], region: 'city', role: 'keeper', lines: [] },
  bolt: { who: 'Bolt', file: 'npc_desert_smith_v01', at: [9, 46.4, 0], region: 'city', role: 'merchant', lines: ['Beep! Welcome, customer. Neon gear is on sale today.'] },
  luma: { who: 'Luma', file: 'npc_anna_bard_v02', tint: { hair: '#c8b0ff', top: '#fff0c0', bottom: '#b0a0f0' }, at: [-5, 44, 2.6], region: 'dream', role: 'keeper', lines: [] },
  dozy: { who: 'Dozy', file: 'npc_ben_merchant_v02', at: [9, 46.4, 0], region: 'dream', role: 'merchant', lines: ['Yawn… oh, hello! Starlight gear… very soft… very strong. Take a look.'] },
  owl8: { who: 'Owl', file: 'npc_owl_v01', at: [-9, 52, 2.6], region: 'fairy', role: 'owl', lines: [] },
  owl9: { who: 'Owl', file: 'npc_owl_v01', at: [-8, 54, 2.6], region: 'volcano', role: 'owl', lines: [] },
  owl10: { who: 'Owl', file: 'npc_owl_v01', at: [-8, 54, 2.6], region: 'crystal', role: 'owl', lines: [] },
  owl11: { who: 'Owl', file: 'npc_owl_v01', at: [8, 56, 3.6], region: 'city', role: 'owl', lines: [] },
  owl12: { who: 'Owl', file: 'npc_owl_v01', at: [8, 56, 3.6], region: 'dream', role: 'owl', lines: [] },
  anna: { who: 'Anna', file: 'npc_anna_bard_v02', tint: { hair: '#6b3a1e', top: '#3f6fc6', bottom: '#f4efe6' }, at: [-3.6, 7.6, 0.9], lines: ['Hi, I am Anna! I love singing in the square.', 'Listen… the river sings too. La la la!'] },
};

// Opening story (18/11: "a story introduction when a child first starts"). Original text; read aloud like every
// talk, with one Vietnamese line per page so a new player understands why the adventure starts.
export const OPENING = (name) => [
  { who: '📜 The Kingdom of Words', en: 'Long ago, the Kingdom of Words was full of colour. Every tree, every river and every house had its own name.', vi: 'Ngày xưa, Vương quốc Ngôn Từ rực rỡ sắc màu. Mọi cái cây, dòng sông, ngôi nhà đều có tên riêng.' },
  { who: '📜 The Kingdom of Words', en: 'The Language Compass kept all the words safe. The Word Keepers looked after it.', vi: 'La Bàn Ngôn Từ giữ cho mọi từ được an toàn. Hội Người Giữ Chữ bảo vệ nó.' },
  { who: '📜 The Kingdom of Words', en: 'But Lord Hush hates words. One night, he broke the Compass into twelve pieces and hid them in twelve lands.', vi: 'Nhưng Chúa tể Im Lặng ghét tiếng nói. Một đêm, hắn đập vỡ La Bàn thành 12 mảnh và giấu ở 12 vùng đất.' },
  { who: '📜 The Kingdom of Words', en: 'His Dark Wind blew the words away. The lands lost their colours, and gentle animals became angry monsters.', vi: 'Gió Đen của hắn thổi bay các từ. Vùng đất mất màu, con vật hiền lành hóa thành quái vật giận dữ.' },
  { who: '📜 The Kingdom of Words', en: `Mr Tom, the old village leader, wrote a letter to a brave young explorer: ${name}!`, vi: `Ông Tom, trưởng làng, viết thư mời một nhà thám hiểm trẻ dũng cảm: ${name}!` },
  { who: '📜 The Kingdom of Words', en: `${name}, learn the lost words, help the people, find the twelve pieces and stop Lord Hush. Your boat is going down the river to the Starter Village. The adventure begins!`, vi: `${name} ơi: học lại các từ đã mất, giúp mọi người, tìm đủ 12 mảnh La Bàn và chặn Chúa tể Im Lặng. Thuyền đang xuôi dòng tới Làng Khởi Đầu. Cuộc phiêu lưu bắt đầu!` },
];

// ---------------------------------------------------------------- (26/11) the keepers of maps 4-7
// Each land lost one KIND of words to the Dark Wind; the keeper tells it in two short pages (an easy line for grades 6-7, a longer
// one for grades 8-9), says where the boss is, and after the boss is beaten speaks with the words that came back.
export const LAND_TALK = {
  desert: { who: 'Zara', boss: 'boss5', lost: 'questions',
    easy: ['Welcome to the Golden Desert! I am Zara.', 'The Dark Wind took our questions. Nobody can ask "Where?" or "How much?" now.', 'The Sand Dragon has them in the Sun Temple, in the north. Get strong on the dunes first!'],
    hard: ['Welcome to the Golden Desert, Word Keeper. My name is Zara, and I look after this oasis.', 'The Dark Wind has stolen our questions. Nobody here can ask where the water is or how much anything costs.', 'The Sand Dragon is keeping them in the Sun Temple to the north. You should train on the dunes before you go there.'],
    vi: ['Bà Zara, người giữ ốc đảo.', 'Gió Đen lấy mất các CÂU HỎI của sa mạc: không ai hỏi được "Ở đâu?", "Bao nhiêu?".', 'Rồng Cát giữ mảnh La Bàn ở Đền Mặt Trời (phía Bắc, cấp 24). Bảng săn ở cạnh cổng, cửa hàng của Omar trong chợ, Cú Mèo đậu gần cổng.'],
    after: ['Where are you going next? How are you? Ha! I can ask again. Thank you, Word Keeper!', 'Bà Zara lại hỏi được rồi! Mảnh La Bàn đang chỉ về Núi tuyết.'] },
  mountain: { who: 'Bjorn', boss: 'boss6', lost: 'comparisons',
    easy: ['Hello! I am Bjorn. Welcome to the Snowy Peaks.', 'The Dark Wind took our comparing words. Is this road safer? Is that peak higher? We cannot say!', 'The Ice Dragon sleeps on the summit, in the north. Follow the valley road.'],
    hard: ['Good to see you! I am Bjorn, and this is the lodge of the Snowy Peaks.', 'The Dark Wind has taken our comparing words, so nobody can say which path is safer or which peak is the highest.', 'The Ice Dragon is sleeping on the summit. Follow the valley road north, and take the warmest armour you can find.'],
    vi: ['Bác Bjorn, chủ nhà nghỉ trên núi.', 'Gió Đen lấy mất các LỜI SO SÁNH: không ai nói được đường nào an toàn hơn, đỉnh nào cao nhất.', 'Rồng Băng ngủ trên đỉnh núi (phía Bắc, cấp 29). Đi theo đường thung lũng; bảng săn ở cạnh cổng, cửa hàng của Greta cạnh lửa trại.'],
    after: ['This peak is the highest, and you are the bravest! Listen to that, I can compare again!', 'Bác Bjorn lại so sánh được rồi! Mảnh La Bàn đang chỉ về Di tích cổ.'] },
  ruins: { who: 'Professor Ada', boss: 'boss7', lost: 'stories',
    easy: ['Hello! I am Professor Ada. I study these old ruins.', 'The Dark Wind took the stories. The walls do not remember what happened here.', 'The Stone Giant stands at the vault door, in the north. Walk along the old streets.'],
    hard: ['Good day! I am Professor Ada, and I have been studying these ruins for years.', 'The Dark Wind has taken every story, so the walls no longer remember what happened here long ago.', 'The Stone Giant is guarding the vault door at the north end of the main street. Be careful, it has been there for centuries.'],
    vi: ['Giáo sư Ada, người nghiên cứu di tích.', 'Gió Đen lấy mất các CÂU CHUYỆN đã qua: những bức tường không còn nhớ ngày xưa đã xảy ra chuyện gì.', 'Người Khổng Lồ Đá đứng ở cửa hầm phía Bắc (cấp 34). Đi theo các con phố cũ; bảng săn và quầy của Milo ở cạnh trại.'],
    after: ['Long ago, children studied here. One of them was called Hugh… I can tell stories again!', 'Giáo sư Ada lại kể được chuyện ngày xưa. Cậu bé Hugh trong chuyện là ai nhỉ? Mảnh La Bàn chỉ lên trời.'] },
  sky: { who: 'Aria', boss: 'boss8', lost: 'wishes',
    easy: ['Hi! I am Aria. Welcome to the Sky Kingdom!', 'The Dark Wind took our wishes. Nobody can say what they will do tomorrow.', 'The Sun Dragon is in the Sun Arena, in the north. Walk round the Cloud Palace.'],
    hard: ['Hi there! I am Aria, and I ring the wind bells of the Sky Kingdom.', 'The Dark Wind has taken our wishes, so nobody can say what they will do tomorrow or what they hope for.', 'The Sun Dragon is waiting in the Sun Arena at the north end of the island. Take the ring road round the Cloud Palace.'],
    vi: ['Aria, người rung chuông gió.', 'Gió Đen lấy mất các LỜI ƯỚC: không ai nói được ngày mai mình sẽ làm gì.', 'Rồng Mặt Trời ở Đấu trường Mặt Trời (phía Bắc, cấp 44). Đi theo đường vòng quanh Cung điện Mây; bảng săn và quầy của Nimbus ở cạnh cổng trời.'],
    after: ['Tomorrow I will ring every bell in the sky! I hope you will come back. I can wish again!', 'Aria lại nói được điều mình mong ước. Bảy mảnh La Bàn đã về tay con!'] },
  // (26/11, turn 63) maps 8-12
  fairy: { who: 'Flora', boss: 'boss9', lost: 'commands',
    easy: ['Hello, hello! I am Flora. Welcome to Fairy Isle!', 'The Dark Wind took our game words. Nobody can say "Run!", "Jump!" or "Do not stop!". The fairy games cannot start.', 'The Thorn Queen has them in the Thorn Garden, in the north. Take the left road or the right road: they meet again.'],
    hard: ['Hello there! I am Flora, and I look after the fairy games of this island.', 'The Dark Wind has taken our game words, so nobody can shout "Ready, steady, go!" and the festival could not start yesterday.', 'The Thorn Queen is keeping them in the Thorn Garden to the north. Both roads lead there, so choose whichever looks safer.'],
    vi: ['Tiên Flora, người trông coi lễ hội trò chơi.', 'Gió Đen lấy mất các LỜI HÔ, LỜI NHẮC: không ai nói được "Chạy đi!", "Đừng dừng lại!", nên lễ hội không bắt đầu được.', 'Nữ hoàng Gai giữ mảnh La Bàn ở Vườn Gai (phía Bắc, cấp 49). Hai nhánh đường hình chiếc lá gặp lại nhau ở đó; bảng săn ở cạnh cổng, quầy của Thistle trong làng nấm.'],
    after: ['Ready, steady, go! Run! Jump! Oh, I love saying that. We played all day yesterday!', 'Tiên Flora lại hô được hiệu lệnh. Mảnh La Bàn đang chỉ về Núi lửa.'] },
  volcano: { who: 'Brann', boss: 'boss10', lost: 'warnings',
    easy: ['Stop! Mind the lava. I am Brann, the fire-watcher.', 'The Dark Wind took our warnings. When the mountain shakes, I cannot shout "Watch out!"', 'The Magma Titan stands at the Fire Gate, in the north. The road zigzags between the lava pools.'],
    hard: ['Careful where you step! I am Brann, and I have been watching Fire Mountain for thirty years.', 'The Dark Wind has taken our warnings. The ground was shaking last night, and I could not shout "Watch out!" to anyone.', 'The Magma Titan is standing at the Fire Gate in the north. Follow the zigzag road, and stay away from the lava pools.'],
    vi: ['Chú Brann, người canh lửa.', 'Gió Đen lấy mất các LỜI CẢNH BÁO: núi rung mà không ai hô được "Coi chừng!".', 'Người Khổng Lồ Dung Nham đứng ở Cổng Lửa (phía Bắc, cấp 54). Đường zíc zắc giữa các hồ dung nham (không lội qua được); bảng săn cạnh cổng, quầy của Cinder cạnh lửa trại.'],
    after: ['Watch out! Mind your head! Ha ha, I can warn people again. Fire Mountain was sleeping when you arrived, thanks to you.', 'Chú Brann lại cảnh báo được mọi người. Mảnh La Bàn đang chỉ xuống Hang tinh thể.'] },
  crystal: { who: 'Opal', boss: 'boss11', lost: 'messages',
    easy: ['Hi! I am Opal. I am a miner, like my mum.', 'The Dark Wind made the echo crystals silent. We cannot send messages to our friends far away.', 'The Crystal Dragon is in the Dragon\'s Hollow, in the north. Walk round the Glow Lake first.'],
    hard: ['Hi! I am Opal, the youngest miner in the Crystal Cave.', 'The Dark Wind has silenced the echo crystals, so we can no longer send messages to people who live far away.', 'The Crystal Dragon is sleeping in the Dragon\'s Hollow at the end of the north tunnel. I think it will wake up if you go near.'],
    vi: ['Opal, cô thợ mỏ nhỏ tuổi.', 'Gió Đen làm các tinh thể vọng im bặt: không ai gửi được LỜI NHẮN cho người ở xa.', 'Rồng Pha Lê ở Hốc Rồng (phía Bắc, cấp 59). Đi vòng quanh Hồ Phát Sáng, mỗi đường hầm dẫn tới một khoang; bảng săn cạnh cổng, quầy của Flint ở trại.'],
    after: ['Hello, Mum? I will be home at six! It works! In the future, everyone will talk through crystals.', 'Opal lại gửi được lời nhắn qua tinh thể. Mảnh La Bàn đang chỉ về Thành phố tương lai.'] },
  city: { who: 'Nova', boss: 'boss12', lost: 'ideas',
    easy: ['Welcome to the Future City! I am Nova. I make robots.', 'The Dark Wind took our "if". Nobody can say "If we try, we will do it". So nobody invents anything!', 'The Iron Warden is in the control centre, in the north. Go round the Solar Tower.'],
    hard: ['Welcome to the Future City! I am Nova, and I invented most of the helper robots you can see.', 'The Dark Wind has taken the word "if", so no one can say "If we try again, it will work". The inventors have stopped inventing.', 'The Iron Warden has locked itself in the control centre at the north end of the main avenue. If you beat it, the robots will be friendly again.'],
    vi: ['Nova, nhà phát minh robot.', 'Gió Đen lấy mất chữ "NẾU": không ai nói được "Nếu thử, ta sẽ làm được", nên chẳng ai phát minh gì nữa.', 'Người Máy Canh Gác ở Trung tâm điều khiển (phía Bắc, cấp 64). Đi theo đại lộ, vòng qua Tháp Năng Lượng Mặt Trời; bảng săn và quầy của robot Bolt ở cạnh nhà ga.'],
    after: ['If we plant more trees, the city will be greener. If you visit again, I will show you my new robot!', 'Nova lại nói được "Nếu… thì…". Mảnh La Bàn chỉ về nơi cuối cùng: Vương quốc mộng mơ.'] },
  dream: { who: 'Luma', boss: 'boss13', lost: 'dreams',
    easy: ['Shh… hello. I am Luma. I weave the dreams.', 'The Dark Wind took the dreams. Nobody can say "I can" or "the best day of my life".', 'Lord Hush is at the Silent Door of the Star Castle, in the north. The roads make a star. He was a boy called Hugh once.'],
    hard: ['Shh… welcome. I am Luma, and I weave every dream in this kingdom.', 'The Dark Wind has taken the dreams, so nobody can say what they can do or what the happiest day of their life was.', 'Lord Hush is waiting at the Silent Door of the Star Castle. He asked me whether you were coming. I think he wants to be found.'],
    vi: ['Luma, người dệt giấc mơ.', 'Gió Đen lấy mất các GIẤC MƠ: không ai nói được "Mình làm được" hay "ngày vui nhất".', 'Chúa tể Im Lặng đứng ở Cánh Cửa Im Lặng trước Lâu đài Ngôi Sao (phía Bắc, cấp 69). Các con đường vẽ thành hình ngôi sao; bảng săn và quầy của Dozy ở cạnh cổng.'],
    after: ['This is the happiest day of my life! Hugh told me that he could speak again. You can do anything, Word Keeper.', 'Luma lại dệt được giấc mơ. Cả 12 mảnh La Bàn đã về: La Bàn Ngôn Từ lành lại!'] },
};
