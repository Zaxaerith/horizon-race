'use strict';
/* ---------------- 界面 ---------------- */
function drawTitleText(text, y, size, color, x = W/2) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(text, x + size*0.06, y + size*0.06);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function fitFont(text, maxWidth, preferred, minSize = 10, weight = '') {
  let size = Math.max(minSize, preferred);
  do {
    ctx.font = `${weight}${Math.round(size)}px monospace`;
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) break;
    size -= 1;
  } while (size > minSize);
  return size;
}

const SETTINGS_ROWS = [
  { type:'language', label:'language' },
  { type:'resolution', label:'resolution' },
  { type:'frameRate', label:'frameRate' },
  ...Settings.actionOrder.map(action => ({ type:'binding', action,
    label: {left:'bindLeft',right:'bindRight',accel:'bindAccel',brake:'bindBrake',drift:'bindDrift',
      item:'bindItem',lookBack:'bindLookBack',pause:'bindPause',restart:'bindRestart'}[action] })),
  { type:'reset', label:'resetBindings' },
  { type:'back', label:'back' }
];

function drawLogo() {
  const mainSize = Math.min(W*0.115, H_*0.145);
  ctx.save();
  ctx.translate(W/2, H_*0.255);
  ctx.scale(0.88, 1.42);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(mainSize)}px "Times New Roman", Georgia, serif`;
  ctx.lineWidth = Math.max(1, mainSize*0.025);
  ctx.strokeStyle = 'rgba(8,6,24,0.9)';
  ctx.fillStyle = '#f8f5ff';
  ctx.shadowColor = 'rgba(120,90,255,0.7)';
  ctx.shadowBlur = mainSize*0.16;
  ctx.strokeText('HORIZON', 0, 0);
  ctx.fillText('HORIZON', 0, 0);
  ctx.font = `${Math.round(mainSize*0.56)}px "Times New Roman", Georgia, serif`;
  ctx.shadowBlur = mainSize*0.08;
  ctx.strokeText('R  A  C  E', 0, mainSize*0.72);
  ctx.fillStyle = '#ffd86a';
  ctx.fillText('R  A  C  E', 0, mainSize*0.72);
  ctx.restore();

  const lineY = H_*0.43;
  const half = Math.min(W*0.30, H_*0.42);
  const grad = ctx.createLinearGradient(W/2-half, 0, W/2+half, 0);
  grad.addColorStop(0, 'rgba(255,216,106,0)');
  grad.addColorStop(0.18, '#ffd86a');
  grad.addColorStop(0.82, '#ffd86a');
  grad.addColorStop(1, 'rgba(255,216,106,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = Math.max(2, H_*0.004);
  ctx.beginPath(); ctx.moveTo(W/2-half, lineY); ctx.lineTo(W/2+half, lineY); ctx.stroke();
  ctx.fillStyle = '#fff4bd';
  ctx.save(); ctx.translate(W/2, lineY); ctx.rotate(Math.PI/4);
  const d = Math.max(4, H_*0.008); ctx.fillRect(-d/2, -d/2, d, d); ctx.restore();
}

function renderTitle() {
  const g = ctx.createLinearGradient(0, 0, 0, H_);
  g.addColorStop(0, '#141038'); g.addColorStop(0.6, '#3a1860'); g.addColorStop(1, '#802850');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H_);
  const colors = ['#ff4040','#ff9020','#ffe040','#40d060','#3080ff','#a040ff'];
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, H_*0.62 + i * H_*0.02, W, H_*0.021);
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.moveTo(W*0.2, H_); ctx.lineTo(W*0.47, H_*0.62); ctx.lineTo(W*0.53, H_*0.62); ctx.lineTo(W*0.8, H_);
  ctx.closePath(); ctx.fill();

  drawLogo();
  const menu = [I18N.t('play'), I18N.t('settings')];
  ctx.textAlign = 'center';
  menu.forEach((text, index) => {
    const selected = titleMenuIdx === index;
    fitFont(text, W*0.7, H_*0.035, 12, 'bold ');
    ctx.fillStyle = selected ? '#ffd86a' : 'rgba(255,255,255,0.72)';
    ctx.fillText(`${selected ? '◆  ' : ''}${text}${selected ? '  ◆' : ''}`, W/2, H_*(0.67 + index*0.075));
  });
  fitFont(I18N.t('tagline'), W*0.92, H_*0.022, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(I18N.t('tagline'), W/2, H_*0.88);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  const controls = `${I18N.t('bindAccel')} ${Settings.keyLabel(Settings.bindings.accel)} · `
    + `${I18N.t('bindDrift')} ${Settings.keyLabel(Settings.bindings.drift)} · `
    + `${I18N.t('bindItem')} ${Settings.keyLabel(Settings.bindings.item)} · `
    + `${I18N.t('bindPause')} ${Settings.keyLabel(Settings.bindings.pause)}`;
  fitFont(controls, W*0.94, H_*0.022, 9);
  ctx.fillText(controls, W/2, H_*0.93);
}

function renderSettings() {
  const g = ctx.createLinearGradient(0, 0, 0, H_);
  g.addColorStop(0, '#0d102b'); g.addColorStop(1, '#24123e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H_);
  drawTitleText(I18N.t('settings'), H_*0.09, Math.min(W*0.055, H_*0.075), '#fff');

  const panelW = Math.min(W*0.82, 720);
  const x = W/2 - panelW/2;
  const top = H_*0.135;
  const bottom = H_*0.88;
  const rowH = (bottom - top) / SETTINGS_ROWS.length;
  ctx.textBaseline = 'middle';
  SETTINGS_ROWS.forEach((row, index) => {
    const y = top + index*rowH;
    const selected = index === settingsRow;
    ctx.fillStyle = selected ? 'rgba(255,216,106,0.16)' : index%2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, y, panelW, rowH*0.9);
    if (selected) {
      ctx.fillStyle = '#ffd86a';
      ctx.fillRect(x, y, Math.max(3, W*0.004), rowH*0.9);
    }
    const fontSize = Math.max(10, Math.min(rowH*0.47, H_*0.025));
    ctx.font = `${selected ? 'bold ' : ''}${Math.round(fontSize)}px monospace`;
    ctx.textAlign = 'left'; ctx.fillStyle = selected ? '#fff' : 'rgba(255,255,255,0.72)';
    ctx.fillText(I18N.t(row.label), x + panelW*0.055, y + rowH*0.45);

    let value = '';
    if (row.type === 'language') value = I18N.label;
    else if (row.type === 'resolution') {
      const rw = Math.max(320, Math.round(window.innerWidth * Settings.renderScale));
      const rh = Math.max(180, Math.round(window.innerHeight * Settings.renderScale));
      value = `${Math.round(Settings.renderScale*100)}%  ${rw}×${rh}`;
    } else if (row.type === 'frameRate') {
      value = Settings.frameCap ? `${Settings.frameCap} FPS` : I18N.t('unlimited');
    } else if (row.type === 'binding') {
      value = In.captureAction === row.action ? I18N.t('pressKey') : Settings.keyLabel(Settings.bindings[row.action]);
    }
    if (value) {
      const arrows = ['language','resolution','frameRate'].includes(row.type) ? `◀  ${value}  ▶` : value;
      fitFont(arrows, panelW*0.46, fontSize, 9, selected ? 'bold ' : '');
      ctx.textAlign = 'right';
      ctx.fillStyle = In.captureAction === row.action ? '#7fe0ff' : selected ? '#ffd86a' : '#b7c7ee';
      ctx.fillText(arrows, x + panelW*0.95, y + rowH*0.45);
    }
  });
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.58)';
  fitFont(I18N.t('settingsHelp'), W*0.94, H_*0.021, 9);
  ctx.fillText(I18N.t('settingsHelp'), W/2, H_*0.95);
}

function renderSelect() {
  ctx.fillStyle = '#101024';
  ctx.fillRect(0, 0, W, H_);
  drawTitleText(I18N.t('selectTrack'), H_*0.12, Math.min(W*0.05, H_*0.08), '#fff');

  const def = TRACKS[selectIdx];
  const cardW = Math.min(W*(W < 700 ? 0.82 : 0.5), 520), cardH = H_*0.56;
  const cx = W/2 - cardW/2, cy = H_*0.2;

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(cx, cy, cardW, cardH);
  ctx.strokeStyle = def.theme.rumbleLight;
  ctx.lineWidth = 4;
  ctx.strokeRect(cx, cy, cardW, cardH);

  const t = getBuilt(def);
  curTrack = t; cars = [];
  drawMinimap(cx + cardW*0.05, cy + cardH*0.06, cardW*0.9, cardH*0.5, false);

  ctx.textAlign = 'center';
  fitFont(I18N.trackName(def.id), cardW*0.92, cardH*0.09, 12, 'bold ');
  ctx.fillStyle = '#fff';
  ctx.fillText(I18N.trackName(def.id), W/2, cy + cardH*0.72);
  ctx.font = `${Math.round(cardH*0.055)}px monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(I18N.id === 'en' ? def.name : def.nameEn, W/2, cy + cardH*0.8);
  const stars = '★'.repeat(def.difficulty) + '☆'.repeat(5 - def.difficulty);
  ctx.fillStyle = '#ffd040';
  ctx.font = `${Math.round(cardH*0.06)}px monospace`;
  ctx.fillText(stars, W/2, cy + cardH*0.89);
  const bt = parseFloat(localStorage.getItem('hr_best_' + def.id));
  if (bt) {
    ctx.fillStyle = '#7fe0ff';
    fitFont(I18N.t('bestLap', { time: fmtTime(bt) }), cardW*0.92, cardH*0.05, 9);
    ctx.fillText(I18N.t('bestLap', { time: fmtTime(bt) }), W/2, cy + cardH*0.97);
  }
  const rule = I18N.trackRule(def.id);
  if (rule) {
    ctx.fillStyle = '#ffe8a0';
    fitFont(rule, cardW*0.94, H_*0.022, 10);
    ctx.fillText(rule, W/2, H_*0.82);
  }

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(H_*0.08)}px monospace`;
  ctx.fillText('◀', W*0.12, H_*0.5);
  ctx.fillText('▶', W*0.88, H_*0.5);

  const thumbW = Math.max(16, Math.min(90, (W - 72) / TRACKS.length));
  const totalW = TRACKS.length * (thumbW + 8);
  TRACKS.forEach((tr, i) => {
    const tx = W/2 - totalW/2 + i * (thumbW + 8);
    ctx.fillStyle = i === selectIdx ? tr.theme.rumbleLight : 'rgba(255,255,255,0.2)';
    ctx.fillRect(tx, H_*0.87, thumbW, 10);
  });

  const selectHelp = I18N.t('selectHelp');
  fitFont(selectHelp, W*0.94, H_*0.025, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(selectHelp, W/2, H_*0.95);
}

function renderPauseOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  ctx.fillRect(0, 0, W, H_);
  drawTitleText(I18N.t('pause'), H_*0.38, Math.min(W*0.12, H_*0.16), '#fff');
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  const help = I18N.t('pauseHelp');
  fitFont(help, W*0.9, H_*0.032, 11, 'bold ');
  ctx.fillText(help, W/2, H_*0.55);
}

function renderCountdown() {
  renderRace();
  const n = Math.ceil(countdown - 0.9);
  ctx.save();
  ctx.textAlign = 'center';
  const scaleF = 1 + (countdown % 1) * 0.3;
  ctx.translate(W/2, H_*0.35);
  ctx.scale(scaleF, scaleF);
  if (n <= 0) {
    const goText = I18N.t('raceStart');
    const goSize = fitFont(goText, W*0.8 / scaleF, Math.min(W*0.14, H_*0.22), 18, 'bold ');
    drawTitleText(goText, 0, goSize, '#40ff60', 0);
  }
  else drawTitleText(String(n), 0, Math.min(W*0.14, H_*0.22), '#ffd040', 0);
  ctx.restore();
  ctx.font = `bold ${Math.round(H_*0.03)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(I18N.t('grid', { pos: I18N.position(TOTAL_CARS + 1) }), W/2, H_*0.55);
}

