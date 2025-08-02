const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
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
  dob: {
    type: Date
  },
  lastVisit: {
    type: Date
  },
  nextAppointment: {
    type: Date
  },
  address: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);