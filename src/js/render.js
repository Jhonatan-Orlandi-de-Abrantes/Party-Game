import { state, getMyPlayer } from './state.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, DASH_COOLDOWN, BOMB_IMAGE_PATH, EGG_IMAGE_PATH, MAX_BOMB_TIME, TRAIL_LIFE, SHOW_MAP_NAME, RUN_LIVES, RHYTHM_ARROW_COLORS, RHYTHM_BASE_WINDOW, RHYTHM_WINDOW_STEP, RHYTHM_MIN_WINDOW,   POWERUP_CONFIG,
  getPowerup,
  WAR_FIST_SWING,
  getWarWeapon
} from './constants.js';
import { getFpsEnabled, getFpsColor } from './storage.js';
import { drawHat } from './hats.js';
import { drawCosmetics } from './cosmetics.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let resolutionScale = 1;

export function setResolutionScale(scale) {
  resolutionScale = scale;
}

export function loadBombImage() {
  state.bombImage = new Image();
  state.bombImage.onload = () => {
    state.bombImageLoaded = true;
  };
  state.bombImage.src = BOMB_IMAGE_PATH;
}

export function loadEggImage() {
  state.eggImage = new Image();
  state.eggImage.onload = () => {
    state.eggImageLoaded = true;
  };
  state.eggImage.src = EGG_IMAGE_PATH;
}

function roundRectPath(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}

export function drawScene() {
  const gs = state.gameState;
  if (!gs) return;
  const time = gs.time || 0;

  ctx.setTransform(resolutionScale, 0, 0, resolutionScale, 0, 0);
  ctx.clearRect(0, 0, 1080, 540);
  ctx.fillStyle = (gs.map && gs.map.bg) || '#bfe8ff';
  ctx.fillRect(0, 0, 1080, 540);

  const mapColors = (gs.map && gs.map.platformColors) || ['#a3d97a', '#7fd3f2', '#f6c768', '#f2a1a1'];
  gs.platforms.forEach((platform, index) => {
    ctx.fillStyle = platform.red ? '#c92a2a' : (platform.color || mapColors[index % mapColors.length]);
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
  });

  drawParticles();
  drawTrails();
  if (gs.mode !== 'rhythm') drawOrbs(gs, time);
  if (gs.mode === 'war') {
    drawGroundWeapons(gs, time);
    drawBullets(gs);
  }

  if (gs.mode === 'rhythm') drawRhythmArrows(gs, time);

  gs.players.forEach(player => {
    if (!player.alive) return;
    drawPlayer(player, time);
    drawNickname(player);
    if (gs.mode !== 'war') drawDashIndicator(player, time);
    drawPowerupIcons(player, time);
    if ((gs.mode === 'run' && !player.isMonster) || gs.mode === 'war') {
      drawHearts(player);
    }
    if (gs.mode === 'war') drawWarGear(player, time);
    if (player.hasBomb) {
      const bob = Math.sin(time * 4) * 3;
      drawBomb(player.x, player.y - PLAYER_HEIGHT - 28 + bob, 36, 42);
    }
    if (player.hasEgg) {
      const bob = Math.sin(time * 4) * 3;
      drawEgg(player.x, player.y - PLAYER_HEIGHT - 26 + bob, 30, 38);
    }
  });

  drawPickupTexts(gs);
  drawLeaderCrown(gs, time);
  if (gs.mode === 'egg') drawEggScores(gs);
  if (gs.mode === 'rhythm') drawRhythmCrusher(gs);
  drawBombTimer(gs, time);
  drawMapName(gs);
  drawStats();
}

