import { controlSets } from './constants.js';

export const state = {
  rooms: [],
  myRoomCode: sessionStorage.getItem('bombPartyRoom'),
  myPlayerId: sessionStorage.getItem('bombPartyPlayerId'),
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
  bombImageLoaded: false
};

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
