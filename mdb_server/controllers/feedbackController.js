// controllers/feedbackController.js
const { saveReport, getAllReports } = require('../services/feedbackService');

const submitFeedback = async (req, res) => {
  const { message, errorInfo, screen, deviceInfo } = req.body;

  if (!message || !errorInfo) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const result = await saveReport({ message, errorInfo, screen, deviceInfo });
  if (result.success) {
    return res.status(201).json({ success: true, message: result.message });
  } else {
    return res.status(500).json({ success: false, message: result.message });
  }
};

const fetchAllReports = async (req, res) => {
  const reports = await getAllReports();
  res.status(200).json(reports);
};

module.exports = {
  submitFeedback,
  fetchAllReports
};
