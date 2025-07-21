// models/user.js
const mongoose = require("mongoose");

// Define the schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return /^[A-Za-z\s]+$/.test(value);
      },
      message: "First name must contain only letters and spaces.",
    },
  },
  lastname: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return /^[A-Za-z\s]+$/.test(value);
      },
      message: "Last name must contain only letters and spaces.",
    },
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return /^\d{10}$/.test(value); // Must be exactly 10 digits
      },
      message: "Phone number must be exactly 10 digits and contain only numbers.",
    },
  },
  isAdmin: { type: Boolean, default: false },
});

// Prevent model overwrite by checking if the model already exists
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;