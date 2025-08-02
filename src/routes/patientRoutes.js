const express = require('express');
const router = express.Router();
const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

// Create a new patient
router.post('/', createPatient);

// Get all patients with optional search and pagination
router.get('/', getPatients);

// Get a single patient by ID
router.get('/:id', getPatientById);

// Update a patient
router.put('/:id', updatePatient);

// Delete a patient
router.delete('/:id', deletePatient);

module.exports = router;