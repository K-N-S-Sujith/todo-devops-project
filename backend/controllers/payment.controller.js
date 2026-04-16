const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/payment.model');
const User = require('../models/user.model');

const PLANS = {
  monthly: { amount: 19900, description: 'Monthly Premium Plan' },   // ₹199
  yearly: { amount: 149900, description: 'Yearly Premium Plan' },    // ₹1499
  lifetime: { amount: 499900, description: 'Lifetime Premium Plan' }, // ₹4999
};

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─── Create Razorpay Order ────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    console.log("REQ.USER:", req.user);
    console.log("REQ.BODY:", req.body);
    console.log("RAZORPAY_KEY_ID exists:", !!process.env.RAZORPAY_KEY_ID);
    console.log("RAZORPAY_KEY_SECRET exists:", !!process.env.RAZORPAY_KEY_SECRET);

    const { plan = 'monthly' } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    if (req.user?.isPremium) {
      return res.status(400).json({
        success: false,
        message: 'You are already a Premium member!'
      });
    }

    const razorpay = getRazorpay();
    const { amount, description } = PLANS[plan];

    console.log("PLAN:", plan);
    console.log("AMOUNT:", amount);

    const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: {
      userId: req.user._id.toString(),
      plan,
      email: req.user.email,
    },
  });

    console.log("RAZORPAY ORDER:", order);

    const paymentDoc = await Payment.create({
      userId: req.user._id,
      razorpayOrderId: order.id,
      amount,
      plan,
      description,
      status: 'created',
    });

    console.log("PAYMENT SAVED:", paymentDoc);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        plan,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("CREATE ORDER FULL ERROR:", err);
    console.error("CREATE ORDER MESSAGE:", err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create payment order'
    });
  }
};
// ─── Verify Payment Signature ─────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, userId: req.user._id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Upgrade user to premium
    await User.findByIdAndUpdate(req.user._id, {
      isPremium: true,
      premiumSince: new Date(),
    });

    res.json({
      success: true,
      message: '🎉 Payment successful! Welcome to Premium!',
      payment: {
        id: payment._id,
        amount: payment.amount,
        plan: payment.plan,
        status: payment.status,
      },
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// ─── Get payment history ──────────────────────────────────────────────────────
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
};

// ─── Get plans ────────────────────────────────────────────────────────────────
const getPlans = (req, res) => {
  res.json({
    success: true,
    plans: Object.entries(PLANS).map(([key, val]) => ({
      id: key,
      amount: val.amount,
      amountDisplay: `₹${val.amount / 100}`,
      description: val.description,
    })),
  });
};

module.exports = { createOrder, verifyPayment, getPaymentHistory, getPlans };