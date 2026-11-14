# Learning design

- **Separation.** Curriculum data (`data/learning`, `core/catalog.js`) · story/quest state (`profile.quests`, `profile.flags`) · student progress (`profile.words`, `profile.skills`) · review scheduling (`core/review.js`).
- **Grades.** Each clue has four authored versions: grade 6 names the place in a short sentence; grade 7 adds direction; grade 8 uses natural dialogue with liking verbs; grade 9 paraphrases (the place word is absent, the child infers). A grade with no authored clue shows "chưa được soạn"; content of another grade is never substituted. Word ids come from the child's own grade when the word is in that curriculum (e.g. `g6_u05:waterfall`), otherwise `forest:<word>`.
- **Progressive support (H).** 0 English + the visible world → 1 keyword highlighted → 2 Vietnamese meaning of the keyword → 3 star on the minimap. After a wrong crystal: what this place is, in both languages, plus the clue again. Vietnamese otherwise appears only for controls.
- **No reward for guessing.** A wrong touch sends the word to box 0 and caps the reward at 1 gold.
- **Tracked per word:** seen, right, wrong, first-try count, hints, last response time, last day, next due day, box. Per skill (reading, vocabulary): attempts, correct, first-try, hints.
- **Spaced repetition:** boxes 0–6 = 0, 1, 2, 4, 7, 15, 30 days. Wrong → box 0. Right with a hint → box 1. Right without help → one box up.
- **Not built yet:** due words are stored but no later encounter asks for them again; listening (audio with replay/slow), speaking, sentence building, buying/selling.
