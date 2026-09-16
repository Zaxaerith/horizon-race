'use strict';
/* ============================================================
 * 渲染
 * ============================================================ */
function project(p, camX, camY, camZ, camDepth, w, h, roadW) {
  p.camera.x = (p.world.x || 0) - camX;
  p.camera.y = (p.world.y || 0) - camY;
  p.camera.z = (p.world.z || 0) - camZ;
  p.screen.scale = camDepth / p.camera.z;
  p.screen.x = w / 2 + p.screen.scale * p.camera.x * w / 2;
  p.screen.y = h / 2 - p.screen.scale * p.camera.y * h / 2;
  p.screen.w = p.screen.scale * roadW * w / 2;
}
function projectRoadEntity(seg, pct, offset, camDepth) {
  const z = lerp(seg.p1.camera.z, seg.p2.camera.z, pct);
  if (z <= camDepth) return null;
  const scale = camDepth / z;
  const x = lerp(seg.p1.camera.x, seg.p2.camera.x, pct) + offset * ROAD_WIDTH;
  const y = lerp(seg.p1.camera.y, seg.p2.camera.y, pct);
  return {x: W/2 + scale * x * W/2, y: H_/2 - scale * y * H_/2, scale};
}
function fogFactor(dist, density) { return 1 / Math.pow(Math.E, dist * dist * density); }
function drawPoly(x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}
const rumbleWidth = (w, lanes) => w / Math.max(6, 2 * lanes);
const laneMarkerWidth = (w, lanes) => w / Math.max(32, 8 * lanes);

