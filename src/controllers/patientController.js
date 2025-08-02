const Patient = require('../models/patientModel');

exports.createPatient = async (req, res) => {
  const { fullName, email, phone, dob, lastVisit, nextAppointment, address } = req.body;

  try {
    // Validate required fields
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ phone });
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient with this phone number already exists' });
    }

    // Create new patient
    const patient = new Patient({
      fullName,
      email,
      phone,
      dob: dob ? new Date(dob) : null,
      lastVisit: lastVisit ? new Date(lastVisit) : null,
      nextAppointment: nextAppointment ? new Date(nextAppointment) : null,
      address
    });

    await patient.save();
    return res.status(201).json({ message: 'Patient created successfully', patient });
  } catch (error) {
    console.error('Error creating patient:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getPatients = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  try {
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Patient.countDocuments(query);

    return res.status(200).json({
      message: 'Patients fetched successfully',
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      count,
      patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getPatientById = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(200).json({ message: 'Patient fetched successfully', patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updatePatient = async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, dob, lastVisit, nextAppointment, address } = req.body;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    // Find patient
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if phone is being updated to a number that already exists
    if (phone && phone !== patient.phone) {
      const existingPatient = await Patient.findOne({ phone });
      if (existingPatient) {
        return res.status(400).json({ message: 'Patient with this phone number already exists' });
      }
    }

    // Update fields
    patient.fullName = fullName || patient.fullName;
    patient.email = email || patient.email;
    patient.phone = phone || patient.phone;
    patient.dob = dob ? new Date(dob) : patient.dob;
    patient.lastVisit = lastVisit ? new Date(lastVisit) : patient.lastVisit;
    patient.nextAppointment = nextAppointment ? new Date(nextAppointment) : patient.nextAppointment;
    patient.address = address || patient.address;

    await patient.save();
    return res.status(200).json({ message: 'Patient updated successfully', patient });
  } catch (error) {
    console.error('Error updating patient:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.deletePatient = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(200).json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};