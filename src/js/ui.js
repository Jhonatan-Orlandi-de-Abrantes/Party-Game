import { GAME_MODES, DEFAULT_ROOM_SETTINGS, PLAYER_WIDTH, PLAYER_HEIGHT, SPAWN_COLORS, MAX_MAP_PLATFORMS, uuid, TOUCH_ASSIGNMENT } from './constants.js';
import { getPlayableMaps, playableMapKey } from './maps.js';
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
import * as net from './net.js';
import { spawnConfetti } from './effects.js';
import { playSound, playClick, playPop, setMusicVolume as applyMusicVolume, setSfxVolume as applySfxVolume } from './audio.js';
import { HATS, getHatById, drawHatPreview } from './hats.js';
import { openLayoutEditor, closeLayoutEditor, updateTouchVisibility } from './touch.js';
import { updateDonateVisibility } from './donate.js';
import { initColorPickers } from './colorPicker.js';
import {
  getAllCosmetics,
  getCosmeticById,
  equipCosmetic,
  unequipCosmetic,
  isEquipped,
  getEquippedList,
  removeCosmetic,
  processImageFile,
  createCosmeticImage,
  createCosmeticCode,
  updateCosmetic,
  drawCosmeticPreview
} from './cosmetics.js';
import {
  saveTouchEnabled,
  getTouchEnabled,
  saveTouchStyle,
  getTouchStyle,
  saveEquippedCosmetics,
  loadCustomMaps,
  saveCustomMaps,
  putCustomMusic
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
  screenMapEditor: $('screen-mapeditor'),
  roomCodeDisplay: $('roomCodeDisplay'),
  maxPlayersDisplay: $('maxPlayersDisplay'),
  playerList: $('playerList'),
  startGameBtn: $('startGameBtn'),
  leaveRoomBtn: $('leaveRoomBtn'),
  lobbyNotice: $('lobbyNotice'),
  lobbyAlerts: $('lobbyAlerts'),
  lobbyHowToText: $('lobbyHowToText'),
  gamepadStatus: $('gamepadStatus'),
  controlsInfo: $('controlsInfo'),
  messageBox: $('messageBox'),
  messageTitle: $('messageTitle'),
  messageText: $('messageText'),
  scoreboard: $('scoreboard'),
  scoreboardList: $('scoreboardList'),
  returnLobbyBtn: $('returnLobbyBtn'),

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
  fullscreenBtn: $('fullscreenBtn'),
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
  colorPaletteCancelBtn: $('colorPaletteCancelBtn'),
  openCosmeticsEditorBtn: $('openCosmeticsEditorBtn'),
  cosmeticsModal: $('cosmeticsModal'),
  cosmeticsList: $('cosmeticsList'),
  cosmeticsCreateImgBtn: $('cosmeticsCreateImgBtn'),
  cosmeticsCreateCodeBtn: $('cosmeticsCreateCodeBtn'),
  cosmeticsFileInput: $('cosmeticsFileInput'),
  cosmeticsModalCloseBtn: $('cosmeticsModalCloseBtn'),
  cosmeticsPositionModal: $('cosmeticsPositionModal'),
  cosmeticsPositionCanvas: $('cosmeticsPositionCanvas'),
  cosmeticsScaleInput: $('cosmeticsScaleInput'),
  cosmeticsScaleValue: $('cosmeticsScaleValue'),
  cosmeticsPositionSaveBtn: $('cosmeticsPositionSaveBtn'),
  cosmeticsPositionCancelBtn: $('cosmeticsPositionCancelBtn'),
  cosmeticsCodeModal: $('cosmeticsCodeModal'),
  cosmeticsCodeInput: $('cosmeticsCodeInput'),
  cosmeticsCodePreviewCanvas: $('cosmeticsCodePreviewCanvas'),
  cosmeticsCodeSaveBtn: $('cosmeticsCodeSaveBtn'),
  cosmeticsCodeCancelBtn: $('cosmeticsCodeCancelBtn'),
  cosmeticsCodeImportBtn: $('cosmeticsCodeImportBtn'),
  cosmeticsJsFileInput: $('cosmeticsJsFileInput'),
  lobbyModeList: $('lobbyModeList'),
  lobbyMapsModeName: $('lobbyMapsModeName'),
  lobbyNativeMaps: $('lobbyNativeMaps'),
  lobbyCustomMaps: $('lobbyCustomMaps'),
  selectAllMapsBtn: $('selectAllMapsBtn'),
  powerupFreqInput: $('powerupFreqInput'),
  powerupFreqValue: $('powerupFreqValue'),
  hostConfigWarning: $('hostConfigWarning'),
  playerSpeedInput: $('playerSpeedInput'),
  playerSpeedValue: $('playerSpeedValue'),
  scoreLimitInput: $('scoreLimitInput'),
  scoreLimitValue: $('scoreLimitValue'),
  resetPowerupFreqBtn: $('resetPowerupFreqBtn'),
  resetPlayerSpeedBtn: $('resetPlayerSpeedBtn'),
  resetScoreLimitBtn: $('resetScoreLimitBtn'),
  hostConfigBtn: $('hostConfigBtn'),
  hostConfigPanel: $('hostConfigPanel'),
  hostConfigCloseBtn: $('hostConfigCloseBtn'),
  hostConfigHostName: $('hostConfigHostName'),
  resetPowerupFreqBtn: $('resetPowerupFreqBtn'),
  resetPlayerSpeedBtn: $('resetPlayerSpeedBtn'),
  resetScoreLimitBtn: $('resetScoreLimitBtn')
};

let confirmCallback = null;
let rebindingAction = null;
let countdownTimer = null;
let countdownActive = false;
const uiFocusMap = new Map();
const uiFocusStamp = new Map(); // ordem de interação: quem interagiu por último pinta o seletor
let uiFocusSeq = 0;
let settingsOpenByController = false;
let renderedPlayerIds = new Set();
let padConnectIndex = -1;
const KEYBOARD_CONNECT = -2; // tela de atribuição aberta para o TECLADO
const TOUCH_CONNECT = -4; // tela de atribuição aberta para o TOQUE (Móvel)
let lobbyMapImportInput = null;

const FOCUS_SELECTOR = 'input:not([type="hidden"]), select, button, .hat-option';

