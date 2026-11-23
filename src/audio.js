// Web Audio synth: no audio files, nothing copyrighted. Starts on the first user gesture.
// - sfx(name): short sounds (ticks, hits, spell sounds per element, explosions, thunder).
// - Music (21/11: "light background music in the game, its own tune for each mini game"): a small step sequencer plays
//   original loops written here (chords, bass, drums, a lead) in several styles: the village, the forest, the harbour,
//   the island, the home, each mini game, the boss, and the music shop's genres (lo-fi, synthwave, EDM, acoustic, piano,
//   chiptune, jazz, rock) for the older children. Quiet under the game; its own on/off switch in ⚙.
// - engine(): the cart race motor, its pitch follows the speed.
let ctx = null, master = null, sfxBus = null, musicBus = null, enabled = true, musicEnabled = true, noiseBuf = null;
try { enabled = localStorage.getItem('eq-sound') !== '0'; musicEnabled = localStorage.getItem('eq-music') !== '0'; } catch { /* private window */ }
function ensure() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master); musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}
function tone(freq, at, dur, type = 'sine', gain = 0.5, slide = 0, bus = sfxBus, t0 = null) {
  const o = ctx.createOscillator(), g = ctx.createGain(), t = (t0 ?? ctx.currentTime) + at;
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
/** Filtered noise: a whoosh, a hiss, a crash. type: lowpass / bandpass / highpass; f0 → f1 sweeps the filter. */
function noise(at, dur, gain, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, bus = sfxBus, t0 = null) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = (t0 ?? ctx.currentTime) + at;
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const SOUNDS = {
  tick: () => tone(1400, 0, 0.06, 'triangle', 0.25),
  correct: () => { tone(660, 0, 0.25); tone(988, 0.1, 0.3); },
  wrong: () => tone(190, 0, 0.3, 'sine', 0.45, -70),
  pickup: () => tone(520, 0, 0.16, 'triangle', 0.4, 900),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.6, 'triangle', 0.4)),
  step: () => tone(120 + Math.random() * 40, 0, 0.05, 'triangle', 0.08),
  swish: () => { noise(0, 0.18, 0.35, 'bandpass', 900, 3200, 1.2); tone(300, 0, 0.08, 'triangle', 0.08, 200); },
  spell_fire: () => { noise(0, 0.5, 0.45, 'lowpass', 400, 2400, 0.8); tone(110, 0, 0.4, 'sawtooth', 0.12, 80); },
  spell_ice: () => { [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.04, 0.35, 'sine', 0.12)); noise(0, 0.3, 0.2, 'highpass', 4000, 7000, 0.7); },
  spell_wind: () => { noise(0, 0.55, 0.4, 'bandpass', 400, 2600, 2.5); noise(0.08, 0.45, 0.2, 'bandpass', 1800, 600, 3); },
  spell_thunder: () => { noise(0, 0.12, 0.6, 'highpass', 2500, 1500, 0.7); tone(80, 0, 0.3, 'square', 0.1, -30); },
  zap: () => { noise(0, 0.25, 0.55, 'highpass', 3000, 900, 0.6); noise(0.05, 0.5, 0.3, 'lowpass', 300, 80, 0.7); },
  boom: () => { tone(90, 0, 0.6, 'sine', 0.6, -55); noise(0, 0.7, 0.45, 'lowpass', 1200, 90, 0.7); },
  splash: () => noise(0, 0.4, 0.35, 'bandpass', 1500, 500, 0.9),
  coin: () => { tone(988, 0, 0.08, 'square', 0.12); tone(1319, 0.07, 0.25, 'square', 0.12); },
};
export function sfx(name) { if (enabled && ensure() && SOUNDS[name]) SOUNDS[name](); }
export function setSound(on) { enabled = on; try { localStorage.setItem('eq-sound', on ? '1' : '0'); } catch { /* ignore */ } if (!on) stopEngine(); if (musicBus) musicBus.gain.setTargetAtTime(on && musicEnabled && cur ? STYLES[cur].vol : 0, ctx.currentTime, 0.3); }
export function soundOn() { return enabled; }
export function unlock() { if (!ensure()) return; if (cur && musicEnabled && enabled) { startLoop(); musicBus.gain.setTargetAtTime(musicVol(), ctx.currentTime, 0.5); } }

