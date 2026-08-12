import { getMusicVolume, getSfxVolume } from './storage.js';

const MENU_TRACKS = ['menu1', 'menu2', 'menu3', 'menu4', 'menu5'].map(name => `musics/menu/${name}.mp3`);
const GAME_TRACKS = ['gm1', 'gm2', 'gm3', 'gm4', 'gm5', 'gm6', 'gm7', 'gm8', 'gm9', 'gm10', 'gm11'].map(name => `musics/game/${name}.mp3`);

const SOUND_GROUPS = {
  'start-countdown': ['start-countdown1', 'start-countdown2'].map(name => `sounds/start-countdown/${name}.mp3`),
  'start-menu': ['start-menu'].map(name => `sounds/start-countdown/${name}.mp3`),
  victory: ['victory1', 'victory2', 'victory3', 'victory4', 'victory5', 'victory6', 'victory7', 'victory8', 'victory9', 'victory10'].map(name => `sounds/victory/${name}.mp3`),
  kill: ['kill1', 'kill2', 'kill3', 'kill4', 'kill5', 'kill6', 'kill7'].map(name => `sounds/kill/${name}.mp3`),
  jump: ['jump1', 'jump2', 'jump3'].map(name => `sounds/jump/${name}.mp3`),
  leaderboard: ['leaderboard1', 'leaderboard2', 'leaderboard3'].map(name => `sounds/leaderboard/${name}.mp3`)
};

let menuAudio = null;
let gameAudio = null;
let lastTrack = null;

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomTrack(list) {
  let track = randomFrom(list);
  if (track === lastTrack && list.length > 1) track = randomFrom(list);
  lastTrack = track;
  return track;
}

function stopMusic(audio) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

function startMusic(audio) {
  const promise = audio.play();
  if (promise && promise.catch) promise.catch(() => {});
}

export function playMenuMusic() {
  stopMusic(gameAudio);
  gameAudio = null;
  if (!menuAudio) {
    menuAudio = new Audio(randomTrack(MENU_TRACKS));
    menuAudio.loop = true;
  }
  menuAudio.volume = getMusicVolume() / 100;
  if (menuAudio.paused) startMusic(menuAudio);
}

export function playGameMusic() {
  stopMusic(menuAudio);
  menuAudio = null;
  if (!gameAudio) {
    gameAudio = new Audio(randomTrack(GAME_TRACKS));
    gameAudio.loop = true;
  }
  gameAudio.volume = getMusicVolume() / 100;
  if (gameAudio.paused) startMusic(gameAudio);
}

export function setMusicVolume(volume) {
  const v = volume / 100;
  if (menuAudio) menuAudio.volume = v;
  if (gameAudio) gameAudio.volume = v;
}

export function setSfxVolume(volume) {
  blipVolume = volume / 100;
}

let ctx = null;

function audioCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  audioCtx();
}

let blipVolume = getSfxVolume() / 100;

function blip(duration, frequency, type, volume) {
  const c = audioCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const finalVolume = volume * blipVolume;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * 0.6), c.currentTime + duration);
    gain.gain.setValueAtTime(finalVolume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration + 0.02);
  } catch (error) {}
}

export function playClick() {
  blip(0.07, 560, 'square', 0.07);
}

export function playPop() {
  blip(0.1, 340, 'triangle', 0.12);
}

export function playSound(name) {
  const list = SOUND_GROUPS[name];
  if (!list) return;
  const audio = new Audio(randomTrack(list));
  audio.volume = getSfxVolume() / 100;
  const promise = audio.play();
  if (promise && promise.catch) promise.catch(() => {});
}
