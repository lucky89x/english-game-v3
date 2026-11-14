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
  { who: 'Tom', en: `Welcome to the Forest of Memories, ${name}!` },
  { who: 'Tom', en: 'The forest has lost its words. Five memory crystals are hiding here.' },
  { who: 'Tom', en: 'This is Pip. Pip will tell you where to look. Read carefully!' },
  { who: 'Pip', en: "Hi! I'm Pip. Follow my clues and find the crystals!", vi: 'Đi tới viên pha lê Pip nhắc đến rồi nhấn E. Nhấn H khi cần gợi ý. Bấm vào bản đồ nhỏ để tự đi.' },
];
export const SAM_LINES = [
  { who: 'Sam', en: 'Hello! I am cooking fish soup. The forest is quiet today.' },
  { who: 'Sam', en: 'Long ago, every tree here had a name. Now the words are gone.' },
];
export const OUTLINE = [
  'I. The Starter Village — lost letter, word jars, the broken bridge (Godot build; web port is the next batch).',
  'II. Forest of Memories — the forest forgot its words; memory crystals, the ancient tree, the first compass piece.',
  'III. Golden Wind Desert — traders speak in riddles; directions, numbers and bargaining across the oasis.',
  'IV. Echo Mountains — echoes repeat only what is said clearly; listening and pronunciation trials.',
  'V. Ocean Harbor — letters from overseas; reading schedules, writing replies, helping sailors.',
  'VI. Academy of Knowledge — the library is out of order; grammar as magic that repairs sentences.',
  'VII. Future City — machines misunderstand people; giving precise instructions and explanations.',
  'VIII. Star Island and the Crystal Tower — all pieces join; a final adventure using every skill.',
];
