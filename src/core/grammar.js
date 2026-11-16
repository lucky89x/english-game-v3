// Short grammar checks for the owl's knowledge gates at levels 10, 15 and 20 (N5). Sentences are original and follow
// the grammar line of the unit's data file. Only units listed here have them; other units ask words only.
// q: sentence with ___, options: forms of the same word, a: index of the right one, why: one-line Vietnamese reason.
export const GRAMMAR = {
  g6_u01: [
    { q: 'My brother ___ to school by bike every day.', options: ['rides', 'ride', 'is riding'], a: 0, why: 'every day → hiện tại đơn; he/she/it thêm -s.' },
    { q: 'Look! The students ___ football in the yard.', options: ['play', 'are playing', 'plays'], a: 1, why: 'Look! → việc đang xảy ra: am/is/are + V-ing.' },
    { q: 'We ___ English on Mondays and Fridays.', options: ['are having', 'has', 'have'], a: 2, why: 'on Mondays (thói quen) → hiện tại đơn; we + have.' },
    { q: 'Listen! Mai ___ the piano in the music room.', options: ['is playing', 'plays', 'play'], a: 0, why: 'Listen! → đang xảy ra: is + V-ing.' },
    { q: 'She usually ___ her homework after dinner.', options: ['do', 'does', 'is doing'], a: 1, why: 'usually → hiện tại đơn; she + does.' },
    { q: 'I ___ a letter to my pen friend now.', options: ['write', 'writes', 'am writing'], a: 2, why: 'now → hiện tại tiếp diễn: I am + V-ing.' },
  ],
  g8_u01: [
    { q: 'My sister enjoys ___ comics in her free time.', options: ['reading', 'to read', 'read'], a: 0, why: 'enjoy + V-ing.' },
    { q: "I don't mind ___ the dishes after dinner.", options: ['to wash', 'washing', 'wash'], a: 1, why: "don't mind + V-ing." },
    { q: 'Do you fancy ___ to the cinema tonight?', options: ['go', 'to go', 'going'], a: 2, why: 'fancy + V-ing.' },
    { q: 'He detests ___ up early at weekends.', options: ['getting', 'to get', 'gets'], a: 0, why: 'detest + V-ing.' },
    { q: 'Nam is keen ___ making models of ships.', options: ['in', 'on', 'at'], a: 1, why: 'be keen on + V-ing.' },
    { q: 'My parents are interested ___ growing vegetables.', options: ['in', 'on', 'with'], a: 0, why: 'be interested in + V-ing.' },
  ],
};
/** Levels whose owl gate also asks two grammar questions. */
export const GRAMMAR_GATES = [10, 15, 20];
/** Picks n grammar items for a grade and unit (shuffled with rnd); [] when the unit has none written. */
export function grammarFor(grade, unit, n = 2, rnd = Math.random) {
  const list = GRAMMAR[`g${grade}_u${String(unit).padStart(2, '0')}`] || [];
  return [...list].sort(() => rnd() - 0.5).slice(0, n);
}
