const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "cbms-dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const JWT_REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || "7d";

function signToken(payload, remember = false) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: remember ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
