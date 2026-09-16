/* ============================================================
 * Horizon Race - 统一输入系统
 * 键盘绑定 + 手柄(Gamepad API)每帧合并，实现无缝热切换
 * ============================================================ */
'use strict';

const In = (() => {
  const pressed = new Set();
  let padIndex = null;
  let padName = '';
  let prev = {};
  let onPadChange = null;
  let captureAction = null;

  const normalizeKey = key => key === ' ' ? 'space' : key.toLowerCase();
  const down = key => pressed.has(key);
  const actionDown = action => down(Settings.bindings[action]);
  function clearKeyboard() { pressed.clear(); prev = {}; }

  window.addEventListener('keydown', e => {
    const key = normalizeKey(e.key);
    if (captureAction) {
      e.preventDefault();
      if (key !== 'escape') Settings.setBinding(captureAction, key);
      captureAction = null;
      clearKeyboard();
      return;
    }
    if (['arrowup','arrowdown','arrowleft','arrowright','space'].includes(key)) e.preventDefault();
    pressed.add(key);
  });
  window.addEventListener('keyup', e => pressed.delete(normalizeKey(e.key)));
  window.addEventListener('blur', clearKeyboard);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearKeyboard(); });

  window.addEventListener('gamepadconnected', e => {
    padIndex = e.gamepad.index;
    padName = e.gamepad.id.replace(/\(.*\)/, '').trim() || 'Gamepad';
    if (onPadChange) onPadChange(true, padName);
  });
  window.addEventListener('gamepaddisconnected', e => {
    if (e.gamepad.index === padIndex) {
      padIndex = null; padName = '';
      if (onPadChange) onPadChange(false, '');
    }
  });

  function getPad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    if (padIndex != null && pads[padIndex] && pads[padIndex].connected) return pads[padIndex];
    for (const p of pads) if (p && p.connected) {
      padIndex = p.index;
      if (!padName) {
        padName = p.id.replace(/\(.*\)/, '').trim() || 'Gamepad';
        if (onPadChange) onPadChange(true, padName);
      }
      return p;
    }
    return null;
  }

  function poll() {
    const pad = getPad();
    let axis = 0, pl = 0, pr = 0, pu = 0, pd = 0;
    let pa = 0, pb = 0, pdrift = 0, plookBack = 0, pitem = 0, pconfirm = 0, pback = 0, ppause = 0;
    if (pad) {
      axis = pad.axes[0] || 0;
      if (Math.abs(axis) < 0.18) axis = 0;
      const b = pad.buttons.map(x => x.pressed || x.value > 0.5 ? 1 : 0);
      pl = b[14] || (axis < -0.5 ? 1 : 0); pr = b[15] || (axis > 0.5 ? 1 : 0);
      pu = b[12]; pd = b[13];
      pa = b[0] || b[7]; pb = b[1] || b[2] || b[6];
      pdrift = b[4]; plookBack = b[5]; pitem = b[3];
      pconfirm = b[9] || b[0]; ppause = b[9]; pback = b[8];
    }
    const left = actionDown('left') || down('arrowleft') || pl;
    const right = actionDown('right') || down('arrowright') || pr;
    const up = actionDown('accel') || down('arrowup') || pu;
    const downKey = actionDown('brake') || down('arrowdown') || pd;
    const st = {
      steer: clamp((right ? 1 : 0) - (left ? 1 : 0) + axis, -1, 1),
      accel: !!(up || pa), brake: !!(downKey || pb),
      drift: !!(actionDown('drift') || pdrift), item: !!(actionDown('item') || pitem),
      lookBack: !!(actionDown('lookBack') || plookBack),
      confirm: !!(down('enter') || pconfirm), back: !!(down('escape') || pback),
      restart: actionDown('restart'), pause: !!(actionDown('pause') || ppause),
      usingPad: !!(pa || pb || pdrift || pitem || plookBack || axis !== 0 || pl || pr), padName
    };
    const cur = {
      drift: st.drift, item: st.item, lookBack: st.lookBack, confirm: st.confirm, back: st.back,
      restart: st.restart, pause: st.pause, language: down('l'),
      left: !!left, right: !!right, up: !!up, down: !!downKey
    };
    for (const key in cur) st[key + 'Edge'] = cur[key] && !prev[key];
    prev = cur;
    return st;
  }

  return {
    poll,
    beginRebind(action) { captureAction = action; clearKeyboard(); },
    cancelRebind() { captureAction = null; clearKeyboard(); },
    get captureAction() { return captureAction; },
    get padName() { return padName; },
    set onPadChange(fn) { onPadChange = fn; },
    __setKey(key, value) { const normalized = normalizeKey(key); value ? pressed.add(normalized) : pressed.delete(normalized); }
  };
})();
