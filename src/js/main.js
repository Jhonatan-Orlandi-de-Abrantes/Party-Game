import { STORAGE_KEY, HOST_TIMEOUT, PUBLISH_INTERVAL, COUNTDOWN_SECONDS } from './constants.js';
import { state, getMyPlayer, isHost } from './state.js';
import * as storage from './storage.js';
import * as rooms from './rooms.js';
import * as input from './input.js';
import * as game from './game.js';
import { drawScene, loadBombImage, setResolutionScale } from './render.js';
import * as audio from './audio.js';
import { spawnConfetti } from './effects.js';
import {
  refs,
  initUi,
  showScreen,
  showNotice,
  renderLobby,
  updateHud,
  showResultMessage,
  showToast,
  showLobbyAlert,
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
  uiBack
} from './ui.js';

game.setOnRoundEnd(result => {
  state.endShown = true;
  showResultMessage(result);
});
game.setOnToast(showToast);

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
    showResultMessage(st.roundResult);
    return;
  }
  if (st && st.running) {
    state.gameState = st;
    state.accTime = 0;
    storage.publishGameState();
    startSimLoop();
    return;
  }
  if (state.currentRoom && state.currentRoom.started && isHost() && (!st || !st.running)) {
    game.initGame();
    storage.publishGameState();
    startSimLoop();
    return;
  }
  startRenderLoop();
}

