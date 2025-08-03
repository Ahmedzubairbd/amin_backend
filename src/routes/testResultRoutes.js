const express = require('express');
const router = express.Router();
const {
  createTestResult,
  getAllTestResults,
  getTestResultById,
  deleteTestResult
} = require('../controllers/testResultController');

// Create test result with file uploads
router.post('/', createTestResult);

// Get all test results with optional filters
router.get('/', getAllTestResults);

// Get single test result by ID
router.get('/:id', getTestResultById);

// Delete a test result
router.delete('/:id', deleteTestResult);

module.exports = router;