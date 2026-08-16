import { state } from './state.js';
import { getPlayerKeys } from './input.js';
import { publishGameState, getAutoPass, saveRooms } from './storage.js';
import { setStarted } from './rooms.js';
import { playSound, playPop } from './audio.js';
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
  DASH_ACTIVE_TIME,
  TRAIL_LIFE
} from './constants.js';

const FLOOR_Y = 540;
const MIN_X = 30;
const MAX_X = 1050;
const MAX_PARTICLES = 300;
const DEATH_ANIM_TIME = 1.2;
const TRAIL_MAX_POINTS = 200;
const TRAIL_GAP = 6;
const lastTrailPoints = new Map();

let onRoundEnd = null;

export function setOnRoundEnd(fn) {
  onRoundEnd = fn;
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
      hat: player.hat,
      controls: controlSets[index] || controlSets[0]
    };
  });
  const firstHolder = Math.floor(Math.random() * players.length);
  players[firstHolder].hasBomb = true;
  players[firstHolder].lastPasser = players[firstHolder].id;
  lastTrailPoints.clear();
  state.gameState = {
    players,
    trails: [],
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
  if (gs.roundOverTimer != null) {
    gs.roundOverTimer -= dt;
    updateParticles(dt);
    if (gs.roundOverTimer <= 0) {
      finalizeRound();
    }
    return;
  }
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
      playSound('jump');
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

    if (player.alive && player.onGround && Math.abs(player.vx) > 30) {
      const footX = player.x;
      const footY = player.y - 4;
      const last = lastTrailPoints.get(player.id);
      if (!last || Math.hypot(footX - last.x, footY - last.y) > TRAIL_GAP) {
        lastTrailPoints.set(player.id, { x: footX, y: footY });
        gs.trails.push({ x: footX, y: footY, color: player.color, t: gs.time });
        gs.trails = gs.trails.filter(p => gs.time - p.t <= TRAIL_LIFE);
        if (gs.trails.length > TRAIL_MAX_POINTS) {
          gs.trails.splice(0, gs.trails.length - TRAIL_MAX_POINTS);
        }
      }
    }

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
  if (gs.roundOverTimer == null && !holder) {
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
  playPop();
}

function endRound(explodedPlayer) {
  const gs = state.gameState;
  explodedPlayer.alive = false;
  explodedPlayer.hasBomb = false;
  spawnExplosion(explodedPlayer);
  const loser = explodedPlayer.nickname;
  const winnerId = explodedPlayer.lastPasser;
  const winnerPlayer = gs.players.find(player => player.id === winnerId && player.alive) || gs.players.find(player => player.alive);
  const winnerName = winnerPlayer ? winnerPlayer.nickname : 'Ninguém';
  gs.pendingResult = {
    title: 'Explodiu!',
    text: `A bomba explodiu em <strong>${loser}</strong>.<br>Vencedor: <strong>${winnerName}</strong>`,
    winnerId: winnerPlayer ? winnerPlayer.id : null,
    loserId: explodedPlayer.id,
    loserName: loser,
    winnerName
  };
  gs.message = `A bomba explodiu em ${loser}!`;
  gs.roundOverTimer = DEATH_ANIM_TIME;
  playSound('kill');
  state.deathSoundPlayed = true;
}

function finalizeRound() {
  const gs = state.gameState;
  const result = gs.pendingResult;
  gs.pendingResult = null;
  gs.roundOverTimer = null;
  gs.roundResult = result;
  gs.running = false;
  gs.t = Date.now();
  gs.rev = (gs.rev || 0) + 1;
  awardRoundPoints(result);
  publishGameState();
  if (state.currentRoom) {
    setStarted(false);
  }
  if (onRoundEnd) onRoundEnd(result);
}

function awardRoundPoints(result) {
  const room = state.currentRoom;
  if (!room || !result || !result.winnerId) return;
  const players = [...room.players];
  const winner = players.find(player => player.id === result.winnerId);
  if (!winner) return;
  const rest = players
    .filter(player => player.id !== result.winnerId)
    .sort((a, b) => ((b.score || 0) - (a.score || 0)) || (a.joinedAt - b.joinedAt));
  if (result.loserId) {
    const index = rest.findIndex(player => player.id === result.loserId);
    if (index >= 0) {
      const [loser] = rest.splice(index, 1);
      rest.push(loser);
    }
  }
  const ranked = [winner, ...rest];
  const n = ranked.length;
  ranked.forEach((player, position) => {
    player.score = (player.score || 0) + (n - position);
  });
  saveRooms();
  result.scoreboard = ranked.map((player, position) => ({
    id: player.id,
    nickname: player.nickname,
    color: player.color,
    score: player.score,
    place: position + 1
  }));
}

function spawnExplosion(player) {
  spawnShardBurst(player.x, player.y - PLAYER_HEIGHT / 2, 52, [player.color, '#ffffff', '#222222'], 90, 320, 500);
  spawnShardBurst(player.x, player.y - PLAYER_HEIGHT - 46, 20, ['#ff6b6b', '#ffd23f', '#ff9f43', '#ffffff'], 60, 260, 420);
}

function spawnShardBurst(x, y, count, colors, minSpeed, maxSpeed, gravity) {
  const gs = state.gameState;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const life = 0.8 + Math.random() * 0.8;
    gs.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life,
      maxLife: life,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity,
      bounce: true,
      shape: 'square',
      rotation: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 16
    });
  }
  if (gs.particles.length > MAX_PARTICLES) {
    gs.particles.splice(0, gs.particles.length - MAX_PARTICLES);
  }
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
    if (particle.gravity) particle.vy += particle.gravity * dt;
    particle.vx *= 0.96;
    if (particle.rotation !== undefined) {
      particle.rotation += particle.vr * dt;
    }
    if (particle.bounce && particle.y >= FLOOR_Y) {
      particle.y = FLOOR_Y;
      particle.vy = -particle.vy * 0.45;
      particle.vx *= 0.7;
    }
  }
}
