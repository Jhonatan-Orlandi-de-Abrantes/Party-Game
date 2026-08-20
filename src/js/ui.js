import { GAME_MODE_NAME, PLAYER_WIDTH, PLAYER_HEIGHT } from './constants.js';
import { state, getMyPlayer, isHost, saveLocalPlayers } from './state.js';
import * as rooms from './rooms.js';
import {
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
import { openLayoutEditor, closeLayoutEditor, updateTouchVisibility } from './touch.js';
import { updateDonateVisibility } from './donate.js';
import {
  saveTouchEnabled,
  getTouchEnabled,
  saveTouchStyle,
  getTouchStyle
} from './storage.js';

const $ = (id) => document.getElementById(id);

export const refs = {
  nicknameInput: $('nicknameInput'),
  roomCodeInput: $('roomCodeInput'),
  maxPlayersInput: $('maxPlayersInput'),
  createRoomBtn: $('createRoomBtn'),
  joinRoomBtn: $('joinRoomBtn'),
  welcomeNotice: $('welcomeNotice'),
  screenWelcome: $('screen-welcome'),
  screenLobby: $('screen-lobby'),
  screenGame: $('screen-game'),
  roomCodeDisplay: $('roomCodeDisplay'),
  maxPlayersDisplay: $('maxPlayersDisplay'),
  playerList: $('playerList'),
  startGameBtn: $('startGameBtn'),
  leaveRoomBtn: $('leaveRoomBtn'),
  lobbyNotice: $('lobbyNotice'),
  lobbyAlerts: $('lobbyAlerts'),
  gamepadStatus: $('gamepadStatus'),
  controlsInfo: $('controlsInfo'),
  messageBox: $('messageBox'),
  messageTitle: $('messageTitle'),
  messageText: $('messageText'),
  scoreboard: $('scoreboard'),
  scoreboardList: $('scoreboardList'),
  returnLobbyBtn: $('returnLobbyBtn'),
  gameModeEl: $('gameMode'),
  settingsGearBtn: $('settingsGearBtn'),
  settingsPanel: $('settingsPanel'),
  settingsCloseBtn: $('settingsCloseBtn'),
  settingsQuitBtn: $('settingsQuitBtn'),
  playerColorInput: $('playerColorInput'),
  colorHexDisplay: $('colorHexDisplay'),
  hatBtn: $('hatBtn'),
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
  countdownCancelBtn: $('countdownCancelBtn'),
  gamepadInfo: $('gamepadInfo'),
  gameAlerts: $('gameAlerts'),
  inviteBtn: $('inviteBtn'),
  inviteModal: $('inviteModal'),
  inviteLinkInput: $('inviteLinkInput'),
  inviteCopyBtn: $('inviteCopyBtn'),
  inviteCloseBtn: $('inviteCloseBtn'),
  padModal: $('padModal'),
  padModalText: $('padModalText'),
  padAssignList: $('padAssignList'),
  padCreateBtn: $('padCreateBtn'),
  padNewNameRow: $('padNewNameRow'),
  padNewNameInput: $('padNewNameInput'),
  padNewNameConfirmBtn: $('padNewNameConfirmBtn'),
  padModalCancelBtn: $('padModalCancelBtn'),
  padModalNotice: $('padModalNotice'),
  settingsTitle: $('settingsTitle'),
  playersStatusLine: $('playersStatusLine'),
  touchEnabledCheckbox: $('touchEnabledCheckbox'),
  touchStyleSelect: $('touchStyleSelect'),
  touchLayoutBtn: $('touchLayoutBtn'),
  resultsOverlay: $('resultsOverlay'),
  resultsTitle: $('resultsTitle'),
  resultsPodium: $('resultsPodium'),
  resultsButtonRow: $('resultsButtonRow'),
  resultsLobbyBtn: $('resultsLobbyBtn'),
  selectPopupOverlay: $('selectPopupOverlay'),
  selectPopupTitle: $('selectPopupTitle'),
  selectPopupOptions: $('selectPopupOptions'),
  selectPopupCancelBtn: $('selectPopupCancelBtn'),
  colorPalettePopup: $('colorPalettePopup'),
  colorPaletteGrid: $('colorPaletteGrid'),
  colorPaletteCancelBtn: $('colorPaletteCancelBtn')
};

let confirmCallback = null;
let rebindingAction = null;
let countdownTimer = null;
let countdownActive = false;
const uiFocusMap = new Map();
let settingsOpenByController = false;
let renderedPlayerIds = new Set();
let padConnectIndex = -1;

const FOCUS_SELECTOR = 'input:not([type="hidden"]), select, button, .hat-option';

export function initUi() {
  refs.gameModeEl.textContent = GAME_MODE_NAME;

  refs.settingsGearBtn.addEventListener('click', () => {
    const wasOpen = refs.settingsPanel.classList.contains('open');
    if (!wasOpen && state.uiPadPlayerId) state.configTargetId = state.uiPadPlayerId;
    toggleSettingsPanel();
    if (!wasOpen) renderSettings();
    if (wasOpen) settingsOpenByController = false;
    playClick();
  });
  refs.settingsCloseBtn.addEventListener('click', () => {
    closeSettingsPanel();
    playClick();
  });

  if (refs.inviteBtn) {
    refs.inviteBtn.addEventListener('click', () => {
      openInviteModal();
      playClick();
    });
  }
  if (refs.inviteCopyBtn) {
    refs.inviteCopyBtn.addEventListener('click', () => {
      const link = refs.inviteLinkInput.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          refs.inviteCopyBtn.textContent = 'Copiado!';
          setTimeout(() => { refs.inviteCopyBtn.textContent = 'Copiar link'; }, 1500);
        });
      } else {
        refs.inviteLinkInput.select();
        document.execCommand('copy');
      }
      playClick();
    });
    refs.inviteCloseBtn.addEventListener('click', () => {
      closeInviteModal();
      playClick();
    });
  }
  if (refs.padCreateBtn) {
    refs.padCreateBtn.addEventListener('click', () => {
      refs.padNewNameRow.classList.remove('hidden');
      refs.padNewNameInput.focus();
      playClick();
    });
    refs.padNewNameConfirmBtn.addEventListener('click', () => {
      handlePadCreate();
      playClick();
    });
    refs.padNewNameInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handlePadCreate();
      }
    });
    refs.padModalCancelBtn.addEventListener('click', () => {
      hidePadConnect();
      playClick();
    });
  }

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
    syncToAllLocalPlayers(saveFpsLimit, value);
    refs.fpsLimitValue.textContent = value === 0 ? 'Sem limite' : String(value);
  });

  refs.resolutionInput.addEventListener('input', () => {
    const value = Number(refs.resolutionInput.value);
    syncToAllLocalPlayers(saveResolution, value / 100);
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
    const player = getSettingsPlayer();
    if (player) resetCustomKeys(player.id);
    renderLobby();
  });

  if (refs.touchEnabledCheckbox) {
    refs.touchEnabledCheckbox.addEventListener('change', () => {
      saveTouchEnabled(refs.touchEnabledCheckbox.checked);
    });
  }
  if (refs.touchStyleSelect) {
    refs.touchStyleSelect.addEventListener('change', () => {
      saveTouchStyle(refs.touchStyleSelect.value);
    });
  }
  if (refs.touchLayoutBtn) {
    refs.touchLayoutBtn.addEventListener('click', () => {
      openLayoutEditor();
      playClick();
    });
  }

  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const player = getSettingsPlayer();
      if (!player) return;
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
    const player = getSettingsPlayer();
    if (!player) return;
    const custom = getCustomKeys(player.id) || {};
    custom[rebindingAction] = event.key.toLowerCase();
    saveCustomKeys(player.id, custom);
    cancelRebind();
    renderLobby();
  });

  // As medidas de localização das partes do personagem (CHARACTER_REGIONS)
  // ficam somente neste arquivo, como referência para desenvolvimento de
  // cosméticos — não são mais exibidas no jogo.
}

