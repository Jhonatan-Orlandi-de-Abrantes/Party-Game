export const STORAGE_KEY = 'bombPartyRoomsV1';
export const ROOM_CODE_LENGTH = 4;
export const MAX_BOMB_TIME = 15;
export const MAX_SCORE = 15;
export const DASH_COOLDOWN = 2;
export const STALE_TIMEOUT = 8000;
export const COUNTDOWN_SECONDS = 3;
export const SHOW_MAP_NAME = false;
export const INPUT_PREFIX = 'bombPartyInput_';
export const GAME_STATE_PREFIX = 'bombPartyGame_';
export const GAMEPAD_PREFIX = 'bombPartyGamepad_';
export const FPS_ENABLED_PREFIX = 'bombPartyFpsEnabled_';
export const FPS_COLOR_PREFIX = 'bombPartyFpsColor_';
export const FPS_LIMIT_PREFIX = 'bombPartyFpsLimit_';
export const RESOLUTION_PREFIX = 'bombPartyResolution_';
export const KEYS_PREFIX = 'bombPartyKeys_';
export const HAT_PREFIX = 'bombPartyHat_';
export const MUSIC_VOLUME_KEY = 'bombPartyMusicVolume';
export const SFX_VOLUME_KEY = 'bombPartySfxVolume';
export const DEVICE_ID_KEY = 'bombPartyDeviceId';
export const TOUCH_ENABLED_PREFIX = 'bombPartyTouchEnabled_';
export const TOUCH_STYLE_PREFIX = 'bombPartyTouchStyle_';
export const TOUCH_LAYOUT_PREFIX = 'bombPartyTouchLayout_';
export const PIX_PRESETS_KEY = 'bombPartyPixPresets';
export const COSMETICS_KEY = 'bombPartyCosmeticsV1';
export const COSMETICS_SYNC_KEY = 'bombPartyCosmeticsSync';
export const CUSTOM_MAPS_KEY = 'bombPartyCustomMapsV1';
export const CUSTOM_MUSICS_KEY = 'bombPartyCustomMusicsV1';
export const MAX_COSMETIC_SIZE = 200000;
export const MAX_COSMETIC_IMAGE_DIM = 128;
export const MAX_COSMETICS_PER_PLAYER = 5;
export const MAX_MAP_MUSIC_SIZE = 2500000;
export const MAX_MAP_PLATFORMS = 60;
export const MAP_EDITOR_WIDTH = 1080;
export const MAP_EDITOR_HEIGHT = 540;
export const PUBLISH_INTERVAL = 33;
export const HOST_TIMEOUT = 3000;

export function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export const DEFAULT_ROOM_SETTINGS = {
  powerupFrequency: 50,
  playerSpeed: 100,
  scoreLimit: MAX_SCORE
};

export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 44;
export const BOMB_PASS_DISTANCE = 50;

export const GRAVITY = 1200;
export const FRICTION = 0.88;
export const RUN_SPEED = 4000;
export const JUMP_SPEED = 560;
export const DASH_SPEED = 720;
export const DASH_ACTIVE_TIME = 0.18;

export const EXPLOSION_COLORS = ['#3a3a3a', '#c1121f', '#f77f00', '#fcbf49'];
export const GAME_MODE_NAME = '💣 Bomb Clássico';
export const GAME_MODES = [
  { id: 'bomb', name: '💣 Bomb Clássico', color: '#ff6b6b' },
  { id: 'egg', name: '🥚 Pegue o Ovo', color: '#ffd23f' },
  { id: 'run', name: '🏃 CORRA!', color: '#b5179e' }
];
export const BOMB_IMAGE_PATH = 'src/Images/BombGame/bomb.png';
export const EGG_IMAGE_PATH = 'src/Images/egg/egg.png';
export const EGG_ROUND_TIME = 10;
export const EGG_SCORE_TICK = 0.2;
export const RUN_ROUND_TIME = 12;
export const RUN_LIVES = 2;
export const MONSTER_HIT_COOLDOWN = 1.2;
export const MAX_SPAWNS = 4;
export const SPAWN_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ff922b'];
export const TRAIL_LIFE = 0.35;

export const controlSets = [
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' },
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' },
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' },
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' }
];
