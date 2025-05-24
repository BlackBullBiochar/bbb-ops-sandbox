const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env")
});

const bcrypt = require("bcryptjs");
const Admin = require("./models/admin");
const User = require("./models/users.js");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // create a normal user
  const user = new User({
    first_name: "Test",
    last_name: "User",
    email: "user@example.com",
    password: "SmashBros123",
    referral_code: "REF123",
    referral_expiry: new Date(Date.now() + 7*24*3600*1000)
  });
  await user.save();
  console.log("Created user:", user.email);

  // create an admin
  const admin = new Admin({
    first_name: "Testes",
    last_name: "Admin",
    email: "admin@example.com",
    password: "SmashBros123",
    privileges: "super"
  });
  await admin.save();
  console.log("Created admin:", admin.email);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
