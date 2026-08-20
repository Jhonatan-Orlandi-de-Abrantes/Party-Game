import { state, saveLocalPlayers } from './state.js';
import {
  STORAGE_KEY,
  INPUT_PREFIX,
  GAME_STATE_PREFIX,
  GAMEPAD_PREFIX,
  FPS_ENABLED_PREFIX,
  FPS_COLOR_PREFIX,
  FPS_LIMIT_PREFIX,
  RESOLUTION_PREFIX,
  KEYS_PREFIX,
  HAT_PREFIX,
  MUSIC_VOLUME_KEY,
  SFX_VOLUME_KEY,
  DEVICE_ID_KEY,
  TOUCH_ENABLED_PREFIX,
  TOUCH_STYLE_PREFIX,
  TOUCH_LAYOUT_PREFIX,
  PIX_PRESETS_KEY,
  COSMETICS_KEY,
  COSMETICS_SYNC_KEY
} from './constants.js';

export function loadRooms() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

export function saveRooms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rooms));
}

export function syncRooms() {
  state.rooms = loadRooms();
  state.currentRoom = state.myRoomCode ? state.rooms.find(room => room.code === state.myRoomCode) : null;
  if (!state.currentRoom) {
    state.myRoomCode = null;
    state.myPlayerId = null;
    state.localPlayerIds = [];
    saveLocalPlayers([]);
    sessionStorage.removeItem('bombPartyRoom');
    sessionStorage.removeItem('bombPartyPlayerId');
  }
}

export function gameKey(code) {
  return GAME_STATE_PREFIX + code;
}

