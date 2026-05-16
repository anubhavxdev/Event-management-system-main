import http from 'http';

import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socket.js';

const server = http.createServer(app);

// Security & utils
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Basic rate limit
const parsedApiRateLimitMax = Number.parseInt(
  process.env.API_RATE_LIMIT_MAX ?? '',
  10
);

const apiRateLimitMax =
  Number.isFinite(parsedApiRateLimitMax) &&
  parsedApiRateLimitMax > 0
    ? parsedApiRateLimitMax
    : 120;

const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalRateLimiter);

// Posters are served from Cloudinary CDN — no local static serving needed

// API Routes (mounted later when implemented)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

async function start() {
  await connectDB();

  initSocket(server, env.clientUrl);

  server.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

start();
