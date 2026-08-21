import { STORAGE_KEY, HOST_TIMEOUT, PUBLISH_INTERVAL, COUNTDOWN_SECONDS } from './constants.js';
import { state, getMyPlayer, isHost } from './state.js';
import * as storage from './storage.js';
import * as rooms from './rooms.js';
import * as input from './input.js';
import * as game from './game.js';
import { drawScene, loadBombImage, loadEggImage, setResolutionScale } from './render.js';
import * as audio from './audio.js';
import { spawnConfetti } from './effects.js';
import { loadAllCosmeticImages } from './cosmetics.js';
import { onCosmeticsSync } from './storage.js';
import { initMapEditor } from './mapEditor.js';
import {
  refs,
  initUi,
  showScreen,
  showNotice,
  renderLobby,
  updateHud,
  showResultMessage,
  showLobbyAlert,
  showGameAlert,
  updateGamepadStatus,
  formatControls,
  formatGamepadControls,
  showConfirm,
  closeSettingsPanel,
  startCountdown,
  stopCountdown,
  isCountdownActive,
  setStartButtonPressed,
  playerListItem,
  moveUiFocus,
  activateUiFocus,
  uiBack,
  showPadConnect,
  getPadConnectIndex,
  getSettingsPlayer,
  showResultsOverlay,
  hideResultsOverlay,
  setResultsOverlayBackCallback,
  pollCosmeticsPositionStick
} from './ui.js';

function showRoundResult(result) {
  state.endShown = true;
  if (result.maxScoreReached) {
    showResultsOverlay(result);
    audio.playSound('leaderboard');
  } else {
    showResultMessage(result);
  }
}

function playDeathSoundIfNew(st) {
  if (!st) return;
  if (st.mode === 'egg' || st.mode === 'run') {
    const count = st.explosionCount || 0;
    if (state.lastExplosionCount == null) {
      state.lastExplosionCount = count;
    } else if (count !== state.lastExplosionCount) {
      state.lastExplosionCount = count;
      audio.playSound('kill');
      if (st.roundOverTimer != null) state.deathSoundPlayed = true;
      return;
    }
  }
  if (st.mode === 'run') {
    const hits = st.hitCount || 0;
    if (state.lastRunHitCount == null) {
      state.lastRunHitCount = hits;
    } else if (hits !== state.lastRunHitCount) {
      state.lastRunHitCount = hits;
      audio.playSfxFile('sounds/kill/kill4.mp3');
      return;
    }
  }
  if (state.deathSoundPlayed) return;
  if (st && st.roundOverTimer != null && st.roundOverTimer > 0) {
    state.deathSoundPlayed = true;
    audio.playSound('kill');
  }
}

game.setOnRoundEnd(result => showRoundResult(result));

const SIM_STEP = 1 / 60;

function getFpsLimit() {
  const me = getMyPlayer();
  return me ? storage.getFpsLimit(me.id) : 0;
}

function applyResolution() {
  const me = getMyPlayer();
  const scale = me ? storage.getResolution(me.id) : 1;
  const canvas = document.getElementById('gameCanvas');
  canvas.width = Math.max(1, Math.round(1080 * scale));
  canvas.height = Math.max(1, Math.round(540 * scale));
  setResolutionScale(scale);
}

function startSimLoop() {
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  state.lastPublishTime = 0;
  state.accTime = 0;
  state.lastFrameTime = 0;
  if (state.gameState) state.gameState.lastTime = null;
  state.animationFrameId = requestAnimationFrame(gameLoop);
}

function startRenderLoop() {
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  state.lastSeenRev = -1;
  state.lastFrameTime = 0;
  state.animationFrameId = requestAnimationFrame(clientRenderLoop);
}

function stopSimLoop() {
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  state.animationFrameId = null;
}

