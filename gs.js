const crypto = require('crypto');

// Generate a random 32-byte secret and convert it to a hexadecimal string
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated Secret:', secret);
