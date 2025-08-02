// /src/models/MedicalTest.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MedicalTestSchema = new Schema({
  examNo:         { type: String,  required: true, index: true },
  examName:       { type: String,  required: true },
  shortName:      { type: String },
  active:         { type: Boolean, default: true },
  rate:           { type: Number,  required: true },
  deliveryHour:   { type: String },
  departmentName: { type: String },
  examType:       { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.models.MedicalTest ||
  mongoose.model('MedicalTest', MedicalTestSchema);