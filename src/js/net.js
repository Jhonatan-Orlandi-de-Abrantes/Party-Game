import { state } from './state.js';
import { STORAGE_KEY } from './constants.js';

const REMOTE_EVENT = 'bombparty:remotestorage';
const SERVER_URL_KEY = 'bombPartyServerUrl';
const RECONNECT_MS = 3000;
const MEMBERSHIP_SYNC_MS = 4000;

let ws = null;
let online = false;
let everConnected = false;
let sentRoom = null;
let reconnectTimer = null;
let membershipTimer = null;
let pendingWhois = null;
let offlineRelays = new Map();

function externalBase() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('srv');
    let globalConfig = null;
    try {
      globalConfig = window.BOMBPARTY_SERVER_URL || null;
    } catch (error) {}
    const chosen = String(fromUrl || globalConfig || localStorage.getItem(SERVER_URL_KEY) || '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(chosen)) return null;
    if (fromUrl || (globalConfig && globalConfig === chosen)) {
      try {
        localStorage.setItem(SERVER_URL_KEY, chosen);
      } catch (error) {}
    }
    return chosen;
  } catch (error) {
    return null;
  }
}

function serverUrl() {
  try {
    if (new URLSearchParams(window.location.search).get('net') === '0') return null;
    const base = externalBase();
    if (base) return base.replace(/^http/i, 'ws') + '/ws';
    if (!/^https?:$/.test(window.location.protocol)) return null;
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${window.location.host}/ws`;
  } catch (error) {
    return null;
  }
}

function rawSend(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch (error) {
    return false;
  }
}

function syncMembership() {
  const room = state.myRoomCode || null;
  if (room === sentRoom) return;
  if (room && rawSend({ t: 'join', room })) sentRoom = room;
}

function applyRemote(key, value) {
  try {
    if (value == null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    return;
  }
  window.dispatchEvent(new CustomEvent(REMOTE_EVENT, { detail: { key } }));
}

function handleMessage(text) {
  let msg = null;
  try {
    msg = JSON.parse(text);
  } catch (error) {
    return;
  }
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'remote') {
    if (typeof msg.key === 'string') applyRemote(msg.key, msg.value);
    return;
  }
  if (msg.t === 'whois' && typeof msg.room === 'string') {
    answerWhois(msg.room);
  }
}

function answerWhois(room) {
  if (!room || !state.currentRoom || state.currentRoom.code !== room) return;
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {}
  if (raw != null) rawSend({ t: 'relay', key: STORAGE_KEY, value: raw });
}

function connect() {
  const url = serverUrl();
  if (!url) return;
  try {
    ws = new WebSocket(url);
  } catch (error) {
    scheduleReconnect();
    return;
  }
  ws.onopen = () => {
    online = true;
    everConnected = true;
    sentRoom = null;
    syncMembership();
    prefillWhois();
    flushOfflineRelays();
    console.info('[net] Conectado ao servidor online.');
  };
  ws.onmessage = event => {
    handleMessage(typeof event.data === 'string' ? event.data : '');
  };
  ws.onclose = () => {
    online = false;
    sentRoom = null;
    scheduleReconnect();
    if (everConnected) console.info('[net] Desconectado. Tentando reconectar...');
  };
  ws.onerror = () => {
    try {
      ws.close();
    } catch (error) {}
  };
}

function requestRoomBootstrap(room) {
  const code = String(room || '').trim().toUpperCase();
  if (!code) return;
  // Entra na sala no servidor ANTES de perguntar: sem isso, a resposta
  // (relay do snapshot do dono) nao chega de volta para quem perguntou.
  const ok = rawSend({ t: 'join', room: code }) && rawSend({ t: 'whois', room: code });
  pendingWhois = ok ? null : code;
}

function prefillWhois() {
  if (state.myRoomCode) {
    pendingWhois = null;
    return;
  }
  try {
    const code = (new URLSearchParams(window.location.search).get('room') || '').trim().toUpperCase();
    const wanted = pendingWhois || code;
    if (!wanted) return;
    if (!rawSend({ t: 'join', room: wanted }) || !rawSend({ t: 'whois', room: wanted })) return;
    pendingWhois = null;
  } catch (error) {}
}

function scheduleReconnect() {
  if (reconnectTimer || !serverUrl()) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_MS);
}

export function initNet() {
  if (membershipTimer) return;
  connect();
  membershipTimer = setInterval(syncMembership, MEMBERSHIP_SYNC_MS);
}

const relayPending = new Map();
let relayTimer = null;

function flushRelay() {
  relayTimer = null;
  for (const [key, value] of relayPending) {
    rawSend({ t: 'relay', key, value });
  }
  relayPending.clear();
}

export function netRelay(key, value) {
  if (!online) {
    // Offline: guarda a ultima escrita por chave e reenvia na proxima conexao.
    // Sem isso, entrar na sala durante uma reconexao perdia o relay e o host
    // demorava a saber do jogador (que acabava sendo removido pelo heartbeat).
    if (key && typeof key === 'string') offlineRelays.set(key, value);
    return;
  }
  syncMembership();
  if (key && key.startsWith('bombPartyGame_')) {
    relayPending.set(key, value);
    if (!relayTimer) relayTimer = setTimeout(flushRelay, 16);
    return;
  }
  rawSend({ t: 'relay', key, value });
}

function flushOfflineRelays() {
  if (!online || offlineRelays.size === 0) return;
  syncMembership();
  const items = [...offlineRelays.entries()];
  offlineRelays.clear();
  for (const [key, value] of items) {
    if (key && key.startsWith('bombPartyGame_')) {
      relayPending.set(key, value);
    } else {
      rawSend({ t: 'relay', key, value });
    }
  }
  if (relayPending.size > 0 && !relayTimer) relayTimer = setTimeout(flushRelay, 16);
}

export function netRequestRoom(code) {
  if (!code) return;
  requestRoomBootstrap(code);
}

export function netIsOnline() {
  return online;
}

export function netServerBase() {
  return externalBase();
}
