import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, me, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from "../middleware/rateLimiters.js";

const router = Router();
<<<<<<< HEAD
const parsedAuthWindowMs = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '',
  10
);

const parsedAuthMax = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_MAX ?? '',
  10
);

const authWindowMs =
  Number.isFinite(parsedAuthWindowMs) &&
  parsedAuthWindowMs > 0
    ? parsedAuthWindowMs
    : 15 * 60 * 1000;

const authMax =
  Number.isFinite(parsedAuthMax) &&
  parsedAuthMax > 0
    ? parsedAuthMax
    : 10;
const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  message: {
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
=======
>>>>>>> 9fcd2db (feat: apply strict rate limiting to auth endpoints)
router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);

export default router;


