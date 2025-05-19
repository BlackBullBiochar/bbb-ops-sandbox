const mongoose = require('mongoose');

const EbcEntrySchema = new mongoose.Schema({
  'EBC Date': String,
  'EBC Time': String,
  'EBC Cert Status': String,
  'EBC Status Reason': String
}, { _id: false });

const EbcStatusSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  data: [EbcEntrySchema]
});

module.exports = mongoose.model('EbcStatus', EbcStatusSchema);
