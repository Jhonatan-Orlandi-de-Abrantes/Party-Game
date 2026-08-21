import {
  GAME_MODES,
  MAX_MAP_MUSIC_SIZE,
  MAX_MAP_PLATFORMS,
  MAP_EDITOR_WIDTH,
  MAP_EDITOR_HEIGHT,
  MAX_SPAWNS,
  SPAWN_COLORS,
  uuid
} from './constants.js';
import {
  loadCustomMaps,
  saveCustomMaps,
  getCustomMusic,
  putCustomMusic,
  deleteCustomMusic
} from './storage.js';
import { getNativeGameTracks } from './audio.js';
import { state } from './state.js';
import { showScreen, showNotice, showConfirm } from './ui.js';

const $ = (id) => document.getElementById(id);

const DEFAULT_PALETTE = ['#a3d97a', '#7fd3f2', '#f6c768', '#f2a1a1'];
const HANDLE_SIZE = 12;

const canvas = $('mapEditorCanvas');
const ctx = canvas.getContext('2d');

let workingMap = null;
let selectedIndex = -1;
let selectedSpawn = -1;
let tool = 'select';
let drag = null;
let previewAudio = null;
let saveTimer = null;
let initialized = false;

function newMap() {
  return {
    id: uuid(),
    name: 'Novo mapa',
    mode: GAME_MODES[0].id,
    bg: '#bfe8ff',
    platforms: [
      { x: 0, y: 500, width: 1080, height: 40, color: DEFAULT_PALETTE[0] }
    ],
    spawns: [],
    music: { type: 'default' },
    updatedAt: Date.now()
  };
}

export function openMapEditor() {
  if (!initialized) initMapEditor();
  if (!workingMap) {
    const saved = loadCustomMaps();
    workingMap = saved.length > 0 ? cloneMap(saved[saved.length - 1]) : newMap();
    selectedIndex = -1;
    selectedSpawn = -1;
  }
  showScreen('mapEditor');
  syncAllInputs();
  renderCanvas();
  renderSavedList();
}

function cloneMap(entry) {
  return JSON.parse(JSON.stringify(entry));
}

