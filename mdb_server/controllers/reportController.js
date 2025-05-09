const Report = require('../models/Report');
const fs = require('fs').promises;
const path = require('path');

const REPORTS_JSON_PATH = path.join(__dirname, '../logs/reports.json');

const readReportsFromJson = async () => {
  try {
    const data = await fs.readFile(REPORTS_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading reports.json:', error.message);
    return [];
  }
};

const writeReportsToJson = async (reports) => {
  try {
    await fs.writeFile(REPORTS_JSON_PATH, JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error('Error writing to reports.json:', error.message);
    throw error;
  }
};

exports.submitReport = async (req, res) => {
  try {
    const { userId, type, message, errorStack, screen, deviceInfo, platform, appVersion, extra } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const report = new Report({ userId, type, message, errorStack, screen, deviceInfo, platform, appVersion, extra });
    await report.save();

    const reports = await readReportsFromJson();
    reports.push(report.toObject());
    await writeReportsToJson(reports);

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error in submitReport:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to submit report', error: error.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Error in getReport:', error.stack);
    res.status(500).json({ success: false, message: 'Error fetching report', error: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error('Error in getAllReports:', error.stack);
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { type, message, errorStack, screen, deviceInfo, platform, appVersion, extra } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (type) report.type = type;
    if (message) report.message = message;
    if (errorStack) report.errorStack = errorStack;
    if (screen) report.screen = screen;
    if (deviceInfo) report.deviceInfo = deviceInfo;
    if (platform) report.platform = platform;
    if (appVersion) report.appVersion = appVersion;
    if (extra) report.extra = extra;

    await report.save();

    const reports = await readReportsFromJson();
    const reportIndex = reports.findIndex(r => r._id.toString() === req.params.id);
    if (reportIndex !== -1) {
      reports[reportIndex] = report.toObject();
      await writeReportsToJson(reports);
    }

    res.status(200).json({ success: true, message: 'Report updated successfully', report });
  } catch (error) {
    console.error('Error in updateReport:', error.stack);
    res.status(500).json({ success: false, message: 'Error updating report', error: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const reports = await readReportsFromJson();
    const updatedReports = reports.filter(r => r._id.toString() !== req.params.id);
    await writeReportsToJson(updatedReports);

    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error in deleteReport:', error.stack);
    res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
};

// Statistics Endpoints
exports.getErrorsByDay = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    const reports = await Report.find({
      createdAt: { $gte: startDate },
    });

    const errorsByDay = reports.reduce((acc, report) => {
      const date = report.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({ success: true, errorsByDay });
  } catch (error) {
    console.error('Error in getErrorsByDay:', error.stack);
    res.status(500).json({ success: false, message: 'Error fetching errors by day', error: error.message });
  }
};

exports.getMostReported = async (req, res) => {
  try {
    const reports = await Report.find();
    const mostReported = await Report.aggregate([
      { $match: { message: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$message",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const result = mostReported.map(item => [item._id, item.count]);
    res.status(200).json({ success: true, mostReported: result });
  } catch (error) {
    console.error('Error in getMostReported:', error.stack);
    res.status(500).json({ success: false, message: 'Error fetching most reported keywords', error: error.message });
  }
};