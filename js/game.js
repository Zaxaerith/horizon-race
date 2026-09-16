/* ============================================================
 * Horizon Race - 伪3D赛车引擎 v2
 * 分段投影渲染 + 马里奥赛车式玩法
 *   12车手网格发车 / 漂移迷你涡轮 / 赛道障碍 / 道具赛
 * ============================================================ */
'use strict';

/* ---------------- 常量 ---------------- */
const GAME_TUNING = Object.freeze({
  render: Object.freeze({ drawDistance: 300, fogDensity: 4, cameraDistanceSegments: 5.25 }),
  player: Object.freeze({ maxSegmentsPerSecond: 60, accelSeconds: 4.5,
    brakeSeconds: 1.6, coastSeconds: 6, centrifugal: 0.25 }),
  drift: Object.freeze({ minSpeed: 0.35, miniCharge: 1.0, superCharge: 2.2 }),
  ai: Object.freeze({ basePace: 0.86, catchup: 1.09, leadSlowdown: 0.93,
    foresightBase: 18, foresightDifficulty: 2, foresightCaution: 5 }),
  snow: Object.freeze({ grip: 0.78, steerResponse: 5.2, centrifugal: 1.20, aiSpeed: 0.96 }),
  volcano: Object.freeze({ zonePeriod: 180, zoneLength: 18, playerForce: 0.55, aiForce: 0.22 })
});
const SEG_LEN = 200;
const RUMBLE_LEN = 3;
const ROAD_WIDTH = 2000;
const LANES = 3;
const FOV = 100;
const CAMERA_HEIGHT = 1050;
const DRAW_DIST = GAME_TUNING.render.drawDistance;
const FOG_DENSITY = GAME_TUNING.render.fogDensity;

const MAX_SPEED = SEG_LEN * GAME_TUNING.player.maxSegmentsPerSecond;
const ACCEL = MAX_SPEED / GAME_TUNING.player.accelSeconds;
const BRAKING = -MAX_SPEED / GAME_TUNING.player.brakeSeconds;
const DECEL = -MAX_SPEED / GAME_TUNING.player.coastSeconds;
const OFFROAD_DECEL = -MAX_SPEED / 1.8;
const OFFROAD_LIMIT = MAX_SPEED / 3.2;
const CENTRIFUGAL = GAME_TUNING.player.centrifugal;

const TOTAL_CARS = 11;                       // 11台AI + 玩家 = 12名车手
const GRID_GAP = SEG_LEN * 2.4;              // 发车格行距
const CAR_COLORS = ['#ff4040','#ffb020','#20c040','#2080ff','#e040e0','#20d0d0','#f0f060','#a060ff','#ff80a0','#70e080','#c09050'];
const DRIVER_PROFILES = [
  {name:'风刃',pace:1.05,caution:0.82,lane:-0.58,itemDelay:1.5},
  {name:'阿岚',pace:0.99,caution:1.08,lane:0.58,itemDelay:2.3},
  {name:'青芽',pace:0.94,caution:1.30,lane:0,itemDelay:2.7},
  {name:'疾电',pace:1.06,caution:0.76,lane:0.58,itemDelay:1.3},
  {name:'彗星',pace:1.02,caution:0.94,lane:-0.58,itemDelay:1.9},
  {name:'海鸥',pace:0.97,caution:1.16,lane:0.58,itemDelay:2.5},
  {name:'金沙',pace:1.00,caution:1.00,lane:0,itemDelay:2.1},
  {name:'紫影',pace:1.04,caution:0.86,lane:-0.58,itemDelay:1.6},
  {name:'桃桃',pace:0.96,caution:1.24,lane:0,itemDelay:2.6},
  {name:'岩虎机',pace:1.01,caution:1.05,lane:0.58,itemDelay:2.0},
  {name:'雪球',pace:0.93,caution:1.35,lane:-0.58,itemDelay:2.8}
];

// 漂移
const DRIFT_MIN_SPEED = GAME_TUNING.drift.minSpeed;
const MINI_TURBO_AT = GAME_TUNING.drift.miniCharge;
const SUPER_TURBO_AT = GAME_TUNING.drift.superCharge;

