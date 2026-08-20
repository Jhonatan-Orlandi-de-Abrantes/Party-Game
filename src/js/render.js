import { state, getMyPlayer } from './state.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, DASH_COOLDOWN, BOMB_IMAGE_PATH, MAX_BOMB_TIME, TRAIL_LIFE, SHOW_MAP_NAME } from './constants.js';
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
    ctx.fillStyle = mapColors[index % mapColors.length];
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
  });

  drawParticles();
  drawTrails();

  gs.players.forEach(player => {
    if (!player.alive) return;
    drawPlayer(player, time);
    drawNickname(player);
    drawDashIndicator(player, time);
    if (player.hasBomb) {
      const bob = Math.sin(time * 4) * 3;
      drawBomb(player.x, player.y - PLAYER_HEIGHT - 28 + bob, 36, 42);
    }
  });

  drawLeaderCrown(gs, time);
  drawBombTimer(gs, time);
  drawMapName(gs);
  drawStats();
}

function drawPlayer(player, time) {
  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;
  const x = player.x - w / 2;
  const y = player.y - h;

  const moving = Math.abs(player.vx) > 25 && player.onGround;
  const phase = player.x * 0.18;
  const footSwing = moving ? Math.sin(phase) * 5 : 0;
  const faceDir = player.vx > 0 ? 1 : player.vx < 0 ? -1 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 3, w * 0.55, 6, 0, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.fillStyle = player.color;
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  roundRectPath(ctx, x + 8, y + 7, w - 16, h - 20, 8);
  ctx.fill();

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

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(eyeX1 + faceDir * 2, eyeY + 1, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX2 + faceDir * 2, eyeY + 1, 2.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, y + 27, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  drawHat(ctx, { x: player.x, y: player.y, w, h, vx: player.vx, color: player.color }, player.hat);
  drawCosmetics(ctx, player, time);

  ctx.restore();

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
}

function drawNickname(player) {
  ctx.font = 'bold 13px "Trebuchet MS", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.strokeText(player.nickname, player.x, player.y - PLAYER_HEIGHT - 14);
  ctx.fillStyle = '#222';
  ctx.fillText(player.nickname, player.x, player.y - PLAYER_HEIGHT - 14);
}

function drawBombTimer(gs, time) {
  if (gs.bombTime === undefined) return;
  if (!gs.players.some(player => player.alive && player.hasBomb)) return;
  const frac = gs.bombTime / MAX_BOMB_TIME;
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
    const cy = player.y - PLAYER_HEIGHT - 34 - (player.hasBomb ? 26 : 0);
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

  ctx.font = 'bold 11px Consolas, monospace';
  if (!statsBoxW) {
    statsBoxW = Math.ceil(Math.max(
      ctx.measureText('FPS 999').width,
      ctx.measureText('Ping 999ms').width));
  }

  const lines = [`FPS ${fpsDisplay}`, `Ping ${ping}ms`];

  const padX = 14;
  const boxW = statsBoxW + padX * 2;
  const boxH = 42;
  const boxY = 16;
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
    const ty = boxY + 17 + index * 19;
    ctx.strokeText(line, 10 + padX, ty);
    ctx.fillStyle = color;
    ctx.fillText(line, 10 + padX, ty);
  });
}