// ------------------------------------------------------------------ music
const N = (s) => { const m = /^([A-G])(b|#?)(-?\d)$/.exec(s); if (!m) return 0; const k = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12; return 440 * 2 ** (k / 12); };
const ch = (s) => s.split(' ').map(N);
/** Each style: bpm, swing, volume, the chords (one per bar), voices for pad / bass / lead / arp, a drum pattern (16 steps:
 *  k kick, s snare, h hat, o open hat) and a lead melody (16 steps per bar, '.' rest). All loops are written for this game. */
export const STYLES = {
  village: { name: 'Village Morning', bpm: 84, vol: 0.16, pad: 'triangle', bass: 'sine', lead: 'triangle', chords: ['C4 E4 G4', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4'], drums: 'k.......k.......', hat: '..h...h...h...h.', melody: ['E5 . G5 . . . E5 D5 C5 . . . D5 . E5 .', 'C5 . . . A4 . C5 . E5 . . . D5 . . .', 'F5 . E5 . C5 . . . A4 . C5 . . . F5 .', 'D5 . . . G4 . B4 . D5 . . . . . . .'] },
  forest: { name: 'Whispering Woods', bpm: 70, vol: 0.15, pad: 'sine', bass: 'sine', lead: 'sine', chords: ['A3 C4 E4', 'F3 A3 C4', 'D3 F3 A3', 'E3 G#3 B3'], drums: '................', hat: '........h.......', arp: true, melody: ['A5 . . . . . E5 . . . . . C5 . . .', '. . . . F5 . . . E5 . . . . . . .', 'D5 . . . . . A4 . . . . . F5 . . .', 'E5 . . . . . . . B4 . . . . . . .'] },
  harbor: { name: 'Sunny Harbor', bpm: 100, vol: 0.15, swing: 0.12, pad: 'triangle', bass: 'triangle', lead: 'square', chords: ['F4 A4 C5', 'D4 F4 A4', 'Bb3 D4 F4', 'C4 E4 G4'], drums: 'k..s..k.k..s....', hat: 'h.h.h.h.h.h.h.h.', melody: ['A5 . C6 . A5 . F5 . G5 . A5 . . . . .', 'F5 . . . D5 . F5 . A5 . . . G5 . F5 .', 'D5 . F5 . D5 . Bb4 . C5 . D5 . . . . .', 'E5 . . . G5 . . . C6 . . . . . . .'] },
  isle: { name: 'Treasure Breeze', bpm: 92, vol: 0.15, swing: 0.15, pad: 'triangle', bass: 'sine', lead: 'triangle', chords: ['G3 B3 D4', 'E3 G3 B3', 'C4 E4 G4', 'D4 F#4 A4'], drums: 'k...s..k..k.s...', hat: '..h...h...h...h.', melody: ['B5 . D6 . B5 . G5 . . . A5 . B5 . . .', 'G5 . . . E5 . . . G5 . B5 . . . . .', 'E5 . G5 . C6 . . . B5 . A5 . G5 . . .', 'F#5 . . . A5 . . . D6 . . . . . . .'] },
  home: { name: 'Cosy Home', bpm: 72, vol: 0.14, pad: 'sine', bass: 'sine', lead: 'triangle', chords: ['F4 A4 C5 E5', 'D4 F4 A4 C5', 'G3 Bb3 D4 F4', 'C4 E4 G4 B4'], drums: 'k.......k..k....', hat: '....h.......h...', melody: ['A5 . . . G5 . F5 . . . E5 . . . . .', 'F5 . . . . . D5 . . . . . . . . .', 'D5 . F5 . . . A5 . . . G5 . . . . .', 'E5 . . . . . . . . . . . . . . .'] },
  boss: { name: 'Boss Battle', bpm: 138, vol: 0.15, pad: 'sawtooth', bass: 'sawtooth', lead: 'square', chords: ['D3 F3 A3', 'Bb2 D3 F3', 'C3 E3 G3', 'A2 C#3 E3'], drums: 'k.k.s.k.k.k.s..s', hat: 'hhhhhhhhhhhhhhhh', melody: ['D5 . D5 . F5 . D5 . A5 . . . G5 . F5 .', 'F5 . F5 . D5 . Bb4 . D5 . . . . . . .', 'E5 . E5 . G5 . E5 . C6 . . . Bb5 . G5 .', 'A5 . . . C#5 . E5 . A5 . . . . . . .'] },
  candy: { name: 'Candy Pop', bpm: 118, vol: 0.14, pad: 'triangle', bass: 'square', lead: 'square', chords: ['C4 E4 G4', 'G3 B3 D4', 'A3 C4 E4', 'F3 A3 C4'], drums: 'k...s...k.k.s...', hat: 'h.h.h.h.h.h.h.h.', melody: ['G5 E5 G5 . C6 . G5 . E5 . G5 . A5 . G5 .', 'D5 . G5 . B5 . . . A5 G5 F5 . D5 . . .', 'E5 . A5 . C6 . A5 . E5 . C5 . E5 . A5 .', 'F5 . A5 . C6 . . . A5 . G5 . F5 . . .'] },
  race: { name: 'Pumpkin Rally', bpm: 150, vol: 0.13, pad: 'sawtooth', bass: 'sawtooth', lead: 'square', chords: ['E3 G3 B3', 'C3 E3 G3', 'D3 F#3 A3', 'B2 D#3 F#3'], drums: 'k.s.k.s.k.s.k.ss', hat: 'hhhhhhhhhhhhhhhh', bass8: true, melody: ['E5 . G5 . B5 . G5 . E5 . G5 . B5 . E6 .', 'C6 . . . G5 . E5 . G5 . . . C6 . . .', 'D6 . A5 . F#5 . A5 . D6 . . . A5 . . .', 'B5 . . . F#5 . D#5 . F#5 . B5 . . . . .'] },
  blocks: { name: 'Block Party', bpm: 128, vol: 0.18, pad: 'square', bass: 'square', lead: 'square', chords: ['A3 C4 E4', 'E3 G#3 B3', 'A3 C4 E4', 'D3 F3 A3'], drums: 'k...s...k...s...', hat: '..h...h...h...h.', melody: ['E5 . B4 C5 D5 . C5 B4 A4 . A4 C5 E5 . D5 C5', 'B4 . . C5 D5 . E5 . C5 . A4 . A4 . . .', '. D5 . F5 A5 . G5 F5 E5 . . C5 E5 . D5 C5', 'B4 . B4 C5 D5 . E5 . C5 . A4 . A4 . . .'] },
  sling: { name: 'Target Funk', bpm: 104, vol: 0.14, swing: 0.18, pad: 'triangle', bass: 'sawtooth', lead: 'triangle', chords: ['E3 G3 B3 D4', 'A3 C4 E4 G4', 'E3 G3 B3 D4', 'B3 D#4 F#4 A4'], drums: 'k..sk.k.k..s..k.', hat: 'h.hh.hh.h.hh.hh.', melody: ['E5 . . G5 . E5 . D5 . E5 . . . . . .', 'A5 . . G5 . E5 . . G5 . . . . . . .', 'E5 . . G5 . A5 . B5 . A5 . G5 . E5 .', 'F#5 . . . D#5 . . . B4 . . . . . . .'] },
  apple: { name: 'Orchard Hop', bpm: 112, vol: 0.14, pad: 'triangle', bass: 'triangle', lead: 'triangle', chords: ['G3 B3 D4', 'C4 E4 G4', 'D4 F#4 A4', 'G3 B3 D4'], drums: 'k...k.s.k...k.s.', hat: '..h...h...h...h.', melody: ['D5 . G5 . B5 . G5 . D5 . G5 . B5 . . .', 'E5 . G5 . C6 . G5 . E5 . . . . . . .', 'F#5 . A5 . D6 . A5 . F#5 . D5 . A5 . . .', 'G5 . . . D5 . . . G4 . . . . . . .'] },
  fish: { name: 'Lazy River', bpm: 76, vol: 0.13, swing: 0.2, pad: 'sine', bass: 'sine', lead: 'triangle', chords: ['D4 F#4 A4 C#5', 'B3 D4 F#4 A4', 'G3 B3 D4 F#4', 'A3 C#4 E4 G4'], drums: 'k.......k.......', hat: '....h.......h...', melody: ['F#5 . . . A5 . . . . . E5 . . . . .', 'D5 . . . . . F#5 . . . . . . . . .', 'B4 . . . D5 . . . F#5 . . . E5 . . .', 'C#5 . . . . . . . . . . . . . . .'] },
  // the music shop's genres (original loops in the style, for the 6th and 8th graders)
  lofi: { name: 'Lo-fi Study Beats', bpm: 78, vol: 0.2, swing: 0.22, pad: 'triangle', bass: 'sine', lead: 'sine', chords: ['D4 F4 A4 C5', 'G3 B3 D4 F4', 'C4 E4 G4 B4', 'A3 C4 E4 G4'], drums: 'k......sk.k....s', hat: 'h.h.h.h.h.h.h.h.', crackle: true, melody: ['A5 . . . G5 . F5 . . . . . E5 . . .', 'F5 . . . D5 . . . . . B4 . . . . .', 'E5 . G5 . . . B5 . . . A5 . G5 . . .', 'E5 . . . . . C5 . . . . . . . . .'] },
  synthwave: { name: 'Neon Highway', bpm: 108, vol: 0.18, pad: 'sawtooth', bass: 'sawtooth', lead: 'square', chords: ['A3 C4 E4', 'F3 A3 C4', 'C4 E4 G4', 'G3 B3 D4'], drums: 'k...s...k...s...', hat: 'h.h.h.h.h.h.h.h.', bass8: true, melody: ['E5 . . . A5 . . . C6 . B5 . A5 . . .', 'C6 . . . A5 . . . F5 . . . . . . .', 'G5 . . . C6 . . . E6 . D6 . C6 . . .', 'B5 . . . D6 . . . G5 . . . . . . .'] },
  edm: { name: 'Festival Drop', bpm: 126, vol: 0.18, pad: 'sawtooth', bass: 'square', lead: 'sawtooth', chords: ['F3 A3 C4', 'G3 B3 D4', 'E3 G3 B3', 'A3 C4 E4'], drums: 'k...k...k...k...', hat: '..o...o...o...o.', snare: '....s.......s...', bass8: true, melody: ['A5 . A5 . C6 . A5 . G5 . F5 . G5 . A5 .', 'B5 . B5 . D6 . B5 . A5 . G5 . A5 . B5 .', 'G5 . G5 . B5 . G5 . E5 . . . G5 . . .', 'A5 . . . E5 . . . C6 . . . . . . .'] },
  acoustic: { name: 'Campfire Guitar', bpm: 96, vol: 0.18, pad: 'triangle', bass: 'triangle', lead: 'triangle', chords: ['G3 B3 D4', 'D4 F#4 A4', 'E3 G3 B3', 'C4 E4 G4'], drums: 'k.....s.k.k...s.', hat: '................', arp: true, melody: ['B4 . D5 . G5 . . . F#5 . E5 . D5 . . .', 'A4 . D5 . F#5 . . . E5 . D5 . . . . .', 'G4 . B4 . E5 . . . D5 . B4 . G4 . . .', 'C5 . E5 . G5 . . . F#5 . . . . . . .'] },
  piano: { name: 'Rainy Piano', bpm: 66, vol: 0.2, pad: 'sine', bass: 'sine', lead: 'triangle', chords: ['C4 E4 G4', 'G3 B3 D4', 'A3 C4 E4', 'E3 G3 B3', 'F3 A3 C4', 'C4 E4 G4', 'F3 A3 C4', 'G3 B3 D4'], drums: '................', hat: '................', arp: true, melody: ['E5 . . . G5 . . . C6 . . . B5 . . .', 'D5 . . . . . . . G5 . . . . . . .', 'C5 . . . E5 . . . A5 . . . G5 . . .', 'B4 . . . . . . . E5 . . . . . . .', 'A4 . . . C5 . . . F5 . . . E5 . . .', 'G5 . . . E5 . . . C5 . . . . . . .', 'F5 . . . A5 . . . C6 . . . A5 . . .', 'G5 . . . . . . . B4 . . . . . . .'] },
  chiptune: { name: '8-bit Adventure', bpm: 140, vol: 0.14, pad: 'square', bass: 'triangle', lead: 'square', chords: ['C4 E4 G4', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4'], drums: 'k...s...k.k.s...', hat: 'h.h.h.h.h.h.h.h.', arp: true, melody: ['C5 E5 G5 C6 . G5 E5 . C5 . E5 . G5 . . .', 'A4 C5 E5 A5 . E5 C5 . A4 . C5 . E5 . . .', 'F4 A4 C5 F5 . C5 A4 . F4 . A4 . C5 . . .', 'G4 B4 D5 G5 . . F5 . E5 . D5 . . . . .'] },
  jazz: { name: 'Café Jazz', bpm: 92, vol: 0.18, swing: 0.3, pad: 'triangle', bass: 'sine', lead: 'sine', chords: ['D4 F4 A4 C5', 'G3 B3 D4 F4', 'C4 E4 G4 B4', 'A3 C#4 E4 G4'], drums: 'k.......k.......', hat: 'h..h.hh..h.hh..h', walk: true, melody: ['F5 . A5 . C6 . . A5 . . G5 . F5 . . .', 'D5 . F5 . . . B4 . . . D5 . . . . .', 'E5 . G5 . B5 . . G5 . . E5 . C5 . . .', 'C#5 . . . E5 . . . A5 . . . G5 . . .'] },
  rock: { name: 'Garage Rock', bpm: 132, vol: 0.17, pad: 'sawtooth', bass: 'sawtooth', lead: 'sawtooth', chords: ['E3 B3 E4', 'G3 D4 G4', 'A3 E4 A4', 'C4 G4 C5'], drums: 'k.s.k.s.k.s.kks.', hat: 'hhhhhhhhhhhhhhhh', bass8: true, melody: ['E5 . E5 . G5 . E5 . B5 . . . A5 . G5 .', 'G5 . G5 . B5 . G5 . D6 . . . B5 . . .', 'A5 . A5 . C6 . A5 . E6 . . . D6 . C6 .', 'C6 . . . B5 . . . G5 . . . E5 . . .'] },
};
export const GENRES = ['lofi', 'synthwave', 'edm', 'acoustic', 'piano', 'chiptune', 'jazz', 'rock'];
let cur = null, timer = null, step = 0, nextAt = 0, override = null;
const musicVol = () => (cur && musicEnabled && enabled ? STYLES[cur].vol : 0);
function startLoop() {
  if (!ensure() || timer) return;
  nextAt = ctx.currentTime + 0.1; step = 0;
  timer = setInterval(schedule, 50);
}
function stopLoop() { if (timer) clearInterval(timer); timer = null; }
function schedule() {
  if (!cur) return; const S = STYLES[cur], sp = 60 / S.bpm / 4;      // one 16th note
  while (nextAt < ctx.currentTime + 0.25) {
    const bar = Math.floor(step / 16) % S.chords.length, i = step % 16, chord = ch(S.chords[bar]), t = nextAt + (i % 2 ? (S.swing || 0) * sp : 0);
    if (i === 0) for (const f of chord) tone(f, 0, sp * 15, S.pad, 0.05, 0, musicBus, t);      // pad: the whole bar
    if (S.bass8 ? i % 2 === 0 : S.walk ? i % 4 === 0 : (i === 0 || i === 8 || i === 10)) { const b = S.walk ? chord[[0, 1, 2, 1][i / 4]] / 2 : chord[0] / 2; tone(b, 0, sp * (S.bass8 ? 1.6 : 3), S.bass, 0.16, 0, musicBus, t); }
    if (S.arp && i % 2 === 0) tone(chord[(i / 2) % chord.length] * 2, 0, sp * 2.5, 'triangle', 0.04, 0, musicBus, t);
    const mel = (S.melody[bar % S.melody.length] || '').split(' ')[i]; if (mel && mel !== '.') tone(N(mel), 0, sp * 2.6, S.lead, 0.07, 0, musicBus, t);
    if (S.drums[i] === 'k') tone(150, 0, 0.18, 'sine', 0.35, -100, musicBus, t);
    if (S.drums[i] === 's' || (S.snare && S.snare[i] === 's')) noise(0, 0.14, 0.16, 'bandpass', 1800, 1200, 0.8, musicBus, t);
    if (S.hat[i] === 'h') noise(0, 0.04, 0.05, 'highpass', 7000, 7000, 0.7, musicBus, t);
    if (S.hat[i] === 'o') noise(0, 0.16, 0.06, 'highpass', 6000, 6000, 0.7, musicBus, t);
    if (S.crackle && Math.random() < 0.3) noise(0, 0.02, 0.02, 'highpass', 3000, 3000, 0.5, musicBus, t + Math.random() * sp);
    nextAt += sp; step += 1;
  }
}
/** Plays a style (a key of STYLES) as the background music; null fades it out. A call during an override (a mini game)
 *  only changes what comes back after it. */
export function playMusic(style, { force = false } = {}) {
  if (override && !force) { override.back = style; return; }
  if (style === cur) return; cur = style && STYLES[style] ? style : null;
  if (!ctx) return;
  musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  if (!cur) { setTimeout(() => { if (!cur) stopLoop(); }, 800); return; }
  setTimeout(() => { if (!ctx) return; step = 0; nextAt = ctx.currentTime + 0.05; musicBus.gain.setTargetAtTime(musicVol(), ctx.currentTime, 0.4); }, 350);
  if (musicEnabled && enabled) startLoop();
}
/** A mini game's own tune over the region music; endMusic() brings the region music back. */
export function gameMusic(style) { const back = override ? override.back : cur; override = null; playMusic(style, { force: true }); override = { back }; }
export function endMusic() { if (!override) return; const back = override.back; override = null; playMusic(back); }
export const musicStyle = () => cur;
export function setMusic(on) { musicEnabled = on; try { localStorage.setItem('eq-music', on ? '1' : '0'); } catch { /* ignore */ } if (!ctx) return; if (on && cur && enabled) startLoop(); musicBus.gain.setTargetAtTime(musicVol(), ctx.currentTime, 0.3); }
export function musicOn() { return musicEnabled; }

// ------------------------------------------------------------------ cart race motor
let eng = null;
/** Starts the motor hum (two detuned saws through a low-pass, with a little rumble). */
export function startEngine() {
  if (!enabled || !ensure() || eng) return;
  const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(sfxBus);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 4; f.connect(g);
  const a = ctx.createOscillator(), b = ctx.createOscillator(); a.type = b.type = 'sawtooth'; a.frequency.value = 55; b.frequency.value = 55.8; a.connect(f); b.connect(f);
  const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); n.buffer = noiseBuf; n.loop = true; nf.type = 'lowpass'; nf.frequency.value = 220; ng.gain.value = 0.25; n.connect(nf).connect(ng).connect(f);
  a.start(); b.start(); n.start(); g.gain.setTargetAtTime(0.045, ctx.currentTime, 0.2);      // (23/11) the engine was too loud: about a quarter of what it was
  eng = { a, b, n, f, g };
}
/** speed 0..1 (and a little more on a boost): the motor pitch and brightness. */
export function engineSpeed(k) { if (!eng) return; const t = ctx.currentTime, hz = 50 + 110 * k; eng.a.frequency.setTargetAtTime(hz, t, 0.08); eng.b.frequency.setTargetAtTime(hz * 1.015, t, 0.08); eng.f.frequency.setTargetAtTime(350 + 1500 * k, t, 0.1); }
export function stopEngine() { if (!eng) return; const e = eng; eng = null; e.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1); setTimeout(() => { try { e.a.stop(); e.b.stop(); e.n.stop(); } catch { /* stopped */ } }, 400); }
/** One-off race sounds: a skid on a bump, a boost, a coin. */
export function raceSfx(name) { if (!enabled || !ensure()) return; if (name === 'skid') noise(0, 0.35, 0.12, 'bandpass', 2500, 1500, 3); if (name === 'boost') { noise(0, 0.6, 0.14, 'bandpass', 500, 3000, 1.5); tone(220, 0, 0.5, 'sawtooth', 0.04, 330); } if (name === 'bump') { tone(80, 0, 0.2, 'sine', 0.22, -40); noise(0, 0.15, 0.12, 'lowpass', 600, 200, 1); } }