function becomeSimulator() {
  const st = storage.readGameState();
  if (st && st.roundResult) {
    state.endShown = true;
    state.gameState = st;
    drawScene();
    updateHud();
    if (st.roundResult.maxScoreReached) {
      showResultsOverlay(st.roundResult);
      audio.playSound('leaderboard');
    } else {
      showResultMessage(st.roundResult);
    }
    return;
  }
  if (st && st.running) {
    state.gameState = st;
    state.accTime = 0;
    storage.publishGameState();
    audio.playGameMusic(st.map, st.mode);
    startSimLoop();
    return;
  }
  if (state.currentRoom && state.currentRoom.started && isHost() && (!st || !st.running)) {
    game.initGame();
    storage.publishGameState();
    audio.playGameMusic(state.gameState.map, state.gameState.mode);
    startSimLoop();
    return;
  }
  startRenderLoop();
}

function confirmModalOpen() {
  return !!(refs.confirmModal && !refs.confirmModal.classList.contains('hidden'));
}

function publishHeartbeat() {
  const now = Date.now();
  if (now - state.lastPublishTime >= PUBLISH_INTERVAL) {
    state.lastPublishTime = now;
    state.gameState.t = now;
    state.gameState.rev = (state.gameState.rev || 0) + 1;
    storage.publishGameState();
  }
}

