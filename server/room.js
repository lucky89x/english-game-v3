// English Quest room server (27/11, turn 69): one small Cloudflare Worker with a Durable Object per room.
// It only passes messages between the children in one room: where each one stands, which ready-made English line
// was said. It keeps nothing: no accounts, no saves, no log of who played. A room is found only by its code.
// Everything a client sends goes through cleanMsg (src/core/net.js) before it is passed on.
//
// Free plan notes: Durable Objects need the SQLite backend there (wrangler.toml: new_sqlite_classes), and the
// WebSocket Hibernation API below lets an idle room sleep, so a quiet room costs nothing.
import { DurableObject } from 'cloudflare:workers';
import { cleanCode, cleanMsg, ROOM_MAX, MSG_MAX, RATE_MAX, SAY_GAP, CLOSE, PROTO } from '../src/core/net.js';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/' || url.pathname === '/health') return new Response(JSON.stringify({ ok: true, what: 'English Quest room server', proto: PROTO }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    const m = /^\/room\/([A-Za-z0-9]{1,12})$/.exec(url.pathname), code = m ? cleanCode(m[1]) : '';
    if (!code) return new Response('no such room', { status: 404, headers: CORS });
    if ((req.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('a WebSocket is expected here', { status: 426, headers: CORS });
    return env.ROOM.get(env.ROOM.idFromName(code)).fetch(req);
  },
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.place = new Map();      // id -> the last place heard (lost when the room sleeps; the clients send theirs again when someone arrives)
    this.meter = new Map();      // id -> { at, n, said }: a flood from one client closes its socket
  }
  /** Everyone who has said hello, as [socket, card]. */
  crowd() { const out = []; for (const ws of this.ctx.getWebSockets()) { const c = ws.deserializeAttachment(); if (c && c.ok) out.push([ws, c]); } return out; }
  send(ws, o) { try { ws.send(JSON.stringify(o)); } catch { /* a socket that just closed */ } }
  cast(o, { but = 0, region = '' } = {}) { const text = JSON.stringify(o); for (const [ws, c] of this.crowd()) if (c.id !== but && (!region || c.r === region)) { try { ws.send(text); } catch { /* closed */ } } }

  async fetch() {
    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    const all = this.ctx.getWebSockets();
    if (all.length >= ROOM_MAX) { server.accept(); server.close(CLOSE.full, 'room full'); return new Response(null, { status: 101, webSocket: client }); }
    const used = new Set(all.map((ws) => (ws.deserializeAttachment() || {}).id)); let id = 1; while (used.has(id)) id += 1;
    this.ctx.acceptWebSocket(server); server.serializeAttachment({ id, ok: false });
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, raw) {
    const card = ws.deserializeAttachment(); if (!card) return;
    if (typeof raw !== 'string' || raw.length > MSG_MAX) { ws.close(1009, 'too big'); return; }
    const now = Date.now(); let mt = this.meter.get(card.id); if (!mt || now - mt.at >= 1000) { mt = { at: now, n: 0, said: mt ? mt.said : 0 }; this.meter.set(card.id, mt); }
    if (++mt.n > RATE_MAX) { ws.close(CLOSE.fast, 'too fast'); return; }
    let data = null; try { data = JSON.parse(raw); } catch { return; }
    if (data && data.t === 'hi' && data.v !== PROTO) { ws.close(CLOSE.old, 'other version'); return; }
    const m = cleanMsg(data); if (!m) return;
    if (m.t === 'hi') {
      const mine = { id: card.id, ok: true, n: m.n, lv: m.lv, look: m.look, r: m.r }; ws.serializeAttachment(mine);
      const list = this.crowd().filter(([, c]) => c.id !== mine.id).map(([, c]) => ({ id: c.id, n: c.n, lv: c.lv, look: c.look, r: c.r, at: this.place.get(c.id) || null }));
      this.send(ws, { t: 'you', id: mine.id, max: ROOM_MAX, list });
      this.cast({ t: 'in', p: { id: mine.id, n: mine.n, lv: mine.lv, look: mine.look, r: mine.r, at: null } }, { but: mine.id });
      return;
    }
    if (!card.ok) return;      // nothing is passed on before the hello
    if (m.t === 'm') { const at = { x: m.x, z: m.z, h: m.h, y: m.y, a: m.a }; this.place.set(card.id, at); this.cast({ t: 'm', id: card.id, ...at }, { but: card.id, region: card.r }); return; }
    if (m.t === 'r') { card.r = m.r; ws.serializeAttachment(card); this.place.delete(card.id); this.cast({ t: 'r', id: card.id, r: m.r }, { but: card.id }); return; }
    if (m.t === 's') { if (now - mt.said < SAY_GAP) return; mt.said = now; this.cast({ t: 's', id: card.id, k: m.k }, { but: card.id }); return; }
    if (m.t === 'u') { card.lv = m.lv; card.look = m.look; ws.serializeAttachment(card); this.cast({ t: 'u', id: card.id, lv: m.lv, look: m.look }, { but: card.id }); }
  }

  gone(ws) {
    const card = ws.deserializeAttachment(); if (!card) return;
    this.place.delete(card.id); this.meter.delete(card.id);
    if (card.ok) { ws.serializeAttachment({ id: card.id, ok: false }); this.cast({ t: 'out', id: card.id }, { but: card.id }); }
  }
  webSocketClose(ws, code) { this.gone(ws); try { ws.close(code === 1005 || code === 1006 ? 1000 : code, 'bye'); } catch { /* already closed */ } }
  webSocketError(ws) { this.gone(ws); }
}
