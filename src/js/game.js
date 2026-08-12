import { state } from './state.js';
import { getPlayerKeys } from './input.js';
import { publishGameState, getAutoPass } from './storage.js';
import { setStarted } from './rooms.js';
import {
  controlSets,
  MAX_BOMB_TIME,
  DASH_COOLDOWN,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  BOMB_PASS_DISTANCE,
  GRAVITY,
  FRICTION,
  RUN_SPEED,
  JUMP_SPEED,
  DASH_SPEED,
  DASH_ACTIVE_TIME
} from './constants.js';

const FLOOR_Y = 540;
const MIN_X = 30;
const MAX_X = 1050;
const MAX_PARTICLES = 300;

let onRoundEnd = null;
let onToast = null;

export function setOnRoundEnd(fn) {
  onRoundEnd = fn;
}

export function setOnToast(fn) {
  onToast = fn;
}

export function initGame() {
  const players = state.currentRoom.players.map((player, index) => {
    return {
      id: player.id,
      nickname: player.nickname,
      color: player.color,
      x: 120 + index * 180,
      y: 320,
      vx: 0,
      vy: 0,
      onGround: false,
      alive: true,
      hasBomb: false,
      bombTime: MAX_BOMB_TIME,
      dashCooldown: 0,
      dashActive: false,
      dashTime: 0,
      passCooldown: 0,
      lastPasser: null,
      controls: controlSets[index] || controlSets[0]
    };
  });
  const firstHolder = Math.floor(Math.random() * players.length);
  players[firstHolder].hasBomb = true;
  players[firstHolder].lastPasser = players[firstHolder].id;
  state.gameState = {
    players,
    platforms: [
      { x: 0, y: 500, width: 1080, height: 40 },
      { x: 120, y: 390, width: 320, height: 24 },
      { x: 640, y: 300, width: 300, height: 24 },
      { x: 360, y: 220, width: 260, height: 24 }
    ],
    bombOwnerId: players[firstHolder].id,
    bombTime: MAX_BOMB_TIME,
    time: 0,
    running: true,
    winner: null,
    message: 'A partida começou! Passe a bomba para alguém antes que ela exploda.',
    rev: 0,
    t: Date.now(),
    roundResult: null,
    lastTime: null,
    particles: []
  };
}

export function stepGame(dt) {
  const gs = state.gameState;
  if (!gs) return;
  gs.time = (gs.time || 0) + dt;
  updatePlayers(dt);
  collidePlayers();
  updateParticles(dt);
}

function updatePlayers(dt) {
  const gs = state.gameState;
  gs.players.forEach(player => {
    if (!player.alive) return;
    const keys = getPlayerKeys(player);
    const left = keys.left;
    const right = keys.right;
    const jump = keys.jump;
    const dash = keys.dash;

    if (player.dashCooldown > 0) {
      player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    }
    if (player.dashActive) {
      player.dashTime -= dt;
      if (player.dashTime <= 0) {
        player.dashActive = false;
      }
    }
    if (player.passCooldown > 0) {
      player.passCooldown = Math.max(0, player.passCooldown - dt);
    }

    let move = 0;
    if (left) move -= 1;
    if (right) move += 1;

    if (player.dashActive) {
      player.vx = player.vx * 0.96 + move * DASH_SPEED * 0.06;
      spawnDashParticles(player);
    } else {
      player.vx += move * RUN_SPEED * dt;
      player.vx *= FRICTION;
    }

    if (jump && player.onGround) {
      player.vy = -JUMP_SPEED;
      player.onGround = false;
    }

    if (dash && player.dashCooldown === 0 && !player.dashActive) {
      player.dashActive = true;
      player.dashTime = DASH_ACTIVE_TIME;
      player.dashCooldown = DASH_COOLDOWN;
      player.vx += (move || 1) * DASH_SPEED;
      spawnDashParticles(player);
    }

    player.vy += GRAVITY * dt;
    const prevBottom = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.onGround = false;
    const halfW = PLAYER_WIDTH / 2;
    const pLeft = player.x - halfW;
    const pRight = player.x + halfW;
    gs.platforms.forEach(platform => {
      if (player.vy >= 0 &&
          pRight > platform.x + 4 &&
          pLeft < platform.x + platform.width - 4 &&
          prevBottom <= platform.y + 1 &&
          player.y >= platform.y &&
          player.y < platform.y + platform.height) {
        player.y = platform.y;
        player.vy = 0;
        player.onGround = true;
      }
    });

    if (player.y > FLOOR_Y) {
      player.y = FLOOR_Y;
      player.vy = 0;
      player.onGround = true;
    }
    if (player.x < MIN_X) player.x = MIN_X;
    if (player.x > MAX_X) player.x = MAX_X;

    if (player.hasBomb) {
      player.bombTime = Math.max(0, player.bombTime - dt);
      gs.bombTime = player.bombTime;
      gs.bombOwnerId = player.id;
      if (player.bombTime <= 0) {
        endRound(player);
        return;
      }
    }
  });

  const holder = gs.players.find(player => player.hasBomb && player.alive);
  if (!holder) {
    const alivePlayers = gs.players.filter(player => player.alive);
    if (alivePlayers.length > 0) {
      alivePlayers[0].hasBomb = true;
      alivePlayers[0].bombTime = MAX_BOMB_TIME;
      gs.bombOwnerId = alivePlayers[0].id;
    }
  }
}

