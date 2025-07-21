// generatePassword.js
const { genPassword } = require("./config/passwordUtils");

const password = "test123"; // Replace with the desired password
const { salt, hash } = genPassword(password);

console.log("Salt:", salt);
console.log("Hash:", hash);