export function toggleSettingsPanel() {
  const open = refs.settingsPanel.classList.toggle('open');
  refs.settingsGearBtn.classList.toggle('open', open);
  return open;
}

export function closeSettingsPanel() {
  refs.settingsPanel.classList.remove('open');
  refs.settingsGearBtn.classList.remove('open');
  settingsOpenByController = false;
  clearUiFocuses();
}

function cancelRebind() {
  rebindingAction = null;
  document.querySelectorAll('.key-btn.recording').forEach(btn => {
    btn.classList.remove('recording');
  });
}

const CHARACTER_REGIONS = [
  { name: 'Corpo inteiro', y0: 0, y1: PLAYER_HEIGHT, x0: 0, x1: PLAYER_WIDTH, color: '#6b7280', note: '' },
  { name: 'Topo da cabeça', y0: 0, y1: 8, x0: 12, x1: PLAYER_WIDTH - 12, color: '#ff9f1c', note: 'é onde os chapéus assentam (eles crescem acima de 0px)' },
  { name: 'Rosto', y0: 8, y1: 34, x0: 0, x1: PLAYER_WIDTH, color: '#ffd23f', note: 'área dos olhos e da boca' },
  { name: 'Olho esquerdo', y0: 11, y1: 25, x0: 6, x1: 18, color: '#3f8efc', note: 'centro x=12, y=18' },
  { name: 'Olho direito', y0: 11, y1: 25, x0: 22, x1: 34, color: '#7b2ff7', note: 'centro x=28, y=18' },
  { name: 'Boca', y0: 23, y1: 31, x0: 16, x1: 24, color: '#e91e63', note: 'centro x=20, y=27' },
  { name: 'Corpo debaixo', y0: 34, y1: PLAYER_HEIGHT, x0: 0, x1: PLAYER_WIDTH, color: '#2f9e44', note: 'parte de baixo do corpo' },
  { name: 'Pés', y0: 40, y1: 49, x0: 4, x1: 36, color: '#b08968', note: 'esquerdo x=4–15, direito x=25–36' }
];

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCharacterRegionsDiagram(canvas) {
  const ctx = canvas.getContext('2d');
  const S = 4;
  const bw = PLAYER_WIDTH * S;
  const bh = PLAYER_HEIGHT * S;
  const bx = 30;
  const by = 40;
  const maxY = 49 * S;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 10px "Trebuchet MS", Arial, sans-serif';
  ctx.fillStyle = '#9aa3af';
  for (let y = 20; y <= 40; y += 20) {
    ctx.strokeStyle = '#e6e9ef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + y * S);
    ctx.lineTo(bx + bw, by + y * S);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillText(`${y}px`, 12, by + y * S + 4);
  }
  for (let x = 20; x <= 40; x += 20) {
    ctx.strokeStyle = '#e6e9ef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + x * S, by);
    ctx.lineTo(bx + x * S, by + maxY);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText(`${x}px`, bx + x * S, 12);
  }
  ctx.textAlign = 'left';
  ctx.fillText('0px', 12, by + 4);
  ctx.textAlign = 'center';
  ctx.fillText('0px', bx, 12);

  const cx = bx + (PLAYER_WIDTH / 2) * S;
  ctx.strokeStyle = '#b6bdc9';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, by - 6);
  ctx.lineTo(cx, by + maxY + 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7c8694';
  ctx.fillText(`centro x=${PLAYER_WIDTH / 2}`, cx + 6, by + 10);

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(bx + bw / 2, by + bh + 10, bw * 0.55, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  roundedRect(ctx, bx, by, bw, bh, 12 * S);
  ctx.fillStyle = '#ff6b6b';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#222';
  roundedRect(ctx, bx + 4 * S, by + 40 * S, 11 * S, 9 * S, 4 * S);
  ctx.fill();
  roundedRect(ctx, bx + 25 * S, by + 40 * S, 11 * S, 9 * S, 4 * S);
  ctx.fill();

  CHARACTER_REGIONS.filter(region => region.name !== 'Corpo inteiro').forEach(region => {
    ctx.fillStyle = hexToRgba(region.color, 0.28);
    ctx.strokeStyle = region.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    roundedRect(ctx, bx + region.x0 * S, by + region.y0 * S, (region.x1 - region.x0) * S, (region.y1 - region.y0) * S, 3);
    ctx.fill();
    ctx.stroke();
  });
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(bx + 12 * S, by + 18 * S, 6 * S, 7 * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(bx + 28 * S, by + 18 * S, 6 * S, 7 * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(bx + 12 * S, by + 19 * S, 2.7 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx + 28 * S, by + 19 * S, 2.7 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx + 20 * S, by + 27 * S, 4 * S, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

export function openHatPicker() {
  const me = getSettingsPlayer();
  if (!me) return;
  clearUiFocuses();
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
      const currentMe = getSettingsPlayer();
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
  refs.countdownCancelBtn.classList.toggle('hidden', !isHost());
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
  refs.countdownCancelBtn.classList.add('hidden');
}

export function getFocusables() {
  if (countdownActive) {
    const cancel = refs.countdownCancelBtn;
    if (cancel.classList.contains('hidden') || cancel.disabled) return [];
    return [cancel];
  }
  const resultsOverlay = refs.resultsOverlay && !refs.resultsOverlay.classList.contains('hidden');
  if (resultsOverlay) {
    return Array.from(refs.resultsOverlay.querySelectorAll(FOCUS_SELECTOR)).filter(el => {
      if (el.disabled) return false;
      if (el.offsetParent === null && el.closest('.results-overlay') === null) return false;
      return true;
    });
  }
  const modal = document.querySelector('.modal:not(.hidden)');
  const popup = document.querySelector('.hat-popup:not(.hidden)');
  const screen = document.querySelector('.screen:not(.hidden)');
  let scope = screen;
  let skipPanel = true;
  if (modal) {
    scope = modal;
  } else if (popup) {
    scope = popup;
  } else if (refs.settingsPanel.classList.contains('open')) {
    scope = refs.settingsPanel;
    skipPanel = false;
  }
  if (!scope) return [];
  let list = Array.from(scope.querySelectorAll(FOCUS_SELECTOR)).filter(el => {
    if (el.disabled || el.offsetParent === null) return false;
    if (el.hasAttribute('data-no-controller-toggle')) return false;
    if (skipPanel && refs.settingsPanel.contains(el)) return false;
    if (el.closest('.touch-controls')) return false;
    return true;
  });
  if (scope === document.getElementById('screen-lobby') && !modal && !popup && !refs.settingsPanel.classList.contains('open')) {
    const gear = refs.settingsGearBtn;
    const gearIdx = list.indexOf(gear);
    if (gearIdx >= 0) list.splice(gearIdx, 1);
    const startBtn = refs.startGameBtn;
    const inviteBtn = refs.inviteBtn;
    const leaveBtn = refs.leaveRoomBtn;
    const btns = [startBtn, inviteBtn, leaveBtn].filter(b => list.indexOf(b) >= 0);
    btns.forEach(b => { const i = list.indexOf(b); if (i >= 0) list.splice(i, 1); });
    const selects = list.filter(el => el.tagName === 'SELECT');
    selects.forEach(s => { const i = list.indexOf(s); if (i >= 0) list.splice(i, 1); });
    list = [...btns, ...selects, gear];
  }
  return list;
}

function getUiActivePlayer(pid) {
  const room = state.currentRoom;
  if (!room) return null;
  const id = pid || state.uiPadPlayerId || state.myPlayerId;
  return room.players.find(player => player.id === id) || null;
}

function focusKey(pid) {
  return pid || 'kb';
}

function getUiFocusIndex(pid) {
  return uiFocusMap.get(focusKey(pid)) ?? -1;
}

function clearUiFocuses() {
  document.querySelectorAll('.ui-focus').forEach(el => {
    el.classList.remove('ui-focus');
    el.style.removeProperty('--focus-color');
  });
  uiFocusMap.clear();
}

function renderUiFocuses() {
  const list = getFocusables();
  const focused = new Set();
  uiFocusMap.forEach((index, key) => {
    if (index < 0 || index >= list.length) return;
    const el = list[index];
    if (el) focused.add(el);
  });
  [...document.querySelectorAll('.ui-focus')].forEach(el => {
    if (!focused.has(el)) {
      el.classList.remove('ui-focus');
      el.style.removeProperty('--focus-color');
    }
  });
  list.forEach(el => {
    if (focused.has(el)) {
      el.classList.add('ui-focus');
    } else {
      el.style.removeProperty('--focus-color');
    }
  });
  uiFocusMap.forEach((index, key) => {
    const el = index >= 0 && index < list.length ? list[index] : null;
    if (!el || !focused.has(el)) return;
    const active = getUiActivePlayer(key === 'kb' ? null : key);
    if (active) el.style.setProperty('--focus-color', active.color);
  });
}

function setUiFocusIndex(index, pid) {
  const list = getFocusables();
  const key = focusKey(pid);
  if (list.length === 0) {
    uiFocusMap.set(key, -1);
    renderUiFocuses();
    return;
  }
  uiFocusMap.set(key, ((index % list.length) + list.length) % list.length);
  renderUiFocuses();
  const target = list[uiFocusMap.get(key)];
  if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'nearest' });
}

export function moveUiFocus(dx, dy, pid, isAnalog) {
  const list = getFocusables();
  if (list.length === 0) return;
  let index = getUiFocusIndex(pid);
  if (index < 0) {
    setUiFocusIndex(0, pid);
    return;
  }
  const target = list[index];

  if (target.classList.contains('hat-option')) {
    moveHatGridFocus(list, dx, dy, pid);
    return;
  }
  if (refs.hatCloseBtn && target === refs.hatCloseBtn && dy < 0) {
    const options = Array.from(refs.hatGrid.querySelectorAll('.hat-option'));
    if (options.length > 0) setUiFocusIndex(options.length - 1, pid);
    return;
  }

  if (target.classList.contains('color-swatch')) {
    moveColorGridFocus(list, dx, dy, pid);
    return;
  }

  if (target.type === 'range' && dx !== 0) {
    const min = Number(target.min);
    const max = Number(target.max);
    const bigStep = isAnalog ? 5 : 1;
    const next = Math.min(max, Math.max(min, Number(target.value) + dx * bigStep));
    target.value = String(next);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  const dir = dy !== 0 ? dy : dx;
  setUiFocusIndex(index + dir, pid);
}

function moveHatGridFocus(list, dx, dy, pid) {
  const options = list.filter(el => el.classList.contains('hat-option'));
  const current = options.indexOf(list[getUiFocusIndex(pid)]);
  if (current < 0) {
    setUiFocusIndex(getUiFocusIndex(pid) + (dy !== 0 ? dy : dx), pid);
    return;
  }
  let cols = 1;
  if (options.length > 1) {
    const firstTop = options[0].getBoundingClientRect().top;
    for (const opt of options) {
      if (Math.abs(opt.getBoundingClientRect().top - firstTop) < 3) cols++;
      else break;
    }
  }
  const row = Math.floor(current / cols);
  let next = current;
  if (dy !== 0) {
    if (dy > 0) {
      if (row >= Math.floor((options.length - 1) / cols)) {
        setUiFocusIndex(options.length, pid);
        return;
      }
      next = Math.min(options.length - 1, current + cols);
    } else {
      next = current >= cols ? current - cols : current;
    }
  } else if (dx !== 0) {
    const rowStart = row * cols;
    const rowLast = Math.min(options.length - 1, rowStart + cols - 1);
    if (dx > 0) next = current >= rowLast ? rowStart : current + 1;
    else next = current <= rowStart ? rowLast : current - 1;
  }
  setUiFocusIndex(next, pid);
}

function moveColorGridFocus(list, dx, dy, pid) {
  const idx = getUiFocusIndex(pid);
  const swatches = list.filter(el => el.classList.contains('color-swatch'));
  const current = swatches.indexOf(list[idx]);
  const cancelBtn = refs.colorPaletteCancelBtn;
  const cancelInList = cancelBtn && cancelInFocus(list, cancelBtn);
  if (current < 0) {
    if (cancelBtn && list[idx] === cancelBtn) {
      if (dx < 0) { setUiFocusIndex(list.indexOf(swatches[swatches.length - 1]), pid); return; }
      if (dx > 0) { setUiFocusIndex(list.indexOf(swatches[0]), pid); return; }
      setUiFocusIndex(idx + dx, pid);
      return;
    }
    setUiFocusIndex(idx + dx, pid);
    return;
  }
  if (dx > 0) {
    if (current < swatches.length - 1) {
      setUiFocusIndex(list.indexOf(swatches[current + 1]), pid);
    } else if (cancelInList) {
      setUiFocusIndex(list.indexOf(cancelBtn), pid);
    } else {
      setUiFocusIndex(list.indexOf(swatches[0]), pid);
    }
  } else if (dx < 0) {
    if (current > 0) {
      setUiFocusIndex(list.indexOf(swatches[current - 1]), pid);
    } else {
      setUiFocusIndex(list.indexOf(swatches[swatches.length - 1]), pid);
    }
  }
}
function cancelInFocus(list, btn) { return list.indexOf(btn) >= 0; }

export function activateUiFocus(pid) {
  const list = getFocusables();
  if (list.length === 0) return;
  let index = getUiFocusIndex(pid);
  if (index < 0) {
    setUiFocusIndex(0, pid);
    const msgShown = refs.messageBox && !refs.messageBox.classList.contains('hidden');
    if (msgShown) {
      const el = list[0];
      if (el && (el.tagName === 'BUTTON' || el.type === 'color')) el.click();
    }
    return;
  }
  const el = list[index];
  if (!el) return;
  if (el === refs.settingsGearBtn) {
    const id = pid || state.uiPadPlayerId;
    const wasOpen = refs.settingsPanel.classList.contains('open');
    el.click();
    if (id) state.configTargetId = id;
    renderSettings();
    settingsOpenByController = !wasOpen;
    uiFocusMap.set(focusKey(pid), -1);
    renderUiFocuses();
    return;
  }
  if (el.type === 'checkbox') {
    el.checked = !el.checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    setUiFocusIndex(index, pid);
    return;
  }
  if (el.tagName === 'SELECT') {
    const options = Array.from(el.options).map(opt => ({ value: opt.value, label: opt.textContent }));
    openSelectPopup(el.options[0]?.parentElement?.label || 'Selecionar', options, value => {
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return;
  }
  if (el.tagName === 'BUTTON' || el.type === 'color') {
    if (el.type === 'color' && pid) {
      openColorPalette(el, pid);
      return;
    }
    el.click();
  } else {
    el.focus();
  }
}

let resultsOverlayBackCallback = null;

export function setResultsOverlayBackCallback(fn) {
  resultsOverlayBackCallback = fn;
}

export function uiBack(pid) {
  if (refs.colorPalettePopup && !refs.colorPalettePopup.classList.contains('hidden')) {
    closeColorPalette();
    return;
  }
  if (refs.selectPopupOverlay && !refs.selectPopupOverlay.classList.contains('hidden')) {
    closeSelectPopup();
    return;
  }
  const resultsOverlay = refs.resultsOverlay && !refs.resultsOverlay.classList.contains('hidden');
  if (resultsOverlay) {
    hideResultsOverlay();
    if (resultsOverlayBackCallback) resultsOverlayBackCallback();
    return;
  }
  const modal = document.querySelector('.modal:not(.hidden)');
  if (modal) {
    if (modal === refs.inviteModal) {
      closeInviteModal();
    } else if (modal === refs.padModal) {
      hidePadConnect();
    } else {
      refs.confirmCancelBtn.click();
    }
    return;
  }
  if (refs.messageBox && !refs.messageBox.classList.contains('hidden')) {
    if (refs.returnLobbyBtn) refs.returnLobbyBtn.click();
    return;
  }
  const popup = document.querySelector('.hat-popup:not(.hidden)');
  if (popup) {
    closeHatPicker();
    return;
  }
  const layoutEditor = document.getElementById('touchLayoutEditor');
  if (layoutEditor && !layoutEditor.classList.contains('hidden')) {
    closeLayoutEditor();
    return;
  }
  const settings = document.querySelector('.settings-panel.open');
  if (settings) {
    closeSettingsPanel();
    return;
  }
  if (document.activeElement && document.activeElement.tagName === 'INPUT') {
    document.activeElement.blur();
    setUiFocusIndex(0, pid);
    return;
  }
  setUiFocusIndex(0, pid);
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
  clearUiFocuses();
  refs.confirmModal.classList.remove('hidden');
}

export function hideConfirm() {
  confirmCallback = null;
  refs.confirmModal.classList.add('hidden');
}

let selectPopupCallback = null;

export function openSelectPopup(title, options, callback) {
  if (!refs.selectPopupOverlay || !refs.selectPopupTitle || !refs.selectPopupOptions) return;
  selectPopupCallback = callback;
  refs.selectPopupTitle.textContent = title;
  refs.selectPopupOptions.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'select-popup-option';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      playClick();
      closeSelectPopup();
      if (selectPopupCallback) selectPopupCallback(opt.value);
    });
    refs.selectPopupOptions.appendChild(btn);
  });
  clearUiFocuses();
  refs.selectPopupOverlay.classList.remove('hidden');
}

export function closeSelectPopup() {
  selectPopupCallback = null;
  if (refs.selectPopupOverlay) refs.selectPopupOverlay.classList.add('hidden');
}

const PALETTE_COLORS = [
  '#ff6b6b', '#ffd23f', '#2ecc40', '#3498db', '#9b59b6', '#e91e63',
  '#ff9f43', '#00cec9', '#fd79a8', '#6c5ce7', '#00b894', '#e17055',
  '#d63031', '#0984e3', '#a29bfe', '#55efc4', '#ffeaa7', '#fab1a0',
  '#ffffff', '#b2bec3', '#636e72', '#2d3436'
];

let colorPaletteTarget = null;

function openColorPalette(targetEl, pid) {
  if (!refs.colorPalettePopup || !refs.colorPaletteGrid) return;
  colorPaletteTarget = { el: targetEl, pid };
  refs.colorPaletteGrid.innerHTML = '';
  PALETTE_COLORS.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-swatch';
    btn.style.background = color;
    if (targetEl.value.toLowerCase() === color.toLowerCase()) btn.classList.add('selected');
    btn.title = color.toUpperCase();
    btn.addEventListener('click', () => {
      playClick();
      targetEl.value = color;
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));
      closeColorPalette();
    });
    refs.colorPaletteGrid.appendChild(btn);
  });
  clearUiFocuses();
  refs.colorPalettePopup.classList.remove('hidden');
}

