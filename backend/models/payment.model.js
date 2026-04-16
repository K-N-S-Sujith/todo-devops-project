const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  razorpaySignature: {
    type: String,
    default: null,
  },
  amount: {
    type: Number,
    required: true, // in paise (INR smallest unit)
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created',
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly', 'lifetime'],
    default: 'monthly',
  },
  description: {
    type: String,
    default: 'Todo SaaS Premium Plan',
  },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      delete ret.razorpaySignature; // Never expose signature
      return ret;
    }
  }
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;