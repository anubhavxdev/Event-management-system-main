import express from 'express';
import http from 'http';

import app from './app.js';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';

import { initSocket } from './services/socket.js';

const server = http.createServer(app);

// Initialize WebSocket
initSocket(server);

// Start server
async function start() {
  await connectDB();
  
  server.listen(env.port, () => {
    console.log(
      `Server running on http://localhost:${env.port}`
    );
  });
}

start();