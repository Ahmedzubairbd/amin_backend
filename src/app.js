const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(express.json()); // Body parser middleware


// Enable CORS for all routes
app.use(cors());

// Routes
app.use('/api', userRoutes);

module.exports = app;
