// (27/11, turn 69) Playing together: the room this child is in. It owns the line (net/link.js), tells the drawn
// children (game/peers.js) what the server says, and sends this child's place a few times a second while it changes.
// The game gives it small functions (api) and calls tick() every frame; nothing here touches three.js.
import { RoomLink } from './link.js';
import * as N from '../core/net.js';

export class Online {
  /** api: { server() -> address or '', me() -> { n, lv, look, r }, region() -> land id or 'home', place() -> { x, z, h, y, a } or null,
   *         peers, toast(text), speak(en), act(anim), changed() } */
  constructor(api) {
    this.api = api; this.code = ''; this.id = 0; this.last = null; this.note = ''; this.saidAt = 0; this.cardAt = 0; this.cardText = ''; this.r = '';
    this.link = new RoomLink({ state: (s, code) => this.onState(s, code), message: (m) => this.onMessage(m) });
  }
  get state() { return this.link.state; }
  get on() { return this.link.state === 'on'; }
  get ready() { return !!this.api.server(); }
  /** Everyone in the room but this child: [{ id, n, lv, r, here }]. */
  get friends() { return this.api.peers.list.map((p) => ({ id: p.id, n: p.n, lv: p.lv, r: p.r, here: p.r === this.r })); }
  create() { return this.join(N.newCode()); }
  join(code) {
    const c = N.cleanCode(code), url = N.roomUrl(this.api.server(), c);
    if (!c) { this.note = `Mã phòng có ${N.CODE_LEN} chữ và số (không có chữ I, O, số 0, 1).`; this.api.changed(); return false; }
    if (!url) { this.note = 'Chưa có địa chỉ máy chủ phòng (bố mẹ nhập trong bảng Quản trị).'; this.api.changed(); return false; }
    this.code = c; this.note = ''; this.r = this.api.region(); this.api.peers.setRegion(this.r);
    this.link.open(url, () => this.api.me()); return true;
  }
  leave() { this.link.close(); this.api.peers.clear(); this.code = ''; this.id = 0; this.note = ''; this.api.changed(); }
  onState(s, code) {
    if (s === 'failed') { this.note = code ? N.closeText(code) : 'Không nối được tới phòng. Kiểm tra mạng rồi thử lại nhé.'; this.api.peers.clear(); this.api.toast('👫 ' + this.note); }
    if (s === 'retry') this.api.peers.clear();
    this.api.changed();
  }
  card(p) { return { id: Number(p.id) || 0, n: N.cleanName(p.n), lv: Math.max(1, Math.min(99, Math.round(Number(p.lv) || 1))), look: N.cleanLook(p.look), r: N.cleanRegion(p.r), at: p.at && typeof p.at === 'object' ? N.cleanMove(p.at) : null }; }
  onMessage(m) {
    const peers = this.api.peers, who = (id) => { const p = peers.get(id); return p ? p.n : 'Bạn'; };
    if (m.t === 'you') {
      this.id = m.id; peers.clear(); for (const p of Array.isArray(m.list) ? m.list.slice(0, N.ROOM_MAX) : []) peers.add(this.card(p));
      this.last = null; this.cardText = JSON.stringify(this.mine()); this.api.toast(`👫 Đã vào phòng ${this.code}` + (peers.list.length ? ` · ${peers.list.length} bạn đang ở trong` : ' · đọc mã này cho bạn nhé'));
    } else if (m.t === 'in' && m.p) { const p = this.card(m.p); if (!p.id || p.id === this.id) return; peers.add(p); this.last = null; this.api.toast(`👫 ${p.n} vừa vào phòng`); }
    else if (m.t === 'out') { if (peers.get(m.id)) this.api.toast(`👫 ${who(m.id)} đã rời phòng`); peers.remove(m.id); }
    else if (m.t === 'm') { peers.move(m.id, N.cleanMove(m)); return; }
    else if (m.t === 'r') { const r = N.cleanRegion(m.r); peers.enter(m.id, r); if (r === this.r) this.last = null; }
    else if (m.t === 'u') peers.card(m.id, Math.max(1, Math.min(99, Math.round(Number(m.lv) || 1))), N.cleanLook(m.look));
    else if (m.t === 's') { const ph = N.PHRASES[m.k]; if (!ph || !peers.get(m.id)) return; peers.say(m.id, ph.en, ph.anim); this.api.toast(`💬 ${who(m.id)}: ${ph.en}`); this.api.speak(ph.en); return; }
    else return;
    this.api.changed();
  }
  mine() { const me = this.api.me(); return { lv: me.lv, look: me.look }; }
  /** Every frame. now: ms. */
  tick(now) {
    if (!this.on) return;
    const r = this.api.region();
    if (r !== this.r) { this.r = r; this.link.send({ t: 'r', r }); this.api.peers.setRegion(r); this.last = null; this.api.changed(); }
    if (now - this.cardAt > 3000) { this.cardAt = now; const c = this.mine(), text = JSON.stringify(c); if (text !== this.cardText) { this.cardText = text; this.link.send({ t: 'u', ...c }); } }
    const at = this.api.place(); if (!at) return;
    const cur = N.cleanMove(at); if (N.shouldSend(this.last, cur, now)) { this.link.send({ t: 'm', ...cur }); this.last = { ...cur, at: now }; }
  }
  /** Says ready-made line k; false when it is too soon after the last one. */
  say(k, now = Date.now()) {
    const ph = N.PHRASES[k]; if (!this.on || !ph) return false;
    if (now - this.saidAt < N.SAY_GAP) return false; this.saidAt = now;
    this.link.send({ t: 's', k }); if (ph.anim) this.api.act(ph.anim); this.api.toast(`💬 ${ph.en}`); this.api.speak(ph.en); return true;
  }
}
