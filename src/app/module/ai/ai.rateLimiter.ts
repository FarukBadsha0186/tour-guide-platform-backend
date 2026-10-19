// src/app/modules/ai/ai.rateLimiter.ts

import rateLimit from "express-rate-limit";

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                    // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many AI requests. Please wait a minute and try again.",
    data: null,
  },
});