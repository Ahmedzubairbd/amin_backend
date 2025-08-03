const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    unique: true
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Experience cannot be negative']
  },
  education: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    }
  }],
  biography: {
    type: String,
    trim: true
  },
  image: {
    type: String, // URL to image stored in cloud storage
    default: ''
  },
  availability: {
    type: Map,
    of: [String], // Array of time slots for each day
    default: {
      Monday: ['09:00-12:00', '14:00-17:00'],
      Tuesday: ['09:00-12:00', '14:00-17:00'],
      Wednesday: ['09:00-12:00'],
      Thursday: ['09:00-12:00', '14:00-17:00'],
      Friday: ['09:00-12:00']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster search
doctorSchema.index({ fullName: 'text', specialization: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);