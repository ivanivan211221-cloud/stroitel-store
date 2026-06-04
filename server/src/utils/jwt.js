const jwt = require("jsonwebtoken");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "super-secret-key", { expiresIn: "7d" });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET || "super-secret-key");

module.exports = { signToken, verifyToken };
