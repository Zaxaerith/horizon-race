'use strict';
/* ---------------- 主循环 ---------------- */
function handleMenuInput(inp) {
  if (state === 'title') {
    if (inp.upEdge) { titleMenuIdx = (titleMenuIdx + 1) % 2; beep(440, 0.06); }
    else if (inp.downEdge) { titleMenuIdx = (titleMenuIdx + 1) % 2; beep(440, 0.06); }
    else if (inp.languageEdge) { I18N.cycle(1); beep(440, 0.06); }
    else if (inp.confirmEdge) {
      state = titleMenuIdx === 0 ? 'select' : 'settings';
      stateTime = 0; beep(660, 0.1);
    }
  } else if (state === 'settings') {
    if (In.captureAction) return;
    if (inp.upEdge) { settingsRow = (settingsRow + SETTINGS_ROWS.length - 1) % SETTINGS_ROWS.length; beep(440, 0.05); }
    else if (inp.downEdge) { settingsRow = (settingsRow + 1) % SETTINGS_ROWS.length; beep(440, 0.05); }
    else if (inp.leftEdge || inp.rightEdge) changeSetting(SETTINGS_ROWS[settingsRow], inp.leftEdge ? -1 : 1);
    else if (inp.confirmEdge) activateSetting(SETTINGS_ROWS[settingsRow]);
    else if (inp.backEdge) { state = 'title'; stateTime = 0; }
  } else if (state === 'select') {
    if (inp.leftEdge) { selectIdx = (selectIdx + TRACKS.length - 1) % TRACKS.length; beep(440, 0.06); }
    else if (inp.rightEdge) { selectIdx = (selectIdx + 1) % TRACKS.length; beep(440, 0.06); }
    else if (inp.confirmEdge) { beep(880, 0.15); startRace(TRACKS[selectIdx]); }
    else if (inp.backEdge) { state = 'title'; stateTime = 0; }
  } else if (state === 'countdown' || state === 'race') {
    if (inp.pauseEdge) { pausedFrom = state; state = 'paused'; stateTime = 0; updateEngineSound(0, false); }
    else if (inp.backEdge) { state = 'select'; stateTime = 0; updateEngineSound(0, false); }
    else if (inp.restartEdge) startRace(curDef);
  } else if (state === 'paused') {
    if (inp.pauseEdge || inp.confirmEdge) { state = pausedFrom; stateTime = 0; }
    else if (inp.backEdge) { state = 'select'; stateTime = 0; }
    else if (inp.restartEdge) startRace(curDef);
  } else if (state === 'finished') {
    if (inp.confirmEdge) { state = 'select'; stateTime = 0; updateEngineSound(0, false); }
    else if (inp.restartEdge) startRace(curDef);
  }
}

function changeSetting(row, step) {
  if (row.type === 'language') I18N.cycle(step);
  else if (row.type === 'resolution') { Settings.cycleResolution(step); resize(); }
  else if (row.type === 'frameRate') Settings.cycleFrameRate(step);
  else return;
  beep(520, 0.06);
}

function activateSetting(row) {
  if (['language','resolution','frameRate'].includes(row.type)) changeSetting(row, 1);
  else if (row.type === 'binding') { In.beginRebind(row.action); beep(660, 0.08); }
  else if (row.type === 'reset') { Settings.resetBindings(); beep(760, 0.1); }
  else if (row.type === 'back') { state = 'title'; stateTime = 0; beep(440, 0.06); }
}

let lastTime = 0;
let lastRafTime = 0;
let frameBudget = 0;
window.addEventListener('blur', () => {
  if (state === 'race' || state === 'countdown') {
    pausedFrom = state;
    state = 'paused';
    updateEngineSound(0, false);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (state === 'race' || state === 'countdown')) {
    pausedFrom = state;
    state = 'paused';
    updateEngineSound(0, false);
  }
});
function frame(t) {
  requestAnimationFrame(frame);
  const rafElapsed = lastRafTime ? t - lastRafTime : 1000 / 60;
  lastRafTime = t;
  const frameInterval = Settings.frameCap ? 1000 / Settings.frameCap : 0;
  if (frameInterval) {
    frameBudget += rafElapsed;
    if (frameBudget < frameInterval - 0.25) return;
    frameBudget %= frameInterval;
  } else frameBudget = 0;
  const dt = Math.min((t - lastTime) / 1000 || 0.016, 0.05);
  lastTime = t;
  stateTime += dt;
  animT += dt;
  lastFrameDt = dt;

  const inp = In.poll();
  if (inp.confirmEdge || inp.accel || inp.itemEdge) initAudio();
  // 摄像机方向：Q 键 / RB 按住期间切换到后视（仅在比赛/倒计时状态生效）
  lookBack = !!(inp.lookBack && (state === 'race' || state === 'countdown' || state === 'finished'));
  handleMenuInput(inp);

  if (state === 'title') {
    renderTitle();
    updateEngineSound(0, false);
  } else if (state === 'select') {
    renderSelect();
    updateEngineSound(0, false);
  } else if (state === 'settings') {
    renderSettings();
    updateEngineSound(0, false);
  } else if (state === 'countdown') {
    countdown -= dt;
    const num = Math.ceil(countdown - 0.9);
    if (num !== prevCountNum) {
      prevCountNum = num;
      beep(num <= 0 ? 1000 : 600, num <= 0 ? 0.3 : 0.12, 0.2);
    }
    if (countdown <= 0) { state = 'race'; stateTime = 0; toast(I18N.t('raceStart'), '#40ff60'); }
    updateEngineSound(inp.accel ? 0.35 : 0.05, true);
    renderCountdown();
  } else if (state === 'race') {
    raceTime += dt;
    bgOffset += findSegment(player.z).curve * (player.speed / MAX_SPEED) * dt * 18;
    updatePlayer(dt, inp, true);
    updateWorld(dt, true);
    updateEngineSound(player.speed / MAX_SPEED, true);
    renderRace();
  } else if (state === 'paused') {
    updateEngineSound(0, false);
    renderRace();
    renderPauseOverlay();
  } else if (state === 'finished') {
    raceTime += dt;
    player.speed = Math.max(0, player.speed + DECEL * dt);
    player.dist += player.speed * dt;
    player.z = increase(player.z, player.speed * dt, curTrack.length);
    updateWorld(dt, false);
    updateEngineSound(player.speed / MAX_SPEED, false);
    renderFinished();
  }
}

In.onPadChange = (connected, name) => {
  if (connected) toast(I18N.t('connected', { name }), '#7fe0ff');
  else toast(I18N.t('disconnected'), '#aaa');
};

requestAnimationFrame(frame);
