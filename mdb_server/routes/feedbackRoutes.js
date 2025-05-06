// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const { submitFeedback, fetchAllReports } = require('../controllers/feedbackController');

// POST - Submit a new feedback/error report
router.post('/submit', submitFeedback);

// GET - Admin fetches all submitted reports
router.get('/all', fetchAllReports);

module.exports = router;
