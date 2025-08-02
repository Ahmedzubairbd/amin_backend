const Doctor = require('../models/specialistDoctor');
const asyncHandler = require('express-async-handler');

// Get all doctors
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find();
  res.json(doctors);
});

// Get single doctor by ID
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (doctor) {
    res.json(doctor);
  } else {
    res.status(404);
    throw new Error('Doctor not found');
  }
});

// Create new doctor
const createDoctor = asyncHandler(async (req, res) => {
  const { name, specialty, availability } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const doctor = new Doctor({
    name,
    specialty,
    image,
    availability
  });

  const createdDoctor = await doctor.save();
  res.status(201).json(createdDoctor);
});

// Update doctor
const updateDoctor = asyncHandler(async (req, res) => {
  const { name, specialty, availability } = req.body;
  const doctor = await Doctor.findById(req.params.id);

  if (doctor) {
    doctor.name = name || doctor.name;
    doctor.specialty = specialty || doctor.specialty;
    doctor.availability = availability || doctor.availability;
    if (req.file) {
      doctor.image = `/uploads/${req.file.filename}`;
    }

    const updatedDoctor = await doctor.save();
    res.json(updatedDoctor);
  } else {
    res.status(404);
    throw new Error('Doctor not found');
  }
});

// Delete doctor
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (doctor) {
    await doctor.remove();
    res.json({ message: 'Doctor removed' });
  } else {
    res.status(404);
    throw new Error('Doctor not found');
  }
});

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};