import { ROOM_STATUS, GAME_MODE_NAME } from './constants.js';
import { state, getMyPlayer, isHost } from './state.js';
import {
  getAutoPass,
  getGamepadAssignment,
  saveGamepadAssignment,
  getFpsEnabled,
  getFpsColor,
  saveFpsEnabled,
  saveFpsColor,
  getFpsLimit,
  saveFpsLimit,
  getResolution,
  saveResolution,
  getCustomKeys,
  saveCustomKeys,
  resetCustomKeys,
  saveHat,
  getDeviceId,
  getMusicVolume,
  getSfxVolume,
  setMusicVolume as persistMusicVolume,
  setSfxVolume as persistSfxVolume,
  saveRooms
} from './storage.js';
import { connectedGamepads, getEffectiveControls, gamepadName } from './input.js';
import { spawnConfetti } from './effects.js';
import { playSound, playClick, setMusicVolume as applyMusicVolume, setSfxVolume as applySfxVolume } from './audio.js';
import { HATS, getHatById, drawHatPreview } from './hats.js';

const $ = (id) => document.getElementById(id);

export const refs = {
  nicknameInput: $('nicknameInput'),
  roomCodeInput: $('roomCodeInput'),
  maxPlayersInput: $('maxPlayersInput'),
  gameModeSelect: $('gameModeSelect'),
  createRoomBtn: $('createRoomBtn'),
  joinRoomBtn: $('joinRoomBtn'),
  welcomeNotice: $('welcomeNotice'),
  screenWelcome: $('screen-welcome'),
  screenLobby: $('screen-lobby'),
  screenGame: $('screen-game'),
  roomCodeDisplay: $('roomCodeDisplay'),
  roomStatusDisplay: $('roomStatusDisplay'),
  roomModeDisplay: $('roomModeDisplay'),
  maxPlayersDisplay: $('maxPlayersDisplay'),
  yourRoleDisplay: $('yourRoleDisplay'),
  playerList: $('playerList'),
  startGameBtn: $('startGameBtn'),
  leaveRoomBtn: $('leaveRoomBtn'),
  lobbyNotice: $('lobbyNotice'),
  hostHint: $('hostHint'),
  lobbyAlerts: $('lobbyAlerts'),
  gamepadStatus: $('gamepadStatus'),
  controlsInfo: $('controlsInfo'),
  messageBox: $('messageBox'),
  messageTitle: $('messageTitle'),
  messageText: $('messageText'),
  returnLobbyBtn: $('returnLobbyBtn'),
  toastBox: $('toastBox'),
  gameModeEl: $('gameMode'),
  settingsGearBtn: $('settingsGearBtn'),
  settingsPanel: $('settingsPanel'),
  settingsCloseBtn: $('settingsCloseBtn'),
  settingsQuitBtn: $('settingsQuitBtn'),
  playerColorInput: $('playerColorInput'),
  colorHexDisplay: $('colorHexDisplay'),
  hatBtn: $('hatBtn'),
  autoPassCheckbox: $('autoPassCheckbox'),
  fpsToggle: $('fpsToggle'),
  fpsColorInput: $('fpsColorInput'),
  fpsColorHexDisplay: $('fpsColorHexDisplay'),
  fpsLimitInput: $('fpsLimitInput'),
  fpsLimitValue: $('fpsLimitValue'),
  resolutionInput: $('resolutionInput'),
  resolutionValue: $('resolutionValue'),
  musicVolumeInput: $('musicVolumeInput'),
  musicVolumeValue: $('musicVolumeValue'),
  sfxVolumeInput: $('sfxVolumeInput'),
  sfxVolumeValue: $('sfxVolumeValue'),
  resetKeysBtn: $('resetKeysBtn'),
  hatPopup: $('hatPopup'),
  hatGrid: $('hatGrid'),
  hatCloseBtn: $('hatCloseBtn'),
  confirmModal: $('confirmModal'),
  confirmText: $('confirmText'),
  confirmOkBtn: $('confirmOkBtn'),
  confirmCancelBtn: $('confirmCancelBtn'),
  gameQuitBtn: $('gameQuitBtn'),
  countdownOverlay: $('countdownOverlay'),
  countdownNumber: $('countdownNumber'),
  gamepadInfo: $('gamepadInfo')
};

