// DOM interface: profile menu, HUD, clue card with progressive hints, dialogue with choices, prompt.
import * as Save from '../core/save.js';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor() { this.busy = false; this.pages = null; this.onPick = null; this.onDone = null;
    $('dialog').addEventListener('click', (e) => { if (!e.target.closest('button')) this.advance(); }); }
  get modal() { return this.busy || !$('menu').classList.contains('hidden'); }

  // ---------------------------------------------------------------- profiles
  showMenu(store, onChoose) {
    const card = $('menucard'); $('menu').classList.remove('hidden');
    const list = () => {
      card.innerHTML = `<h1>English Quest</h1><h2>${store.profiles.length ? 'Ai đang chơi?' : 'Chào mừng! Tạo hồ sơ cho con nhé.'}</h2><div class="list"></div>
        <button id="mnew">+ Thêm người chơi mới</button>
        <div class="small"><button id="mimport">Nhập hồ sơ (JSON)</button> <input id="mfile" type="file" accept="application/json" class="hidden"></div>`;
      const box = card.querySelector('.list');
      for (const p of store.profiles) { const b = document.createElement('button'); b.textContent = `${p.name} · Lớp ${p.grade}`; b.dataset.profile = p.id; b.onclick = () => { $('menu').classList.add('hidden'); onChoose(p); }; box.appendChild(b); }
      $('mnew').onclick = create;
      $('mimport').onclick = () => $('mfile').click();
      $('mfile').onchange = async (e) => { try { Save.importProfile(store, await e.target.files[0].text()); Save.persist(store); list(); } catch (err) { alert(err.message); } };
      (box.querySelector('button') || $('mnew')).focus();
    };
    const create = () => {
      let grade = 0;
      card.innerHTML = `<h1>English Quest</h1><h2>Tên của con</h2><input id="mname" type="text" maxlength="20" placeholder="Ví dụ: Minh">
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
    const st = profile.stats, need = 60 + (st.level - 1) * 30, hpMax = 100 + (st.level - 1) * 12 + ((profile.gear && profile.gear.hp) || 0), hp = Math.min(hpMax, st.hp ?? hpMax);
    $('hud').classList.remove('hidden');
    $('hud').innerHTML = `<div class="top"><div class="portrait"><i></i><span class="lv">${st.level}</span></div>
      <div class="who"><b>${esc(profile.name)}</b><small>Lớp ${profile.grade} · ${esc(place)}</small>
        <div class="bar hp" title="Máu"><u style="width:${Math.round(hp / hpMax * 100)}%"></u><em>${Math.round(hp)}/${hpMax}</em></div>
        <div class="bar xp" title="Kinh nghiệm"><u style="width:${Math.min(100, Math.round(st.exp / need * 100))}%"></u><em>EXP ${st.exp}/${need}</em></div></div></div>
      <div class="chips"><span class="chip gold" title="Vàng"><i>●</i>${st.gold}</span><span class="chip word" title="Từ đã học"><i>✎</i>${learned}</span>${extra ? `<span class="chip star"><i></i>${esc(extra)}</span>` : ''}${food ? `<span class="chip food" title="Bánh (phím Q)"><i>🍞</i>${food}</span>` : ''}</div>`;
  }
  /** Big centre banner for a level up or a reward. */
  toast(text) { const el = $('toast'); if (!el) return; el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
  /** clue: {text, key} | null; level 0..3; meaning: Vietnamese of the keyword */
  clue(clue, level, meaning, note) {
    const el = $('clue');
    if (!clue && !note) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    if (!clue) { el.innerHTML = `<div class="en" style="font-size:17px">${esc(note)}</div>`; return; }
    let text = esc(clue.text);
    if (level >= 1) text = text.replace(esc(clue.key), `<mark>${esc(clue.key)}</mark>`);
    const canHint = clue.hints !== false;
    el.innerHTML = `<div class="who">${esc(clue.who || 'Pip')} says:</div><div class="en">${text}</div>` +
      (level >= 2 ? `<div class="vi">${esc(meaning)}</div>` : '') + (level >= 3 ? '<div class="vi">Chỗ cần tới đã hiện dấu ★ trên bản đồ nhỏ.</div>' : '') +
      (canHint ? `<div class="tip">${level < 3 ? 'H: xin gợi ý' + (level ? ' thêm' : '') : 'Đã dùng hết gợi ý'}</div>` : (clue.tip ? `<div class="tip">${esc(clue.tip)}</div>` : ''));
  }
  prompt(text) { const el = $('prompt'); if (!text || this.busy) el.classList.add('hidden'); else { el.textContent = text; el.classList.remove('hidden'); } }

  // ---------------------------------------------------------------- dialogue
  dialogue(pages, done) { this.pages = pages.slice(); this.onDone = done || null; this.onPick = null; this.busy = true; this.render(); }
  choose(page, options, pick) { this.pages = [page]; this.options = options; this.onPick = pick; this.onDone = null; this.busy = true; this.render(); }
  render() {
    const p = this.pages[0], el = $('dialog'); el.classList.remove('hidden'); $('prompt').classList.add('hidden');
    el.innerHTML = `<div class="who">${esc(p.who)}</div><div class="en">${esc(p.en)}</div>${p.vi ? `<div class="vi">${esc(p.vi)}</div>` : ''}` +
      (this.onPick ? `<div class="opts">${this.options.map((o, i) => `<button data-i="${i}">${i + 1}. ${esc(o)}</button>`).join('')}</div>` : '<div class="next">E / Space / bấm chuột ▸</div>');
    el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => this.pick(Number(b.dataset.i))));
  }
  pick(i) { if (!this.onPick || i < 0 || i >= this.options.length) return; const f = this.onPick; this.close(); f(i); }
  advance() {
    if (!this.busy || this.onPick) return;
    this.pages.shift();
    if (this.pages.length) return this.render();
    const done = this.onDone; this.close(); if (done) done();
  }
  close() { this.busy = false; this.pages = null; this.onPick = null; this.onDone = null; $('dialog').classList.add('hidden'); }
  key(e) {
    if (!this.busy) return false;
    if (this.onPick) { const i = e.code.startsWith('Digit') ? Number(e.code.slice(5)) - 1 : -1; if (i >= 0) this.pick(i); return true; }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { this.advance(); return true; }
    return true;
  }
}
