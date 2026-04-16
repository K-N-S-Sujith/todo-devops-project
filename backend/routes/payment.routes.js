const express = require('express');
const router = express.Router();

const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPlans
} = require('../controllers/payment.controller');

const { protect } = require('../middleware/auth.middleware');

// ─── Public Routes ────────────────────────────────────────────────────────────

// Get available plans
router.get('/plans', getPlans);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// Create Razorpay order
router.post('/create-order', protect, createOrder);

// Verify payment (after frontend payment success)
router.post('/verify', protect, verifyPayment);

// Get user's payment history
router.get('/history', protect, getPaymentHistory);

module.exports = router;