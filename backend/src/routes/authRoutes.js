import { Router } from 'express';

import {
  signup,
  login,
  me,
  updateProfile
} from '../controllers/authController.js';

import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';

import {
  signupValidation,
  loginValidation,
  validate,
} from '../middleware/validationMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Auth Routes
router.post(
  '/signup',
  authRateLimiter,
  signupValidation,
  validate,
  signup
);
const parsedAuthWindowMs = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '',
  10
);

router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  validate,
  login
);

// User Routes
router.get('/me', authenticate, me);

router.put(
  '/profile',
  authenticate,
  updateProfile
);

export default router;