export function closeColorPalette() {
  colorPaletteTarget = null;
  if (refs.colorPalettePopup) refs.colorPalettePopup.classList.add('hidden');
}

if (refs.colorPaletteCancelBtn) {
  refs.colorPaletteCancelBtn.addEventListener('click', () => {
    closeColorPalette();
    playClick();
  });
}
if (refs.colorPalettePopup) {
  refs.colorPalettePopup.addEventListener('click', event => {
    if (event.target === refs.colorPalettePopup) closeColorPalette();
  });
}
if (refs.selectPopupCancelBtn) {
  refs.selectPopupCancelBtn.addEventListener('click', () => {
    closeSelectPopup();
    playClick();
  });
}
if (refs.selectPopupOverlay) {
  refs.selectPopupOverlay.addEventListener('click', event => {
    if (event.target === refs.selectPopupOverlay) closeSelectPopup();
  });
}

export function getPadConnectIndex() {
  return padConnectIndex;
}

export function showPadConnect(padIndex) {
  padConnectIndex = padIndex;
  refs.padModalText.textContent = `Controle (Pad ${padIndex + 1}) detectado. Atribua a um jogador desta tela ou crie um novo.`;
  refs.padNewNameRow.classList.add('hidden');
  refs.padNewNameInput.value = '';
  refs.padModalNotice.textContent = '';
  clearUiFocuses();
  populatePadAssignList();
  refs.padModal.classList.remove('hidden');
}

