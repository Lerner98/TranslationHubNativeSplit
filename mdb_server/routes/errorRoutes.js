const express = require('express');
const router = express.Router();
const { submitReport, getReports } = require('../controllers/errorController');

// POST new report
router.post('/report', submitReport);

// GET all reports (admin usage)
router.get('/reports', getReports);

module.exports = router;
