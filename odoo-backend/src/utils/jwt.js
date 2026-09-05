const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign JWT for authenticated user
 * @param {Object} user - User object with id, role, and optional employeeId
 * @returns {string} JWT token
 */
function signToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    employeeId: user.employeeId || null,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '8h',
  });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
