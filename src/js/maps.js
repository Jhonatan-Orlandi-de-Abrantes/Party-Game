import { loadCustomMaps } from './storage.js';
import { GAME_MODES } from './constants.js';

export const MAPS = [
  {
    name: 'Clássico',
    bg: '#bfe8ff',
    platformColors: ['#a3d97a', '#7fd3f2', '#f6c768', '#f2a1a1'],
    platforms: [
      { x: 0, y: 500, width: 1080, height: 40 },
      { x: 120, y: 390, width: 320, height: 24 },
      { x: 640, y: 300, width: 300, height: 24 },
      { x: 360, y: 220, width: 260, height: 24 }
    ]
  },
  {
    name: 'Torres',
    bg: '#ffdbe6',
    platformColors: ['#f2a1a1', '#f6c768', '#a3d97a', '#7fd3f2'],
    platforms: [
      { x: 0, y: 500, width: 1080, height: 40 },
      { x: 60, y: 400, width: 200, height: 20 },
      { x: 140, y: 300, width: 150, height: 20 },
      { x: 820, y: 400, width: 200, height: 20 },
      { x: 790, y: 300, width: 150, height: 20 },
      { x: 390, y: 350, width: 300, height: 20 }
    ]
  },
  {
    name: 'Escadas',
    bg: '#d4f7c9',
    platformColors: ['#a3d97a', '#f6c768', '#7fd3f2', '#f2a1a1'],
    platforms: [
      { x: 0, y: 500, width: 1080, height: 40 },
      { x: 60, y: 420, width: 180, height: 20 },
      { x: 240, y: 350, width: 180, height: 20 },
      { x: 420, y: 280, width: 180, height: 20 },
      { x: 600, y: 210, width: 180, height: 20 },
      { x: 780, y: 140, width: 180, height: 20 },
      { x: 420, y: 120, width: 240, height: 20 }
    ]
  },
  {
    name: 'Ilhas',
    bg: '#c7ecf7',
    platformColors: ['#7fd3f2', '#a3d97a', '#f6c768', '#f2a1a1'],
    platforms: [
      { x: 0, y: 500, width: 1080, height: 40 },
      { x: 37, y: 397, width: 457, height: 20 },
      { x: 594, y: 397, width: 457, height: 20 },
      { x: 251, y: 322, width: 238, height: 20 },
      { x: 589, y: 322, width: 238, height: 20 },
      { x: 221, y: 231, width: 267, height: 20 },
      { x: 588, y: 231, width: 268, height: 20 },
      { x: 381, y: 167, width: 112, height: 20 },
      { x: 593, y: 167, width: 113, height: 20 }
    ]
  },
  {
    name: 'Arena',
    bg: '#ffe9c7',
    platformColors: ['#f6c768', '#f2a1a1', '#a3d97a', '#7fd3f2'],
    platforms: [
      { x: 0, y: 500, width: 1080, height: 40 },
      { x: 440, y: 420, width: 200, height: 20 },
      { x: 180, y: 320, width: 220, height: 20 },
      { x: 680, y: 320, width: 220, height: 20 },
      { x: 380, y: 230, width: 320, height: 20 }
    ]
  }
];

const SUPPORTED_MODES = new Set(GAME_MODES.map(mode => mode.id));

function customToPlayable(entry) {
  return {
    name: entry.name || 'Mapa customizado',
    bg: entry.bg || '#bfe8ff',
    platformColors: entry.platformColors || ['#a3d97a', '#7fd3f2', '#f6c768', '#f2a1a1'],
    platforms: (entry.platforms || []).map(platform => ({ ...platform })),
    music: entry.music || null,
    custom: true,
    customId: entry.id
  };
}

export function getPlayableMaps() {
  const customs = loadCustomMaps()
    .filter(entry => SUPPORTED_MODES.has(entry.mode || 'bomb'))
    .map(customToPlayable);
  return MAPS.concat(customs);
}
