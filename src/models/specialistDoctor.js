const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialty: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  availability: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);