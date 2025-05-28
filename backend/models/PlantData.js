const mongoose = require("mongoose");

const plantDataSchema = new mongoose.Schema({
  filename:    { type: String },
  site:        { type: String, required: true }, // "JNR" or "ARA"
  filetype:    { type: String, enum: ["csv", "json"], required: true },
  uploadDate:  { type: Date, default: Date.now },
  data:        [mongoose.Schema.Types.Mixed],
});

const PlantData = mongoose.model("PlantData", plantDataSchema);
module.exports = PlantData;