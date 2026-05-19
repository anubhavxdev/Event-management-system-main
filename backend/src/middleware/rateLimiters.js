import rateLimit from 'express-rate-limit';

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs:
    Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  max:
    Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,

  message: {
    message:
      'Too many authentication attempts. Please try again later.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// Registration limiter
export const registrationLimiter = rateLimit({
  windowMs:
    Number(process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS) ||
    60 * 1000,

  max:
    Number(process.env.REGISTRATION_RATE_LIMIT_MAX) || 5,

  message: {
    message:
      'Too many registration attempts. Please try again later.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});
export const authRateLimiter = authLimiter;