function gameLoop(time) {
  if (!state.gameState || !state.gameState.running) return;

  const shared = storage.readGameState();
  if (shared && shared.roundResult) {
    if (!state.endShown) {
      state.endShown = true;
      state.gameState = shared;
      drawScene();
      updateHud();
      showResultMessage(shared.roundResult);
    }
    return;
  }

  const limit = getFpsLimit();
  if (limit > 0 && state.lastFrameTime && time - state.lastFrameTime < 1000 / limit) {
    state.animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }
  state.lastFrameTime = time;

  const frameDt = Math.min(0.1, (time - (state.gameState.lastTime || time)) / 1000);
  state.gameState.lastTime = time;
  state.accTime = Math.min(0.25, (state.accTime || 0) + frameDt);
  while (state.accTime >= SIM_STEP) {
    game.stepGame(SIM_STEP);
    state.accTime -= SIM_STEP;
    if (!state.gameState.running) break;
  }

  const now = Date.now();
  if (now - state.lastPublishTime >= PUBLISH_INTERVAL) {
    state.lastPublishTime = now;
    state.gameState.t = now;
    state.gameState.rev = (state.gameState.rev || 0) + 1;
    storage.publishGameState();
  }

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
  if (st && st.roundResult) {
    state.endShown = true;
    state.gameState = st;
    drawScene();
    updateHud();
    showResultMessage(st.roundResult);
    return;
  }
  if (st && st.rev !== state.lastSeenRev) {
    state.lastSeenRev = st.rev;
    state.gameState = st;
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
  state.lastSeenRev = -1;
  state.accTime = 0;
  state.lastFrameTime = 0;
  const me = getMyPlayer();
  refs.controlsInfo.textContent = formatControls(me?.id);
  if (refs.gamepadInfo) refs.gamepadInfo.textContent = formatGamepadControls();
  refs.messageBox.classList.add('hidden');
  refs.messageBox.classList.remove('explode');
  refs.messageBox.classList.remove('victory');
  applyResolution();
  audio.playGameMusic();
  showScreen('game');
  input.publishMyInput();
  if (document.visibilityState === 'visible') {
    becomeSimulator();
  } else {
    startRenderLoop();
  }
}

function quitToLobby() {
  stopSimLoop();
  state.gameState = null;
  state.lastSeenRev = -1;
  state.endShown = false;
  if (state.currentRoom) {
    localStorage.removeItem(storage.gameKey(state.currentRoom.code));
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

refs.createRoomBtn.addEventListener('click', () => {
  const nickname = refs.nicknameInput.value.trim();
  const maxPlayers = Number(refs.maxPlayersInput.value);
  const mode = refs.gameModeSelect.value;
  const error = rooms.createRoom(nickname, maxPlayers, mode);
  if (error) {
    showNotice(refs.welcomeNotice, error);
    return;
  }
  spawnConfetti(30);
  showLobby();
});

refs.joinRoomBtn.addEventListener('click', () => {
  const nickname = refs.nicknameInput.value.trim();
  const code = refs.roomCodeInput.value.trim().toUpperCase();
  const error = rooms.joinRoom(nickname, code);
  if (error) {
    showNotice(refs.welcomeNotice, error);
    return;
  }
  spawnConfetti(30);
  showLobby();
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

refs.gameQuitBtn.addEventListener('click', () => {
  showConfirm('Voltar para o lobby?', quitToLobby);
});

refs.playerColorInput.addEventListener('input', () => {
  const player = getMyPlayer();
  if (!state.currentRoom || !player) return;
  player.color = refs.playerColorInput.value;
  storage.saveRooms();
  refs.colorHexDisplay.textContent = player.color.toUpperCase();
  renderLobby();
});

refs.autoPassCheckbox.addEventListener('change', () => {
  if (!state.myPlayerId) return;
  storage.saveAutoPass(state.myPlayerId, refs.autoPassCheckbox.checked);
});

refs.fpsToggle.addEventListener('change', () => {
  if (!state.myPlayerId) return;
  storage.saveFpsEnabled(state.myPlayerId, refs.fpsToggle.checked);
});

refs.fpsColorInput.addEventListener('input', () => {
  if (!state.myPlayerId) return;
  storage.saveFpsColor(state.myPlayerId, refs.fpsColorInput.value);
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
  if (state.currentRoom && previousPlayers && state.currentScreen === 'lobby') {
    const previousIds = new Set(previousPlayers.map(p => p.id));
    const currentIds = new Set(state.currentRoom.players.map(p => p.id));
    joined = state.currentRoom.players.filter(p => !previousIds.has(p.id));
    const left = previousPlayers.filter(p => !currentIds.has(p.id));
    if (joined.length) audio.playPop();
    left.forEach(p => {
      showLobbyAlert(`${p.nickname} saiu`, 'leave');
      audio.playSound('kill');
    });
    const previousMe = previousPlayers.find(p => p.id === state.myPlayerId);
    const currentMe = getMyPlayer();
    if (currentMe && currentMe.host && (!previousMe || !previousMe.host)) {
      showLobbyAlert('VocǦ agora Ǹ o HOST!', 'host');
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
      if (!state.gameState || !state.gameState.running) enterGameScreen();
    }
  } else if (state.currentScreen === 'lobby') {
    if (state.currentRoom.started) {
      handleRoomStarted();
    } else if (isCountdownActive()) {
      stopCountdown();
      stopGameWait();
      setStartButtonPressed(false);
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
setInterval(input.publishMyInput, 250);
setInterval(() => {
  if (state.currentScreen === 'game') input.publishMyInput();
}, 33);

let lastUiPad = null;

function pollUiGamepad() {
  if (state.currentScreen === 'game') {
    lastUiPad = null;
    return;
  }
  const pad = input.connectedGamepads()[0];
  if (!pad) {
    lastUiPad = null;
    return;
  }
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
  const prev = lastUiPad || { up: false, down: false, left: false, right: false, a: false, b: false };
  lastUiPad = now;
  const edge = (cur, p) => cur && !p;
  if (edge(now.up, prev.up)) moveUiFocus(0, -1);
  else if (edge(now.down, prev.down)) moveUiFocus(0, 1);
  else if (edge(now.left, prev.left)) moveUiFocus(-1, 0);
  else if (edge(now.right, prev.right)) moveUiFocus(1, 0);
  if (edge(now.a, prev.a)) activateUiFocus();
  if (edge(now.b, prev.b)) uiBack();
}

setInterval(pollUiGamepad, 100);
setInterval(updateGamepadStatus, 1500);

document.addEventListener('visibilitychange', () => {
  if (state.currentScreen !== 'game' || state.endShown) return;
  if (document.visibilityState === 'visible') {
    becomeSimulator();
  } else {
    stopSimLoop();
  }
});

function initPage() {
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
initUi();
initPage();
