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
  analog: [18, 72],
  scale: 10,
  buttonScales: {}
};

const controlsEl = $('touchControls');
const editorEl = $('touchLayoutEditor');
const editorStage = $('touchLayoutStage');
let editorLayout = null;

export function getTouchButtonScale() {
  const layout = getTouchLayout();
  return (layout && typeof layout.scale === 'number') ? layout.scale : DEFAULT_TOUCH_LAYOUT.scale;
}

function applyScaleToButton(el, scale, perButtonScale) {
  if (!el || scale == null) return;
  const s = (perButtonScale != null ? perButtonScale : scale) / 10;
  if (el.classList.contains('touch-analog')) {
    const w = Math.round(110 * s);
    el.style.width = w + 'px';
    el.style.height = w + 'px';
    const knob = el.querySelector('.touch-analog-knob') || el.querySelector('.touch-analog-knob-edit');
    if (knob) {
      const ks = Math.round(52 * s);
      knob.style.width = ks + 'px';
      knob.style.height = ks + 'px';
      knob.style.marginLeft = (-ks / 2) + 'px';
      knob.style.marginTop = (-ks / 2) + 'px';
    }
  } else if (el.classList.contains('touch-btn')) {
    const base = el.classList.contains('touch-btn-action') ? 74 : 64;
    const w = Math.round(base * s);
    const h = Math.round(base * s);
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    if (el.classList.contains('touch-btn-action')) {
      el.style.fontSize = Math.max(10, Math.round(12 * s)) + 'px';
    }
  }
}

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
  const layout = getTouchLayout() || DEFAULT_TOUCH_LAYOUT;
  const scale = (typeof layout.scale === 'number') ? layout.scale : DEFAULT_TOUCH_LAYOUT.scale;
  const bs = layout.buttonScales || {};
  if (mode === 'rhythm') {
    const row = document.createElement('div');
    row.className = 'touch-rhythm-row';
    const rs = scale / 10;
    row.style.gap = Math.round(14 * rs) + 'px';
    [['up', '&#9650;'], ['down', '&#9660;'], ['left', '&#9664;'], ['right', '&#9654;']].forEach(([dir, glyph]) => {
      const btn = makeButton('touch-btn touch-rhythm-btn', glyph);
      const baseSize = 62;
      const ps = bs[dir] != null ? bs[dir] : scale;
      const sz = Math.round(baseSize * ps / 10);
      btn.style.width = sz + 'px';
      btn.style.height = sz + 'px';
      btn.style.fontSize = Math.max(12, Math.round(22 * ps / 10)) + 'px';
      wireButton(btn, dir, setRhythmTouch);
      row.appendChild(btn);
    });
    controlsEl.appendChild(row);
    builtMode = mode;
    return;
  }
  const style = getTouchStyle();
  if (style === 'analog') {
    const joystick = addAnalogJoystick(layout.analog || DEFAULT_TOUCH_LAYOUT.analog);
    applyScaleToButton(joystick, scale, bs.analog);
  } else {
    const leftBtn = addArrowButton('left', '&#9664;', layout.left || DEFAULT_TOUCH_LAYOUT.left);
    const rightBtn = addArrowButton('right', '&#9654;', layout.right || DEFAULT_TOUCH_LAYOUT.right);
    applyScaleToButton(leftBtn, scale, bs.left);
    applyScaleToButton(rightBtn, scale, bs.right);
  }
  const jumpBtn = addActionButton('jump', 'JUMP', layout.jump || DEFAULT_TOUCH_LAYOUT.jump);
  const dashBtn = addActionButton('dash', currentActionLabel(), layout.dash || DEFAULT_TOUCH_LAYOUT.dash);
  applyScaleToButton(jumpBtn, scale, bs.jump);
  applyScaleToButton(dashBtn, scale, bs.dash);
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

let selectedEditorButton = null;

