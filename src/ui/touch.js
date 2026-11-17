// Touch controls for tablets (T4): a joystick on the left, action buttons on the right, a direction pad while a
// board game is open, one-finger drag to turn the camera and two-finger pinch to zoom. They work by pressing the
// same keys the keyboard does, so the game logic does not change. Shown on touch screens, or with ?touch=1.
const capture = (el, id) => { try { el.setPointerCapture(id); } catch { /* synthetic events have no pointer */ } };
const CSS = `
#touch { position:fixed; inset:0; pointer-events:none; z-index:30; user-select:none; -webkit-user-select:none; touch-action:none; }
#touch .stick { position:absolute; left:22px; bottom:96px; width:132px; height:132px; border-radius:50%; background:rgba(255,248,230,.35); border:3px solid rgba(90,60,30,.45); pointer-events:auto; touch-action:none; }
#touch .knob { position:absolute; left:41px; top:41px; width:50px; height:50px; border-radius:50%; background:rgba(255,226,138,.9); border:3px solid #7a5530; }
#touch .pad { position:absolute; right:18px; bottom:22px; display:grid; grid-template-columns:repeat(3,62px); grid-template-rows:repeat(3,62px); gap:10px; pointer-events:none; }
#touch button { pointer-events:auto; touch-action:none; width:62px; height:62px; border-radius:50%; border:3px solid #7a5530; background:rgba(255,233,176,.88); font:700 15px/1.05 system-ui, sans-serif; color:#4a2e14; padding:0; }
#touch button.big { background:rgba(255,210,90,.95); font-size:22px; }
#touch button:active, #touch button.on { transform:scale(.92); background:#ffd23c; }
#touch .dpad { position:absolute; left:50%; bottom:18px; transform:translateX(-50%); display:none; grid-template-columns:repeat(4,64px); gap:10px; pointer-events:none; }
#touch.arcade .dpad { display:grid; }
#touch.arcade .stick, #touch.arcade .pad { display:none; }
#touch.hide { display:none; }
`;
const ACTIONS = [['KeyE', 'E<br><small>nói</small>', 'big'], ['KeyJ', '⚔'], ['Space', '⤒'], ['KeyQ', '🍞'], ['KeyI', '🎒'], ['KeyK', '↷<br><small>né</small>'], ['ShiftLeft', '»<br><small>chạy</small>', 'hold']];
const DPAD = [['ArrowLeft', '◀'], ['ArrowUp', '▲'], ['ArrowDown', '▼'], ['ArrowRight', '▶']];

export const touchWanted = () => /[?&]touch=1/.test(location.search) || (matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window);

/** opts: { keys: Set of held key codes, press(code), cam: OrbitCamera, canvas, state() -> { arcade, playing } } */
export function initTouch(opts) {
  const { keys, press, cam, canvas, state } = opts;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 'touch'; root.className = 'hide';
  root.innerHTML = `<div class="stick"><div class="knob"></div></div><div class="pad">${ACTIONS.map(([c, t, k]) => `<button data-k="${c}" class="${k || ''}">${t}</button>`).join('')}</div>
    <div class="dpad">${DPAD.map(([c, t]) => `<button data-k="${c}">${t}</button>`).join('')}</div>`;
  document.body.appendChild(root);

  // buttons: a tap presses the key once (like keydown) and holds it while the finger stays (race, blocks, run)
  for (const b of root.querySelectorAll('button')) {
    const code = b.dataset.k;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); capture(b, e.pointerId); b.classList.add('on'); keys.add(code); if (code !== 'ShiftLeft') press(code); });
    const up = () => { b.classList.remove('on'); keys.delete(code); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  }
  // joystick: W/A/S/D held by direction, Shift when pushed to the rim
  const stick = root.querySelector('.stick'), knob = root.querySelector('.knob'), DIRS = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
  let sid = null;
  const setStick = (dx, dz) => {
    const r = Math.hypot(dx, dz), m = Math.min(1, r / 52), nx = r ? dx / r : 0, nz = r ? dz / r : 0;
    knob.style.transform = `translate(${nx * m * 42}px, ${nz * m * 42}px)`;
    for (const k of DIRS) keys.delete(k);
    if (m > 0.25) { if (nz < -0.38) keys.add('KeyW'); if (nz > 0.38) keys.add('KeyS'); if (nx < -0.38) keys.add('KeyA'); if (nx > 0.38) keys.add('KeyD'); }
    if (m > 0.92) keys.add('ShiftRight'); else keys.delete('ShiftRight');
  };
  const centre = () => { const r = stick.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  stick.addEventListener('pointerdown', (e) => { e.preventDefault(); sid = e.pointerId; capture(stick, sid); const [cx, cy] = centre(); setStick(e.clientX - cx, e.clientY - cy); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId !== sid) return; const [cx, cy] = centre(); setStick(e.clientX - cx, e.clientY - cy); });
  const release = (e) => { if (e.pointerId !== sid) return; sid = null; setStick(0, 0); };
  stick.addEventListener('pointerup', release); stick.addEventListener('pointercancel', release);

  // camera: one finger turns, two fingers pinch to zoom (only on the 3D view, not on buttons or dialogs)
  const pts = new Map(); let pinch = 0;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; pts.set(e.pointerId, [e.clientX, e.clientY]); capture(canvas, e.pointerId); pinch = 0; });
  canvas.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return; const [lx, ly] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { cam.tYaw -= (e.clientX - lx) * 0.008; cam.tPitch = Math.min(1.25, Math.max(0.05, cam.tPitch + (e.clientY - ly) * 0.006)); return; }
    const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch) cam.tDist = Math.min(18, Math.max(3, cam.tDist * pinch / d)); pinch = d;
  });
  const lift = (e) => { pts.delete(e.pointerId); pinch = 0; };
  canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);

  let shown = '';
  return {
    root,
    /** Called every frame: hides the pad on menus, swaps to the direction pad during board games. */
    update() {
      const s = state(), mode = !s.playing ? 'hide' : s.arcade ? 'arcade' : '';
      if (mode !== shown) { shown = mode; root.className = mode; if (mode) { setStick(0, 0); for (const k of [...ACTIONS, ...DPAD]) keys.delete(k[0]); } }
    },
  };
}