export function initMapEditor() {
  if (initialized) return;
  initialized = true;

  const modeSelect = $('mapModeSelect');
  for (const mode of GAME_MODES) {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = mode.name;
    modeSelect.appendChild(option);
  }

  const musicSelect = $('mapMusicSelect');
  const optDefault = document.createElement('option');
  optDefault.value = 'default';
  optDefault.textContent = 'Padrão do jogo (aleatória)';
  musicSelect.appendChild(optDefault);
  for (const track of getNativeGameTracks()) {
    const option = document.createElement('option');
    option.value = 'native:' + track.replace('musics/game/', '');
    option.textContent = 'Nativa: ' + track.replace('musics/game/', '').replace(/\.[^.]+$/, '');
    musicSelect.appendChild(option);
  }
  const optCustom = document.createElement('option');
  optCustom.value = 'custom';
  optCustom.textContent = 'Personalizada (upload)';
  musicSelect.appendChild(optCustom);

  $('openMapEditorBtn').addEventListener('click', () => openMapEditor());
  $('mapEditorBackBtn').addEventListener('click', () => {
    saveWorkingMap(false);
    stopPreview();
    showScreen('welcome');
  });

  $('mapNewBtn').addEventListener('click', () => {
    saveWorkingMap(false);
    workingMap = newMap();
    selectedIndex = -1;
    selectedSpawn = -1;
    stopPreview();
    syncAllInputs();
    renderCanvas();
    renderSavedList();
    showEditorNotice('Novo mapa criado.');
  });

  $('mapSaveBtn').addEventListener('click', () => {
    saveWorkingMap(true);
  });

  $('mapExportBtn').addEventListener('click', () => {
    saveWorkingMap(false);
    exportMap();
  });

  $('mapImportBtn').addEventListener('click', () => {
    $('mapImportFileInput').click();
  });

  $('mapImportFileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (file) importMapFile(file);
  });

  $('mapNameInput').addEventListener('input', () => {
    workingMap.name = $('mapNameInput').value.trim() || 'Sem nome';
    markDirty();
  });

  $('mapModeSelect').addEventListener('change', () => {
    workingMap.mode = $('mapModeSelect').value;
    updateModeChipTheme();
    markDirty();
    renderSavedList();
  });

  $('mapBgColorInput').addEventListener('input', () => {
    workingMap.bg = $('mapBgColorInput').value;
    $('mapBgColorHex').textContent = workingMap.bg.toUpperCase();
    markDirty();
    renderCanvas();
  });

  $('mapToolSelectBtn').addEventListener('click', () => setTool('select'));
  $('mapToolAddBtn').addEventListener('click', () => setTool('add'));
  $('mapToolSpawnBtn').addEventListener('click', () => setTool('spawn'));
  $('mapDuplicateBtn').addEventListener('click', duplicateSelected);
  $('mapDeleteBtn').addEventListener('click', () => {
    if (selectedSpawn >= 0) {
      deleteSelectedSpawn();
      return;
    }
    deleteSelected();
  });

  for (const [propId, prop] of [['mapPropX', 'x'], ['mapPropY', 'y'], ['mapPropW', 'width'], ['mapPropH', 'height']]) {
    $(propId).addEventListener('input', () => applyPropInput(prop, $(propId).value));
  }

  $('mapPropColor').addEventListener('input', () => {
    const platform = getSelectedPlatform();
    if (!platform) {
      showEditorNotice('Nenhuma plataforma selecionada.');
      $('mapPropColor').value = DEFAULT_PALETTE[0];
      $('mapPropColorHex').textContent = DEFAULT_PALETTE[0].toUpperCase();
      return;
    }
    platform.color = $('mapPropColor').value;
    $('mapPropColorHex').textContent = platform.color.toUpperCase();
    markDirty();
    renderCanvas();
  });

  $('mapMusicSelect').addEventListener('change', () => {
    applyMusicSelection(musicSelect.value);
  });

  $('mapMusicFileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (file) uploadCustomMusic(file);
  });

  $('mapMusicPreviewBtn').addEventListener('click', startPreview);
  $('mapMusicStopBtn').addEventListener('click', stopPreview);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);

  window.addEventListener('keydown', event => {
    if (state.currentScreen !== 'mapEditor') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedSpawn >= 0) {
        event.preventDefault();
        deleteSelectedSpawn();
      } else if (selectedIndex >= 0) {
        event.preventDefault();
        deleteSelected();
      }
    }
  });

  window.addEventListener('bombparty:screenchange', event => {
    if (event.detail.screen !== 'mapEditor') stopPreview();
  });
}

function setTool(next) {
  tool = next;
  $('mapToolSelectBtn').classList.toggle('active', tool === 'select');
  $('mapToolAddBtn').classList.toggle('active', tool === 'add');
  $('mapToolSpawnBtn').classList.toggle('active', tool === 'spawn');
  canvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';
}

function getSelectedPlatform() {
  if (!workingMap || selectedIndex < 0) return null;
  return workingMap.platforms[selectedIndex] || null;
}

function spawnAt(point) {
  if (!workingMap || !Array.isArray(workingMap.spawns)) return -1;
  for (let i = workingMap.spawns.length - 1; i >= 0; i--) {
    const s = workingMap.spawns[i];
    if (Math.abs(point.x - s.x) <= 18 && Math.abs(point.y - s.y) <= 22) return i;
  }
  return -1;
}

function deleteSelectedSpawn() {
  if (!workingMap || !Array.isArray(workingMap.spawns)) return;
  if (selectedSpawn < 0 || !workingMap.spawns[selectedSpawn]) {
    showEditorNotice('Nenhum spawn selecionado.');
    return;
  }
  workingMap.spawns.splice(selectedSpawn, 1);
  selectedSpawn = -1;
  markDirty();
  renderCanvas();
}

let editorToastTimer = null;

