const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  timeSlot: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Moderator or Admin
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);