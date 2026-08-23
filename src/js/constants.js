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
// Valor usado em getGamepadAssignment/saveGamepadAssignment para o controle
// "Toque (Móvel)" (-1 = Teclado, 0–3 = pads, -3 = toque). NÃO é -2, que é
// sentinela interna do modal de atribuição no ui.js.
export const TOUCH_ASSIGNMENT = -3;
export const TOUCH_STYLE_PREFIX = 'bombPartyTouchStyle_';
export const TOUCH_LAYOUT_PREFIX = 'bombPartyTouchLayout_';
export const PIX_PRESETS_KEY = 'bombPartyPixPresets';
export const COSMETICS_KEY = 'bombPartyCosmeticsV1';
export const COSMETICS_SYNC_KEY = 'bombPartyCosmeticsSync';
export const CUSTOM_MAPS_KEY = 'bombPartyCustomMapsV1';
export const CUSTOM_MUSICS_KEY = 'bombPartyCustomMusicsV1';
export const MAX_COSMETIC_SIZE = 200000;
export const MAX_COSMETIC_IMAGE_DIM = 128;
export const MAX_COSMETICS_PER_PLAYER = 1;
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
  { id: 'bomb', name: '💣 Bomb Clássico', color: '#868e96' },
  { id: 'egg', name: '🥚 Pegue o Ovo', color: '#ffd23f' },
  { id: 'run', name: '🏃 CORRA!', color: '#ff6b6b' },
  { id: 'rhythm', name: '🎵 Ritmo', color: '#9b5de5' },
  { id: 'war', name: '🔫 GUERRA!', color: '#2b8a3e' }
];
export const BOMB_IMAGE_PATH = 'src/Images/BombGame/bomb.png';
export const EGG_IMAGE_PATH = 'src/Images/egg/egg.png';
export const EGG_ROUND_TIME = 10;
export const EGG_SCORE_TICK = 0.2;
export const RUN_ROUND_TIME = 12;
export const RUN_LIVES = 2;
export const MONSTER_HIT_COOLDOWN = 1.2;
export const RHYTHM_BASE_LEN = 3;
export const RHYTHM_MAX_LEN = 10;
export const RHYTHM_BASE_WINDOW = 1.5;
export const RHYTHM_WINDOW_STEP = 0.12;
export const RHYTHM_MIN_WINDOW = 0.45;
export const RHYTHM_WARN_TIME = 2;
export const RHYTHM_SLAM_SPEED = 1500;
export const RHYTHM_RISE_SPEED = 110;
export const RHYTHM_NEXT_DELAY = 1;
export const RHYTHM_ARROW_COLORS = { up: '#51cf66', down: '#22d3ee', left: '#c24b99', right: '#f9393f' };
export const MAX_SPAWNS = 4;
export const SPAWN_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ff922b'];
export const TRAIL_LIFE = 0.35;

// ============================================================================
// ⚡ POWER-UPS — TODOS os valores ajustáveis ficam NESTE BLOCO.
// Bolhas rosas com "?" nascem pelo mapa nos modos Bomba / Ovo / Corra!
// (nunca no Ritmo). A frequência de nascimento vem do slider
// "Frequência dos power-ups" nas Regras do Jogo do lobby (0% = desliga).
// Para balancear o jogo, mude apenas os números abaixo.
// ============================================================================
export const POWERUP_CONFIG = {
  maxOrbsOnMap: 2,       // máximo de bolhas simultâneas no mapa
  orbLifetime: 12,       // segundos até a bolha sumir sozinha
  orbBlinkLast: 3,       // segundos finais em que a bolha pisca antes de sumir
  orbRadius: 16,         // raio da bolha (visual e área de coleta)
  spawnIntervalFast: 4,  // intervalo MÉDIO entre spawns com frequência 100%
  spawnIntervalSlow: 14, // intervalo MÉDIO entre spawns com frequência baixa
  spawnIntervalMin: 1.5, // intervalo MÉDIO mínimo, atingido com frequência 200%
  pickupTextLife: 1.4    // duração do texto flutuante ao pegar um power-up
};

