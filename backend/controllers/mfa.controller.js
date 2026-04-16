const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/user.model');

// ─── Setup MFA — generate secret & QR code ───────────────────────────────────
const setupMFA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `TodoSaaS (${req.user.email})`,
      issuer: "TodoSaaS",
      length: 32,
    });

    await User.findByIdAndUpdate(req.user._id, {
      mfaSecret: secret.base32,
      mfaPending: true,
      mfaEnabled: false,
    });

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    console.log("otpauth_url:", secret.otpauth_url);
    console.log("qrDataUrl starts with:", qrDataUrl.slice(0, 30));

    return res.json({
      success: true,
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: qrDataUrl,
      message: "Scan the QR code with Google Authenticator, then verify to enable MFA.",
    });
  } catch (err) {
    console.error("setupMFA error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to setup MFA",
    });
  }
};
// ─── Verify & Enable MFA ──────────────────────────────────────────────────────
const enableMFA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'OTP token is required' });
    }

    const user = await User.findById(req.user._id).select('+mfaSecret');
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: 'MFA not set up. Please run setup first.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token.toString().trim(),
      window: 2,
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      mfaEnabled: true,
      mfaPending: false,
    });

    res.json({
      success: true,
      message: '✅ MFA enabled successfully! Your account is now more secure.',
    });
  } catch (err) {
    console.error('enableMFA error:', err);
    res.status(500).json({ success: false, message: 'Failed to enable MFA' });
  }
};

// ─── Disable MFA ──────────────────────────────────────────────────────────────
const disableMFA = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findById(req.user._id).select('+password +mfaSecret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // For local accounts, require password confirmation
    if (user.provider === 'local' && password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }
    }

    // Verify current OTP
    if (user.mfaEnabled && token) {
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: token.toString().trim(),
        window: 2,
      });

      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
    }

    await User.findByIdAndUpdate(req.user._id, {
      mfaEnabled: false,
      mfaPending: false,
      mfaSecret: null,
    });

    res.json({ success: true, message: 'MFA disabled successfully' });
  } catch (err) {
    console.error('disableMFA error:', err);
    res.status(500).json({ success: false, message: 'Failed to disable MFA' });
  }
};

// ─── MFA status ───────────────────────────────────────────────────────────────
const getMFAStatus = async (req, res) => {
  res.json({
    success: true,
    mfaEnabled: req.user.mfaEnabled,
    mfaPending: req.user.mfaPending,
  });
};

module.exports = { setupMFA, enableMFA, disableMFA, getMFAStatus };