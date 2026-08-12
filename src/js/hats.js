export const HATS = [
  { id: 'none', name: 'Vazio' },
  { id: 'hollow', name: 'Máscara Hollow Knight' },
  { id: 'hollow-p', name: 'Máscara Hollow Knight (Pixel)' },
  { id: 'cap', name: 'Chapéu azul pra trás' },
  { id: 'cap-red', name: 'Chapéu vermelho pra trás' },
  { id: 'cap-green', name: 'Chapéu verde pra trás' },
  { id: 'cap-p', name: 'Chapéu de detetive (Pixel)' },
  { id: 'scarf', name: 'Cachecol vermelho' },
  { id: 'dab', name: 'Óculos de soldador' },
  { id: 'dab-p', name: 'Óculos meme (Pixel)' },
  { id: 'crown', name: 'Coroa' },
  { id: 'crown-p', name: 'Coroa (Pixel)' },
  { id: 'party', name: 'Chapéu de festa' },
  { id: 'headphones', name: 'Headphones' },
  { id: 'headphones-p', name: 'Headphones (Pixel)' },
  { id: 'chef', name: 'Chapéu de chef' },
  { id: 'spidey', name: 'Máscara do Homem-Aranha' },
  { id: 'flash', name: 'Roupa do Flash' },
  { id: 'ben10', name: 'Omnitrix do Ben 10' },
  { id: 'plunger', name: 'Desentupidor' },
  { id: 'fuse', name: 'Corda de bomba acesa' },
  { id: 'amongus', name: 'Roupa do Among Us' },
  { id: 'chicken', name: 'Máscara de galinha (Hotline Miami)' },
  { id: 'creeper', name: 'Máscara do Creeper' },
  { id: 'sans', name: 'Sans (Undertale)' },
  { id: 'hornet', name: 'Máscara da Hornet' },
  { id: 'hornet-p', name: 'Máscara da Hornet (Pixel)' }
];