function gameLoop(time) {
  if (!state.gameState || !state.gameState.running) return;

  const shared = storage.readGameState();
  playDeathSoundIfNew(shared);
  if (shared && shared.roundResult) {
    if (!state.endShown) {
      state.gameState = shared;
      drawScene();
      updateHud();
      showRoundResult(shared.roundResult);
    }
    return;
  }

  const limit = getFpsLimit();
  if (limit > 0 && state.lastFrameTime && time - state.lastFrameTime < 1000 / limit) {
    state.animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }
  state.lastFrameTime = time;

  if (confirmModalOpen()) {
    state.gameState.lastTime = time;
    publishHeartbeat();
    state.animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  const frameDt = Math.min(0.1, (time - (state.gameState.lastTime || time)) / 1000);
  state.gameState.lastTime = time;
  state.accTime = Math.min(0.25, (state.accTime || 0) + frameDt);
  while (state.accTime >= SIM_STEP) {
    game.stepGame(SIM_STEP);
    state.accTime -= SIM_STEP;
    if (!state.gameState.running) break;
  }

  publishHeartbeat();

  drawScene();
  updateHud();
  if (state.gameState.running) {
    state.animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function clientRenderLoop() {
  if (state.currentScreen !== 'game' || state.endShown) return;
  const limit = getFpsLimit();
  const nowPerf = performance.now();
  if (limit > 0 && state.lastFrameTime && nowPerf - state.lastFrameTime < 1000 / limit) {
    state.animationFrameId = requestAnimationFrame(clientRenderLoop);
    return;
  }
  state.lastFrameTime = nowPerf;

  const st = storage.readGameState();
  const now = Date.now();
  playDeathSoundIfNew(st);
  if (st && st.roundResult) {
    if (!state.endShown) {
      state.gameState = st;
      drawScene();
      updateHud();
      showRoundResult(st.roundResult);
    }
    return;
  }
  if (st && st.rev !== state.lastSeenRev) {
    state.lastSeenRev = st.rev;
    state.gameState = st;
    audio.playGameMusic(st.map, st.mode);
    drawScene();
    updateHud();
  }
  if (!st || now - st.t > HOST_TIMEOUT) {
    if (document.visibilityState === 'visible' && state.currentRoom && state.currentRoom.started) {
      becomeSimulator();
      return;
    }
    if (st && now - st.t > 8000) {
      state.endShown = true;
      if (state.currentRoom) {
        rooms.setStarted(false);
      }
      const memResult = state.gameState && state.gameState.roundResult;
      if (memResult) {
        showResultMessage(memResult);
        return;
      }
      showResultMessage({ title: 'Host desconectou', text: 'A partida foi interrompida. Volte ao lobby.' });
      return;
    }
  }
  state.animationFrameId = requestAnimationFrame(clientRenderLoop);
}

function showLobby() {
  storage.syncRooms();
  if (!state.currentRoom) {
    audio.playMenuMusic();
    showScreen('welcome');
    return;
  }
  renderLobby();
  if (state.currentRoom.started) {
    handleRoomStarted();
  } else {
    audio.playMenuMusic();
    showScreen('lobby');
  }
}

function enterGameScreen() {
  storage.syncRooms();
  if (!state.currentRoom) {
    showScreen('welcome');
    return;
  }
  stopGameWait();
  stopCountdown();
  state.endShown = false;
  state.deathSoundPlayed = false;
  state.lastExplosionCount = null;
  state.lastRunHitCount = null;
  state.lastSeenRev = -1;
  state.accTime = 0;
  state.lastFrameTime = 0;
  const me = getMyPlayer();
  refs.controlsInfo.textContent = formatControls(me?.id);
  if (refs.gamepadInfo) refs.gamepadInfo.textContent = formatGamepadControls();
  refs.messageBox.classList.add('hidden');
  refs.messageBox.classList.remove('explode');
  refs.messageBox.classList.remove('victory');
  closeSettingsPanel();
  applyResolution();
  audio.playGameMusic(state.gameState && state.gameState.map, state.gameState && state.gameState.mode);
  showScreen('game');
  input.publishLocalInputs();
  if (document.visibilityState === 'visible') {
    becomeSimulator();
  } else {
    startRenderLoop();
  }
}

function quitToLobby() {
  stopSimLoop();
  stopGameWait();
  stopCountdown();
  hideResultsOverlay();
  if (state.gameState && state.gameState.roundResult && state.gameState.roundResult.maxScoreReached) {
    if (state.currentRoom) {
      state.currentRoom.players.forEach(p => { p.score = 0; });
      storage.saveRooms();
    }
  }
  state.gameState = null;
  state.lastSeenRev = -1;
  state.endShown = false;
  if (state.currentRoom) {
    localStorage.removeItem(storage.gameKey(state.currentRoom.code));
    rooms.setStarted(false);
  }
  closeSettingsPanel();
  showLobby();
}

let gameWaitTimer = null;
let gameWaitActive = false;

function roomGameActive() {
  const st = storage.readGameState();
  return !!(st && (st.running || st.roundResult));
}

function startGameWait() {
  stopGameWait();
  gameWaitActive = true;
  let waited = 0;
  gameWaitTimer = setInterval(() => {
    if (!state.currentRoom || !state.currentRoom.started) {
      stopGameWait();
      return;
    }
    if (roomGameActive()) {
      stopGameWait();
      enterGameScreen();
      return;
    }
    waited += 200;
    if (waited > 10000) {
      stopGameWait();
      if (state.currentRoom && state.currentRoom.started) {
        rooms.setStarted(false);
      }
      stopCountdown();
      showLobbyAlert('O jogo não iniciou. Volte ao lobby.', 'leave');
      showLobby();
    }
  }, 200);
}

function stopGameWait() {
  gameWaitActive = false;
  if (gameWaitTimer) {
    clearInterval(gameWaitTimer);
    gameWaitTimer = null;
  }
}

function handleRoomStarted() {
  if (roomGameActive()) {
    enterGameScreen();
  } else if (!isCountdownActive() && !gameWaitActive) {
    setStartButtonPressed(true);
    startCountdown(COUNTDOWN_SECONDS, onCountdownDone);
  }
}

function onCountdownDone() {
  if (!state.currentRoom || !state.currentRoom.started) return;
  if (isHost()) {
    const st = storage.readGameState();
    if (!st || !st.running) {
      game.initGame();
      storage.publishGameState();
    }
    enterGameScreen();
  } else {
    startGameWait();
  }
}

function cancelCountdownStart() {
  if (!state.currentRoom) return;
  stopGameWait();
  stopCountdown();
  rooms.setStarted(false);
  renderLobby();
  audio.playSound('kill');
}

refs.countdownCancelBtn.addEventListener('click', () => {
  if (!isHost()) {
    showLobbyAlert('Apenas o host pode cancelar o início.', 'leave');
    return;
  }
  cancelCountdownStart();
  showLobbyAlert('Contagem Interrompida', 'leave');
});

refs.createRoomBtn.addEventListener('click', () => {
  try {
    const nickname = refs.nicknameInput.value.trim();
    const maxPlayers = Number(refs.maxPlayersInput.value);
    const error = rooms.createRoom(nickname, maxPlayers);
    if (error) {
      showNotice(refs.welcomeNotice, error);
      return;
    }
    spawnConfetti(30);
    showLobby();
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    showNotice(refs.welcomeNotice, 'Erro ao criar a sala: ' + error.message);
  }
});

refs.joinRoomBtn.addEventListener('click', () => {
  try {
    const nickname = refs.nicknameInput.value.trim();
    const code = refs.roomCodeInput.value.trim().toUpperCase();
    const error = rooms.joinRoom(nickname, code);
    if (error) {
      showNotice(refs.welcomeNotice, error);
      return;
    }
    spawnConfetti(30);
    showLobby();
  } catch (error) {
    console.error('Erro ao entrar na sala:', error);
    showNotice(refs.welcomeNotice, 'Erro ao entrar na sala: ' + error.message);
  }
});

refs.leaveRoomBtn.addEventListener('click', () => {
  showConfirm('Sair da sala?', () => {
    rooms.leaveRoom();
    audio.playMenuMusic();
    showScreen('welcome');
  });
});

refs.settingsQuitBtn.addEventListener('click', () => {
  showConfirm('Sair da sala?', () => {
    rooms.leaveRoom();
    audio.playMenuMusic();
    showScreen('welcome');
  });
});

refs.startGameBtn.addEventListener('click', () => {
  if (isCountdownActive()) {
    cancelCountdownStart();
    return;
  }
  const error = rooms.startGame(true);
  if (error) {
    showNotice(refs.lobbyNotice, error);
    return;
  }
  setStartButtonPressed(true);
  startCountdown(COUNTDOWN_SECONDS, onCountdownDone);
});

refs.returnLobbyBtn.addEventListener('click', quitToLobby);

if (refs.resultsLobbyBtn) {
  refs.resultsLobbyBtn.addEventListener('click', quitToLobby);
}
setResultsOverlayBackCallback(quitToLobby);

refs.gameQuitBtn.addEventListener('click', () => {
  showConfirm('Voltar para o lobby?', quitToLobby);
});

refs.playerColorInput.addEventListener('input', () => {
  const player = getSettingsPlayer();
  if (!state.currentRoom || !player) return;
  player.color = refs.playerColorInput.value;
  storage.saveRooms();
  refs.colorHexDisplay.textContent = player.color.toUpperCase();
  renderLobby();
});

refs.fpsToggle.addEventListener('change', () => {
  const checked = refs.fpsToggle.checked;
  const ids = state.localPlayerIds || [];
  for (const id of ids) storage.saveFpsEnabled(id, checked);
});

refs.fpsColorInput.addEventListener('input', () => {
  const player = getSettingsPlayer();
  if (!player) return;
  storage.saveFpsColor(player.id, refs.fpsColorInput.value);
  refs.fpsColorHexDisplay.textContent = refs.fpsColorInput.value.toUpperCase();
});

refs.roomCodeInput.addEventListener('input', () => {
  refs.roomCodeInput.value = refs.roomCodeInput.value.toUpperCase();
});

window.addEventListener('bombparty:resolutionchange', () => {
  if (state.currentScreen === 'game') applyResolution();
});

document.addEventListener('keydown', input.onKeyDown);
document.addEventListener('keyup', input.onKeyUp);

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || state.currentScreen !== 'game') return;
  if (confirmModalOpen()) {
    event.preventDefault();
    refs.confirmCancelBtn.click();
    return;
  }
  if (state.endShown) return;
  if (document.querySelector('.key-btn.recording')) return;
  if (document.querySelector('.modal:not(.hidden)')) return;
  refs.gameQuitBtn.click();
});

