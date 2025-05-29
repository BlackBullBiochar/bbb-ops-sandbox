// models/tempData.js
const mongoose = require('mongoose');

const tempDataSchema = new mongoose.Schema({
  site:    { type: String, required: true },   // "ara" or "jnr"
  year:    { type: Number, required: true },   // 2025
  month:   { type: Number, required: true },   // 1–12
  data:    [mongoose.Schema.Types.Mixed],      // array of row‐objects
  updated: { type: Date, default: Date.now }   // last time we appended
});

const TempData = mongoose.model("TempData", tempDataSchema);

module.exports = TempData;