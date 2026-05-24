import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import app from './app.js';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';

// routes (only if needed here, otherwise keep in app.js)
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

import { initSocket } from './services/socket.js';

const server = http.createServer(app);

// routes (keep only if NOT already in app.js)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route not found: ${req.originalUrl}` 
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err);

  // If the response headers have already been sent, delegate to Express's default handler
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.status === 500 ? 'Internal Server Error' : (err.message || 'Server error'),
  });
});

// Server Startup & Graceful Shutdown
async function start() {
  try {
    // await connectDB();

    server.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    // Handle termination signals for graceful shutdown (e.g., Some Container stuff like Docker, Heroku, or even just Ctrl+C)
    const shutdown = () => {
      console.log('Shutdown signal received. Closing HTTP server...');
      server.close(() => {
        console.log('HTTP server closed.');
        // Add database disconnection here in the future if needed (e.g., mongoose.connection.close())
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

start();