document.addEventListener('pointerdown', audio.unlockAudio, { once: true });
document.addEventListener('click', event => {
  if (event.target.closest('button')) audio.playClick();
}, true);

window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY) return;
  const previousSignature = rooms.roomSignature(state.currentRoom);
  const previousPlayers = state.currentRoom ? [...state.currentRoom.players] : null;
  storage.syncRooms();
  const newSignature = rooms.roomSignature(state.currentRoom);
  if (newSignature === previousSignature) return;

  let joined = [];
  if (state.currentRoom && previousPlayers && (state.currentScreen === 'lobby' || state.currentScreen === 'game')) {
    const previousIds = new Set(previousPlayers.map(p => p.id));
    const currentIds = new Set(state.currentRoom.players.map(p => p.id));
    joined = state.currentRoom.players.filter(p => !previousIds.has(p.id));
    const left = previousPlayers.filter(p => !currentIds.has(p.id));
    if (joined.length && state.currentScreen === 'lobby') audio.playPop();
    left.forEach(p => {
      if (state.currentScreen === 'game') {
        showGameAlert(`${p.nickname} saiu`, 'leave');
      } else {
        showLobbyAlert(`${p.nickname} saiu`, 'leave');
      }
      audio.playSound('kill');
    });
    const previousMe = previousPlayers.find(p => p.id === state.myPlayerId);
    const currentMe = getMyPlayer();
    if (state.currentScreen === 'lobby' && currentMe && currentMe.host && (!previousMe || !previousMe.host)) {
      showLobbyAlert('Você agora é o HOST!', 'host');
      audio.playSound('leaderboard');
    }
  }

  if (!state.currentRoom) {
    state.myRoomCode = null;
    state.myPlayerId = null;
    audio.playMenuMusic();
    showScreen('welcome');
    return;
  }
  if (state.currentScreen === 'game') {
    if (state.currentRoom.started) {
      const st = storage.readGameState();
      if (st && st.running) {
        if (!state.gameState || !state.gameState.running) enterGameScreen();
      } else {
        stopSimLoop();
        stopGameWait();
        stopCountdown();
        state.gameState = null;
        state.lastSeenRev = -1;
        state.endShown = false;
        audio.playMenuMusic();
        showScreen('lobby');
        renderLobby();
        handleRoomStarted();
      }
    } else {
      if (state.endShown) return;
      const st = storage.readGameState();
      if (st && st.roundResult) return;
      stopSimLoop();
      stopGameWait();
      stopCountdown();
      state.gameState = null;
      state.lastSeenRev = -1;
      state.endShown = false;
      audio.playMenuMusic();
      showScreen('lobby');
      renderLobby();
    }
  } else if (state.currentScreen === 'lobby') {
    if (state.currentRoom.started) {
      handleRoomStarted();
    } else if (isCountdownActive()) {
      stopCountdown();
      stopGameWait();
      setStartButtonPressed(false);
      showLobbyAlert('Contagem Interrompida', 'leave');
      audio.playSound('kill');
    }
    renderLobby();
      joined.forEach(player => {
        const li = playerListItem(player.id);
        if (li) spawnConfetti(30);
      });
  }
});

