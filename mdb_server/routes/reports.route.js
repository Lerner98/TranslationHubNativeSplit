const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// POST /api/reports - Save error report
router.post('/', async (req, res) => {
  try {
    const { message, stack, time } = req.body;

    if (!message || !stack) {
      return res.status(400).json({ error: 'Message and stack are required' });
    }

    const newReport = new Report({ message, stack, time });
    await newReport.save();

    res.status(201).json({ message: 'Report saved successfully' });
  } catch (error) {
    console.error('❌ Failed to save report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports - Get all reports (admin use)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ time: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error('❌ Failed to fetch reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
