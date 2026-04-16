const passport = require('passport');
const { isTokenBlacklisted } = require('../utils/jwt.utils');

/**
 * Protect routes — require valid JWT
 */
const protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Authentication error' });
    }

    if (!user) {
      const message = info?.message || 'Not authorized, token failed';
      return res.status(401).json({ success: false, message });
    }

    // Extract token for blacklist check
    const token = req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has been revoked. Please login again.' 
        });
      }
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account has been deactivated' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  })(req, res, next);
};

/**
 * Require premium subscription
 */
const requirePremium = (req, res, next) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({
      success: false,
      message: 'This feature requires a Premium subscription',
      code: 'PREMIUM_REQUIRED',
    });
  }
  next();
};

/**
 * Optional auth — attaches user if valid token present, else continues
 */
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

module.exports = { protect, requirePremium, optionalAuth };