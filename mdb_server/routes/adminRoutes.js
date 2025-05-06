// 📁 mdb_server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ time: -1 }).limit(100);
    res.render('adminReports', { reports });
  } catch (err) {
    console.error('Error loading reports:', err.message);
    res.status(500).send('Error loading reports');
  }
});

module.exports = router;