let toastTimer = null;
let confirmCallback = null;
let rebindingAction = null;
let countdownTimer = null;
let countdownActive = false;
let uiFocusIndex = -1;
let renderedPlayerIds = new Set();

const FOCUS_SELECTOR = 'input:not([type="hidden"]), select, button, .hat-option';

export function initUi() {
  refs.gameModeEl.textContent = GAME_MODE_NAME;

  refs.settingsGearBtn.addEventListener('click', () => {
    toggleSettingsPanel();
    playClick();
  });
  refs.settingsCloseBtn.addEventListener('click', () => {
    closeSettingsPanel();
    playClick();
  });

  refs.hatBtn.addEventListener('click', () => {
    openHatPicker();
    playClick();
  });
  refs.hatCloseBtn.addEventListener('click', closeHatPicker);
  refs.hatPopup.addEventListener('click', event => {
    if (event.target === refs.hatPopup) closeHatPicker();
  });

  refs.confirmOkBtn.addEventListener('click', () => {
    const callback = confirmCallback;
    hideConfirm();
    if (callback) callback();
  });
  refs.confirmCancelBtn.addEventListener('click', () => {
    hideConfirm();
    playClick();
  });

  refs.fpsLimitInput.addEventListener('input', () => {
    const value = Number(refs.fpsLimitInput.value);
    if (state.myPlayerId) saveFpsLimit(state.myPlayerId, value);
    refs.fpsLimitValue.textContent = value === 0 ? 'Sem limite' : String(value);
  });

  refs.resolutionInput.addEventListener('input', () => {
    const value = Number(refs.resolutionInput.value);
    if (state.myPlayerId) saveResolution(state.myPlayerId, value / 100);
    refs.resolutionValue.textContent = `${value}%`;
    window.dispatchEvent(new Event('bombparty:resolutionchange'));
  });

  refs.musicVolumeInput.addEventListener('input', () => {
    const value = Number(refs.musicVolumeInput.value);
    refs.musicVolumeValue.textContent = String(value);
    persistMusicVolume(value);
    applyMusicVolume(value);
  });

  refs.sfxVolumeInput.addEventListener('input', () => {
    const value = Number(refs.sfxVolumeInput.value);
    refs.sfxVolumeValue.textContent = String(value);
    persistSfxVolume(value);
    applySfxVolume(value);
  });

  refs.resetKeysBtn.addEventListener('click', () => {
    if (state.myPlayerId) resetCustomKeys(state.myPlayerId);
    renderLobby();
  });

  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.myPlayerId) return;
      rebindingAction = btn.dataset.action;
      btn.classList.add('recording');
      btn.querySelector('span').textContent = '...';
      playClick();
    });
  });

  document.addEventListener('keydown', event => {
    if (!rebindingAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === 'Escape') {
      cancelRebind();
      return;
    }
    const custom = getCustomKeys(state.myPlayerId) || {};
    custom[rebindingAction] = event.key.toLowerCase();
    saveCustomKeys(state.myPlayerId, custom);
    cancelRebind();
    renderLobby();
  });
}

export function toggleSettingsPanel() {
  const open = refs.settingsPanel.classList.toggle('open');
  refs.settingsGearBtn.classList.toggle('open', open);
  return open;
}

export function closeSettingsPanel() {
  refs.settingsPanel.classList.remove('open');
  refs.settingsGearBtn.classList.remove('open');
}

function cancelRebind() {
  rebindingAction = null;
  document.querySelectorAll('.key-btn.recording').forEach(btn => {
    btn.classList.remove('recording');
  });
}

export function openHatPicker() {
  const me = getMyPlayer();
  if (!me) return;
  refs.hatGrid.innerHTML = '';
  HATS.forEach(hat => {
    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'hat-option' + (me.hat === hat.id ? ' selected' : '');
    box.title = hat.name;
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    drawHatPreview(canvas.getContext('2d'), hat.id);
    const label = document.createElement('span');
    label.textContent = hat.name;
    box.appendChild(canvas);
    box.appendChild(label);
    box.addEventListener('click', () => {
      const currentMe = getMyPlayer();
      if (currentMe) currentMe.hat = hat.id;
      saveHat(getDeviceId(), hat.id);
      saveRooms();
      renderLobby();
      openHatPicker();
    });
    refs.hatGrid.appendChild(box);
  });
  refs.hatPopup.classList.remove('hidden');
}

