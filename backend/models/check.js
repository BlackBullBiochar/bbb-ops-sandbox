const mongoose = require('mongoose');

const checkSchema = new mongoose.Schema({
  stockSymbol: String,
  checkDate: Date,
  notes: String
});

module.exports = mongoose.model('Check', checkSchema);
