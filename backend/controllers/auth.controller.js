const User = require('../models/user.model');
const { generateToken, setTokenCookie, clearTokenCookie, blacklistToken } = require('../utils/jwt.utils');
const { clearLoginRateLimit } = require('../middleware/rateLimiter.middleware');
const { redisDel } = require('../config/redis.config');
const validator = require('validator');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name: name?.trim() || email.split('@')[0],
      provider: 'local',
    });

    const token = generateToken(user._id, user.email);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        mfaEnabled: user.mfaEnabled,
        provider: user.provider,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +mfaSecret');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    // MFA check
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return res.status(200).json({
          success: false,
          requireMFA: true,
          message: 'MFA token required',
          tempUserId: user._id, // Frontend uses this to send MFA token
        });
      }

      const speakeasy = require('speakeasy');
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 2,
      });

      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid MFA token' });
      }
    }

    // Clear rate limit on successful login
    await clearLoginRateLimit(req);

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id, user.email);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        mfaEnabled: user.mfaEnabled,
        provider: user.provider,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.token;
    if (token) {
      await blacklistToken(token);
    }
    
    // Clear todo cache
    await redisDel(`todos:${req.user._id}`);
    
    clearTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// ─── Get current user ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
        mfaEnabled: user.mfaEnabled,
        provider: user.provider,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// ─── Google OAuth callback handler ───────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user._id, user.email);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google callback error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

module.exports = { register, login, logout, getMe, googleCallback };