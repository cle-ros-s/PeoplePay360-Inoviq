const bcrypt = require('bcryptjs');

/**
 * Hashes a plaintext password using bcrypt
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Password hash
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password with stored bcrypt hash
 * @param {string} password - Plaintext password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} True if match
 */
async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
