import { state } from './state.js';
import {
  loadCosmetics,
  saveCosmetic,
  deleteCosmetic as storageDeleteCosmetic,
  getEquippedCosmetics,
  saveEquippedCosmetics
} from './storage.js';
import {
  MAX_COSMETIC_SIZE,
  MAX_COSMETIC_IMAGE_DIM,
  MAX_COSMETICS_PER_PLAYER,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  uuid
} from './constants.js';

export function createCosmeticImage(name, dataUrl) {
  const id = uuid();
  const cosmetic = {
    id,
    name: name || 'Imagem',
    type: 'image',
    data: dataUrl,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    createdAt: Date.now()
  };
  saveCosmetic(cosmetic);
  preloadImage(id, dataUrl);
  return cosmetic;
}

export function createCosmeticCode(name, code) {
  const id = uuid();
  const cosmetic = {
    id,
    name: name || 'Código',
    type: 'code',
    code,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    createdAt: Date.now()
  };
  saveCosmetic(cosmetic);
  return cosmetic;
}

export function updateCosmetic(id, updates) {
  const store = loadCosmetics();
  const cosmetic = store[id];
  if (!cosmetic) return null;
  Object.assign(cosmetic, updates);
  saveCosmetic(cosmetic);
  if (updates.data) preloadImage(id, updates.data);
  return cosmetic;
}

export function removeCosmetic(id) {
  storageDeleteCosmetic(id);
  state.cosmeticsCache.delete(id);
  const equipped = getEquippedCosmetics().filter(e => e.id !== id);
  saveEquippedCosmetics(equipped);
}

export function equipCosmetic(id, offsetX, offsetY, scale) {
  const equipped = getEquippedCosmetics();
  if (equipped.length >= MAX_COSMETICS_PER_PLAYER) return false;
  if (equipped.some(e => e.id === id)) return false;
  equipped.push({ id, offsetX: offsetX || 0, offsetY: offsetY || 0, scale: scale || 1 });
  saveEquippedCosmetics(equipped);
  return true;
}

export function unequipCosmetic(id) {
  const equipped = getEquippedCosmetics().filter(e => e.id !== id);
  saveEquippedCosmetics(equipped);
}

export function isEquipped(id) {
  return getEquippedCosmetics().some(e => e.id === id);
}

export function getEquippedList() {
  return getEquippedCosmetics();
}

export function getAllCosmetics() {
  return Object.values(loadCosmetics());
}

export function getCosmeticById(id) {
  return loadCosmetics()[id] || null;
}

function preloadImage(id, dataUrl) {
  const img = new Image();
  img.onload = () => {
    state.cosmeticsCache.set(id, img);
  };
  img.src = dataUrl;
}

export function loadAllCosmeticImages() {
  state.cosmeticsCache.clear();
  const store = loadCosmetics();
  for (const [id, cosmetic] of Object.entries(store)) {
    if (cosmetic.type === 'image' && cosmetic.data) {
      preloadImage(id, cosmetic.data);
    }
  }
}