export function hidePadConnect() {
  padConnectIndex = -1;
  refs.padModal.classList.add('hidden');
  refs.padNewNameRow.classList.add('hidden');
}

export function assignPadToPlayer(playerId) {
  const index = padConnectIndex;
  if (index < 0) return;
  saveGamepadAssignment(playerId, index);
  if (!state.localPlayerIds.includes(playerId)) {
    saveLocalPlayers([...state.localPlayerIds, playerId]);
  }
  hidePadConnect();
  renderLobby();
}

function populatePadAssignList() {
  const room = state.currentRoom;
  refs.padAssignList.innerHTML = '';
  if (!room) return;
  room.players
    .filter(player => state.localPlayerIds.includes(player.id))
    .forEach(player => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pad-assign-btn';
      const dot = document.createElement('span');
      dot.className = 'color-dot';
      dot.style.background = player.color;
      const label = document.createElement('span');
      label.textContent = player.nickname + (player.host ? ' (host)' : '');
      btn.appendChild(dot);
      btn.appendChild(label);
      btn.addEventListener('click', () => {
        assignPadToPlayer(player.id);
        playClick();
      });
      li.appendChild(btn);
      refs.padAssignList.appendChild(li);
    });
}

function handlePadCreate() {
  const index = padConnectIndex;
  if (index < 0) return;
  const nickname = refs.padNewNameInput.value.trim();
  if (!nickname) {
    refs.padModalNotice.textContent = 'Informe um apelido.';
    return;
  }
  const result = rooms.addLocalPlayer(nickname);
  if (result.error) {
    refs.padModalNotice.textContent = result.error;
    return;
  }
  saveGamepadAssignment(result.player.id, index);
  hidePadConnect();
  spawnConfetti(30);
  renderLobby();
}