/* --- 程序化装饰精灵 --- */
function drawSpriteArt(type, x, baseY, s, extra) {
  ctx.save();
  switch (type) {
    case 'tree1':
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - s*0.06, baseY - s*0.3, s*0.12, s*0.3);
      ctx.fillStyle = '#2e8b3a';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.55, s*0.28, 0, 7); ctx.fill();
      ctx.fillStyle = '#3aa54a';
      ctx.beginPath(); ctx.arc(x - s*0.08, baseY - s*0.65, s*0.2, 0, 7); ctx.fill();
      break;
    case 'tree2':
      ctx.fillStyle = '#7a5530'; ctx.fillRect(x - s*0.07, baseY - s*0.35, s*0.14, s*0.35);
      ctx.fillStyle = '#22883a';
      ctx.beginPath();
      ctx.moveTo(x, baseY - s); ctx.lineTo(x + s*0.3, baseY - s*0.3); ctx.lineTo(x - s*0.3, baseY - s*0.3);
      ctx.closePath(); ctx.fill();
      break;
    case 'pine':
      ctx.fillStyle = '#2a6848';
      for (let i = 0; i < 3; i++) {
        const ty = baseY - s*(0.35 + i*0.22), tw = s*(0.3 - i*0.07);
        ctx.beginPath();
        ctx.moveTo(x, ty - s*0.3); ctx.lineTo(x + tw, ty); ctx.lineTo(x - tw, ty);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(x, baseY - s); ctx.lineTo(x+s*0.09, baseY-s*0.82); ctx.lineTo(x-s*0.09, baseY-s*0.82); ctx.closePath(); ctx.fill();
      break;
    case 'bush':
      ctx.fillStyle = '#2f9040';
      ctx.beginPath(); ctx.arc(x - s*0.12, baseY - s*0.12, s*0.16, 0, 7); ctx.arc(x + s*0.12, baseY - s*0.12, s*0.16, 0, 7); ctx.fill();
      break;
    case 'cactus':
      ctx.fillStyle = '#3a8848';
      ctx.fillRect(x - s*0.08, baseY - s*0.75, s*0.16, s*0.75);
      ctx.fillRect(x - s*0.28, baseY - s*0.55, s*0.12, s*0.3);
      ctx.fillRect(x - s*0.28, baseY - s*0.55, s*0.28, s*0.1);
      ctx.fillRect(x + s*0.16, baseY - s*0.62, s*0.12, s*0.26);
      ctx.fillRect(x + s*0.06, baseY - s*0.62, s*0.22, s*0.1);
      break;
    case 'palm': {
      ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = Math.max(1, s*0.07);
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.quadraticCurveTo(x + s*0.1, baseY - s*0.5, x + s*0.16, baseY - s*0.8); ctx.stroke();
      ctx.fillStyle = '#38a858';
      for (let a = 0; a < 6; a++) {
        const ang = -Math.PI/2 + (a - 2.5) * 0.5;
        ctx.beginPath();
        ctx.ellipse(x + s*0.16 + Math.cos(ang)*s*0.2, baseY - s*0.8 + Math.sin(ang)*s*0.12, s*0.2, s*0.06, ang, 0, 7);
        ctx.fill();
      }
      break;
    }
    case 'rock':
      ctx.fillStyle = '#8a8078';
      ctx.beginPath();
      ctx.moveTo(x - s*0.25, baseY); ctx.lineTo(x - s*0.1, baseY - s*0.3); ctx.lineTo(x + s*0.12, baseY - s*0.34); ctx.lineTo(x + s*0.28, baseY);
      ctx.closePath(); ctx.fill();
      break;
    case 'lavarock':
      ctx.fillStyle = '#483838';
      ctx.beginPath();
      ctx.moveTo(x - s*0.3, baseY); ctx.lineTo(x - s*0.12, baseY - s*0.42); ctx.lineTo(x + s*0.15, baseY - s*0.36); ctx.lineTo(x + s*0.32, baseY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff5020';
      ctx.fillRect(x - s*0.05, baseY - s*0.1, s*0.12, s*0.1);
      break;
    case 'deadtree':
      ctx.strokeStyle = '#3a2828'; ctx.lineWidth = Math.max(1, s*0.08);
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - s*0.6);
      ctx.moveTo(x, baseY - s*0.4); ctx.lineTo(x - s*0.2, baseY - s*0.7);
      ctx.moveTo(x, baseY - s*0.5); ctx.lineTo(x + s*0.18, baseY - s*0.8);
      ctx.stroke();
      break;
    case 'snowman':
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.18, s*0.18, 0, 7); ctx.arc(x, baseY - s*0.46, s*0.13, 0, 7); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(x - s*0.05, baseY - s*0.49, s*0.02, 0, 7); ctx.arc(x + s*0.05, baseY - s*0.49, s*0.02, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff8020';
      ctx.beginPath(); ctx.moveTo(x, baseY - s*0.46); ctx.lineTo(x + s*0.14, baseY - s*0.44); ctx.lineTo(x, baseY - s*0.43); ctx.fill();
      break;
    case 'ice':
      ctx.fillStyle = 'rgba(140,220,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(x, baseY - s*0.5); ctx.lineTo(x + s*0.15, baseY - s*0.2); ctx.lineTo(x + s*0.08, baseY);
      ctx.lineTo(x - s*0.1, baseY); ctx.lineTo(x - s*0.16, baseY - s*0.24);
      ctx.closePath(); ctx.fill();
      break;
    case 'building': {
      const bw = s*0.5, bh = s*(0.8 + (x % 3) * 0.3);
      ctx.fillStyle = '#181430';
      ctx.fillRect(x - bw/2, baseY - bh, bw, bh);
      ctx.fillStyle = (Math.floor(x) % 2) ? '#ff2ea6' : '#22e0e0';
      for (let wy = 0; wy < 5; wy++)
        for (let wx = 0; wx < 3; wx++)
          if ((wx * 7 + wy * 3 + Math.floor(x)) % 3 !== 0)
            ctx.fillRect(x - bw/2 + bw*0.15 + wx*bw*0.28, baseY - bh + bh*0.08 + wy*bh*0.17, bw*0.16, bh*0.09);
      break;
    }
    case 'lamp':
      ctx.strokeStyle = '#8888aa'; ctx.lineWidth = Math.max(1, s*0.05);
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - s*0.8); ctx.lineTo(x + s*0.12, baseY - s*0.85); ctx.stroke();
      ctx.fillStyle = '#ffe080';
      ctx.beginPath(); ctx.arc(x + s*0.14, baseY - s*0.84, s*0.06, 0, 7); ctx.fill();
      break;
    case 'billboard': {
      ctx.fillStyle = '#333344'; ctx.fillRect(x - s*0.05, baseY - s*0.4, s*0.1, s*0.4);
      ctx.fillStyle = '#101020'; ctx.fillRect(x - s*0.35, baseY - s*0.95, s*0.7, s*0.5);
      ctx.fillStyle = '#ff2ea6'; ctx.font = `bold ${Math.max(4,s*0.16)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.fillText('HORIZON', x, baseY - s*0.63);
      break;
    }
    case 'umbrella':
      ctx.strokeStyle = '#cc8844'; ctx.lineWidth = Math.max(1, s*0.05);
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - s*0.55); ctx.stroke();
      ctx.fillStyle = '#ff7043';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.55, s*0.3, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.55, s*0.3, Math.PI*1.25, Math.PI*1.5); ctx.lineTo(x, baseY - s*0.55); ctx.fill();
      break;
    case 'skull':
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.12, s*0.12, 0, 7); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(x - s*0.05, baseY - s*0.14, s*0.03, 0, 7); ctx.arc(x + s*0.05, baseY - s*0.14, s*0.03, 0, 7); ctx.fill();
      break;
    case 'mushroomDeco': {
      ctx.fillStyle = '#f0e8d8'; ctx.fillRect(x - s*0.07, baseY - s*0.25, s*0.14, s*0.25);
      ctx.fillStyle = '#e04040';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.25, s*0.2, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - s*0.08, baseY - s*0.32, s*0.05, 0, 7); ctx.arc(x + s*0.09, baseY - s*0.3, s*0.04, 0, 7); ctx.fill();
      break;
    }
    case 'stump':
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - s*0.12, baseY - s*0.2, s*0.24, s*0.2);
      ctx.fillStyle = '#a07850';
      ctx.beginPath(); ctx.ellipse(x, baseY - s*0.2, s*0.12, s*0.05, 0, 0, 7); ctx.fill();
      break;
    case 'star': {
      ctx.fillStyle = '#ffe060';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s*0.22 : s*0.09;
        const a = -Math.PI/2 + i * Math.PI/5;
        const px = x + Math.cos(a)*r, py = baseY - s*0.3 + Math.sin(a)*r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'crystal':
      ctx.fillStyle = 'rgba(160,100,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(x, baseY - s*0.7); ctx.lineTo(x + s*0.16, baseY - s*0.3); ctx.lineTo(x, baseY);
      ctx.lineTo(x - s*0.16, baseY - s*0.3);
      ctx.closePath(); ctx.fill();
      break;
    case 'cloudDeco':
      ctx.fillStyle = 'rgba(255,150,230,0.5)';
      ctx.beginPath();
      ctx.arc(x - s*0.15, baseY - s*0.3, s*0.14, 0, 7);
      ctx.arc(x, baseY - s*0.36, s*0.17, 0, 7);
      ctx.arc(x + s*0.16, baseY - s*0.3, s*0.13, 0, 7);
      ctx.fill();
      break;
    case 'ember':
      ctx.fillStyle = '#ff8030';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.2, s*0.08, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd040';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.2, s*0.04, 0, 7); ctx.fill();
      break;
    case 'sign':
      ctx.fillStyle = '#888'; ctx.fillRect(x - s*0.03, baseY - s*0.4, s*0.06, s*0.4);
      ctx.fillStyle = '#f0f0f0'; ctx.fillRect(x - s*0.2, baseY - s*0.75, s*0.4, s*0.32);
      ctx.fillStyle = '#c03030'; ctx.font = `bold ${Math.max(4,s*0.18)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.fillText('HR', x, baseY - s*0.52);
      break;
    case 'arrow': {
      const d = extra && extra.dir ? extra.dir : 1;
      ctx.fillStyle = '#dd2020';
      ctx.fillRect(x - s*0.04, baseY - s*0.35, s*0.08, s*0.35);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const ay = baseY - s*0.55;
      ctx.moveTo(x + d*s*0.22, ay);
      ctx.lineTo(x - d*s*0.1, ay - s*0.16);
      ctx.lineTo(x - d*s*0.1, ay + s*0.16);
      ctx.closePath(); ctx.fill();
      break;
    }
    /* ---- 障碍物 ---- */
    case 'cone':
      ctx.fillStyle = '#202020'; ctx.fillRect(x - s*0.16, baseY - s*0.04, s*0.32, s*0.05);
      ctx.fillStyle = '#ff7020';
      ctx.beginPath();
      ctx.moveTo(x, baseY - s*0.34); ctx.lineTo(x + s*0.14, baseY - s*0.04); ctx.lineTo(x - s*0.14, baseY - s*0.04);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x - s*0.09, baseY - s*0.18); ctx.lineTo(x + s*0.09, baseY - s*0.18);
      ctx.lineTo(x + s*0.065, baseY - s*0.12); ctx.lineTo(x - s*0.065, baseY - s*0.12);
      ctx.closePath(); ctx.fill();
      break;
    case 'barrel':
      ctx.fillStyle = '#a04820';
      ctx.fillRect(x - s*0.14, baseY - s*0.36, s*0.28, s*0.36);
      ctx.fillStyle = '#c05828';
      ctx.fillRect(x - s*0.14, baseY - s*0.28, s*0.28, s*0.06);
      ctx.fillRect(x - s*0.14, baseY - s*0.14, s*0.28, s*0.06);
      ctx.fillStyle = '#603010';
      ctx.beginPath(); ctx.ellipse(x, baseY - s*0.36, s*0.14, s*0.045, 0, 0, 7); ctx.fill();
      break;
    case 'tire':
      ctx.fillStyle = '#181818';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.12, s*0.14, 0, 7); ctx.fill();
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.12, s*0.055, 0, 7); ctx.fill();
      break;
    case 'oil':
      ctx.fillStyle = 'rgba(20,20,26,0.85)';
      ctx.beginPath(); ctx.ellipse(x, baseY - s*0.01, s*0.3, s*0.06, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(80,90,140,0.4)';
      ctx.beginPath(); ctx.ellipse(x - s*0.06, baseY - s*0.015, s*0.12, s*0.025, 0, 0, 7); ctx.fill();
      break;
    case 'mud':
      ctx.fillStyle = 'rgba(90,62,38,0.85)';
      ctx.beginPath(); ctx.ellipse(x, baseY - s*0.005, s*0.42, s*0.07, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(120,88,52,0.6)';
      ctx.beginPath(); ctx.ellipse(x + s*0.1, baseY, s*0.18, s*0.04, 0, 0, 7); ctx.fill();
      break;
    case 'itembox': {
      const bob = Math.sin(animT * 3 + x * 0.01) * s * 0.06;
      const cy = baseY - s * 0.22 + bob;
      const hue = (animT * 120 + x * 0.05) % 360;
      ctx.fillStyle = `hsla(${hue},85%,60%,0.85)`;
      ctx.strokeStyle = `hsl(${hue},90%,80%)`;
      ctx.lineWidth = Math.max(1, s * 0.02);
      const r = s * 0.16;
      ctx.beginPath();
      ctx.moveTo(x, cy - r); ctx.lineTo(x + r, cy); ctx.lineTo(x, cy + r); ctx.lineTo(x - r, cy);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(4, r * 1.1)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', x, cy);
      ctx.textBaseline = 'alphabetic';
      break;
    }
    /* ---- 道具实体 ---- */
    case 'banana':
      ctx.fillStyle = '#ffe135';
      ctx.beginPath();
      ctx.arc(x, baseY - s*0.05, s*0.13, 0.15*Math.PI, 0.85*Math.PI);
      ctx.lineTo(x, baseY - s*0.02);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a6a20';
      ctx.fillRect(x - s*0.13, baseY - s*0.09, s*0.04, s*0.04);
      break;
    case 'shell_g': case 'shell_r': {
      ctx.fillStyle = type === 'shell_g' ? '#30c050' : '#f04030';
      ctx.beginPath(); ctx.arc(x, baseY - s*0.1, s*0.13, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f8e8b0';
      ctx.fillRect(x - s*0.15, baseY - s*0.1, s*0.3, s*0.045);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - s*0.04, baseY - s*0.15, s*0.035, 0, 7); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/* --- 道具图标（HUD用） --- */
function drawItemIcon(type, x, y, s) {
  ctx.save();
  switch (type) {
    case 'mushroom':
      ctx.fillStyle = '#f0e0c8'; ctx.fillRect(x - s*0.18, y, s*0.36, s*0.34);
      ctx.fillStyle = '#e03030';
      ctx.beginPath(); ctx.arc(x, y + s*0.05, s*0.42, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - s*0.18, y - s*0.12, s*0.1, 0, 7); ctx.arc(x + s*0.16, y - s*0.08, s*0.08, 0, 7); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillRect(x - s*0.12, y + s*0.12, s*0.06, s*0.1); ctx.fillRect(x + s*0.06, y + s*0.12, s*0.06, s*0.1);
      break;
    case 'triple':
      drawItemIcon('mushroom', x - s*0.42, y + s*0.1, s*0.55);
      drawItemIcon('mushroom', x + s*0.42, y + s*0.1, s*0.55);
      drawItemIcon('mushroom', x, y - s*0.18, s*0.55);
      break;
    case 'banana':
      ctx.strokeStyle = '#ffe135'; ctx.lineWidth = s*0.22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y - s*0.1, s*0.42, 0.2*Math.PI, 0.8*Math.PI); ctx.stroke();
      break;
    case 'green': case 'red':
      ctx.fillStyle = type === 'green' ? '#30c050' : '#f04030';
      ctx.beginPath(); ctx.arc(x, y + s*0.1, s*0.42, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f8e8b0'; ctx.fillRect(x - s*0.46, y + s*0.08, s*0.92, s*0.14);
      break;
    case 'star':
      ctx.fillStyle = '#ffe040';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s*0.5 : s*0.2;
        const a = -Math.PI/2 + i * Math.PI/5;
        const px = x + Math.cos(a)*r, py = y + s*0.05 + Math.sin(a)*r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    case 'lightning':
      ctx.fillStyle = '#ffe040';
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y - s*0.5); ctx.lineTo(x - s*0.25, y + s*0.08);
      ctx.lineTo(x - s*0.02, y + s*0.08); ctx.lineTo(x - s*0.15, y + s*0.5);
      ctx.lineTo(x + s*0.25, y - s*0.1); ctx.lineTo(x + s*0.02, y - s*0.1);
      ctx.closePath(); ctx.fill();
      break;
  }
  ctx.restore();
}

/* --- 卡丁车绘制 --- */
function drawKartSprite(x, baseY, scale, color, opts = {}) {
  const w = scale, h = scale * 0.62;
  const { tilt = 0, spinAngle = 0, star = false, boost = false, hop = 0, facing = 1 } = opts;
  ctx.save();
  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, baseY, w*0.52, h*0.14, 0, 0, 7); ctx.fill();
  ctx.translate(x, baseY - hop);
  if (spinAngle) ctx.rotate(spinAngle);
  else if (tilt) ctx.rotate(tilt);
  // facing=-1 时水平翻转车身（车头朝 -x）
  if (facing < 0) ctx.scale(-1, 1);
  const bodyColor = star ? `hsl(${(animT * 400) % 360},90%,60%)` : color;
  // 加速火焰
  if (boost) {
    for (let f = 0; f < 2; f++) {
      const fl = w * (0.12 + Math.random() * 0.1);
      ctx.fillStyle = f ? '#ff8020' : '#ffd040';
      ctx.beginPath();
      ctx.moveTo(-w*0.2 + f*w*0.4, -h*0.15);
      ctx.lineTo(-w*0.2 + f*w*0.4 + fl*0.4, -h*0.15 - fl);
      ctx.lineTo(-w*0.2 + f*w*0.4 + fl*0.8, -h*0.15);
      ctx.closePath(); ctx.fill();
    }
  }
  // 后轮
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-w*0.5, -h*0.42, w*0.18, h*0.4);
  ctx.fillRect(w*0.32, -h*0.42, w*0.18, h*0.4);
  // 车身
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-w*0.36, -h*0.1);
  ctx.lineTo(-w*0.32, -h*0.55);
  ctx.quadraticCurveTo(0, -h*0.72, w*0.32, -h*0.55);
  ctx.lineTo(w*0.36, -h*0.1);
  ctx.quadraticCurveTo(0, -h*0.02, -w*0.36, -h*0.1);
  ctx.fill();
  // 尾翼
  ctx.fillStyle = '#222';
  ctx.fillRect(-w*0.3, -h*0.78, w*0.6, h*0.1);
  // 头盔驾驶员
  ctx.fillStyle = '#f0c080';
  ctx.beginPath(); ctx.arc(0, -h*0.72, w*0.11, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, -h*0.74, w*0.115, Math.PI*1.05, Math.PI*1.95); ctx.fill();
  ctx.restore();
}

