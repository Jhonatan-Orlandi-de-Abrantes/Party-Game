'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Proibido');
    return;
  }
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404);
      res.end('Nao encontrado');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(serveStatic);

const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

function normalizeRoom(room) {
  return String(room || '').trim().toUpperCase().slice(0, 12) || null;
}

function broadcastToRoom(sender, room, payload) {
  const data = JSON.stringify(payload);
  for (const client of clients) {
    if (client === sender) continue;
    if (client.readyState !== client.OPEN) continue;
    if (!room || client.roomCode !== room) continue;
    try {
      client.send(data);
    } catch (error) {}
  }
}

wss.on('connection', socket => {
  socket.isAlive = true;
  socket.roomCode = null;
  clients.add(socket);
  console.log(`[ws] Cliente conectado (${clients.size} online)`);

  socket.on('pong', () => {
    socket.isAlive = true;
  });

  socket.on('message', raw => {
    let msg = null;
    try {
      msg = JSON.parse(raw.toString());
    } catch (error) {
      return;
    }
    if (!msg || typeof msg !== 'object') return;

    if (msg.t === 'join' && msg.room) {
      socket.roomCode = normalizeRoom(msg.room);
      return;
    }

    if (msg.t === 'relay' && typeof msg.key === 'string') {
      broadcastToRoom(socket, socket.roomCode, { t: 'remote', key: msg.key, value: msg.value });
      return;
    }

    if (msg.t === 'whois' && msg.room) {
      const room = normalizeRoom(msg.room);
      broadcastToRoom(socket, room, { t: 'whois', room });
      return;
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
    console.log(`[ws] Cliente saiu (${clients.size} online)`);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });
});

server.on('upgrade', (req, socket, head) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname !== '/ws') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});

setInterval(() => {
  for (const client of clients) {
    if (!client.isAlive) {
      client.terminate();
      clients.delete(client);
      continue;
    }
    client.isAlive = false;
    try {
      client.ping();
    } catch (error) {}
  }
}, 30000);

server.listen(PORT, () => {
  console.log(`PartyGame rodando em http://localhost:${PORT}`);
  console.log('Abra na rede local via http://<seu-ip>:' + PORT + ' para jogar entre dispositivos.');
});