export function openInviteModal() {
  const room = state.currentRoom;
  if (!room) return;
  refs.inviteLinkInput.value = `${location.origin}${location.pathname}?room=${room.code}`;
  clearUiFocuses();
  refs.inviteModal.classList.remove('hidden');
}

export function closeInviteModal() {
  refs.inviteModal.classList.add('hidden');
}

export function getSettingsPlayer() {
  const room = state.currentRoom;
  if (!room) return getMyPlayer();
  const target = state.configTargetId || state.myPlayerId;
  return room.players.find(player => player.id === target) || getMyPlayer();
}

function syncToAllLocalPlayers(saveFn, value) {
  const ids = state.localPlayerIds || [];
  for (const id of ids) saveFn(id, value);
}

export function showScreen(name) {
  state.currentScreen = name;
  clearUiFocuses();
  refs.screenWelcome.classList.toggle('hidden', name !== 'welcome');
  refs.screenLobby.classList.toggle('hidden', name !== 'lobby');
  refs.screenGame.classList.toggle('hidden', name !== 'game');
  if (name !== 'lobby') {
    closeSettingsPanel();
    closeHatPicker();
  }
  if (name !== 'game') {
    hideResultsOverlay();
  }
  updateTouchVisibility();
  updateDonateVisibility();
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

export function showGameAlert(text, type) {
  const alert = document.createElement('div');
  alert.className = `game-alert ${type || ''}`;
  alert.textContent = text;
  refs.gameAlerts.appendChild(alert);
  setTimeout(() => alert.remove(), 4500);
}

let lastPadsSignature = null;

export function updateGamepadStatus() {
  if (state.currentScreen !== 'lobby') return;
  const pads = connectedGamepads();
  refs.gamepadStatus.textContent = pads.length > 0
    ? `Controles: ${pads.length} (${pads.map(gamepadName).join(', ')}) · Pressione um botão de um controle novo para adicionar um jogador.`
    : 'Conecte um controle para adicionar jogadores nesta tela.';
  const signature = pads.map(pad => pad.index).join(',');
  if (signature !== lastPadsSignature) {
    lastPadsSignature = signature;
    refreshControlAssignments();
  }
}

function buildControlAssign(player, pads, canAssign) {
  const ctrlSelect = document.createElement('select');
  ctrlSelect.className = 'control-assign';
  ctrlSelect.title = canAssign ? 'Escolha seu controle' : 'Controle deste jogador';
  const assigned = getGamepadAssignment(player.id);
  const padConnected = assigned >= 0 && pads.some(pad => pad.index === assigned);
  const keyboardOption = document.createElement('option');
  keyboardOption.value = '-1';
  keyboardOption.textContent = 'Teclado';
  ctrlSelect.appendChild(keyboardOption);
  pads.forEach(pad => {
    const opt = document.createElement('option');
    opt.value = String(pad.index);
    opt.textContent = `Pad ${pad.index + 1} · ${gamepadName(pad, pad.index)}`;
    ctrlSelect.appendChild(opt);
  });
  ctrlSelect.value = padConnected ? String(assigned) : '-1';
  ctrlSelect.disabled = !canAssign;
  ctrlSelect.addEventListener('change', () => {
    const chosen = Number(ctrlSelect.value);
    const room = state.currentRoom;
    if (room) {
      const takenBy = room.players.find(other =>
        other.id !== player.id && getGamepadAssignment(other.id) === chosen
      );
      if (takenBy && (chosen >= 0 || room.mode === 'local')) {
        const currentAssignment = getGamepadAssignment(player.id);
        saveGamepadAssignment(takenBy.id, currentAssignment);
        saveGamepadAssignment(player.id, chosen);
        renderLobby();
        return;
      }
    }
    saveGamepadAssignment(player.id, chosen);
    renderLobby();
  });
  return ctrlSelect;
}

function refreshControlAssignments() {
  const room = state.currentRoom;
  if (!room) return;
  const pads = connectedGamepads();
  room.players.forEach(player => {
    const item = playerListItem(player.id);
    if (!item) return;
    const old = item.querySelector('.control-assign');
    if (!old) return;
    const canAssign = player.id === state.myPlayerId || isHost() || (state.localPlayerIds || []).includes(player.id);
    item.replaceChild(buildControlAssign(player, pads, canAssign), old);
  });
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
  const player = getSettingsPlayer();
  if (!room || !player) return;
  if (refs.settingsTitle) {
    refs.settingsTitle.textContent = '';
    refs.settingsTitle.append('Configurações de ');
    const nameSpan = document.createElement('span');
    nameSpan.style.color = player.color;
    nameSpan.textContent = player.nickname;
    refs.settingsTitle.appendChild(nameSpan);
  }
  refs.playerColorInput.value = player.color;
  refs.colorHexDisplay.textContent = player.color.toUpperCase();
  refs.hatBtn.textContent = `Escolher chapéu · ${getHatById(player.hat).name}`;
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
  if (refs.touchEnabledCheckbox) refs.touchEnabledCheckbox.checked = getTouchEnabled();
  if (refs.touchStyleSelect) refs.touchStyleSelect.value = getTouchStyle();
  document.querySelectorAll('.key-btn').forEach(btn => {
    const label = btn.querySelector('span');
    if (!btn.classList.contains('recording')) label.textContent = getKeyLabel(player.id, btn.dataset.action);
  });
}

export function renderLobby() {
  const room = state.currentRoom;
  if (!room) return;
  refs.roomCodeDisplay.textContent = room.code;
  refs.maxPlayersDisplay.textContent = `${room.players.length} / ${room.maxPlayers}`;
  if (refs.playersStatusLine) {
    const countFull = room.players.length >= room.maxPlayers;
    refs.playersStatusLine.classList.toggle('full', countFull);
    refs.playersStatusLine.classList.toggle('partial', !countFull);
  }
  if (refs.inviteBtn) refs.inviteBtn.classList.remove('hidden');
  if (padConnectIndex >= 0 && !refs.padModal.classList.contains('hidden')) populatePadAssignList();

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
      you.textContent = (state.localPlayerIds || []).includes(player.id) ? 'Você' : '';
      item.appendChild(you);
      if (player.score > 0) {
        const score = document.createElement('span');
        score.className = 'player-score';
        score.textContent = `${player.score} pts`;
        item.appendChild(score);
      }

      const isMine = player.id === state.myPlayerId;
      const canAssign = isMine || isHost() || (state.localPlayerIds || []).includes(player.id);
      item.appendChild(buildControlAssign(player, connectedGamepads(), canAssign));

      refs.playerList.appendChild(item);
    });

  renderedPlayerIds = new Set(room.players.map(p => p.id));

  refs.lobbyNotice.textContent = '';
  refs.startGameBtn.disabled = !isHost() || room.players.length < 2;

  setStartButtonPressed(isCountdownActive());
  renderSettings();
}

