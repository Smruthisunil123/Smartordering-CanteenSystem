const { genPassword } = require('../config/passwordUtils');
const { User } = require("../config/dbSchema");

// CONTROLLERS
module.exports = {
  // HOME PAGE
  homePageGetReq: (req, res) => {
    res.render("home");
  },

  // SIGNUP PAGE
  signUpGetReq: (req, res) => {
    res.render("signup");
  },

  // POST: Handle signup form submission
  signUpPostReq: async (req, res) => {
    try {
      const { username, password, firstname, lastname, phone } = req.body;
      const email = username; // Form uses email as username

      // Check if user already exists (by username or email)
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.render('signup', { error: "Username or email already exists" });
      }

      // Generate salt and hash for the password
      const saltHash = genPassword(password);
      const salt = saltHash.salt;
      const hash = saltHash.hash;

      // Create new user
      const newUser = new User({
        username,
        email,
        hash,
        salt,
        admin: false,
        firstname,
        lastname,
        phone
      });

      // Save to MongoDB
      await newUser.save();
      res.redirect("/login");
    } catch (error) {
      console.error("Error during signup:", error);
      res.render('signup', { error: "Server error during signup" });
    }
  },

  // LOGIN PAGE
  loginGetReq: (req, res) => {
    res.render("login");
  },

  // LOGIN POST REQ (Handled by Passport)
  loginPostReq: (req, res) => {
    // No need to implement, Passport handles this
  },

  // LOGOUT
  logOut: (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  },

  // GET PROFILE
  getProfile: async (req, res) => {
    try {
      // Only accessible if authenticated (via isAuth middleware)
      const username = req.user.username; // Updated to use username field
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.render("profile", { user });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).send("Server error");
    }
  },

  // POST: Update profile information
  updateProfile: async (req, res) => {
    try {
      const { username } = req.params;
      const { firstname, lastname, phone } = req.body;

      const updatedUser = await User.findOneAndUpdate(
        { username },
        { firstname, lastname, phone },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.redirect('/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).send("Server error");
    }
  }
};