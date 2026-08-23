import { state } from './state.js';
import { setTouchInput, setRhythmTouch } from './input.js';
import {
  getTouchEnabled,
  getTouchStyle,
  getTouchLayout,
  saveTouchLayout,
  resetTouchLayout
} from './storage.js';
import { playClick } from './audio.js';

const $ = (id) => document.getElementById(id);

export const DEFAULT_TOUCH_LAYOUT = {
  left: [14, 72],
  right: [30, 72],
  jump: [77, 56],
  dash: [90, 72],
  analog: [18, 72]
};

const controlsEl = $('touchControls');
const editorEl = $('touchLayoutEditor');
const editorStage = $('touchLayoutStage');
let editorLayout = null;

function setPos(el, pos) {
  el.style.left = pos[0] + '%';
  el.style.top = pos[1] + '%';
}

function releaseAll() {
  setTouchInput('left', false);
  setTouchInput('right', false);
  setTouchInput('jump', false);
  setTouchInput('dash', false);
  ['up', 'right', 'down', 'left'].forEach(dir => setRhythmTouch(dir, false));
}

function makeButton(className, content) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.innerHTML = content;
  return btn;
}

function wireButton(btn, action, setter = setTouchInput) {
  const press = event => {
    event.preventDefault();
    if (event.pointerType) btn.setPointerCapture(event.pointerId);
    setter(action, true);
  };
  const release = () => setter(action, false);
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('contextmenu', event => event.preventDefault());
}

function addArrowButton(action, arrow, pos) {
  const btn = makeButton('touch-btn touch-btn-arrow', arrow);
  setPos(btn, pos);
  wireButton(btn, action);
  controlsEl.appendChild(btn);
  return btn;
}

function addActionButton(action, label, pos) {
  const btn = makeButton('touch-btn touch-btn-action', `<span>${label}</span>`);
  setPos(btn, pos);
  wireButton(btn, action);
  controlsEl.appendChild(btn);
  return btn;
}

function addAnalogJoystick(pos) {
  const base = document.createElement('div');
  base.className = 'touch-analog';
  const knob = document.createElement('div');
  knob.className = 'touch-analog-knob';
  base.appendChild(knob);
  setPos(base, pos);

  const RADIUS = 30;
  const THRESHOLD = 10;
  let active = false;
  let centerX = 0;
  let centerY = 0;

  const applyStick = clientX => {
    if (!active) return;
    let dx = clientX.x - centerX;
    let dy = clientX.y - centerY;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    setTouchInput('left', dx < -THRESHOLD);
    setTouchInput('right', dx > THRESHOLD);
  };

  const resetStick = () => {
    if (!active) return;
    active = false;
    knob.style.transform = 'translate(0px, 0px)';
    setTouchInput('left', false);
    setTouchInput('right', false);
  };

  base.addEventListener('pointerdown', event => {
    event.preventDefault();
    if (active) return;
    active = true;
    base.setPointerCapture(event.pointerId);
    const rect = base.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    applyStick(event);
  });
  base.addEventListener('pointermove', applyStick);
  base.addEventListener('pointerup', resetStick);
  base.addEventListener('pointercancel', resetStick);
  base.addEventListener('contextmenu', event => event.preventDefault());

  controlsEl.appendChild(base);
  return base;
}

const MODE_TOUCH_LABELS = {
  bomb: 'DASH',
  egg: 'DASH',
  run: 'USAR',
  war: 'ATIRAR'
};

let builtMode = null;

function currentActionLabel() {
  const mode = state.gameState && state.gameState.mode;
  return MODE_TOUCH_LABELS[mode] || 'DASH';
}