export function updateHud() {}

export function showResultMessage(result) {
  refs.messageBox.classList.remove('hidden');
  refs.messageBox.classList.remove('victory', 'explode');
  if (result.maxScoreReached) {
    refs.messageBox.classList.add('victory');
    refs.messageTitle.textContent = '';
    refs.messageTitle.appendChild(document.createTextNode('👑 '));
    const champ = result.champion;
    const nameSpan = document.createElement('span');
    nameSpan.style.color = champ && champ.color ? champ.color : '#ffd23f';
    nameSpan.textContent = champ ? champ.nickname : 'Jogador';
    refs.messageTitle.appendChild(nameSpan);
    refs.messageTitle.appendChild(document.createTextNode(' É O CAMPEÃO! 👑'));
    refs.messageText.innerHTML = `Pontuação máxima atingida!`;
  } else {
    const winnerId = result.winnerId;
    if (winnerId) {
      refs.messageTitle.textContent = '';
      refs.messageTitle.appendChild(document.createTextNode('👑 '));
      const winnerEntry = (result.scoreboard || []).find(entry => entry.id === winnerId);
      const nameSpan = document.createElement('span');
      nameSpan.style.color = winnerEntry && winnerEntry.color ? winnerEntry.color : '#ffd23f';
      nameSpan.textContent = result.winnerName || 'Jogador';
      refs.messageTitle.appendChild(nameSpan);
      refs.messageTitle.appendChild(document.createTextNode(' VENCEU! 👑'));
      refs.messageText.innerHTML = '';
    } else {
      refs.messageTitle.textContent = result.title || 'Fim';
      refs.messageText.innerHTML = result.text || '';
    }
  }
  renderScoreboard(result.scoreboard);
}

