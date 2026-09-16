'use strict';
/* ---------------- 比赛初始化：12车手网格发车 ---------------- */
function gridSlot(i) {
  const row = Math.floor(i / 2), col = i % 2;
  return {
    z: increase(0, -( (row + 1) * GRID_GAP + 120 ), curTrack.length),
    x: col === 0 ? -0.42 : 0.42
  };
}

function startRace(def) {
  curDef = def;
  curTrack = getBuilt(def);

  // 清空缓存路段中的残留车辆（修复重赛幽灵车）
  for (const seg of curTrack.segments) seg.cars.length = 0;

  player.x = 0; player.z = 0; player.speed = 0; player.dist = 0;
  player.steerSmooth = 0; player.bounce = 0;
  player.drifting = false; player.driftDir = 0; player.driftCharge = 0; player.driftStage = 0; player.hopT = 0;
  player.boostT = 0; player.boostMult = 1;
  player.slipT = 0; player.spinT = 0; player.hitT = 0; player.obstCd = 0;
  player.starT = 0; player.item = null; player.pendingItem = null;
  player.rouletteT = 0; player.tripleN = 0;

  cars = [];
  for (let i = 0; i < TOTAL_CARS; i++) {
    const profile = DRIVER_PROFILES[i];
    const slot = gridSlot(i);          // AI 占 0~10 号位，玩家 11 号位（末位发车）
    cars.push({
      profile,
      offset: slot.x,
      z: slot.z,
      dist: slot.z - curTrack.length,  // 负距离：尚未越过起点线
      baseSpeed: MAX_SPEED * GAME_TUNING.ai.basePace * profile.pace * (0.985 + Math.random() * 0.03),
      speed: 0, rb: 1,
      goDelay: 0.15 + (1.4 - profile.pace) * 0.7 + Math.random() * 0.20,
      spinT: 0, boostT: 0, starT: 0, obstCd: 0,
      item: null, itemUseAt: 0,
      color: CAR_COLORS[i]
    });
  }
  const pSlot = gridSlot(TOTAL_CARS);
  player.z = pSlot.z;
  player.x = pSlot.x;
  player.dist = pSlot.z - curTrack.length;

  // 分配到渲染段：发车格上的对手立即可见
  for (const car of cars) findSegment(car.z).cars.push(car);

  worldShells = [];
  worldBananas = [];
  boxReady = {};
  toasts = [];
  particles = [];

  raceTime = 0; lapTimes = []; lapStart = 0;
  bestLap = parseFloat(localStorage.getItem('hr_best_' + def.id)) || null;
  newRecord = false;
  finalRank = 0;
  countdown = 3.9;
  prevCountNum = 4;
  bgOffset = 0; flashT = 0;
  state = 'countdown';
  stateTime = 0;
}

/* ---------------- 状态效果 ---------------- */
function applyBoost(dur, mult) {
  player.boostT = Math.max(player.boostT, dur);
  player.boostMult = mult;
}
function spinOutKart(r, severity, slowFactor) {
  r.spinT = Math.max(r.spinT || 0, severity);
  r.speed = (r.speed || 0) * slowFactor;
  if (r === player) {
    player.hitT = 0.45;
    player.bounce = 8;
    player.drifting = false;
    player.driftStage = 0;
    player.boostT = 0;
  }
}
function lightningStrike(excludeKey) {
  flashT = 0.5;
  beep(120, 0.5, 0.25);
  for (const c of cars) {
    if (c === excludeKey || c.starT > 0) continue;
    c.spinT = Math.max(c.spinT, 0.9);
    c.speed *= 0.55;
  }
  if (excludeKey !== 'P' && player.starT <= 0) {
    spinOutKart(player, 0.9, 0.55);
    toast(I18N.t('lightningHit'), '#fff070');
  }
}
function nearestAheadOf(key, dist) {
  let best = null;
  for (const r of racersAll()) {
    if (r.key === key) continue;
    if (r.dist > dist && (!best || r.dist < best.dist)) best = r;
  }
  return best;
}
function fireShell(type, shooterKey, shooterX, shooterZ, shooterDist) {
  const sh = {
    type, z: increase(shooterZ, 320, curTrack.length), x: shooterX,
    speed: MAX_SPEED * 1.4, life: type === 'red' ? 8 : 6,
    owner: shooterKey, graceT: raceTime + 0.5, target: null
  };
  if (type === 'red') sh.target = nearestAheadOf(shooterKey, shooterDist);
  worldShells.push(sh);
  beep(520, 0.12);
}
function dropBanana(ownerKey, x, z) {
  worldBananas.push({ x, z, owner: ownerKey, bornT: raceTime });
  beep(300, 0.08);
}