export function closeHatPicker() {
  refs.hatPopup.classList.add('hidden');
}

export function isCountdownActive() {
  return countdownActive;
}

export function startCountdown(durationSeconds, onDone) {
  stopCountdown();
  countdownActive = true;
  refs.countdownOverlay.classList.remove('hidden');
  let remaining = durationSeconds;
  const tick = () => {
    refs.countdownNumber.textContent = String(remaining);
    refs.countdownNumber.style.animation = 'none';
    void refs.countdownNumber.offsetWidth;
    refs.countdownNumber.style.animation = '';
    playSound(remaining === 1 ? 'start-menu' : 'start-countdown');
  };
  tick();
  countdownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      stopCountdown();
      if (onDone) onDone();
      return;
    }
    tick();
  }, 1000);
}

export function stopCountdown() {
  countdownActive = false;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  refs.countdownOverlay.classList.add('hidden');
}

export function getFocusables() {
  const modal = document.querySelector('.modal:not(.hidden)');
  const popup = document.querySelector('.hat-popup:not(.hidden)');
  const settings = document.querySelector('.settings-panel.open');
  const screen = document.querySelector('.screen:not(.hidden)');
  const scope = modal || popup || settings || screen;
  if (!scope) return [];
  return Array.from(scope.querySelectorAll(FOCUS_SELECTOR)).filter(el => !el.disabled && el.offsetParent !== null);
}

function setUiFocusIndex(index) {
  const list = getFocusables();
  if (list.length === 0) {
    uiFocusIndex = -1;
    return;
  }
  uiFocusIndex = ((index % list.length) + list.length) % list.length;
  list.forEach(el => el.classList.remove('ui-focus'));
  const target = list[uiFocusIndex];
  target.classList.add('ui-focus');
  if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'nearest' });
}

