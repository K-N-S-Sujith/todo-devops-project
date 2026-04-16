const express = require('express');
const router = express.Router();

const {
  setupMFA,
  enableMFA,
  disableMFA,
  getMFAStatus
} = require('../controllers/mfa.controller');

const { protect } = require('../middleware/auth.middleware');

// ─── All MFA routes require authentication ────────────────────────────────────
router.use(protect);

// ─── MFA Routes ───────────────────────────────────────────────────────────────

// Step 1: Generate secret + QR
router.post('/setup', setupMFA);

// Step 2: Verify OTP and enable MFA
router.post('/enable', enableMFA);

// Disable MFA (requires OTP or password)
router.post('/disable', disableMFA);

// Get MFA status
router.get('/status', getMFAStatus);

module.exports = router;