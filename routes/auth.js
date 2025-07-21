// routes/auth.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user"); // Import the exported model

// GET /login - Render login page
router.get("/login", (req, res) => {
  res.render("login", { title: "Login - UdupiTHINDI" });
});

// POST /login - Handle login with Passport.js
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info.message || "Invalid username or password");
      return res.render("login", { title: "Login - UdupiTHINDI" });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/items");
    });
  })(req, res, next);
});

// GET /signup - Render signup page
router.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up - UdupiTHINDI" });
});

// POST /signup - Handle signup
router.post("/signup", async (req, res) => {
  const { username, email, password, firstname, lastname, phone } = req.body;

  // Validate firstname and lastname (only letters and spaces allowed)
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(firstname)) {
    req.flash("error", "First name must contain only letters and spaces.");
    return res.render("signup", { title: "Sign Up - UdupiTHINDI" });
  }
  if (!nameRegex.test(lastname)) {
    req.flash("error", "Last name must contain only letters and spaces.");
    return res.render("signup", { title: "Sign Up - UdupiTHINDI" });
  }

  // Validate phone (only numbers, exactly 10 digits)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) {
    req.flash("error", "Phone number must be exactly 10 digits and contain only numbers.");
    return res.render("signup", { title: "Sign Up - UdupiTHINDI" });
  }

  try {
    // Check if username or email already exists
    let user = await User.findOne({ email });
    if (user) {
      req.flash("error", "Email already exists.");
      return res.render("signup", { title: "Sign Up - UdupiTHINDI" });
    }

    user = await User.findOne({ username });
    if (user) {
      req.flash("error", "Username already exists.");
      return res.render("signup", { title: "Sign Up - UdupiTHINDI" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hash,
      firstname,
      lastname,
      phone,
      isAdmin: false,
    });

    await newUser.save();
    req.flash("success", "Registration successful! Please log in.");
    res.redirect("/login");
  } catch (error) {
    console.error("Error during signup:", error);
    if (error.name === "ValidationError") {
      req.flash("error", error.message);
    } else {
      req.flash("error", "An error occurred during registration. Please try again.");
    }
    res.render("signup", { title: "Sign Up - UdupiTHINDI" });
  }
});

// GET /logout - Handle logout with Passport.js
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.render("login", { title: "Login - UdupiTHINDI" });
    });
  });
});

module.exports = router;