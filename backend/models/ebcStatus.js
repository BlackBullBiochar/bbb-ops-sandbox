const mongoose = require('mongoose');

const EbcStatusSchema = new mongoose.Schema({
  site: { type: String, required: true, unique: true }, // 'ara' or 'jnr'
  data: [
    {
      charcodeId: String,
      'EBC Date': String,
      'EBC Time': String,
      'EBC Cert Status': String,
      'EBC Status Reason': String
    }
  ]
});

const EbcStatus = mongoose.model('EbcStatus', EbcStatusSchema);
module.exports = EbcStatus;


