import { PLAYER_WIDTH, PLAYER_HEIGHT } from './constants.js';

export const HATS = [
  { id: 'none', name: 'Vazio' },
  { id: 'hollow', name: 'Máscara Knight' },
  { id: 'cap', name: 'Boné azul' },
  { id: 'cap-red', name: 'Boné vermelho' },
  { id: 'cap-green', name: 'Boné verde' },
  { id: 'cap-colorido', name: 'Boné colorido' },
  { id: 'cap-p', name: 'Chapéu de detetive' },
  { id: 'scarf', name: 'Cachecol vermelho' },
  { id: 'scarf-green', name: 'Cachecol verde' },
  { id: 'scarf-blue', name: 'Cachecol azul' },
  { id: 'oculos-soldador', name: 'Óculos de soldador' },
  { id: 'crown', name: 'Coroa' },
  { id: 'crown-p', name: 'Coroa (Pixel)' },
  { id: 'party', name: 'Chapéu de festa' },
  { id: 'headphones', name: 'Headphones' },
  { id: 'chef', name: 'Chapéu de chef' },
  { id: 'spidey', name: 'Homem-aranha' },
  { id: 'flash', name: 'Flash' },
  { id: 'plunger', name: 'Desentupidor' },
  { id: 'fuse', name: 'Corda de bomba acesa' },
  { id: 'amongus', name: 'Tripulante' },
  { id: 'chicken', name: 'Máscara de galinha (Hotline Miami)' },
  { id: 'creeper', name: 'Máscara do Creeper' },
  { id: 'sans', name: 'Sans (Undertale)' },
  { id: 'cavalheiro', name: 'Cavalheiro Branco' },
  { id: 'cavalheiro-negro', name: 'Cavalheiro Negro' },
  { id: 'cupcake', name: 'Cupcake' },
  { id: 'guitarra', name: 'Bonnie' },
  { id: 'foxy', name: 'Foxy' },
  { id: 'avatar', name: 'Mestre do ar' },
  { id: 'miles', name: 'Homem Aranha Miles Morales' },
  { id: 'venom', name: 'Homem aranha Venom' },
  { id: 'ironman', name: 'Homem de Ferro' }
];

export function getHatById(id) {
  return HATS.find(hat => hat.id === id) || HATS[0];
}

const REGION_FILLS = [
  { name: 'topo', y0: 0, y1: 8, x0: 12, x1: 28, color: '#ff9f1c' },
  { name: 'rosto', y0: 8, y1: 34, x0: 0, x1: 40, color: '#ffd23f' },
  { name: 'corpo debaixo', y0: 34, y1: 44, x0: 0, x1: 40, color: '#2f9e44' },
  { name: 'pés', y0: 40, y1: 49, x0: 4, x1: 36, color: '#b08968' },
  { name: 'olho esquerdo', y0: 11, y1: 25, x0: 6, x1: 18, color: '#3f8efc' },
  { name: 'olho direito', y0: 11, y1: 25, x0: 22, x1: 34, color: '#7b2ff7' },
  { name: 'boca', y0: 23, y1: 31, x0: 16, x1: 24, color: '#e91e63' }
];

function rr(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function outline(ctx, path) {
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function ellipsePath(ctx, cx, cy, rx, ry, rot) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
}

// ===== Pixel art =====

const PIXEL_HATS = {
  'cap-p': {
    palette: { H: '#8d6e63', K: '#3e2723' },
    cell: 3,
    dy: -22,
    rows: [
      '.......HHHH.......',
      '......HHHHHH......',
      '.....HHHHHHHH.....',
      '.....HHHHHHHH.....',
      '....HHHHHHHHHH....',
      '....HKKKKKKKKH....',
      '...HHHHHHHHHHHH...',
      '..HHHHHHHHHHHHHH..',
      'HHHHHHHHHHHHHHHHHH'
    ]
  },
  'crown-p': {
    palette: { G: '#ffd23f', D: '#f5a623', R: '#e63946', B: '#3f8efc', N: '#2f9e44' },
    cell: 3,
    dy: -19,
    rows: [
      '.G..G..G..G..G',
      'GG.GG.GG.GG.GG',
      'GGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGG',
      'GGGBGGGRGGGNGG',
      'GGGBGGGRGGGNGG',
      'GGGGGGGGGGGGGG',
      '.DDDDDDDDDDDD.'
    ]
  }
};

function drawPixelHat(ctx, player, def) {
  const cell = def.cell || 3;
  const dy = def.dy || 0;
  const top = player.y - player.h;
  const rows = def.rows;
  const width = rows[0].length * cell;
  const height = rows.length * cell;
  const x0 = Math.round(player.x - width / 2);
  const y0 = Math.round(top + dy);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const color = def.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
    }
  }
}

// ===== Vector hats =====

function drawCap(ctx, x, top, face, scheme) {
  const billDir = face > 0 ? -1 : 1;
  rr(ctx, x - 20, top - 10, 40, 20, 10);
  ctx.fillStyle = scheme.base;
  ctx.fill();
  outline(ctx);
  ctx.strokeStyle = scheme.dark;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(x - 9, top - 4, 11, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 9, top - 4, 11, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, top - 11, 3, 0, Math.PI * 2);
  ctx.fillStyle = scheme.button;
  ctx.fill();
  ctx.stroke();
  rr(ctx, x - 20, top + 4, 40, 6, 2.5);
  ctx.fillStyle = scheme.dark;
  ctx.fill();
  outline(ctx);
  rr(ctx, x - billDir * 22, top + 5, 10, 4, 2);
  ctx.fill();
  rr(ctx, x + billDir * 18 - 8, top + 6, 15, 5, 2.5);
  ctx.fill();
  outline(ctx);
}