function drawPlayer(player, time) {
  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;
  const x = player.x - w / 2;
  const y = player.y - h;

  const rhythmScale = state.gameState && state.gameState.mode === 'rhythm' ? RHYTHM_PLAYER_SCALE : 1;
  ctx.save();
  if (puActive(player, 'ghost')) {
    ctx.globalAlpha = 0.5 + Math.sin(time * 6) * 0.18;
  }
  if (rhythmScale !== 1) {
    ctx.translate(player.x, player.y);
    ctx.scale(rhythmScale, rhythmScale);
    ctx.translate(-player.x, -player.y);
  }

  const isMonster = !!player.isMonster;
  const bodyColor = isMonster ? '#6a2fb8' : player.color;

  const moving = Math.abs(player.vx) > 25 && player.onGround;
  const phase = player.x * 0.18;
  const footSwing = moving ? Math.sin(phase) * 5 : 0;
  const faceDir = player.vx > 0 ? 1 : player.vx < 0 ? -1 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 3, w * 0.55, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isMonster) {
    const pulse = 0.35 + Math.sin(time * 6) * 0.15;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = 'rgba(106, 47, 184, 0.45)';
    ctx.beginPath();
    ctx.arc(player.x, player.y - h / 2, w * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.save();
  let scaleX = 1;
  let scaleY = 1;
  if (!player.onGround) {
    scaleX = 0.92;
    scaleY = 1.1;
  } else if (moving) {
    const bounce = Math.abs(Math.sin(phase));
    scaleX = 1 + bounce * 0.06;
    scaleY = 1 - bounce * 0.08;
  }
  if (player.hurtCooldown > 0 && !isMonster) {
    ctx.globalAlpha = Math.floor(time * 12) % 2 === 0 ? 0.55 : 1;
  }
  ctx.translate(player.x, player.y);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-player.x, -player.y);

  const footY = player.onGround ? y + h - 4 : y + h - 2;
  const footH = player.onGround ? 9 : 7;

  ctx.fillStyle = '#222';
  roundRectPath(ctx, x + 4 + footSwing * 0.6, footY, 11, footH, 4);
  ctx.fill();
  roundRectPath(ctx, x + w - 15 - footSwing * 0.6, footY, 11, footH, 4);
  ctx.fill();

  ctx.fillStyle = bodyColor;
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  roundRectPath(ctx, x + 8, y + 7, w - 16, h - 20, 8);
  ctx.fill();

  if (isMonster) {
    ctx.fillStyle = '#3d1a73';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 3);
    ctx.lineTo(x + 5, y - 10);
    ctx.lineTo(x + 14, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w - 8, y + 3);
    ctx.lineTo(x + w - 5, y - 10);
    ctx.lineTo(x + w - 14, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const eyeY = y + 18;
  const eyeX1 = x + 12 + faceDir * 1.5;
  const eyeX2 = x + w - 12 + faceDir * 1.5;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(eyeX1, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeX2, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(eyeX1, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(eyeX2, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isMonster ? '#e03131' : '#222';
  ctx.beginPath();
  ctx.arc(eyeX1 + faceDir * 2, eyeY + 1, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX2 + faceDir * 2, eyeY + 1, 2.7, 0, Math.PI * 2);
  ctx.fill();

  if (isMonster) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(player.x - 9, y + 27);
    ctx.lineTo(player.x - 9, y + 32);
    ctx.lineTo(player.x - 4.5, y + 28);
    ctx.lineTo(player.x, y + 32);
    ctx.lineTo(player.x + 4.5, y + 28);
    ctx.lineTo(player.x + 9, y + 32);
    ctx.lineTo(player.x + 9, y + 27);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, y + 27, 4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  drawHat(ctx, { x: player.x, y: player.y, w, h, vx: player.vx, color: bodyColor }, player.hat);
  drawCosmetics(ctx, player, time);

  ctx.restore();

  if ((player.frozen || 0) > 0) drawFrozenOverlay(player, x, y, w, h);
  drawPowerupBodyFx(player, x, y, w, h, time);
  if (state.gameState && state.gameState.mode === 'war' && (player.swingTime || 0) > 0) {
    drawSwingFx(player, w, h);
  }

  const isMine = player.id === state.myPlayerId || (state.localPlayerIds || []).includes(player.id);
  if (isMine) {
    const pulse = 0.55 + Math.sin(time * 5) * 0.25;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = player.color;
    const fw = w * 0.5;
    roundRectPath(ctx, player.x - fw / 2, player.y - 4, fw, 5, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function puActive(player, id) {
  return !!player.effects && (player.effects[id] || 0) > 0;
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function drawOrbs(gs, time) {
  const cfg = POWERUP_CONFIG;
  (gs.orbs || []).forEach(orb => {
    const def = getPowerup(orb.type);
    if (!def || !def.modes.includes(gs.mode)) return;
    const age = time - orb.bornAt;
    const remaining = cfg.orbLifetime - age;
    let alpha = 1;
    if (remaining < cfg.orbBlinkLast) {
      alpha = Math.floor(time * 8) % 2 === 0 ? 0.35 : 0.95;
    }
    const bob = Math.sin(time * 2.4 + orb.id * 1.7) * 5;
    const pulse = 1 + Math.sin(time * 3.2 + orb.id) * 0.06;
    const grow = Math.min(1, age / 0.35);
    const spawnScale = grow < 1 ? Math.max(0, easeOutBack(grow)) : 1;
    const r = cfg.orbRadius * pulse * spawnScale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y + bob, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 93, 177, 0.16)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff5db1';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(orb.x - r * 0.35, orb.y + bob - r * 0.4, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    ctx.font = `bold ${Math.round(r * 1.2)}px "Trebuchet MS", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(120, 20, 80, 0.85)';
    ctx.strokeText('?', orb.x, orb.y + bob + 1);
    ctx.fillStyle = '#ffe3f3';
    ctx.fillText('?', orb.x, orb.y + bob + 1);
    ctx.restore();
  });
}

function playerLift(gs) {
  return gs.mode === 'rhythm' ? PLAYER_HEIGHT * RHYTHM_PLAYER_SCALE : PLAYER_HEIGHT;
}

function drawPowerupIcons(player, time) {
  const entries = [];
  Object.keys(player.effects || {}).forEach(id => {
    const def = getPowerup(id);
    if (!def) return;
    const total = id === 'mSpeed' ? def.monsterSpeedDuration : def.duration;
    entries.push({ icon: def.icon, color: def.color, frac: Math.max(0, Math.min(1, (player.effects[id] || 0) / total)) });
  });
  if ((player.frozen || 0) > 0) {
    const def = getPowerup('freeze');
    entries.push({ icon: def.icon, color: def.color, frac: Math.max(0, Math.min(1, player.frozen / def.freezeDuration)) });
  }
  if (!entries.length) return;
  const gs = state.gameState;
  const gap = 24;
  const baseY = player.y - playerLift(gs) - (player.hasBomb || player.hasEgg ? 68 : 48);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  entries.forEach((entry, index) => {
    const cx = player.x + (index - (entries.length - 1) / 2) * gap;
    const bob = Math.sin(time * 3 + index) * 2;
    ctx.font = '13px sans-serif';
    ctx.fillText(entry.icon, cx, baseY + bob);
    ctx.fillStyle = 'rgba(34,34,34,0.55)';
    roundRectPath(ctx, cx - 9, baseY + bob + 9, 18, 4, 2);
    ctx.fill();
    ctx.fillStyle = entry.color;
    roundRectPath(ctx, cx - 9, baseY + bob + 9, Math.max(2, 18 * entry.frac), 4, 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFrozenOverlay(player, x, y, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#74c0fc';
  roundRectPath(ctx, x - 5, y - 5, w + 10, h + 10, 10);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#e7f5ff';
  ctx.lineWidth = 2;
  roundRectPath(ctx, x - 5, y - 5, w + 10, h + 10, 10);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❄️', player.x, y + h / 2);
  ctx.restore();
}

function drawPowerupBodyFx(player, x, y, w, h, time) {
  if (Math.abs(player.vx || 0) > 40 && (puActive(player, 'speed') || puActive(player, 'mSpeed'))) {
    const dir = player.vx > 0 ? -1 : 1;
    const rgba = puActive(player, 'mSpeed') ? '255,107,107' : '255,212,59';
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = `rgba(${rgba},${0.45 - i * 0.1})`;
      ctx.fillRect(player.x + dir * (w / 2 + i * 9) - 6, y + h * 0.35 + (i - 1) * 9, 6, 2.5);
    }
  }
  if (puActive(player, 'dash')) {
    const flicker = 0.3 + Math.abs(Math.sin(time * 10)) * 0.5;
    ctx.fillStyle = `rgba(255,146,43,${flicker})`;
    ctx.beginPath();
    ctx.arc(x + 9, y + h + 1, 3, 0, Math.PI * 2);
    ctx.arc(x + w - 9, y + h + 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickupTexts(gs) {
  const time = gs.time || 0;
  (gs.recentPickups || []).forEach(entry => {
    const def = getPowerup(entry.typeId);
    const player = gs.players.find(candidate => candidate.id === entry.playerId);
    if (!def || !player) return;
    const q = 1 - Math.max(0, entry.until - time) / POWERUP_CONFIG.pickupTextLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - q);
    ctx.font = 'bold 13px "Trebuchet MS", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    const label = `${def.icon} ${def.name}!`;
    const ty = player.y - playerLift(gs) - 62 - q * 26;
    ctx.strokeText(label, player.x, ty);
    ctx.fillStyle = def.color;
    ctx.fillText(label, player.x, ty);
    ctx.restore();
  });
}

function drawGun(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  roundRectPath(ctx, -12, -5, 22, 9, 3);
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, -10, 3, 7, 12, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGroundWeapons(gs, time) {
  (gs.weapons || []).forEach(ground => {
    const def = getWarWeapon(ground.type);
    if (!def) return;
    const bob = Math.sin(time * 3 + ground.id * 1.3) * 4;
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(time * 4 + ground.id) * 0.15;
    ctx.beginPath();
    ctx.arc(ground.x, ground.y + bob, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    drawGun(ground.x, ground.y + bob, 26, def.color);
    const pips = Math.min(def.ammo, 10);
    for (let i = 0; i < pips; i++) {
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(ground.x - ((pips - 1) * 5) / 2 + i * 5, ground.y + bob + 16, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawBullets(gs) {
  (gs.bullets || []).forEach(bullet => {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    if (bullet.vx < 0) ctx.scale(-1, 1);
    ctx.fillStyle = bullet.color || '#ffe066';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    roundRectPath(ctx, -9, -2.5, 18, 5, 2.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawWarGear(player, time) {
  const gs = state.gameState;
  const bob = Math.sin(time * 4) * 3;
  if (player.weapon && !gs.warFists) {
    const def = getWarWeapon(player.weapon);
    if (def) {
      drawGun(player.x + (player.facing || 1) * 10, player.y - PLAYER_HEIGHT - 20 + bob, 20, def.color);
    }
  } else {
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y - PLAYER_HEIGHT - 20 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y - PLAYER_HEIGHT - 20 + bob, 4.5, Math.PI, Math.PI * 1.9);
    ctx.stroke();
    ctx.restore();
  }
  const pips = Math.min(player.ammo || 0, 12);
  for (let i = 0; i < pips; i++) {
    ctx.fillStyle = '#ffd43b';
    roundRectPath(ctx, player.x - ((pips - 1) * 6) / 2 + i * 6 - 2, player.y + 11, 4, 7, 1.5);
    ctx.fill();
  }
}

function drawSwingFx(player, w, h) {
  const total = WAR_FIST_SWING || 0.22;
  const q = Math.max(0, (player.swingTime || 0) / total);
  if (q <= 0) return;
  const dir = player.facing || 1;
  const p = 1 - q;
  const thrust = Math.sin(p * Math.PI);
  const cx = player.x + dir * (w / 2 + 10 + thrust * 26);
  const cy = player.y - h * 0.55 - thrust * 5;
  ctx.save();
  ctx.globalAlpha = Math.min(1, q * 2.2);
  if (thrust > 0.82) {
    ctx.strokeStyle = 'rgba(255,255,255,' + (((thrust - 0.82) / 0.18) * 0.85).toFixed(3) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 12 + (thrust - 0.82) * 70, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const r1 = 14 + (thrust - 0.82) * 55;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.lineTo(cx + Math.cos(ang) * (r1 + 7), cy + Math.sin(ang) * (r1 + 7));
      ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const ly = cy - 7 + i * 7;
    const back = 14 + i * 8 + thrust * 10;
    ctx.beginPath();
    ctx.moveTo(cx - dir * back, ly);
    ctx.lineTo(cx - dir * (back + 12), ly);
    ctx.stroke();
  }
  const size = 8 + thrust * 4;
  ctx.fillStyle = player.color;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.55, Math.PI, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();
}

function drawNickname(player) {
  const lift = state.gameState && state.gameState.mode === 'rhythm'
    ? PLAYER_HEIGHT * RHYTHM_PLAYER_SCALE
    : PLAYER_HEIGHT;
  ctx.font = 'bold 13px "Trebuchet MS", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.strokeText(player.nickname, player.x, player.y - lift - 14);
  ctx.fillStyle = '#222';
  ctx.fillText(player.nickname, player.x, player.y - lift - 14);
}

function drawBombTimer(gs, time) {
  const rh = gs.mode === 'rhythm' ? gs.rhythm : null;
  if (rh) {
    if (rh.phase !== 'play' || !(rh.seq && rh.seq.length)) return;
    const windowS = Math.max(RHYTHM_MIN_WINDOW, RHYTHM_BASE_WINDOW - (rh.round - 1) * RHYTHM_WINDOW_STEP);
    const frac = Math.max(0, Math.min(1, rh.arrowTimer / windowS));
    let color = '#2ecc40';
    if (frac <= 0.33) color = '#e74c3c';
    else if (frac <= 0.66) color = '#f1c40f';
    const text = `${Math.max(0, rh.arrowTimer).toFixed(1)}s`;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRectPath(ctx, 540 - 92, 12, 184, 40, 12);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 540 - 92, 12, 184, 40, 12);
    ctx.stroke();
    ctx.fillStyle = color;
    roundRectPath(ctx, 540 - 88, 44, 176 * frac, 6, 3);
    ctx.fill();
    ctx.font = '18px "Press Start 2P", "Trebuchet MS", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const urgency2 = frac <= 0.33 ? 1 + Math.sin(time * 8) * 0.12 : 1;
    ctx.save();
    ctx.translate(540, 32);
    ctx.scale(urgency2, urgency2);
    ctx.translate(-540, -32);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeText(text, 540, 32);
    ctx.fillStyle = color;
    ctx.fillText(text, 540, 32);
    ctx.restore();
    return;
  }
  if (gs.bombTime === undefined) return;
  const isEgg = gs.mode === 'egg';
  const isRun = gs.mode === 'run';
  if (!isRun && !isEgg && !gs.players.some(player => player.alive && player.hasBomb)) return;
  if (isEgg && !gs.players.some(player => player.alive && player.hasEgg)) return;
  const timerMax = gs.timerMax || MAX_BOMB_TIME;
  const frac = gs.bombTime / timerMax;
  let color = '#2ecc40';
  if (frac <= 0.33) color = '#e74c3c';
  else if (frac <= 0.66) color = '#f1c40f';
  const text = `${Math.max(0, gs.bombTime).toFixed(1)}s`;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRectPath(ctx, 540 - 92, 12, 184, 40, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  roundRectPath(ctx, 540 - 92, 12, 184, 40, 12);
  ctx.stroke();

  ctx.font = '18px "Press Start 2P", "Trebuchet MS", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const urgency = frac <= 0.33 ? 1 + Math.sin(time * 8) * 0.12 : 1;
  ctx.save();
  ctx.translate(540, 32);
  ctx.scale(urgency, urgency);
  ctx.translate(-540, -32);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.strokeText(text, 540, 32);
  ctx.fillStyle = color;
  ctx.fillText(text, 540, 32);
  ctx.restore();
}

function drawEgg(x, y, w, h) {
  if (state.eggImageLoaded && state.eggImage) {
    const img = state.eggImage;
    const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    let dw = w;
    let dh = h;
    if (aspect > 1) {
      dh = w / aspect;
    } else {
      dw = h * aspect;
    }
    ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.42, h * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawEggScores(gs) {
  const time = gs.time || 0;
  const corners = [
    { x: 12, y: 12, align: 'left' },
    { x: 1068, y: 12, align: 'right' },
    { x: 12, y: 528, align: 'left', bottom: true },
    { x: 1068, y: 528, align: 'right', bottom: true }
  ];
  gs.players.forEach((player, index) => {
    const corner = corners[index % corners.length];
    const score = player.eggScore || 0;
    const text = String(score);
    ctx.font = '16px "Press Start 2P", "Trebuchet MS", monospace';
    const scoreW = ctx.measureText(text).width;
    ctx.font = 'bold 11px "Trebuchet MS", Arial, sans-serif';
    const nameW = ctx.measureText(player.nickname).width;
    const boxW = Math.max(scoreW, nameW) + 22;
    const boxH = 46;
    const boxX = corner.align === 'left' ? corner.x : corner.x - boxW;
    const boxY = corner.bottom ? corner.y - boxH : corner.y;

    ctx.globalAlpha = player.alive ? 1 : 0.35;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRectPath(ctx, boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    const doubled = puActive(player, 'double');
    ctx.strokeStyle = doubled && Math.floor(time * 6) % 2 === 0 ? '#ffd23f' : player.color;
    ctx.lineWidth = 3;
    roundRectPath(ctx, boxX, boxY, boxW, boxH, 10);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.font = 'bold 11px "Trebuchet MS", Arial, sans-serif';
    const nameY = boxY + 16;
    ctx.strokeText(player.nickname, boxX + boxW / 2, nameY);
    ctx.fillStyle = player.color;
    ctx.fillText(player.nickname, boxX + boxW / 2, nameY);
    if (doubled) {
      ctx.fillStyle = Math.floor(time * 6) % 2 === 0 ? '#ffd23f' : '#ffffff';
    }

    ctx.font = '14px "Press Start 2P", "Trebuchet MS", monospace';
    const scoreY = boxY + boxH - 7;
    ctx.strokeText(text, boxX + boxW / 2, scoreY);
    ctx.fillText(text, boxX + boxW / 2, scoreY);
    ctx.globalAlpha = 1;
  });
}

function drawDashIndicator(player, time) {
  const cx = player.x;
  const cy = player.y + 12;
  const barW = 34;
  const barH = 7;
  const progress = player.dashCooldown === 0 ? 1 : 1 - player.dashCooldown / DASH_COOLDOWN;

  ctx.fillStyle = 'rgba(34,34,34,0.5)';
  roundRectPath(ctx, cx - barW / 2, cy, barW, barH, 3);
  ctx.fill();

  if (progress >= 1) {
    const pulse = 0.7 + Math.sin(time * 6) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#2ecc40';
    roundRectPath(ctx, cx - barW / 2, cy, barW, barH, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    const fillW = Math.max(1, barW * progress);
    ctx.fillStyle = '#ffe066';
    roundRectPath(ctx, cx - barW / 2, cy, fillW, barH, 3);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(34,34,34,0.6)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, cx - barW / 2, cy, barW, barH, 2);
  ctx.stroke();

  if (puActive(player, 'dash')) {
    const glow = 0.65 + Math.sin(time * 8) * 0.35;
    ctx.globalAlpha = glow;
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 3;
    roundRectPath(ctx, cx - barW / 2 - 3, cy - 3, barW + 6, barH + 6, 5);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawHearts(player) {
  const total = Math.max(RUN_LIVES, player.lives || 0);
  const cx = player.x;
  const cy = player.y + 26;
  const r = 4.5;
  const gap = 12;
  for (let i = 0; i < total; i++) {
    const hx = cx + (i - (total - 1) / 2) * gap;
    const filled = i < player.lives;
    ctx.beginPath();
    ctx.arc(hx, cy, r, 0, Math.PI * 2);
    if (filled) {
      ctx.fillStyle = '#e03131';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(34,34,34,0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function drawLeaderCrown(gs, time) {
  const room = state.currentRoom;
  if (!room) return;
  const scored = room.players.filter(player => (player.score || 0) > 0);
  if (scored.length === 0) return;
  const maxScore = Math.max(...scored.map(player => player.score || 0));
  const leaders = scored.filter(player => (player.score || 0) === maxScore);
  if (leaders.length !== 1) return;
  const leaderId = leaders[0].id;
  gs.players.forEach(player => {
    if (!player.alive || player.id !== leaderId) return;
    const bob = Math.sin(time * 3) * 2;
    const cy = player.y - PLAYER_HEIGHT - 34 - (player.hasBomb || player.hasEgg ? 26 : 0);
    ctx.save();
    ctx.translate(player.x, cy + bob);
    ctx.shadowColor = '#ffd23f';
    ctx.shadowBlur = 14 + Math.sin(time * 5) * 6;
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 2);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-8, -4);
    ctx.lineTo(0, -15);
    ctx.lineTo(8, -4);
    ctx.lineTo(15, -12);
    ctx.lineTo(15, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e03131';
    [[-8, -3], [0, -7], [8, -3]].forEach(([jewelX, jewelY]) => {
      ctx.beginPath();
      ctx.arc(jewelX, jewelY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  });
}

function drawBomb(x, y, w, h) {
  if (state.bombImageLoaded && state.bombImage) {
    const img = state.bombImage;
    const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    let dw = w;
    let dh = h;
    if (aspect > 1) {
      dh = w / aspect;
    } else {
      dw = h * aspect;
    }
    ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x, y, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(x, y, w / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles() {
  const gs = state.gameState;
  const particles = (gs && gs.particles) || [];
  particles.forEach(particle => {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    if (particle.shape === 'square') {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation || 0);
      const s = particle.size;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

function drawTrails() {
  const gs = state.gameState;
  const trails = (gs && gs.trails) || [];
  const now = gs.time || 0;
  trails.forEach(t => {
    const age = now - (t.t || 0);
    if (age < 0 || age > TRAIL_LIFE) return;
    const alpha = Math.max(0, 1 - age / TRAIL_LIFE) * 0.35;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    const size = 6;
    const rise = age * 20;
    ctx.fillRect(t.x - size / 2, t.y - size / 2 - rise, size, size);
  });
  ctx.globalAlpha = 1;
}

let fpsFrames = 0;
let fpsLastTime = performance.now();
let fpsDisplay = 0;
let statsBoxW = 0;

function drawMapName(gs) {
  if (!SHOW_MAP_NAME) return;
  if (!gs.map || !gs.map.name) return;
  ctx.font = 'bold 12px "Trebuchet MS", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.strokeText(gs.map.name, 1066, 528);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(gs.map.name, 1066, 528);
}

function drawStats() {
  const me = getMyPlayer();
  if (!me || !getFpsEnabled(me.id)) return;
  const gs = state.gameState;

  fpsFrames++;
  const now = performance.now();
  if (now - fpsLastTime >= 1000) {
    fpsDisplay = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
    fpsFrames = 0;
    fpsLastTime = now;
  }

  const ping = gs && gs.t ? Math.max(0, Date.now() - gs.t) : 0;
  const color = getFpsColor(me.id);

  ctx.font = 'bold 14px Consolas, monospace';
  if (!statsBoxW) {
    statsBoxW = Math.ceil(Math.max(
      ctx.measureText('FPS 999').width,
      ctx.measureText('Ping 999ms').width));
  }

  const lines = [`FPS ${fpsDisplay}`, `Ping ${ping}ms`];

  const padX = 16;
  const boxW = statsBoxW + padX * 2;
  const boxH = 54;
  const boxY = gs && gs.mode === 'egg' ? 66 : 16;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRectPath(ctx, 10, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, 10, boxY, boxW, boxH, 8);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  lines.forEach((line, index) => {
    const ty = boxY + 22 + index * 24;
    ctx.strokeText(line, 10 + padX, ty);
    ctx.fillStyle = color;
    ctx.fillText(line, 10 + padX, ty);
  });
}

// Tamanhos do modo Ritmo — mude aqui para ajustar pessoalmente:
const RHYTHM_ARROW_SIZE = 38;      // tamanho das setas acima dos players
const RHYTHM_PLAYER_SCALE = 1.45;  // multiplicador do tamanho dos players
const RHYTHM_CRUSHER_WIDTH = 140;  // largura da prensa

const RHYTHM_ARROW_ANGLE = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

function drawThickArrow(x, y, size, dir, color, alpha, scale) {
  const angle = RHYTHM_ARROW_ANGLE[dir] || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  const s = size / 22;
  ctx.beginPath();
  ctx.moveTo(0, -11 * s);
  ctx.lineTo(10.5 * s, -0.5 * s);
  ctx.lineTo(4.5 * s, -0.5 * s);
  ctx.lineTo(4.5 * s, 11 * s);
  ctx.lineTo(-4.5 * s, 11 * s);
  ctx.lineTo(-4.5 * s, -0.5 * s);
  ctx.lineTo(-10.5 * s, -0.5 * s);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.4 * s;
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRhythmArrows(gs, time) {
  const rh = gs.rhythm;
  if (!rh) return;
  gs.players.forEach(player => {
    if (!player.alive) return;
    const seq = rh.seq || [];
    if (seq.length === 0) return;
    const gap = RHYTHM_ARROW_SIZE + 12;
    const total = (seq.length - 1) * gap;
    const baseY = player.y - PLAYER_HEIGHT * RHYTHM_PLAYER_SCALE - RHYTHM_ARROW_SIZE - 20;
    for (let i = 0; i < seq.length; i++) {
      const dir = seq[i];
      const x = player.x - total / 2 + i * gap;
      let alpha = 1;
      let scale = 1;
      if (i < rh.idx) alpha = 0.28;
      if (i === rh.idx && rh.phase === 'play') {
        scale = 1.18 + Math.sin(time * 9) * 0.14;
        alpha = 1;
      }
      drawThickArrow(x, baseY, RHYTHM_ARROW_SIZE, dir, RHYTHM_ARROW_COLORS[dir], alpha, scale);
    }
    ctx.font = 'bold 22px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fff';
    const scoreText = `${player.rhythmScore || 0} pts`;
    ctx.strokeText(scoreText, player.x, baseY - RHYTHM_ARROW_SIZE - 8);
    ctx.fillStyle = player.color;
    ctx.fillText(scoreText, player.x, baseY - RHYTHM_ARROW_SIZE - 8);
  });
}

function drawRhythmCrusher(gs) {
  const rh = gs.rhythm;
  if (!rh || !rh.victimId || rh.crusherY == null) return;
  const victim = gs.players.find(player => player.id === rh.victimId);
  if (!victim) return;
  const width = RHYTHM_CRUSHER_WIDTH;
  const band = width * 0.18;
  const x = victim.x - width / 2;
  const top = -420;
  const height = rh.crusherY - top;
  ctx.fillStyle = '#3d3d52';
  ctx.fillRect(x, top, width, height);
  ctx.strokeStyle = '#15151f';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, top, width - 4, height - 2);
  ctx.fillStyle = '#22222e';
  ctx.fillRect(x, rh.crusherY - band, width, band);
  ctx.strokeStyle = '#15151f';
  ctx.strokeRect(x, rh.crusherY - band, width, band);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 10, top + 10, 12, Math.max(0, height - band * 2));
}
