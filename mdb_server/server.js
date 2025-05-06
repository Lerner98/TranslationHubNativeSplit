const express = require('express');
const mongoose = require('mongoose');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
require('dotenv').config();

// Connect to MongoDB using the MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to get routes from an Express app
const getRoutes = (app) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.handle && middleware.handle.stack) {
      const prefix = middleware.path || '';
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push(`${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${prefix}${handler.route.path}`);
        }
      });
    }
  });
  return routes;
};

// Admin Microservice (Port 3001)
const adminApp = express();
adminApp.use(express.json());
adminApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
// Test route directly on adminApp
adminApp.post('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});
adminApp.use('/api/admins', adminRoutes);
adminApp.listen(3001, () => {
  console.log('Admin Microservice running on port 3001');
  console.log('Admin routes:', getRoutes(adminApp));
});

// Report Microservice (Port 3002)
const reportApp = express();
reportApp.use(express.json());
reportApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
reportApp.use('/api/reports', reportRoutes);
reportApp.listen(3002, () => {
  console.log('Report Microservice running on port 3002');
  console.log('Report routes:', getRoutes(reportApp));
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down microservices...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});