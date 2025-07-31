const mongoose = require('mongoose');
const TempUser = require("../models/TempUser.js");
const User = require("../models/User.js");
const sendOTP = require("../utils/boomcast");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'Uploads/profiles/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  }
}).single('profileImage');

exports.registerUser = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { firstName, lastName, email, phone, password, userType } = req.body;
    const profileImage = req.file ? req.file.path : null;

    // Validate userType
    const validUserTypes = ['patient', 'doctor', 'administrator', 'moderator'];
    if (!userType || !validUserTypes.includes(userType)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: `Invalid userType! Must be one of: ${validUserTypes.join(', ')}` });
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "User already exists!" });
      }

      // Check if user already exists in TempUser
      await TempUser.deleteOne({ phone }); // Remove any existing TempUser to avoid conflicts
      // const existingTempUser = await TempUser.findOne({ phone });
      // if (existingTempUser) {
      //   if (req.file) fs.unlinkSync(req.file.path);
      //   return res.status(400).json({ message: "OTP already sent! Please verify your OTP." });
      // }

      // Generate OTP
      const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

      // Send OTP via Boomcast
      await sendOTP({ phonenumber: phone, message: `Hello ${firstName}, your OTP is ${otp}. It is valid for 3 minutes.` });

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save user data temporarily
      const newTempUser = new TempUser({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        userType,
        profileImage,
        otp,
        otpExpiresAt: Date.now() + 3 * 60 * 1000,
      });

      console.log("newTempUser", newTempUser);

      await newTempUser.save();

      return res.status(200).json({ message: "OTP sent successfully! Please verify within 3 minutes." });
    } catch (error) {
      console.error(error);
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
};

exports.verifyOTP = async (req, res) => {
  const { otp, phone } = req.body;

  try {
    const tempUser = await TempUser.findOne({ phone });
    if (!tempUser) return res.status(404).json({ message: "User not found! Please register again." });

    if (tempUser.otp !== otp || tempUser.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP!" });
    }

    const newUser = new User({
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      userType: tempUser.userType, // Ensure userType is transferred
      profileImage: tempUser.profileImage,
      isVerified: true,
    });

    await newUser.save();
    await TempUser.deleteOne({ phone });

    return res.status(200).json({ 
      message: "OTP verified successfully!",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        userType: newUser.userType,
        profileImage: newUser.profileImage,
        isVerified: newUser.isVerified
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    return res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID!" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found!" });

    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID!" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (user.profileImage) {
      try {
        fs.unlinkSync(user.profileImage);
      } catch (error) {
        console.error("Error deleting profile image:", error);
      }
    }

    await User.findByIdAndDelete(id);
    await TempUser.deleteOne({ phone: user.phone });

    return res.status(200).json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.resendOTP = async (req, res) => {
  const { phone } = req.body;

  try {
    const tempUser = await TempUser.findOne({ phone });
    if (!tempUser) {
      return res.status(404).json({ message: "User not found! Please register again." });
    }

    const newOTP = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    const otpExpiresAt = new Date(Date.now() + 3 * 60 * 1000);

    tempUser.otp = newOTP;
    tempUser.otpExpiresAt = otpExpiresAt;
    await tempUser.save();

    await sendOTP({ phonenumber: phone, message: `Hello ${tempUser.firstName}, your new OTP is ${newOTP}. It is valid for 3 minutes.` });

    return res.status(200).json({ message: "OTP resent successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};