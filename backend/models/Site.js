const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema({
  category: { type: String, default: 'Pyrolysis' },
  name: { type: String, unique: true },
  full_name: { type: String },
  inventory: {
    weekly_production: [{ date: Date, amount: Number }],
    est_weekly_production: [{ date: Date, amount: Number }],
    bags_delivered: [{ date: Date, amount: Number }],
    current_stock: [{ date: Date, amount: Number }],
    forecasted_stock: [{ date: Date, amount: Number }],
  },
  max_stock: { type: Number, default: 0 },
  address: {
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address_line_1: { type: String, default: "" },
    address_line_2: { type: String, default: "" },
    business_name: { type: String, default: "" },
    city: { type: String, default: "" },
    zip: { type: String, default: "" },
    county: { type: String, default: "" },
  },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

const Site = mongoose.model("Site", siteSchema);

module.exports = Site;