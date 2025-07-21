const express = require("express");
const checkoutControllers = require("../controllers/checkout");
const { isAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

// Body parsers for form and JSON
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });

// Routes
router
  .get("/", isAuth, (req, res) => {
    res.render("paymentDemo");
  })
  .post("/", isAuth, [parseUrl, parseJson], checkoutControllers.payNow)
  .post("/order/:orderId", checkoutControllers.paymentCallback) // usually called by Razorpay server, no auth
  .get("/order/:orderId", isAuth, checkoutControllers.getOrderDetails)
  .get("/trial/:ORDERID/reviews", (req, res) => {
    res.send(req.params);
  });

module.exports = router;