/* ---------------- 道具使用 ---------------- */
function usePlayerItem() {
  const it = player.item;
  if (!it || player.spinT > 0) return;
  switch (it) {
    case 'mushroom': applyBoost(1.4, 1.35); break;
    case 'triple':
      applyBoost(1.2, 1.33);
      player.tripleN++;
      if (player.tripleN < 3) return; else player.tripleN = 0;
      break;
    case 'banana': dropBanana('P', player.x, increase(player.z, -260, curTrack.length)); break;
    case 'green': fireShell('green', 'P', player.x, player.z, player.dist); break;
    case 'red': fireShell('red', 'P', player.x, player.z, player.dist); break;
    case 'star': player.starT = 5; beep(700, 0.3); break;
    case 'lightning': lightningStrike('P'); break;
  }
  player.item = null;
}
function aiUseItem(car) {
  const it = car.item;
  if (!it) return true;
  const rank = rankOf(car.dist);
  const curve = Math.abs(findSegment(car.z + SEG_LEN * 10).curve);
  switch (it) {
    case 'mushroom': case 'triple':
      if (curve > 2.5 && car.profile.caution > 1) return false;
      car.boostT = 1.2; break;
    case 'banana': dropBanana(car, car.offset, increase(car.z, -260, curTrack.length)); break;
    case 'green': fireShell('green', car, car.offset, car.z, car.dist); break;
    case 'red':
      if (!nearestAheadOf(car, car.dist)) return false;
      fireShell('red', car, car.offset, car.z, car.dist); break;
    case 'star': car.starT = 4; break;
    case 'lightning': if (rank >= 9) lightningStrike(car); else return false; break;
  }
  car.item = null;
  return true;
}
function checkItemBoxes(seg, racerObj, isPlayer) {
  if (isPlayer ? (player.item != null || player.rouletteT > 0) : racerObj.item != null) return;
  const racerX = isPlayer ? racerObj.x : racerObj.offset;
  for (const sp of seg.sprites) {
    if (sp.type !== 'itembox') continue;
    const ready = boxReady[sp.boxId] || 0;
    if (raceTime >= ready && Math.abs(racerX - sp.offset) < sp.hw) {
      if (isPlayer) {
        player.rouletteT = 1.0;
        player.pendingItem = pickItem(rankOf(player.dist));
      } else if (Math.random() < 0.7) {
        racerObj.item = pickItem(rankOf(racerObj.dist));
        racerObj.itemUseAt = raceTime + racerObj.profile.itemDelay + Math.random() * 0.6;
      } else {
        return;
      }
      boxReady[sp.boxId] = raceTime + 3;
      beep(980, 0.1);
      return;
    }
  }
}

