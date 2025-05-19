const mongoose = require('mongoose');

const uploadDataSchema = new mongoose.Schema({
  filename: String,
  filetype: String,               // 'csv' or 'json'
  uploadDate: { type: Date, default: Date.now },
  data: mongoose.Schema.Types.Mixed, // will hold an array of row‐objects
});

module.exports = mongoose.model('UploadData', uploadDataSchema);