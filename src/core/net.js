// (27/11, turn 69) Playing together through one small room server (server/room.js on Cloudflare): the rules both sides share.
// A room is entered with a code a child reads to a friend; there is no list of rooms and no free typing: the only words
// that travel are the numbers of the ready-made English lines below. Everything a client sends is cleaned here before
// the server passes it on, so a changed game cannot send anything else to the other children.

export const PROTO = 1;
export const ROOM_MAX = 8;                 // children in one room
export const MSG_MAX = 700;                // characters of one message
export const RATE_MAX = 40;                // messages a second before the server hangs up
export const SAY_GAP = 1200;               // ms between two lines of one child

// ---- room codes: 6 characters, without the look-alikes I O 0 1
export const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', CODE_LEN = 6;
export function newCode(rnd = Math.random) { let s = ''; for (let i = 0; i < CODE_LEN; i++) s += CODE_ABC[Math.floor(rnd() * CODE_ABC.length) % CODE_ABC.length]; return s; }
/** What a child typed -> a room code, or '' when it cannot be one. */
export function cleanCode(text) {
  const s = String(text == null ? '' : text).toUpperCase().replace(/[\s-]/g, '');
  if (s.length !== CODE_LEN) return '';
  for (const c of s) if (!CODE_ABC.includes(c)) return '';
  return s;
}
/** The address of a room on a server: 'https://x.workers.dev' + 'ABC234' -> 'wss://x.workers.dev/room/ABC234'; '' when either is bad. */
export function roomUrl(server, code) {
  const c = cleanCode(code), m = /^(wss?|https?):\/\/([a-z0-9.-]+(?::\d+)?)\/?$/i.exec(String(server || '').trim());
  if (!c || !m) return '';
  return (/^(wss|https)$/i.test(m[1]) ? 'wss' : 'ws') + '://' + m[2].toLowerCase() + '/room/' + c;
}

