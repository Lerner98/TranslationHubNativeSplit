const express = require('express');
const mongoose = require('mongoose');
const reportRoutes = require('./routes/reportRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(`${process.env.MONGO_URI}?dbName=translationhub-report`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB (Report Microservice)'))
  .catch((err) => {
    console.error('MongoDB connection error (Report Microservice):', err);
    process.exit(1);
  });

app.use('/api/reports', reportRoutes);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Report Service running on port ${PORT}`);
});