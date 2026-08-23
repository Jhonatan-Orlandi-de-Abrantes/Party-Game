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

function prefillWhois() {
  if (state.myRoomCode) return;
  try {
    const code = (new URLSearchParams(window.location.search).get('room') || '').trim().toUpperCase();
    if (code) rawSend({ t: 'whois', room: code });
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

export function netRelay(key, value) {
  if (!online) return;
  syncMembership();
  rawSend({ t: 'relay', key, value });
}

export function netRequestRoom(code) {
  if (!online || !code) return;
  rawSend({ t: 'whois', room: String(code).trim().toUpperCase() });
}

export function netIsOnline() {
  return online;
}

export function netServerBase() {
  return externalBase();
}
