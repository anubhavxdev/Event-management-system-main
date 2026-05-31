import rateLimit from 'express-rate-limit';

// Login limiter: 10 attempts per 15 min per IP
// Successful requests don't count against the limit
export const authLimiter = rateLimit({
  windowMs:
    Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  max:
    Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,

  skipSuccessfulRequests: true,

  skip: () => process.env.NODE_ENV === 'test',

  message: {
    message:
      'Too many login attempts. Please try again after 15 minutes.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// Registration limiter: 5 accounts per hour per IP
export const registrationLimiter = rateLimit({
  windowMs:
    Number(process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS) ||
    60 * 60 * 1000,

  max:
    Number(process.env.REGISTRATION_RATE_LIMIT_MAX) || 5,

  skip: () => process.env.NODE_ENV === 'test',

  message: {
    message:
      'Too many accounts created from this IP. Please try again after an hour.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// Kept for backward compatibility
export const authRateLimiter = authLimiter;