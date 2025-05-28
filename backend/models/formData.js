// models/formData.js
const mongoose = require('mongoose');

const formDataSchema = new mongoose.Schema({
  filename: String,
  filetype: String,               // e.g. 'form'
  uploadDate: { type: Date, default: Date.now },
  data: mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model('FormData', formDataSchema);