function renderBackground(theme) {
  const g = ctx.createLinearGradient(0, 0, 0, H_ * 0.6);
  g.addColorStop(0, theme.skyTop);
  g.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H_ * 0.62);

  const horizon = H_ * 0.5;
  const off = bgOffset * 8;

  ctx.fillStyle = theme.sun;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(W*0.5 - off*0.3 % W, horizon - H_*0.22, H_*0.06, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;

  function hills(color, amp, freq, speed, baseH) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, horizon + 2);
    for (let x = 0; x <= W; x += 12) {
      const y = horizon - baseH
        + Math.sin((x + off * speed) * freq) * amp
        + Math.sin((x + off * speed) * freq * 2.7 + 2) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, horizon + 2);
    ctx.closePath(); ctx.fill();
  }
  const bs = theme.bgStyle;
  if (bs === 'sea') {
    hills(theme.hillFar, H_*0.02, 0.004, 0.4, H_*0.04);
    ctx.fillStyle = theme.hillNear;
    ctx.fillRect(0, horizon, W, H_);
  } else if (bs === 'city') {
    ctx.fillStyle = theme.hillFar;
    for (let i = 0; i < 30; i++) {
      const bx = ((i * 97 - off * 0.5) % (W + 80) + W + 80) % (W + 80) - 40;
      const bh = H_ * (0.08 + (i % 5) * 0.035);
      ctx.fillRect(bx, horizon - bh, 44, bh);
    }
    ctx.fillStyle = theme.hillNear;
    for (let i = 0; i < 20; i++) {
      const bx = ((i * 151 - off * 0.9) % (W + 100) + W + 100) % (W + 100) - 50;
      const bh = H_ * (0.05 + (i % 4) * 0.03);
      ctx.fillRect(bx, horizon - bh, 60, bh);
    }
  } else if (bs === 'volcano') {
    hills(theme.hillFar, H_*0.03, 0.002, 0.3, H_*0.1);
    hills(theme.hillNear, H_*0.04, 0.003, 0.7, H_*0.05);
  } else {
    hills(theme.hillFar, H_*0.035, 0.003, 0.4, H_*0.07);
    hills(theme.hillNear, H_*0.045, 0.005, 0.8, H_*0.03);
  }
}