// 障碍物碰撞半宽（相对路宽）
const HAZARD_HW = { cone: 0.10, barrel: 0.13, tire: 0.15, oil: 0.24, mud: 0.32 };

const ITEM_INFO = {
  mushroom:  { name: '加速蘑菇' },
  triple:    { name: '三重蘑菇' },
  banana:    { name: '香蕉皮' },
  green:     { name: '绿龟壳' },
  red:       { name: '红龟壳' },
  star:      { name: '无敌星星' },
  lightning: { name: '闪电' }
};
const ROULETTE_ORDER = ['mushroom','banana','green','star','red','triple','lightning'];

/* ---------------- 工具 ---------------- */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
function easeIn(a, b, p) { return a + (b - a) * Math.pow(p, 2); }
function easeInOut(a, b, p) { return a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5); }
function increase(start, inc, max) {
  let r = start + inc;
  while (r >= max) r -= max;
  while (r < 0) r += max;
  return r;
}
function dzAbs(a, b, len) {
  const d = Math.abs(a - b);
  return Math.min(d, len - d);
}
function weightedPick(table) {
  let sum = 0;
  for (const [, w] of table) sum += w;
  let r = Math.random() * sum;
  for (const [v, w] of table) { r -= w; if (r <= 0) return v; }
  return table[table.length - 1][0];
}
function fmtTime(t) {
  if (t == null) return '--:--.--';
  const m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t * 100) % 100);
  return `${m}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}
const ORDINAL = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
function ordinal(n) { return ORDINAL[n] || `${n+1}th`; }

/* ---------------- 音效 ---------------- */
let audioCtx = null, engineOsc = null, engineGain = null;
function initAudio() {
  if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume(); return; }
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineGain.gain.value = 0;
    engineOsc.connect(engineGain).connect(audioCtx.destination);
    engineOsc.start();
  } catch (e) { audioCtx = null; }
}
window.addEventListener('keydown', initAudio, {once:true});
window.addEventListener('pointerdown', initAudio, {once:true});
function beep(freq, dur, vol = 0.15) {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
function updateEngineSound(speedPercent, racing) {
  if (!engineOsc || !audioCtx) return;
  try {
    const target = racing ? 0.03 + speedPercent * 0.05 : 0;
    engineGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.1);
    engineOsc.frequency.setTargetAtTime(55 + speedPercent * 130, audioCtx.currentTime, 0.05);
  } catch (e) {}
}

/* ---------------- 赛道构建 ---------------- */
function buildTrack(def) {
  const segments = [];
  let lastY = 0;
  // 样板赛道固定布置，其余赛道仍保留装饰变化。
  let seed = 0x4d555348;
  const random = def.id === 'mushroom' ? () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  } : Math.random;

  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({
      index: n,
      p1: { world: { x: 0, y: lastY, z: n * SEG_LEN }, camera: {}, screen: {} },
      p2: { world: { x: 0, y: y,     z: (n + 1) * SEG_LEN }, camera: {}, screen: {} },
      curve, sprites: [], cars: [],
      colorIdx: Math.floor(n / RUMBLE_LEN) % 2
    });
    lastY = y;
  }
  function addRoad(enter, hold, leave, curve, dy) {
    const startY = lastY, endY = lastY + dy * SEG_LEN / 100;
    const total = enter + hold + leave;
    for (let i = 0; i < enter; i++) addSegment(easeIn(0, curve, i / enter), easeInOut(startY, endY, i / total));
    for (let i = 0; i < hold; i++) addSegment(curve, easeInOut(startY, endY, (enter + i) / total));
    for (let i = 0; i < leave; i++) addSegment(easeInOut(curve, 0, i / leave), easeInOut(startY, endY, (enter + hold + i) / total));
  }
  const H = {
    s:  len => addRoad(len, len, len, 0, 0),
    c:  (len, cv) => addRoad(len, len, len, cv, 0),
    h:  (len, dy) => addRoad(len, len, len, 0, dy),
    ch: (len, cv, dy) => addRoad(len, len, len, cv, dy),
    sc: (len, k) => {
      addRoad(len, len, len, -2 * k, 0);
      addRoad(len, len, len, 3 * k, 0);
      addRoad(len, len, len, -2 * k, 0);
    }
  };
  for (const op of def.ops) H[op[0]](...op.slice(1));

  if (Math.abs(lastY) > 1) {
    const dyBack = -lastY / (SEG_LEN / 100);
    addRoad(40, 40, 40, 0, dyBack);
  }

  for (let n = 0; n < 4; n++) segments[n].isStart = true;
  const finishN = segments.length - 5;
  for (let n = finishN; n < segments.length; n++) segments[n].isFinish = true;

  const th = def.theme.sprites;
  for (let n = 20; n < segments.length; n += 3) {
    if (random() < 0.45) {
      const side = random() < 0.5 ? -1 : 1;
      segments[n].sprites.push({
        type: th[Math.floor(random() * th.length)],
        offset: side * (1.25 + random() * 2.2),
        scale: 0.8 + random() * 0.7
      });
    }
  }
  for (let n = 30; n < segments.length; n += 10) {
    const c = segments[n].curve;
    if (Math.abs(c) > 3 && !segments[n].sprites.length) {
      segments[n].sprites.push({ type: 'arrow', offset: c > 0 ? -1.3 : 1.3, scale: 1, dir: c > 0 ? 1 : -1 });
    }
  }
  if (def.id === 'mushroom') {
    for (let n = 1; n < segments.length; n++) {
      const previous = segments[n - 1].curve;
      const curve = segments[n].curve;
      if (Math.abs(previous) < 0.8 && Math.abs(curve) >= 0.8) {
        for (const [gap, scale] of [[90,1.4],[45,1.7]]) {
          const signIndex = n - gap;
          if (signIndex < 20 || Math.abs(segments[signIndex].curve) > 0.35) continue;
          segments[signIndex].sprites.push({type:'arrow',offset:curve > 0 ? -1.28 : 1.28,
            scale,dir:curve > 0 ? 1 : -1});
        }
      }
    }
  }

  /* 障碍物：样板赛道手工布置，其余赛道保留变化。 */
  const hz = def.hazards || [];
  if (def.id === 'mushroom') {
    const cones = [[0.15,-0.42],[0.30,0.43],[0.43,0],[0.59,-0.4],
      [0.75,0.42],[0.88,0]];
    for (const [fraction, offset] of cones) {
      const n = Math.floor(segments.length * fraction);
      segments[n].sprites.push({type:'cone',offset,scale:1,hazard:true,hw:HAZARD_HW.cone});
    }
  } else {
    for (let n = 60; n < segments.length - 20; n += 10) {
      if (hz.length && random() < 0.30) {
        const type = hz[Math.floor(random() * hz.length)];
        const onRoad = type !== 'tire';
        const offset = onRoad
          ? (random() * 1.3 - 0.65)
          : (random() < 0.5 ? -1 : 1) * (1.15 + random() * 0.3);
        segments[n].sprites.push({ type, offset, scale: 1, hazard: true, hw: HAZARD_HW[type] });
      }
    }
  }

  /* 道具箱：成排横跨路面 */
  const boxRows = def.id === 'mushroom'
    ? [0.10,0.26,0.41,0.56,0.72,0.86].map(f => Math.floor(segments.length * f))
    : null;
  const addBoxes = n => {
    [-0.63, -0.21, 0.21, 0.63].forEach((o, k) => {
      if (def.id === 'mushroom' || random() < 0.85) {
        segments[n + k].sprites.push({ type: 'itembox', offset: o, hw: 0.15, boxId: `${def.id}_${n}_${k}` });
      }
    });
  };
  if (boxRows) {
    for (const n of boxRows) addBoxes(n);
  } else {
    for (let n = 90; n < segments.length - 40; n += 70 + ((n * 7) % 40)) addBoxes(n);
  }

  /* 小地图路径预计算 */
  const mapPts = [];
  let hx = 0, hy = 0, heading = 0;
  for (const seg of segments) {
    heading += seg.curve * 0.0045;
    hx += Math.sin(heading);
    hy -= Math.cos(heading);
    mapPts.push([hx, hy]);
  }
  // 分段路面循环时起终点天然相接；消除积分累计误差，让小地图也接成闭环。
  const driftX = mapPts[mapPts.length - 1][0] - mapPts[0][0];
  const driftY = mapPts[mapPts.length - 1][1] - mapPts[0][1];
  for (let i = 0; i < mapPts.length; i++) {
    const t = i / (mapPts.length - 1);
    mapPts[i][0] -= driftX * t;
    mapPts[i][1] -= driftY * t;
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of mapPts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const span = Math.max(maxX - minX, maxY - minY, 0.001);
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  const normPts = mapPts.map(([x, y]) => [0.5 + (x - centerX) / span, 0.5 + (y - centerY) / span]);

  return { segments, length: segments.length * SEG_LEN, mapPts: normPts };
}

/* ---------------- 全局状态 ---------------- */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H_ = 0;
function resize() {
  const scale = Settings.renderScale;
  W = canvas.width = Math.max(320, Math.round(window.innerWidth * scale));
  H_ = canvas.height = Math.max(180, Math.round(window.innerHeight * scale));
}
window.addEventListener('resize', resize);
resize();

let state = 'title';
let pausedFrom = 'race';
let stateTime = 0;
let selectIdx = 0;
let titleMenuIdx = 0;
let settingsRow = 0;
let builtTracks = {};
let curTrack = null, curDef = null;

const player = {
  x: 0, z: 0, speed: 0, dist: 0,
  steerSmooth: 0, bounce: 0,
  drifting: false, driftDir: 0, driftCharge: 0, driftStage: 0, hopT: 0,
  boostT: 0, boostMult: 1,
  slipT: 0, spinT: 0, hitT: 0, obstCd: 0,
  starT: 0, item: null, pendingItem: null, rouletteT: 0, tripleN: 0
};
let cars = [];
let worldShells = [];
let worldBananas = [];
let boxReady = {};          // boxId -> 可再次拾取的时间
let toasts = [];
let particles = [];         // 屏幕空间粒子
let raceTime = 0, lapTimes = [], lapStart = 0, bestLap = null;
let countdown = 0, prevCountNum = 4;
let finalRank = 0, newRecord = false;
let lookBack = false;           // 摄像机是否朝向后方（Q / RB 按住）
let bgOffset = 0, animT = 0, flashT = 0, lastFrameDt = 0.016;

function getBuilt(def) {
  if (!builtTracks[def.id]) builtTracks[def.id] = buildTrack(def);
  return builtTracks[def.id];
}
function findSegment(z) {
  return curTrack.segments[Math.floor(z / SEG_LEN) % curTrack.segments.length];
}
function crossedSegments(startZ, distance) {
  const start = findSegment(startZ).index;
  const count = Math.ceil(Math.max(0, distance) / SEG_LEN);
  const result = [];
  for (let i = 0; i <= count; i++)
    result.push(curTrack.segments[(start + i) % curTrack.segments.length]);
  return result;
}
function toast(text, color = '#fff') {
  toasts.push({ text, color, t: 2.2 });
  if (toasts.length > 3) toasts.shift();
}

/* ---------------- 排名与道具概率 ---------------- */
function racersAll() {
  return [
    { key: 'P', isP: true, x: player.x, z: player.z, dist: player.dist, speed: player.speed, spinT: player.spinT, starT: player.starT },
    ...cars.map(c => ({ key: c, isP: false, x: c.offset, z: c.z, dist: c.dist, speed: c.speed, spinT: c.spinT, starT: c.starT }))
  ];
}
function rankOf(dist) {
  let rank = 1;
  for (const c of cars) if (c.dist > dist) rank++;
  return rank;
}
function pickItem(rank) {
  const front = [['banana',30],['green',30],['mushroom',20],['red',10],['triple',10]];
  const mid   = [['mushroom',22],['red',20],['green',13],['banana',12],['triple',16],['star',17]];
  const back  = [['triple',18],['red',22],['star',23],['mushroom',14],['lightning',23]];
  return weightedPick(rank <= 3 ? front : rank <= 8 ? mid : back);
}
