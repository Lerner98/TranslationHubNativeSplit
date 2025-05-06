const express = require('express');
const mongoose = require('mongoose');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(`${process.env.MONGO_URI}?dbName=translationhub-admin`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB (Admin Microservice)'))
  .catch((err) => {
    console.error('MongoDB connection error (Admin Microservice):', err);
    process.exit(1);
  });

app.use('/api/admins', adminRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});