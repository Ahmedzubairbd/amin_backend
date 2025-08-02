// /src/app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const medicalTestsRouter = require('./routes/medicalTests');

dotenv.config();
connectDB();

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json()); // Body parser middleware
app.use('/api',       userRoutes);
app.use('/api/medical-tests', medicalTestsRouter);

// Enable CORS for all routes
app.use(cors());

// Routes
app.use('/api', userRoutes);


module.exports = app;
