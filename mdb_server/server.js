// 📁 server.js
const express = require('express');
const connectDB = require('./config/database');
const reportRoutes = require('./routes/reports.route');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/reports', reportRoutes);

// Admin Dashboard API (React will consume this)
app.use('/admin', adminRoutes);

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
