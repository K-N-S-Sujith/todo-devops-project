const jwt = require('jsonwebtoken');
const { redisSet, redisGet } = require('../config/redis.config');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for a user
 */
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: 'todo-saas' }
  );
};

/**
 * Verify a JWT
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Blacklist a token on logout (Redis-backed)
 */
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) return;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisSet(`blacklist:${token}`, '1', ttl);
    }
  } catch (err) {
    console.error('Blacklist token error:', err.message);
  }
};

/**
 * Check if a token has been blacklisted
 */
const isTokenBlacklisted = async (token) => {
  const val = await redisGet(`blacklist:${token}`);
  return val === '1';
};

/**
 * Set JWT as httpOnly cookie
 */
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

/**
 * Clear JWT cookie
 */
const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

module.exports = {
  generateToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted,
  setTokenCookie,
  clearTokenCookie,
};