// duration        = segundos de efeito em quem pegou.
// freezeDuration  = segundos que os OUTROS ficam congelados.
// modes           = modos em que o power-up pode nascer.
export const POWERUPS = [
  { id: 'speed',  name: 'Velocidade',      icon: '⚡', color: '#ffd43b', modes: ['bomb', 'egg', 'run'], duration: 6, speedMultiplier: 1.45 },
  { id: 'dash',   name: 'Dash Turbo',      icon: '💨', color: '#ff922b', modes: ['bomb', 'egg', 'run'], duration: 6, dashCooldownMult: 0.3 },
  { id: 'ghost',  name: 'Fantasma',        icon: '👻', color: '#c5d5ff', modes: ['bomb', 'egg', 'run'], duration: 4 },
  { id: 'freeze', name: 'Congelar Outros', icon: '❄️', color: '#74c0fc', modes: ['bomb', 'egg', 'run'], freezeDuration: 2 },
  { id: 'relief', name: 'Troca',            icon: '💣', color: '#fa5252', modes: ['bomb'] },
  { id: 'double', name: 'Pontos Dobrados', icon: '✖️', color: '#ffd23f', modes: ['egg'], duration: 8 },
  { id: 'heart',  name: 'Coração Extra',   icon: '❤️', color: '#ff6b81', modes: ['run'], maxHearts: 3, monsterSpeedDuration: 5, monsterSpeedMultiplier: 1.25 }
];

export function getPowerup(id) {
  return POWERUPS.find(powerup => powerup.id === id) || null;
}

// ============================================================================
// 🔫 GUERRA! — TODOS os valores ajustáveis ficam NESTE BLOCO.
// Armas nascem espalhadas pelo mapa; quem encostar pega. O botão de dash
// vira o GATILHO (atirar/socar). Quando acabarem as armas do mapa e a
// munição de todos, todos recebem os PUNHOS (mão na cor do player).
// Último vivo vence. 1º a morrer = 1pt, 2º = 2pts... (ordem de morte).
// Para balancear, mude apenas os números abaixo.
// ============================================================================
export const WAR_LIVES = 3;            // vidas de cada jogador
export const WAR_EXTRA_WEAPONS = 2;    // armas no mapa além de 1 por jogador
export const WAR_BULLET_SPEED = 760;   // velocidade dos projéteis
export const WAR_BULLET_RADIUS = 6;    // raio de acerto do projétil
export const WAR_FIST_RANGE = 100;      // alcance do soco
export const WAR_FIST_DAMAGE = 1;      // dano do soco
export const WAR_FIST_COOLDOWN = 0.55; // intervalo entre socos
export const WAR_FIST_SWING = 0.22; // duração da animação do soco
export const WAR_SHOT_SOUNDS = [
  'sounds/shot/shot1.mp3',
  'sounds/shot/shot2.mp3',
  'sounds/shot/shot3.mp3'
];
export const WAR_GUNLOAD_SOUNDS = [
  'sounds/gunload/load1.mp3',
  'sounds/gunload/load2.mp3',
  'sounds/gunload/load3.mp3',
  'sounds/gunload/load4.mp3'
];
// Cada arma: damage (vidas tiradas), ammo (tiros totais), fireCooldown
// (segundos entre tiros), sound (tocado ao atirar).
export const WAR_WEAPONS = [
  { id: 'pistol',  name: 'Pistola',     color: '#adb5bd', damage: 1, ammo: 6,  fireCooldown: 0.4,  sound: 'sounds/shot/shot1.mp3' },
  { id: 'shotgun', name: 'Escopeta',    color: '#e8590c', damage: 2, ammo: 3,  fireCooldown: 0.9,  sound: 'sounds/shot/shot2.mp3' },
  { id: 'rifle',   name: 'Metralhadora', color: '#1971c2', damage: 1, ammo: 12, fireCooldown: 0.16, sound: 'sounds/shot/shot3.mp3' }
];

export function getWarWeapon(id) {
  return WAR_WEAPONS.find(weapon => weapon.id === id) || null;
}

export const controlSets = [
  { left: 'a', right: 'd', jump: ' ', dash: 'shift' },
  { left: 'a', right: 'd', jump: ' ', dash: 'shift' },
  { left: 'a', right: 'd', jump: ' ', dash: 'shift' },
  { left: 'a', right: 'd', jump: ' ', dash: 'shift' }
];