export function getHatById(id) {
  return HATS.find(hat => hat.id === id) || HATS[0];
}

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
  'hollow-p': {
    palette: { K: '#2c2c34', W: '#f7f1d8' },
    rows: [
      '.......K........',
      '......KKK.......',
      '..KKKKKKKKKKKK..',
      '.KKKKKKKKKKKKKK.',
      'KKKKKKKKKKKKKKKK',
      'KKKKKKKKKKKKKKKK',
      'KKKKWWKKKKKKWWKK',
      'KKKKWWKKKKKKWWKK',
      'KKKKKKKKKKKKKKKK',
      'KKKKKKKKKKKKKKKK',
      '.KKKKKKKKKKKKKK.',
      '..KKKKKKKKKKKK..'
    ]
  },
  'cap-p': {
    palette: { H: '#8d6e63', K: '#3e2723' },
    cell: 2,
    dy: -2,
    rows: [
      '......HHHH......',
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HKKKKKKKKH...',
      '..HHHHHHHHHHHH..',
      '.HHHHHHHHHHHHHH.',
      'HHHHHHHHHHHHHHHH'
    ]
  },
  'dab-p': {
    palette: { K: '#111', W: '#fff' },
    dy: 4,
    cell: 3,
    rows: [
      '..KKKKKKKKKK..',
      '.KKKKKKKKKKKK.',
      'KWWKKKKKKKKWWK',
      'KWWKKKKKKKKWWK',
      'KKKKKKKKKKKKKK',
      '.KKKKKKKKKKKK.',
      '..KKKKKKKKKK..'
    ]
  },
  'crown-p': {
    palette: { G: '#ffd23f', D: '#f5a623', R: '#e63946' },
    cell: 2,
    dy: -2,
    rows: [
      '.G...G...G...G.',
      '.G.G.G.G.G.G.G.',
      'GGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGG',
      '.RRRRRRRRRRRRR.',
      '.DDDDDDDDDDDDD.'
    ]
  },
  'headphones-p': {
    palette: { K: '#191b1e', P: '#16a085', W: '#fff' },
    cell: 3,
    rows: [
      '..KKKKKKKKKKKK..',
      '.K..........K...',
      '.K..........K...',
      '.PP........PP...',
      'PPW........WPP..',
      'PPP........PPP..',
      '.KKK......KKK...'
    ]
  },
  'hornet-p': {
    palette: { W: '#f5f0e6', K: '#222' },
    rows: [
      '.......KK.......',
      '......KKKK......',
      '.....KKKKKK.....',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      'WWWWWKKWWWWWKKWW',
      'WWWWWKKWWWWWKKWW',
      'WWWWWKKWWWWWKKWW',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      '.WWWWWWWWWWWWWW.',
      '..WWWWWWWWWWWW..'
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
  rr(ctx, x - 16, top - 8, 32, 16, 8);
  ctx.fillStyle = scheme.base;
  ctx.fill();
  outline(ctx);
  ctx.strokeStyle = scheme.dark;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(x - 7, top - 3, 9, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 7, top - 3, 9, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, top - 9, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = scheme.button;
  ctx.fill();
  ctx.stroke();
  rr(ctx, x - 16, top + 3, 32, 5, 2);
  ctx.fillStyle = scheme.dark;
  ctx.fill();
  outline(ctx);
  rr(ctx, x - billDir * 18, top + 4, 8, 3, 1.5);
  ctx.fill();
  rr(ctx, x + billDir * 14 - 6, top + 5, 12, 4, 2);
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
    case 'hollow':
      rr(ctx, x - 17, top - 6, 34, 24, 12);
      ctx.fillStyle = '#2c2c34';
      ctx.fill();
      outline(ctx);
      ctx.beginPath();
      ctx.moveTo(x - 3, top - 6);
      ctx.lineTo(x, top - 14);
      ctx.lineTo(x + 3, top - 6);
      ctx.closePath();
      ctx.fillStyle = '#2c2c34';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, top - 5, 14, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      rr(ctx, x - 12, top + 5, 10, 8, 3);
      ctx.fillStyle = '#f7f1d8';
      ctx.fill();
      outline(ctx);
      rr(ctx, x + 2, top + 5, 10, 8, 3);
      ctx.fill();
      outline(ctx);
      break;

    case 'cap':
      drawCap(ctx, x, top, face, { base: '#2f6fed', dark: '#2456c8', button: '#ffd23f' });
      break;

    case 'cap-red':
      drawCap(ctx, x, top, face, { base: '#e63946', dark: '#b02a35', button: '#ffd23f' });
      break;

    case 'cap-green':
      drawCap(ctx, x, top, face, { base: '#2f9e44', dark: '#1f7a33', button: '#ffd23f' });
      break;

    case 'scarf': {
      rr(ctx, x - 16, top + 14, 32, 9, 4);
      ctx.fillStyle = '#c1121f';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      rr(ctx, x - 16, top + 19, 32, 3, 1.5);
      ctx.fill();
      const sway = Math.sin(phase) * 3;
      rr(ctx, x - 5 + sway * 0.3, top + 22, 9, 13, 4);
      ctx.fillStyle = '#a30f18';
      ctx.fill();
      outline(ctx);
      rr(ctx, x + 2 + sway, top + 26, 9, 13, 4);
      ctx.fillStyle = '#c1121f';
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = '#8f0f18';
      ctx.lineWidth = 1.5;
      [-1, 2, 5].forEach(off => {
        ctx.beginPath();
        ctx.moveTo(x + 2 + sway + off, top + 38);
        ctx.lineTo(x + 2 + sway + off, top + 42);
        ctx.stroke();
      });
      break;
    }

    case 'dab': {
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
      ctx.moveTo(x - 14, top - 4);
      ctx.lineTo(x - 9, top - 13);
      ctx.lineTo(x - 4, top - 5);
      ctx.lineTo(x, top - 14);
      ctx.lineTo(x + 4, top - 5);
      ctx.lineTo(x + 9, top - 13);
      ctx.lineTo(x + 14, top - 4);
      ctx.lineTo(x + 13, top + 3);
      ctx.lineTo(x - 13, top + 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x - 13, top - 1, 26, 5, 2);
      ctx.fillStyle = '#f77f00';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e63946';
      [[-9, -11], [9, -11]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top + oy, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 12, top - 3);
      ctx.lineTo(x - 12, top - 8);
      ctx.stroke();
      break;
    }

    case 'party': {
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.moveTo(x - 14, top - 2);
      ctx.lineTo(x + 14, top - 2);
      ctx.lineTo(x, top - 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      [[-6, -8], [5, -13], [2, -5], [-2, -16], [7, -7]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top + oy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#3f8efc';
      [[-8, -14], [7, -4], [0, -10]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top + oy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(x, top - 24, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 14, top - 2);
      ctx.quadraticCurveTo(x, top + 14, x + 14, top - 2);
      ctx.stroke();
      break;
    }

    case 'headphones': {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, top + 4, 13, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, top + 4, 11, Math.PI, 0);
      ctx.stroke();
      rr(ctx, x - 18, top + 4, 8, 15, 4);
      ctx.fillStyle = '#e91e63';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x + 10, top + 4, 8, 15, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      rr(ctx, x - 16, top + 6, 3, 10, 1.5);
      ctx.fill();
      rr(ctx, x + 12, top + 6, 3, 10, 1.5);
      ctx.fill();
      break;
    }

    case 'chef': {
      const topY = top - 20;
      [[-8, 0], [0, 0], [8, 0]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, topY + oy, 6, Math.PI, 0);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      rr(ctx, x - 15, topY + 2, 30, 19, 6);
      ctx.fillStyle = '#fff';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      rr(ctx, x - 4, topY + 3, 15, 18, 5);
      ctx.fill();
      ctx.strokeStyle = '#cfcfcf';
      ctx.lineWidth = 1.5;
      [-9, -3, 3, 9].forEach(off => {
        ctx.beginPath();
        ctx.moveTo(x + off, topY + 4);
        ctx.lineTo(x + off, top - 1);
        ctx.stroke();
      });
      rr(ctx, x - 15, top - 1, 30, 5, 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 14, top + 2);
      ctx.lineTo(x + 14, top + 2);
      ctx.stroke();
      break;
    }

    case 'spidey': {
      rr(ctx, x - 17, top - 3, 34, 23, 12);
      ctx.fillStyle = '#c1121f';
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.quadraticCurveTo(x + i * 8, top + 4, x + i * 14, top + 22);
        ctx.stroke();
      }
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 17, top + i * 6 - 1);
        ctx.quadraticCurveTo(x, top + i * 6 + 2, x + 17, top + i * 6 - 1);
        ctx.stroke();
      }
      ellipsePath(ctx, x - 9, top + 10, 8, 5, 0.25);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ellipsePath(ctx, x + 9, top + 10, 8, 5, -0.25);
      ctx.fill();
      ctx.stroke();
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

    case 'ben10': {
      rr(ctx, x - 12, top + 1, 24, 16, 6);
      ctx.fillStyle = '#c9c9c9';
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 9, top + 4, 18, 10, 4);
      ctx.fillStyle = '#222';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3ddc84';
      ctx.beginPath();
      ctx.moveTo(x - 4, top + 5);
      ctx.lineTo(x + 4, top + 5);
      ctx.lineTo(x, top + 8.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 4, top + 13);
      ctx.lineTo(x + 4, top + 13);
      ctx.lineTo(x, top + 9.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, top + 9, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#a7f3c8';
      ctx.fill();
      rr(ctx, x - 16, top + 4, 4, 11, 2);
      ctx.fillStyle = '#1a7a3a';
      ctx.fill();
      outline(ctx);
      rr(ctx, x + 12, top + 4, 4, 11, 2);
      ctx.fill();
      outline(ctx);
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
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - 2, top + 1);
      ctx.bezierCurveTo(x - 6, top - 3, x + 5, top - 5, x + 2, top - 9);
      ctx.bezierCurveTo(x - 1, top - 13, x - 6, top - 11, x - 4, top - 16);
      ctx.bezierCurveTo(x - 2, top - 20, x + 4, top - 18, x + 2, top - 24);
      ctx.stroke();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const flick = 1 + Math.sin(phase * 1.5) * 0.12;
      ctx.save();
      ctx.translate(x + 2, top - 24);
      ctx.scale(flick, flick);
      ctx.translate(-(x + 2), -(top - 24));
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.moveTo(x + 2, top - 23);
      ctx.bezierCurveTo(x - 2, top - 27, x - 1, top - 32, x + 2, top - 37);
      ctx.bezierCurveTo(x + 5, top - 32, x + 6, top - 27, x + 2, top - 23);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x + 2, top - 25);
      ctx.bezierCurveTo(x, top - 28, x, top - 32, x + 2, top - 35);
      ctx.bezierCurveTo(x + 4, top - 32, x + 4, top - 28, x + 2, top - 25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x + 2, top - 27);
      ctx.bezierCurveTo(x + 1, top - 29, x + 1, top - 31, x + 2, top - 33);
      ctx.bezierCurveTo(x + 3, top - 31, x + 3, top - 29, x + 2, top - 27);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'amongus': {
      const c = player.color || '#ff6b6b';
      rr(ctx, x - 18, top - 3, 36, (player.h || 44) + 4, 16);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      rr(ctx, x - 13, top + 2, 20, 8, 8);
      ctx.fill();
      ctx.fillStyle = '#0b1020';
      rr(ctx, x - 2 + face, top + 8, 15, 10, 6);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      rr(ctx, x + 1 + face, top + 10, 5, 3, 2);
      ctx.fill();
      break;
    }

    case 'chicken': {
      [[-8, 0], [0, 3], [8, 0]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, top - 6 + oy, 4.5, Math.PI, 0);
        ctx.fillStyle = '#e63946';
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      rr(ctx, x - 16, top - 4, 32, 24, 12);
      ctx.fillStyle = '#fbf6ec';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(x - 7, top + 8, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 7, top + 8, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f77f00';
      ctx.beginPath();
      ctx.moveTo(x - 4, top + 15);
      ctx.lineTo(x + 4, top + 15);
      ctx.lineTo(x, top + 20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, top + 21, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e63946';
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'creeper': {
      rr(ctx, x - 16, top - 2, 32, 24, 6);
      ctx.fillStyle = '#5db45d';
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#222';
      rr(ctx, x - 10, top + 4, 7, 7, 1);
      ctx.fill();
      rr(ctx, x + 3, top + 4, 7, 7, 1);
      ctx.fill();
      rr(ctx, x - 4, top + 13, 3, 8, 1);
      ctx.fill();
      rr(ctx, x + 1, top + 13, 3, 8, 1);
      ctx.fill();
      rr(ctx, x - 4, top + 19, 8, 3, 1);
      ctx.fill();
      break;
    }

    case 'sans': {
      rr(ctx, x - 19, top + 21, 38, 16, 6);
      ctx.fillStyle = '#5b7fd4';
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 19, top + 33, 38, 3, 1.5);
      ctx.fillStyle = '#fff';
      ctx.fill();
      rr(ctx, x - 19, top - 2, 38, 27, 12);
      ctx.fillStyle = '#1a1a1f';
      ctx.fill();
      outline(ctx);
      rr(ctx, x - 10, top + 4, 20, 3, 1.5);
      ctx.fillStyle = '#e8e8e8';
      ctx.fill();
      rr(ctx, x + 3, player.y - 5, 14, 9, 4);
      ctx.fillStyle = '#f7a8b8';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      rr(ctx, x - 17, player.y - 5, 14, 9, 4);
      ctx.fill();
      ctx.stroke();
      drawSansEye(ctx, x, top + 17, 1.3);
      break;
    }

    case 'hornet': {
      rr(ctx, x - 15, top - 4, 30, 22, 9);
      ctx.fillStyle = '#f5f0e6';
      ctx.fill();
      outline(ctx);
      ctx.beginPath();
      ctx.moveTo(x - 4, top - 2);
      ctx.quadraticCurveTo(x - 6, top - 13, x + 1, top - 20);
      ctx.quadraticCurveTo(x + 4, top - 22, x + 6, top - 19);
      ctx.quadraticCurveTo(x + 1, top - 12, x + 4, top - 2);
      ctx.closePath();
      ctx.fillStyle = '#f5f0e6';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(x - 12, top + 4);
      ctx.lineTo(x - 5, top + 7);
      ctx.lineTo(x - 6, top + 11);
      ctx.lineTo(x - 13, top + 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 12, top + 4);
      ctx.lineTo(x + 5, top + 7);
      ctx.lineTo(x + 6, top + 11);
      ctx.lineTo(x + 13, top + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, top - 2);
      ctx.lineTo(x, top + 17);
      ctx.stroke();
      break;
    }

    default:
      break;
  }
}

export function drawHatPreview(ctx, hatId) {
  const x = 48;
  const footY = 88;
  const w = 26;
  const h = 30;
  ctx.clearRect(0, 0, 96, 96);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(x, footY + 4, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  rr(ctx, x - w / 2, footY - h, w, h, 9);
  ctx.fillStyle = '#ff6b6b';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  rr(ctx, x - w / 2 + 5, footY - h + 5, w - 10, 14, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 8, footY - 14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 8, footY - 14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 7, footY - 13, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 9, footY - 13, 1.6, 0, Math.PI * 2);
  ctx.fill();
  drawHat(ctx, { x, y: footY, w, h, vx: 0, color: '#ff6b6b' }, hatId);
}
