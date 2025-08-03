// /src/app.js
// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors'); 
// const connectDB = require('./config/db');
// const userRoutes = require('./routes/userRoutes');
// const medicalTestsRouter = require('./routes/medicalTests');
// const doctorRoutes = require('./routes/doctorRoutes');

// dotenv.config();
// connectDB();

// const app = express();
// app.use(express.json()); // Body parser middleware
// app.use(cors());
// app.use('/api',       userRoutes);
// app.use('/api/medical-tests', medicalTestsRouter);
// app.use('/api/doctors',doctorRoutes);

// // Enable CORS for all routes

// // Routes
// app.use('/api', userRoutes);


// module.exports = app;


const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const medicalTestsRouter = require('./routes/medicalTests');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const testResultRoutes = require('./routes/testResultRoutes');

dotenv.config();
connectDB();

const app = express();

// Enable CORS for all routes
// Body parser middleware
app.use(express.json());
app.use(cors());

app.use('/api',       userRoutes);
app.use('/api/medical-tests', medicalTestsRouter);


// Routes
// app.use('/api', userRoutes);
// app.use('/api/medical-tests', medicalTestsRouter);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/test-results', testResultRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;