export function initUi() {
  initColorPickers();
  // Trava a rolagem do fundo enquanto qualquer overlay estiver aberta
  const syncBodyModalOpen = () => {
    document.body.classList.toggle('modal-open', !!document.querySelector(
      '.modal:not(.hidden), .hat-popup:not(.hidden), .touch-layout-editor:not(.hidden), .settings-panel.open'
    ));
  };
  const overlayObserver = new MutationObserver(syncBodyModalOpen);
  document.querySelectorAll('.modal, .hat-popup, .touch-layout-editor, .settings-panel').forEach(el => {
    overlayObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  });
  syncBodyModalOpen();
  refs.settingsGearBtn.addEventListener('click', () => {
    const wasOpen = refs.settingsPanel.classList.contains('open');
    toggleSettingsPanel();
    if (!wasOpen) {
      state.configTargetId = state.myPlayerId;
      renderSettings();
    }
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

  bindRoomRule(refs.powerupFreqInput, refs.powerupFreqValue, '%', refs.resetPowerupFreqBtn, 'powerupFrequency');
  bindRoomRule(refs.playerSpeedInput, refs.playerSpeedValue, '%', refs.resetPlayerSpeedBtn, 'playerSpeed');
  bindRoomRule(refs.scoreLimitInput, refs.scoreLimitValue, ' pts', refs.resetScoreLimitBtn, 'scoreLimit');

  const puLockedRow = refs.powerupFreqInput && refs.powerupFreqInput.closest('.lobby-rule-line');
  if (puLockedRow) {
    puLockedRow.addEventListener('pointerdown', () => {
      if (puLockedRow.classList.contains('pu-locked')) {
        showHostConfigWarning('Power-ups não funcionam neste modo!');
      }
    });
  }

  if (refs.hostConfigBtn) {
    refs.hostConfigBtn.addEventListener('click', () => {
      playClick();
      openHostConfig();
    });
  }
  if (refs.hostConfigCloseBtn) {
    refs.hostConfigCloseBtn.addEventListener('click', () => {
      closeHostConfig();
      playClick();
    });
  }
  if (refs.selectAllMapsBtn) {
    refs.selectAllMapsBtn.addEventListener('click', () => {
      if (!isHost()) return;
      const live = state.currentRoom;
      if (!live) return;
      live.mapSelection = [];
      saveRooms();
      renderLobbyMaps();
      renderUiFocuses();
    });
  }
  if (refs.hostConfigPanel) {
    refs.hostConfigPanel.addEventListener('click', event => {
      if (event.target === refs.hostConfigPanel) closeHostConfig();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !refs.hostConfigPanel.classList.contains('hidden')) {
        closeHostConfig();
      }
    });
  }

  if (refs.touchEnabledCheckbox) {
    refs.touchEnabledCheckbox.addEventListener('change', () => {
      const enabled = refs.touchEnabledCheckbox.checked;
      saveTouchEnabled(enabled);
      const room = state.currentRoom;
      let changed = false;
      if (!enabled && room) {
        room.players.forEach(player => {
          if (getGamepadAssignment(player.id) === TOUCH_ASSIGNMENT) {
            saveGamepadAssignment(player.id, -1);
            changed = true;
          }
        });
      }
      if (changed) {
        renderLobby();
      } else {
        refreshControlAssignments();
      }
      if (
        enabled &&
        state.currentScreen === 'lobby' &&
        room && !room.started &&
        getPadConnectIndex() === -1 &&
        !document.querySelector('.modal:not(.hidden)')
      ) {
        showTouchConnect();
      }
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

  lobbyMapImportInput = document.createElement('input');
  lobbyMapImportInput.type = 'file';
  lobbyMapImportInput.accept = '.pgmap,application/json';
  lobbyMapImportInput.style.display = 'none';
  document.body.appendChild(lobbyMapImportInput);
  lobbyMapImportInput.addEventListener('change', handleLobbyMapImport);

  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const player = getSettingsPlayer();
      if (!player) return;
      const label = btn.querySelector('span');
      if (!label || !btn.dataset.action) return;
      rebindingAction = btn.dataset.action;
      btn.classList.add('recording');
      label.textContent = '...';
      playClick();
    });
  });

  document.addEventListener('keydown', event => {
    if (!rebindingAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (/^f\d{1,2}$/.test(event.key.toLowerCase())) {
      event.preventDefault();
      return;
    }
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

  refs.openCosmeticsEditorBtn.addEventListener('click', () => {
    openCosmeticsModal();
    playClick();
  });
  refs.cosmeticsModalCloseBtn.addEventListener('click', () => {
    closeCosmeticsModal();
    playClick();
  });
  refs.cosmeticsCreateImgBtn.addEventListener('click', () => {
    refs.cosmeticsFileInput.click();
    playClick();
  });
  refs.cosmeticsFileInput.addEventListener('change', handleCosmeticsFileUpload);
  refs.cosmeticsCreateCodeBtn.addEventListener('click', () => {
    openCosmeticsCodeModal();
    playClick();
  });
  refs.cosmeticsJsFileInput.addEventListener('change', handleCosmeticsJsFileUpload);
  refs.cosmeticsPositionSaveBtn.addEventListener('click', () => {
    saveCosmeticsPosition();
    playClick();
  });
  refs.cosmeticsPositionCancelBtn.addEventListener('click', () => {
    closeCosmeticsPositionModal();
    playClick();
  });
  refs.cosmeticsCodeSaveBtn.addEventListener('click', () => {
    saveCosmeticsCode();
    playClick();
  });
  refs.cosmeticsCodeCancelBtn.addEventListener('click', () => {
    closeCosmeticsCodeModal();
    playClick();
  });
  refs.cosmeticsCodeImportBtn.addEventListener('click', () => {
    refs.cosmeticsJsFileInput.click();
    playClick();
  });
  refs.cosmeticsScaleInput.addEventListener('input', () => {
    const val = Number(refs.cosmeticsScaleInput.value) / 10;
    refs.cosmeticsScaleValue.textContent = val.toFixed(1);
    renderCosmeticsPositionPreview();
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
  const modals = document.querySelectorAll('.modal:not(.hidden)');
  const modal = modals.length > 0 ? modals[modals.length - 1] : null;
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
    const startBtn = refs.startGameBtn;
    const inviteBtn = refs.inviteBtn;
    const leaveBtn = refs.leaveRoomBtn;
    const btns = [startBtn, inviteBtn, leaveBtn].filter(b => list.indexOf(b) >= 0);
    const chips = list.filter(el => el.classList.contains('lobby-mode-chip'));
    const hostCfg = refs.hostConfigBtn && list.indexOf(refs.hostConfigBtn) >= 0 ? refs.hostConfigBtn : null;
    const selects = list.filter(el => el.tagName === 'SELECT');
    list = [...(gear ? [gear] : []), ...(hostCfg ? [hostCfg] : []), ...chips, ...selects, ...btns];
  }
  return list;
}

function getUiActivePlayer(pid) {
  const room = state.currentRoom;
  if (!room) return null;
  const id = pid || state.uiPadPlayerId || state.myPlayerId;
  return room.players.find(player => player.id === id) || null;
}

function getKbActivePlayer() {
  const room = state.currentRoom;
  if (!room) return null;
  const ids = state.localPlayerIds || [];
  if (ids.length === 0) return null;
  for (const id of ids) {
    const assigned = getGamepadAssignment(id);
    if (!(assigned >= 0)) return room.players.find(player => player.id === id) || null;
  }
  return undefined;
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
  uiFocusStamp.clear();
}

function renderUiFocuses() {
  const list = getFocusables();
  const focused = new Set();
  uiFocusMap.forEach((index, key) => {
    if (index < 0 || index >= list.length) return;
    const el = list[index];
    if (!el) return;
    const active = key === 'kb' ? getKbActivePlayer() : getUiActivePlayer(key);
    if (active === undefined) {
      uiFocusMap.delete(key);
      return;
    }
    focused.add(el);
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
  const colorByEl = new Map();
  uiFocusMap.forEach((index, key) => {
    const el = index >= 0 && index < list.length ? list[index] : null;
    if (!el || !focused.has(el)) return;
    const stamp = uiFocusStamp.get(key) || 0;
    const prev = colorByEl.get(el);
    if (!prev || stamp >= prev.stamp) colorByEl.set(el, { stamp, key });
  });
  colorByEl.forEach(({ key }, el) => {
    const active = key === 'kb' ? getKbActivePlayer() : getUiActivePlayer(key);
    if (active) el.style.setProperty('--focus-color', active.color);
  });
}

function setUiFocusIndex(index, pid) {
  const list = getFocusables();
  const key = focusKey(pid);
  uiFocusStamp.set(key, ++uiFocusSeq);
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
  if (index >= list.length) index = list.length - 1;
  const target = list[index];

  if (target.closest && target.closest('#cosmeticsModal')) {
    moveCosmeticsModalFocus(target, dx, dy, pid, list, index);
    return;
  }

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

function moveCosmeticsModalFocus(target, dx, dy, pid, list, index) {
  const cosmeticBoxes = Array.from(refs.cosmeticsList.querySelectorAll('.hat-option'));
  const renameBtns = cosmeticBoxes.map(b => b.querySelector('.cosmetics-item-actions button.secondary'));
  const deleteBtns = cosmeticBoxes.map(b => b.querySelector('.cosmetics-item-actions button.danger'));

  const boxIdx = cosmeticBoxes.indexOf(target);
  if (boxIdx >= 0) {
    if (dy > 0) {
      const idx = renameBtns[boxIdx] ? list.indexOf(renameBtns[boxIdx]) : -1;
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dy < 0 && boxIdx < 4) {
      const idx = list.indexOf(refs.cosmeticsModalCloseBtn);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dx !== 0) {
      const next = boxIdx + dx;
      if (next >= 0 && next < cosmeticBoxes.length) {
        const idx = list.indexOf(cosmeticBoxes[next]);
        if (idx >= 0) setUiFocusIndex(idx, pid);
      } else if (next >= cosmeticBoxes.length) {
        const idx = list.indexOf(refs.cosmeticsModalCloseBtn);
        if (idx >= 0) setUiFocusIndex(idx, pid);
      }
    }
    return;
  }

  const rIdx = renameBtns.indexOf(target);
  if (rIdx >= 0) {
    if (dy < 0) {
      const idx = list.indexOf(cosmeticBoxes[rIdx]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dx > 0 && deleteBtns[rIdx]) {
      const idx = list.indexOf(deleteBtns[rIdx]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dx < 0) {
      const idx = list.indexOf(cosmeticBoxes[rIdx]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    }
    return;
  }

  const dIdx = deleteBtns.indexOf(target);
  if (dIdx >= 0) {
    if (dy < 0) {
      const idx = list.indexOf(cosmeticBoxes[dIdx]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dx > 0) {
      const nextBox = dIdx + 1;
      if (nextBox < cosmeticBoxes.length) {
        const idx = list.indexOf(cosmeticBoxes[nextBox]);
        if (idx >= 0) setUiFocusIndex(idx, pid);
      } else {
        const idx = list.indexOf(refs.cosmeticsModalCloseBtn);
        if (idx >= 0) setUiFocusIndex(idx, pid);
      }
    } else if (dx < 0) {
      const idx = list.indexOf(renameBtns[dIdx]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    }
    return;
  }

  if (target === refs.cosmeticsCreateImgBtn) {
    if (dx > 0) {
      const idx = list.indexOf(refs.cosmeticsCreateCodeBtn);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dy > 0 && cosmeticBoxes.length > 0) {
      const idx = list.indexOf(cosmeticBoxes[0]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    }
    return;
  }
  if (target === refs.cosmeticsCreateCodeBtn) {
    if (dx < 0) {
      const idx = list.indexOf(refs.cosmeticsCreateImgBtn);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dy > 0 && cosmeticBoxes.length > 0) {
      const idx = list.indexOf(cosmeticBoxes[0]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    }
    return;
  }

  if (target === refs.cosmeticsModalCloseBtn) {
    if (dy > 0) {
      const idx = list.indexOf(refs.cosmeticsCreateImgBtn);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    } else if (dy < 0 && cosmeticBoxes.length > 0) {
      const idx = list.indexOf(cosmeticBoxes[0]);
      if (idx >= 0) setUiFocusIndex(idx, pid);
    }
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
    const baseRect = options[current].getBoundingClientRect();
    const baseX = baseRect.left + baseRect.width / 2;
    const baseY = baseRect.top + baseRect.height / 2;
    let best = -1;
    let bestScore = Infinity;
    options.forEach((opt, i) => {
      if (i === current) return;
      const r = opt.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      if (dy > 0 ? cy <= baseY + 2 : cy >= baseY - 2) return;
      const cx = r.left + r.width / 2;
      const score = Math.abs(cx - baseX) * 4 + Math.abs(cy - baseY);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best >= 0) {
      setUiFocusIndex(list.indexOf(options[best]), pid);
      return;
    }
    if (dy > 0) {
      setUiFocusIndex(options.length, pid);
    }
    return;
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
  if (el === refs.hostConfigBtn && pid) {
    const room = state.currentRoom;
    const acting = room ? room.players.find(player => player.id === pid) : null;
    if (!acting || !acting.host) {
      showLobbyAlert('Somente o host pode alterar as regras do jogo!', 'leave');
      return;
    }
  }
  if (el === refs.settingsGearBtn) {
    const id = pid || state.myPlayerId;
    const wasOpen = refs.settingsPanel.classList.contains('open');
    el.click();
    state.configTargetId = id;
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
  if (el.tagName === 'BUTTON' || el.type === 'color' || el.classList.contains('hat-option')) {
    if (el.type === 'color') {
      openColorPalette(el, pid);
      return;
    }
    if (el.classList.contains('hat-option') && el.closest('#cosmeticsModal')) {
      const cosmeticId = el.dataset.cosmeticId;
      if (cosmeticId) {
        const cosmetic = getAllCosmetics().find(c => c.id === cosmeticId);
        if (cosmetic) {
          const now = Date.now();
          const last = cosmeticsLastActivateId === cosmeticId ? cosmeticsLastActivateTime : 0;
          cosmeticsLastActivateId = cosmeticId;
          cosmeticsLastActivateTime = now;
          if (now - last < 350) {
            openCosmeticsPositionModal(cosmetic);
          } else {
            if (isEquipped(cosmetic.id)) {
              unequipCosmetic(cosmetic.id);
            } else {
              equipCosmetic(cosmetic.id, 0, 0, 1);
            }
            updatePlayerCosmeticsInRoom();
            renderCosmeticsList();
          }
          return;
        }
      }
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
  const allModals = document.querySelectorAll('.modal:not(.hidden)');
  const modal = allModals.length > 0 ? allModals[allModals.length - 1] : null;
  if (modal) {
    if (modal === refs.inviteModal) {
      closeInviteModal();
    } else if (modal === refs.hostConfigPanel) {
      closeHostConfig();
    } else if (modal === refs.padModal) {
      hidePadConnect();
    } else if (modal === refs.cosmeticsPositionModal) {
      closeCosmeticsPositionModal();
    } else if (modal === refs.cosmeticsCodeModal) {
      closeCosmeticsCodeModal();
    } else if (modal === refs.cosmeticsModal) {
      closeCosmeticsModal();
    } else if (modal === refs.confirmModal) {
      refs.confirmCancelBtn.click();
    } else {
      modal.classList.add('hidden');
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
  if (state.currentScreen === 'lobby' && refs.startGameBtn && !refs.startGameBtn.classList.contains('hidden')) {
    const list = getFocusables();
    const idx = list.indexOf(refs.startGameBtn);
    if (idx >= 0) {
      setUiFocusIndex(idx, pid);
      return;
    }
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
  openPadAssignModal(`Controle (Pad ${padIndex + 1}) detectado. Atribua a um jogador desta tela ou crie um novo.`);
}

export function showKeyboardConnect() {
  padConnectIndex = KEYBOARD_CONNECT;
  openPadAssignModal('Teclado detectado. Atribua a um jogador desta tela ou crie um novo.');
}

export function showTouchConnect() {
  padConnectIndex = TOUCH_CONNECT;
  openPadAssignModal('📱 Toque (Móvel) detectado. Atribua a um jogador desta tela ou crie um novo.');
}

// Abre a atribuição do Toque (Móvel) ao entrar/criar sala — somente se a opção
// "Usar botões de toque" continua ligada (nunca reativa nem pergunta se o
// usuário desligou) e se nenhum jogador local desta tela já tem o toque.
export function maybePromptTouchAssignment() {
  if (!getTouchEnabled()) return;
  if (state.currentScreen !== 'lobby') return;
  const room = state.currentRoom;
  if (!room || room.started) return;
  if (document.querySelector('.modal:not(.hidden)')) return;
  const alreadyAssigned = (state.localPlayerIds || []).some(
    id => getGamepadAssignment(id) === TOUCH_ASSIGNMENT
  );
  if (alreadyAssigned) return;
  showTouchConnect();
}

function openPadAssignModal(text) {
  refs.padModalText.textContent = text;
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
  uiFocusMap.delete('kb');
  renderUiFocuses();
}

export function assignPadToPlayer(playerId) {
  const index = padConnectIndex;
  if (index === -1) return;
  saveGamepadAssignment(
    playerId,
    index === KEYBOARD_CONNECT ? -1 : index === TOUCH_CONNECT ? TOUCH_ASSIGNMENT : index
  );
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
  if (index === -1) return;
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
  saveGamepadAssignment(
    result.player.id,
    index === KEYBOARD_CONNECT ? -1 : index === TOUCH_CONNECT ? TOUCH_ASSIGNMENT : index
  );
  hidePadConnect();
  spawnConfetti(30);
  renderLobby();
}

export function openInviteModal() {
  const room = state.currentRoom;
  if (!room) return;
  const base = net.netServerBase();
  const srvParam = base ? `&srv=${encodeURIComponent(base)}` : '';
  refs.inviteLinkInput.value = `${location.origin}${location.pathname}?room=${room.code}${srvParam}`;
  clearUiFocuses();
  refs.inviteModal.classList.remove('hidden');
}

function updateHostConfigHint() {
  if (!refs.hostConfigHostName) return;
  refs.hostConfigHostName.textContent = '';
  const room = state.currentRoom;
  const host = room && room.players.find(player => player.host);
  if (!host) return;
  const name = document.createElement('strong');
  name.className = 'host-config-host-name';
  name.style.color = host.color;
  name.textContent = host.nickname;
  refs.hostConfigHostName.appendChild(name);
}

let hostConfigWarningTimer = null;

function showHostConfigWarning(text) {
  const el = refs.hostConfigWarning;
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  if (hostConfigWarningTimer) clearTimeout(hostConfigWarningTimer);
  hostConfigWarningTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

export function openHostConfig() {
  if (!isHost()) return;
  if (!refs.hostConfigPanel) return;
  updateLobbyMapsTitle();
  updateHostConfigHint();
  clearUiFocuses();
  refs.hostConfigPanel.classList.remove('hidden');
  setUiFocusIndex(0, state.uiPadPlayerId);
}

export function closeHostConfig() {
  if (!refs.hostConfigPanel || refs.hostConfigPanel.classList.contains('hidden')) return;
  refs.hostConfigPanel.classList.add('hidden');
  clearUiFocuses();
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

function roomSettingsOf(room) {
  return { ...DEFAULT_ROOM_SETTINGS, ...(room && room.settings) };
}

function bindRoomRule(input, valueEl, suffix, resetBtn, key) {
  if (!input || !valueEl || !resetBtn) return;
  input.addEventListener('input', () => {
    const room = state.currentRoom;
    if (!room || !isHost()) return;
    room.settings = { ...roomSettingsOf(room), [key]: Number(input.value) };
    valueEl.textContent = input.value + suffix;
    saveRooms();
  });
  resetBtn.addEventListener('click', () => {
    const room = state.currentRoom;
    if (!room || !isHost()) return;
    room.settings = { ...roomSettingsOf(room), [key]: DEFAULT_ROOM_SETTINGS[key] };
    saveRooms();
    renderLobbyRules();
  });
}

function applyModeTheme(modeId) {
  const el = refs.screenLobby;
  if (!el) return;
  GAME_MODES.forEach(mode => el.classList.toggle('mode-' + mode.id, mode.id === modeId));
}

const HOW_TO_TEXT = {
  bomb: 'Encoste em outro jogador para passar a bomba. Após 15 segundos ela explode em quem a segura. Use o dash para escapar. Pegue as bolhas rosas "?" para ganhar poderes! Cada jogador pode escolher seu controle (ou teclado) na lista de jogadores acima.',
  egg: 'Um jogador começa com o ovo: cada 0,2s com ele vale 1 ponto — encoste em quem o segura para roubar! A cada 10 segundos, quem tiver MENOS pontos explode. O último vivo ganha mais pontos no placar. Bolhas rosas "?" dão poderes!',
  run: 'Um jogador é o MONSTRO! Corra e sobreviva aos 12 segundos — cada encostão do monstro custa um coração (você tem 2). Quem sobreviver ganha mais pontos; o monstro ganha mais quanto mais jogadores eliminar. Bolhas rosas "?" dão poderes!',
  war: 'GUERRA! Armas espalhadas pelo mapa — encoste nelas para pegar (cada uma tem balas e dano próprios). Use o botão para atirar na direção que você está olhando. Quando acabarem as armas e as balas, todo mundo parte para a PORRADA! Cada jogador tem 3 vidas; o último de pé vence.',
  rhythm: 'Pressione a direção das setas na ordem mostrada mais rápido que os outros. Após a sequência, o jogador com menos pontos sofre a consequência... Cada sequência fica mais rápida e longa! No teclado use: W, A, S, D ou as setas (CIMA, BAIXO, ESQUERDA, DIREITA). No controle use: O analógico ou as setas direcionais.'
};

function updateHowToText(modeId) {
  if (!refs.lobbyHowToText) return;
  refs.lobbyHowToText.textContent = HOW_TO_TEXT[modeId] || HOW_TO_TEXT.bomb;
}

function renderLobbyModes() {
  const room = state.currentRoom;
  if (!room || !refs.lobbyModeList) return;
  const current = GAME_MODES.some(m => m.id === room.mode) ? room.mode : GAME_MODES[0].id;
  const host = isHost();
  refs.lobbyModeList.innerHTML = '';
  GAME_MODES.forEach(mode => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'lobby-mode-chip' + (mode.id === current ? ' selected' : '');
    chip.style.setProperty('--chip-color', mode.color);
    chip.textContent = mode.name;
    chip.disabled = !host;
    chip.addEventListener('click', () => {
      const live = state.currentRoom;
      if (!isHost() || !live || live.mode === mode.id) return;
      playPop();
      live.mode = mode.id;
      saveRooms();
      renderLobbyModes();
      renderLobbyMaps();
      renderLobbyRules();
      renderUiFocuses();
      const newChip = refs.lobbyModeList && refs.lobbyModeList.querySelector('.lobby-mode-chip.selected');
      if (newChip) {
        newChip.classList.remove('mode-chip-pop');
        void newChip.offsetWidth;
        newChip.classList.add('mode-chip-pop');
      }
    });
    refs.lobbyModeList.appendChild(chip);
  });
  applyModeTheme(current);
  updateHowToText(current);
}

function drawMapPreview(canvasEl, map) {
  const ctx2d = canvasEl.getContext('2d');
  const w = canvasEl.width;
  const h = canvasEl.height;
  ctx2d.setTransform(1, 0, 0, 1, 0, 0);
  ctx2d.clearRect(0, 0, w, h);
  ctx2d.fillStyle = map.bg || '#bfe8ff';
  ctx2d.fillRect(0, 0, w, h);
  const scale = w / 1080;
  (map.platforms || []).forEach((platform, index) => {
    const colors = map.platformColors || ['#a3d97a', '#7fd3f2', '#f6c768', '#f2a1a1'];
    ctx2d.fillStyle = platform.color || colors[index % colors.length];
    ctx2d.fillRect(platform.x * scale, platform.y * scale, platform.width * scale, platform.height * scale);
    ctx2d.strokeStyle = '#222';
    ctx2d.lineWidth = Math.max(1, scale);
    ctx2d.strokeRect(platform.x * scale, platform.y * scale, platform.width * scale, platform.height * scale);
  });
  (map.spawns || []).forEach((spawn, index) => {
    ctx2d.beginPath();
    ctx2d.arc(spawn.x * scale, spawn.y * scale - 4, Math.max(3, 5 * scale), 0, Math.PI * 2);
    ctx2d.fillStyle = SPAWN_COLORS[index % SPAWN_COLORS.length];
    ctx2d.fill();
    ctx2d.lineWidth = Math.max(1, scale);
    ctx2d.strokeStyle = '#222';
    ctx2d.stroke();
  });
}

function buildLobbyMapGrid(container, maps, keyOf, isSelected, onToggle) {
  container.innerHTML = '';
  if (maps.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'lobby-map-empty';
    empty.textContent = 'Nenhum mapa aqui ainda. Crie mapas no Editor de Mapas!';
    container.appendChild(empty);
    return;
  }
  const rhythmMode = state.currentRoom && state.currentRoom.mode === 'rhythm';
  maps.forEach(map => {
    const key = keyOf(map);
    const locked = rhythmMode && !map.custom && !map.nativeRhythm;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'lobby-map-card' + (isSelected(key) && !locked ? ' selected' : '') + (locked ? ' locked' : '');
    card.disabled = !isHost();
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 216;
    canvasEl.height = 108;
    drawMapPreview(canvasEl, map);
    const label = document.createElement('span');
    label.className = 'lobby-map-name';
    label.textContent = locked ? '🔒 ' + map.name : map.name;
    card.appendChild(canvasEl);
    card.appendChild(label);
    card.addEventListener('click', () => {
      if (locked) {
        showLobbyAlert('Este mapa não está disponível no modo Ritmo!', 'leave');
        return;
      }
      onToggle(key);
    });
    container.appendChild(card);
  });
}

function updateLobbyMapsTitle() {
  if (!refs.lobbyMapsModeName) return;
  const room = state.currentRoom;
  const current = GAME_MODES.find(m => m.id === ((room && room.mode) || 'bomb')) || GAME_MODES[0];
  refs.lobbyMapsModeName.textContent = current ? current.name : '';
  refs.lobbyMapsModeName.style.color = current && current.color ? current.color : '';
}

function renderLobbyMaps() {
  const room = state.currentRoom;
  if (!room || !refs.lobbyNativeMaps || !refs.lobbyCustomMaps) return;
  updateLobbyMapsTitle();
  const all = getPlayableMaps(room.mode || 'bomb');
  const natives = all.filter(map => !map.custom);
  const customs = all.filter(map => map.custom);
  const selection = Array.isArray(room.mapSelection) ? room.mapSelection : null;
  const hasSelection = selection && selection.length > 0;
  const selectedKeys = new Set(selection || []);
  const isSelected = key => !hasSelection || selectedKeys.has(key);

  const toggle = key => {
    if (!isHost()) return;
    const live = state.currentRoom;
    if (!live) return;
    const pool = getPlayableMaps();
    const liveSelection = Array.isArray(live.mapSelection) ? live.mapSelection : null;
    const current = new Set(liveSelection && liveSelection.length > 0
      ? liveSelection
      : pool.map((m, i) => playableMapKey(m, i)));
    if (current.has(key)) current.delete(key);
    else current.add(key);
    live.mapSelection = current.size >= pool.length ? [] : [...current];
    saveRooms();
    renderLobbyMaps();
    renderUiFocuses();
  };

  buildLobbyMapGrid(refs.lobbyNativeMaps, natives, map => playableMapKey(map, natives.indexOf(map)), isSelected, toggle);
  buildLobbyMapGrid(refs.lobbyCustomMaps, customs, map => map.customId, isSelected, toggle);
  appendCustomImportButton();
  if (refs.selectAllMapsBtn) refs.selectAllMapsBtn.disabled = !isHost();
}

function appendCustomImportButton() {
  if (!refs.lobbyCustomMaps) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lobby-map-import';
  btn.textContent = '📂 Importar mapa';
  btn.disabled = !isHost();
  if (!isHost()) btn.title = 'Somente o host pode importar mapas.';
  btn.addEventListener('click', () => {
    lobbyMapImportInput.click();
  });
  refs.lobbyCustomMaps.appendChild(btn);
}

function clampMapNumber(value, min, max) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

function sanitizeLobbyPlatform(raw) {
  const width = clampMapNumber(raw.width, 8, 1080);
  const height = clampMapNumber(raw.height, 8, 540);
  return {
    x: clampMapNumber(raw.x, 0, 1080 - width),
    y: clampMapNumber(raw.y, 0, 540 - height),
    width,
    height,
    color: typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : '#a3d97a'
  };
}

function sanitizeLobbySpawns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 4).map(spawn => ({
    x: clampMapNumber(spawn && spawn.x, 0, 1080),
    y: clampMapNumber(spawn && spawn.y, 0, 540)
  }));
}

function handleLobbyMapImport(event) {
  if (!isHost()) {
    showLobbyAlert('Somente o host pode importar mapas!', 'leave');
    return;
  }
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (error) {
      showLobbyAlert('Arquivo inválido (não é um mapa do Party Game).', 'leave');
      return;
    }
    if (!data || data.format !== 'partygame-map' || !Array.isArray(data.platforms)) {
      showLobbyAlert('Arquivo inválido (formato desconhecido).', 'leave');
      return;
    }
    const rawModes = Array.isArray(data.mode) ? data.mode : [typeof data.mode === 'string' ? data.mode : 'bomb'];
    const modes = [...new Set(rawModes.filter(m => typeof m === 'string'))]
      .filter(m => GAME_MODES.some(g => g.id === m));
    if (modes.length === 0) {
      showLobbyAlert('Este arquivo é para um modo que não é suportado nesta versão.', 'leave');
      return;
    }
    if (data.platforms.length > MAX_MAP_PLATFORMS) {
      showLobbyAlert(`O mapa tem ${data.platforms.length} plataformas (máximo ${MAX_MAP_PLATFORMS}).`, 'leave');
      return;
    }

    const musicImported = data.music && typeof data.music === 'object' ? data.music : { type: 'default' };
    let music = { type: 'default' };
    if (musicImported.type === 'native' && typeof musicImported.track === 'string') {
      music = { type: 'native', track: musicImported.track };
    } else if (musicImported.type === 'custom' && typeof musicImported.data === 'string' && musicImported.data.startsWith('data:audio')) {
      const id = uuid();
      try {
        putCustomMusic(id, { name: musicImported.name || 'Música importada', data: musicImported.data });
      } catch (error) {
        showLobbyAlert('Espaço insuficiente para a música (o resto do mapa foi importado).', 'leave');
      }
      music = { type: 'custom', id, name: musicImported.name || 'Música importada' };
    } else if (musicImported.type === 'custom') {
      music = { type: 'custom', id: null, name: musicImported.name || null };
    }

    const map = {
      id: uuid(),
      name: (typeof data.name === 'string' && data.name.trim()) || 'Mapa importado',
      mode: modes,
      bg: typeof data.bg === 'string' && /^#[0-9a-f]{6}$/i.test(data.bg) ? data.bg : '#bfe8ff',
      platforms: data.platforms.map(sanitizeLobbyPlatform),
      spawns: sanitizeLobbySpawns(data.spawns),
      music,
      updatedAt: Date.now()
    };
    saveCustomMaps([...loadCustomMaps(), map]);
    renderLobbyMaps();
    renderUiFocuses();
    showLobbyAlert(`Mapa "${map.name}" importado!`, 'host');
  };
  reader.onerror = () => showLobbyAlert('Falha ao ler o arquivo.', 'leave');
  reader.readAsText(file);
}

function renderLobbyRules() {
  const room = state.currentRoom;
  if (!room || !refs.powerupFreqInput) return;
  const settings = roomSettingsOf(room);
  const host = isHost();
  refs.powerupFreqInput.value = settings.powerupFrequency;
  refs.powerupFreqValue.textContent = `${settings.powerupFrequency}%`;
  refs.playerSpeedInput.value = settings.playerSpeed;
  refs.playerSpeedValue.textContent = `${settings.playerSpeed}%`;
  refs.scoreLimitInput.value = settings.scoreLimit;
  refs.scoreLimitValue.textContent = `${settings.scoreLimit} pts`;
  const puEnabled = ['bomb', 'egg', 'run'].includes(room.mode || 'bomb');
  refs.powerupFreqInput.disabled = !host || !puEnabled;
  refs.resetPowerupFreqBtn.disabled = !host || !puEnabled;
  const puRow = refs.powerupFreqInput.closest('.lobby-rule-line');
  if (puRow) puRow.classList.toggle('pu-locked', host && !puEnabled);
  refs.playerSpeedInput.disabled = !host;
  refs.scoreLimitInput.disabled = !host;
  refs.resetPowerupFreqBtn.disabled = !host;
  refs.resetPlayerSpeedBtn.disabled = !host;
  refs.resetScoreLimitBtn.disabled = !host;
}

function primeLobbyFocus() {
  const list = getFocusables();
  const idx = list.indexOf(refs.startGameBtn);
  if (idx < 0) return;
  uiFocusMap.set('kb', idx);
  for (const id of state.localPlayerIds || []) {
    uiFocusMap.set(id, idx);
  }
  renderUiFocuses();
}

export function showScreen(name) {
  state.currentScreen = name;
  clearUiFocuses();
  refs.screenWelcome.classList.toggle('hidden', name !== 'welcome');
  refs.screenLobby.classList.toggle('hidden', name !== 'lobby');
  refs.screenGame.classList.toggle('hidden', name !== 'game');
  if (refs.screenMapEditor) {
    refs.screenMapEditor.classList.toggle('hidden', name !== 'mapEditor');
  }
  window.dispatchEvent(new CustomEvent('bombparty:screenchange', { detail: { screen: name } }));
  if (name !== 'lobby') {
    closeSettingsPanel();
    closeHatPicker();
    closeHostConfig();
    hidePadConnect();
  }
  if (name !== 'game') {
    hideResultsOverlay();
  }
  updateTouchVisibility();
  updateDonateVisibility();
  if (name === 'lobby') primeLobbyFocus();
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
  const touchOn = getTouchEnabled();
  const keyboardOption = document.createElement('option');
  keyboardOption.value = '-1';
  keyboardOption.textContent = 'Teclado';
  ctrlSelect.appendChild(keyboardOption);
  if (touchOn) {
    const touchOption = document.createElement('option');
    touchOption.value = String(TOUCH_ASSIGNMENT);
    touchOption.textContent = '📱 Toque (Móvel)';
    ctrlSelect.appendChild(touchOption);
  }
  pads.forEach(pad => {
    const opt = document.createElement('option');
    opt.value = String(pad.index);
    opt.textContent = `Pad ${pad.index + 1} · ${gamepadName(pad, pad.index)}`;
    ctrlSelect.appendChild(opt);
  });
  ctrlSelect.value =
    assigned === TOUCH_ASSIGNMENT && touchOn ? String(TOUCH_ASSIGNMENT)
      : padConnected ? String(assigned) : '-1';
  ctrlSelect.disabled = !canAssign;
  ctrlSelect.addEventListener('change', () => {
    const chosen = Number(ctrlSelect.value);
    const room = state.currentRoom;
    const canBeTaken = chosen >= 0 || chosen === TOUCH_ASSIGNMENT;
    if (room && canBeTaken) {
      const takenBy = room.players.find(other =>
        other.id !== player.id && getGamepadAssignment(other.id) === chosen
      );
      if (takenBy) {
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
  refs.hatBtn.textContent = `Escolher Cosmético · ${getHatById(player.hat).name}`;
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
    if (!label) return;
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
  if (refs.hostConfigBtn) refs.hostConfigBtn.classList.toggle('hidden', !isHost());
  if (padConnectIndex !== -1 && !refs.padModal.classList.contains('hidden')) populatePadAssignList();

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

      const canAssign = player.id === state.myPlayerId || isHost() || (state.localPlayerIds || []).includes(player.id);
      item.appendChild(buildControlAssign(player, connectedGamepads(), canAssign));

      refs.playerList.appendChild(item);
    });

  renderedPlayerIds = new Set(room.players.map(p => p.id));

  refs.lobbyNotice.textContent = '';
  refs.startGameBtn.disabled = !isHost() || room.players.length < 2;

  renderLobbyModes();
  renderLobbyMaps();
  renderLobbyRules();
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
  const gs = state.gameState;
  if (gs && gs.mode === 'rhythm') {
    return 'Ritmo: W/A/S/D ou setas ← ↑ ↓ →';
  }
  const actionName = gs && gs.mode === 'war' ? 'Tiro/Soco' : 'Dash';
  const ctrl = getEffectiveControls(playerId);
  if (!ctrl) return `Mover: A/D, Pular: Espaço, ${actionName}: Shift`;
  const labelKey = key => {
    if (key === ' ') return 'Espaço';
    if (/^f\d{1,2}$/.test(key)) return key.toUpperCase();
    return key.charAt(0).toUpperCase() + key.slice(1);
  };
  return `Mover: ${labelKey(ctrl.left)}/${labelKey(ctrl.right)}, Pular: ${labelKey(ctrl.jump)}, ${actionName}: ${labelKey(ctrl.dash)}`;
}

export function formatGamepadControls() {
  const gs = state.gameState;
  if (gs && gs.mode === 'rhythm') {
    return 'Ritmo: analógico esquerdo ou direcionais (dpad)';
  }
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

let cosmeticsPositionTarget = null;
let cosmeticsPositionDragging = false;
let cosmeticsPositionDragStart = { x: 0, y: 0 };
let cosmeticsPositionOffsetStart = { x: 0, y: 0 };
let cosmeticsLastActivateId = null;
let cosmeticsLastActivateTime = 0;

export function pollCosmeticsPositionStick(axes2, axes3) {
  if (!cosmeticsPositionTarget) return;
  const deadzone = 0.15;
  const speed = 2.8;
  const dx = Math.abs(axes2) > deadzone ? axes2 * speed : 0;
  const dy = Math.abs(axes3) > deadzone ? axes3 * speed : 0;
  if (dx === 0 && dy === 0) return;
  cosmeticsPositionTarget.offsetX = (cosmeticsPositionTarget.offsetX || 0) + dx;
  cosmeticsPositionTarget.offsetY = (cosmeticsPositionTarget.offsetY || 0) + dy;
  renderCosmeticsPositionPreview();
}

function openCosmeticsModal() {
  refs.cosmeticsModal.classList.remove('hidden');
  renderCosmeticsList();
  const firstBox = refs.cosmeticsList.querySelector('.hat-option');
  if (firstBox) {
    const list = getFocusables();
    const idx = list.indexOf(firstBox);
    if (idx >= 0) {
      const pid = state.uiPadPlayerId || state.myPlayerId;
      setUiFocusIndex(idx, pid);
    }
  }
}

function closeCosmeticsModal() {
  refs.cosmeticsModal.classList.add('hidden');
}

function renderCosmeticsList() {
  const all = getAllCosmetics();
  refs.cosmeticsList.innerHTML = '';
  if (all.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'setting-hint';
    empty.textContent = 'Nenhum cosmético criado. Crie um acima!';
    refs.cosmeticsList.appendChild(empty);
    return;
  }
  const me = getSettingsPlayer();
  const playerColor = me ? me.color : '#ff6b6b';
  all.forEach(cosmetic => {
    const box = document.createElement('div');
    box.tabIndex = 0;
    box.dataset.cosmeticId = cosmetic.id;
    const equipped = isEquipped(cosmetic.id);
    box.className = 'hat-option' + (equipped ? ' selected' : '');
    box.title = cosmetic.name;

    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    drawCosmeticPreview(canvas.getContext('2d'), cosmetic, playerColor);

    const label = document.createElement('span');
    label.className = 'hat-option-name';
    label.textContent = cosmetic.name;

    box.appendChild(canvas);
    box.appendChild(label);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'cosmetics-item-actions';

    const renameBtn = document.createElement('button');
    renameBtn.type = 'button';
    renameBtn.className = 'secondary';
    renameBtn.textContent = 'Renomear';
    renameBtn.title = 'Renomear';
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newName = prompt('Novo nome para o cosmético:', cosmetic.name);
      if (newName && newName.trim()) {
        updateCosmetic(cosmetic.id, { name: newName.trim() });
        renderCosmeticsList();
      }
    });
    actionsRow.appendChild(renameBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'danger';
    deleteBtn.textContent = '\u2715';
    deleteBtn.title = 'Excluir';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const typeLabel = cosmetic.type === 'image' ? 'imagem' : 'código';
      showConfirm(`Tem certeza que deseja excluir o cosmético "${cosmetic.name}" (${typeLabel})?`, () => {
        unequipCosmetic(cosmetic.id);
        removeCosmetic(cosmetic.id);
        updatePlayerCosmeticsInRoom();
        renderCosmeticsList();
      });
    });
    actionsRow.appendChild(deleteBtn);

    box.appendChild(actionsRow);

    let clickTimer = null;
    box.addEventListener('click', () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        openCosmeticsPositionModal(cosmetic);
      } else {
        clickTimer = setTimeout(() => {
          clickTimer = null;
          if (isEquipped(cosmetic.id)) {
            unequipCosmetic(cosmetic.id);
            updatePlayerCosmeticsInRoom();
          } else {
            equipCosmetic(cosmetic.id, 0, 0, 1);
            updatePlayerCosmeticsInRoom();
          }
          renderCosmeticsList();
        }, 250);
      }
      playClick();
    });

    refs.cosmeticsList.appendChild(box);
  });
}

function updatePlayerCosmeticsInRoom() {
  const equipped = getEquippedList();
  const room = state.currentRoom;
  if (!room) return;
  const target = getSettingsPlayer();
  if (!target || !room.players.includes(target)) return;
  target.cosmetics = equipped;
  saveRooms();
}

async function handleCosmeticsFileUpload(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    const dataUrl = await processImageFile(file);
    const name = file.name.replace(/\.[^.]+$/, '') || 'Imagem';
    const cosmetic = createCosmeticImage(name, dataUrl);
    equipCosmetic(cosmetic.id, 0, 0, 1);
    updatePlayerCosmeticsInRoom();
    renderCosmeticsList();
    openCosmeticsPositionModal(cosmetic);
  } catch (e) {
    showNotice(refs.cosmeticsList, e.message);
  }
}

function handleCosmeticsJsFileUpload(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const code = reader.result;
    const name = file.name.replace(/\.[^.]+$/, '') || 'Código';
    openCosmeticsCodeModal(null, code, name);
  };
  reader.readAsText(file);
}

function openCosmeticsPositionModal(cosmetic) {
  cosmeticsPositionTarget = cosmetic;
  refs.cosmeticsPositionModal.classList.remove('hidden');
  refs.cosmeticsScaleInput.value = Math.round((cosmetic.scale || 1) * 10);
  refs.cosmeticsScaleValue.textContent = (cosmetic.scale || 1).toFixed(1);
  renderCosmeticsPositionPreview();
  setupPositionDrag();
}

function closeCosmeticsPositionModal() {
  refs.cosmeticsPositionModal.classList.add('hidden');
  cosmeticsPositionTarget = null;
}

function saveCosmeticsPosition() {
  if (!cosmeticsPositionTarget) return;
  const scale = Number(refs.cosmeticsScaleInput.value) / 10;
  const equipped = getEquippedList();
  const entry = equipped.find(e => e.id === cosmeticsPositionTarget.id);
  if (entry) {
    entry.offsetX = cosmeticsPositionTarget.offsetX || 0;
    entry.offsetY = cosmeticsPositionTarget.offsetY || 0;
    entry.scale = scale;
    saveEquippedCosmetics(equipped);
  }
  updatePlayerCosmeticsInRoom();
  closeCosmeticsPositionModal();
  renderCosmeticsList();
}

function renderCosmeticsPositionPreview() {
  const canvas = refs.cosmeticsPositionCanvas;
  const ctx = canvas.getContext('2d');
  const cosmetic = cosmeticsPositionTarget;
  if (!cosmetic) return;

  const scale = Number(refs.cosmeticsScaleInput.value) / 10;
  const preview = {
    ...cosmetic,
    offsetX: cosmetic.offsetX || 0,
    offsetY: cosmetic.offsetY || 0,
    scale
  };

  drawCosmeticPreview(ctx, preview, '#ff6b6b', 0, 192);
}

function setupPositionDrag() {
  const canvas = refs.cosmeticsPositionCanvas;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const onDown = (e) => {
    if (!cosmeticsPositionTarget) return;
    e.preventDefault();
    cosmeticsPositionDragging = true;
    const pos = getPos(e);
    cosmeticsPositionDragStart = pos;
    cosmeticsPositionOffsetStart = {
      x: cosmeticsPositionTarget.offsetX || 0,
      y: cosmeticsPositionTarget.offsetY || 0
    };
  };

  const onMove = (e) => {
    if (!cosmeticsPositionDragging || !cosmeticsPositionTarget) return;
    e.preventDefault();
    const pos = getPos(e);
    const dx = (pos.x - cosmeticsPositionDragStart.x) * 0.5;
    const dy = (pos.y - cosmeticsPositionDragStart.y) * 0.5;
    cosmeticsPositionTarget.offsetX = cosmeticsPositionOffsetStart.x + dx;
    cosmeticsPositionTarget.offsetY = cosmeticsPositionOffsetStart.y + dy;
    renderCosmeticsPositionPreview();
  };

  const onUp = () => {
    cosmeticsPositionDragging = false;
  };

  canvas.removeEventListener('mousedown', canvas._cosDown);
  canvas.removeEventListener('mousemove', canvas._cosMove);
  canvas.removeEventListener('mouseup', canvas._cosUp);
  canvas.removeEventListener('touchstart', canvas._cosTouchDown);
  canvas.removeEventListener('touchmove', canvas._cosTouchMove);
  canvas.removeEventListener('touchend', canvas._cosUp);

  canvas._cosDown = onDown;
  canvas._cosMove = onMove;
  canvas._cosUp = onUp;
  canvas._cosTouchDown = (e) => { e.preventDefault(); onDown(e); };
  canvas._cosTouchMove = (e) => { e.preventDefault(); onMove(e); };

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', canvas._cosTouchDown, { passive: false });
  canvas.addEventListener('touchmove', canvas._cosTouchMove, { passive: false });
  canvas.addEventListener('touchend', onUp);
}

let editingCosmeticId = null;
let editingCosmeticName = null;

function openCosmeticsCodeModal(cosmetic, importedCode, importedName) {
  editingCosmeticId = cosmetic ? cosmetic.id : null;
  editingCosmeticName = importedName || null;
  refs.cosmeticsCodeModal.classList.remove('hidden');
  refs.cosmeticsCodeInput.value = cosmetic ? cosmetic.code : (importedCode || '');
  renderCosmeticsCodePreview();
}

function closeCosmeticsCodeModal() {
  refs.cosmeticsCodeModal.classList.add('hidden');
  editingCosmeticId = null;
}

function saveCosmeticsCode() {
  const code = refs.cosmeticsCodeInput.value.trim();
  if (!code) {
    showNotice(refs.cosmeticsCodeInput, 'Código não pode estar vazio.');
    return;
  }
  if (editingCosmeticId) {
    updateCosmetic(editingCosmeticId, { code });
  } else {
    const name = editingCosmeticName || `Código ${getAllCosmetics().length + 1}`;
    const cosmetic = createCosmeticCode(name, code);
    equipCosmetic(cosmetic.id, 0, 0, 1);
    updatePlayerCosmeticsInRoom();
  }
  editingCosmeticName = null;
  closeCosmeticsCodeModal();
  renderCosmeticsList();
}

function renderCosmeticsCodePreview() {
  const canvas = refs.cosmeticsCodePreviewCanvas;
  const ctx = canvas.getContext('2d');
  const code = refs.cosmeticsCodeInput.value;
  ctx.clearRect(0, 0, 96, 96);

  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;
  const cx = 48;
  const py = 86;
  const x = cx - w / 2;
  const y = py - h;

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(cx, py + 3, w * 0.55, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h - 4);
  ctx.arcTo(x + 15, y + h - 4, x + 15, y + h + 5, 4);
  ctx.arcTo(x + 15, y + h + 5, x + 4, y + h + 5, 4);
  ctx.arcTo(x + 4, y + h + 5, x + 4, y + h - 4, 4);
  ctx.arcTo(x + 4, y + h - 4, x + 8, y + h - 4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w - 11, y + h - 4);
  ctx.arcTo(x + w - 4, y + h - 4, x + w - 4, y + h + 5, 4);
  ctx.arcTo(x + w - 4, y + h + 5, x + w - 15, y + h + 5, 4);
  ctx.arcTo(x + w - 15, y + h + 5, x + w - 15, y + h - 4, 4);
  ctx.arcTo(x + w - 15, y + h - 4, x + w - 11, y + h - 4, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.moveTo(x + 12, y);
  ctx.arcTo(x + w, y, x + w, y + h, 12);
  ctx.arcTo(x + w, y + h, x, y + h, 12);
  ctx.arcTo(x, y + h, x, y, 12);
  ctx.arcTo(x, y, x + w, y, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.stroke();

  if (code) {
    try {
      const wrapped = `${code}\nif(typeof draw==='function')draw(ctx,w,h,color,time,player);`;
      const fn = new Function('ctx', 'w', 'h', 'color', 'time', 'player', wrapped);
      fn(ctx, w, h, '#ff6b6b', 0, { x: cx, y: py, vx: 0, vy: 0, onGround: true, alive: true, hasBomb: false });
    } catch (e) {}
  }
}
