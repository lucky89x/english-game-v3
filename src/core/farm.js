// The home farm (21/11: "the vegetable garden can be planted and the vegetables sold; raise pigs and chickens too, to earn
// a little more"). Pure rules, real time in minutes so a short visit between lessons is enough. The profile keeps
// farm = { beds: [{ crop, at } | null], hens: { at, eggs }, pig: { at, feeds, last } | null }.
import { addGood } from './goods.js';
import { house, gardenOf } from './house.js';

const MIN = 60000;
/** Seeds: price in gold, minutes to grow, vegetables picked. */
export const CROPS = {
  carrot: { en: 'carrot', vi: 'cà rốt', icon: '🥕', seed: 2, grow: 3, yield: 3 },
  tomato: { en: 'tomato', vi: 'cà chua', icon: '🍅', seed: 3, grow: 5, yield: 3 },
  cabbage: { en: 'cabbage', vi: 'bắp cải', icon: '🥬', seed: 4, grow: 8, yield: 3 },
  corn: { en: 'corn', vi: 'ngô', icon: '🌽', seed: 5, grow: 12, yield: 3 },
  pumpkin: { en: 'pumpkin', vi: 'bí ngô', icon: '🎃', seed: 9, grow: 20, yield: 2 },
};
export const EGG_EVERY = 3, EGG_MAX = 12, PIGLET = 40, PIG_FEEDS = 4, PIG_GROW = 20, FEED_GAP = 4;      // minutes; gold
export const farm = (p) => { const f = p.farm || (p.farm = { beds: [], hens: null, pig: null }); if (!Array.isArray(f.beds)) f.beds = []; return f; };
export const bedCount = (p) => gardenOf(house(p)).veg;
/** 0 empty, 1 seed, 2 sprout, 3 growing, 4 ready. */
export function stageOf(bed, now = Date.now()) { if (!bed) return 0; const k = (now - bed.at) / (CROPS[bed.crop].grow * MIN); return k >= 1 ? 4 : k >= 0.6 ? 3 : k >= 0.25 ? 2 : 1; }
export const minutesLeft = (bed, now = Date.now()) => (bed ? Math.max(0, Math.ceil(CROPS[bed.crop].grow - (now - bed.at) / MIN)) : 0);
export function plant(p, i, crop, now = Date.now()) {
  const f = farm(p), c = CROPS[crop]; if (!c || i < 0 || i >= bedCount(p)) return { ok: false, why: 'none' };
  if (f.beds[i]) return { ok: false, why: 'busy' }; if (p.stats.gold < c.seed) return { ok: false, why: 'gold' };
  p.stats.gold -= c.seed; f.beds[i] = { crop, at: now }; return { ok: true };
}
export function harvest(p, i, now = Date.now()) {
  const f = farm(p), b = f.beds[i]; if (!b) return { ok: false, why: 'empty' }; if (stageOf(b, now) < 4) return { ok: false, why: 'young', left: minutesLeft(b, now) };
  const c = CROPS[b.crop]; addGood(p, b.crop, c.yield); f.beds[i] = null; return { ok: true, crop: b.crop, n: c.yield };
}
/** The hens lay an egg every EGG_EVERY minutes (up to EGG_MAX waiting in the coop). */
export function eggsReady(p, now = Date.now()) {
  if (!house(p).coop) return 0; const f = farm(p); if (!f.hens) f.hens = { at: now, eggs: 0 };
  const laid = Math.floor((now - f.hens.at) / (EGG_EVERY * MIN)); if (laid > 0) { f.hens.eggs = Math.min(EGG_MAX, f.hens.eggs + laid); f.hens.at += laid * EGG_EVERY * MIN; }
  return f.hens.eggs;
}
export function collectEggs(p, now = Date.now()) { const n = eggsReady(p, now); if (!n) return 0; farm(p).hens.eggs = 0; addGood(p, 'egg', n); return n; }
/** The pig: bought as a piglet, fed (a vegetable from the bag, or 2 gold) at most every FEED_GAP minutes; grown after
 *  PIG_FEEDS meals and PIG_GROW minutes, then it goes to the market (into the bag as a pig to sell). */
export function buyPiglet(p, now = Date.now()) { if (!house(p).pen) return { ok: false, why: 'pen' }; const f = farm(p); if (f.pig) return { ok: false, why: 'have' }; if (p.stats.gold < PIGLET) return { ok: false, why: 'gold' }; p.stats.gold -= PIGLET; f.pig = { at: now, feeds: 0, last: 0 }; return { ok: true }; }
export const pigGrown = (pig, now = Date.now()) => !!pig && pig.feeds >= PIG_FEEDS && now - pig.at >= PIG_GROW * MIN;
/** How big the pig looks: 0.5 (piglet) to 1 (grown). */
export const pigSize = (pig, now = Date.now()) => (pig ? 0.5 + 0.5 * Math.min(1, Math.min(pig.feeds / PIG_FEEDS, (now - pig.at) / (PIG_GROW * MIN))) : 0);
export function feedPig(p, now = Date.now()) {
  const f = farm(p), pig = f.pig; if (!pig) return { ok: false, why: 'none' }; if (pigGrown(pig, now)) return { ok: false, why: 'grown' };
  if (now - pig.last < FEED_GAP * MIN) return { ok: false, why: 'full', left: Math.ceil(FEED_GAP - (now - pig.last) / MIN) };
  const g = p.goods || {}, veg = ['carrot', 'cabbage', 'corn', 'tomato', 'pumpkin', 'apple'].find((k) => g[k] > 0);
  if (veg) g[veg] -= 1; else if (p.stats.gold >= 2) p.stats.gold -= 2; else return { ok: false, why: 'gold' };
  pig.feeds += 1; pig.last = now; return { ok: true, food: veg || 'gold' };
}
export function takePig(p, now = Date.now()) { const f = farm(p); if (!pigGrown(f.pig, now)) return false; f.pig = null; addGood(p, 'pig', 1); return true; }
