import { state } from './state.js';
import { getTouchEnabled } from './storage.js';
import { playClick } from './audio.js';

const $ = (id) => document.getElementById(id);

const box = $('donateBox');
const modal = $('donateModal');
const pixCodeEl = $('donatePixCode');
const copyBtn = $('donateCopyBtn');
const closeBtn = $('donateCloseBtn');

export function updateDonateVisibility() {
  if (!box) return;
  const hideDuringGameTouch = state.currentScreen === 'game' && getTouchEnabled();
  box.classList.toggle('hidden', !!hideDuringGameTouch);
}

function openDonateModal() {
  modal.classList.remove('hidden');
}

function closeDonateModal() {
  modal.classList.add('hidden');
}

export function initDonate() {
  if (!box) return;
  box.addEventListener('click', () => {
    playClick();
    openDonateModal();
  });
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = pixCodeEl.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copiado!';
          setTimeout(() => { copyBtn.textContent = 'Copiar código PIX'; }, 1500);
        });
      } else {
        pixCodeEl.select();
        document.execCommand('copy');
      }
      playClick();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeDonateModal();
      playClick();
    });
  }
  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeDonateModal();
    });
  }
}

initDonate();
