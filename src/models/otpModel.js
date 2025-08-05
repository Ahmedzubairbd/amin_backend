const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  otpCode: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    enum: ['registration', 'password-reset', 'login'],
    default: 'registration'
  },
  verificationToken: {
    type: String,
    required: true
  },
  expiry: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  // Auto-delete expired OTPs after 1 day
  expireAfterSeconds: 86400
});

// Index for faster queries
otpSchema.index({ phoneNumber: 1, purpose: 1 });
otpSchema.index({ verificationToken: 1 });

module.exports = mongoose.model('Otp', otpSchema);