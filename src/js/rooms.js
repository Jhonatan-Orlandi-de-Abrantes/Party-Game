import { state, saveLocalPlayers } from './state.js';
import { ROOM_CODE_LENGTH, STALE_TIMEOUT, uuid, DEFAULT_ROOM_SETTINGS } from './constants.js';
import { loadRooms, saveRooms, removePlayerInput, gameKey, getDeviceId, getHat, getEquippedCosmetics } from './storage.js';

export function randomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  if (state.rooms.some(room => room.code === code)) return randomCode();
  return code;
}

export function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

export function createRoom(nickname, maxPlayers, mode = 'local') {
  if (!nickname) return 'Informe um apelido antes de criar a sala.';
  state.rooms = loadRooms();
  const code = randomCode();
  const playerId = uuid();
  const deviceId = getDeviceId();
  const player = { id: playerId, nickname, color: randomColor(), host: true, joinedAt: Date.now(), lastSeen: Date.now(), deviceId, hat: getHat(deviceId), cosmetics: getEquippedCosmetics(), score: 0 };
  const room = { code, players: [player], maxPlayers, started: false, ownerId: playerId, createdAt: Date.now(), mode, settings: { ...DEFAULT_ROOM_SETTINGS }, mapSelection: null };
  state.rooms.push(room);
  state.myPlayerId = playerId;
  state.myRoomCode = room.code;
  state.currentRoom = room;
  saveRooms();
  saveLocalPlayers([playerId]);
  sessionStorage.setItem('bombPartyRoom', room.code);
  sessionStorage.setItem('bombPartyPlayerId', playerId);
  return null;
}

export function joinRoom(nickname, code) {
  if (!nickname || !code) return 'Informe apelido e código da sala.';
  state.rooms = loadRooms();
  const room = state.rooms.find(room => room.code === code);
  if (!room) return 'Sala não encontrada. Verifique o código.';
  if (room.started) return 'Partida já começou. Aguarde a próxima sala.';
  if (room.players.length >= room.maxPlayers) return 'Sala cheia. Escolha outra ou aguarde vaga.';
  if (room.players.some(player => player.nickname.toLowerCase() === nickname.toLowerCase())) {
    return 'Apelido já utilizado na sala. Use outro.';
  }
  const playerId = uuid();
  const deviceId = getDeviceId();
  const player = { id: playerId, nickname, color: randomColor(), host: false, joinedAt: Date.now(), lastSeen: Date.now(), deviceId, hat: getHat(deviceId), cosmetics: getEquippedCosmetics(), score: 0 };
  room.players.push(player);
  state.myPlayerId = playerId;
  state.myRoomCode = room.code;
  state.currentRoom = room;
  saveRooms();
  saveLocalPlayers([playerId]);
  sessionStorage.setItem('bombPartyRoom', room.code);
  sessionStorage.setItem('bombPartyPlayerId', playerId);
  return null;
}

export function addLocalPlayer(nickname) {
  if (!state.currentRoom) return { error: 'Nenhuma sala ativa.' };
  state.rooms = loadRooms();
  const room = state.rooms.find(room => room.code === state.currentRoom.code);
  if (!room) return { error: 'Sala não encontrada.' };
  if (room.started) return { error: 'A partida já começou.' };
  if (room.players.length >= room.maxPlayers) return { error: 'A sala está cheia.' };
  if (room.players.some(player => player.nickname.toLowerCase() === nickname.toLowerCase())) {
    return { error: 'Apelido já utilizado na sala. Use outro.' };
  }
  const playerId = uuid();
  const deviceId = getDeviceId();
  const player = { id: playerId, nickname, color: randomColor(), host: false, joinedAt: Date.now(), lastSeen: Date.now(), deviceId, hat: getHat(deviceId), cosmetics: [], local: true, score: 0 };
  room.players.push(player);
  saveRooms();
  state.currentRoom = room;
  saveLocalPlayers([...state.localPlayerIds, playerId]);
  return { player };
}

export function leaveRoom() {
  const ids = [...new Set([state.myPlayerId, ...(state.localPlayerIds || [])].filter(Boolean))];
  ids.forEach(id => {
    removePlayerFromRoom(state.myRoomCode, id, false);
    if (id) removePlayerInput(id);
  });
  state.myRoomCode = null;
  state.myPlayerId = null;
  state.localPlayerIds = [];
  state.currentRoom = null;
  state.uiPadPlayerId = null;
  state.configTargetId = null;
  saveLocalPlayers([]);
  sessionStorage.removeItem('bombPartyRoom');
  sessionStorage.removeItem('bombPartyPlayerId');
}

