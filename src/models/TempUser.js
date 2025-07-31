const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  userType: { type: String},
  otp: { type: String, required: true },
  otpExpiresAt: { type: Date, index: { expires: '3m' } },
}, { timestamps: true });

module.exports = mongoose.model('TempUser', tempUserSchema);