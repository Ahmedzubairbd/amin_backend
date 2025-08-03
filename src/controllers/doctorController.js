const Doctor = require('../models/doctorModel');

exports.createDoctor = async (req, res) => {
  try {
    const { education, availability, ...doctorData } = req.body;

    // Validate required fields
    if (!doctorData.fullName || !doctorData.specialization || !doctorData.email || !doctorData.phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ 
      $or: [{ email: doctorData.email }, { phone: doctorData.phone }] 
    });
    
    if (existingDoctor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor with this email or phone already exists' 
      });
    }

    // Create new doctor
    const doctor = new Doctor({
      ...doctorData,
      education: education || [],
      availability: availability || {}
    });

    await doctor.save();
    
    return res.status(201).json({ 
      success: true, 
      message: 'Doctor created successfully',
      data: doctor 
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const { search, specialization, page = 1, limit = 10 } = req.query;
    let query = { isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by specialization
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await Doctor.find(query)
      .sort({ yearsOfExperience: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1);

    const count = await Doctor.countDocuments(query);

    return res.status(200).json({ 
      success: true,
      message: 'Doctors fetched successfully',
      data: doctors,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalDoctors: count
      }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Doctor fetched successfully',
      data: doctor 
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doctor = await Doctor.findByIdAndUpdate(id, updates, { 
      new: true,
      runValidators: true 
    });

    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Doctor updated successfully',
      data: doctor 
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Doctor deactivated successfully',
      data: doctor 
    });
  } catch (error) {
    console.error('Error deactivating doctor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Doctor availability fetched successfully',
      data: doctor.availability 
    });
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};