function collidePlayers() {
  const gs = state.gameState;
  gs.players.forEach(player => {
    if (!player.alive || !player.hasBomb) return;
    const keys = getPlayerKeys(player);
    const auto = getAutoPass(player.id);
    if (!keys.pass && !auto) return;
    if (player.passCooldown > 0) return;
    gs.players.forEach(target => {
      if (target.id === player.id || !target.alive) return;
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      if (Math.hypot(dx, dy) < BOMB_PASS_DISTANCE) {
        transferBomb(player, target);
      }
    });
  });
}

function transferBomb(holder, target) {
  if (!holder.hasBomb || !target.alive) return;
  const gs = state.gameState;
  holder.hasBomb = false;
  target.hasBomb = true;
  target.bombTime = gs.bombTime;
  target.passCooldown = 0.6;
  gs.bombOwnerId = target.id;
  target.lastPasser = holder.id;
  const message = `${holder.nickname} passou a bomba para ${target.nickname}!`;
  gs.message = message;
  if (onToast) onToast(message);
}

function endRound(explodedPlayer) {
  const gs = state.gameState;
  gs.running = false;
  explodedPlayer.alive = false;
  const loser = explodedPlayer.nickname;
  const winnerId = explodedPlayer.lastPasser;
  const winnerPlayer = gs.players.find(player => player.id === winnerId && player.alive) || gs.players.find(player => player.alive);
  const winnerName = winnerPlayer ? winnerPlayer.nickname : 'Ninguém';
  const result = {
    title: 'Explodiu!',
    text: `A bomba explodiu em <strong>${loser}</strong>.<br>Vencedor: <strong>${winnerName}</strong>`,
    winnerId: winnerPlayer ? winnerPlayer.id : null,
    loserId: explodedPlayer.id,
    loserName: loser,
    winnerName
  };
  if (state.currentRoom) {
    setStarted(false);
  }
  gs.roundResult = result;
  gs.t = Date.now();
  gs.rev = (gs.rev || 0) + 1;
  publishGameState();
  if (onRoundEnd) onRoundEnd(result);
}

function spawnDashParticles(player) {
  const gs = state.gameState;
  const life = 0.45 + Math.random() * 0.4;
  gs.particles.push({
    x: player.x + (Math.random() * 18 - 9),
    y: player.y - PLAYER_HEIGHT + 2 + Math.random() * 6,
    vx: (Math.random() * 30 - 15) - (player.vx || 0) * 0.15,
    vy: -(30 + Math.random() * 45),
    life,
    maxLife: life,
    size: 3 + Math.random() * 4.5,
    color: '#7a7a7a'
  });
  if (gs.particles.length > MAX_PARTICLES) {
    gs.particles.splice(0, gs.particles.length - MAX_PARTICLES);
  }
}

function updateParticles(dt) {
  const gs = state.gameState;
  for (let i = gs.particles.length - 1; i >= 0; i--) {
    const particle = gs.particles[i];
    particle.life -= dt;
    if (particle.life <= 0) {
      gs.particles.splice(i, 1);
      continue;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.96;
  }
}