function renderRace() {
  const theme = curDef.theme;
  const segs = curTrack.segments;
  const len = curTrack.length;
  /* 后视模式：把 z 坐标取反 + 把 x 也取反（左右镜像），
     这样从投影代码看，玩家在"前向倒车"位置，渲染管线无需修改。
     渲染期间 player.z 临时被改，渲染后恢复。
     同时镜像所有 car/sh/b/sp 的 z/offset/dist（因为它们都在世界里），
     并重新分配 seg.cars/shellBySeg/bananaBySeg（按镜像后 z 找段）。 */
  const saved = { player: { z: null, x: null, dist: null },
                  cars: [], shells: [], bananas: [], sprites: [],
                  segCars: null };
  if (lookBack) {
    // 玩家
    saved.player.z = player.z;
    saved.player.x = player.x;
    saved.player.dist = player.dist;
    player.z = ((-player.z) % len + len) % len;
    player.x = -player.x;
    player.dist = -player.dist;
    // 对手车
    saved.segCars = curTrack.segments.map(s => s.cars.slice());
    for (const s of curTrack.segments) s.cars.length = 0;
    for (const c of cars) {
      saved.cars.push({ z: c.z, offset: c.offset, dist: c.dist });
      c.z = ((-c.z) % len + len) % len;
      c.offset = -c.offset;
      c.dist = -c.dist;
      findSegment(c.z).cars.push(c);
    }
    // 弹道物 — 镜像 sh.z/sh.x（shellBySeg 会在循环内按镜像后 z 重新构建）
    for (const sh of worldShells) {
      saved.shells.push({ z: sh.z, x: sh.x });
      sh.z = ((-sh.z) % len + len) % len;
      sh.x = -sh.x;
    }
    // 香蕉 — 重新分配
    for (const b of worldBananas) {
      saved.bananas.push({ z: b.z, x: b.x });
      b.z = ((-b.z) % len + len) % len;
      b.x = -b.x;
    }
    // 路面精灵（seg.sprites）— 注意：精灵的横向 offset 也镜像
    for (const seg of segs) {
      for (const sp of seg.sprites) {
        if (sp.offset !== undefined) {
          saved.sprites.push({ seg, sp, offset: sp.offset });
          sp.offset = -sp.offset;
        }
      }
    }
  }

  // 摄像机在玩家后方；物体经过车辆后继续向屏幕底部运动，再越过摄像机消失。
  const cameraZ = increase(player.z, -SEG_LEN * GAME_TUNING.render.cameraDistanceSegments, len);
  const baseSeg = findSegment(cameraZ);
  const basePct = (cameraZ % SEG_LEN) / SEG_LEN;
  const playerSeg = findSegment(player.z);
  const playerPct = (player.z % SEG_LEN) / SEG_LEN;
  const playerY = lerp(playerSeg.p1.world.y, playerSeg.p2.world.y, playerPct);
  let maxy = H_;

  let x = 0, dx = -(baseSeg.curve * basePct);
  const camDepth = 1 / Math.tan((FOV / 2) * Math.PI / 180);
  renderBackground(theme);

  for (let n = 0; n < DRAW_DIST; n++) {
    const seg = segs[(baseSeg.index + n) % segs.length];
    seg.visible = false;
    seg.looped = seg.index < baseSeg.index;
    seg.fog = fogFactor(n / DRAW_DIST, FOG_DENSITY);
    seg.clip = maxy;

    project(seg.p1, player.x * ROAD_WIDTH - x, playerY + CAMERA_HEIGHT, cameraZ - (seg.looped ? curTrack.length : 0), camDepth, W, H_, ROAD_WIDTH);
    project(seg.p2, player.x * ROAD_WIDTH - x - dx, playerY + CAMERA_HEIGHT, cameraZ - (seg.looped ? curTrack.length : 0), camDepth, W, H_, ROAD_WIDTH);
    // 物体只要求位于摄像机前方；路面太薄或在坡后时仍由 clip 渐进遮挡。
    seg.visible = seg.p2.camera.z > camDepth;

    x += dx;
    dx += seg.curve;

    if (seg.p1.camera.z <= camDepth || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) continue;

    let rl, rd;
    if (theme.rainbowRoad) {
      const hue = (seg.colorIdx * 37 + Math.floor(seg.index / (RUMBLE_LEN * 3)) * 61) % 360;
      rl = `hsl(${hue},80%,58%)`; rd = `hsl(${hue},75%,48%)`;
    } else {
      rl = theme.roadLight; rd = theme.roadDark;
    }
    const road = curDef.id === 'volcano'
      && seg.index % GAME_TUNING.volcano.zonePeriod < GAME_TUNING.volcano.zoneLength
      ? (Math.sin(raceTime * 2.4) > 0 ? '#a85a30' : '#684438')
      : (seg.colorIdx ? rd : rl);
    const grass = seg.colorIdx ? theme.grassDark : theme.grassLight;
    const rumble = seg.colorIdx ? theme.rumbleDark : theme.rumbleLight;
    const laneMarker = seg.colorIdx ? theme.lane : road;

    const p1 = seg.p1.screen, p2 = seg.p2.screen;
    const r1 = rumbleWidth(p1.w, LANES), r2 = rumbleWidth(p2.w, LANES);
    const l1 = laneMarkerWidth(p1.w, LANES), l2 = laneMarkerWidth(p2.w, LANES);

    ctx.fillStyle = grass;
    ctx.fillRect(0, p2.y, W, p1.y - p2.y);
    drawPoly(p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, rumble);
    drawPoly(p1.x + p1.w + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w + r2, p2.y, rumble);
    drawPoly(p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, road);
    if (laneMarker !== road) {
      const lw1 = p1.w * 2 / LANES, lw2 = p2.w * 2 / LANES;
      let lx1 = p1.x - p1.w + lw1, lx2 = p2.x - p2.w + lw2;
      for (let lane = 1; lane < LANES; lane++) {
        drawPoly(lx1 - l1/2, p1.y, lx1 + l1/2, p1.y, lx2 + l2/2, p2.y, lx2 - l2/2, p2.y, laneMarker);
        lx1 += lw1; lx2 += lw2;
      }
    }
    if (seg.isStart || seg.isFinish) {
      const check1 = seg.isStart ? '#ffffff' : '#222222';
      const check2 = seg.isStart ? '#222222' : '#ffffff';
      const cw1 = p1.w / 8, cw2 = p2.w / 8;
      let cx1 = p1.x - p1.w, cx2 = p2.x - p2.w;
      for (let i = 0; i < 8; i++) {
        drawPoly(cx1, p1.y, cx1 + cw1, p1.y, cx2 + cw2, p2.y, cx2, p2.y, i % 2 ? check1 : check2);
        cx1 += cw1; cx2 += cw2;
      }
    }
    if (seg.fog < 1) {
      ctx.globalAlpha = 1 - seg.fog;
      ctx.fillStyle = theme.fog;
      ctx.fillRect(0, p2.y, W, p1.y - p2.y);
      ctx.globalAlpha = 1;
    }
    maxy = p2.y;
  }

  /* 弹道物/香蕉按段索引分组 */
  const shellBySeg = new Map(), bananaBySeg = new Map();
  for (const sh of worldShells) {
    const si = findSegment(sh.z).index;
    if (!shellBySeg.has(si)) shellBySeg.set(si, []);
    shellBySeg.get(si).push(sh);
  }
  for (const b of worldBananas) {
    const si = findSegment(b.z).index;
    if (!bananaBySeg.has(si)) bananaBySeg.set(si, []);
    bananaBySeg.get(si).push(b);
  }

  /* 精灵、对手车、弹道物：路面循环已 project 过 p1/p2，直接用 screen 坐标。
     渲染方向：n=DRAW_DIST-1..0（远→近），无论前视后视都一样（路面循环的镜像已处理）。 */
  /* 卡丁车宽度：以玩家车为基准随透视缩放（远小近大），
     但在玩家段/紧贴时不超过玩家车尺寸的 1.4 倍。 */
  const playerKartW = W * 0.16;
  const KART_MAX_W = playerKartW * 1.4;
  for (let n = DRAW_DIST - 1; n >= 0; n--) {
    const seg = segs[(baseSeg.index + n) % segs.length];
    if (!seg.visible) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, seg.clip);
    ctx.clip();
    for (const car of seg.cars) {
      const pct = (car.z % SEG_LEN) / SEG_LEN;
      const pos = projectRoadEntity(seg, pct, car.offset, camDepth);
      if (!pos) continue;
      // 卡丁车在路面上占 ~20% 宽，按透视缩放后限制最大值不超过 1.4 倍玩家车
      let size = pos.scale * ROAD_WIDTH * 0.20 * W / 2;
      if (size > KART_MAX_W) size = KART_MAX_W;
      if (size > 1) {
        ctx.globalAlpha = seg.fog;
        drawKartSprite(pos.x, pos.y, size, car.color, {
          spinAngle: car.spinT > 0 ? (1 - car.spinT / 1.4) * Math.PI * 4 : 0,
          star: car.starT > 0, boost: car.boostT > 0,
          facing: lookBack ? -1 : 1
        });
        ctx.globalAlpha = 1;
      }
    }
    for (const sp of seg.sprites) {
      if (seg.p1.camera.z <= camDepth) continue;
      const scale = seg.p1.screen.scale;
      const sx = seg.p1.screen.x + scale * sp.offset * ROAD_WIDTH * W / 2;
      const sy = seg.p1.screen.y;
      const projectedSize = scale * ROAD_WIDTH * W / 2 * 0.9 * (sp.scale || 1);
      const onRoad = sp.type === 'itembox' || sp.hazard;
      const size = Math.min(projectedSize, onRoad ? playerKartW * 1.1 : W * 0.85);
      if (size > 1) {
        ctx.globalAlpha = seg.fog;
        drawSpriteArt(sp.type, sx, sy, size, sp);
        ctx.globalAlpha = 1;
      }
    }
    const shl = shellBySeg.get(seg.index);
    if (shl) for (const sh of shl) {
      const pct = (sh.z % SEG_LEN) / SEG_LEN;
      const pos = projectRoadEntity(seg, pct, sh.x, camDepth);
      if (!pos) continue;
      // 弹道物宽度 = 路面 8%
      const size = Math.min(pos.scale * ROAD_WIDTH * 0.08 * W / 2, playerKartW * 0.65);
      if (size > 1) {
        ctx.globalAlpha = seg.fog;
        drawSpriteArt(sh.type === 'red' ? 'shell_r' : 'shell_g', pos.x, pos.y, size);
        ctx.globalAlpha = 1;
      }
    }
    const bns = bananaBySeg.get(seg.index);
    if (bns) for (const b of bns) {
      const pct = (b.z % SEG_LEN) / SEG_LEN;
      const pos = projectRoadEntity(seg, pct, b.x, camDepth);
      if (!pos) continue;
      // 香蕉宽度 = 路面 8%
      const size = Math.min(pos.scale * ROAD_WIDTH * 0.08 * W / 2, playerKartW * 0.65);
      if (size > 1) {
        ctx.globalAlpha = seg.fog;
        drawSpriteArt('banana', pos.x, pos.y, size);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  /* 后视镜代码已删除：lookBack 模式由反向路面循环统一处理 */

  /* 漂移火花粒子生成 */
  const pw = W * 0.16;
  const kartBaseY = H_ - pw*0.28;
  if (player.drifting && player.driftCharge > 0.5) {
    const stageCol = player.driftCharge > SUPER_TURBO_AT ? '#ffb020'
                   : player.driftCharge > MINI_TURBO_AT ? '#40c0ff' : '#e0e0e0';
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: W/2 - player.driftDir * pw*0.42 + (Math.random()*10-5),
        y: kartBaseY - 4,
        vx: -player.driftDir * (60 + Math.random()*80),
        vy: -(30 + Math.random()*60),
        life: 0.4, color: stageCol, size: 2 + Math.random()*3
      });
    }
  }
  if (player.starT > 0 && Math.random() < 0.5) {
    particles.push({
      x: W/2 + (Math.random()*2-1) * pw*0.5,
      y: kartBaseY - pw*0.2 - Math.random()*pw*0.3,
      vx: (Math.random()*2-1)*40, vy: -60 - Math.random()*60,
      life: 0.5, color: `hsl(${Math.random()*360},90%,65%)`, size: 2 + Math.random()*3
    });
  }

  /* 玩家卡丁车（在镜像状态下绘制，自然就是后视的车尾朝向） */
  const hopOff = player.hopT > 0 ? Math.sin((1 - player.hopT/0.26) * Math.PI) * pw*0.12 : 0;
  const bounceY = player.bounce * (H_/480);
  let tilt = player.steerSmooth * 0.06
    + findSegment(player.z + CAMERA_HEIGHT).curve * (player.speed/MAX_SPEED) * 0.01
    + (player.drifting ? player.driftDir * 0.2 : 0);
  const spinAngle = player.spinT > 0 ? (1 - player.spinT / 1.4) * Math.PI * 4 : 0;
  ctx.save();
  ctx.translate(W/2, kartBaseY + bounceY);
  drawKartSprite(0, 0, pw, '#e03030', {
    tilt, spinAngle, hop: hopOff,
    star: player.starT > 0, boost: player.boostT > 0,
    facing: lookBack ? -1 : 1
  });
  ctx.restore();

  /* 恢复所有镜像状态（避免影响后续 HUD/逻辑） */
  if (lookBack && saved.player.z !== null) {
    player.z = saved.player.z;
    player.x = saved.player.x;
    player.dist = saved.player.dist;
    for (let i = 0; i < cars.length; i++) {
      cars[i].z = saved.cars[i].z;
      cars[i].offset = saved.cars[i].offset;
      cars[i].dist = saved.cars[i].dist;
    }
    // 恢复 seg.cars（原版分配）
    for (let i = 0; i < curTrack.segments.length; i++) {
      curTrack.segments[i].cars.length = 0;
      for (const c of saved.segCars[i]) curTrack.segments[i].cars.push(c);
    }
    for (let i = 0; i < worldShells.length; i++) {
      worldShells[i].z = saved.shells[i].z;
      worldShells[i].x = saved.shells[i].x;
    }
    for (let i = 0; i < worldBananas.length; i++) {
      worldBananas[i].z = saved.bananas[i].z;
      worldBananas[i].x = saved.bananas[i].x;
    }
    for (const s of saved.sprites) {
      s.sp.offset = s.offset;
    }
  }

  /* 粒子更新与绘制 */
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= lastFrameDt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * lastFrameDt;
    p.y += p.vy * lastFrameDt;
    ctx.globalAlpha = clamp(p.life * 2.5, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  if (particles.length > 150) particles.splice(0, particles.length - 150);
  ctx.globalAlpha = 1;

  /* 闪电白闪 */
  if (flashT > 0) {
    ctx.globalAlpha = flashT * 1.2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H_);
    ctx.globalAlpha = 1;
  }
  if (player.hitT > 0) {
    ctx.globalAlpha = player.hitT * 0.35;
    ctx.fillStyle = '#ff3030';
    ctx.fillRect(0, 0, W, H_);
    ctx.globalAlpha = 1;
  }

  renderHUD();
}

