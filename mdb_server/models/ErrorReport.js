const mongoose = require('mongoose');

const ErrorReportSchema = new mongoose.Schema({
  message: { type: String, required: true },
  stack: { type: String },
  user: { type: String },
  timestamp: { type: Date, default: Date.now },
  platform: { type: String }, // iOS, Android, Web, etc.
  appVersion: { type: String },
  extra: { type: mongoose.Schema.Types.Mixed } // שדות גמישים
});

module.exports = mongoose.model('ErrorReport', ErrorReportSchema);