function showEditorNotice(message) {
  showNotice($('mapEditorNotice'), message);
  const toast = $('mapEditorToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(editorToastTimer);
  editorToastTimer = setTimeout(() => toast.classList.add('hidden'), 4500);
}

function applyPropInput(prop, rawValue) {
  const platform = getSelectedPlatform();
  if (!platform) {
    showEditorNotice('Nenhuma plataforma selecionada.');
    syncPlatformInputs();
    return;
  }
  let value = Math.round(Number(rawValue));
  if (!Number.isFinite(value)) return;
  if (prop === 'width') value = Math.min(MAP_EDITOR_WIDTH, Math.max(8, value));
  else if (prop === 'height') value = Math.min(MAP_EDITOR_HEIGHT, Math.max(8, value));
  else if (prop === 'x') value = Math.min(MAP_EDITOR_WIDTH - platform.width, Math.max(0, value));
  else if (prop === 'y') value = Math.min(MAP_EDITOR_HEIGHT - platform.height, Math.max(0, value));
  platform[prop] = value;
  markDirty();
  renderCanvas();
}

function duplicateSelected() {
  const platform = getSelectedPlatform();
  if (!platform) {
    showEditorNotice('Nenhuma plataforma selecionada.');
    return;
  }
  if (workingMap.platforms.length >= MAX_MAP_PLATFORMS) {
    showEditorNotice(`Limite de ${MAX_MAP_PLATFORMS} plataformas.`);
    return;
  }
  const copy = {
    ...platform,
    x: Math.min(MAP_EDITOR_WIDTH - platform.width, platform.x + 20),
    y: Math.min(MAP_EDITOR_HEIGHT - platform.height, platform.y + 20)
  };
  workingMap.platforms.push(copy);
  selectedIndex = workingMap.platforms.length - 1;
  markDirty();
  syncPlatformInputs();
  renderCanvas();
}

function deleteSelected() {
  if (!workingMap) return;
  if (selectedIndex < 0) {
    showEditorNotice('Nenhuma plataforma selecionada.');
    return;
  }
  workingMap.platforms.splice(selectedIndex, 1);
  selectedIndex = -1;
  markDirty();
  syncPlatformInputs();
  renderCanvas();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.min(MAP_EDITOR_WIDTH, Math.max(0, (event.clientX - rect.left) * (MAP_EDITOR_WIDTH / rect.width))),
    y: Math.min(MAP_EDITOR_HEIGHT, Math.max(0, (event.clientY - rect.top) * (MAP_EDITOR_HEIGHT / rect.height)))
  };
}

function platformAt(point) {
  for (let i = workingMap.platforms.length - 1; i >= 0; i--) {
    const p = workingMap.platforms[i];
    if (point.x >= p.x && point.x <= p.x + p.width && point.y >= p.y && point.y <= p.y + p.height) return i;
  }
  return -1;
}

function handleAt(point) {
  const platform = getSelectedPlatform();
  if (!platform) return null;
  const corners = {
    nw: [platform.x, platform.y],
    ne: [platform.x + platform.width, platform.y],
    sw: [platform.x, platform.y + platform.height],
    se: [platform.x + platform.width, platform.y + platform.height]
  };
  for (const [corner, [cx, cy]] of Object.entries(corners)) {
    if (Math.abs(point.x - cx) <= HANDLE_SIZE && Math.abs(point.y - cy) <= HANDLE_SIZE) return corner;
  }
  return null;
}

function onPointerDown(event) {
  if (!workingMap) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  const point = canvasPoint(event);

  if (tool === 'spawn') {
    if (!Array.isArray(workingMap.spawns)) workingMap.spawns = [];
    const hit = spawnAt(point);
    if (hit >= 0) {
      selectedSpawn = hit;
      selectedIndex = -1;
      syncPlatformInputs();
      const s = workingMap.spawns[hit];
      drag = { mode: 'spawnMove', index: hit, offsetX: point.x - s.x, offsetY: point.y - s.y };
    } else if (workingMap.spawns.length >= MAX_SPAWNS) {
      showEditorNotice(`Limite de ${MAX_SPAWNS} pontos de nascimento (um por jogador).`);
      return;
    } else {
      workingMap.spawns.push({ x: Math.round(point.x), y: Math.round(point.y) });
      selectedSpawn = workingMap.spawns.length - 1;
      selectedIndex = -1;
      syncPlatformInputs();
      markDirty();
    }
    renderCanvas();
    return;
  }

  if (tool === 'add') {
    drag = { mode: 'create', startX: point.x, startY: point.y, rect: null };
    return;
  }

  const corner = handleAt(point);
  if (corner) {
    const p = getSelectedPlatform();
    drag = { mode: 'resize', corner, origin: { ...p } };
    return;
  }

  const hit = platformAt(point);
  selectedSpawn = -1;
  if (hit >= 0) {
    selectedIndex = hit;
    const p = workingMap.platforms[hit];
    drag = { mode: 'move', offsetX: point.x - p.x, offsetY: point.y - p.y };
    syncPlatformInputs();
    renderCanvas();
  } else {
    selectedIndex = -1;
    syncPlatformInputs();
    renderCanvas();
  }
}

