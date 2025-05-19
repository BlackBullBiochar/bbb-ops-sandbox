const mongoose = require('mongoose');

// Define the schema for charcodes
const charcodesSchema = new mongoose.Schema({
  filename: String,  // File name
  filetype: String,  // File type (CSV, JSON, etc.)
  uploadDate: { type: Date, default: Date.now },
  data: mongoose.Schema.Types.Mixed,  // To store parsed data
});

module.exports = mongoose.model('Charcodes', charcodesSchema);
