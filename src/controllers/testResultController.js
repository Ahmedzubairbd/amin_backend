const TestResult = require('../models/testResultModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const uploadTestResultFiles = require('../config/multer');
const fs = require('fs');
const path = require('path');

// Helper function to process file uploads
const processUploadedFiles = (req) => {
  if (!req.files || req.files.length === 0) {
    return [];
  }

  return req.files.map(file => ({
    url: `/uploads/test-results/${file.filename}`,
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  }));
};

// Create test result with file uploads
exports.createTestResult = async (req, res) => {
  uploadTestResultFiles(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }

      const { patient, doctor, testName, testType, testDate, results, notes } = req.body;

      // Validate required fields
      if (!patient || !doctor || !testName || !testType || !results) {
        // Clean up uploaded files if validation fails
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            fs.unlinkSync(file.path);
          });
        }
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }

      // Check if patient and doctor exist
      const [patientExists, doctorExists] = await Promise.all([
        Patient.findById(patient),
        Doctor.findById(doctor)
      ]);

      if (!patientExists || !doctorExists) {
        // Clean up uploaded files if validation fails
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            fs.unlinkSync(file.path);
          });
        }
        return res.status(404).json({ 
          success: false, 
          message: 'Patient or Doctor not found' 
        });
      }

      // Process uploaded files
      const files = processUploadedFiles(req);

      // Create test result
      const testResult = new TestResult({
        patient,
        doctor,
        testName,
        testType,
        testDate: testDate || new Date(),
        results,
        files,
        notes
      });

      await testResult.save();

      // Populate patient and doctor details in response
      const populatedResult = await TestResult.findById(testResult._id)
        .populate('patient', 'fullName phone')
        .populate('doctor', 'fullName specialization');

      return res.status(201).json({ 
        success: true, 
        message: 'Test result created successfully',
        data: populatedResult 
      });

    } catch (error) {
      // Clean up uploaded files if error occurs
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }

      console.error('Error creating test result:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error',
        error: error.message 
      });
    }
  });
};

// Get all test results with optional filters
exports.getAllTestResults = async (req, res) => {
  try {
    const { patientId, doctorId, testType, fromDate, toDate, page = 1, limit = 10 } = req.query;
    let query = {};

    // Apply filters
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (testType) query.testType = { $regex: testType, $options: 'i' };
    if (fromDate || toDate) {
      query.testDate = {};
      if (fromDate) query.testDate.$gte = new Date(fromDate);
      if (toDate) query.testDate.$lte = new Date(toDate);
    }

    const testResults = await TestResult.find(query)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName specialization')
      .sort({ testDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1);

    const count = await TestResult.countDocuments(query);

    return res.status(200).json({ 
      success: true,
      message: 'Test results fetched successfully',
      data: testResults,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalResults: count
      }
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Get single test result by ID
exports.getTestResultById = async (req, res) => {
  try {
    const testResult = await TestResult.findById(req.params.id)
      .populate('patient', 'fullName phone dob')
      .populate('doctor', 'fullName specialization email phone');

    if (!testResult) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test result not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Test result fetched successfully',
      data: testResult 
    });
  } catch (error) {
    console.error('Error fetching test result:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Delete a test result (and associated files)
exports.deleteTestResult = async (req, res) => {
  try {
    const testResult = await TestResult.findById(req.params.id);

    if (!testResult) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test result not found' 
      });
    }

    // Delete associated files
    if (testResult.files && testResult.files.length > 0) {
      testResult.files.forEach(file => {
        const filePath = path.join(__dirname, '..', 'uploads', 'test-results', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await testResult.deleteOne();

    return res.status(200).json({ 
      success: true,
      message: 'Test result deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting test result:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};