function onPointerMove(event) {
  if (!drag || !workingMap) return;
  const point = canvasPoint(event);

  if (drag.mode === 'create') {
    drag.rect = {
      x: Math.min(drag.startX, point.x),
      y: Math.min(drag.startY, point.y),
      width: Math.abs(point.x - drag.startX),
      height: Math.abs(point.y - drag.startY)
    };
    renderCanvas();
    return;
  }

  if (drag.mode === 'spawnMove') {
    const s = workingMap.spawns && workingMap.spawns[drag.index];
    if (!s) return;
    s.x = Math.round(Math.min(MAP_EDITOR_WIDTH, Math.max(0, point.x - drag.offsetX)));
    s.y = Math.round(Math.min(MAP_EDITOR_HEIGHT, Math.max(0, point.y - drag.offsetY)));
    renderCanvas();
    return;
  }

  const p = getSelectedPlatform();
  if (!p) return;

  if (drag.mode === 'move') {
    p.x = Math.min(MAP_EDITOR_WIDTH - p.width, Math.max(0, Math.round(point.x - drag.offsetX)));
    p.y = Math.min(MAP_EDITOR_HEIGHT - p.height, Math.max(0, Math.round(point.y - drag.offsetY)));
  } else if (drag.mode === 'resize') {
    resizeFromCorner(p, point);
  }
  syncPlatformInputs();
  renderCanvas();
}

function resizeFromCorner(p, point) {
  const o = drag.origin;
  let left = o.x;
  let top = o.y;
  let right = o.x + o.width;
  let bottom = o.y + o.height;
  if (drag.corner.includes('w')) left = point.x;
  if (drag.corner.includes('e')) right = point.x;
  if (drag.corner.includes('n')) top = point.y;
  if (drag.corner.includes('s')) bottom = point.y;
  const x = Math.max(0, Math.min(left, right));
  const y = Math.max(0, Math.min(top, bottom));
  const width = Math.min(MAP_EDITOR_WIDTH - x, Math.max(8, Math.abs(right - left)));
  const height = Math.min(MAP_EDITOR_HEIGHT - y, Math.max(8, Math.abs(bottom - top)));
  p.x = Math.round(x);
  p.y = Math.round(y);
  p.width = Math.round(width);
  p.height = Math.round(height);
}

function onPointerUp() {
  if (!drag || !workingMap) return;
  if (drag.mode === 'create') {
    let rect = drag.rect;
    if (!rect || rect.width < 8 || rect.height < 8) {
      const w = 200;
      const h = 24;
      rect = {
        x: Math.min(MAP_EDITOR_WIDTH - w, Math.max(0, drag.startX - w / 2)),
        y: Math.min(MAP_EDITOR_HEIGHT - h, Math.max(0, drag.startY - h / 2)),
        width: w,
        height: h
      };
    }
    if (workingMap.platforms.length < MAX_MAP_PLATFORMS) {
      const color = DEFAULT_PALETTE[workingMap.platforms.length % DEFAULT_PALETTE.length];
      workingMap.platforms.push({ ...rect, color });
      selectedIndex = workingMap.platforms.length - 1;
      setTool('select');
      syncPlatformInputs();
      markDirty();
    } else {
      showEditorNotice(`Limite de ${MAX_MAP_PLATFORMS} plataformas.`);
    }
  } else if (drag.mode === 'spawnMove') {
    markDirty();
  } else {
    markDirty();
  }
  drag = null;
  renderCanvas();
}

