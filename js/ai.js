'use strict';
/* ---------------- 世界更新（AI/弹道/香蕉） ---------------- */
function updateWorld(dt, racing) {
  const len = curTrack.length;

  /* AI 车 */
  for (const car of cars) {
    if (racing && raceTime < car.goDelay) continue;   // 起跑反应延迟
    car.boostT = Math.max(0, car.boostT - dt);
    car.starT = Math.max(0, car.starT - dt);
    car.obstCd = Math.max(0, car.obstCd - dt);

    // 橡皮筋平衡：落后太多加速，领先太多放缓
    const gap = player.dist - car.dist;
    const rbTarget = gap > 2500 ? GAME_TUNING.ai.catchup
      : gap < -3500 ? GAME_TUNING.ai.leadSlowdown : 1;
    car.rb += (rbTarget - car.rb) * Math.min(1, dt * 2);

    let tgt = car.baseSpeed * car.rb;
    if (curDef.id === 'snow') tgt *= GAME_TUNING.snow.aiSpeed;
    // 看前方弯道与路障，而不是只根据当前段横向漂移。
    const baseIndex = findSegment(car.z).index;
    const foresight = Math.round(GAME_TUNING.ai.foresightBase
      + curDef.difficulty * GAME_TUNING.ai.foresightDifficulty
      + car.profile.caution * GAME_TUNING.ai.foresightCaution);
    let bend = 0;
    for (let ahead = 8; ahead <= foresight; ahead += 4) {
      bend = Math.max(bend, Math.abs(curTrack.segments[(baseIndex + ahead) % curTrack.segments.length].curve));
    }
    tgt *= clamp(1 - bend * 0.035 * car.profile.caution, 0.68, 1);
    const lanes = [-0.58, 0, 0.58];
    let bestLane = lanes[0], bestScore = Infinity;
    for (const lane of lanes) {
      let score = Math.abs(lane - car.offset) * 0.7 + Math.abs(lane - car.profile.lane) * 0.12;
      for (let ahead = 3; ahead <= foresight; ahead++) {
        const seg = curTrack.segments[(baseIndex + ahead) % curTrack.segments.length];
        for (const sp of seg.sprites) {
          if (sp.hazard && Math.abs(lane - sp.offset) < sp.hw + 0.22)
            score += (foresight + 1 - ahead) * 0.12 * car.profile.caution;
        }
      }
      for (const other of cars) {
        if (other !== car && other.dist > car.dist && other.dist - car.dist < 1600 && Math.abs(other.offset - lane) < 0.32)
          score += 0.8 * car.profile.caution;
      }
      if (score < bestScore) { bestScore = score; bestLane = lane; }
    }
    car.offset += clamp(bestLane - car.offset, -dt * (1.15 / car.profile.caution),
      dt * (1.15 / car.profile.caution));
    if (curDef.id === 'volcano' && baseIndex % GAME_TUNING.volcano.zonePeriod < GAME_TUNING.volcano.zoneLength)
      car.offset += Math.sin(raceTime * 2.4) * dt * GAME_TUNING.volcano.aiForce;
    if (car.boostT > 0) tgt *= 1.28;
    if (car.starT > 0) tgt *= 1.18;
    if (car.spinT > 0) { car.spinT -= dt; tgt *= 0.25; }
    car.speed += (tgt - car.speed) * Math.min(1, dt * 1.8);

    const oldSeg = findSegment(car.z);
    car.offset = clamp(car.offset, -0.85, 0.85);

    // 避让玩家
    const relZ = dzAbs(car.z, player.z, len);
    if (relZ < 2200 && relZ > 400 && Math.abs(car.offset - player.x) < 0.35) {
      car.offset += (car.offset > player.x ? 1 : -1) * dt * 0.8;
    }

    car.dist += car.speed * dt;
    car.z = increase(car.z, car.speed * dt, len);
    const newSeg = findSegment(car.z);
    if (oldSeg !== newSeg) {
      const i = oldSeg.cars.indexOf(car);
      if (i >= 0) oldSeg.cars.splice(i, 1);
      newSeg.cars.push(car);
    }
    if (racing && car.starT <= 0 && car.obstCd <= 0) {
      for (const seg of crossedSegments(oldSeg.p1.world.z, car.speed * dt)) {
        const hit = seg.sprites.find(sp => sp.hazard && Math.abs(car.offset - sp.offset) < sp.hw);
        if (!hit) continue;
        car.speed *= hit.type === 'cone' ? 0.70 : hit.type === 'mud' ? 0.85 : 0.45;
        if (hit.type === 'oil') car.spinT = Math.max(car.spinT, 0.45);
        car.obstCd = 0.8;
        break;
      }
    }

    if (racing && car.spinT <= 0) {
      for (const seg of crossedSegments(oldSeg.p1.world.z, car.speed * dt))
        checkItemBoxes(seg, car, false);
      if (car.item && raceTime >= car.itemUseAt && !aiUseItem(car))
        car.itemUseAt = raceTime + 0.6;
    }

    // AI 撞香蕉/被龟壳击中
    for (let i = worldBananas.length - 1; i >= 0; i--) {
      const b = worldBananas[i];
      if (dzAbs(b.z, car.z, len) < 150 && Math.abs(b.x - car.offset) < 0.24) {
        if (car.starT > 0) { worldBananas.splice(i, 1); continue; }
        spinOutKart(car, 1.0, 0.45);
        worldBananas.splice(i, 1);
      }
    }
    for (let i = worldShells.length - 1; i >= 0; i--) {
      const sh = worldShells[i];
      if (sh.owner === car && raceTime < sh.graceT) continue;
      if (dzAbs(sh.z, car.z, len) < 170 && Math.abs(sh.x - car.offset) < 0.34) {
        if (car.starT > 0) { worldShells.splice(i, 1); continue; }
        spinOutKart(car, 1.4, 0.35);
        worldShells.splice(i, 1);
      }
    }
  }

  /* 龟壳飞行 */
  for (let i = worldShells.length - 1; i >= 0; i--) {
    const sh = worldShells[i];
    sh.life -= dt;
    if (sh.type === 'red' && sh.target) {
      const targetX = sh.target.key === 'P' ? player.x : sh.target.key.offset;
      sh.x += clamp(targetX - sh.x, -1, 1) * dt * 2.2;
    }
    sh.z = increase(sh.z, sh.speed * dt, len);
    // 命中玩家
    if (!(sh.owner === 'P' && raceTime < sh.graceT)) {
      if (dzAbs(sh.z, player.z, len) < 170 && Math.abs(sh.x - player.x) < 0.34) {
        if (player.starT > 0) {
          worldShells.splice(i, 1); continue;
        }
        if (player.spinT <= 0) {
          spinOutKart(player, 1.4, 0.35);
          toast(I18N.t('shellHit'), '#ff5050');
          beep(160, 0.3);
        }
        worldShells.splice(i, 1);
        continue;
      }
    }
    if (sh.life <= 0) worldShells.splice(i, 1);
  }

  /* 玩家撞香蕉 */
  for (let i = worldBananas.length - 1; i >= 0; i--) {
    const b = worldBananas[i];
    if (b.owner === 'P' && raceTime - b.bornT < 1.0) continue;
    if (dzAbs(b.z, player.z, len) < 150 && Math.abs(b.x - player.x) < 0.24) {
      if (player.starT > 0) { worldBananas.splice(i, 1); continue; }
      if (player.spinT <= 0) {
        spinOutKart(player, 1.0, 0.45);
        toast(I18N.t('bananaHit'), '#ffe060');
        beep(200, 0.25);
      }
      worldBananas.splice(i, 1);
    }
  }

  /* 卡丁车间碰撞推挤 */
  for (const car of cars) {
    if (dzAbs(car.z, player.z, len) < 150 && Math.abs(car.offset - player.x) < 0.32) {
      if (player.starT > 0 && car.starT <= 0) { spinOutKart(car, 1.2, 0.4); toast(I18N.t('kartHit'), '#ffd040'); }
      else if (car.starT > 0 && player.starT <= 0) { spinOutKart(player, 1.2, 0.4); }
      else {
        const push = (player.x >= car.offset ? 1 : -1) * dt * 1.2;
        player.x = clamp(player.x + push, -2.4, 2.4);
        car.offset = clamp(car.offset - push, -0.85, 0.85);
        if (player.dist < car.dist) player.speed *= (1 - dt * 0.5);
        else car.speed *= (1 - dt * 0.5);
      }
    }
  }

  /* 提示消息老化 */
  for (let i = toasts.length - 1; i >= 0; i--) {
    toasts[i].t -= dt;
    if (toasts[i].t <= 0) toasts.splice(i, 1);
  }
}

