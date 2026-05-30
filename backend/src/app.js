import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { secureUploads } from './middleware/secureUploads.js';

import { env } from './config/env.js';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Security & utils
app.use(helmet());
// Allow the configured client URL and the common Vite dev port 5174 during development
const allowedOrigins = [env.clientUrl];
if (env.nodeEnv !== 'production') {
  // Vite may pick a different port (5173/5174/5175) — allow localhost:5174 used by local dev
  allowedOrigins.push('http://localhost:5174');
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser requests like curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Basic rate limit
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Static posters
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use(
  '/uploads',
  secureUploads,
  express.static(path.join(process.cwd(), 'uploads'))
);

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    message: err.message || 'Server error'
  });
});

export default app;
