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
export const PUBLISH_INTERVAL = 33;
export const HOST_TIMEOUT = 3000;

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
export const GAME_MODE_NAME = 'Bomb Clássico';
export const BOMB_IMAGE_PATH = 'src/Images/BombGame/bomb.png';
export const TRAIL_LIFE = 0.35;

export const controlSets = [
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' },
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' },
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' },
  { left: 'a', right: 'd', jump: 'w', dash: 'shift' }
];
