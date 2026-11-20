// "Inside the shop" (17/11, redone 18/11: "a framed room with item icons, prices and the level needed, shelves, a
// shopkeeper to talk to and a word quest"). A wooden room with two counters. Each counter has its keeper (portrait
// from the character sheets), a speech bubble, a Talk button and a daily word quest: the keeper asks the English
// names of three things on the shelves. Goods stand on wooden shelves in framed cards: big icon, English name,
// Vietnamese meaning, what it does, a price tag and a lock when the level is too low. Buy / Wear / Sell buttons.
import { ITEMS, bag, buy, sell, sellPrice, shopList, wear, home, foodCount } from '../core/rules.js';
import { speak } from './speech.js';
import { ELEMENTS } from '../core/skills.js';
import { gearIcon } from '../game/gear.js';

const ICON = { wood_sword: '🗡️', iron_sword: '⚔️', crystal_blade: '🔷', leather_vest: '🦺', iron_armor: '🛡️', clover: '🍀', bread: '🍞',
  oak_blade: '🪵', moon_sword: '🌙', ranger_cloak: '🧥', bark_armor: '🌳', owl_feather: '🪶', forest_stew: '🍲',
  apple: '🍎', carrot: '🥕', banana: '🍌', corn: '🌽', watermelon: '🍉', bed: '🛏️', wardrobe: '🚪', mirror: '🪞', table: '🍽️', sofa: '🛋️', lamp: '💡', bookcase: '📚',
  desk: '✏️', clock: '🕰️', picture: '🖼️', rug: '🟥', plant: '🪴', flowers: '🌷', veg_patch: '🥬', fruit_tree: '🌳', bench: '🪑', mailbox: '📮', garden_lamp: '🏮',
  guitar: '🎸', piano: '🎹', drum: '🥁', violin: '🎻' };