function drawSansEye(ctx, ex, ey, scale) {
  const flick = 1 + Math.sin(performance.now() * 0.004) * 0.06;
  ctx.save();
  ctx.translate(ex, ey);
  ctx.scale(scale * flick, scale * flick);
  ctx.translate(-ex, -ey);
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.moveTo(ex, ey - 6);
  ctx.quadraticCurveTo(ex + 8, ey - 3, ex + 4, ey + 3);
  ctx.quadraticCurveTo(ex + 1, ey + 6, ex, ey + 1);
  ctx.quadraticCurveTo(ex - 4, ey + 6, ex - 5, ey - 1);
  ctx.quadraticCurveTo(ex - 6, ey - 5, ex, ey - 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0095c8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex, ey - 1, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawOldHornetMask(ctx, x, top, light, dark) {
  const s = 1.5;
  rr(ctx, x - 15 * s, top - 4 * s, 30 * s, 22 * s, 9 * s);
  ctx.fillStyle = light;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, top - 2 * s);
  ctx.quadraticCurveTo(x - 6 * s, top - 13 * s, x + 1 * s, top - 20 * s);
  ctx.quadraticCurveTo(x + 4 * s, top - 22 * s, x + 6 * s, top - 19 * s);
  ctx.quadraticCurveTo(x + 1 * s, top - 12 * s, x + 4 * s, top - 2 * s);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, top + 4 * s);
  ctx.lineTo(x - 5 * s, top + 7 * s);
  ctx.lineTo(x - 6 * s, top + 11 * s);
  ctx.lineTo(x - 13 * s, top + 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, top + 4 * s);
  ctx.lineTo(x + 5 * s, top + 7 * s);
  ctx.lineTo(x + 6 * s, top + 11 * s);
  ctx.lineTo(x + 13 * s, top + 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, top - 2 * s);
  ctx.lineTo(x, top + 17 * s);
  ctx.stroke();
}