window.addEventListener('beforeunload', () => {
  rooms.heartbeat();
});

setInterval(rooms.heartbeat, 2000);
setInterval(() => {
  const previousHost = isHost();
  const previousMeId = state.myPlayerId;
  const result = rooms.cleanupStalePlayers();
  if (result.dropped) {
    showScreen('welcome');
    return;
  }
  if (state.currentScreen === 'game') {
    result.removedPlayers.forEach(p => {
      showGameAlert(`${p.nickname} saiu`, 'leave');
      audio.playSound('kill');
    });
  }
  if (state.currentScreen !== 'lobby') return;
  result.removedPlayers.forEach(p => {
    showLobbyAlert(`${p.nickname} saiu`, 'leave');
    audio.playSound('kill');
  });
  if (isHost() && !previousHost && state.myPlayerId === previousMeId) {
    showLobbyAlert('Você agora é o HOST!', 'host');
    audio.playSound('leaderboard');
  }
  if (result.removedPlayers.length > 0) renderLobby();
}, 2000);
setInterval(input.publishLocalInputs, 250);
setInterval(() => {
  if (state.currentScreen === 'game') input.publishLocalInputs();
}, 33);

const uiPadState = new Map();
let lastPadPressed = new Map();
const UI_MOVE_REPEAT_DELAY = 240;

