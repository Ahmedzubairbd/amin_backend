const express = require("express");
const { registerUser, verifyOTP, getAllUsers, getUserById, deleteUser, resendOTP } = require("../controllers/userController");
const { createAppointment, getAppointments, getDoctors, updateAppointment } = require("../controllers/appointmentController");

const router = express.Router();

router.post("/user/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// New routes for fetching users
router.get('/users/doctors', getDoctors);
router.get("/users", getAllUsers); // Get all users
router.get("/users/:id", getUserById); // Get a specific user by ID
// router.get("/users/:id", getUserById); // Get a specific user by ID
router.delete('/users/:id', deleteUser); //delete a specific user by ID



router.post('/appointments', createAppointment);
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointment);

module.exports = router;
