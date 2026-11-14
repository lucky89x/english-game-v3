// Tiny Web Audio synth: no audio files, nothing copyrighted. Starts on the first user gesture.
let ctx = null, master = null, enabled = true;
function ensure() {
  if (!ctx) { const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}
function tone(freq, at, dur, type = 'sine', gain = 0.5, slide = 0) {
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
}
const SOUNDS = {
  tick: () => tone(1400, 0, 0.06, 'triangle', 0.25),
  correct: () => { tone(660, 0, 0.25); tone(988, 0.1, 0.3); },
  wrong: () => tone(190, 0, 0.3, 'sine', 0.45, -70),
  pickup: () => tone(520, 0, 0.16, 'triangle', 0.4, 900),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.6, 'triangle', 0.4)),
  step: () => tone(120 + Math.random() * 40, 0, 0.05, 'triangle', 0.08),
};
export function sfx(name) { if (enabled && ensure() && SOUNDS[name]) SOUNDS[name](); }
export function setSound(on) { enabled = on; }
export function soundOn() { return enabled; }
export function unlock() { ensure(); }
