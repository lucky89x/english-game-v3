// Anna's music room (18/11: "the Music and Songs house should have songs the children like, with the words, so they
// learn while they listen"). A few short songs: one traditional song (public domain) and three written for this game,
// played by a little synthesiser in the browser; the line being sung lights up, with its Vietnamese meaning below and
// a 🔊 button that reads it. Listening to a whole song the first time pays a small reward.
// Commercial songs (BLACKPINK and others) are protected by copyright, so their lyrics are not copied into the game:
// a button opens the artist's official YouTube channel instead (internet needed).
import { speak } from './speech.js';

const NOTE = (n) => { const m = /^([A-G])(#?)(\d)$/.exec(n); const k = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12; return 440 * 2 ** (k / 12); };
const seq = (s) => s.trim().split(/\s+/).map((t) => { const [n, b] = t.split(':'); return [n, Number(b || 1)]; });
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

export class MusicRoom {
  /** api: { profile(), sfx(name), changed() } */
  constructor(api) {
    this.api = api; this.open = false; this.song = SONGS[0]; this.now = -1; this.timers = [];
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
    });
  }
  show() { this.open = true; this.say = 'Hi! I\'m Anna. Pick a song and sing with me!'; this.render(); this.el.classList.remove('hidden'); speak(this.say); }
  close() { this.stop(); this.open = false; this.el.classList.add('hidden'); if (this.api.onClose) this.api.onClose(); }
  key(code) { if (!this.open) return false; if (code === 'Escape' || code === 'KeyE') this.close(); return true; }
  stop() { for (const t of this.timers) clearTimeout(t); this.timers = []; this.now = -1; if (this.ctx) { try { this.ctx.close(); } catch { /* closed */ } this.ctx = null; } }
  /** Plays the melody with a soft plucked sound and lights up each line as it is sung. */
  play() {
    this.stop(); const song = this.song, beat = 60 / song.bpm;
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
    this.timers.push(setTimeout(() => this.finish(), t * 1000));
    this.render();
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
    const p = this.api.profile(), heard = (p && p.songs) || {}, s = this.song, playing = this.timers.length > 0;
    this.el.innerHTML = `<div class="room"><header><span style="font-size:28px">🎵</span><h2>Anna's Music Room</h2><button data-a="close">Leave (Esc)</button></header>
      <div class="body"><div class="anna"><img src="assets/ui/keeper_anna.jpg" alt="Anna"><b>Anna</b><p style="font-weight:700;font-size:13px">${this.say || ''}</p>
        <div class="list">${SONGS.map((x) => `<button data-a="song" data-v="${x.id}" class="${x.id === s.id ? 'on' : ''}">${heard[x.id] ? '✔' : '♪'} ${x.title}</button>`).join('')}</div></div>
      <div class="sheet"><h3>${s.title}</h3><small>${s.by}</small><div style="margin:6px 0">${playing ? '<button data-a="stop">■ Dừng</button>' : '<button data-a="play">▶ Phát nhạc và hát theo</button>'}</div>
        ${s.lines.map((ln, i) => `<div class="line ${i === this.now ? 'now' : ''}"><button data-a="say" data-v="${i}">🔊</button><div class="en">${ln.en}</div><div class="vi">${ln.vi}</div></div>`).join('')}
        <div class="kpop">🎤 <b>Nhạc K-pop (BLACKPINK…)</b>: lời bài hát có bản quyền nên game không chép vào được. Bấm để nghe bản chính thức trên YouTube (cần mạng, phụ huynh nên ngồi cùng): <button data-a="kpop">Mở kênh BLACKPINK</button></div></div></div></div>`;
  }
}
