// Keys with a Vietnamese input method switched on (feedback 17/11: "with Unikey on, WASD does not walk").
// Telex/VNI tools swallow the real key and send a finished letter instead ("w" becomes "ư", "a" then "s" becomes
// "á"), often with an empty key code and the key-up straight after. keyCode() works out which key the child
// pressed from the letter: the last Telex key decides (tone marks s f r x j, horn or breve = w, đ = d).
const TONES = { '́': 'KeyS', '̀': 'KeyF', '̉': 'KeyR', '̃': 'KeyX', '̣': 'KeyJ' };
/** e: a KeyboardEvent-like {code, key}. Returns a code such as 'KeyW', or '' when nothing fits. */
export function keyCode(e) {
  if (e.code && e.code !== 'Unidentified') return e.code;
  const k = String(e.key || '');
  if (k === ' ') return 'Space';
  if ([...k].length !== 1) return '';
  const low = k.toLowerCase(); if (low === 'đ') return 'KeyD';
  const d = low.normalize('NFD');
  for (const [mark, code] of Object.entries(TONES)) if (d.includes(mark)) return code;
  if (/[̛̆]/.test(d)) return 'KeyW';
  const base = d.replace(/[̀-ͯ]/g, '');
  if (/^[a-z]$/.test(base)) return 'Key' + base.toUpperCase();
  if (/^[0-9]$/.test(base)) return 'Digit' + base;
  return '';
}
