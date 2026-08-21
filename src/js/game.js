import { state } from './state.js';
import { getPlayerKeys } from './input.js';
import { publishGameState, saveRooms } from './storage.js';
import { setStarted } from './rooms.js';
import { playSound, playPop } from './audio.js';
import { getPlayableMaps } from './maps.js';
import {
  controlSets,
  MAX_BOMB_TIME,
  MAX_SCORE,
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
  TRAIL_LIFE,
  DEFAULT_ROOM_SETTINGS,
  EGG_ROUND_TIME,
  EGG_SCORE_TICK,
  RUN_ROUND_TIME,
  RUN_LIVES,
  MONSTER_HIT_COOLDOWN
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
const usedMaps = new Set();

export function setOnRoundEnd(fn) {
  onRoundEnd = fn;
}

function roomSettings() {
  return { ...DEFAULT_ROOM_SETTINGS, ...(state.currentRoom && state.currentRoom.settings) };
}

function gameMode() {
  return (state.currentRoom && state.currentRoom.mode) || 'bomb';
}

function isEggMode() {
  return gameMode() === 'egg';
}

function isRunMode() {
  return gameMode() === 'run';
}

function selectMapFromPool(pool) {
  const keyed = pool.map((map, index) => ({ map, key: map.custom ? map.customId : 'native:' + index }));
  const selection = state.currentRoom && state.currentRoom.mapSelection;
  let candidates = keyed;
  if (Array.isArray(selection) && selection.length > 0) {
    const wanted = new Set(selection);
    const filtered = keyed.filter(entry => wanted.has(entry.key));
    if (filtered.length > 0) candidates = filtered;
  }
  if (usedMaps.size >= candidates.length) {
    usedMaps.clear();
  }
  const available = candidates.filter(entry => !usedMaps.has(entry.key));
  const chosen = available[Math.floor(Math.random() * available.length)];
  usedMaps.add(chosen.key);
  return chosen.map;
}

export function initGame() {
  const eggMode = isEggMode();
  const runMode = isRunMode();
  const chosenMap = selectMapFromPool(getPlayableMaps(gameMode()));
  const spawns = Array.isArray(chosenMap.spawns) ? chosenMap.spawns : [];
  const players = state.currentRoom.players.map((player, index) => {
    const spawn = spawns[index];
    return {
      id: player.id,
      nickname: player.nickname,
      color: player.color,
      x: spawn && Number.isFinite(spawn.x) ? spawn.x : 120 + index * 180,
      y: spawn && Number.isFinite(spawn.y) ? spawn.y : 320,
      vx: 0,
      vy: 0,
      onGround: false,
      alive: true,
      hasBomb: false,
      hasEgg: false,
      eggScore: 0,
      eggAcc: 0,
      bombTime: MAX_BOMB_TIME,
      dashCooldown: 0,
      dashActive: false,
      dashTime: 0,
      passCooldown: 0,
      lastPasser: null,
      isMonster: false,
      lives: RUN_LIVES,
      hurtCooldown: 0,
      hat: player.hat,
      cosmetics: player.cosmetics || [],
      controls: controlSets[index] || controlSets[0]
    };
  });
  let firstHolder;
  let monsterIndex = -1;
  if (runMode) {
    let candidates = players;
    if (state.lastMonsterId) {
      const filtered = players.filter(p => p.id !== state.lastMonsterId);
      if (filtered.length > 0) candidates = filtered;
    }
    monsterIndex = players.indexOf(candidates[Math.floor(Math.random() * candidates.length)]);
    firstHolder = -1;
  } else if (state.lastBombHolder && !eggMode) {
    const candidates = players.filter(p => p.id !== state.lastBombHolder);
    firstHolder = candidates.length > 0
      ? players.indexOf(candidates[Math.floor(Math.random() * candidates.length)])
      : Math.floor(Math.random() * players.length);
  } else {
    firstHolder = Math.floor(Math.random() * players.length);
  }
  if (runMode) {
    players[monsterIndex].isMonster = true;
    players[monsterIndex].lives = 0;
  } else if (eggMode) {
    players[firstHolder].hasEgg = true;
  } else {
    players[firstHolder].hasBomb = true;
    players[firstHolder].lastPasser = players[firstHolder].id;
  }
  lastTrailPoints.clear();
  state.gameState = {
    mode: gameMode(),
    players,
    trails: [],
    platforms: chosenMap.platforms.map(platform => ({ ...platform })),
    map: {
      name: chosenMap.name,
      bg: chosenMap.bg,
      platformColors: chosenMap.platformColors || ['#a3d97a', '#7fd3f2', '#f6c768', '#f2a1a1'],
      music: chosenMap.music || null
    },
    bombOwnerId: runMode ? null : players[firstHolder].id,
    eggOwnerId: eggMode ? players[firstHolder].id : null,
    monsterId: runMode ? players[monsterIndex].id : null,
    hitCount: 0,
    bombTime: runMode ? RUN_ROUND_TIME : eggMode ? EGG_ROUND_TIME : MAX_BOMB_TIME,
    timerMax: runMode ? RUN_ROUND_TIME : eggMode ? EGG_ROUND_TIME : MAX_BOMB_TIME,
    deathOrder: [],
    time: 0,
    running: true,
    winner: null,
    message: runMode
      ? `${players[monsterIndex].nickname} é o monstro! Corram!`
      : eggMode
        ? 'Pegue o ovo! Quem tiver menos pontos quando o tempo zerar explode.'
        : 'A partida começou! Passe a bomba para alguém antes que ela exploda.',
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
  if (gs.mode === 'egg' && gs.running && gs.roundOverTimer == null) {
    gs.bombTime = Math.max(0, (gs.bombTime || 0) - dt);
    if (gs.bombTime <= 0) {
      explodeLowestScore();
    }
  }
  if (gs.mode === 'run' && gs.running && gs.roundOverTimer == null) {
    gs.bombTime = Math.max(0, (gs.bombTime || 0) - dt);
    if (gs.bombTime <= 0) {
      finishRunRound(true);
    }
  }
}

function updatePlayers(dt) {
  const gs = state.gameState;
  const speedScale = (roomSettings().playerSpeed || 100) / 100;
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
    if (player.hurtCooldown > 0) {
      player.hurtCooldown = Math.max(0, player.hurtCooldown - dt);
    }

    let move = 0;
    if (left) move -= 1;
    if (right) move += 1;

    if (player.dashActive) {
      player.vx = player.vx * 0.96 + move * DASH_SPEED * speedScale * 0.06;
      spawnDashParticles(player);
    } else {
      player.vx += move * RUN_SPEED * speedScale * dt;
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
      player.vx += (move || 1) * DASH_SPEED * speedScale;
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

    if (player.hasBomb && gs.mode !== 'egg') {
      player.bombTime = Math.max(0, player.bombTime - dt);
      gs.bombTime = player.bombTime;
      gs.bombOwnerId = player.id;
      if (player.bombTime <= 0) {
        endRound(player);
        return;
      }
    }

    if (player.hasEgg) {
      player.eggAcc = (player.eggAcc || 0) + dt;
      while (player.eggAcc >= EGG_SCORE_TICK) {
        player.eggAcc -= EGG_SCORE_TICK;
        player.eggScore = (player.eggScore || 0) + 1;
      }
      gs.eggOwnerId = player.id;
      gs.bombOwnerId = player.id;
    }
  });

  if (gs.mode === 'run') return;
  const itemFlag = gs.mode === 'egg' ? 'hasEgg' : 'hasBomb';
  const holder = gs.players.find(player => player[itemFlag] && player.alive);
  if (gs.roundOverTimer == null && !holder) {
    const alivePlayers = gs.players.filter(player => player.alive);
    if (alivePlayers.length > 0) {
      const next = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      next[itemFlag] = true;
      if (gs.mode === 'egg') {
        next.passCooldown = 0.6;
        gs.eggOwnerId = next.id;
      } else {
        next.bombTime = MAX_BOMB_TIME;
        gs.bombOwnerId = next.id;
      }
    }
  }
}

function collidePlayers() {
  const gs = state.gameState;
  if (gs.mode === 'run') {
    monsterHits();
    return;
  }
  const itemFlag = gs.mode === 'egg' ? 'hasEgg' : 'hasBomb';
  gs.players.forEach(player => {
    if (!player.alive || !player[itemFlag]) return;
    if (player.passCooldown > 0) return;
    gs.players.forEach(target => {
      if (target.id === player.id || !target.alive) return;
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      if (Math.hypot(dx, dy) < BOMB_PASS_DISTANCE) {
        if (gs.mode === 'egg') transferEgg(player, target);
        else transferBomb(player, target);
      }
    });
  });
}

function transferEgg(holder, target) {
  if (!holder.hasEgg || !target.alive) return;
  holder.hasEgg = false;
  holder.eggAcc = 0;
  target.hasEgg = true;
  target.passCooldown = 0.6;
  const gs = state.gameState;
  gs.eggOwnerId = target.id;
  gs.bombOwnerId = target.id;
  playPop();
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

function monsterHits() {
  const gs = state.gameState;
  const monster = gs.players.find(player => player.isMonster && player.alive);
  if (!monster) return;
  gs.players.forEach(target => {
    if (!target.alive || target.isMonster || target.hurtCooldown > 0) return;
    if (Math.hypot(target.x - monster.x, target.y - monster.y) >= BOMB_PASS_DISTANCE) return;
    target.lives -= 1;
    target.hurtCooldown = MONSTER_HIT_COOLDOWN;
    gs.hitCount = (gs.hitCount || 0) + 1;
    const angle = Math.atan2(target.y - monster.y, target.x - monster.x);
    target.vx += Math.cos(angle) * 420;
    target.vy = Math.min(target.vy, -240);
    if (target.lives <= 0) killRunner(target);
  });
}

function killRunner(target) {
  const gs = state.gameState;
  target.alive = false;
  target.lives = 0;
  target.hasBomb = false;
  target.hasEgg = false;
  gs.deathOrder.push(target.id);
  gs.explosionCount = (gs.explosionCount || 0) + 1;
  spawnExplosion(target);
  checkRunRoundEnd(false);
}

function checkRunRoundEnd(timeUp) {
  const gs = state.gameState;
  if (gs.roundOverTimer != null) return;
  const runnersAlive = gs.players.filter(player => player.alive && !player.isMonster);
  if (timeUp || runnersAlive.length === 0) finishRunRound(timeUp);
}

function finishRunRound(timeUp) {
  const gs = state.gameState;
  if (gs.roundOverTimer != null) return;
  const monster = gs.players.find(player => player.isMonster) || null;
  const survivors = gs.players
    .filter(player => player.alive && !player.isMonster)
    .sort((a, b) => b.lives - a.lives);
  const byId = new Map(gs.players.map(player => [player.id, player]));
  const deadReversed = gs.deathOrder.slice().reverse().map(id => byId.get(id)).filter(Boolean);
  const ranked = [];
  [...survivors, monster, ...deadReversed].forEach(player => {
    if (player && !ranked.includes(player)) ranked.push(player);
  });
  const top = ranked[0] || null;
  const firstDead = byId.get(gs.deathOrder[0]) || null;
  state.lastMonsterId = monster ? monster.id : null;
  const survivorNames = survivors.map(player => player.nickname).join(', ');
  gs.pendingResult = {
    title: timeUp ? 'Tempo esgotado!' : 'O monstro venceu!',
    text: timeUp
      ? `O tempo acabou!<br>Sobreviveram: <strong>${survivorNames || 'Ninguém'}</strong>`
      : `<strong>${monster ? monster.nickname : 'O monstro'}</strong> devorou todos os jogadores!`,
    winnerId: top ? top.id : null,
    winnerName: top ? top.nickname : 'Ninguém',
    loserId: firstDead ? firstDead.id : null,
    loserName: firstDead ? firstDead.nickname : null,
    ranking: ranked.map(player => player.id),
    deathOrder: [...gs.deathOrder]
  };
  gs.message = timeUp
    ? `Acabou o tempo! ${survivors.length > 0 ? survivorNames + ' sobreviveram!' : 'O monstro pegou todo mundo!'}`
    : `${monster ? monster.nickname : 'O monstro'} pegou todo mundo!`;
  gs.roundOverTimer = DEATH_ANIM_TIME;
}

function endRound(explodedPlayer) {
  const gs = state.gameState;
  explodedPlayer.alive = false;
  explodedPlayer.hasBomb = false;
  spawnExplosion(explodedPlayer);
  const loser = explodedPlayer.nickname;
  const winnerId = explodedPlayer.lastPasser;
  state.lastBombHolder = explodedPlayer.id;
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

function explodeLowestScore() {
  const gs = state.gameState;
  if (!gs || gs.roundOverTimer != null) return;
  const alive = gs.players.filter(player => player.alive);
  if (alive.length <= 1) {
    gs.bombTime = EGG_ROUND_TIME;
    return;
  }
  const minScore = Math.min(...alive.map(player => player.eggScore || 0));
  const tied = alive.filter(player => (player.eggScore || 0) === minScore);
  const victim = tied[Math.floor(Math.random() * tied.length)];
  victim.alive = false;
  victim.hasEgg = false;
  victim.hasBomb = false;
  gs.deathOrder.push(victim.id);
  gs.explosionCount = (gs.explosionCount || 0) + 1;
  spawnExplosion(victim);

  const remaining = gs.players.filter(player => player.alive);
  if (remaining.length <= 1) {
    const survivor = remaining[0] || null;
    state.lastBombHolder = victim.id;
    const firstDead = gs.players.find(player => player.id === gs.deathOrder[0]);
    gs.pendingResult = {
      title: 'Fim da rodada!',
      text: survivor
        ? `<strong>${survivor.nickname}</strong> ficou vivo por último!<br>Primeiro a explodir: <strong>${firstDead ? firstDead.nickname : 'Ninguém'}</strong>`
        : 'Todos explodiram!',
      winnerId: survivor ? survivor.id : null,
      winnerName: survivor ? survivor.nickname : 'Ninguém',
      loserId: firstDead ? firstDead.id : null,
      loserName: firstDead ? firstDead.nickname : null,
      deathOrder: [...gs.deathOrder]
    };
    gs.message = `${victim.nickname} explodiu! ${survivor ? survivor.nickname + ' venceu!' : ''}`.trim();
    gs.roundOverTimer = DEATH_ANIM_TIME;
    return;
  }

  const next = remaining[Math.floor(Math.random() * remaining.length)];
  next.hasEgg = true;
  next.passCooldown = 0.6;
  gs.eggOwnerId = next.id;
  gs.bombOwnerId = next.id;
  gs.bombTime = EGG_ROUND_TIME;
  gs.message = `${victim.nickname} explodiu! O ovo agora está com ${next.nickname}.`;
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
  let ranked;
  if (Array.isArray(result.ranking) && result.ranking.length > 0) {
    // Modo CORRA!: sobreviventes > monstro > mortos (ordem inversa de morte)
    const byId = new Map(players.map(player => [player.id, player]));
    ranked = result.ranking.map(id => byId.get(id)).filter(Boolean);
    players.forEach(player => {
      if (!ranked.includes(player)) ranked.push(player);
    });
  } else if (Array.isArray(result.deathOrder) && result.deathOrder.length > 0) {
    // Modo Pegue o Ovo: pontos pela ordem de morte (1º a morrer = 1pt, último vivo = n pts)
    const byId = new Map(players.map(player => [player.id, player]));
    ranked = [winner];
    result.deathOrder.slice().reverse().forEach(id => {
      const player = byId.get(id);
      if (player && !ranked.includes(player)) ranked.push(player);
    });
    players.forEach(player => {
      if (!ranked.includes(player)) ranked.push(player);
    });
  } else {
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
    ranked = [winner, ...rest];
  }
  const n = ranked.length;
  ranked.forEach((player, position) => {
    player.score = (player.score || 0) + (n - position);
  });
  saveRooms();
  result.scoreboard = ranked.map((player, position) => {
    const roomPlayer = room.players.find(p => p.id === player.id);
    return {
      id: player.id,
      nickname: player.nickname,
      color: player.color,
      score: player.score,
      place: position + 1,
      hat: player.hat || (roomPlayer ? roomPlayer.hat : 'none')
    };
  });
  const scoreLimit = roomSettings().scoreLimit || MAX_SCORE;
  const champion = ranked.find(player => player.score >= scoreLimit);
  if (champion) {
    result.maxScoreReached = true;
    result.champion = {
      id: champion.id,
      nickname: champion.nickname,
      color: champion.color,
      score: champion.score
    };
  }
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
