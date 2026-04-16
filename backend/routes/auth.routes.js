const express = require('express');
const passport = require('passport');
const router = express.Router();
const { register, login, logout, getMe, googleCallback } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { loginRateLimiter } = require('../middleware/rateLimiter.middleware');

// Local auth
router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  googleCallback
);

module.exports = router;