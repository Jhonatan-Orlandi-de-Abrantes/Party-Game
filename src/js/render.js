import { state, getMyPlayer } from './state.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, DASH_COOLDOWN, BOMB_IMAGE_PATH, MAX_BOMB_TIME } from './constants.js';
import { getFpsEnabled, getFpsColor } from './storage.js';
import { drawHat } from './hats.js';

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
  ctx.fillStyle = '#bfe8ff';
  ctx.fillRect(0, 0, 1080, 540);

  const platformColors = ['#a3d97a', '#7fd3f2', '#f6c768', '#f2a1a1'];
  gs.platforms.forEach((platform, index) => {
    ctx.fillStyle = platformColors[index % platformColors.length];
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
  });

  drawParticles();

  gs.players.forEach(player => {
    if (!player.alive) return;
    drawPlayer(player, time);
    drawNickname(player);
    drawDashIndicator(player, time);
    if (player.hasBomb) {
      const bob = Math.sin(time * 4) * 3;
      drawBomb(player.x, player.y - PLAYER_HEIGHT - 46 + bob, 36, 42);
    }
  });

  drawBombTimer(gs, time);
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

  ctx.restore();

  if (player.id === state.myPlayerId) {
    const pulse = 0.55 + Math.sin(time * 5) * 0.25;
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = pulse;
    roundRectPath(ctx, x - 4, y - 4, w + 8, h + 8, 14);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = player.color;
    roundRectPath(ctx, player.x - w / 2 + 6, player.y + 5, w - 12, 5, 3);
    ctx.fill();
  }
}

function drawNickname(player) {
  ctx.font = 'bold 13px "Trebuchet MS", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.strokeText(player.nickname, player.x, player.y - PLAYER_HEIGHT - 32);
  ctx.fillStyle = '#222';
  ctx.fillText(player.nickname, player.x, player.y - PLAYER_HEIGHT - 32);
}

function drawBombTimer(gs, time) {
  if (gs.bombTime === undefined) return;
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
  const cy = player.y - PLAYER_HEIGHT - 16;
  const radius = 7;
  const progress = player.dashCooldown === 0 ? 1 : 1 - player.dashCooldown / DASH_COOLDOWN;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(34,34,34,0.5)';
  ctx.fill();

  if (progress >= 1) {
    const pulse = 1 + Math.sin(time * 6) * 0.14;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#2ecc40';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
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
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

let fpsFrames = 0;
let fpsLastTime = performance.now();
let fpsDisplay = 0;

function drawStats() {
  if (state.currentRoom && state.currentRoom.mode === 'local') return;
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

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRectPath(ctx, 10, 10, 148, 46, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, 10, 10, 148, 46, 8);
  ctx.stroke();

  ctx.font = 'bold 15px Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  const lines = [`FPS ${fpsDisplay}`, `Ping ${ping}ms`];
  lines.forEach((line, index) => {
    const ty = 30 + index * 20;
    ctx.strokeText(line, 16, ty);
    ctx.fillStyle = color;
    ctx.fillText(line, 16, ty);
  });
}
