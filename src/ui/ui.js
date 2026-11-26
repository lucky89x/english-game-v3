// DOM interface: profile menu, HUD, clue card with progressive hints, dialogue with choices, prompt.
import * as Save from '../core/save.js';
import { speak, stop } from './speech.js';
import { ADMIN_PASS } from './admin.js';
import { rankName, rankOf } from '../core/saga.js';
import { levelCap } from '../core/progress.js';
// Ngọc and her friends on the profile screen (rendered from the game models by tools/chibi05/menu_heroes.py)
const HEROES = '<div class="heroes"><img src="./assets/ui/menu_heroes.png" alt="Ngọc và các bạn" onerror="this.parentNode.remove()"></div>';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor() { this.busy = false; this.pages = null; this.onPick = null; this.onDone = null;
    this.gloss = new Map();      // lower-case word or phrase -> Vietnamese (the grade's vocabulary), set by main
    $('dialog').addEventListener('click', (e) => {
      const w = e.target.closest('.w'); if (w) { this.showGloss(w.dataset.w); return; }
      if (e.target.closest('[data-act="say"]')) { const p = this.pages && this.pages[0]; if (p) speak(p.card ? p.card.word : p.en, true); return; }
      if (e.target.closest('[data-act="skip"]')) { this.skip(); return; }
      if (!e.target.closest('button')) this.advance(); }); }
  get modal() { return this.busy || !$('menu').classList.contains('hidden'); }

  // ---------------------------------------------------------------- profiles
  showMenu(store, onChoose) {
    const card = $('menucard'); $('menu').classList.remove('hidden');
    const list = () => {
      card.innerHTML = `<h1>English Quest</h1>${HEROES}<h2>${store.profiles.length ? 'Ai đang chơi?' : 'Chào mừng! Tạo hồ sơ cho con nhé.'}</h2><div class="list"></div>
        <button id="mnew">+ Thêm người chơi mới</button>
        <div class="small"><button id="mimport">Nhập hồ sơ (JSON)</button> <input id="mfile" type="file" accept="application/json" class="hidden"> <button id="madmin">🔑 Quản trị</button></div>`;
      const box = card.querySelector('.list');
      for (const p of store.profiles) { const b = document.createElement('button'); b.textContent = `${p.name} · Lớp ${p.grade}`; b.dataset.profile = p.id; b.onclick = () => { $('menu').classList.add('hidden'); onChoose(p); }; box.appendChild(b); }
      $('mnew').onclick = create;
      $('madmin').onclick = adminLogin;
      $('mimport').onclick = () => $('mfile').click();
      $('mfile').onchange = async (e) => { try { Save.importProfile(store, await e.target.files[0].text()); Save.persist(store); list(); } catch (err) { alert(err.message); } };
      (box.querySelector('button') || $('mnew')).focus();
    };
    // admin: a password box; the admin profile is created once and kept with the others (ui/admin.js)
    const adminLogin = () => {
      card.innerHTML = `<h1>English Quest</h1><h2>🔑 Quản trị</h2><input id="mpass" type="password" maxlength="20" placeholder="Mật khẩu">
        <div class="small" id="mpmsg"></div><button id="mpok">Vào</button> <button id="mback">Quay lại</button>`;
      const go = () => {
        if ($('mpass').value !== ADMIN_PASS) { $('mpmsg').textContent = 'Sai mật khẩu.'; return; }
        let p = store.profiles.find((x) => x.admin);
        if (!p) { p = Save.newProfile('Admin', 6); p.admin = true; p.flags.arrived = true; store.profiles.push(p); Save.persist(store); }
        $('menu').classList.add('hidden'); onChoose(p);
      };
      $('mpok').onclick = go; $('mpass').onkeydown = (e) => { if (e.key === 'Enter') go(); }; $('mback').onclick = list; $('mpass').focus();
    };
    const create = () => {
      let grade = 0;
      card.innerHTML = `<h1>English Quest</h1>${HEROES}<h2>Tên của con</h2><input id="mname" type="text" maxlength="20" placeholder="Ví dụ: Minh">
        <h2>Con đang học lớp mấy?</h2><div class="grades">${Save.GRADES.map((g) => `<button data-g="${g}">Lớp ${g}</button>`).join('')}</div>
        <button id="mgo" disabled>Bắt đầu phiêu lưu!</button> <button id="mback">Quay lại</button>`;
      card.querySelectorAll('[data-g]').forEach((b) => (b.onclick = () => { grade = Number(b.dataset.g); card.querySelectorAll('[data-g]').forEach((x) => x.classList.toggle('on', x === b)); $('mgo').disabled = false; }));
      $('mback').onclick = list;
      $('mgo').onclick = () => { const p = Save.newProfile($('mname').value, grade); store.profiles.push(p); Save.persist(store); $('menu').classList.add('hidden'); onChoose(p); };
      $('mname').focus();
    };
    list();
  }

  // ---------------------------------------------------------------- HUD + clue
  hud(profile, place, extra, learned, food = 0) {
    const st = profile.stats, need = Save.expNeed(st.level), hpMax = Save.maxHp(profile), hp = Math.min(hpMax, st.hp ?? hpMax);
    $('hud').classList.remove('hidden');
    $('hud').innerHTML = `<div class="top"><div class="portrait"><i></i><span class="lv">${st.level}</span></div>
      <div class="who"><b>${esc(profile.name)}</b><small>${(() => { const r = rankName(profile); return rankOf(profile) ? `${r.icon} ${r.en} · ` : ''; })()}Lớp ${profile.grade} · ${esc(place)}</small>
        <div class="bar hp" title="Máu"><u style="width:${Math.round(hp / hpMax * 100)}%"></u><em>${Math.round(hp)}/${hpMax}</em></div>
        <div class="bar xp" title="${Save.atCap(profile) ? 'Đã tối đa cấp ' + levelCap(profile) + ' ở vùng này: không còn EXP, vàng giảm dần về 0. Sang vùng mới để chơi tiếp' : 'Kinh nghiệm'}"><u style="width:${Math.min(100, Math.round(st.exp / need * 100))}%"></u><em>${Save.atCap(profile) ? 'TỐI ĐA cấp ' + levelCap(profile) + ' ở vùng này' : `EXP ${st.exp}/${need}`}</em></div></div></div>
      <div class="chips"><span class="chip gold" title="Vàng"><i>●</i>${st.gold}</span><span class="chip word" title="Từ đã học"><i>✎</i>${learned}</span>${extra ? `<span class="chip star">${esc(extra)}</span>` : ''}${food ? `<span class="chip food" title="Bánh (phím Q)"><i>🍞</i>${food}</span>` : ''}</div>`;
  }
  /** Big centre banner for a level up or a reward. */
  toast(text) { const el = $('toast'); if (!el) return; el.textContent = text; el.style.animationDuration = Math.min(7, Math.max(2.2, 1 + String(text).length * 0.06)).toFixed(1) + 's'; el.style.fontSize = String(text).length > 60 ? '21px' : ''; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }      // (26/11) a long line stays long enough to be read
  /** clue: {text, key} | null; level 0..3; meaning: Vietnamese of the keyword */
  clue(clue, level, meaning, note) {
    const el = $('clue');
    if (!clue && !note) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    if (!clue) { el.innerHTML = typeof note === 'object' ? `<div class="en" style="font-size:17px">${esc(note.en)}</div><div style="font-size:14px;opacity:.85;margin-top:3px">${esc(note.vi)}</div>` : `<div class="en" style="font-size:17px">${esc(note)}</div>`; return; }      // (26/11) a note may carry its Vietnamese line
    let text = esc(clue.text);
    if (level >= 1) text = text.replace(esc(clue.key), `<mark>${esc(clue.key)}</mark>`);
    const canHint = clue.hints !== false;
    el.innerHTML = `<div class="who">${esc(clue.who || 'Pip')} says:</div><div class="en">${text}</div>` +
      (level >= 2 ? `<div class="vi">${esc(meaning)}</div>` : '') + (level >= 3 ? '<div class="vi">Chỗ cần tới đã hiện dấu ★ trên bản đồ nhỏ.</div>' : '') +
      (canHint ? `<div class="tip">${level < 3 ? 'H: xin gợi ý' + (level ? ' thêm' : '') : 'Đã dùng hết gợi ý'}</div>` : (clue.tip ? `<div class="tip">${esc(clue.tip)}</div>` : ''));
  }
  prompt(text) { const want = !text || this.busy ? '' : text; if (want === this.lastPrompt) return; this.lastPrompt = want; const el = $('prompt'); if (!want) el.classList.add('hidden'); else { el.textContent = want; el.classList.remove('hidden'); } }   // only touch the page when the text changes

  // ---------------------------------------------------------------- dialogue
  dialogue(pages, done) { this.pages = pages.slice(); this.onDone = done || null; this.onPick = null; this.busy = true; this.render(); }
  choose(page, options, pick) { this.pages = [page]; this.options = options; this.onPick = pick; this.onDone = null; this.busy = true; this.render(); }
  /** Wraps the words of a line that are in the grade's word list: tapping one shows its meaning and reads it. */
  marked(text) {
    const parts = String(text).split(/(\s+)/), out = [];
    for (let i = 0; i < parts.length; i++) {
      let hit = 0;
      for (let n = 3; n >= 1 && !hit; n--) {          // longest phrase first ("pencil case" before "case")
        const span = parts.slice(i, i + n * 2 - 1); if (span.length < n * 2 - 1) continue;
        const key = span.join('').toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
        if (key && this.gloss.has(key)) hit = n * 2 - 1;
      }
      if (!hit) { out.push(esc(parts[i])); continue; }
      const raw = parts.slice(i, i + hit).join(''), m = /^([^A-Za-z]*)(.*?)([^A-Za-z]*)$/.exec(raw);
      out.push(`${esc(m[1])}<span class="w" data-w="${esc(m[2].toLowerCase())}">${esc(m[2])}</span>${esc(m[3])}`); i += hit - 1;
    }
    return out.join('');
  }
  showGloss(w) { const vi = this.gloss.get(w), el = $('dialog').querySelector('.gl'); speak(w, true, 0.75); if (el) { el.innerHTML = `<b>${esc(w)}</b> = ${esc(vi || '')}`; el.classList.remove('hidden'); } }
  render() {
    // no skip button in talks (18/11): children read and listen to every line; only the word book has a close button
    const p = this.pages[0], el = $('dialog'), more = !this.onPick && !!p.book; el.classList.remove('hidden'); $('prompt').classList.add('hidden');
    const tools = `<span class="tools"><button data-act="say" title="Nghe lại">🔊</button>${more ? (p.book ? '<button data-act="skip" title="Đóng sổ (Esc)">Đóng ✕</button>' : '') : ''}</span>`;
    if (p.card) {          // "new word" card: taught before the child is asked about it
      el.innerHTML = `<div class="who">${esc(p.who || 'Từ mới')}</div>${tools}<div class="card-w"><span class="big">${esc(p.card.word)}</span><span class="mean">= ${esc(p.card.vi)}</span></div>` +
        `<div class="vi">${esc(p.vi || 'Nghe, đọc theo rồi nhớ nghĩa nhé.')}</div><div class="next">Đã nhớ · E / Space ▸</div>`;
      speak(p.card.word, true, 0.75);
    } else {
      el.innerHTML = `<div class="who">${esc(p.who === 'Ngọc' && this.hero ? this.hero : p.who)}</div>${tools}<div class="en">${this.onPick ? esc(p.en) : this.marked(p.en)}</div>${p.vi ? `<div class="vi">${esc(p.vi)}</div>` : ''}<div class="gl hidden"></div>` +
        (this.onPick ? `<div class="opts">${this.options.map((o, i) => `<button data-i="${i}">${i + 1}. ${esc(o)}</button>`).join('')}</div>` : '<div class="next">E / Space / bấm chuột ▸</div>');
      speak(p.en);
    }
    el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => this.pick(Number(b.dataset.i))));
  }
  /** Jumps to the last page of a long talk (it carries the Vietnamese "what to do now" line). */
  skip() { if (this.busy && this.pages && this.pages[0].book) this.close(); }      // Esc closes only the word book; talks have no skip
  pick(i) { if (!this.onPick || i < 0 || i >= this.options.length) return; const f = this.onPick; this.close(); f(i); }
  advance() {
    if (!this.busy || this.onPick) return;
    this.pages.shift();
    if (this.pages.length) return this.render();
    const done = this.onDone; this.close(); if (done) done();
  }
  close() { stop(); this.busy = false; this.pages = null; this.onPick = null; this.onDone = null; $('dialog').classList.add('hidden'); }
  key(e) {
    if (!this.busy) return false;
    if (this.onPick) { const i = e.code.startsWith('Digit') ? Number(e.code.slice(5)) - 1 : -1; if (i >= 0) this.pick(i); return true; }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { this.advance(); return true; }
    if (e.code === 'Escape' || e.code === 'Tab') { this.skip(); return true; }
    return true;
  }
}