const KEEPERS = {
  forge: { name: 'Bram', img: 'assets/ui/keeper_bram.jpg', title: "⚒️ Bram's counter", sub: 'Weapons & Armour · vũ khí và giáp',
    talk: ['A good sword is a hero\'s best friend.', 'Iron is strong, but crystal is stronger!', 'Wear armour before you visit the Wild Meadow.', 'I make every blade by hand. Clang, clang!'] },
  rose: { name: 'Rose', img: 'assets/ui/keeper_rose.jpg', title: "🥖 Rose's counter", sub: 'Bread & Charms · bánh và bùa',
    talk: ['My honey bread makes you feel strong again.', 'A lucky clover keeps you safe on long trips.', 'I bake fresh bread every morning at six.', 'Press Q to eat bread when you are hurt!'] },
  home: { name: 'Bram', img: 'assets/ui/keeper_bram.jpg', title: "🪑 Bram's furniture", sub: 'Furniture · đồ đạc cho nhà con',
    talk: ['I make tables and beds as well as swords!', 'A bed and a lamp make any house feel like home.', 'Every chair is made of strong oak.', 'Your new home is waiting for you in the west fields.'] },
  garden: { name: 'Lily', img: 'assets/ui/keeper_lily.jpg', title: "🌷 Lily's garden corner", sub: 'Garden · vườn tược',
    talk: ['Flowers make a yard smile.', 'Water your vegetables every day.', 'A fruit tree grows slowly, but it gives you apples for years.', 'Sit on a bench and listen to the birds.'] },
  produce: { name: 'Ben', img: 'assets/ui/keeper_ben.jpg', title: "🍎 Ben's fruit and vegetables", sub: 'Fruit & veg · rau, hoa quả (phím Q để ăn)',
    talk: ['Fresh apples, fresh carrots! Come and buy!', 'A watermelon is big, sweet and full of water.', 'Eat your vegetables and you will be strong.', 'Bananas are yellow, carrots are orange, apples are red!'] },
  music: { name: 'Anna', img: 'assets/ui/keeper_anna.jpg', title: "🎵 Anna's instruments", sub: 'Instruments · nhạc cụ cho nhà con',
    talk: ['Music makes every room happy.', 'A guitar has six strings.', 'The piano has black keys and white keys.', 'Bang the drum slowly, then quickly!'] },
  forest: { name: 'Willow', img: 'assets/ui/keeper_willow.jpg', title: "🌿 Willow's camp shop", sub: 'Forest gear · đồ của rừng (Map 2)',
    talk: ['The forest is dark. Strong armour keeps you safe.', 'Moonlight makes my swords shine.', 'Owls are wise. Their feathers bring good health.', 'My stew is hot and full of mushrooms. Not angry ones!'] },
};
const CSS = `
#shopwin { position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center; background:rgba(30,16,6,.6); }
#shopwin.hidden { display:none; }
#shopwin .room { width:min(980px, calc(100vw - 24px)); max-height:calc(100vh - 24px); overflow:auto; border-radius:18px; border:6px solid #5a3410; padding:12px 14px 14px; color:#3a2008; font-family:inherit;
  background: radial-gradient(circle at 15% 0%, rgba(255,214,140,.35), transparent 40%), radial-gradient(circle at 85% 0%, rgba(255,214,140,.35), transparent 40%),
    repeating-linear-gradient(90deg, #b9824c 0 54px, #ad7643 54px 57px), #b9824c; box-shadow:0 12px 36px rgba(0,0,0,.5), inset 0 0 0 3px #d9a86a; }
#shopwin header { display:flex; align-items:center; gap:12px; background:linear-gradient(#fff3d6, #f4dfb0); border:3px solid #7a4a1a; border-radius:12px; padding:8px 12px; }
#shopwin header h2 { margin:0; font-size:22px; flex:1; } #shopwin header .gold { font-weight:800; font-size:18px; color:#9a6a00; } #shopwin header .lv { font-weight:800; color:#2f6f2f; }
#shopwin button { font:inherit; font-weight:800; border:2px solid #7a4a1a; border-radius:9px; background:#ffd98a; padding:3px 10px; cursor:pointer; }
#shopwin button:disabled { opacity:.45; cursor:default; } #shopwin button.sell { background:#e8f4ff; } #shopwin button.quest { background:#c8f0b0; }
#shopwin .counter { margin-top:12px; display:grid; grid-template-columns:190px 1fr; gap:12px; }
#shopwin .keeper { background:rgba(255,243,214,.95); border:3px solid #7a4a1a; border-radius:14px; padding:8px; text-align:center; }
#shopwin .keeper img { width:150px; height:150px; object-fit:cover; object-position:top; border-radius:50% 50% 12px 12px; border:4px solid #e2b04a; background:#fff; }
#shopwin .keeper b { display:block; font-size:16px; margin:2px 0; }
#shopwin .bubble { position:relative; background:#fff; border:2px solid #b07a3c; border-radius:12px; padding:6px 8px; font-size:13px; font-weight:700; min-height:40px; text-align:left; margin:6px 0; }
#shopwin .bubble .opts { display:flex; flex-direction:column; gap:4px; margin-top:6px; } #shopwin .bubble .opts button { font-size:13px; text-align:left; background:#fff3d6; }
#shopwin .shelfbox { background:rgba(255,243,214,.9); border:3px solid #7a4a1a; border-radius:14px; padding:8px 10px 0; }
#shopwin .shelfbox h3 { margin:0 0 6px; font-size:16px; } #shopwin .shelfbox h3 small { font-weight:600; color:#7a5a30; }
#shopwin .shelf { display:grid; grid-template-columns:repeat(auto-fill, minmax(168px, 1fr)); gap:10px; padding:0 4px 10px;
  border-bottom:14px solid #7a4a1a; box-shadow:0 6px 0 #5a3410; margin-bottom:10px; background:linear-gradient(transparent 85%, rgba(90,52,16,.18)); }
#shopwin .card { position:relative; background:linear-gradient(#fffaf0, #f6e6c4); border:3px solid #b07a3c; border-radius:12px; padding:8px; display:flex; flex-direction:column; gap:3px; box-shadow:0 3px 0 rgba(90,52,16,.35); }
#shopwin .card .ic img { width:56px; height:56px; object-fit:contain; }
#shopwin .card .ic { width:64px; height:64px; margin:0 auto 2px; display:flex; align-items:center; justify-content:center; font-size:40px; border-radius:12px; border:3px solid #e2b04a; background:radial-gradient(#fff, #f6e2b0); }
#shopwin .card b { font-size:15px; text-align:center; } #shopwin .card .vi { font-size:12px; color:#7a5a30; text-align:center; }
#shopwin .card .st { font-size:12px; font-weight:800; color:#2f6f2f; text-align:center; }
#shopwin .card .tag { position:absolute; top:-8px; right:-8px; background:#ffd23c; border:2px solid #9a6a00; border-radius:20px; padding:1px 8px; font-weight:900; font-size:13px; transform:rotate(8deg); }
#shopwin .card .lock { font-size:12px; font-weight:800; color:#b03020; text-align:center; } #shopwin .card.locked .ic { filter:grayscale(.8); opacity:.6; }
#shopwin .card .row { display:flex; gap:5px; flex-wrap:wrap; justify-content:center; margin-top:auto; } #shopwin .card .on { color:#2f6f2f; font-weight:800; font-size:13px; }
#shopwin .msg { margin-top:4px; min-height:22px; font-weight:700; text-align:center; background:#fff3d6; border-radius:10px; padding:4px; }
`;

