const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String,  required: true, unique: true },
  email: { type: String,  unique: true },
  password: { type: String, required: true },
  userType: {
    type: String,
    enum: ['patient', 'doctor','administrator', 'moderator'],
    default: 'patient',
    required: true
  },
  otp: {type: String},
  otpExpiresAt: { type: Date, index: { expires: '3m' } },
  isVerified: { type: Boolean, default: false } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