function applyUiMove(dir, playerId, isAnalog) {
  if (dir === 'up') moveUiFocus(0, -1, playerId, isAnalog);
  else if (dir === 'down') moveUiFocus(0, 1, playerId, isAnalog);
  else if (dir === 'left') moveUiFocus(-1, 0, playerId, isAnalog);
  else if (dir === 'right') moveUiFocus(1, 0, playerId, isAnalog);
}

function padPressedAny(pad) {
  return (pad.buttons || []).some(btn => btn && btn.pressed);
}

function getUiPads() {
  const result = [];
  const pads = input.connectedGamepads();
  const localIds = state.localPlayerIds || [];
  const handled = new Set();
  state.uiPadPlayerId = null;
  if (!state.currentRoom && !state.myPlayerId) {
    pads.forEach(pad => result.push({ pad, playerId: null }));
    return result;
  }
  for (const id of localIds) {
    const player = state.currentRoom && state.currentRoom.players.find(p => p.id === id);
    if (!player) continue;
    const assigned = storage.getGamepadAssignment(id);
    if (assigned < 0) continue;
    const pad = pads.find(p => p.index === assigned);
    if (!pad || handled.has(pad.index)) continue;
    handled.add(pad.index);
    result.push({ pad, playerId: id });
    state.uiPadPlayerId = id;
  }
  const room = state.currentRoom;
  if (room && room.mode === 'local' && getPadConnectIndex() >= 0) {
    const pad = pads.find(p => p.index === getPadConnectIndex());
    if (pad && !handled.has(pad.index)) {
      handled.add(pad.index);
      result.push({ pad, playerId: null });
    }
  }
  return result;
}

function checkLocalPadConnect() {
  const room = state.currentRoom;
  if (!room || room.mode !== 'local') return;
  if (state.currentScreen !== 'lobby') return;
  if (getPadConnectIndex() >= 0) return;
  const pads = input.connectedGamepads();
  for (const pad of pads) {
    const pressed = padPressedAny(pad);
    const prev = lastPadPressed.get(pad.index) || false;
    lastPadPressed.set(pad.index, pressed);
    if (!pressed || prev) continue;
    const assignedTo = room.players.find(player => storage.getGamepadAssignment(player.id) === pad.index);
    if (assignedTo) continue;
    showPadConnect(pad.index);
    return;
  }
}

function padUiState(pad) {
  let st = uiPadState.get(pad.index);
  if (!st) {
    st = {
      prev: { up: false, down: false, left: false, right: false, a: false, b: false },
      pending: { up: false, down: false, left: false, right: false, a: false, b: false },
      options: false,
      dir: null,
      accum: 0
    };
    uiPadState.set(pad.index, st);
  }
  return st;
}

function clearUiPadState() {
  uiPadState.clear();
}