function rebuild() {
  if (!controlsEl) return;
  controlsEl.innerHTML = '';
  const mode = (state.gameState && state.gameState.mode) || null;
  if (mode === 'rhythm') {
    const row = document.createElement('div');
    row.className = 'touch-rhythm-row';
    [['up', '&#9650;'], ['down', '&#9660;'], ['left', '&#9664;'], ['right', '&#9654;']].forEach(([dir, glyph]) => {
      const btn = makeButton('touch-btn touch-rhythm-btn', glyph);
      wireButton(btn, dir, setRhythmTouch);
      row.appendChild(btn);
    });
    controlsEl.appendChild(row);
    builtMode = mode;
    return;
  }
  const style = getTouchStyle();
  const layout = getTouchLayout() || DEFAULT_TOUCH_LAYOUT;
  if (style === 'analog') {
    addAnalogJoystick(layout.analog || DEFAULT_TOUCH_LAYOUT.analog);
  } else {
    addArrowButton('left', '&#9664;', layout.left || DEFAULT_TOUCH_LAYOUT.left);
    addArrowButton('right', '&#9654;', layout.right || DEFAULT_TOUCH_LAYOUT.right);
  }
  addActionButton('jump', 'JUMP', layout.jump || DEFAULT_TOUCH_LAYOUT.jump);
  addActionButton('dash', currentActionLabel(), layout.dash || DEFAULT_TOUCH_LAYOUT.dash);
  builtMode = mode;
}

export function updateTouchVisibility() {
  const roundEnded = !!(state.gameState && (state.gameState.roundResult != null || state.gameState.pendingResult));
  const show = state.currentScreen === 'game' && !roundEnded && getTouchEnabled();
  if (!controlsEl) return;
  const mode = (state.gameState && state.gameState.mode) || null;
  const needsRebuild = show && (controlsEl.childElementCount === 0 || mode !== builtMode);
  controlsEl.classList.toggle('hidden', !show);
  if (show) {
    if (needsRebuild) rebuild();
  } else {
    releaseAll();
  }
}

function editorButton(className, content) {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = content;
  return el;
}

function makeDraggable(el, key) {
  el.addEventListener('pointerdown', event => {
    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    const move = ev => {
      const rect = editorStage.getBoundingClientRect();
      const x = Math.max(3, Math.min(97, ((ev.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(3, Math.min(97, ((ev.clientY - rect.top) / rect.height) * 100));
      editorLayout[key] = [x, y];
      setPos(el, [x, y]);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}

function rebuildEditor() {
  if (!editorStage) return;
  editorStage.innerHTML = '';
  const style = getTouchStyle();
  const addDrag = (key, className, content) => {
    const el = editorButton(className, content);
    setPos(el, editorLayout[key] || DEFAULT_TOUCH_LAYOUT[key]);
    makeDraggable(el, key);
    editorStage.appendChild(el);
  };
  if (style === 'analog') {
    addDrag('analog', 'touch-btn touch-btn-arrow touch-analog', '<span class="touch-analog-knob-edit"></span>');
  } else {
    addDrag('left', 'touch-btn touch-btn-arrow', '&#9664;');
    addDrag('right', 'touch-btn touch-btn-arrow', '&#9654;');
  }
  addDrag('jump', 'touch-btn touch-btn-action', '<span>JUMP</span>');
  addDrag('dash', 'touch-btn touch-btn-action', '<span>DASH</span>');
}

export function openLayoutEditor() {
  if (!editorEl || !editorStage) return;
  editorLayout = JSON.parse(JSON.stringify(getTouchLayout() || DEFAULT_TOUCH_LAYOUT));
  rebuildEditor();
  editorEl.classList.remove('hidden');
}

export function closeLayoutEditor() {
  if (!editorEl) return;
  editorEl.classList.add('hidden');
}

export function initTouch() {
  if (!editorEl || !editorStage) return;
  const confirmBtn = $('touchLayoutConfirmBtn');
  const resetBtn = $('touchLayoutResetBtn');
  const closeBtn = $('touchLayoutCloseBtn');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (editorLayout) saveTouchLayout(editorLayout);
      closeLayoutEditor();
      playClick();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetTouchLayout();
      editorLayout = JSON.parse(JSON.stringify(DEFAULT_TOUCH_LAYOUT));
      rebuildEditor();
      playClick();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeLayoutEditor();
      playClick();
    });
  }
  if (editorEl) {
    editorEl.addEventListener('pointerdown', event => {
      if (event.target === editorEl) closeLayoutEditor();
    });
  }
}

initTouch();
