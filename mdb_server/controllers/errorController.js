const ErrorReport = require('../models/ErrorReport');

const submitReport = async (req, res) => {
  try {
    const report = new ErrorReport(req.body);
    await report.save();
    res.status(201).json({ success: true, message: 'Report saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save report', error });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await ErrorReport.find().sort({ timestamp: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

module.exports = {
  submitReport,
  getReports
};