function renderHUD() {
  const lapShown = clamp(Math.floor(player.dist / curTrack.length) + 1, 1, curDef.laps);
  const rank = state === 'finished' ? finalRank : rankOf(player.dist);

  ctx.save();
  const compact = W < 700;
  ctx.font = `bold ${Math.round(Math.min(H_*0.035, compact ? 18 : 36))}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(12, 10, compact ? W*0.34 : 230, compact ? 70 : 84);
  ctx.fillStyle = '#fff';
  const lapText = I18N.t('lapHud', { lap: lapShown, total: curDef.laps });
  const posText = I18N.t('posHud', { pos: I18N.position(rank) });
  fitFont(lapText, compact ? W*0.31 : 210, Math.min(H_*0.035, compact ? 18 : 36), 9, 'bold ');
  ctx.fillText(lapText, 20, compact ? 36 : 46);
  fitFont(posText, compact ? W*0.31 : 210, Math.min(H_*0.035, compact ? 18 : 36), 9, 'bold ');
  ctx.fillText(posText, 20, compact ? 68 : 86);

  // 右上：时间
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(W - (compact ? W*0.38 + 12 : 280), compact ? 10 : 14,
    compact ? W*0.38 : 264, compact ? 70 : 84);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(Math.min(H_*0.035, compact ? 18 : 36))}px monospace`;
  ctx.fillText(fmtTime(raceTime), W - 20, compact ? 36 : 46);
  ctx.fillStyle = '#ffd040';
  const bestText = I18N.t('bestHud', { time: fmtTime(bestLap) });
  fitFont(bestText, compact ? W*0.35 : 244, Math.min(H_*0.035, compact ? 18 : 36), 9, 'bold ');
  ctx.fillText(bestText, W - 20, compact ? 68 : 86);
  if (In.padName) {
    ctx.fillStyle = '#7fe0ff';
    const padText = I18N.t('connected', { name: In.padName });
    fitFont(padText, compact ? W*0.36 : 260, H_*0.02, 9);
    ctx.fillText(padText, W - 28, 112);
  }

  // 顶部中央：道具槽
  const slotSize = Math.round(H_*0.09);
  const sx = W/2 - slotSize/2, sy = compact ? 88 : 14;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(sx, sy, slotSize, slotSize);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, slotSize, slotSize);
  if (player.rouletteT > 0) {
    const idx = Math.floor((1 - player.rouletteT) * 14) % ROULETTE_ORDER.length;
    drawItemIcon(ROULETTE_ORDER[idx], W/2, sy + slotSize*0.22, slotSize*0.56);
  } else if (player.item) {
    drawItemIcon(player.item, W/2, sy + slotSize*0.22, slotSize*0.56);
    if (player.item === 'triple') {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(slotSize*0.3)}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`x${3 - player.tripleN}`, sx + slotSize*0.6, sy + slotSize*0.95);
    }
  }
  if (curDef.id === 'snow' || curDef.id === 'volcano') {
    const activeHeat = curDef.id === 'volcano'
      && findSegment(player.z).index % GAME_TUNING.volcano.zonePeriod < GAME_TUNING.volcano.zoneLength;
    ctx.textAlign = 'center';
    const ruleStatus = curDef.id === 'snow' ? I18N.t('ice') : activeHeat ? I18N.t('heat') : I18N.t('heatWarn');
    fitFont(ruleStatus, compact ? W*0.45 : 300, Math.max(10, H_*0.018), 9, 'bold ');
    ctx.fillStyle = activeHeat ? '#ffb040' : curDef.id === 'snow' ? '#b8efff' : 'rgba(255,255,255,0.55)';
    ctx.fillText(ruleStatus, W/2, sy + slotSize + Math.max(14, H_*0.022));
  }

  // 底部速度表
  const spd = Math.round(player.speed / MAX_SPEED * 320);
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(Math.min(H_*0.035, compact ? 18 : 34))}px monospace`;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(W/2 - (compact ? 80 : 110), H_ - 66, compact ? 160 : 220, 50);
  ctx.fillStyle = spd > 320 ? '#ff5050' : '#fff';
  ctx.fillText(`${spd} km/h`, W/2, H_ - 32);
  if (player.boostT > 0) {
    ctx.fillStyle = '#ffb020';
    ctx.font = `bold ${Math.round(Math.min(H_*0.025, 22))}px monospace`;
    ctx.fillText(I18N.t('turbo'), W/2, H_ - 93);
  }
  if (player.drifting) {
    const charge = clamp(player.driftCharge / SUPER_TURBO_AT, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(W/2 - 100, H_ - 87, 200, 12);
    ctx.fillStyle = player.driftStage === 2 ? '#ff9a20' : player.driftStage === 1 ? '#40c0ff' : '#d8d8d8';
    ctx.fillRect(W/2 - 98, H_ - 85, 196 * charge, 8);
  }

  // 小地图
  const mapSize = compact ? Math.min(120, W*0.30, H_*0.20) : 170;
  drawMinimap(W - mapSize - 16, H_ - mapSize - 16, mapSize, mapSize, true);

  // 提示消息
  ctx.font = `bold ${Math.round(H_*0.03)}px monospace`;
  toasts.forEach((t, i) => {
    ctx.globalAlpha = clamp(t.t, 0, 1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, W/2, H_*0.62 + i * H_*0.045);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMinimap(x, y, w, h, inGame) {
  const pts = curTrack.mapPts;
  ctx.save();
  if (inGame) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const pad = 12;
  for (let i = 0; i < pts.length; i++) {
    const px = x + pad + pts[i][0] * (w - pad*2);
    const py = y + pad + pts[i][1] * (h - pad*2);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.lineTo(x + pad + pts[0][0] * (w - pad*2), y + pad + pts[0][1] * (h - pad*2));
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + pad + pts[0][0]*(w-pad*2) - 3, y + pad + pts[0][1]*(h-pad*2) - 3, 6, 6);
  if (!inGame) { ctx.restore(); return; }
  // 对手
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (const car of cars) {
    const cp = (car.z / curTrack.length) % 1;
    const ci = Math.floor(cp * pts.length) % pts.length;
    ctx.beginPath();
    ctx.arc(x + pad + pts[ci][0]*(w-pad*2), y + pad + pts[ci][1]*(h-pad*2), 3, 0, 7);
    ctx.fill();
  }
  // 玩家
  const pp = (player.z / curTrack.length) % 1;
  const idx = Math.floor(pp * pts.length) % pts.length;
  ctx.fillStyle = '#ff3030';
  ctx.beginPath();
  ctx.arc(x + pad + pts[idx][0]*(w-pad*2), y + pad + pts[idx][1]*(h-pad*2), 5, 0, 7);
  ctx.fill();
  ctx.restore();
}

