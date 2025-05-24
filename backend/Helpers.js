// helpers.js
class ValidationError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const checkMissingField = (fields) => {
  if (fields.some((f) => !f)) {
    throw new ValidationError(400, "Missing required fields");
  }
};

const checkUnique = (arr) => {
  if (arr.length !== 1) {
    throw new ValidationError(401, "Invalid user or multiple matches");
  }
};

const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

const successResponse = (res, data = {}) =>
  res.json({ success: true, ...data });

const errorResponseHandler = (err, res) => {
  if (err instanceof ValidationError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: "Server Error" });
};

module.exports = {
  ValidationError,
  checkMissingField,
  checkUnique,
  omit,
  successResponse,
  errorResponseHandler,
};
