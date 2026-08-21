import { controlSets } from './constants.js';

export const state = {
  rooms: [],
  myRoomCode: sessionStorage.getItem('bombPartyRoom'),
  myPlayerId: sessionStorage.getItem('bombPartyPlayerId'),
  localPlayerIds: loadLocalPlayers(),
  currentRoom: null,
  gameState: null,
  keysPressed: {},
  animationFrameId: null,
  currentScreen: 'welcome',
  lastPublishedInput: '',
  lastPublishTime: 0,
  lastSeenRev: -1,
  endShown: false,
  particles: [],
  bombImage: null,
  bombImageLoaded: false,
  eggImage: null,
  eggImageLoaded: false,
  lastBombHolder: null,
  uiPadPlayerId: null,
  configTargetId: sessionStorage.getItem('bombPartyPlayerId'),
  cosmeticsCache: new Map()
};

function loadLocalPlayers() {
  try {
    const raw = sessionStorage.getItem('bombPartyLocalPlayers');
    if (raw) return JSON.parse(raw);
  } catch (error) {}
  return [];
}

export function saveLocalPlayers(ids) {
  state.localPlayerIds = ids;
  sessionStorage.setItem('bombPartyLocalPlayers', JSON.stringify(ids));
}

export function getMyPlayer() {
  if (!state.currentRoom) return null;
  return state.currentRoom.players.find(player => player.id === state.myPlayerId) || null;
}

export function isHost() {
  const player = getMyPlayer();
  return player ? player.host : false;
}

export function getControlsForPlayer(playerId) {
  if (state.gameState) {
    const player = state.gameState.players.find(p => p.id === playerId);
    if (player) return player.controls;
  }
  if (state.currentRoom) {
    const index = state.currentRoom.players.findIndex(p => p.id === playerId);
    if (index >= 0) return controlSets[index] || controlSets[0];
  }
  return null;
}
