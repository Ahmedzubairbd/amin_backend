const mongoose = require('mongoose');
const Patient = require('../models/patientModel');
const otpService = require('../services/otpService');

// OTP Verification Flow
exports.initiateRegistration = async (req, res) => {
  const { phone } = req.body;

  try {
    // Validate phone number
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ phone });
    if (existingPatient) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient with this phone number already exists' 
      });
    }

    // Generate and send OTP
    const otpResult = await otpService.generateOTP(phone, 'registration');

    if (!otpResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: otpResult.error 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      verificationToken: otpResult.verificationToken,
      expiresAt: otpResult.expiresAt
    });
  } catch (error) {
    console.error('Registration initiation failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error' 
    });
  }
};

exports.verifyOTPAndRegister = async (req, res) => {
  const { phone, otp, verificationToken, fullName, email, dob, address } = req.body;

  try {
    // Verify OTP first
    const otpVerification = await otpService.verifyOTP(phone, otp, verificationToken, 'registration');

    if (!otpVerification.success) {
      return res.status(400).json({ 
        success: false, 
        message: otpVerification.error,
        attemptsRemaining: otpVerification.attemptsRemaining 
      });
    }

    // Create new patient after OTP verification
    const patient = new Patient({
      fullName,
      email,
      phone,
      dob: dob ? new Date(dob) : null,
      address,
      isPhoneVerified: true,
      phoneVerifiedAt: new Date()
    });

    await patient.save();

    return res.status(201).json({ 
      success: true,
      message: 'Patient registered successfully',
      data: patient 
    });
  } catch (error) {
    console.error('Patient registration failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error' 
    });
  }
};

exports.resendOTP = async (req, res) => {
  const { phone, verificationToken } = req.body;

  try {
    const otpResult = await otpService.resendOTP(phone, verificationToken, 'registration');

    if (!otpResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: otpResult.error 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      verificationToken: otpResult.verificationToken,
      expiresAt: otpResult.expiresAt
    });
  } catch (error) {
    console.error('OTP resend failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error' 
    });
  }
};

// Existing Patient CRUD Operations
exports.getPatients = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  try {
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Patient.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Patients fetched successfully',
      data: patients,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalPatients: count
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.getPatientById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid patient ID' 
      });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Patient fetched successfully',
      data: patient 
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.updatePatient = async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, dob, lastVisit, nextAppointment, address } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid patient ID' 
      });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    if (phone && phone !== patient.phone) {
      const existingPatient = await Patient.findOne({ phone });
      if (existingPatient) {
        return res.status(400).json({ 
          success: false, 
          message: 'Patient with this phone number already exists' 
        });
      }
      
      // If phone number is changed, require OTP verification again
      patient.isPhoneVerified = false;
      patient.phoneVerifiedAt = null;
    }

    patient.fullName = fullName || patient.fullName;
    patient.email = email || patient.email;
    patient.phone = phone || patient.phone;
    patient.dob = dob ? new Date(dob) : patient.dob;
    patient.lastVisit = lastVisit ? new Date(lastVisit) : patient.lastVisit;
    patient.nextAppointment = nextAppointment ? new Date(nextAppointment) : patient.nextAppointment;
    patient.address = address || patient.address;

    await patient.save();
    return res.status(200).json({ 
      success: true,
      message: 'Patient updated successfully',
      data: patient 
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.deletePatient = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid patient ID' 
      });
    }

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Patient deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Additional OTP-related endpoints
exports.verifyPhoneNumber = async (req, res) => {
  const { phone, otp, verificationToken } = req.body;

  try {
    const verification = await otpService.verifyOTP(phone, otp, verificationToken, 'phone-verification');

    if (!verification.success) {
      return res.status(400).json({ 
        success: false, 
        message: verification.error,
        attemptsRemaining: verification.attemptsRemaining 
      });
    }

    // Update patient's phone verification status
    const patient = await Patient.findOneAndUpdate(
      { phone },
      { 
        isPhoneVerified: true,
        phoneVerifiedAt: new Date() 
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Phone number verified successfully',
      data: patient 
    });
  } catch (error) {
    console.error('Phone verification failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.initiatePhoneVerification = async (req, res) => {
  const { phone } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    const patient = await Patient.findOne({ phone });
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    if (patient.isPhoneVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is already verified' 
      });
    }

    const otpResult = await otpService.generateOTP(phone, 'phone-verification');

    if (!otpResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: otpResult.error 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      verificationToken: otpResult.verificationToken,
      expiresAt: otpResult.expiresAt
    });
  } catch (error) {
    console.error('Phone verification initiation failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};