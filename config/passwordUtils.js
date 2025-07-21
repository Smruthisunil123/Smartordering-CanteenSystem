const crypto = require('crypto');

// Generate salt and hash for a password
function genPassword(password) {
  // Generate a 32-byte (256-bit) salt
  const salt = crypto.randomBytes(32).toString('hex');
  // Use PBKDF2 to derive a hash from the password, salt, and iterations
  const genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

  return {
    salt: salt,
    hash: genHash
  };
}

// Verify a password against the stored hash and salt
function validPassword(password, hash, salt) {
  // Recompute the hash using the provided password and stored salt
  const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  // Compare the computed hash with the stored hash
  return hash === hashVerify;
}

module.exports = {
  validPassword,
  genPassword
};