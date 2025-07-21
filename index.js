const express = require("express");
const ejs = require("ejs");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
require("dotenv").config();
const mongoose = require("mongoose");
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const setupViews = require('./setupViews');

const app = express();

// Validate environment variables
if (!process.env.MONGO_URI || !process.env.SECRET) {
  console.error("Error: Missing required environment variables.");
  process.exit(1);
}

// Static file serving
app.use(express.static("public"));
app.use('/images', express.static('images'));
app.use('/lib', express.static('lib'));

// View engine setup
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.once('open', async () => {
  console.log('MongoDB connected successfully');
  try {
    await setupViews();
    console.log('Views setup completed.');
  } catch (error) {
    console.error('Failed to set up views:', error);
    process.exit(1);
  }
});

// Session setup
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: "sessions",
  ttl: 14 * 24 * 60 * 60,
});

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 10,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Passport setup
const configurePassport = require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// Flash messages and locals
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.user = req.user || null;
  next();
});

// Debug middleware
app.use((req, res, next) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/", indexRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(
    `Server is listening on port ${port} at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
  );
});