export function moveUiFocus(dx, dy) {
  const list = getFocusables();
  if (list.length === 0) return;
  if (uiFocusIndex < 0) {
    setUiFocusIndex(0);
    return;
  }
  const target = list[uiFocusIndex];
  if (target.tagName === 'SELECT' && dx !== 0) {
    const next = target.selectedIndex + dx;
    if (next >= 0 && next < target.options.length) {
      target.selectedIndex = next;
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return;
  }
  if (target.type === 'range' && dx !== 0) {
    const step = Number(target.step) || 1;
    const min = Number(target.min);
    const max = Number(target.max);
    const next = Math.min(max, Math.max(min, Number(target.value) + dx * step));
    target.value = String(next);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  const dir = dy !== 0 ? dy : dx;
  setUiFocusIndex(uiFocusIndex + dir);
}

export function activateUiFocus() {
  const list = getFocusables();
  if (list.length === 0) return;
  const index = uiFocusIndex < 0 ? 0 : uiFocusIndex;
  const el = list[index];
  if (!el) return;
  if (el.tagName === 'BUTTON' || el.type === 'color') {
    el.click();
  } else {
    el.focus();
  }
}

export function uiBack() {
  const modal = document.querySelector('.modal:not(.hidden)');
  if (modal) {
    refs.confirmCancelBtn.click();
    return;
  }
  const popup = document.querySelector('.hat-popup:not(.hidden)');
  if (popup) {
    closeHatPicker();
    return;
  }
  const settings = document.querySelector('.settings-panel.open');
  if (settings) {
    closeSettingsPanel();
    return;
  }
  if (document.activeElement && document.activeElement.tagName === 'INPUT') {
    document.activeElement.blur();
    setUiFocusIndex(0);
    return;
  }
  setUiFocusIndex(0);
}

export function setStartButtonPressed(pressed) {
  const isH = isHost();
  refs.startGameBtn.classList.toggle('pressed', pressed && isH);
  refs.startGameBtn.textContent = pressed && isH ? 'Cancelar' : 'Iniciar partida';
}

export function playerListItem(playerId) {
  return refs.playerList.querySelector('li[data-player-id="' + playerId + '"]');
}

export function showConfirm(text, onConfirm) {
  refs.confirmText.textContent = text;
  confirmCallback = onConfirm;
  refs.confirmModal.classList.remove('hidden');
}

export function hideConfirm() {
  confirmCallback = null;
  refs.confirmModal.classList.add('hidden');
}

export function showScreen(name) {
  state.currentScreen = name;
  refs.screenWelcome.classList.toggle('hidden', name !== 'welcome');
  refs.screenLobby.classList.toggle('hidden', name !== 'lobby');
  refs.screenGame.classList.toggle('hidden', name !== 'game');
  if (name !== 'lobby') closeSettingsPanel();
}

export function showNotice(element, message) {
  element.textContent = message;
  if (message) {
    setTimeout(() => {
      if (element.textContent === message) element.textContent = '';
    }, 4500);
  }
}

export function showLobbyAlert(text, type) {
  const alert = document.createElement('div');
  alert.className = `lobby-alert ${type || ''}`;
  alert.textContent = text;
  refs.lobbyAlerts.appendChild(alert);
  setTimeout(() => alert.remove(), 4500);
}

export function updateGamepadStatus() {
  if (state.currentScreen !== 'lobby') return;
  const pads = connectedGamepads();
  refs.gamepadStatus.textContent = pads.length > 0
    ? `Controles conectados: ${pads.length} (${pads.map(gamepadName).join(', ')})`
    : 'Nenhum controle conectado. Use o teclado ou conecte um gamepad.';
}

function getKeyLabel(playerId, action) {
  const ctrl = getEffectiveControls(playerId);
  if (!ctrl || !ctrl[action]) return '?';
  const key = ctrl[action];
  const label = key === ' ' ? 'Espaço' : key;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function renderSettings() {
  const room = state.currentRoom;
  const player = getMyPlayer();
  if (!room || !player) return;
  refs.playerColorInput.value = player.color;
  refs.colorHexDisplay.textContent = player.color.toUpperCase();
  refs.hatBtn.textContent = `Escolher chapéu · ${getHatById(player.hat).name}`;
  refs.autoPassCheckbox.checked = getAutoPass(player.id);
  refs.fpsToggle.checked = getFpsEnabled(player.id);
  refs.fpsColorInput.value = getFpsColor(player.id);
  refs.fpsColorHexDisplay.textContent = getFpsColor(player.id).toUpperCase();
  const limit = getFpsLimit(player.id);
  refs.fpsLimitInput.value = limit;
  refs.fpsLimitValue.textContent = limit === 0 ? 'Sem limite' : String(limit);
  const resPercent = Math.round(getResolution(player.id) * 100);
  refs.resolutionInput.value = resPercent;
  refs.resolutionValue.textContent = `${resPercent}%`;
  const music = getMusicVolume();
  refs.musicVolumeInput.value = music;
  refs.musicVolumeValue.textContent = String(music);
  const sfx = getSfxVolume();
  refs.sfxVolumeInput.value = sfx;
  refs.sfxVolumeValue.textContent = String(sfx);
  document.querySelectorAll('.key-btn').forEach(btn => {
    const label = btn.querySelector('span');
    if (!btn.classList.contains('recording')) label.textContent = getKeyLabel(player.id, btn.dataset.action);
  });
}

export function renderLobby() {
  const room = state.currentRoom;
  if (!room) return;
  refs.roomCodeDisplay.textContent = room.code;
  refs.roomStatusDisplay.textContent = room.started ? ROOM_STATUS.playing : ROOM_STATUS.waiting;
  refs.roomModeDisplay.textContent = room.mode === 'local'
    ? 'Multijogador local (uma tela só)'
    : 'Online (uma tela para cada player)';
  refs.maxPlayersDisplay.textContent = `${room.players.length} / ${room.maxPlayers}`;
  const player = getMyPlayer();
  refs.yourRoleDisplay.textContent = player ? `${player.nickname}${player.host ? ' (host)' : ''}` : 'Convidado';

  updateGamepadStatus();

  refs.playerList.innerHTML = '';
  [...room.players]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .forEach(player => {
      const item = document.createElement('li');
      item.dataset.playerId = player.id;
      if (!renderedPlayerIds.has(player.id)) item.classList.add('player-pop');
      const badge = document.createElement('span');
      badge.className = 'player-badge';
      const dot = document.createElement('span');
      dot.className = 'color-dot';
      dot.style.background = player.color;
      const strong = document.createElement('strong');
      strong.textContent = player.nickname + (player.host ? ' (host)' : '');
      badge.appendChild(dot);
      badge.appendChild(strong);
      item.appendChild(badge);
      const you = document.createElement('span');
      you.textContent = player.id === state.myPlayerId ? 'Você' : '';
      item.appendChild(you);

      const isMine = player.id === state.myPlayerId;
      const canAssign = isMine || isHost();
      const ctrlSelect = document.createElement('select');
      ctrlSelect.className = 'control-assign';
      ctrlSelect.title = isMine ? 'Escolha seu controle' : 'Controle deste jogador';
      const pads = connectedGamepads();
      const assigned = getGamepadAssignment(player.id);
      const padConnected = assigned >= 0 && pads.some(pad => pad.index === assigned);
      const keyboardOption = document.createElement('option');
      keyboardOption.value = '-1';
      keyboardOption.textContent = 'Teclado';
      ctrlSelect.appendChild(keyboardOption);
      pads.forEach((pad) => {
        const opt = document.createElement('option');
        opt.value = String(pad.index);
        opt.textContent = `Pad ${pad.index + 1} · ${gamepadName(pad, pad.index)}`;
        ctrlSelect.appendChild(opt);
      });
      ctrlSelect.value = padConnected ? String(assigned) : '-1';
      ctrlSelect.disabled = !canAssign;
      ctrlSelect.addEventListener('change', () => {
        saveGamepadAssignment(player.id, Number(ctrlSelect.value));
        renderLobby();
      });
      item.appendChild(ctrlSelect);

      refs.playerList.appendChild(item);
    });

  renderedPlayerIds = new Set(room.players.map(p => p.id));

  refs.lobbyNotice.textContent = '';
  refs.hostHint.textContent = isHost() ? 'Você pode iniciar a partida quando quiser.' : 'Aguarde o host iniciar o jogo.';
  refs.startGameBtn.disabled = !isHost() || room.players.length < 2;

  setStartButtonPressed(isCountdownActive());
  renderSettings();
}

export function updateHud() {}

function coloredName(id, fallback) {
  const gs = state.gameState;
  const player = gs && gs.players && gs.players.find(p => p.id === id);
  if (player) return `<span style="color:${player.color};font-weight:900">${player.nickname}</span>`;
  return fallback || '';
}

export function showResultMessage(result) {
  refs.messageBox.classList.remove('hidden');
  const isVictory = !!result.winnerId && result.winnerId === state.myPlayerId;
  if (isVictory) {
    refs.messageTitle.textContent = 'Você venceu! 👑';
    const loserHtml = coloredName(result.loserId, result.loserName || 'seu oponente');
    refs.messageText.innerHTML = `A bomba explodiu em <strong>${loserHtml}</strong>.<br>Você é o grande vencedor da rodada! 👑`;
    refs.messageBox.classList.add('victory');
    refs.messageBox.classList.remove('explode');
    spawnConfetti(120, refs.messageBox);
    playSound('victory');
  } else {
    refs.messageTitle.textContent = result.title || 'Fim';
    if (result.text) {
      refs.messageText.innerHTML = result.text;
    } else {
      const loserHtml = coloredName(result.loserId, result.loserName || '');
      const winnerHtml = coloredName(result.winnerId, result.winnerName || '');
      refs.messageText.innerHTML = loserHtml
        ? `A bomba explodiu em <strong>${loserHtml}</strong>.<br>Vencedor: <strong>${winnerHtml}</strong>`
        : (winnerHtml ? `Vencedor: <strong>${winnerHtml}</strong>` : '');
    }
    refs.messageBox.classList.toggle('explode', (result.title || '') === 'Explodiu!');
    refs.messageBox.classList.remove('victory');
  }
}

export function showToast(message) {
  refs.toastBox.textContent = message;
  refs.toastBox.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    refs.toastBox.classList.add('hidden');
  }, 1500);
}

export function formatControls(playerId) {
  const ctrl = getEffectiveControls(playerId);
  if (!ctrl) return 'Mover: A/D, Pular: W, Passar: Q, Dash: Shift';
  const cap = key => key.charAt(0).toUpperCase() + key.slice(1);
  return `Mover: ${cap(ctrl.left)}/${cap(ctrl.right)}, Pular: ${cap(ctrl.jump)}, Passar: ${cap(ctrl.pass)}, Dash: ${cap(ctrl.dash)}`;
}

export function formatGamepadControls() {
  return 'Mover: Analógico, Pular: A, Passar: X, Dash: RT';
}
