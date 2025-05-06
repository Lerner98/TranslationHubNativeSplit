// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  errorStack: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
