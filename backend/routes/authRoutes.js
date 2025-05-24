const express = require("express");
const authController = require("../controllers/authController");
const { verifyToken }  = require("../middleware/auth");

const authRoutes = express.Router();

authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", verifyToken, authController.refreshSession);
authRoutes.post("/password-reset/email", authController.passwordResetEmail);
authRoutes.post("/password-reset/check", authController.passwordResetCheckValid);
authRoutes.post("/password-reset", authController.passwordReset);
authRoutes.post("/referral/validate", authController.validateReferral);

module.exports = authRoutes;
