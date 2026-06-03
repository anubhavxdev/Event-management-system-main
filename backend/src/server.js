import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socket.js';

const server = http.createServer(app);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await connectDB();

  // Initialize Socket.IO
  initSocket(server, env.clientUrl);

  server.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

start();