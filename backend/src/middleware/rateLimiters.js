import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,

  max: process.env.AUTH_RATE_LIMIT_MAX || 10,

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationRateLimiter = rateLimit({
  windowMs:
    process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS || 60 * 1000,

  max: process.env.REGISTRATION_RATE_LIMIT_MAX || 5,

  message: {
    success: false,
    message:
      "Too many registration attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});