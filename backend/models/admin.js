// models/admin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name:  { type: String },
  email:      { type: String, required: true, unique: true, index: true },
  password:   { type: String, required: false },
  privileges: { type: String, default: "standard" },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

// 🔒 Hash password on create or change
adminSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;