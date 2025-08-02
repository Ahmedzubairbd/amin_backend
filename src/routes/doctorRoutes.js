const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/specialistController');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// Routes
router.route('/')
  .get(getDoctors)
  .post(upload.single('image'), createDoctor);

router.route('/:id')
  .get(getDoctorById)
  .put(upload.single('image'), updateDoctor)
  .delete(deleteDoctor);

module.exports = router;