// (27/11, turn 69) The line to a room (server/room.js): one WebSocket that says hello, hands every message to the game,
// and dials again by itself when the line drops. Nothing here knows about the game; src/net/online.js does.
import { PROTO, CLOSE } from '../core/net.js';

export class RoomLink {
  /** on: { state(name, closeCode), message(msg) }; states: off, connecting, on, retry, failed */
  constructor(on) { this.on = on; this.ws = null; this.state = 'off'; this.want = false; this.tries = 0; this.timer = 0; }
  set(state, code = 0) { this.state = state; if (this.on.state) this.on.state(state, code); }
  /** url: wss://…/room/CODE; hello(): what this child shows of itself (asked again at every dial). */
  open(url, hello) { this.close(); this.url = url; this.hello = hello; this.want = true; this.tries = 0; this.dial(); }
  dial() {
    this.set(this.tries ? 'retry' : 'connecting');
    let ws; try { ws = new WebSocket(this.url); } catch { this.want = false; this.set('failed'); return; }
    this.ws = ws; let greeted = false;
    ws.onopen = () => { if (ws === this.ws) ws.send(JSON.stringify({ t: 'hi', v: PROTO, ...this.hello() })); };
    ws.onmessage = (e) => {
      if (ws !== this.ws) return;
      let m = null; try { m = JSON.parse(e.data); } catch { return; }
      if (!m || typeof m !== 'object') return;
      if (m.t === 'you') { greeted = true; this.tries = 0; this.set('on'); }
      if (this.on.message) this.on.message(m);
    };
    ws.onclose = (e) => {
      if (ws !== this.ws) return; this.ws = null;
      if (!this.want) { this.set('off'); return; }
      const final = [CLOSE.full, CLOSE.fast, CLOSE.old].includes(e.code);
      if (final || (!greeted && this.tries >= 2) || this.tries >= 6) { this.want = false; this.set('failed', e.code); return; }      // never reached the room: give up soon; a dropped line: try for a while
      this.tries += 1; this.set('retry'); clearTimeout(this.timer); this.timer = setTimeout(() => { if (this.want) this.dial(); }, Math.min(8000, 1200 * this.tries));
    };
    ws.onerror = () => { /* the close that follows decides */ };
  }
  send(o) { if (this.ws && this.ws.readyState === 1 && this.state === 'on') { this.ws.send(JSON.stringify(o)); return true; } return false; }
  close() { this.want = false; clearTimeout(this.timer); const ws = this.ws; this.ws = null; if (ws) { try { ws.close(1000, 'bye'); } catch { /* closing */ } } if (this.state !== 'off') this.set('off'); }
}
