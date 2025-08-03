const express = require('express');
const router = express.Router();
const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorAvailability
} = require('../controllers/doctorController');

// Create a new doctor
router.post('/', createDoctor);

// Get all doctors (with search and pagination)
router.get('/', getAllDoctors);

// Get a specific doctor by ID
router.get('/:id', getDoctorById);

// Update a doctor
router.put('/:id', updateDoctor);

// Delete (deactivate) a doctor
router.delete('/:id', deleteDoctor);

// Get doctor's availability
router.get('/:id/availability', getDoctorAvailability);

module.exports = router;