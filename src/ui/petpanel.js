// The pet card (phím P, 19/11): adopt a pet, then care for it in English: it asks for a food by name (pick the picture) and
// learns tricks from English commands (pick the meaning). Care fills the bars and raises the bond.
import { Panel } from './panel.js';
import * as PET from '../core/pet.js';

export class PetPanel {
  /** api: { profile(), today(), changed(), cared() (a paid care action), speak(text), sfx(name), playTrick(id), adopted() } */
  constructor(api) { this.api = api; this.q = null; this.msg = ''; this.panel = new Panel({ id: 'petwin', onAction: (a, v) => this.act(a, v), onClose: () => { this.q = null; } }); }
  get open() { return this.panel.open; }
  key(code) { return this.panel.key(code); }
  show() { this.q = null; this.msg = ''; const p = this.api.profile(); if (p.pet) PET.tick(p.pet); this.draw(true); }
  ask(kind) { this.q = kind === 'food' ? PET.foodQuestion() : PET.trickQuestion(); this.msg = ''; this.api.speak(this.q.say); }
  act(a, v) {
    const p = this.api.profile(), day = this.api.today();
    if (a === 'adopt') { PET.adopt(p, v, day); this.msg = `${p.pet.name} joins you! ${PET.PETS[v].says}`; this.api.adopted(); this.api.sfx('fanfare'); }
    else if (a === 'feed' || a === 'train') this.ask(a === 'feed' ? 'food' : 'trick');
    else if (a === 'say') this.api.speak(this.q.say);
    else if (a === 'back') { this.q = null; this.msg = ''; }
    else if (a === 'gift') { const g = PET.dailyGift(p, day); this.msg = g ? `${p.pet.name} dug up ${g.gold} gold for you! 🪙` : `${p.pet.name} has no gift now. Feed and play first, then come back tomorrow.`; if (g) this.api.sfx('fanfare'); }
    else if (a === 'ans' && this.q) {
      const q = this.q, ok = Number(v) === q.a; this.api.sfx(ok ? 'correct' : 'wrong'); this.q = null;
      if (ok && q.kind === 'food') { const r = PET.feed(p, day); if (r.paid) this.api.cared(); this.msg = `Yum! ${p.pet.name} loves the ${q.word.en}. ${r.paid ? '+3 gắn bó' : '(hôm nay đã chăm đủ, gắn bó không tăng thêm)'}`; }
      else if (ok) { const r = PET.train(p, q.answer, day); if (r.paid) this.api.cared(); this.api.playTrick(q.answer); this.msg = r.isNew ? `${p.pet.name} learned "${q.word.en}" (${q.word.vi})! ${r.paid ? '+6 gắn bó' : ''}` : `Good! ${p.pet.name} did "${q.word.en}" again. ${r.paid ? '+3 gắn bó' : ''}`; }
      else this.msg = `Hmm… "${q.word.en}" means "${q.word.vi}" (${q.word.icon}). Try again!`;
    }
    this.api.changed(); this.draw();
  }
  draw(first) {
    const p = this.api.profile(), pet = p.pet; let body;
    if (!pet) body = `<div class="note">Chọn một người bạn nhỏ đi theo con khắp cảng. Con chăm bạn bằng tiếng Anh: gọi tên món ăn, học lệnh. Bạn càng gắn bó càng tặng thêm vàng.</div><div class="grid">${Object.entries(PET.PETS).map(([k, v]) => `<button class="it" data-a="adopt" data-v="${k}" style="cursor:pointer"><span class="ic">${v.icon}</span><b>${v.en}</b>${v.vi}<br><small>Nhận nuôi</small></button>`).join('')}</div>`;
    else {
      const L = PET.bondLevel(pet), info = PET.PETS[pet.kind], q = this.q, bar = (n, c) => `<div class="bar"><i style="width:${Math.round(n)}%;background:${c}"></i></div>`;
      body = `<div class="row"><span style="font-size:40px">${info.icon}</span><div style="flex:1"><b style="font-size:18px">${pet.name}</b> the ${info.en} · ${info.vi}<div class="note">Gắn bó cấp ${L} (+${Math.min(5, L) * 4}% vàng khi đánh quái) · ${pet.bond} điểm</div></div></div>
        🍽 No bụng ${bar(pet.hunger, '#e8943a')} 💛 Vui vẻ ${bar(pet.joy, '#e8c23a')}`;
      if (q) body += `<div class="q" style="margin:8px 0"><h3>${pet.name} says: "${q.say}"</h3><div class="note">${q.kind === 'food' ? 'Chọn đúng hình món ăn thú cưng đang xin.' : 'Chọn đúng nghĩa của lệnh tiếng Anh.'}</div><div class="grid">${q.options.map((o, i) => `<button class="it" data-a="ans" data-v="${i}" style="cursor:pointer"><span class="ic">${o.icon}</span>${q.kind === 'food' ? '' : `<b>${o.vi}</b>`}</button>`).join('')}</div><div class="row"><button data-a="say">🔊 Nghe lại</button><button data-a="back">Thôi</button></div></div>`;
      else body += `<div class="row"><button data-a="feed">🍎 Cho ăn (đoán món)</button><button data-a="train">🎓 Học lệnh</button><button data-a="gift">🎁 Quà hằng ngày</button></div>
        <h3>Trò đã học · Tricks</h3><div class="note">${pet.tricks.length ? pet.tricks.map((id) => { const t = PET.TRICKS.find((x) => x.id === id); return `${t.icon} ${t.en} (${t.vi})`; }).join(' · ') : 'Chưa biết trò nào. Bấm "Học lệnh".'}</div>`;
    }
    if (this.msg) body += `<div class="note" style="font-weight:800;color:#0a5a3a">${this.msg}</div>`;
    const icon = pet ? PET.PETS[pet.kind].icon : '🐾';
    if (first) this.panel.show(icon, pet ? `${pet.name} · Thú cưng` : 'Pet · Nhận nuôi thú cưng', body); else this.panel.draw(icon, pet ? `${pet.name} · Thú cưng` : 'Pet · Nhận nuôi thú cưng', body);
  }
}