export function readGameState() {
  if (!state.myRoomCode) return null;
  try {
    const raw = localStorage.getItem(gameKey(state.myRoomCode));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function publishGameState() {
  if (!state.gameState || !state.myRoomCode) return;
  try {
    localStorage.setItem(gameKey(state.myRoomCode), JSON.stringify(state.gameState));
  } catch (error) {}
}

export function writePlayerInput(playerId, data) {
  localStorage.setItem(INPUT_PREFIX + playerId, data);
}

export function readPlayerInput(playerId) {
  return localStorage.getItem(INPUT_PREFIX + playerId);
}

export function removePlayerInput(playerId) {
  localStorage.removeItem(INPUT_PREFIX + playerId);
}

function deviceKey(prefix, playerId) {
  return prefix + 'device:' + getDeviceId();
}

function readPref(prefix, playerId) {
  return localStorage.getItem(prefix + playerId) ?? localStorage.getItem(deviceKey(prefix, playerId));
}

function writePref(prefix, playerId, value) {
  localStorage.setItem(prefix + playerId, value);
  localStorage.setItem(deviceKey(prefix, playerId), value);
}

export function saveGamepadAssignment(playerId, index) {
  writePref(GAMEPAD_PREFIX, playerId, String(index));
}

export function getGamepadAssignment(playerId) {
  const value = readPref(GAMEPAD_PREFIX, playerId);
  return value === null ? -1 : Number(value);
}

export function saveFpsEnabled(playerId, enabled) {
  writePref(FPS_ENABLED_PREFIX, playerId, enabled ? '1' : '0');
}

export function getFpsEnabled(playerId) {
  return readPref(FPS_ENABLED_PREFIX, playerId) === '1';
}

export function saveFpsColor(playerId, color) {
  writePref(FPS_COLOR_PREFIX, playerId, color);
}

export function getFpsColor(playerId) {
  return readPref(FPS_COLOR_PREFIX, playerId) || '#ffe066';
}

export function saveFpsLimit(playerId, value) {
  writePref(FPS_LIMIT_PREFIX, playerId, String(value));
}

export function getFpsLimit(playerId) {
  const value = Number(readPref(FPS_LIMIT_PREFIX, playerId));
  return value > 0 ? Math.min(240, Math.max(5, value)) : 0;
}

export function saveResolution(playerId, value) {
  writePref(RESOLUTION_PREFIX, playerId, String(value));
}

export function getResolution(playerId) {
  const value = Number(readPref(RESOLUTION_PREFIX, playerId));
  return value > 0 ? Math.min(1, Math.max(0.05, value)) : 1;
}

export function saveCustomKeys(playerId, keys) {
  writePref(KEYS_PREFIX, playerId, JSON.stringify(keys));
}

export function getCustomKeys(playerId) {
  try {
    const raw = readPref(KEYS_PREFIX, playerId);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function resetCustomKeys(playerId) {
  localStorage.removeItem(KEYS_PREFIX + playerId);
  localStorage.removeItem(deviceKey(KEYS_PREFIX, playerId));
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function saveHat(deviceId, hatId) {
  localStorage.setItem(HAT_PREFIX + deviceId, hatId);
}

export function getHat(deviceId) {
  return localStorage.getItem(HAT_PREFIX + deviceId) || 'none';
}

export function getMusicVolume() {
  const value = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
  return isNaN(value) ? 70 : Math.min(100, Math.max(0, value));
}

export function setMusicVolume(value) {
  localStorage.setItem(MUSIC_VOLUME_KEY, String(value));
}

export function getSfxVolume() {
  const value = Number(localStorage.getItem(SFX_VOLUME_KEY));
  return isNaN(value) ? 90 : Math.min(100, Math.max(0, value));
}

export function setSfxVolume(value) {
  localStorage.setItem(SFX_VOLUME_KEY, String(value));
}

function touchDeviceKey(prefix) {
  return prefix + 'device:' + getDeviceId();
}

export function getTouchEnabled() {
  const value = localStorage.getItem(touchDeviceKey(TOUCH_ENABLED_PREFIX));
  if (value === null) {
    return typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
  }
  return value === '1';
}

export function saveTouchEnabled(enabled) {
  localStorage.setItem(touchDeviceKey(TOUCH_ENABLED_PREFIX), enabled ? '1' : '0');
}

export function getTouchStyle() {
  const value = localStorage.getItem(touchDeviceKey(TOUCH_STYLE_PREFIX));
  return value === 'arrows' ? 'arrows' : 'analog';
}

export function saveTouchStyle(style) {
  localStorage.setItem(touchDeviceKey(TOUCH_STYLE_PREFIX), style === 'analog' ? 'analog' : 'arrows');
}

export function getTouchLayout() {
  try {
    return JSON.parse(localStorage.getItem(touchDeviceKey(TOUCH_LAYOUT_PREFIX))) || null;
  } catch (error) {
    return null;
  }
}

export function saveTouchLayout(layout) {
  localStorage.setItem(touchDeviceKey(TOUCH_LAYOUT_PREFIX), JSON.stringify(layout));
}

export function resetTouchLayout() {
  localStorage.removeItem(touchDeviceKey(TOUCH_LAYOUT_PREFIX));
}

export function getPixPresets() {
  const raw = localStorage.getItem(PIX_PRESETS_KEY);
  if (!raw) return [1, 3, 5];
  const values = raw
    .split(',')
    .map(part => parseFloat(part.trim().replace(',', '.')))
    .filter(value => !isNaN(value) && value > 0);
  return values.length > 0 ? values : [1, 3, 5];
}

export function savePixPresets(value) {
  localStorage.setItem(PIX_PRESETS_KEY, value);
}

export function loadCosmetics() {
  try {
    return JSON.parse(localStorage.getItem(COSMETICS_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

export function saveCosmetics(store) {
  localStorage.setItem(COSMETICS_KEY, JSON.stringify(store));
  localStorage.setItem(COSMETICS_SYNC_KEY, String(Date.now()));
}

export function getCosmetic(id) {
  const store = loadCosmetics();
  return store[id] || null;
}

export function saveCosmetic(cosmetic) {
  const store = loadCosmetics();
  store[cosmetic.id] = cosmetic;
  saveCosmetics(store);
  return cosmetic;
}

export function deleteCosmetic(id) {
  const store = loadCosmetics();
  delete store[id];
  saveCosmetics(store);
}

export function getEquippedCosmetics() {
  try {
    const raw = localStorage.getItem('bombPartyEquipped_' + getDeviceId());
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

export function saveEquippedCosmetics(list) {
  localStorage.setItem('bombPartyEquipped_' + getDeviceId(), JSON.stringify(list));
}

export function onCosmeticsSync(callback) {
  window.addEventListener('storage', (e) => {
    if (e.key === COSMETICS_SYNC_KEY) callback();
  });
}
