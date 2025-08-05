const smsService = require('./smsService');
const config = require('../config/smsConfig');
const Otp = require('../models/otpModel');
const { v4: uuidv4 } = require('uuid');

class OTPService {
  constructor() {
    this.otpConfig = config.sonaliSMS.otp;
  }

  async generateOTP(phoneNumber, purpose = 'registration') {
    try {
      // Generate random 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + this.otpConfig.expiry);
      const verificationToken = uuidv4();

      // Create or update OTP record
      const otpRecord = await Otp.findOneAndUpdate(
        { phoneNumber, purpose },
        { 
          otpCode,
          expiry,
          verificationToken,
          attempts: 0,
          verified: false
        },
        { upsert: true, new: true }
      );

      // Send OTP via SMS
      const message = `Your OTP for registration is ${otpCode}. Valid for 5 minutes.`;
      const smsResult = await smsService.sendSMS(phoneNumber, message);

      if (!smsResult.success) {
        await Otp.deleteOne({ _id: otpRecord._id });
        throw new Error('Failed to send OTP SMS');
      }

      return {
        success: true,
        verificationToken,
        expiresAt: expiry,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('OTP generation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate OTP'
      };
    }
  }

  async verifyOTP(phoneNumber, otpCode, verificationToken, purpose = 'registration') {
    try {
      const otpRecord = await Otp.findOne({
        phoneNumber,
        verificationToken,
        purpose
      });

      if (!otpRecord) {
        return {
          success: false,
          error: 'Invalid OTP request'
        };
      }

      // Check if OTP is already verified
      if (otpRecord.verified) {
        return {
          success: false,
          error: 'OTP already verified'
        };
      }

      // Check if exceeded max attempts
      if (otpRecord.attempts >= this.otpConfig.maxAttempts) {
        return {
          success: false,
          error: 'Maximum attempts reached. Please request a new OTP.'
        };
      }

      // Check if OTP expired
      if (new Date() > otpRecord.expiry) {
        return {
          success: false,
          error: 'OTP expired. Please request a new one.'
        };
      }

      // Verify OTP code
      if (otpRecord.otpCode !== otpCode) {
        // Increment attempt count
        await Otp.updateOne(
          { _id: otpRecord._id },
          { $inc: { attempts: 1 } }
        );

        const remainingAttempts = this.otpConfig.maxAttempts - (otpRecord.attempts + 1);
        
        return {
          success: false,
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          attemptsRemaining: remainingAttempts
        };
      }

      // Mark OTP as verified
      await Otp.updateOne(
        { _id: otpRecord._id },
        { verified: true, verifiedAt: new Date() }
      );

      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return {
        success: false,
        error: 'Failed to verify OTP'
      };
    }
  }

  async resendOTP(phoneNumber, verificationToken, purpose = 'registration') {
    try {
      // Delete any existing OTP for this phone and purpose
      await Otp.deleteOne({ phoneNumber, purpose });

      // Generate new OTP
      return this.generateOTP(phoneNumber, purpose);
    } catch (error) {
      console.error('OTP resend failed:', error);
      return {
        success: false,
        error: 'Failed to resend OTP'
      };
    }
  }
}

module.exports = new OTPService();