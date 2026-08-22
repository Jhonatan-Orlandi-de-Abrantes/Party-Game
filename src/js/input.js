import { state, getControlsForPlayer } from './state.js';
import { writePlayerInput, readPlayerInput, getGamepadAssignment, getCustomKeys } from './storage.js';

const AXIS_DEADZONE = 0.4;

const touchKeys = { left: false, right: false, jump: false, dash: false };

export function setTouchInput(action, active) {
  if (!(action in touchKeys)) return;
  touchKeys[action] = !!active;
}

export function getEffectiveControls(playerId) {
  const base = getControlsForPlayer(playerId);
  if (!base) return null;
  const custom = getCustomKeys(playerId);
  if (!custom) return base;
  return {
    left: custom.left || base.left,
    right: custom.right || base.right,
    jump: custom.jump || base.jump,
    dash: custom.dash || base.dash
  };
}

function readGamepad(index) {
  if (index < 0 || typeof navigator === 'undefined' || !navigator.getGamepads) return null;
  try {
    const gp = navigator.getGamepads()[index];
    if (!gp) return null;
    const btn = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const axis = i => gp.axes[i] || 0;
    return {
      left: axis(0) < -AXIS_DEADZONE || btn(14),
      right: axis(0) > AXIS_DEADZONE || btn(15),
      jump: btn(0) || btn(12),
      dash: btn(7) || btn(1) || btn(6)
    };
  } catch (error) {
    return null;
  }
}

function readGamepadDirs(index) {
  if (index < 0 || typeof navigator === 'undefined' || !navigator.getGamepads) return null;
  try {
    const gp = navigator.getGamepads()[index];
    if (!gp) return null;
    const btn = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes || [];
    return {
      left: ax[0] < -AXIS_DEADZONE || btn(14),
      right: ax[0] > AXIS_DEADZONE || btn(15),
      up: ax[1] < -AXIS_DEADZONE || btn(12),
      down: ax[1] > AXIS_DEADZONE || btn(13)
    };
  } catch (error) {
    return null;
  }
}

export function readRhythmDirs(includeKeyboard, playerId) {
  const dirs = { left: false, right: false, up: false, down: false };
  if (includeKeyboard) {
    const k = state.keysPressed;
    dirs.left = !!(k['arrowleft'] || k['a']);
    dirs.right = !!(k['arrowright'] || k['d']);
    dirs.up = !!(k['arrowup'] || k['w']);
    dirs.down = !!(k['arrowdown'] || k['s']);
  }
  const gd = readGamepadDirs(getGamepadAssignment(playerId));
  if (gd) {
    dirs.left = dirs.left || gd.left;
    dirs.right = dirs.right || gd.right;
    dirs.up = dirs.up || gd.up;
    dirs.down = dirs.down || gd.down;
  }
  return dirs;
}

export function connectedGamepads() {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
  try {
    return Array.from(navigator.getGamepads()).filter(Boolean);
  } catch (error) {
    return [];
  }
}

export function gamepadName(pad, index) {
  let name = String((pad && pad.id) || '').split('(')[0].trim();
  if (!name) name = `Gamepad ${index + 1}`;
  return name;
}

const lastPublishedByPlayer = new Map();

export function publishPlayerInput(playerId, includeKeyboard) {
  if (!state.myRoomCode || !playerId) return;
  const ctrl = getEffectiveControls(playerId);
  if (!ctrl) return;
  const keyDown = name => includeKeyboard && !!state.keysPressed[String(name).toLowerCase()];
  const keys = {
    left: keyDown(ctrl.left),
    right: keyDown(ctrl.right),
    jump: keyDown(ctrl.jump),
    dash: keyDown(ctrl.dash)
  };
  const gp = readGamepad(getGamepadAssignment(playerId));
  if (gp) {
    keys.left = keys.left || gp.left;
    keys.right = keys.right || gp.right;
    keys.jump = keys.jump || gp.jump;
    keys.dash = keys.dash || gp.dash;
  }
  if (playerId === state.myPlayerId) {
    keys.left = keys.left || touchKeys.left;
    keys.right = keys.right || touchKeys.right;
    keys.jump = keys.jump || touchKeys.jump;
    keys.dash = keys.dash || touchKeys.dash;
  }
  keys.rhythm = readRhythmDirs(includeKeyboard, playerId);
  const data = JSON.stringify({ roomCode: state.myRoomCode, playerId, keys, t: Date.now() });
  if (lastPublishedByPlayer.get(playerId) === data) return;
  lastPublishedByPlayer.set(playerId, data);
  writePlayerInput(playerId, data);
}

export function publishMyInput() {
  publishPlayerInput(state.myPlayerId, true);
}

export function publishLocalInputs() {
  const ids = state.localPlayerIds && state.localPlayerIds.length
    ? state.localPlayerIds
    : (state.myPlayerId ? [state.myPlayerId] : []);
  ids.forEach(id => publishPlayerInput(id, id === state.myPlayerId));
}

export function getPlayerKeys(player) {
  const noInput = { left: false, right: false, jump: false, dash: false };
  if (!player.alive) return noInput;
  try {
    const raw = readPlayerInput(player.id);
    if (!raw) return noInput;
    const data = JSON.parse(raw);
    if (data.roomCode && state.currentRoom && data.roomCode === state.currentRoom.code) return data.keys || noInput;
  } catch (error) {}
  return noInput;
}

function isTyping(event) {
  const tag = (event.target && event.target.tagName) || '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function onKeyDown(event) {
  if (isTyping(event)) return;
  state.keysPressed[event.key.toLowerCase()] = true;
  publishMyInput();
}

export function onKeyUp(event) {
  if (isTyping(event)) return;
  state.keysPressed[event.key.toLowerCase()] = false;
  publishMyInput();
}
