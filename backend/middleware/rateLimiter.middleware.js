const { redisIncr, redisExpire, redisTTL } = require('../config/redis.config');

/**
 * Redis-backed rate limiter for login attempts
 * Falls back gracefully if Redis is unavailable
 */
const loginRateLimiter = async (req, res, next) => {
  const maxAttempts = parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5;
  const windowSeconds = 15 * 60; // 15 minutes

  // Use IP + email for granular limiting
  const identifier = `login_attempts:${req.ip}:${(req.body.email || '').toLowerCase()}`;

  try {
    const attempts = await redisIncr(identifier);
    
    if (attempts === 1) {
      // First attempt in window — set expiry
      await redisExpire(identifier, windowSeconds);
    }

    if (attempts > maxAttempts) {
      const ttl = await redisTTL(identifier);
      const minutesLeft = Math.ceil(ttl / 60);
      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Try again in ${minutesLeft} minute(s).`,
        retryAfter: ttl,
      });
    }

    // Attach remaining attempts info
    req.loginAttempts = attempts;
    req.loginAttemptsRemaining = maxAttempts - attempts;
    next();
  } catch (err) {
    // Redis error — allow request (fail open for UX)
    console.error('Rate limiter error:', err.message);
    next();
  }
};

/**
 * Clear login rate limit on successful login
 */
const clearLoginRateLimit = async (req) => {
  const identifier = `login_attempts:${req.ip}:${(req.body.email || '').toLowerCase()}`;
  const { redisDel } = require('../config/redis.config');
  await redisDel(identifier);
};

module.exports = { loginRateLimiter, clearLoginRateLimit };