function renderScoreboard(board) {
  if (!refs.scoreboard || !refs.scoreboardList) return;
  if (!board || board.length === 0) {
    refs.scoreboard.classList.add('hidden');
    return;
  }
  refs.scoreboard.classList.remove('hidden');
  const sorted = [...board].sort((a, b) => (b.score || 0) - (a.score || 0));
  const places = ['1º', '2º', '3º', '4º'];
  refs.scoreboardList.innerHTML = '';
  sorted.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = 'scoreboard-item' + (index === 0 ? ' first' : '');
    const place = document.createElement('span');
    place.className = 'scoreboard-place';
    if (index === 0) {
      const crown = document.createElement('span');
      crown.className = 'scoreboard-crown';
      crown.textContent = '👑 ';
      place.appendChild(crown);
      place.appendChild(document.createTextNode('1º'));
    } else {
      place.textContent = places[index] || `${index + 1}º`;
    }
    const name = document.createElement('span');
    name.className = 'scoreboard-name';
    name.style.color = entry.color || '#222';
    name.textContent = entry.nickname;
    const score = document.createElement('span');
    score.className = 'scoreboard-score';
    score.textContent = `${entry.score} pts`;
    li.appendChild(place);
    li.appendChild(name);
    li.appendChild(score);
    refs.scoreboardList.appendChild(li);
  });
}

