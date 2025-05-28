const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  first_name:    { type: String },
  last_name:     { type: String },
  email:         { type: String, required: true, unique: true, index: true },
  password:      { type: String, required: false },
  referral_code: { type: String },
  referral_expiry:{ type: Date },
  is_deleted:    { type: Boolean, default: false },
  created_at:    { type: Date, default: Date.now },
});

// 🔒 Hash password on create or change
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;