function pollUiGamepad() {
  checkLocalPadConnect();
  const inGame = state.currentScreen === 'game';
  const blockingModalOpen = !!document.querySelector('.modal:not(.hidden):not(#selectPopupOverlay):not(#colorPalettePopup)');
  const uiPads = getUiPads();

  if (inGame && !blockingModalOpen && !state.endShown) {
    for (const { pad } of uiPads) {
      const st = padUiState(pad);
      const optionsPressed = !!(pad.buttons[9] && pad.buttons[9].pressed);
      if (optionsPressed && !st.options) refs.gameQuitBtn.click();
      st.options = optionsPressed;
    }
    return;
  }

  if (uiPads.length === 0) {
    clearUiPadState();
    return;
  }

  let navPads = uiPads;
  const hostConfigOpen = refs.hostConfigPanel && !refs.hostConfigPanel.classList.contains('hidden');
  if (hostConfigOpen) {
    const room = state.currentRoom;
    const hostPlayer = room ? room.players.find(p => p.host) : null;
    navPads = hostPlayer ? uiPads.filter(entry => entry.playerId === hostPlayer.id) : [];
  }

  for (const { pad, playerId } of navPads) {
    const st = padUiState(pad);
    const axis0 = pad.axes[0] || 0;
    const axis1 = pad.axes[1] || 0;
    const now = {
      up: !!(pad.buttons[12] && pad.buttons[12].pressed) || axis1 < -0.5,
      down: !!(pad.buttons[13] && pad.buttons[13].pressed) || axis1 > 0.5,
      left: !!(pad.buttons[14] && pad.buttons[14].pressed) || axis0 < -0.5,
      right: !!(pad.buttons[15] && pad.buttons[15].pressed) || axis0 > 0.5,
      a: !!(pad.buttons[0] && pad.buttons[0].pressed),
      b: !!(pad.buttons[1] && pad.buttons[1].pressed)
    };
    const prev = st.prev;
    st.prev = now;
    const optionsPressed = !!(pad.buttons[9] && pad.buttons[9].pressed);
    const edge = (cur, p) => cur && !p;
    st.pending.a = st.pending.a || edge(now.a, prev.a);
    st.pending.b = st.pending.b || edge(now.b, prev.b);
    if (st.pending.a) {
      st.pending.a = false;
      if (isCountdownActive() && isHost()) {
        refs.countdownCancelBtn.click();
        continue;
      }
      activateUiFocus(playerId);
    }
    if (st.pending.b) { st.pending.b = false; uiBack(playerId); }
    if (optionsPressed && !st.options) {
      if (blockingModalOpen) {
        uiBack(playerId);
      } else if (inGame && state.endShown) {
        uiBack(playerId);
      }
    }
    st.options = optionsPressed;

    const axis2 = pad.axes[2] || 0;
    const axis3 = pad.axes[3] || 0;
    pollCosmeticsPositionStick(axis2, axis3);

    const heldDir = now.up ? 'up' : now.down ? 'down' : now.left ? 'left' : now.right ? 'right' : null;
    const dpadBtn = !!(pad.buttons[12] && pad.buttons[12].pressed) ||
      !!(pad.buttons[13] && pad.buttons[13].pressed) ||
      !!(pad.buttons[14] && pad.buttons[14].pressed) ||
      !!(pad.buttons[15] && pad.buttons[15].pressed);
    const stickMoved = Math.abs(axis0) > 0.5 || Math.abs(axis1) > 0.5;
    const useAnalog = stickMoved && !dpadBtn;
    if (heldDir) {
      if (heldDir !== st.dir) {
        st.dir = heldDir;
        st.accum = 0;
        applyUiMove(heldDir, playerId, useAnalog);
      } else {
        st.accum += 50;
        if (st.accum >= UI_MOVE_REPEAT_DELAY) {
          st.accum = 0;
          applyUiMove(heldDir, playerId, useAnalog);
        }
      }
    } else {
      st.dir = null;
      st.accum = 0;
    }
  }
}

setInterval(pollUiGamepad, 50);
setInterval(updateGamepadStatus, 1500);

document.addEventListener('visibilitychange', () => {
  if (state.currentScreen !== 'game' || state.endShown) return;
  if (document.visibilityState === 'visible') {
    becomeSimulator();
  } else {
    stopSimLoop();
  }
});

function prefillRoomCodeFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('room') || '').trim().toUpperCase();
    if (code) refs.roomCodeInput.value = code;
  } catch (error) {}
}

function initPage() {
  prefillRoomCodeFromUrl();
  storage.syncRooms();
  if (state.currentRoom && state.myPlayerId) {
    if (state.currentRoom.started) {
      handleRoomStarted();
      return;
    }
    showLobby();
    return;
  }
  audio.playMenuMusic();
  showScreen('welcome');
}

loadBombImage();
loadEggImage();
loadAllCosmeticImages();
onCosmeticsSync(() => loadAllCosmeticImages());
initUi();
initMapEditor();
initPage();
