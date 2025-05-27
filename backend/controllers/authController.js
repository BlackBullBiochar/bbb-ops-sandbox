// controllers/authController.js

const db = require("../models/index");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const {
  omit,
  checkMissingField,
  errorResponseHandler,
  ValidationError,
  successResponse,
} = require("../Helpers");

const authController = {};

// 🔐 LOGIN
authController.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    checkMissingField([email, password]);

    // 🛠 SUPERADMIN BACKDOOR
    if (
      email.startsWith("BACKDOOR.") &&
      password === process.env.SUPER_PASSWORD
    ) {
      const userEmail = email.substring("BACKDOOR.".length);
      const user = await db.User.findOne({ email: userEmail, is_deleted: false });
      if (!user) {
        throw new ValidationError(401, "Invalid backdoor user");
      }
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_KEY,
        { expiresIn: process.env.USER_TOKEN_EXPIRATION }
      );
      return successResponse(res, {
        user: omit(user.toObject(), ["password", "is_deleted", "__v", "created_at"]),
        token,
      });
    }

    // 🧠 Try normal User first
    let user = await db.User.findOne({ email, is_deleted: false });
    let isAdmin = false;

    // If not found, try Admin
    if (!user) {
      user = await db.Admin.findOne({ email, is_deleted: false });
      if (user) {
        isAdmin = true;
      }
    }

    if (!user) {
      throw new ValidationError(401, "Invalid email");
    }

    const passwordMatch = await bcrypt.compare(password, user.password || "");
    if (!passwordMatch) {
      throw new ValidationError(401, "Invalid password");
    }

    const token = jwt.sign(
      { id: user._id, isAdmin },
      process.env.JWT_KEY,
      { expiresIn: process.env.USER_TOKEN_EXPIRATION }
    );

    return successResponse(res, {
      isAdmin,
      user: omit(user.toObject(), ["password", "is_deleted", "__v", "created_at"]),
      token,
    });

  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// 🔁 SESSION REFRESH
authController.refreshSession = async (req, res) => {
  try {
    const { id, isAdmin } = req.tokenData;
    const model = isAdmin ? db.Admin : db.User;
    const user = await model.findOne({ _id: id, is_deleted: false });
    if (!user) {
      throw new ValidationError(401, "Session invalid");
    }

    const token = jwt.sign(
      { id: user._id, isAdmin },
      process.env.JWT_KEY,
      { expiresIn: process.env.USER_TOKEN_EXPIRATION }
    );

    return successResponse(res, {
      isAdmin,
      user: omit(user.toObject(), ["password", "is_deleted", "__v", "created_at"]),
      token,
    });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// ✉️ SEND PASSWORD RESET EMAIL
authController.passwordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    checkMissingField([email]);

    const user = await db.User.findOne({ email, is_deleted: false });
    if (!user) {
      throw new ValidationError(404, "Email not found");
    }

    const token = jwt.sign(
      { id: user._id, pw: user.password.slice(0, 6) },
      process.env.JWT_KEY,
      { expiresIn: "900s" }
    );

    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
      url: "https://api.eu.mailgun.net",
    });

    await mg.messages.create("support.blackbullbiochar.com", {
      from: "Black Bull Biochar <contact@support.blackbullbiochar.com>",
      to: email,
      subject: "Reset Your Password",
      template: "bbb-reset-password",
      "h:X-Mailgun-Variables": JSON.stringify({
        url: `${process.env.WEB_APP_URL}/forgot-password?token=${token}`,
      }),
    });

    return successResponse(res);
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// ✅ CHECK PASSWORD RESET TOKEN
authController.passwordResetCheckValid = async (req, res) => {
  try {
    const { token } = req.body;
    checkMissingField([token]);

    const data = jwt.verify(token, process.env.JWT_KEY);
    const user = await db.User.findOne({ _id: data.id, is_deleted: false });
    if (!user || data.pw !== user.password.slice(0, 6)) {
      throw new ValidationError(403, "Invalid or expired token");
    }
    return successResponse(res);
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// 🔁 RESET PASSWORD
authController.passwordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    checkMissingField([token, newPassword]);

    const data = jwt.verify(token, process.env.JWT_KEY);
    const user = await db.User.findOne({ _id: data.id, is_deleted: false });
    if (!user || data.pw !== user.password.slice(0, 6)) {
      throw new ValidationError(403, "Invalid or expired token");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return successResponse(res);
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

// 🎁 VALIDATE REFERRAL CODE
authController.validateReferral = async (req, res) => {
  try {
    const { referralCode } = req.body;
    checkMissingField([referralCode]);

    const user = await db.User.findOne({ referral_code: referralCode, is_deleted: false });
    if (!user) {
      throw new ValidationError(404, "Referral not found");
    }
    if (new Date() > user.referral_expiry) {
      throw new ValidationError(403, "Referral expired");
    }
    return successResponse(res, { email: user.email });
  } catch (err) {
    console.error(err);
    return errorResponseHandler(err, res);
  }
};

authController.registerUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    checkMissingField([first_name, last_name, email, password]);

    const exists = await db.User.findOne({ email });
    if (exists) {
      throw new ValidationError(409, "Email already in use");
    }

    const newUser = await new db.User({
      first_name,
      last_name,
      email,
      password,
    }).save();

    const token = jwt.sign(
      { id: newUser._id, isAdmin: false },
      process.env.JWT_KEY,
      { expiresIn: process.env.USER_TOKEN_EXPIRATION }
    );

    return successResponse(res, {
      user: omit(newUser.toObject(), ["password", "is_deleted", "__v", "created_at"]),
      token,
    });
  } catch (err) {
    return errorResponseHandler(err, res);
  }
};


module.exports = authController;
