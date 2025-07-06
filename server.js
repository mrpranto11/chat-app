const express = require('express'); const http = require('http'); const WebSocket = require('ws'); const path = require('path');

const app = express(); const server = http.createServer(app); const wss = new WebSocket.Server({ server });

// Serve frontend from public folder app.use(express.static(path.join(__dirname, 'public')));

const waitingUsers = []; // Queue for waiting users const userPairs = new Map(); // ws -> partnerWs const usernames = new Map(); // ws -> username

wss.on('connection', function connection(ws) { console.log('✅ New client connected');

ws.on('message', function incoming(message) { let parsed; try { parsed = JSON.parse(message); } catch (e) { console.log('❌ Invalid message format'); return; }

if (parsed.type === 'join') {
  const { name } = parsed;
  usernames.set(ws, name);

  if (waitingUsers.length > 0) {
    const partner = waitingUsers.shift();
    userPairs.set(ws, partner);
    userPairs.set(partner, ws);

    const partnerName = usernames.get(partner);
    const yourName = usernames.get(ws);

    ws.send(JSON.stringify({ type: 'info', message: `Connected with ${partnerName}` }));
    partner.send(JSON.stringify({ type: 'info', message: `Connected with ${yourName}` }));
  } else {
    waitingUsers.push(ws);
    ws.send(JSON.stringify({ type: 'info', message: 'Waiting for a partner...' }));
  }
}

else if (parsed.type === 'message' || parsed.type === 'image') {
  const partner = userPairs.get(ws);
  if (partner && partner.readyState === WebSocket.OPEN) {
    partner.send(JSON.stringify({
      type: parsed.type,
      from: usernames.get(ws),
      content: parsed.content
    }));
  }
}

else if (parsed.type === 'typing') {
  const partner = userPairs.get(ws);
  if (partner && partner.readyState === WebSocket.OPEN) {
    partner.send(JSON.stringify({
      type: 'typing',
      from: usernames.get(ws)
    }));
  }
}

else if (parsed.type === 'stop_typing') {
  const partner = userPairs.get(ws);
  if (partner && partner.readyState === WebSocket.OPEN) {
    partner.send(JSON.stringify({
      type: 'stop_typing'
    }));
  }
}

});

ws.on('close', () => { console.log('❌ Client disconnected');

const partner = userPairs.get(ws);
if (partner && partner.readyState === WebSocket.OPEN) {
  partner.send(JSON.stringify({ type: 'info', message: 'Partner disconnected.' }));
  userPairs.delete(partner);
}

userPairs.delete(ws);
usernames.delete(ws);

const index = waitingUsers.indexOf(ws);
if (index !== -1) waitingUsers.splice(index, 1);

}); });

const PORT = process.env.PORT || 3000; server.listen(PORT, () => { console.log(🚀 Server running on http://localhost:${PORT}); });