export class ShopWindow {
  /** api: { profile(), changed(), sfx(name), today() } */
  constructor(api) {
    this.api = api; this.open = false; this.say = {}; this.quiz = null;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'shopwin'; this.el.className = 'hidden'; document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) { if (e.target === this.el) this.close(); return; }
      const id = b.dataset.id, act = b.dataset.act; if (act === 'close') return this.close();
      this.act(act, id, b.dataset.k);
    });
  }
  show(title = 'Village Shop', counters = ['forge', 'rose']) {
    this.title = title; this.counters = counters; this.open = true; this.quiz = null;
    this.say = { forge: 'Welcome! Look at my blades.', rose: 'Hello! Fresh bread today!', forest: 'Welcome to my camp, brave explorer!' };
    this.msg = 'Buy = mua · Wear = mặc · Sell = bán lại nửa giá. Bấm 📜 để nhận nhiệm vụ từ vựng của chủ quầy.';
    this.render(); this.el.classList.remove('hidden');
  }
  close() { this.open = false; this.el.classList.add('hidden'); if (this.api.onClose) this.api.onClose(); }
  key(code) { if (!this.open) return false; if (code === 'Escape' || code === 'KeyE') this.close(); return true; }
  /** The keeper's word quest: three questions about the goods on the shelves, once a day per keeper. */
  startQuest(k) {
    const p = this.api.profile(), day = this.api.today(), done = (p.shopQuest || (p.shopQuest = {}));
    if (done[k] === day) { this.say[k] = 'You did my word quest today. Come back tomorrow!'; return; }
    const ids = Object.keys(ITEMS), pick = [...ids].sort(() => Math.random() - 0.5).slice(0, 3);
    this.quiz = { k, list: pick, n: 0, right: 0 }; this.ask();
  }
  ask() {
    const q = this.quiz, id = q.list[q.n], it = ITEMS[id], others = Object.keys(ITEMS).filter((x) => x !== id).sort(() => Math.random() - 0.5).slice(0, 2);
    q.opts = [id, ...others].sort(() => Math.random() - 0.5);
    this.say[q.k] = `(${q.n + 1}/3) What is "${it.vi.split(' (')[0]}" in English?`;
  }
  answer(i) {
    const q = this.quiz, id = q.list[q.n], ok = q.opts[i] === id, it = ITEMS[id];
    if (ok) q.right += 1; this.api.sfx(ok ? 'correct' : 'wrong'); speak(it.en, true, 0.85);
    q.n += 1;
    if (q.n < q.list.length) { this.ask(); if (!ok) this.say[q.k] = `It's "${it.en}". ` + this.say[q.k]; return; }
    const p = this.api.profile(), gold = q.right * 6; p.stats.gold += gold; (p.shopQuest || (p.shopQuest = {}))[q.k] = this.api.today();
    this.say[q.k] = q.right === 3 ? `Perfect! You know all the shop words! (+${gold} gold)` : `${q.right} of 3 right. (+${gold} gold) Try again tomorrow!`;
    this.quiz = null; if (this.api.track) this.api.track('shopquest'); this.api.changed();
  }
  act(what, id, k) {
    const p = this.api.profile(), it = ITEMS[id], b = bag(p);
    if (what === 'talk') { const lines = KEEPERS[k].talk; this.say[k] = lines[Math.floor(Math.random() * lines.length)]; speak(this.say[k]); this.quiz = null; }
    if (what === 'quest') this.startQuest(k);
    if (what === 'ans') { this.answer(Number(id)); this.render(); return; }
    if (what === 'buy') { const r = buy(p, id); this.msg = r.ok ? (it.slot === 'home' || it.slot === 'yard' ? `You bought the ${it.en}! It is in your home now.` : `You bought the ${it.en}!`) : r.why === 'have' ? `You already have a ${it.en} at home.` : r.why === 'gold' ? `Not enough gold: the ${it.en} costs ${it.cost} ●.` : `The ${it.en} is for level ${it.level} heroes.`; this.api.sfx(r.ok ? 'correct' : 'wrong'); }
    if (what === 'wear') { b[it.slot] = b[it.slot] === id ? '' : id; wear(p); this.msg = b[it.slot] === id ? `You are wearing the ${it.en}.` : `You took off the ${it.en}.`; this.api.sfx('tick'); }
    if (what === 'sell') { const g = sell(p, id); this.msg = g ? `You sold the ${it.en} for ${g} gold.` : ''; this.api.sfx(g ? 'correct' : 'wrong'); }
    this.api.changed(); this.render();
  }
  card(id) {
    const p = this.api.profile(), it = ITEMS[id], b = bag(p), food = it.slot === 'food', placed = it.slot === 'home' || it.slot === 'yard';
    const own = !food && (placed ? home(p).items.includes(id) : b.owned.includes(id)), on = !food && !placed && b[it.slot] === id, n = food ? foodCount(p, id) : 0;
    const stat = [it.el && `${ELEMENTS[it.el].icon} ${ELEMENTS[it.el].en}`, it.near && `phép gần +${Math.round(it.near * 100)}%`, it.far && `phép xa +${Math.round(it.far * 100)}%`, it.eldmg && `phép ${ELEMENTS[it.el].vi} +${Math.round(it.eldmg * 100)}%`, it.resist && `kháng ${ELEMENTS[it.el].vi} ${Math.round(it.resist * 100)}%`, it.atk && `ATK +${it.atk}`, it.def && `DEF +${it.def}`, it.hp && `HP +${it.hp}`, it.heal && `+${it.heal} HP (Q)`, placed && (it.slot === 'yard' ? 'Đặt ở sân nhà con' : 'Đặt trong nhà con')].filter(Boolean).join(' · ');
    const canBuy = food || !own, lock = p.stats.level < it.level;
    return `<div class="card ${lock ? 'locked' : ''}"><span class="tag">${it.cost} ●</span><span class="ic">${gearIcon(id) ? `<img src="${gearIcon(id)}" alt="">` : ICON[id] || (it.kind === 'staff' ? '🪄' : it.kind === 'sword' ? '⚔️' : it.slot === 'charm' ? '🧿' : it.slot === 'armor' ? '🛡️' : '📦')}</span><b>${it.en}</b><span class="vi">${it.vi}</span><span class="st">${stat}</span>
      ${lock ? `<span class="lock">🔒 Cần cấp ${it.level}</span>` : ''}${food ? `<span class="vi">Trong túi: ${n}</span>` : ''}${placed && own ? '<span class="on">✔ Đã có ở nhà</span>' : ''}
      <div class="row">${canBuy ? `<button data-act="buy" data-id="${id}" ${lock || p.stats.gold < it.cost ? 'disabled' : ''}>Buy</button>` : ''}
        ${own && !placed ? `<button data-act="wear" data-id="${id}">${on ? 'Take off' : 'Wear'}</button>` : ''}${on ? '<span class="on">✔ wearing</span>' : ''}
        ${own || n > 0 ? `<button class="sell" data-act="sell" data-id="${id}">Sell ${sellPrice(id)} ●</button>` : ''}</div></div>`;
  }
  counter(k) {
    const kp = KEEPERS[k], q = this.quiz && this.quiz.k === k ? this.quiz : null;
    const opts = q ? `<div class="opts">${q.opts.map((id, i) => `<button data-act="ans" data-id="${i}">${i + 1}. ${ITEMS[id].en}</button>`).join('')}</div>` : '';
    return `<div class="counter"><div class="keeper"><img src="${kp.img}" alt="${kp.name}"><b>${kp.name}</b><div class="bubble">${this.say[k] || ''}${opts}</div>
        <button data-act="talk" data-k="${k}">💬 Talk</button> <button class="quest" data-act="quest" data-k="${k}">📜 Word quest</button></div>
      <div class="shelfbox"><h3>${kp.title} <small>· ${kp.sub}</small></h3><div class="shelf">${shopList(k).map((id) => this.card(id)).join('')}</div></div></div>`;
  }
  render() {
    const p = this.api.profile();
    this.el.innerHTML = `<div class="room"><header><span style="font-size:28px">🏪</span><h2>${this.title}</h2><span class="lv">Lv ${p.stats.level}</span><span class="gold">● ${p.stats.gold}</span><button data-act="close">Leave (Esc)</button></header>
      ${(this.counters || ['forge', 'rose']).map((k) => this.counter(k)).join('')}<div class="msg">${this.msg || ''}</div></div>`;
  }
}