export function formatControls(playerId) {
  const ctrl = getEffectiveControls(playerId);
  if (!ctrl) return 'Mover: A/D, Pular: W, Dash: Shift';
  const cap = key => key.charAt(0).toUpperCase() + key.slice(1);
  return `Mover: ${cap(ctrl.left)}/${cap(ctrl.right)}, Pular: ${cap(ctrl.jump)}, Dash: ${cap(ctrl.dash)}`;
}

export function formatGamepadControls() {
  return 'Mover: Analógico, Pular: A, Dash: RT/LT';
}

export function showResultsOverlay(result) {
  if (!refs.resultsOverlay || !refs.resultsTitle || !refs.resultsPodium) return;
  refs.resultsTitle.textContent = '';
  const champ = result.champion;
  const nameSpan = document.createElement('span');
  nameSpan.style.color = champ && champ.color ? champ.color : '#ffd23f';
  nameSpan.textContent = champ ? champ.nickname : 'Jogador';
  refs.resultsTitle.appendChild(document.createTextNode('👑 '));
  refs.resultsTitle.appendChild(nameSpan);
  refs.resultsTitle.appendChild(document.createTextNode(' É O CAMPEÃO! 👑'));

  const board = result.scoreboard || [];
  const sorted = [...board].sort((a, b) => (b.score || 0) - (a.score || 0));
  refs.resultsPodium.innerHTML = '';
  sorted.forEach((entry, idx) => {
    const placeDiv = document.createElement('div');
    placeDiv.className = `results-place results-podium-${idx + 1}`;
    const charWrap = document.createElement('div');
    charWrap.className = 'results-char-wrap';
    if (idx === 0) {
      const crown = document.createElement('div');
      crown.className = 'results-crown';
      crown.textContent = '👑';
      charWrap.appendChild(crown);
    }
    const charEl = document.createElement('div');
    charEl.className = 'results-char';
    charEl.style.background = entry.color || '#ff6b6b';
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    drawHatPreview(canvas.getContext('2d'), entry.hat || 'none', entry.color || '#ff6b6b');
    charEl.appendChild(canvas);
    charWrap.appendChild(charEl);
    placeDiv.appendChild(charWrap);
    const nameEl = document.createElement('div');
    nameEl.className = 'results-name';
    nameEl.style.color = entry.color || '#222';
    nameEl.textContent = entry.nickname;
    placeDiv.appendChild(nameEl);
    const ptsEl = document.createElement('div');
    ptsEl.className = 'results-pts';
    ptsEl.textContent = `${entry.score} pts`;
    placeDiv.appendChild(ptsEl);
    refs.resultsPodium.appendChild(placeDiv);
  });

  refs.resultsButtonRow.classList.add('hidden');
  refs.resultsOverlay.classList.remove('hidden');

  setTimeout(() => {
    refs.resultsButtonRow.classList.remove('hidden');
    const btn = refs.resultsLobbyBtn;
    if (btn) {
      btn.classList.remove('results-btn-animate');
      void btn.offsetWidth;
      btn.classList.add('results-btn-animate');
    }
  }, 1000);
}

export function hideResultsOverlay() {
  if (refs.resultsOverlay) refs.resultsOverlay.classList.add('hidden');
  if (refs.resultsButtonRow) refs.resultsButtonRow.classList.add('hidden');
}
