const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required']
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true
  },
  testType: {
    type: String,
    required: [true, 'Test type is required'],
    trim: true
  },
  testDate: {
    type: Date,
    required: [true, 'Test date is required'],
    default: Date.now
  },
  results: {
    type: String,
    required: [true, 'Results are required'],
    trim: true
  },
  files: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalname: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Reviewed', 'Archived'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
testResultSchema.index({ patient: 1 });
testResultSchema.index({ doctor: 1 });
testResultSchema.index({ testDate: -1 });

module.exports = mongoose.model('TestResult', testResultSchema);