function renderCanvas() {
  if (!workingMap) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, MAP_EDITOR_WIDTH, MAP_EDITOR_HEIGHT);
  ctx.fillStyle = workingMap.bg || '#bfe8ff';
  ctx.fillRect(0, 0, MAP_EDITOR_WIDTH, MAP_EDITOR_HEIGHT);

  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let x = 60; x < MAP_EDITOR_WIDTH; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, MAP_EDITOR_HEIGHT);
    ctx.stroke();
  }
  for (let y = 60; y < MAP_EDITOR_HEIGHT; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(MAP_EDITOR_WIDTH, y);
    ctx.stroke();
  }

  workingMap.platforms.forEach((p, index) => {
    ctx.fillStyle = p.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x, p.y, p.width, p.height);
  });

  if (drag && drag.mode === 'create' && drag.rect) {
    const r = drag.rect;
    ctx.fillStyle = 'rgba(255,224,102,0.5)';
    ctx.fillRect(r.x, r.y, r.width, r.height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.width, r.height);
  }

  const selected = getSelectedPlatform();
  if (selected) {
    ctx.strokeStyle = '#4dabf7';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(selected.x - 3, selected.y - 3, selected.width + 6, selected.height + 6);
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    for (const [cx, cy] of [
      [selected.x, selected.y],
      [selected.x + selected.width, selected.y],
      [selected.x, selected.y + selected.height],
      [selected.x + selected.width, selected.y + selected.height]
    ]) {
      ctx.beginPath();
      ctx.rect(cx - HANDLE_SIZE / 2, cy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.fill();
      ctx.stroke();
    }
  }

  const spawns = Array.isArray(workingMap.spawns) ? workingMap.spawns : [];
  spawns.forEach((spawn, index) => {
    const color = SPAWN_COLORS[index % SPAWN_COLORS.length];
    const isSelected = index === selectedSpawn;

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(spawn.x, spawn.y + 4, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (isSelected) {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(spawn.x, spawn.y - 12, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(spawn.x, spawn.y);
    ctx.lineTo(spawn.x, spawn.y - 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y - 30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "Trebuchet MS", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('P' + (index + 1), spawn.x, spawn.y - 29.5);
    ctx.textBaseline = 'alphabetic';
  });
}

function syncAllInputs() {
  if (!workingMap) return;
  $('mapNameInput').value = workingMap.name;
  $('mapModeSelect').value = workingMap.mode || GAME_MODES[0].id;
  updateModeChipTheme();
  $('mapBgColorInput').value = workingMap.bg || '#bfe8ff';
  $('mapBgColorHex').textContent = (workingMap.bg || '#bfe8ff').toUpperCase();
  syncPlatformInputs();
  syncMusicInputs();
}

function updateModeChipTheme() {
  const select = $('mapModeSelect');
  const mode = GAME_MODES.find(m => m.id === select.value) || GAME_MODES[0];
  select.style.setProperty('--chip-color', mode && mode.color ? mode.color : '#ff6b6b');
}

function syncPlatformInputs() {
  const platform = getSelectedPlatform();
  if (!platform) {
    for (const id of ['mapPropX', 'mapPropY', 'mapPropW', 'mapPropH']) $(id).value = '';
    return;
  }
  $('mapPropX').value = platform.x;
  $('mapPropY').value = platform.y;
  $('mapPropW').value = platform.width;
  $('mapPropH').value = platform.height;
  $('mapPropColor').value = platform.color || DEFAULT_PALETTE[0];
  $('mapPropColorHex').textContent = (platform.color || DEFAULT_PALETTE[0]).toUpperCase();
}

function musicSelectValue() {
  const music = workingMap.music || { type: 'default' };
  if (music.type === 'native' && music.track) return 'native:' + music.track;
  if (music.type === 'custom') return 'custom';
  return 'default';
}

function syncMusicInputs() {
  const music = workingMap.music || { type: 'default' };
  $('mapMusicSelect').value = musicSelectValue();
  const isCustom = music.type === 'custom';
  $('mapMusicCustomRow').style.display = isCustom ? 'block' : 'none';
  $('mapMusicFileName').textContent = isCustom
    ? (music.name ? `Arquivo atual: ${music.name}` : 'Nenhum arquivo enviado ainda.')
    : '';
}

function applyMusicSelection(value) {
  stopPreview();
  if (value === 'default') {
    workingMap.music = { type: 'default' };
  } else if (value === 'custom') {
    const previous = workingMap.music;
    workingMap.music = {
      type: 'custom',
      id: previous && previous.type === 'custom' ? previous.id : null,
      name: previous && previous.type === 'custom' ? previous.name : null
    };
  } else if (value.startsWith('native:')) {
    workingMap.music = { type: 'native', track: value.slice(7) };
  }
  markDirty();
  syncMusicInputs();
}

function uploadCustomMusic(file) {
  if (!file.type.startsWith('audio/')) {
    showEditorNotice('Arquivo não é um áudio.');
    return;
  }
  if (file.size > MAX_MAP_MUSIC_SIZE) {
    showEditorNotice(`Áudio muito grande. Máximo: ${Math.round(MAX_MAP_MUSIC_SIZE / 100000) / 10}MB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const id = workingMap.music && workingMap.music.id ? workingMap.music.id : uuid();
    try {
      putCustomMusic(id, { name: file.name, data: reader.result });
    } catch (error) {
      showEditorNotice('Espaço insuficiente no navegador para salvar este áudio.');
      return;
    }
    workingMap.music = { type: 'custom', id, name: file.name };
    markDirty();
    syncMusicInputs();
    showEditorNotice(`Música "${file.name}" adicionada ao mapa.`);
  };
  reader.onerror = () => showEditorNotice('Falha ao ler o arquivo.');
  reader.readAsDataURL(file);
}

function previewSource() {
  const music = workingMap.music || { type: 'default' };
  if (music.type === 'native' && music.track) return 'musics/game/' + music.track;
  if (music.type === 'custom' && music.id) {
    const entry = getCustomMusic(music.id);
    if (entry && entry.data) return entry.data;
  }
  const tracks = getNativeGameTracks();
  return tracks[Math.floor(Math.random() * tracks.length)];
}

function startPreview() {
  stopPreview();
  previewAudio = new Audio(previewSource());
  previewAudio.loop = true;
  previewAudio.volume = 1;
  const promise = previewAudio.play();
  if (promise && promise.catch) promise.catch(() => {});
}

function stopPreview() {
  if (!previewAudio) return;
  previewAudio.pause();
  previewAudio.currentTime = 0;
  previewAudio = null;
}

function markDirty() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveWorkingMap(false), 500);
}

function saveWorkingMap(withNotice) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!workingMap) return;
  workingMap.updatedAt = Date.now();
  const maps = loadCustomMaps();
  const index = maps.findIndex(entry => entry.id === workingMap.id);
  if (index >= 0) maps[index] = cloneMap(workingMap);
  else maps.push(cloneMap(workingMap));
  try {
    saveCustomMaps(maps);
  } catch (error) {
    showEditorNotice('Não foi possível salvar (armazenamento cheio).');
    return;
  }
  if (withNotice) showEditorNotice(`Mapa "${workingMap.name}" salvo!`);
  renderSavedList();
}

function renderSavedList() {
  const list = $('mapSavedList');
  list.innerHTML = '';
  const maps = loadCustomMaps();
  if (maps.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'map-saved-empty';
    empty.textContent = 'Nenhum mapa salvo ainda.';
    list.appendChild(empty);
    return;
  }
  for (const entry of maps) {
    const li = document.createElement('li');
    if (workingMap && entry.id === workingMap.id) li.classList.add('current');

    const name = document.createElement('span');
    name.className = 'map-saved-name';
    name.textContent = entry.name || 'Sem nome';

    const mode = document.createElement('span');
    mode.className = 'map-saved-mode';
    const modeDef = GAME_MODES.find(m => m.id === (entry.mode || 'bomb'));
    mode.textContent = modeDef ? modeDef.name : entry.mode;

    const editBtn = document.createElement('button');
    editBtn.className = 'secondary';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => {
      saveWorkingMap(false);
      workingMap = cloneMap(entry);
      selectedIndex = -1;
      selectedSpawn = -1;
      stopPreview();
      syncAllInputs();
      renderCanvas();
      renderSavedList();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger';
    deleteBtn.textContent = 'X';
    deleteBtn.title = 'Excluir mapa';
    deleteBtn.addEventListener('click', () => {
      showConfirm(`Excluir o mapa "${entry.name}"?`, () => {
        removeSavedMap(entry.id);
      });
    });

    li.appendChild(name);
    li.appendChild(mode);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }
}

function removeSavedMap(id) {
  const maps = loadCustomMaps().filter(entry => entry.id !== id);
  try {
    saveCustomMaps(maps);
  } catch (error) {}
  const stillUsed = maps.some(entry =>
    entry.music && entry.music.type === 'custom' && entry.music.id === id);
  if (!stillUsed) deleteCustomMusic(id);
  if (workingMap && workingMap.id === id) {
    workingMap = newMap();
    selectedIndex = -1;
    selectedSpawn = -1;
    syncAllInputs();
    renderCanvas();
  }
  renderSavedList();
}

function slugify(name) {
  return (name || 'mapa')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mapa';
}

function exportMap() {
  const payload = {
    format: 'partygame-map',
    version: 1,
    mode: workingMap.mode || GAME_MODES[0].id,
    name: workingMap.name,
    bg: workingMap.bg,
    platforms: workingMap.platforms.map(p => ({ ...p })),
    spawns: (Array.isArray(workingMap.spawns) ? workingMap.spawns : []).map(s => ({ ...s })),
    music: { ...(workingMap.music || { type: 'default' }) }
  };
  if (payload.music.type === 'custom' && payload.music.id) {
    const entry = getCustomMusic(payload.music.id);
    if (entry) {
      payload.music.name = entry.name;
      payload.music.data = entry.data;
    }
  }
  delete payload.music.id;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(payload.name)}.pgmap`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showEditorNotice('Mapa exportado!');
}

function sanitizePlatform(raw) {
  const num = (value) => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? n : 0;
  };
  const width = Math.min(MAP_EDITOR_WIDTH, Math.max(8, num(raw.width)));
  const height = Math.min(MAP_EDITOR_HEIGHT, Math.max(8, num(raw.height)));
  const x = Math.min(MAP_EDITOR_WIDTH - width, Math.max(0, num(raw.x)));
  const y = Math.min(MAP_EDITOR_HEIGHT - height, Math.max(0, num(raw.y)));
  const color = typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color)
    ? raw.color
    : DEFAULT_PALETTE[0];
  return { x, y, width, height, color };
}

function sanitizeSpawns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_SPAWNS).map(spawn => {
    const x = Math.min(MAP_EDITOR_WIDTH, Math.max(0, Math.round(Number(spawn && spawn.x))));
    const y = Math.min(MAP_EDITOR_HEIGHT, Math.max(0, Math.round(Number(spawn && spawn.y))));
    return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
  });
}

function importMapFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (error) {
      showEditorNotice('Arquivo inválido (não é um mapa do Party Game).');
      return;
    }
    if (!data || data.format !== 'partygame-map' || !Array.isArray(data.platforms)) {
      showEditorNotice('Arquivo inválido (formato desconhecido).');
      return;
    }
    const mode = typeof data.mode === 'string' ? data.mode : 'bomb';
    if (!GAME_MODES.some(m => m.id === mode)) {
      showEditorNotice(`Este arquivo é para o modo "${mode}", que não é suportado nesta versão.`);
      return;
    }
    if (data.platforms.length > MAX_MAP_PLATFORMS) {
      showEditorNotice(`O mapa tem ${data.platforms.length} plataformas (máximo ${MAX_MAP_PLATFORMS}).`);
      return;
    }

    const musicImported = data.music && typeof data.music === 'object' ? data.music : { type: 'default' };
    let music = { type: 'default' };
    if (musicImported.type === 'native' && typeof musicImported.track === 'string') {
      music = { type: 'native', track: musicImported.track };
    } else if (musicImported.type === 'custom' && typeof musicImported.data === 'string' && musicImported.data.startsWith('data:audio')) {
      const id = uuid();
      try {
        putCustomMusic(id, { name: musicImported.name || 'Música importada', data: musicImported.data });
      } catch (error) {
        showEditorNotice('Espaço insuficiente para importar a música do arquivo (o resto do mapa foi importado).');
      }
      music = { type: 'custom', id, name: musicImported.name || 'Música importada' };
    } else if (musicImported.type === 'custom') {
      music = { type: 'custom', id: null, name: musicImported.name || null };
    }

    saveWorkingMap(false);
    workingMap = {
      id: uuid(),
      name: (typeof data.name === 'string' && data.name.trim()) || 'Mapa importado',
      mode,
      bg: typeof data.bg === 'string' && /^#[0-9a-f]{6}$/i.test(data.bg) ? data.bg : '#bfe8ff',
      platforms: data.platforms.map(sanitizePlatform),
      spawns: sanitizeSpawns(data.spawns),
      music,
      updatedAt: Date.now()
    };
    selectedIndex = -1;
    selectedSpawn = -1;
    stopPreview();
    saveWorkingMap(false);
    syncAllInputs();
    renderCanvas();
    renderSavedList();
    showEditorNotice(`Mapa "${workingMap.name}" importado!`);
  };
  reader.onerror = () => showEditorNotice('Falha ao ler o arquivo.');
  reader.readAsText(file);
}