/* ---------------- 玩家更新 ---------------- */
function updatePlayer(dt, inp, racing) {
  const len = curTrack.length;
  const speedPct = player.speed / MAX_SPEED;
  const physicsSeg = findSegment(player.z);
  const drivingSeg = findSegment(player.z + SEG_LEN * (7 + speedPct * 12));
  const offroad = player.x < -1 || player.x > 1;
  const dx = dt * 2.2 * speedPct;

  // 计时器
  player.boostT = Math.max(0, player.boostT - dt);
  player.starT = Math.max(0, player.starT - dt);
  player.slipT = Math.max(0, player.slipT - dt);
  player.hitT = Math.max(0, player.hitT - dt);
  player.obstCd = Math.max(0, player.obstCd - dt);
  if (player.hopT > 0) player.hopT -= dt;
  if (flashT > 0) flashT -= dt;
  if (player.rouletteT > 0) {
    player.rouletteT -= dt;
    if (player.rouletteT <= 0) {
      player.item = player.pendingItem;
      toast(I18N.itemName(player.item) + '!', '#ffd040');
      beep(1100, 0.12);
    }
  }

  // 旋转失控中：无法操控
  if (player.spinT > 0) {
    player.spinT -= dt;
    player.speed += (MAX_SPEED * 0.28 - player.speed) * Math.min(1, dt * 3);
    player.drifting = false;
  } else if (racing) {
    /* --- 漂移系统 --- */
    if (!player.drifting && inp.driftEdge && Math.abs(inp.steer) > 0.25
        && speedPct > DRIFT_MIN_SPEED && !offroad) {
      player.drifting = true;
      player.driftDir = Math.sign(inp.steer);
      player.driftCharge = 0;
      player.driftStage = 0;
      player.hopT = 0.26;
      beep(240, 0.1, 0.1);
    }
    if (player.drifting) {
      if (!inp.drift || speedPct < 0.15 || offroad) {
        // 释放漂移 → 涡轮
        if (player.driftCharge > SUPER_TURBO_AT) { applyBoost(1.1, 1.32); toast(I18N.t('superTurbo'), '#ff9020'); beep(900, 0.25); }
        else if (player.driftCharge > MINI_TURBO_AT) { applyBoost(0.65, 1.24); toast(I18N.t('miniTurbo'), '#40c0ff'); beep(750, 0.18); }
        player.drifting = false;
        player.driftStage = 0;
      } else {
        player.driftCharge += dt * (1 + Math.abs(drivingSeg.curve) * 0.12);
        const stage = player.driftCharge > SUPER_TURBO_AT ? 2 : player.driftCharge > MINI_TURBO_AT ? 1 : 0;
        if (stage > player.driftStage) { beep(stage === 2 ? 980 : 700, 0.1, 0.12); player.driftStage = stage; }
      }
    }

    /* --- 转向 --- */
    let steerTarget = inp.steer;
    if (player.slipT > 0) steerTarget += Math.sin(animT * 25) * 0.9;   // 油渍打滑
    let eff;
    if (player.drifting) {
      eff = steerTarget === player.driftDir || Math.sign(steerTarget) === player.driftDir
        ? steerTarget * 1.55 : steerTarget * 0.38;
      player.steerSmooth = lerp(player.steerSmooth, eff, clamp(dt * 12, 0, 1));
    } else {
      const steerResponse = curDef.id === 'snow' ? GAME_TUNING.snow.steerResponse : 9;
      player.steerSmooth = lerp(player.steerSmooth, steerTarget, clamp(dt * steerResponse, 0, 1));
    }
    eff = player.steerSmooth;
    const snowGrip = curDef.id === 'snow' ? GAME_TUNING.snow.grip : 1;
    player.x += eff * dx * snowGrip;
    const centMul = (player.drifting ? 0.55 : 1) * (player.slipT > 0 ? 1.6 : 1)
      * (curDef.id === 'snow' ? GAME_TUNING.snow.centrifugal : 1);
    player.x -= dx * speedPct * drivingSeg.curve * CENTRIFUGAL * centMul;
    // 火山的热风区周期性改变侧向压力，可观察道路的橙色警示段。
    if (curDef.id === 'volcano' && physicsSeg.index % GAME_TUNING.volcano.zonePeriod < GAME_TUNING.volcano.zoneLength)
      player.x += Math.sin(raceTime * 2.4) * dx * GAME_TUNING.volcano.playerForce;

    /* --- 加速/减速 --- */
    if (inp.accel) player.speed += ACCEL * dt * (player.boostT > 0 ? 2.2 : 1);
    else if (inp.brake) player.speed += BRAKING * dt;
    else player.speed += DECEL * dt;
  }

  /* --- 速度上限（涡轮可超速） --- */
  let effMax = MAX_SPEED;
  if (player.boostT > 0) effMax *= player.boostMult;
  if (player.starT > 0) effMax *= 1.22;
  if ((player.x < -1 || player.x > 1) && player.speed > OFFROAD_LIMIT && player.starT <= 0) {
    player.speed += OFFROAD_DECEL * dt;
    player.bounce = Math.random() * 4 - 2;
    player.drifting = false;
  } else {
    player.bounce = lerp(player.bounce, 0, dt * 8);
  }
  if (player.speed > effMax) player.speed += (effMax - player.speed) * Math.min(1, dt * 1.6);
  player.speed = clamp(player.speed, 0, MAX_SPEED * 1.45);
  player.x = clamp(player.x, -2.4, 2.4);

  /* --- 位移与圈数 --- */
  const beforeLap = Math.floor(player.dist / len);
  const oldZ = player.z;
  const travel = player.speed * dt;
  player.dist += travel;
  player.z = increase(player.z, travel, len);
  const afterLap = Math.floor(player.dist / len);
  if (afterLap > beforeLap && racing) {
    if (beforeLap < 0) {
      lapStart = raceTime;               // 首次越过起点线，第1圈开始计时
    } else {
      const lt = raceTime - lapStart;
      lapTimes.push(lt);
      lapStart = raceTime;
      if (bestLap == null || lt < bestLap) {
        bestLap = lt;
        localStorage.setItem('hr_best_' + curDef.id, String(lt));
      }
      beep(880, 0.15);
    }
    if (afterLap >= curDef.laps) {
      state = 'finished';
      stateTime = 0;
      finalRank = rankOf(player.dist);
      newRecord = lapTimes.includes(bestLap);
      beep(660, 0.5); setTimeout(() => beep(880, 0.5), 200);
    } else if (beforeLap >= 0) {
      beep(1200, 0.2);
      toast(I18N.t('lap', { lap: afterLap }), '#7fe0ff');
    }
  }

  /* --- 障碍物碰撞 --- */
  const touchedSegments = crossedSegments(oldZ, travel);
  if (player.starT <= 0) {
    // 泥地持续减速
    for (const seg of touchedSegments) for (const sp of seg.sprites)
      if (sp.type === 'mud' && Math.abs(player.x - sp.offset) < sp.hw)
        player.speed = Math.max(player.speed + OFFROAD_DECEL * 1.3 * dt, MAX_SPEED * 0.22);
    // 固体障碍
    if (player.obstCd <= 0 && player.spinT <= 0) {
      const obstacles = touchedSegments.flatMap(seg => seg.sprites);
      for (const sp of obstacles) {
        if (!sp.hazard || sp.type === 'mud') continue;
        if (Math.abs(player.x - sp.offset) < sp.hw) {
          if (sp.type === 'oil') {
            player.slipT = 1.3; player.speed *= 0.95; player.obstCd = 1.0;
            player.hitT = 0.18;
            toast(I18N.t('slip'), '#aaa'); beep(200, 0.2);
          } else if (sp.type === 'cone') {
            player.speed *= 0.72; player.obstCd = 0.9;
            player.hitT = 0.16; player.bounce = 5;
            player.x += Math.sign(player.x - sp.offset || 1) * 0.06;
            toast(I18N.t('obstacle'), '#ffb060');
            beep(180, 0.12);
          } else {
            player.speed *= 0.38; player.obstCd = 1.0;
            player.hitT = 0.30; player.bounce = 8;
            player.x += Math.sign(player.x - sp.offset || 1) * 0.1;
            toast(I18N.t('hardHit'), '#ff6040');
            beep(140, 0.2);
          }
          break;
        }
      }
    }
  }

  /* --- 道具箱 --- */
  for (const seg of touchedSegments) checkItemBoxes(seg, player, true);

  /* --- 使用道具 --- */
  if (racing && inp.itemEdge) usePlayerItem();
}

