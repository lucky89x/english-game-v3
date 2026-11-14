# Game design

**Premise.** The Language Compass broke into pieces; each region lost part of its words. Ngọc uses English to understand, find and repair.

## Implemented: Chapter I opening in the Starter Village (10–15 min)
1. Arrival: Tom welcomes Ngọc in the square (English).
2. **The Lost Letter**: the letter lies at the hall door; Ngọc reads it in English (text from the grade's own curriculum file) and answers one question. A wrong answer shows the Vietnamese hint and asks again. Grades without a letter are told so and continue.
3. **Ben's Word Jars**: five travellers ask for a word in English; Ngọc walks to the jar with the right meaning and presses E. A wrong jar is named by the traveller. Due review words are asked first.
4. Tom opens the forest gate (north-west); Pip waits there. The gate is a real exit: E travels to the forest and back.
Map: square with a well, Tom's hall, shop, two cottages, market stall, river with two bridges, dock with a boat, farm with a scarecrow, orchard, forest gate.

## Implemented: "Echoes of the Forest" (Forest of Memories, 10–15 min)
1. Tom at the gate explains (English, 4 lines) and introduces Pip.
2. Pip gives 5 clues, one at a time, in English. Each names or paraphrases one of 8 landmarks (waterfall, cave, camp, bridge, mushrooms, tower, cottage, ruins). A crystal glows at every landmark, so the wrong ones are natural decoys.
3. Right crystal: gold (5 / 4 / 3 / 1 by hints used; 1 after a wrong guess), next clue. Wrong crystal: Pip says what that place is and repeats the clue; the miss is recorded.
4. Five found: carry them to the ancient tree. The tree asks three of the words by English definition (review challenge).
5. Ending: a compass piece points to the Golden Wind Desert.
Optional: Sam at the camp tells a short story.

## Controls
WASD, Shift, Space, E, H (hint), left-drag orbit 360°, wheel zoom, minimap click-to-travel (A*, WASD cancels), F3 perf.

## Not implemented yet
Rest of Chapter I (bridge repair with Sam and Pip, footprints, language symbol, festival, chapter review); interiors; a traveller model at the market; Lily, Rose, Anna; NPC schedules; collectibles; listening and speaking tasks. Chapters III–VIII exist as one-line outlines in `src/game/content.js`.