function rebuildEditor(preserveSelection) {
  if (!editorStage) return;
  const prevSelection = preserveSelection ? selectedEditorButton : null;
  editorStage.innerHTML = '';
  selectedEditorButton = null;
  const style = getTouchStyle();
  const scale = (editorLayout && typeof editorLayout.scale === 'number') ? editorLayout.scale : DEFAULT_TOUCH_LAYOUT.scale;
  const bs = (editorLayout && editorLayout.buttonScales) || {};
  const addDrag = (key, className, content) => {
    const el = editorButton(className, content);
    el.dataset.key = key;
    setPos(el, editorLayout[key] || DEFAULT_TOUCH_LAYOUT[key]);
    makeDraggable(el, key);
    applyScaleToButton(el, scale, bs[key]);
    el.addEventListener('click', () => onEditorButtonClick(key));
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
  if (prevSelection) {
    selectedEditorButton = prevSelection;
    const children = editorStage.children;
    for (let i = 0; i < children.length; i++) {
      children[i].classList.toggle('selected', children[i].dataset.key === selectedEditorButton);
    }
  }
  refreshScaleSlider();
}

function onEditorButtonClick(key) {
  if (selectedEditorButton === key) {
    selectedEditorButton = null;
  } else {
    selectedEditorButton = key;
  }
  const children = editorStage.children;
  for (let i = 0; i < children.length; i++) {
    children[i].classList.toggle('selected', children[i].dataset.key === selectedEditorButton);
  }
  refreshScaleSlider();
}

function refreshScaleSlider() {
  const scaleInput = $('touchLayoutScaleInput');
  const scaleValue = $('touchLayoutScaleValue');
  const scaleLabel = $('touchLayoutScaleLabel');
  if (!scaleInput) return;
  const bs = (editorLayout && editorLayout.buttonScales) || {};
  const globalScale = (editorLayout && typeof editorLayout.scale === 'number') ? editorLayout.scale : DEFAULT_TOUCH_LAYOUT.scale;
  const LABELS = { left: 'Esquerda', right: 'Direita', jump: 'Pular', dash: 'Ação', analog: 'Analógico' };
  if (selectedEditorButton) {
    const val = bs[selectedEditorButton] != null ? bs[selectedEditorButton] : globalScale;
    scaleInput.value = val;
    if (scaleValue) scaleValue.textContent = (val / 10).toFixed(1);
    if (scaleLabel) scaleLabel.textContent = `Escala "${LABELS[selectedEditorButton] || selectedEditorButton}": `;
    if (scaleValue && scaleLabel) { scaleLabel.appendChild(scaleValue); scaleLabel.appendChild(document.createTextNode('x')); }
  } else {
    scaleInput.value = globalScale;
    if (scaleValue) scaleValue.textContent = (globalScale / 10).toFixed(1);
    if (scaleLabel) scaleLabel.textContent = 'Escala dos botões: ';
    if (scaleValue && scaleLabel) { scaleLabel.appendChild(scaleValue); scaleLabel.appendChild(document.createTextNode('x')); }
  }
}

export function openLayoutEditor() {
  if (!editorEl || !editorStage) return;
  editorLayout = JSON.parse(JSON.stringify(getTouchLayout() || DEFAULT_TOUCH_LAYOUT));
  if (typeof editorLayout.scale !== 'number') editorLayout.scale = DEFAULT_TOUCH_LAYOUT.scale;
  if (!editorLayout.buttonScales) editorLayout.buttonScales = {};
  selectedEditorButton = null;
  rebuildEditor();
  const scaleInput = $('touchLayoutScaleInput');
  const scaleValue = $('touchLayoutScaleValue');
  if (scaleInput) {
    scaleInput.oninput = () => {
      const val = Number(scaleInput.value);
      if (selectedEditorButton) {
        if (!editorLayout.buttonScales) editorLayout.buttonScales = {};
        editorLayout.buttonScales[selectedEditorButton] = val;
      } else {
        editorLayout.scale = val;
      }
      if (scaleValue) scaleValue.textContent = (val / 10).toFixed(1);
      rebuildEditor(true);
    };
  }
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
      if (editorLayout) {
        if (typeof editorLayout.scale !== 'number') editorLayout.scale = DEFAULT_TOUCH_LAYOUT.scale;
        if (!editorLayout.buttonScales) editorLayout.buttonScales = {};
        saveTouchLayout(editorLayout);
      }
      builtMode = null;
      closeLayoutEditor();
      playClick();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetTouchLayout();
      editorLayout = JSON.parse(JSON.stringify(DEFAULT_TOUCH_LAYOUT));
      selectedEditorButton = null;
      const scaleInput = $('touchLayoutScaleInput');
      const scaleValue = $('touchLayoutScaleValue');
      if (scaleInput) {
        scaleInput.value = DEFAULT_TOUCH_LAYOUT.scale;
        if (scaleValue) scaleValue.textContent = (DEFAULT_TOUCH_LAYOUT.scale / 10).toFixed(1);
      }
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
