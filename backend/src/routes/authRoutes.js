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
import passport, { isGoogleOAuthEnabled } from '../config/passport.js';
import { generateJwtToken } from '../utils/generateToken.js';
import { env } from '../config/env.js';

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

if (isGoogleOAuthEnabled) {
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account',
    })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${env.clientUrl}/auth/google/callback?error=1`,
      session: false,
    }),
    (req, res) => {
      const user = req.user;
      const token = generateJwtToken({ id: user._id, role: user.role, name: user.name });
      const avatar = user.avatarUrl ? encodeURIComponent(user.avatarUrl) : '';
      res.redirect(
        `${env.clientUrl}/auth/google/callback?token=${token}&id=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&avatar=${avatar}`
      );
    }
  );
} else {
  router.get('/google', (_req, res) => {
    res.status(503).json({ message: 'Google sign-in is not configured on this server.' });
  });

  router.get('/google/callback', (_req, res) => {
    res.redirect(`${env.clientUrl}/login?error=google_failed`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────

// User Routes
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);

export default router;

