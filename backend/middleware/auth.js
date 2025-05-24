// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid auth header format" });
  }

  const token = parts[1];
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.tokenData = decoded;   // <-- id and isAdmin live here
    next();
  });
}

module.exports = { verifyToken };
