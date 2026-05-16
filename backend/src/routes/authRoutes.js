import { Router } from 'express';
import { signup, login, me, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  signupValidation,
  loginValidation,
  validate,
} from '../middleware/validationMiddleware.js';

const router = Router();
router.post(
  '/signup',
  signupValidation,
  validate,
  signup
const parsedAuthWindowMs = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '',
  10
);

router.post(
  '/login',
  loginValidation,
  validate,
  login
);
router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);

router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);

export default router;