export function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Arquivo não é uma imagem.'));
      return;
    }
    if (file.size > MAX_COSMETIC_SIZE) {
      reject(new Error(`Imagem muito grande. Máximo: ${Math.round(MAX_COSMETIC_SIZE / 1000)}KB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > MAX_COSMETIC_IMAGE_DIM || h > MAX_COSMETIC_IMAGE_DIM) {
          const ratio = Math.min(MAX_COSMETIC_IMAGE_DIM / w, MAX_COSMETIC_IMAGE_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function drawCosmetics(ctx, player, time) {
  const cosmetics = player.cosmetics;
  if (!cosmetics || cosmetics.length === 0) return;
  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;
  const px = player.x;
  const py = player.y;

  for (const entry of cosmetics) {
    const cosmetic = loadCosmetics()[entry.id];
    if (!cosmetic) continue;

    ctx.save();
    ctx.translate(px + (entry.offsetX || 0), py - h + (entry.offsetY || 0));

    const s = entry.scale || 1;
    if (s !== 1) {
      ctx.translate(w / 2, h / 2);
      ctx.scale(s, s);
      ctx.translate(-w / 2, -h / 2);
    }

    if (cosmetic.type === 'image') {
      const img = state.cosmeticsCache.get(entry.id);
      if (img && img.complete && img.naturalWidth > 0) {
        drawImageCover(ctx, img, 0, 0, w, h);
      }
    } else if (cosmetic.type === 'code') {
      try {
        const wrapped = `${cosmetic.code}\nif(typeof draw==='function')draw(ctx,w,h,color,time,player);`;
        const fn = new Function('ctx', 'w', 'h', 'color', 'time', 'player', wrapped);
        fn(ctx, w, h, player.color, time, {
          x: player.x, y: player.y,
          vx: player.vx, vy: player.vy,
          onGround: player.onGround,
          alive: player.alive,
          hasBomb: player.hasBomb
        });
      } catch (e) {}
    }

    ctx.restore();
  }
}

export function drawCosmeticPreview(ctx, cosmetic, playerColor, time, canvasSize) {
  const size = canvasSize || 96;
  const S = size / 96;
  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;
  const cx = size / 2;
  const playerY = size * 0.896;
  const color = playerColor || '#ff6b6b';

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(cx, playerY + 3 * S, w * 0.55 * S, 6 * S, 0, 0, Math.PI * 2);
  ctx.fill();

  const x = cx - (w / 2) * S;
  const y = playerY - h * S;

  ctx.fillStyle = '#222';
  roundRect(ctx, x + 4 * S, y + h * S - 4 * S, 11 * S, 9 * S, 4 * S);
  ctx.fill();
  roundRect(ctx, x + w * S - 15 * S, y + h * S - 4 * S, 11 * S, 9 * S, 4 * S);
  ctx.fill();

  ctx.fillStyle = color;
  roundRect(ctx, x, y, w * S, h * S, 12 * S);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3 * S;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  roundRect(ctx, x + 8 * S, y + 7 * S, w * S - 16 * S, h * S - 20 * S, 8 * S);
  ctx.fill();

  const eyeY = y + 18 * S;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x + 12 * S, eyeY, 6 * S, 7 * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * S - 12 * S, eyeY, 6 * S, 7 * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2 * S;
  ctx.beginPath();
  ctx.ellipse(x + 12 * S, eyeY, 6 * S, 7 * S, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + w * S - 12 * S, eyeY, 6 * S, 7 * S, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x + 14 * S, eyeY + 1 * S, 2.7 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * S - 10 * S, eyeY + 1 * S, 2.7 * S, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2 * S;
  ctx.beginPath();
  ctx.arc(cx, y + 27 * S, 4 * S, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  if (!cosmetic) return;

  ctx.save();
  ctx.translate(x + (cosmetic.offsetX || 0) * S, y + (cosmetic.offsetY || 0) * S);
  const sc = (cosmetic.scale || 1) * S;
  if (sc !== S) {
    ctx.translate(w * S / 2, h * S / 2);
    ctx.scale(sc / S, sc / S);
    ctx.translate(-w * S / 2, -h * S / 2);
  }

  if (cosmetic.type === 'image') {
    const img = state.cosmeticsCache.get(cosmetic.id);
    if (img && img.complete && img.naturalWidth > 0) {
      drawImageCover(ctx, img, 0, 0, w * S, h * S);
    } else {
      ctx.fillStyle = 'rgba(255,255,0,0.3)';
      ctx.fillRect(0, 0, w * S, h * S);
    }
  } else if (cosmetic.type === 'code') {
    try {
      const wrapped = `${cosmetic.code}\nif(typeof draw==='function')draw(ctx,w,h,color,time,player);`;
      const fn = new Function('ctx', 'w', 'h', 'color', 'time', 'player', wrapped);
      fn(ctx, w * S, h * S, color, time || 0, { x: cx, y: playerY, vx: 0, vy: 0, onGround: true, alive: true, hasBomb: false });
    } catch (e) {
      ctx.fillStyle = 'rgba(255,0,0,0.3)';
      ctx.fillRect(0, 0, w * S, h * S);
    }
  }

  ctx.restore();
}

function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = dw / dh;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.naturalHeight;
    sw = sh * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
