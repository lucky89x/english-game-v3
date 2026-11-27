// The room server (server/room.js) checked from outside: start it first with `npx wrangler dev --config server/wrangler.toml --port 8787`,
// then `node tests/room_server.mjs` (two and more clients: hello, places, lines, lands, a full room, an old game, a flood).
import assert from 'node:assert/strict';
const BASE = process.argv[2] || 'ws://127.0.0.1:8787';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function client(code, name, region = 'village') {
  const ws = new WebSocket(`${BASE}/room/${code}`), c = { ws, got: [], closed: null, id: 0 };
  ws.onmessage = (e) => { const m = JSON.parse(e.data); c.got.push(m); if (m.t === 'you') c.id = m.id; };
  ws.onclose = (e) => { c.closed = e.code; };
  c.ready = new Promise((res, rej) => { ws.onopen = () => { ws.send(JSON.stringify({ t: 'hi', v: 1, n: name, lv: 7, look: { a: 'hero', h: '#ff0000', x: '<script>' }, r: region })); res(); }; ws.onerror = () => rej(new Error('socket error ' + name)); });
  c.send = (o) => ws.send(typeof o === 'string' ? o : JSON.stringify(o));
  c.last = (t) => c.got.filter((m) => m.t === t).pop();
  return c;
}
const health = await (await fetch(BASE.replace(/^ws/, 'http') + '/')).json(); assert.equal(health.ok, true);
assert.equal((await fetch(BASE.replace(/^ws/, 'http') + '/room/bad!')).status, 404);
assert.equal((await fetch(BASE.replace(/^ws/, 'http') + '/room/ABC234')).status, 426);

const a = client('ABC234', 'An  <b>'), b = client('ABC234', 'Bình'); await a.ready; await b.ready; await wait(600);
assert.ok(a.id && b.id && a.id !== b.id, 'two ids');
const first = a.last('you') && a.last('you').list.length === 0 ? a : b, second = first === a ? b : a;
assert.equal(second.last('you').list.length, 1, 'the second sees the first in the list');
assert.equal(first.last('in').p.id, second.id, 'the first hears the second arrive');
const seen = second.last('you').list[0]; assert.equal(seen.n, first === a ? 'An b' : 'Bình'); assert.equal(seen.look.h, '#ff0000'); assert.equal(seen.look.x, undefined, 'unknown fields are dropped'); assert.equal(seen.look.a, 'hero');

a.send({ t: 'm', x: 12.3456, z: -7, h: 1.2, y: 99, a: 2, evil: 'x' }); await wait(300);
const mv = b.last('m'); assert.deepEqual(mv, { t: 'm', id: a.id, x: 12.35, z: -7, h: 1.2, y: 7, a: 2 }, 'a move is cleaned and passed on');
assert.equal(a.last('m'), undefined, 'not echoed to the sender');

a.send({ t: 's', k: 3 }); a.send({ t: 's', k: 4 }); a.send({ t: 's', k: 999 }); a.send({ t: 's', k: 'hello free text' }); a.send('not json'); a.send({ t: 'chat', text: 'free text' }); await wait(300);
assert.deepEqual(b.got.filter((m) => m.t === 's'), [{ t: 's', id: a.id, k: 3 }], 'only a known line, and not two at once');

b.send({ t: 'r', r: 'forest' }); await wait(300); assert.deepEqual(a.last('r'), { t: 'r', id: b.id, r: 'forest' });
const n0 = b.got.filter((m) => m.t === 'm').length; a.send({ t: 'm', x: 1, z: 1, h: 0, y: 0, a: 0 }); await wait(300);
assert.equal(b.got.filter((m) => m.t === 'm').length, n0, 'moves stay in their own land');
b.send({ t: 'u', lv: 9, look: { a: 'girl1' } }); await wait(300); assert.equal(a.last('u').lv, 9); assert.equal(a.last('u').look.a, 'girl1');

const c = client('ABC234', 'Chi'); await c.ready; await wait(400); assert.equal(c.last('you').list.length, 2); assert.equal(c.last('you').list.find((p) => p.id === a.id).at.x, 1, 'a newcomer gets the last places');
const other = client('XYZ789', 'Other'); await other.ready; await wait(300); assert.equal(other.last('you').list.length, 0, 'another code is another room');

b.ws.close(); await wait(500); assert.deepEqual(a.last('out'), { t: 'out', id: b.id });
const d = client('ABC234', 'Dũng'); await d.ready; await wait(400); assert.equal(d.id, b.id, 'a freed number is used again'); assert.equal(d.last('you').list.length, 2);

// a full room
const more = []; for (let i = 0; i < 5; i++) { const x = client('ABC234', 'M' + i); await x.ready; more.push(x); } await wait(500);
const ninth = client('ABC234', 'Ninth'); await wait(900); assert.equal(ninth.closed, 4001, 'the ninth is told the room is full');
// an old game
const old = new WebSocket(`${BASE}/room/VER234`); let oc = 0; old.onclose = (e) => { oc = e.code; }; old.onopen = () => old.send(JSON.stringify({ t: 'hi', v: 0, n: 'x' })); await wait(600); assert.equal(oc, 4010);
// a flood
const fl = client('FLD234', 'Flood'); await fl.ready; await wait(200); for (let i = 0; i < 80; i++) fl.send({ t: 'm', x: i, z: 0, h: 0, y: 0, a: 0 }); await wait(800); assert.equal(fl.closed, 4008, 'a flood is cut');
for (const x of [a, c, d, other, ...more]) x.ws.close();
await wait(300); console.log('room server: all checks passed'); process.exit(0);
