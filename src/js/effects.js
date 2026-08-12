const CONFETTI_COLORS = ['#ff6b6b', '#ffd23f', '#2ecc40', '#7fd3f2', '#f78fb3', '#b388ff', '#ff9f43', '#ff5252'];

export function spawnConfetti(count = 50, anchor = null) {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    layer.style.position = 'fixed';
    layer.style.left = `${rect.left}px`;
    layer.style.top = `${rect.top}px`;
    layer.style.width = `${Math.max(40, rect.width)}px`;
    layer.style.height = `${Math.max(40, rect.height)}px`;
  }
  document.body.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${10 + Math.random() * 8}px`;
    piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.setProperty('--sway', `${Math.random() * 140 - 70}px`);
    piece.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty('--fall', anchor ? '130%' : '110vh');
    layer.appendChild(piece);
  }
  setTimeout(() => layer.remove(), 3800);
}
