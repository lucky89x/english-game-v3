// Reading aloud (feedback 17/11: "children don't like reading long lines"). Uses the browser's own English voice
// (Windows has Microsoft Zira/David, Chrome adds Google US English), slowed down a little for learners. No network
// needed. Turned on or off with the "Đọc to" button; the choice is kept in this browser.
let on = true;
try { on = localStorage.getItem('eq-voice') !== '0'; } catch { /* private window */ }
const synth = () => (typeof speechSynthesis !== 'undefined' && !navigator.webdriver ? speechSynthesis : null);   // tests stay silent
let voice = null;
function pickVoice() {
  const s = synth(); if (!s) return null;
  const all = s.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  return all.find((v) => /Google US English/i.test(v.name)) || all.find((v) => /Zira|Aria|Jenny|Samantha/i.test(v.name)) || all.find((v) => /en[-_]US/i.test(v.lang)) || all[0] || null;
}
if (synth()) synth().addEventListener?.('voiceschanged', () => { voice = pickVoice(); });

export const voiceOn = () => on;
export function setVoice(v) { on = !!v; try { localStorage.setItem('eq-voice', on ? '1' : '0'); } catch { /* ignore */ } if (!on) stop(); }
export function stop() { const s = synth(); if (s) s.cancel(); }
/** Reads English text aloud. force: read even when reading aloud is off (the 🔊 buttons). */
export function speak(text, force = false, rate = 0.85) {
  const s = synth(); if (!s || (!on && !force) || !text) return;
  s.cancel(); voice = voice || pickVoice();
  const u = new SpeechSynthesisUtterance(String(text).replace(/[★✉●▸…]/g, ' ')); u.lang = 'en-US'; u.rate = rate; if (voice) u.voice = voice;
  s.speak(u);
}
