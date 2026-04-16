const express = require('express');
const router = express.Router();

const {
  updateProfile,
  changePassword,
  getStats,
  deleteAccount
} = require('../controllers/user.controller');

const { protect } = require('../middleware/auth.middleware');

// ─── All routes require authentication ────────────────────────────────────────
router.use(protect);

// ─── User Routes ─────────────────────────────────────────────────────────────

// Update profile (name, avatar)
router.put('/profile', updateProfile);

// Change password (only local users)
router.put('/password', changePassword);

// Get user stats (dashboard data)
router.get('/stats', getStats);

// Delete account (danger zone)
router.delete('/delete', deleteAccount);

module.exports = router;