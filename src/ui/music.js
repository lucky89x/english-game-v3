// Anna's music room (18/11: "the Music and Songs house should have songs the children like, with the words, so they
// learn while they listen"). A few short songs: one traditional song (public domain) and three written for this game,
// played by a little synthesiser in the browser; the line being sung lights up, with its Vietnamese meaning below and
// a 🔊 button that reads it. Listening to a whole song the first time pays a small reward.
// Commercial songs (BLACKPINK and others) are protected by copyright, so their lyrics are not copied into the game:
// a button opens the artist's official YouTube channel instead (internet needed).
import { speak } from './speech.js';
import { STYLES, GENRES, gameMusic, endMusic, musicStyle } from '../audio.js';

const NOTE = (n) => { const m = /^([A-G])(#?)(\d)$/.exec(n); const k = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12; return 440 * 2 ** (k / 12); };
const seq = (s) => s.trim().split(/\s+/).map((t) => { const [n, b] = t.split(':'); return [n, Number(b || 1)]; });
// (21/11) "children's songs do not suit grades 6 and 8": three pop-style songs written for this game, sung over a backing
// loop of their genre (audio.js STYLES), with everyday teen topics: a new start, the weekend, never giving up.
export const SONGS = [
  { id: 'row', title: 'Row, Row, Row Your Boat', by: 'Traditional (public domain)', bpm: 108, lines: [
    { en: 'Row, row, row your boat,', vi: 'Chèo, chèo, chèo thuyền đi,', m: seq('C4 C4 C4:0.75 D4:0.25 E4') },
    { en: 'Gently down the stream.', vi: 'Nhẹ nhàng xuôi theo dòng suối.', m: seq('E4:0.75 D4:0.25 E4:0.75 F4:0.25 G4:2') },
    { en: 'Merrily, merrily, merrily, merrily,', vi: 'Vui vẻ, vui vẻ, vui vẻ, vui vẻ,', m: seq('C5:0.33 C5:0.33 C5:0.34 G4:0.33 G4:0.33 G4:0.34 E4:0.33 E4:0.33 E4:0.34 C4:0.33 C4:0.33 C4:0.34') },
    { en: 'Life is but a dream.', vi: 'Cuộc đời như một giấc mơ.', m: seq('G4:0.75 F4:0.25 E4:0.75 D4:0.25 C4:2') }] },
  { id: 'room', title: 'My Little Room', by: 'English Quest song', bpm: 116, lines: [
    { en: "There's a lamp on my desk and a bed by the wall,", vi: 'Có cái đèn trên bàn và chiếc giường sát tường,', m: seq('E4:0.5 G4:0.5 A4 G4:0.5 E4:0.5 D4 E4:0.5 G4:0.5 A4:2') },
    { en: 'A clock and a picture, I love them all.', vi: 'Một cái đồng hồ, một bức tranh, tớ yêu tất cả.', m: seq('A4:0.5 C5:0.5 A4 G4:0.5 E4:0.5 G4 E4:0.5 D4:0.5 C4:2') },
    { en: 'A sofa, a window, a big blue door,', vi: 'Một chiếc sofa, một ô cửa sổ, một cánh cửa xanh to,', m: seq('E4:0.5 G4:0.5 A4 C5:0.5 A4:0.5 G4 A4:0.5 G4:0.5 E4:2') },
    { en: "My room is small, but I don't need more!", vi: 'Phòng tớ nhỏ thôi, nhưng tớ chẳng cần hơn!', m: seq('D4:0.5 E4:0.5 G4 A4:0.5 G4:0.5 E4 D4:0.5 D4:0.5 C4:2') }] },
  { id: 'friend', title: 'Hello, New Friend', by: 'English Quest song', bpm: 120, lines: [
    { en: "Hello, hello, what's your name?", vi: 'Xin chào, xin chào, bạn tên là gì?', m: seq('G4 E4 G4 E4 A4:0.5 G4:0.5 F4:0.5 E4:0.5 D4:2') },
    { en: 'Do you want to play a game?', vi: 'Bạn có muốn chơi một trò chơi không?', m: seq('F4:0.5 F4:0.5 D4 F4:0.5 F4:0.5 D4 G4:0.5 F4:0.5 E4:2') },
    { en: 'I like music, I like art,', vi: 'Tớ thích âm nhạc, tớ thích mĩ thuật,', m: seq('E4:0.5 E4:0.5 G4 C5 E4:0.5 E4:0.5 G4 C5') },
    { en: 'Friends are friends right from the start!', vi: 'Bạn bè là bạn bè ngay từ phút đầu!', m: seq('B4:0.5 A4:0.5 G4 F4:0.5 E4:0.5 D4 E4:0.5 D4:0.5 C4:2') }] },
  { id: 'step', title: 'Step by Step', by: 'English Quest song', bpm: 100, lines: [
    { en: 'Step by step and word by word,', vi: 'Từng bước một và từng từ một,', m: seq('A3:0.5 C4:0.5 E4 A4:0.5 G4:0.5 E4 D4:0.5 E4:0.5 C4:2') },
    { en: 'Every voice deserves to be heard.', vi: 'Mỗi giọng nói đều xứng đáng được lắng nghe.', m: seq('C4:0.5 D4:0.5 E4 G4:0.5 A4:0.5 G4 E4:0.5 D4:0.5 E4:2') },
    { en: 'If I fall, I try again,', vi: 'Nếu ngã, tớ lại thử lần nữa,', m: seq('A3:0.5 C4:0.5 E4 A4 G4:0.5 E4:0.5 D4:2') },
    { en: 'One more word, and one more friend!', vi: 'Thêm một từ mới, thêm một người bạn!', m: seq('E4:0.5 G4:0.5 A4 C5:0.5 B4:0.5 A4 G4:0.5 E4:0.5 A4:2') }] },
  { id: 'newday', title: 'Brand New Day', by: 'English Quest song · Pop / Synthwave', teen: true, style: 'synthwave', bpm: 108, lines: [
    { en: 'Woke up early, the sky is blue,', vi: 'Thức dậy sớm, bầu trời xanh trong,', m: seq('E4:0.5 E4:0.5 A4 A4:0.5 G4:0.5 E4 C5:0.5 B4:0.5 A4:2') },
    { en: "I've got a feeling something's new.", vi: 'Mình có cảm giác điều gì đó mới mẻ.', m: seq('C5:0.5 C5:0.5 B4 A4:0.5 G4:0.5 E4 G4:0.5 A4:0.5 E4:2') },
    { en: "It's a brand new day, I'm on my way,", vi: 'Một ngày hoàn toàn mới, mình đang lên đường,', m: seq('A4:0.5 C5:0.5 E5 D5:0.5 C5:0.5 A4 C5:0.5 D5:0.5 E5:2') },
    { en: "Nothing's gonna stop me today!", vi: 'Hôm nay chẳng gì cản được mình!', m: seq('E5:0.5 D5:0.5 C5 B4:0.5 A4:0.5 G4 B4:0.5 G4:0.5 A4:2') }] },
  { id: 'weekend', title: 'Weekend Plans', by: 'English Quest song · Lo-fi', teen: true, style: 'lofi', bpm: 78, lines: [
    { en: 'On Saturday I sleep until ten,', vi: 'Thứ Bảy mình ngủ tới mười giờ,', m: seq('A4:0.5 A4:0.5 G4 F4:0.5 A4:0.5 C5 A4:0.5 G4:0.5 F4:2') },
    { en: 'Then I hang out with all my friends.', vi: 'Rồi mình đi chơi với tất cả bạn bè.', m: seq('G4:0.5 G4:0.5 F4 D4:0.5 F4:0.5 B4 A4:0.5 G4:0.5 E4:2') },
    { en: 'We watch a film and share some snacks,', vi: 'Tụi mình xem phim và chia nhau đồ ăn vặt,', m: seq('E4:0.5 G4:0.5 B4 A4:0.5 G4:0.5 E4 G4:0.5 A4:0.5 B4:2') },
    { en: 'On Sunday night I do my homework, relax.', vi: 'Tối Chủ nhật mình làm bài tập, rồi thư giãn.', m: seq('A4:0.5 G4:0.5 E4 C4:0.5 E4:0.5 G4 E4:0.5 D4:0.5 C4:2') }] },
  { id: 'rise', title: 'We Rise', by: 'English Quest song · EDM', teen: true, style: 'edm', bpm: 126, lines: [
    { en: 'When the test is hard and the night is long,', vi: 'Khi bài kiểm tra khó và đêm thật dài,', m: seq('A4:0.5 A4:0.5 C5 A4:0.5 G4:0.5 F4 G4:0.5 A4:0.5 C5:2') },
    { en: 'I sing it loud, I sing my song.', vi: 'Mình hát thật to, hát bài ca của mình.', m: seq('B4:0.5 B4:0.5 D5 B4:0.5 A4:0.5 G4 A4:0.5 B4:0.5 G4:2') },
    { en: 'We fall, we learn, we try again,', vi: 'Tụi mình ngã, tụi mình học, rồi thử lại,', m: seq('G4:0.5 B4:0.5 D5 E5:0.5 D5:0.5 B4 G4:0.5 A4:0.5 B4:2') },
    { en: 'We rise together, side by side, my friends!', vi: 'Chúng ta cùng vươn lên, sát cánh bên nhau, các bạn ơi!', m: seq('C5:0.5 C5:0.5 E5 C5:0.5 B4:0.5 A4 C5:0.5 B4:0.5 A4:2') }] },
];
const CSS = `
#music { position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center; background:rgba(20,12,30,.6); }
#music.hidden { display:none; }
#music .room { width:min(900px, calc(100vw - 24px)); max-height:calc(100vh - 24px); overflow:auto; border-radius:18px; border:6px solid #3a2a6a; padding:12px 14px; color:#2a1a40;
  background: radial-gradient(circle at 20% 10%, rgba(255,230,160,.45), transparent 45%), repeating-linear-gradient(45deg, #e9dcff 0 18px, #e2d2fb 18px 36px); box-shadow:0 12px 36px rgba(0,0,0,.5); }
#music header { display:flex; align-items:center; gap:12px; background:#fff8e8; border:3px solid #6a4aa0; border-radius:12px; padding:8px 12px; }
#music header h2 { margin:0; flex:1; font-size:22px; }
#music button { font:inherit; font-weight:800; border:2px solid #6a4aa0; border-radius:9px; background:#ffe9b0; padding:3px 10px; cursor:pointer; }
#music .body { display:grid; grid-template-columns:200px 1fr; gap:12px; margin-top:12px; }
#music .anna { background:#fff8e8; border:3px solid #6a4aa0; border-radius:14px; padding:8px; text-align:center; }
#music .anna img { width:160px; height:170px; object-fit:cover; object-position:top; border-radius:50% 50% 12px 12px; border:4px solid #e2b04a; background:#fff; }
#music .list button { display:block; width:100%; margin:4px 0; text-align:left; background:#fff; } #music .list button.on { background:#c8b4ff; }
#music .sheet { background:#fffdf6; border:3px solid #6a4aa0; border-radius:14px; padding:10px 14px; }
#music .sheet h3 { margin:0 0 2px; } #music .sheet small { color:#7a6a90; }
#music .line { margin:8px 0; padding:6px 10px; border-radius:10px; border:2px solid transparent; }
#music .line.now { background:#fff1b8; border-color:#e2b04a; } #music .line .en { font-size:20px; font-weight:800; } #music .line .vi { font-size:14px; color:#6a5a80; }
#music .line button { float:right; font-size:12px; padding:1px 6px; }
#music .kpop { margin-top:10px; background:#fff0f6; border:2px dashed #d04a8a; border-radius:12px; padding:8px 10px; font-size:13px; }
`;

/** Gold for one full song from the family's own music (18/11: "to listen you pay in gold, and play the whole song"). */
export const PLAY_PRICE = 10;
/** The family's own songs: the desktop app reads Documents/EnglishQuest/music; in a browser, assets/music/list.json. */
async function familySongs() {
  if (globalThis.eqDesktop && globalThis.eqDesktop.musicList) { try { return globalThis.eqDesktop.musicList() || []; } catch { return []; } }
  try {
    const r = await fetch('./assets/music/list.json'); if (!r.ok) return [];
    const list = await r.json();
    return Promise.all(list.map(async (x) => ({ title: x.title || x.file, url: './assets/music/' + x.file, lyrics: x.lyrics ? await fetch('./assets/music/' + x.lyrics).then((t) => (t.ok ? t.text() : '')).catch(() => '') : '' })));
  } catch { return []; }
}
export class MusicRoom {
  /** api: { profile(), sfx(name), changed() } */
  constructor(api) {
    this.api = api; this.open = false; this.song = SONGS.find((x) => x.teen) || SONGS[0]; this.now = -1; this.timers = [];
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'music'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) { if (e.target === this.el) this.close(); return; }
      const a = b.dataset.a;
      if (a === 'close') this.close();
      if (a === 'song') { this.stop(); this.song = SONGS.find((s) => s.id === b.dataset.v); this.render(); }
      if (a === 'play') this.play();
      if (a === 'stop') { this.stop(); this.render(); }
      if (a === 'say') speak(this.song.lines[Number(b.dataset.v)].en, true, 0.85);
      if (a === 'kpop') window.open('https://www.youtube.com/@BLACKPINK', '_blank');
      if (a === 'own') { this.stop(); this.pick = this.songs[Number(b.dataset.v)]; this.render(); }
      if (a === 'learn') { this.stop(); this.pick = null; this.render(); }
      if (a === 'buy') this.playOwn();
      if (a === 'radio') { this.stop(); this.radio = b.dataset.v; gameMusic(this.radio); this.say = `📻 ${STYLES[this.radio].name}: nhạc tự soạn cho game, nghe miễn phí.`; this.render(); }
      if (a === 'radiooff') { this.stop(); this.render(); }
    });
  }
  show() { familySongs().then((l) => { this.songs = l; this.render(); }); this.open = true; this.say = 'Hi! I\'m Anna. Pick a song and sing with me!'; this.render(); this.el.classList.remove('hidden'); speak(this.say); }
  close() { this.stop(); this.open = false; this.el.classList.add('hidden'); if (this.api.onClose) this.api.onClose(); }
  key(code) { if (!this.open) return false; if (code === 'Escape' || code === 'KeyE') this.close(); return true; }
  stop() { if (this.radio || (this.song && this.song.style && this.timers.length)) { endMusic(); this.radio = null; } if (this.audio) { this.audio.pause(); this.audio = null; } for (const t of this.timers) clearTimeout(t); this.timers = []; this.now = -1; if (this.ctx) { try { this.ctx.close(); } catch { /* closed */ } this.ctx = null; } }
  /** Plays the melody with a soft plucked sound and lights up each line as it is sung. */
  play() {
    this.stop(); const song = this.song, beat = 60 / song.bpm; if (song.style) gameMusic(song.style);      // the backing loop under the tune
    let ctx = null; try { ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); } catch { ctx = null; }
    this.ctx = ctx; let t = 0.15;
    song.lines.forEach((ln, i) => {
      this.timers.push(setTimeout(() => { this.now = i; this.render(); }, t * 1000));
      for (const [n, b] of ln.m) {
        if (ctx) { const o = ctx.createOscillator(), g = ctx.createGain(), f = NOTE(n), at = ctx.currentTime + t, len = b * beat;
          o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.22, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.15, len * 0.95));
          o.connect(g).connect(ctx.destination); o.start(at); o.stop(at + len); }
        t += b * beat;
      }
      t += beat * 0.5;
    });
    this.timers.push(setTimeout(() => { if (song.style) endMusic(); this.finish(); }, t * 1000));
    this.render();
  }
  /** A whole song from the family's music, paid in gold; the words (if the family added them) are shown while it plays. */
  playOwn() {
    const p = this.api.profile(), s = this.pick; if (!s) return;
    if (p.stats.gold < PLAY_PRICE) { this.say = `You need ${PLAY_PRICE} gold to play a song. Win some in the mini games!`; this.api.sfx('wrong'); this.render(); return; }
    this.stop(); p.stats.gold -= PLAY_PRICE; this.api.changed();
    const a = new Audio(s.url); this.audio = a; a.volume = 0.9;
    a.onended = () => { this.audio = null; if (this.api.track) this.api.track('song'); this.say = 'That was a great song! Want another one?'; this.render(); };
    a.onerror = () => { this.audio = null; p.stats.gold += PLAY_PRICE; this.api.changed(); this.say = 'This file cannot be played. Your gold is back.'; this.render(); };
    a.play().catch(() => {}); this.say = `Now playing: ${s.title} (−${PLAY_PRICE} gold)`; this.api.sfx('tick'); this.render();
  }
  finish() {
    if (this.api.track) this.api.track('song');
    const p = this.api.profile(), heard = p.songs || (p.songs = {}); this.now = -1;
    if (!heard[this.song.id]) { heard[this.song.id] = true; p.stats.gold += 5; this.say = `Great singing! You learned "${this.song.title}". (+5 gold)`; this.api.sfx('fanfare'); this.api.changed(); }
    else this.say = 'Lovely! Want to sing another one?';
    this.render();
  }
  render() {
    if (!this.open) return;
    const p = this.api.profile(), heard = (p && p.songs) || {}, s = this.song, playing = this.timers.length > 0, own = this.songs || [], pk = this.pick;
    const folder = globalThis.eqDesktop && globalThis.eqDesktop.musicFolder ? globalThis.eqDesktop.musicFolder() : 'assets/music (file list.json)';
    const sheet = pk ? `<h3>🎧 ${pk.title}</h3><small>Nhạc của gia đình · ${PLAY_PRICE} vàng mỗi lần phát cả bài</small>
        <div style="margin:6px 0">${this.audio ? '<button data-a="stop">■ Dừng</button>' : `<button data-a="buy">▶ Phát cả bài (${PLAY_PRICE} ●)</button>`} <button data-a="learn">← Bài học hát</button></div>
        ${pk.lyrics ? pk.lyrics.split(/\r?\n/).map((l) => `<div class="line"><div class="en">${l.replace(/[<>&]/g, '')}</div></div>`).join('') : '<p class="vi">Bài này chưa có lời. Muốn hiện lời, thêm file .txt cùng tên vào thư mục nhạc.</p>'}`
      : `<h3>${s.title}</h3><small>${s.by}</small><div style="margin:6px 0">${playing ? '<button data-a="stop">■ Dừng</button>' : '<button data-a="play">▶ Phát nhạc và hát theo</button>'}</div>
        ${s.lines.map((ln, i) => `<div class="line ${i === this.now ? 'now' : ''}"><button data-a="say" data-v="${i}">🔊</button><div class="en">${ln.en}</div><div class="vi">${ln.vi}</div></div>`).join('')}`;
    this.el.innerHTML = `<div class="room"><header><span style="font-size:28px">🎵</span><h2>Anna's Music Room</h2><span class="gold" style="font-weight:800">● ${p.stats.gold}</span><button data-a="close">Leave (Esc)</button></header>
      <div class="body"><div class="anna"><img src="assets/ui/keeper_anna.jpg" alt="Anna"><b>Anna</b><p style="font-weight:700;font-size:13px">${this.say || ''}</p>
        <div class="list"><b style="font-size:13px">🎤 Bài hát cho tuổi teen</b>${SONGS.filter((x) => x.teen).map((x) => `<button data-a="song" data-v="${x.id}" class="${!pk && x.id === s.id ? 'on' : ''}">${heard[x.id] ? '✔' : '♪'} ${x.title}</button>`).join('')}
        <b style="font-size:13px">🧸 Bài hát thiếu nhi</b>${SONGS.filter((x) => !x.teen).map((x) => `<button data-a="song" data-v="${x.id}" class="${!pk && x.id === s.id ? 'on' : ''}">${heard[x.id] ? '✔' : '♪'} ${x.title}</button>`).join('')}
        <b style="font-size:13px;margin-top:6px">📻 Đài nhạc theo thể loại</b>${GENRES.map((gid) => `<button data-a="radio" data-v="${gid}" class="${this.radio === gid ? 'on' : ''}">📻 ${STYLES[gid].name}</button>`).join('')}${this.radio ? '<button data-a="radiooff">■ Tắt đài</button>' : ''}
        <b style="font-size:13px;margin-top:6px">🎧 Nghe nhạc (${PLAY_PRICE} ● / bài)</b>${own.length ? own.map((x, i) => `<button data-a="own" data-v="${i}" class="${pk === x ? 'on' : ''}">🎧 ${x.title}</button>`).join('') : `<small>Chưa có bài nào. Phụ huynh chép file nhạc (.mp3) vào thư mục: <b>${folder}</b></small>`}</div></div>
      <div class="sheet">${sheet}
        <div class="kpop">🎤 <b>Nhạc K-pop (BLACKPINK…)</b>: game không tự chép bài hay lời có bản quyền. Phụ huynh có file nhạc thì chép vào thư mục nhạc ở trên (lời bài hát để file .txt cùng tên) là con nghe được ở đây. Hoặc nghe bản chính thức: <button data-a="kpop">Mở kênh BLACKPINK</button></div></div></div></div>`;
  }
}
