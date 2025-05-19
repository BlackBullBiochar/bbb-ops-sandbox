const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: String,
  name: String,
  price: Number,
  quantity: Number,
  lastUpdated: Date
});

module.exports = mongoose.model('Stock', stockSchema);