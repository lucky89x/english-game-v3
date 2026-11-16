# Game design

**Premise.** The Language Compass broke into pieces; each region lost part of its words. Ngọc uses English to understand, find and repair.

## Implemented: Chapter I opening in the Starter Village (10–15 min)
1. Arrival: Tom welcomes Ngọc in the square (English).
2. **The Lost Letter**: the letter lies at the hall door; Ngọc reads it in English (text from the grade's own curriculum file) and answers one question. A wrong answer shows the Vietnamese hint and asks again. Grades without a letter are told so and continue.
3. **Ben's Word Jars**: five travellers ask for a word in English; Ngọc walks to the jar with the right meaning and presses E. A wrong jar is named by the traveller. Due review words are asked first.
4. **Fix the Bridge**: Tom says the storm broke the south bridge (its middle is water: no walking, the minimap goes round by the village bridge). Sam at the bridge head asks in English for a rope, a log and an axe. Rope and log lie near the path next to look-alikes (metal chain, boulder); picking a look-alike makes Sam explain the word, nothing is taken, the miss is recorded. Ben trades his axe for one more market round. Pip reads the repair plan, then asks the steps one by one (options have no First/Next words; grade 8 uses before / once / until). A wrong order shows the Vietnamese hint. In order: the bridge is repaired. Only grades 6 and 8 are written; grades 7 and 9 are told so and the bridge opens by itself.
5. Tom opens the forest gate (north-west); Pip waits there. The gate is a real exit: E travels to the forest and back.
Map: square with a well, Tom's hall, shop, two cottages, market stall, river with the village bridge and the broken south bridge, dock with a boat, farm with a scarecrow, orchard, forest gate.

## Implemented: "Echoes of the Forest" (Forest of Memories, 10–15 min)
1. Tom at the gate explains (English, 4 lines) and introduces Pip.
2. Pip gives 5 clues, one at a time, in English. Each names or paraphrases one of 8 landmarks (waterfall, cave, camp, bridge, mushrooms, tower, cottage, ruins). A crystal glows at every landmark, so the wrong ones are natural decoys.
3. Right crystal: gold (5 / 4 / 3 / 1 by hints used; 1 after a wrong guess), next clue. Wrong crystal: Pip says what that place is and repeats the clue; the miss is recorded.
4. Five found: carry them to the ancient tree. The tree asks three of the words by English definition (review challenge).
5. Ending: a compass piece points to the Golden Wind Desert.
Optional: Sam at the camp tells a short story.

## Controls
WASD, Shift, Space, E, J/F, K, Q, H (hint), left-drag orbit 360°, wheel zoom, minimap click-to-travel (A*, WASD cancels), F3 perf. Tablets: joystick and buttons (src/ui/touch.js), one-finger turn, pinch zoom.

## Implemented: play loop of Map 1 (see MAP1_PLAN.md for status)
- **Level, health, gear**: EXP from everything; levels 1-20 take 9,405 EXP (about 8-10 hours). Levels 5/10/15/20 wait for the owl's word review (gates 10/15/20 add two grammar questions of the unit). Bram sells swords and armour, Rose sells a charm and honey bread (Q). The worn sword shows in Ngọc's hand.
- **Wild Meadow** (north-east): green and red slimes, stone golems; J/F attack, K dodge roll; fainting returns to the square with no loss. Quest board gives hunting jobs in English. From level 8 the Slime King appears, from level 18 the Ancient Golem in the golem fields; their three word shields break only when the child picks the right English word. Beating the golem at level 20 opens Map 2 (the unit moves to Unit 2; a parent can also pick the school unit in the settings bar).
- **Word chests**: spell a unit word from letter tiles; once a day each; feeds spaced review.
- **Games with no English**: fishing, apple catch, ring race, twelve stars, Candy Match, Slingshot, Falling Blocks, Pumpkin Cart Race. Small gold and EXP: full pay for the first three games of each kind per day, then 20%. Best scores per child.

## Not implemented yet
Monsters and boss of Map 2, inventory screen, armour visible on the body, interiors, listening and speaking tasks, maps 3–10 (see the ten-map table in MAP1_PLAN.md).