function renderFinished() {
  renderRace();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H_);
  drawTitleText(I18N.t('finish'), H_*0.16, Math.min(W*0.09, H_*0.14), '#ffd040');
  ctx.textAlign = 'center';

  // 最终排名榜
  const standings = racersAll().sort((a, b) => b.dist - a.dist);
  const rowH = H_*0.042;
  const listTop = H_*0.24;
  const boardW = Math.min(W*0.86, 380);
  const boardX = W/2 - boardW/2;
  ctx.font = `${Math.round(rowH*0.72)}px monospace`;
  standings.forEach((r, i) => {
    const yy = listTop + i * rowH;
    const isP = r.isP;
    ctx.fillStyle = isP ? 'rgba(255,215,64,0.18)' : 'rgba(0,0,0,0)';
    ctx.fillRect(boardX, yy - rowH*0.7, boardW, rowH*0.92);
    ctx.fillStyle = i < 3 ? '#ffd040' : '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(I18N.position(i + 1), boardX + 15, yy);
    const col = isP ? '#e03030' : (r.key.color || '#888');
    ctx.fillStyle = col;
    ctx.fillRect(boardX + boardW*0.23, yy - rowH*0.52, rowH*0.5, rowH*0.5);
    ctx.fillStyle = isP ? '#ffd040' : 'rgba(255,255,255,0.85)';
    ctx.fillText(isP ? I18N.t('you') : r.key.profile.name, boardX + boardW*0.32, yy);
  });

  if (newRecord) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7fe0ff';
    ctx.font = `bold ${Math.round(H_*0.035)}px monospace`;
    ctx.fillText(I18N.t('newRecord'), W/2, listTop + 12.4 * rowH);
  }
  if (Math.floor(stateTime * 2) % 2 === 0) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(H_*0.028)}px monospace`;
    ctx.textAlign = 'center';
    fitFont(I18N.t('finishHelp'), W*0.94, H_*0.028, 9, 'bold ');
    ctx.fillText(I18N.t('finishHelp'), W/2, H_*0.94);
  }
}

