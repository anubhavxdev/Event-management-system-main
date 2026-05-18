import { Router } from 'express';
import { signup, login, me, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  signupValidation,
  loginValidation,
  validate,
} from '../middleware/validationMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';
import passport from '../config/passport.js';
import { generateJwtToken } from '../utils/generateToken.js';

const router = Router();

router.post(
  '/signup',
  authRateLimiter,
  signupValidation,
  validate,
  signup
);

router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  validate,
  login
);

// ── Google OAuth ──────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false,
    prompt: 'select_account' 
  })
);

// Step 2: Google redirects back here
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/callback?error=1`,
    session: false
  }),
  (req, res) => {
    const user = req.user;
    const token = generateJwtToken({ id: user._id, role: user.role, name: user.name });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const avatar = user.avatarUrl ? encodeURIComponent(user.avatarUrl) : '';
    res.redirect(
      `${clientUrl}/auth/google/callback?token=${token}&id=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&avatar=${avatar}`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────

router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);

export default router;