export function removePlayerFromRoom(roomCode, playerId, silent) {
  state.rooms = loadRooms();
  const room = state.rooms.find(room => room.code === roomCode);
  if (!room) return;
  const index = room.players.findIndex(player => player.id === playerId);
  if (index >= 0) room.players.splice(index, 1);
  if (room.players.length === 0) {
    state.rooms = state.rooms.filter(room => room.code !== roomCode);
  } else if (room.ownerId === playerId) {
    const nextHost = room.players[0];
    nextHost.host = true;
    room.ownerId = nextHost.id;
  }
  saveRooms();
  if (!silent && state.currentRoom && state.currentRoom.code === roomCode) {
    state.currentRoom = state.rooms.find(room => room.code === roomCode) || null;
  }
}

export function setStarted(flag) {
  if (!state.currentRoom) return;
  state.rooms = loadRooms();
  const room = state.rooms.find(room => room.code === state.currentRoom.code);
  if (!room) return;
  room.started = flag;
  state.currentRoom = room;
  saveRooms();
}

export function startGame(userRequested = true) {
  if (!state.currentRoom) return 'Nenhuma sala ativa.';
  state.rooms = loadRooms();
  const room = state.rooms.find(room => room.code === state.currentRoom.code);
  if (!room) return 'Sala não encontrada.';
  state.currentRoom = room;
  if (userRequested && !room.players.some(player => player.host && player.id === state.myPlayerId)) {
    return 'Apenas o host pode iniciar o jogo.';
  }
  if (userRequested && room.players.length < 2) {
    return 'É necessário ao menos 2 jogadores para iniciar.';
  }
  room.started = true;
  saveRooms();
  return null;
}

export function heartbeat() {
  if (!state.myRoomCode) return;
  state.rooms = loadRooms();
  const room = state.rooms.find(room => room.code === state.myRoomCode);
  if (room) state.currentRoom = room;
  if (!room) return;
  const now = Date.now();
  const ids = [...new Set([state.myPlayerId, ...(state.localPlayerIds || [])].filter(Boolean))];
  let changed = false;
  ids.forEach(id => {
    const player = room.players.find(p => p.id === id);
    if (player && player.lastSeen && now - player.lastSeen >= 2000) {
      player.lastSeen = now;
      changed = true;
    }
  });
  if (changed) saveRooms();
}

export function cleanupStalePlayers() {
  state.rooms = loadRooms();
  const now = Date.now();
  const myDeviceId = getDeviceId();
  const myLocalIds = new Set(state.localPlayerIds || []);
  let changed = false;
  let droppedCurrent = false;
  const removedPlayers = [];
  state.rooms = state.rooms.filter(room => {
    const code = room.code;
    const isCurrent = state.currentRoom && state.currentRoom.code === code;
    const before = room.players.length;
    room.players = room.players.filter(player => {
      if (now - (player.lastSeen || 0) < STALE_TIMEOUT) return true;
      if (player.deviceId === myDeviceId || myLocalIds.has(player.id)) {
        removePlayerInput(player.id);
        if (isCurrent) removedPlayers.push(player);
        return false;
      }
      return true;
    });
    if (room.players.length !== before) changed = true;
    if (room.players.length === 0) {
      localStorage.removeItem(gameKey(code));
      changed = true;
      return false;
    }
    if (room.ownerId && !room.players.some(player => player.id === room.ownerId)) {
      const nextHost = room.players[0];
      nextHost.host = true;
      room.ownerId = nextHost.id;
      changed = true;
    }
    return true;
  });
  const freshCurrent = state.rooms.find(room => room.code === (state.currentRoom && state.currentRoom.code));
  if (freshCurrent) state.currentRoom = freshCurrent;
  if (changed) {
    saveRooms();
    if (state.currentRoom && !state.rooms.some(room => room.code === state.currentRoom.code)) {
      state.myRoomCode = null;
      state.myPlayerId = null;
      state.localPlayerIds = [];
      state.currentRoom = null;
      saveLocalPlayers([]);
      sessionStorage.removeItem('bombPartyRoom');
      sessionStorage.removeItem('bombPartyPlayerId');
      droppedCurrent = true;
    }
  }
  return { dropped: droppedCurrent, removedPlayers };
}

export function roomSignature(room) {
  if (!room) return null;
  const playersSig = room.players.map(player =>
    `${player.id}|${player.nickname}|${player.host}|${player.color}|${player.hat || 'none'}|${player.score || 0}`
  ).join(',');
  return `${room.code}|${room.started}|${room.maxPlayers}|${room.mode || 'local'}|${playersSig}|${JSON.stringify(room.settings || {})}|${JSON.stringify(room.mapSelection || [])}`;
}
