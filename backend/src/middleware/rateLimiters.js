import rateLimit from 'express-rate-limit';

// Helper to safely parse numeric env vars
const parseEnvInt = (envVar, fallback) => {
  if (
    typeof envVar === 'undefined' ||
    envVar === null ||
    envVar === ''
  ) {
    return fallback;
  }

  const n = Number.parseInt(envVar, 10);

  return Number.isNaN(n) ? fallback : n;
};

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: parseEnvInt(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000
  ),

  max: parseEnvInt(
    process.env.AUTH_RATE_LIMIT_MAX,
    10
  ),


  message: {
    message:
      'Too many authentication attempts. Please try again later.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// Registration limiter
export const registrationLimiter = rateLimit({
  windowMs: parseEnvInt(
    process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS,
    60 * 1000
  ),

  max: parseEnvInt(
    process.env.REGISTRATION_RATE_LIMIT_MAX,
    5
  ),

  message: {
    message:
      'Too many registration attempts. Please try again later.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});
// Backward compatibility exports
export const authRateLimiter = authLimiter;
export const registrationRateLimiter = registrationLimiter;