function drawColorfulCap(ctx, x, top, face) {
  const billDir = face > 0 ? -1 : 1;
  const colors = ['#e63946', '#f77f00', '#ffd23f', '#2f9e44', '#2f6fed', '#7b2ff7'];
  rr(ctx, x - 20, top - 10, 40, 20, 10);
  ctx.save();
  ctx.clip();
  const panelW = 40 / colors.length;
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(x - 20 + i * panelW, top - 10, panelW + 0.5, 20);
  });
  ctx.restore();
  rr(ctx, x - 20, top - 10, 40, 20, 10);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, top - 11, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.stroke();
  rr(ctx, x - 20, top + 4, 40, 6, 2.5);
  ctx.fillStyle = '#222';
  ctx.fill();
  rr(ctx, x - billDir * 22, top + 5, 10, 4, 2);
  ctx.fill();
  rr(ctx, x + billDir * 18 - 8, top + 6, 15, 5, 2.5);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawScarf(ctx, x, top, phase, scheme, h) {
  const s = h / 44;
  ctx.save();
  ctx.translate(x, top);
  ctx.scale(s, s);
  ctx.translate(-x, -top);
  const sway = Math.sin(phase) * 3;
  rr(ctx, x - 23, top + 28, 46, 12, 6);
  ctx.fillStyle = scheme.base;
  ctx.fill();
  outline(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  rr(ctx, x - 23, top + 35, 46, 4, 2);
  ctx.fill();
  rr(ctx, x - 7 + sway * 0.3, top + 39, 10, 14, 4);
  ctx.fillStyle = scheme.dark;
  ctx.fill();
  outline(ctx);
  rr(ctx, x + 2 + sway, top + 39, 10, 14, 4);
  ctx.fillStyle = scheme.base;
  ctx.fill();
  outline(ctx);
  ctx.strokeStyle = scheme.darker;
  ctx.lineWidth = 1.5;
  [-1, 2, 5].forEach(off => {
    ctx.beginPath();
    ctx.moveTo(x + 2 + sway + off, top + 49);
    ctx.lineTo(x + 2 + sway + off, top + 53);
    ctx.stroke();
  });
  ctx.restore();
}

export function drawHat(ctx, player, hatId) {
  const pixelDef = PIXEL_HATS[hatId];
  if (pixelDef) {
    drawPixelHat(ctx, player, pixelDef);
    return;
  }
  const x = player.x;
  const top = player.y - player.h;
  const face = player.vx > 0 ? 1 : player.vx < 0 ? -1 : 0;
  const phase = player.x * 0.18;

  switch (hatId) {
    case 'hollow': {
      rr(ctx, x - 21, top - 4, 42, 40, 17);
      ctx.fillStyle = '#f7f1d8';
      ctx.fill();
      ctx.strokeStyle = '#2c2c34';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x - 13, top - 1, 22, 5, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fill();
      ctx.lineCap = 'round';
      [-1, 1].forEach(dir => {
        ctx.strokeStyle = '#2c2c34';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x + dir * 9, top - 3);
        ctx.quadraticCurveTo(x + dir * 18, top - 14, x + dir * 9, top - 26);
        ctx.stroke();
        ctx.strokeStyle = '#f7f1d8';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
      ctx.lineCap = 'butt';
      ctx.fillStyle = '#2c2c34';
      ellipsePath(ctx, x - 8, top + 19, 5, 6.5, 0.12);
      ctx.fill();
      ellipsePath(ctx, x + 8, top + 19, 5, 6.5, -0.12);
      ctx.fill();
      break;
    }

    case 'cap':
      drawCap(ctx, x, top, face, { base: '#2f6fed', dark: '#2456c8', button: '#ffd23f' });
      break;

    case 'cap-red':
      drawCap(ctx, x, top, face, { base: '#e63946', dark: '#b02a35', button: '#ffd23f' });
      break;

    case 'cap-green':
      drawCap(ctx, x, top, face, { base: '#2f9e44', dark: '#1f7a33', button: '#ffd23f' });
      break;

    case 'cap-colorido':
      drawColorfulCap(ctx, x, top, face);
      break;

    case 'scarf':
      drawScarf(ctx, x, top, phase, { base: '#c1121f', dark: '#a30f18', darker: '#8f0f18' }, player.h || 44);
      break;

    case 'scarf-green':
      drawScarf(ctx, x, top, phase, { base: '#2f9e44', dark: '#1f7a33', darker: '#145a24' }, player.h || 44);
      break;

    case 'scarf-blue':
      drawScarf(ctx, x, top, phase, { base: '#2f6fed', dark: '#2456c8', darker: '#173f8f' }, player.h || 44);
      break;

    case 'oculos-soldador': {
      const gy = top + 15;
      rr(ctx, x - 19, gy - 7, 38, 15, 6);
      ctx.fillStyle = '#333';
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 2, gy - 2, 4, 5, 1);
      ctx.fillStyle = '#222';
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 16, gy - 4, 13, 9, 3);
      ctx.fillStyle = '#1f6f5a';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, x + 3, gy - 4, 13, 9, 3);
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 14, gy - 2, 4, 2, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
      rr(ctx, x + 5, gy - 2, 4, 2, 1);
      ctx.fill();
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 19, gy);
      ctx.lineTo(x - 26, gy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 19, gy);
      ctx.lineTo(x + 26, gy);
      ctx.stroke();
      break;
    }

    case 'crown': {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x - 19, top - 5);
      ctx.lineTo(x - 12, top - 17);
      ctx.lineTo(x - 6, top - 7);
      ctx.lineTo(x, top - 19);
      ctx.lineTo(x + 6, top - 7);
      ctx.lineTo(x + 12, top - 17);
      ctx.lineTo(x + 19, top - 5);
      ctx.lineTo(x + 18, top + 4);
      ctx.lineTo(x - 18, top + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x - 18, top, 36, 6, 3);
      ctx.fillStyle = '#f77f00';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e63946';
      [[-12, -14], [12, -14]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top + oy, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 16, top - 4);
      ctx.lineTo(x - 16, top - 11);
      ctx.stroke();
      break;
    }

    case 'party': {
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.moveTo(x - 19, top - 2);
      ctx.lineTo(x + 19, top - 2);
      ctx.lineTo(x, top - 30);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      [[-8, -11], [7, -18], [3, -7], [-3, -22], [10, -9]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top + oy, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#3f8efc';
      [[-11, -19], [9, -5], [0, -13]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top + oy, 2.1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(x, top - 32, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case 'headphones': {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, top + 5, 17, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, top + 5, 14.5, Math.PI, 0);
      ctx.stroke();
      rr(ctx, x - 23, top + 5, 10, 19, 5);
      ctx.fillStyle = '#e91e63';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x + 13, top + 5, 10, 19, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      rr(ctx, x - 21, top + 7, 4, 13, 2);
      ctx.fill();
      rr(ctx, x + 15, top + 7, 4, 13, 2);
      ctx.fill();
      break;
    }

    case 'chef': {
      rr(ctx, x - 20, top - 30, 40, 30, 10);
      ctx.fillStyle = '#fff';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      rr(ctx, x - 5, top - 28, 19, 25, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 6.5, top - 28);
        ctx.quadraticCurveTo(x + i * 6.5 - 2.5, top - 18, x + i * 6.5 + 1.5, top - 8);
        ctx.stroke();
      }
      rr(ctx, x - 20, top - 3, 40, 8, 4);
      ctx.fillStyle = '#fff';
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 17, top + 0);
      ctx.lineTo(x + 17, top + 0);
      ctx.stroke();
      break;
    }

    case 'spidey': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      const red = '#e02010';
      const blue = '#3080b0';
      const black = '#101010';
      rr(ctx, x - 19, top + 27, 38, Math.max(0, h - 27), 10);
      ctx.fillStyle = blue;
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 16, top + 32, 32, Math.max(0, h - 32), 7);
      ctx.fillStyle = red;
      ctx.fill();
      ctx.strokeStyle = black;
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x - 19, top + 27, 6, Math.max(0, h - 32), 3);
      ctx.fillStyle = blue;
      ctx.fill();
      ctx.strokeStyle = black;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, x + 13, top + 27, 6, Math.max(0, h - 32), 3);
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 20, top - 3, 40, 34, 16);
      ctx.fillStyle = red;
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = 'rgba(10,10,10,0.6)';
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x, top + 2);
        ctx.quadraticCurveTo(x + i * 7, top + 8, x + i * 10, top + 24);
        ctx.stroke();
      }
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 15, top + i * 6 - 3);
        ctx.quadraticCurveTo(x, top + i * 6, x + 15, top + i * 6 - 3);
        ctx.stroke();
      }
      ellipsePath(ctx, x - 9, top + 16, 10, 7, 0.25);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = black;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ellipsePath(ctx, x + 9, top + 16, 10, 7, -0.25);
      ctx.fill();
      ctx.stroke();
      const cy = top + 39;
      ctx.fillStyle = black;
      ctx.beginPath();
      ctx.ellipse(x, cy + 1.5, 2, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, cy - 2.5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = black;
      ctx.lineWidth = 1.4;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x - i * 3.5, cy - 1 - i * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + i * 3.5, cy - 1 - i * 1.5);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'flash': {
      const h = player.h || 44;
      rr(ctx, x - 19, top - 2, 38, h + 2, 12);
      ctx.fillStyle = '#d62828';
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 14, top + 3, 28, 8, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x + 3, top + 7);
      ctx.lineTo(x - 5, top + 16);
      ctx.lineTo(x - 0.5, top + 16);
      ctx.lineTo(x - 4, top + 25);
      ctx.lineTo(x + 5, top + 14);
      ctx.lineTo(x + 0.5, top + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, x - 17, top + h * 0.62, 34, 4, 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ellipsePath(ctx, x - 8, top + 16, 4.5, 3.5, 0);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ellipsePath(ctx, x + 8, top + 16, 4.5, 3.5, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x - 17, top + 6);
      ctx.lineTo(x - 21, top + 1);
      ctx.lineTo(x - 16, top + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 17, top + 6);
      ctx.lineTo(x + 21, top + 1);
      ctx.lineTo(x + 16, top + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 17, player.y - 5, 14, 9, 4);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.stroke();
      rr(ctx, x + 3, player.y - 5, 14, 9, 4);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'plunger': {
      ctx.beginPath();
      ctx.arc(x, top + 1, 12, Math.PI, 0);
      ctx.fillStyle = '#e63946';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, top + 1, 12, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#c1121f';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - 4, top - 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
      ctx.strokeStyle = '#b08968';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, top - 10);
      ctx.lineTo(x, top - 30);
      ctx.stroke();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#b08968';
      ctx.beginPath();
      ctx.arc(x, top - 30, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'fuse': {
      ctx.strokeStyle = '#7a5230';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 1, top + 1);
      ctx.bezierCurveTo(x - 4, top - 1, x + 3, top - 3, x + 1, top - 5);
      ctx.bezierCurveTo(x - 1, top - 7, x - 4, top - 6, x - 2.5, top - 9);
      ctx.bezierCurveTo(x - 1, top - 11, x + 2.5, top - 10, x + 1.5, top - 13);
      ctx.stroke();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const flick = 1 + Math.sin(phase * 1.5) * 0.12;
      ctx.save();
      ctx.translate(x + 1.5, top - 13);
      ctx.scale(flick, flick);
      ctx.translate(-(x + 1.5), -(top - 13));
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.moveTo(x + 1.5, top - 12.5);
      ctx.bezierCurveTo(x - 1.5, top - 15, x - 1, top - 18, x + 1.5, top - 21);
      ctx.bezierCurveTo(x + 4, top - 18, x + 4.5, top - 15, x + 1.5, top - 12.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x + 1.5, top - 14);
      ctx.bezierCurveTo(x, top - 16, x, top - 18, x + 1.5, top - 20);
      ctx.bezierCurveTo(x + 3, top - 18, x + 3, top - 16, x + 1.5, top - 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x + 1.5, top - 15.5);
      ctx.bezierCurveTo(x + 0.5, top - 17, x + 0.5, top - 18, x + 1.5, top - 19);
      ctx.bezierCurveTo(x + 2.5, top - 18, x + 2.5, top - 17, x + 1.5, top - 15.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'amongus': {
      const c = player.color || '#ff6b6b';
      const h = player.h || 44;
      ctx.beginPath();
      ctx.moveTo(x - 12, top - 2);
      ctx.quadraticCurveTo(x - 21, top + 3, x - 19, top + 15);
      ctx.lineTo(x - 19, top + h - 8);
      ctx.quadraticCurveTo(x - 19, top + h + 2, x - 12, top + h + 2);
      ctx.lineTo(x + 12, top + h + 2);
      ctx.quadraticCurveTo(x + 19, top + h + 2, x + 19, top + h - 8);
      ctx.lineTo(x + 19, top + 15);
      ctx.quadraticCurveTo(x + 21, top + 3, x + 12, top - 2);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      rr(ctx, x - 10, player.y - 3, 8, 7, 2.5);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x + 2, player.y - 3, 8, 7, 2.5);
      ctx.fill();
      ctx.stroke();
      const bpX = face > 0 ? x - 25 : face < 0 ? x + 19 : x - 23;
      rr(ctx, bpX, top + 8, 6, 13, 3);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      const visorX = x - 11 + face * 3;
      rr(ctx, visorX, top + 4, 22, 14, 7);
      ctx.fillStyle = '#34a7bf';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      rr(ctx, visorX + 2, top + 6, 7, 5, 2.5);
      ctx.fill();
      break;
    }

    case 'chicken': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      [[-9, -3], [0, -1], [9, -3]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top + oy, 6.5, Math.PI, 0);
        ctx.fillStyle = '#e63946';
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      rr(ctx, x - 21, top - 4, 42, 40, 18);
      ctx.fillStyle = '#fbf6ec';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(x - 7, top + 18, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 7, top + 18, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x - 7, top + 22);
      ctx.lineTo(x + 7, top + 22);
      ctx.lineTo(x, top + 31);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, top + 32, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e63946';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'creeper': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      rr(ctx, x - 20, top - 4, 40, 46, 8);
      ctx.fillStyle = '#5db45d';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#222';
      rr(ctx, x - 13, top + 8, 10, 10, 1);
      ctx.fill();
      rr(ctx, x + 3, top + 8, 10, 10, 1);
      ctx.fill();
      rr(ctx, x - 3, top + 20, 6, 11, 1);
      ctx.fill();
      rr(ctx, x - 11, top + 24, 22, 6, 1);
      ctx.fill();
      rr(ctx, x - 11, top + 30, 6, 10, 1);
      ctx.fill();
      rr(ctx, x + 5, top + 30, 6, 10, 1);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'sans': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      const bodyTop = top + 30;
      const bodyH = Math.max(10, Math.min(13, h - 30 - 1));
      drawSansEye(ctx, x + 8, top + 18, 1.5);
      rr(ctx, x - 19, bodyTop, 14, bodyH, 8);
      ctx.fillStyle = '#3b7dd3';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x + 5, bodyTop, 14, bodyH, 8);
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 13, bodyTop, 26, bodyH, 8);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#2f5f9e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 13, bodyTop + 2);
      ctx.lineTo(x - 13, bodyTop + bodyH - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 13, bodyTop + 2);
      ctx.lineTo(x + 13, bodyTop + bodyH - 2);
      ctx.stroke();
      ctx.strokeStyle = '#3d5a99';
      ctx.beginPath();
      ctx.moveTo(x, bodyTop + 4);
      ctx.lineTo(x, bodyTop + bodyH - 2);
      ctx.stroke();
      rr(ctx, x - 19, bodyTop, 38, 5, 3);
      ctx.fillStyle = '#e8e8e8';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const shortsTop = bodyTop + bodyH;
      rr(ctx, x - 16, shortsTop, 32, 8, 3);
      ctx.fillStyle = '#2a2a30';
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 10, shortsTop + 3, 20, 2, 1);
      ctx.fillStyle = '#fff';
      ctx.fill();
      rr(ctx, x - 17, player.y - 5, 14, 9, 4);
      ctx.fillStyle = '#f7a8b8';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x + 3, player.y - 5, 14, 9, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'cavalheiro':
      drawOldHornetMask(ctx, x, top, '#f5f0e6', '#222');
      break;

    case 'cavalheiro-negro':
      drawOldHornetMask(ctx, x, top, '#1a1a1f', '#e8e8e8');
      break;

    case 'cupcake': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      // vela no topo (corpo vermelho)
      ctx.fillStyle = '#d10248';
      rr(ctx, x - 4, top - 26, 8, 7, 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // pavio
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, top - 26);
      ctx.lineTo(x, top - 30);
      ctx.stroke();
      // chama
      ctx.beginPath();
      ctx.moveTo(x - 2.2, top - 31);
      ctx.quadraticCurveTo(x - 2.2, top - 34.5, x, top - 36);
      ctx.quadraticCurveTo(x + 2.2, top - 34.5, x + 2.2, top - 31);
      ctx.closePath();
      ctx.fillStyle = '#e8b73a';
      ctx.fill();
      ctx.strokeStyle = '#b08d1d';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(x - 0.7, top - 34.5, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = 'butt';
      // swirl rosa (calda)
      ctx.beginPath();
      ctx.moveTo(x - 13, top - 6);
      ctx.quadraticCurveTo(x - 15, top - 16, x - 9, top - 22);
      ctx.quadraticCurveTo(x - 4, top - 26, x, top - 24);
      ctx.quadraticCurveTo(x + 4, top - 26, x + 9, top - 22);
      ctx.quadraticCurveTo(x + 15, top - 16, x + 13, top - 6);
      ctx.quadraticCurveTo(x, top - 2, x - 13, top - 6);
      ctx.closePath();
      ctx.fillStyle = '#ff6197';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      // espiral do swirl
      ctx.strokeStyle = '#d64d80';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 10, top - 8);
      ctx.quadraticCurveTo(x - 9, top - 15, x - 3, top - 14);
      ctx.quadraticCurveTo(x + 2, top - 13, x + 4, top - 8);
      ctx.stroke();
      // olhos do cupcake vivo
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - 6, top - 17, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 6, top - 17, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(x - 6, top - 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 6, top - 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // dentes na frente do swirl
      ctx.fillStyle = '#fff';
      rr(ctx, x - 4.5, top - 10, 4, 4, 1);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      rr(ctx, x + 0.5, top - 10, 4, 4, 1);
      ctx.fill();
      ctx.stroke();
      // forminha com listras vermelhas (assentada na cabeça)
      ctx.beginPath();
      ctx.moveTo(x - 13, top - 6);
      ctx.lineTo(x - 13, top + 3);
      ctx.lineTo(x + 13, top + 3);
      ctx.lineTo(x + 13, top - 6);
      ctx.closePath();
      ctx.fillStyle = '#e8c49a';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#c1121f';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 10 + i * 5, top - 5);
        ctx.lineTo(x - 10 + i * 5, top + 2.5);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'guitarra': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      // orelhas do Bonnie (coelho roxo, altas, arredondadas e mais largas no topo)
      const ear = '#5f43a8';
      const earInner = '#b094e0';
      [-1, 1].forEach(dir => {
        // orelha externa
        ctx.beginPath();
        ctx.moveTo(x + dir * 9, top - 2);
        ctx.quadraticCurveTo(x + dir * 17, top - 3, x + dir * 18, top - 16);
        ctx.quadraticCurveTo(x + dir * 19, top - 28, x + dir * 15, top - 33);
        ctx.quadraticCurveTo(x + dir * 11, top - 34, x + dir * 8, top - 30);
        ctx.quadraticCurveTo(x + dir * 6, top - 22, x + dir * 7, top - 10);
        ctx.quadraticCurveTo(x + dir * 8, top - 4, x + dir * 9, top - 2);
        ctx.closePath();
        ctx.fillStyle = ear;
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
        // orelha interna (parte clara no miolo da orelha)
        ctx.beginPath();
        ctx.moveTo(x + dir * 11, top - 4);
        ctx.quadraticCurveTo(x + dir * 15, top - 5, x + dir * 15, top - 16);
        ctx.quadraticCurveTo(x + dir * 15, top - 25, x + dir * 12.5, top - 29);
        ctx.quadraticCurveTo(x + dir * 10.5, top - 30, x + dir * 10, top - 24);
        ctx.quadraticCurveTo(x + dir * 9.5, top - 15, x + dir * 10.5, top - 6);
        ctx.closePath();
        ctx.fillStyle = earInner;
        ctx.fill();
      });
      const sway = Math.sin(phase) * 2;
      ctx.save();
      ctx.translate(sway, 0);
      // pivot no peito; gira na diagonal e reduz para parecer "segurando"
      ctx.save();
      ctx.translate(x + 4, top + 24);
      ctx.rotate(-0.55);
      ctx.scale(0.72, 0.72);
      ctx.translate(-(x + 4), -(top + 24));
      const gx = x + 4;
      const gy = top + 24;
      ctx.strokeStyle = '#7a3b2e';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 4);
      ctx.lineTo(gx, gy - 30);
      ctx.stroke();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      // escala (tampo claro do braço)
      ctx.strokeStyle = '#c9a37a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 6);
      ctx.lineTo(gx, gy - 27);
      ctx.stroke();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      // headstock com tarrachas
      rr(ctx, gx - 5, gy - 38, 10, 10, 2);
      ctx.fillStyle = '#4a1d15';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#eee';
      [[-3.5, -34.5], [3.5, -34.5], [0, -31.5]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(gx + px, gy + py, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
      // corpo do violão em formato de V (voador)
      ctx.fillStyle = '#c1121f';
      ctx.beginPath();
      ctx.moveTo(gx - 12, gy + 4);
      ctx.quadraticCurveTo(gx - 6, gy + 9, gx - 4.5, gy + 15);
      ctx.lineTo(gx, gy + 35);
      ctx.lineTo(gx + 4.5, gy + 15);
      ctx.quadraticCurveTo(gx + 6, gy + 9, gx + 12, gy + 4);
      ctx.quadraticCurveTo(gx + 8, gy + 1, gx + 5, gy + 2);
      ctx.quadraticCurveTo(gx, gy + 4, gx - 5, gy + 2);
      ctx.quadraticCurveTo(gx - 8, gy + 1, gx - 12, gy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      // contorno claro interno (detalhe)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx - 9, gy + 6);
      ctx.lineTo(gx - 3.5, gy + 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + 9, gy + 6);
      ctx.lineTo(gx + 3.5, gy + 14);
      ctx.stroke();
      // buraco de som / captadores
      ctx.beginPath();
      ctx.ellipse(gx, gy + 7, 3.5, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#5c1a12';
      ctx.fill();
      ctx.strokeStyle = '#8a1a12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, gx - 4.5, gy + 20, 9, 4, 1.5);
      ctx.fillStyle = '#e8d9c2';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      rr(ctx, gx - 6.5, gy + 28, 13, 4, 1.5);
      ctx.fillStyle = '#e8d9c2';
      ctx.fill();
      ctx.stroke();
      // cordas
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(gx + i * 1.8, gy - 30);
        ctx.lineTo(gx + i * 1.8, gy + 13);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
      ctx.restore();
      break;
    }

    case 'foxy': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      const fur = '#c62727';
      const furDark = '#7a1818';
      const cream = '#f2e0b8';
      const muzzle = '#efe0c2';
      // cabeça vermelha
      rr(ctx, x - 20, top - 3, 40, 35, 15);
      ctx.fillStyle = fur;
      ctx.fill();
      outline(ctx);
      // orelhas vermelhas
      [-12, 12].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(x + ox - 8, top - 1);
        ctx.quadraticCurveTo(x + ox - 10, top - 16, x + ox - 4, top - 24);
        ctx.quadraticCurveTo(x + ox, top - 18, x + ox + 4, top - 24);
        ctx.quadraticCurveTo(x + ox + 10, top - 16, x + ox + 8, top - 1);
        ctx.closePath();
        ctx.fillStyle = fur;
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + ox - 3.5, top - 2);
        ctx.quadraticCurveTo(x + ox - 5, top - 12, x + ox, top - 17.5);
        ctx.quadraticCurveTo(x + ox + 5, top - 12, x + ox + 3.5, top - 2);
        ctx.closePath();
        ctx.fillStyle = furDark;
        ctx.fill();
      });
      // sobrancelhas escuras acima dos olhos (como na imagem)
      ctx.fillStyle = '#3a0d0d';
      rr(ctx, x - 14, top + 4.5, 9, 3, 1.5);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      rr(ctx, x + 5, top + 4.5, 9, 3, 1.5);
      ctx.fill();
      ctx.stroke();
      // olho esquerdo (à esquerda do jogador): órbita escura com olho branco
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(x - 9, top + 15, 5.5, 6.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath();
      ctx.ellipse(x - 9, top + 15, 3.2, 4.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(x - 8.5, top + 15, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // tapa-olho no olho direito
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 1, top + 14);
      ctx.lineTo(x - 15, top + 21);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 2, top + 18);
      ctx.lineTo(x - 13, top + 25);
      ctx.stroke();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(x + 9, top + 16, 9, 8, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      // focinho claro
      rr(ctx, x - 11, top + 22, 22, 12, 5);
      ctx.fillStyle = muzzle;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // nariz
      ctx.fillStyle = '#2a1208';
      ctx.beginPath();
      ctx.ellipse(x, top + 22, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'avatar': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      const blue = '#3f8efc';
      const dark = '#2c5db8';
      // tatuagem de seta azul na testa (marca do Avatar, apontando para baixo)
      rr(ctx, x - 2.25, top + 1, 4.5, 10, 2);
      ctx.fillStyle = blue;
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 8, top + 10);
      ctx.lineTo(x + 8, top + 10);
      ctx.lineTo(x, top + 17);
      ctx.closePath();
      ctx.fillStyle = blue;
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'miles': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      const black = '#17171a';
      const red = '#d81f26';
      rr(ctx, x - 19, top + 27, 38, Math.max(0, h - 27), 10);
      ctx.fillStyle = black;
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 17, player.y - 5, 14, 9, 4);
      ctx.fillStyle = red;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x + 3, player.y - 5, 14, 9, 4);
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 19, top + 27, 8, 12, 4);
      ctx.fillStyle = red;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, x + 11, top + 27, 8, 12, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.arc(x, top + 35, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = red;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 5, top + 35 + Math.sin(a) * 5);
        ctx.lineTo(x + Math.cos(a) * 11, top + 35 + Math.sin(a) * 11);
        ctx.stroke();
      }
      rr(ctx, x - 20, top - 3, 40, 34, 16);
      ctx.fillStyle = black;
      ctx.fill();
      // preenche os cantos inferiores do rosto até o arco da cabeça (cobre o player)
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(x + d * 20, top + 15);
        ctx.lineTo(x + d * 19.6, top + 20);
        ctx.lineTo(x + d * 17.2, top + 25);
        ctx.lineTo(x + d * 12.5, top + 29);
        ctx.lineTo(x + d * 4.6, top + 31);
        ctx.lineTo(x + d * 4.6, top + 31.5);
        ctx.lineTo(x + d * 20, top + 31.5);
        ctx.closePath();
        ctx.fillStyle = black;
        ctx.fill();
      });
      // restaura os ombros vermelhos por cima do preenchimento
      rr(ctx, x - 19, top + 27, 8, 12, 4);
      ctx.fillStyle = red;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, x + 11, top + 27, 8, 12, 4);
      ctx.fill();
      ctx.stroke();
      outline(ctx);
      // olhos como o do Homem-Aranha (elipses brancas inclinadas)
      ellipsePath(ctx, x - 9, top + 16, 10, 7, 0.25);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = black;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ellipsePath(ctx, x + 9, top + 16, 10, 7, -0.25);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'venom': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      const black = '#0c0c0e';
      const white = '#f5f5f7';
      // corpo preto estilo traje do homem-aranha (torso)
      rr(ctx, x - 19, top + 27, 38, Math.max(0, h - 27), 10);
      ctx.fillStyle = black;
      ctx.fill();
      outline(ctx);
      // cabeça preta no formato do Miles Morales (retângulo arredondado)
      rr(ctx, x - 20, top - 3, 40, 34, 16);
      ctx.fillStyle = black;
      ctx.fill();
      // preenche os cantos inferiores do rosto e a lateral do pescoço (cobre o player)
      rr(ctx, x - 20, top + 16, 40, 23, 0);
      ctx.fillStyle = black;
      ctx.fill();
      // redesenha os outlines do corpo e da cabeça por cima do preenchimento
      rr(ctx, x - 19, top + 27, 38, Math.max(0, h - 27), 10);
      outline(ctx);
      rr(ctx, x - 20, top - 3, 40, 34, 16);
      outline(ctx);
      // olhos como o do Homem-Aranha (elipses brancas inclinadas)
      ellipsePath(ctx, x - 9, top + 16, 10, 7, 0.25);
      ctx.fillStyle = white;
      ctx.fill();
      ctx.strokeStyle = black;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ellipsePath(ctx, x + 9, top + 16, 10, 7, -0.25);
      ctx.fill();
      ctx.stroke();
      // reflexo gloss sutil no topo esquerdo da cabeça
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.ellipse(x - 6, top - 4, 4, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // aranha branca no peito (estilo do traje)
      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.ellipse(x, top + 34, 3, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, top + 30.5, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = white;
      ctx.lineWidth = 1.2;
      [[-2, -2, -8, -5], [-2, -0.5, -8, -2], [2, -2, 8, -5], [2, -0.5, 8, -2], [-2, 1.5, -8, 1], [2, 1.5, 8, 1]].forEach(([ax, ay, bx, by]) => {
        ctx.beginPath();
        ctx.moveTo(x + ax, top + 34 + ay);
        ctx.quadraticCurveTo(x + (ax + bx) / 2, top + 34 + (ay + by) / 2 - 2, x + bx, top + 34 + by);
        ctx.stroke();
      });
      ctx.restore();
      break;
    }

    case 'ironman': {
      const h = player.h || 44;
      const s = h / 44;
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);
      ctx.translate(-x, -top);
      const red = '#a51212';
      const gold = '#e8b923';
      rr(ctx, x - 19, top + 27, 38, Math.max(0, h - 27), 10);
      ctx.fillStyle = red;
      ctx.fill();
      outline(ctx);
      ctx.beginPath();
      ctx.moveTo(x - 6, top + 31);
      ctx.lineTo(x + 6, top + 31);
      ctx.lineTo(x, top + 40);
      ctx.closePath();
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, top + 34, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7ce8f0';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      rr(ctx, x - 19, top + 27, 8, 14, 4);
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, x + 11, top + 27, 8, 14, 4);
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 17, player.y - 5, 14, 9, 4);
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x + 3, player.y - 5, 14, 9, 4);
      ctx.fill();
      ctx.stroke();
      rr(ctx, x - 20, top - 3, 40, 34, 16);
      ctx.fillStyle = red;
      ctx.fill();
      outline(ctx);
      // preenche só os cantos inferiores do rosto (cobre o player por baixo)
      rr(ctx, x - 20, top + 26, 1.6, 7, 0.6);
      ctx.fillStyle = red;
      ctx.fill();
      rr(ctx, x + 18.4, top + 26, 1.6, 7, 0.6);
      ctx.fill();
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(x - 14, top + 6);
      ctx.quadraticCurveTo(x, top - 6, x + 14, top + 6);
      ctx.lineTo(x + 14, top + 3);
      ctx.quadraticCurveTo(x, top - 2, x - 14, top + 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a6a10';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(x - 14, top + 10);
      ctx.lineTo(x + 14, top + 10);
      ctx.lineTo(x + 11, top + 16);
      ctx.lineTo(x - 11, top + 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#7ce8f0';
      ctx.beginPath();
      ctx.ellipse(x - 7, top + 13, 3.4, 2, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a4a52';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + 7, top + 13, 3.4, 2, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.moveTo(x - 10, top + 17);
      ctx.lineTo(x + 10, top + 17);
      ctx.lineTo(x + 8, top + 30);
      ctx.lineTo(x - 8, top + 30);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(x - 4, top + 20);
      ctx.lineTo(x + 4, top + 20);
      ctx.lineTo(x, top + 29);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a6a10';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      rr(ctx, x - 5, top + 21, 10, 2.5, 1);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'regioes-teste': {
      const pw = player.w || PLAYER_WIDTH;
      const s = pw / PLAYER_WIDTH;
      const left = player.x - pw / 2;
      REGION_FILLS.forEach(region => {
        ctx.fillStyle = region.color;
        ctx.fillRect(left + region.x0 * s, top + region.y0 * s, (region.x1 - region.x0) * s, (region.y1 - region.y0) * s);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(left + region.x0 * s, top + region.y0 * s, (region.x1 - region.x0) * s, (region.y1 - region.y0) * s);
      });
      break;
    }

    default:
      break;
  }
}

export function drawHatPreview(ctx, hatId, playerColor) {
  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;
  const cx = 48;
  const playerY = 86;
  const x = cx - w / 2;
  const y = playerY - h;
  const color = playerColor || '#ff6b6b';

  ctx.clearRect(0, 0, 96, 96);

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(cx, playerY + 3, w * 0.55, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const footY = y + h - 4;
  const footH = 9;
  ctx.fillStyle = '#222';
  rr(ctx, x + 4, footY, 11, footH, 4);
  ctx.fill();
  rr(ctx, x + w - 15, footY, 11, footH, 4);
  ctx.fill();

  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  rr(ctx, x + 8, y + 7, w - 16, h - 20, 8);
  ctx.fill();

  const eyeY = y + 18;
  const eyeX1 = x + 12;
  const eyeX2 = x + w - 12;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(eyeX1, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeX2, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(eyeX1, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(eyeX2, eyeY, 6, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(eyeX1, eyeY + 1, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX2, eyeY + 1, 2.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, y + 27, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  drawHat(ctx, { x: cx, y: playerY, w, h, vx: 0, color }, hatId);
}
