import { playClick } from './audio.js';

const PRESETS = [
  '#ff6b6b', '#ff9f43', '#ffd23f', '#8ce99a', '#2ecc40', '#63e6be', '#7fd3f2',
  '#4dabf7', '#5c7cfa', '#b197fc', '#f78fb3', '#ffffff', '#adb5bd', '#222222'
];

const COLOR_INPUT_SELECTOR = 'input[type="color"]';

let modal = null;
let gridEl = null;
let nativeInput = null;
let activeInput = null;

function ensureModal() {
  if (modal) return;
  modal = document.createElement('div');
  modal.className = 'modal hidden';
  const box = document.createElement('div');
  box.className = 'modal-box color-picker-box';

  const title = document.createElement('h3');
  title.textContent = '🎨 Escolha uma cor';
  box.appendChild(title);

  gridEl = document.createElement('div');
  gridEl.className = 'color-grid';
  PRESETS.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-swatch';
    btn.style.background = color;
    btn.dataset.color = color;
    btn.title = color.toUpperCase();
    btn.setAttribute('aria-label', `Cor ${color.toUpperCase()}`);
    btn.addEventListener('click', () => applyColor(color));
    gridEl.appendChild(btn);
  });
  box.appendChild(gridEl);

  const actions = document.createElement('div');
  actions.className = 'link-row';

  nativeInput = document.createElement('input');
  nativeInput.type = 'color';
  nativeInput.className = 'color-picker-native';
  nativeInput.addEventListener('click', event => event.stopPropagation());
  nativeInput.addEventListener('input', () => {
    applyColor(nativeInput.value);
  });

  const otherBtn = document.createElement('button');
  otherBtn.type = 'button';
  otherBtn.textContent = '🌈 Outra cor…';
  otherBtn.addEventListener('click', () => {
    nativeInput.value = activeInput ? activeInput.value : '#ffffff';
    nativeInput.click();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'secondary';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', close);

  actions.appendChild(otherBtn);
  actions.appendChild(cancelBtn);
  box.appendChild(actions);
  box.appendChild(nativeInput);
  modal.appendChild(box);
  modal.addEventListener('pointerdown', event => {
    if (event.target === modal) close();
  });
  document.body.appendChild(modal);
}

function markSelected(color) {
  if (!gridEl) return;
  gridEl.querySelectorAll('.color-swatch').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color.toLowerCase() === String(color).toLowerCase());
  });
}

function applyColor(color) {
  if (!activeInput) return;
  activeInput.value = color;
  activeInput.dispatchEvent(new Event('input', { bubbles: true }));
  activeInput.dispatchEvent(new Event('change', { bubbles: true }));
  markSelected(color);
  close();
  playClick();
}

export function openColorPicker(input) {
  ensureModal();
  activeInput = input || null;
  markSelected(activeInput ? activeInput.value : '');
  modal.classList.remove('hidden');
}

export function closeColorPicker() {
  if (!modal) return;
  modal.classList.add('hidden');
  activeInput = null;
}

function close() {
  closeColorPicker();
}

// Abre o seletor próprio do jogo em vez do nativo do navegador,
// garantindo a mesma tela de cores em PC e celular.
export function initColorPickers(root = document) {
  root.querySelectorAll(COLOR_INPUT_SELECTOR).forEach(input => {
    if (input.dataset.colorPickerBound) return;
    input.dataset.colorPickerBound = '1';
    input.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      openColorPicker(input);
    }, { capture: true });
    input.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openColorPicker(input);
    });
  });
}
