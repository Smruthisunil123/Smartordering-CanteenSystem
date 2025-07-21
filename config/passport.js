// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const { User } = require("./dbSchema");
const { validPassword } = require("./passwordUtils");

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      console.log("Attempting to authenticate user:", email);
      User.findOne({ username: email })
        .then((user) => {
          if (!user) {
            console.log("User not found:", email);
            return done(null, false, { message: "Invalid username or password" });
          }

          console.log("User found:", user.username);
          const isValid = validPassword(password, user.hash, user.salt);
          console.log("Password valid:", isValid);

          if (isValid) {
            console.log("Authentication successful for:", user.username);
            return done(null, user);
          } else {
            console.log("Password incorrect for:", user.username);
            return done(null, false, { message: "Invalid username or password" });
          }
        })
        .catch((err) => {
          console.error("Error during authentication:", err);
          done(err);
        });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

 passport.deserializeUser((id, done) => {
  console.log("Deserializing user with ID:", id);
  User.findById(id)
    .then((user) => {
      if (!user) {
        console.log("User not found during deserialization:", id);
        return done(null, false); // Fail deserialization gracefully
      }
      console.log("User deserialized:", user.username);
      done(null, user);
    })
    .catch((err) => {
      console.error("Error during deserialization:", err);
      done(err);
    });
});
};