const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const User = require('../models/User');

exports.createAppointment = async (req, res) => {
  const { patientName, patientPhone, doctorId, timeSlot, date } = req.body;

  try {
    // Validate doctor
    const doctor = await User.findOne({ _id: doctorId, userType: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Validate date
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    // Basic availability check
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    const existingAppointment = await Appointment.findOne({
      doctorId,
      timeSlot,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (existingAppointment) {
      return res.status(400).json({ message: 'Doctor is not available at this time slot' });
    }

    const appointment = new Appointment({
      patientName,
      patientPhone,
      doctorId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      timeSlot,
      date: new Date(date),
    });

    await appointment.save();
    return res.status(201).json({ message: 'Appointment created successfully', appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { patientName, patientPhone, doctorId, timeSlot, date, status } = req.body;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Validate doctor
    const doctor = await User.findOne({ _id: doctorId, userType: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Validate date
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    // Check availability (exclude current appointment)
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    const existingAppointment = await Appointment.findOne({
      doctorId,
      timeSlot,
      date: { $gte: startOfDay, $lte: endOfDay },
      _id: { $ne: id },
    });
    if (existingAppointment) {
      return res.status(400).json({ message: 'Doctor is not available at this time slot' });
    }

    // Update fields
    appointment.patientName = patientName;
    appointment.patientPhone = patientPhone;
    appointment.doctorId = doctorId;
    appointment.doctorName = `${doctor.firstName} ${doctor.lastName}`;
    appointment.timeSlot = timeSlot;
    appointment.date = new Date(date);
    appointment.status = status;

    await appointment.save();
    return res.status(200).json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctorId', 'firstName lastName');
    return res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ userType: 'doctor' }).select('-password');
    console.log('Fetched doctors:', doctors);
    return res.status(200).json({ users: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};