// ---- what a child shows of itself
export const AVATARS = ['ngoc', 'hero', 'girl1', 'girl2'];
export const SKINS = ['light', 'fair', 'tan', 'deep'];
export const HAIRS = ['short', 'long', 'curly', 'wavy', 'ponytail', 'braids'];
export const TOPS = ['tshirt', 'hoodie', 'jacket', 'aodai'], BOTTOMS = ['shorts', 'trousers', 'skirt'], DRESSES = ['sundress', 'party'];
export const REGIONS = ['village', 'harbor', 'isle', 'forest', 'desert', 'mountain', 'ruins', 'sky', 'fairy', 'volcano', 'crystal', 'city', 'dream', 'home'];
export const ANIMS = ['Idle', 'Walk', 'Run', 'Swim', 'Jump', 'Land', 'Wave', 'Celebrate', 'Interact', 'Talk', 'Sit'];
const hex = (v) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null);
const pick = (list, v) => (list.includes(v) ? v : null);
const num = (v, lo, hi, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const r2 = (n) => Math.round(n * 100) / 100;
/** A name for the tag over the head: letters of any language, digits and spaces, 16 at most. */
export function cleanName(text) {
  const s = String(text == null ? '' : text).normalize('NFC').replace(/[^\p{L}\p{M}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16).trim();
  return s || 'Friend';
}
export function cleanLook(o) {
  o = o && typeof o === 'object' ? o : {};
  return { a: pick(AVATARS, o.a) || 'ngoc', k: pick(SKINS, o.k) || 'light', s: pick(HAIRS, o.s) || 'short', h: hex(o.h), t: hex(o.t), b: hex(o.b), f: hex(o.f),
    ct: pick(TOPS, o.ct), cb: pick(BOTTOMS, o.cb), cd: pick(DRESSES, o.cd) };
}
export const cleanRegion = (r) => pick(REGIONS, r) || 'village';
export const animCode = (name) => Math.max(0, ANIMS.indexOf(name));
export const animName = (code) => ANIMS[code] || 'Idle';
/** A place: x, z, height, heading (radians) and the clip. */
export function cleanMove(m) {
  return { x: r2(num(m.x, -600, 600)), z: r2(num(m.z, -600, 600)), h: r2(num(m.h, -50, 200)), y: r2(num(m.y, -7, 7)), a: Math.round(num(m.a, 0, ANIMS.length - 1)) };
}

// ---- the lines a child can say (all written for this game). `anim` plays on the speaker.
export const PHRASES = [
  { en: 'Hello!', vi: 'Xin chào!', anim: 'Wave' },
  { en: 'How are you?', vi: 'Bạn khỏe không?' },
  { en: "I'm fine, thank you.", vi: 'Mình khỏe, cảm ơn bạn.' },
  { en: 'Follow me!', vi: 'Đi theo mình!' },
  { en: 'Wait for me!', vi: 'Đợi mình với!' },
  { en: 'Where are you?', vi: 'Bạn đang ở đâu?' },
  { en: "I'm here!", vi: 'Mình ở đây!', anim: 'Wave' },
  { en: "Let's play a game!", vi: 'Chơi một trò đi!' },
  { en: "Let's fight the monsters!", vi: 'Cùng đánh quái nào!' },
  { en: 'I need help!', vi: 'Mình cần giúp!' },
  { en: 'Good job!', vi: 'Giỏi lắm!', anim: 'Celebrate' },
  { en: 'Thank you!', vi: 'Cảm ơn bạn!' },
  { en: "You're welcome.", vi: 'Không có gì.' },
  { en: 'Yes!', vi: 'Có!' },
  { en: 'No, sorry.', vi: 'Không, xin lỗi nhé.' },
  { en: 'Look at this!', vi: 'Nhìn cái này này!' },
  { en: 'Come to my house!', vi: 'Tới nhà mình chơi đi!' },
  { en: 'See you later!', vi: 'Hẹn gặp lại!', anim: 'Wave' },
];

/** A message from a client, cleaned; null when it is not one of ours. The server passes on only what this returns. */
export function cleanMsg(m) {
  if (!m || typeof m !== 'object') return null;
  switch (m.t) {
    case 'hi': return m.v === PROTO ? { t: 'hi', n: cleanName(m.n), lv: Math.round(num(m.lv, 1, 99, 1)), look: cleanLook(m.look), r: cleanRegion(m.r) } : null;
    case 'm': return { t: 'm', ...cleanMove(m) };
    case 'r': return { t: 'r', r: cleanRegion(m.r) };
    case 's': { const k = typeof m.k === 'number' ? m.k : -1; return Number.isInteger(k) && k >= 0 && k < PHRASES.length ? { t: 's', k } : null; }
    case 'u': return { t: 'u', lv: Math.round(num(m.lv, 1, 99, 1)), look: cleanLook(m.look) };
    default: return null;
  }
}

// ---- the sender: a place is sent when it changed, at most every SEND_MS; a child standing still says so every STILL_MS
export const SEND_MS = 160, STILL_MS = 20000;
export function shouldSend(last, cur, now) {
  if (!last) return true;
  const dt = now - last.at; if (dt < SEND_MS) return false;
  if (dt >= STILL_MS) return true;
  let dy = cur.y - last.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  return Math.abs(cur.x - last.x) > 0.04 || Math.abs(cur.z - last.z) > 0.04 || Math.abs(cur.h - last.h) > 0.06 || Math.abs(dy) > 0.06 || cur.a !== last.a;
}
/** The receiver: one frame of gliding towards the last place heard (k = how much of the way this frame). Far jumps snap. */
export function glide(p, to, rt) {
  const d = Math.hypot(to.x - p.x, to.z - p.z);
  if (d > 14) { p.x = to.x; p.z = to.z; p.h = to.h; p.y = to.y; return p; }
  const k = 1 - Math.exp(-rt * 9);
  p.x += (to.x - p.x) * k; p.z += (to.z - p.z) * k; p.h += (to.h - p.h) * k;
  let dy = to.y - p.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.y += dy * k;
  return p;
}
/** Why a room closed, in words for a child. */
export const CLOSE = { full: 4001, fast: 4008, old: 4010 };
export function closeText(code) {
  if (code === CLOSE.full) return `Phòng đã đủ ${ROOM_MAX} bạn rồi.`;
  if (code === CLOSE.fast) return 'Máy gửi quá nhiều tin nên phòng đã ngắt. Vào lại nhé.';
  if (code === CLOSE.old) return 'Bản game này cũ hơn máy chủ phòng: hãy cập nhật game.';
  return 'Mất kết nối tới phòng. Kiểm tra mạng rồi vào lại nhé.';
}
