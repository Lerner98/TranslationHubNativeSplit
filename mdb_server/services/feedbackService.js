// services/feedbackService.js
const Report = require('../models/Report');

const saveReport = async (data) => {
  try {
    const report = new Report(data);
    await report.save();
    return { success: true, message: 'Report saved successfully.' };
  } catch (err) {
    console.error('Error saving report:', err.message);
    return { success: false, message: 'Failed to save report.' };
  }
};

const getAllReports = async () => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    return reports;
  } catch (err) {
    console.error('Error retrieving reports:', err.message);
    return [];
  }
};

module.exports = {
  saveReport,
  getAllReports
};
