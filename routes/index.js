const mongoose = require('mongoose');
const router = require('express').Router();
const { Item, User } = require("../config/dbSchema");

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

// Middleware to ensure user is an admin
const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  req.flash('error', 'Access denied. Admins only.');
  res.redirect('/');
};

// GET / - Render home page
router.get('/', (req, res) => {
  res.render('home', { title: 'UdupiThindi', user: req.user, messages: req.flash() });
});

// GET /items - Render items page
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find().lean();
    const itemsWithStringId = items.map(item => ({
      ...item,
      _id: item._id.toString()
    }));
    console.log("Items fetched for /items:", itemsWithStringId);
    res.render('items', {
      items: itemsWithStringId,
      user: req.user,
      cart: req.session.cart || [],
      title: 'Menu Items',
      messages: req.flash()
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    req.flash("error", "Failed to fetch items.");
    res.redirect("/");
  }
});

// POST /cart/add - Add item to cart (updated from user snippet)
router.post("/cart/add", ensureAuthenticated, async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { itemId } = req.body;
    console.log("Received itemId:", itemId);

    if (!itemId) {
      console.log("No itemId received");
      return res.status(400).json({ success: false, message: "No itemId provided" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("Invalid itemId format:", itemId);
      return res.status(400).json({ success: false, message: "Invalid itemId format" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      console.log(`Item with ID ${itemId} not found in database`);
      return res.status(404).json({ success: false, message: `Item with ID ${itemId} not found` });
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }
    const cartItem = req.session.cart.find(i => i.itemId === itemId);
    if (cartItem) {
      cartItem.quantity += 1;
    } else {
      req.session.cart.push({
        itemId: itemId,
        name: item.name,
        price: item.price,
        quantity: 1
      });
    }

    await req.session.save();
    res.status(200).json({ success: true, message: "Item added to cart", cart: req.session.cart });
  } catch (error) {
    console.error("Error in /cart/add:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /cart/update - Update cart item quantity (updated from user snippet)
router.post("/cart/update", ensureAuthenticated, async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { itemId, quantity } = req.body;
    console.log("Updating itemId:", itemId, "to quantity:", quantity);

    if (!itemId) {
      console.log("No itemId received");
      return res.status(400).json({ success: false, message: "No itemId provided" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("Invalid itemId format:", itemId);
      return res.status(400).json({ success: false, message: "Invalid itemId format" });
    }

    if (typeof quantity !== "number" || quantity < 0) {
      console.log("Invalid quantity:", quantity);
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    if (!req.session.cart) {
      req.session.cart = [];
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const cartItem = req.session.cart.find(i => i.itemId === itemId);
    if (!cartItem) {
      console.log(`Item with ID ${itemId} not found in cart`);
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    if (quantity === 0) {
      req.session.cart = req.session.cart.filter(i => i.itemId !== itemId);
    } else {
      cartItem.quantity = quantity;
    }

    await req.session.save();
    res.status(200).json({ success: true, message: "Cart updated", cart: req.session.cart });
  } catch (error) {
    console.error("Error in /cart/update:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /cart/remove - Remove item from cart (updated from user snippet)
router.post("/cart/remove", ensureAuthenticated, async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { itemId } = req.body;
    console.log("Removing itemId:", itemId);

    if (!itemId) {
      console.log("No itemId received");
      return res.status(400).json({ success: false, message: "No itemId provided" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("Invalid itemId format:", itemId);
      return res.status(400).json({ success: false, message: "Invalid itemId format" });
    }

    if (!req.session.cart) {
      req.session.cart = [];
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const cartItemIndex = req.session.cart.findIndex(i => i.itemId === itemId);
    if (cartItemIndex === -1) {
      console.log(`Item with ID ${itemId} not found in cart`);
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    req.session.cart.splice(cartItemIndex, 1);
    await req.session.save();
    res.status(200).json({ success: true, message: "Item removed from cart", cart: req.session.cart });
  } catch (error) {
    console.error("Error in /cart/remove:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /checkout - Handle checkout (updated from user snippet)
router.post("/checkout", ensureAuthenticated, async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { StringData } = req.body;
    if (!StringData) {
      console.log("No cart data received");
      return res.status(400).json({ success: false, message: "No cart data provided" });
    }

    const { arr } = JSON.parse(StringData);
    if (!arr || arr.length === 0) {
      console.log("Cart is empty");
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    for (const item of arr) {
      const itemId = item.id;
      console.log("Processing itemId:", itemId);

      if (!itemId) {
        console.log("Invalid itemId:", itemId);
        return res.status(400).json({ success: false, message: "Invalid ID cannot be added to cart" });
      }

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        console.log("Invalid itemId format:", itemId);
        return res.status(400).json({ success: false, message: "Invalid itemId format" });
      }

      const itemDoc = await Item.findById(itemId);
      if (!itemDoc) {
        console.log(`Item with ID ${itemId} not found in database`);
        return res.status(404).json({ success: false, message: `Item with ID ${itemId} not found` });
      }
    }

    // Update session cart to match the submitted cart
    req.session.cart = arr.map(item => ({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    await req.session.save();

    res.redirect("/payment");
  } catch (error) {
    console.error("Error in /checkout:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /profile - Render user profile page
router.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { user: req.user, title: "Profile - UdupiTHINDI", messages: req.flash() });
});

// POST /profile/:username - Update user profile
router.post("/profile/:username", ensureAuthenticated, async (req, res) => {
  try {
    const { firstname, lastname, phone } = req.body;
    const user = await User.findOne({ username: req.params.username });

    if (!user || user.username !== req.user.username) {
      req.flash("error", "Unauthorized to update this profile.");
      return res.redirect("/profile");
    }

    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.phone = phone || user.phone;

    await user.save();
    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    req.flash("error", "Failed to update profile.");
    res.redirect("/profile");
  }
});

// GET /admin/add-item - Render form to add item
router.get("/admin/add-item", ensureAdmin, (req, res) => {
  res.render("add-item", { title: "Add Item - UdupiTHINDI", messages: req.flash() });
});

// POST /admin/add-item - Handle adding item
router.post("/admin/add-item", ensureAdmin, async (req, res) => {
  try {
    const { name, price, description, category, available } = req.body;
    const newItem = new Item({
      name,
      price: parseFloat(price),
      description,
      category,
      available: available === "on",
    });

    await newItem.save();
    req.flash("success", "Item added successfully!");
    res.redirect("/items");
  } catch (error) {
    console.error("Error adding item:", error);
    req.flash("error", "Failed to add item.");
    res.render("add-item", { title: "Add Item - UdupiTHINDI", messages: req.flash() });
  }
});

// GET /client - Order history (using userOrdersView from 03:46 PM IST)
router.get("/client", ensureAuthenticated, async (req, res) => {
  try {
    const history = await mongoose.connection.db.collection("userOrdersView")
      .find({ userId: req.user._id.toString() })
      .toArray();

    res.render("client", { history, user: req.user, title: "Order History - UdupiTHINDI", messages: req.flash() });
  } catch (error) {
    console.error("Error fetching order history:", error);
    req.flash("error", "Failed to load order history.");
    res.redirect("/");
  }
});

// GET /cart - View current cart
router.get("/cart", ensureAuthenticated, (req, res) => {
  console.log("Cart in /cart route:", req.session.cart);
  res.render("cart", {
    cart: req.session.cart || [],
    title: "Your Cart",
    user: req.user,
    messages: req.flash()
  });
});

// GET /payment - Render payment gateway page
router.get("/payment", ensureAuthenticated, (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    req.flash("error", "Your cart is empty.");
    return res.redirect("/cart");
  }

  const total = req.session.cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  res.render("payment", {
    cart: req.session.cart,
    total: total,
    title: "Payment Gateway - UdupiTHINDI",
    user: req.user,
    messages: req.flash()
  });
});

// GET /success - Render payment success page (from user snippet)
router.get("/success", ensureAuthenticated, (req, res) => {
  res.render("paymentSuccess", { user: req.user, title: "Payment Successful - UdupiTHINDI", messages: req.flash() });
});

// POST /payment/confirm - Handle payment confirmation
router.post("/payment/confirm", ensureAuthenticated, async (req, res) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0) {
      req.flash("error", "Your cart is empty.");
      return res.redirect("/cart");
    }

    const { paymentMethod } = req.body;
    if (!paymentMethod) {
      req.flash("error", "Please select a payment method.");
      return res.redirect("/payment");
    }

    let paymentDetails = { paymentMethod };

    if (paymentMethod === "Card") {
      const { cardNumber, expiry, cvv } = req.body;
      if (!cardNumber || !expiry || !cvv) {
        req.flash("error", "Please provide all card details.");
        return res.redirect("/payment");
      }
      if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(cardNumber)) {
        req.flash("error", "Invalid card number.");
        return res.redirect("/payment");
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        req.flash("error", "Invalid expiry date (MM/YY).");
        return res.redirect("/payment");
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        req.flash("error", "Invalid CVV.");
        return res.redirect("/payment");
      }
      paymentDetails.cardNumber = cardNumber.slice(-4).padStart(cardNumber.length, '*');
    } else if (paymentMethod === "UPI") {
      const { upiId } = req.body;
      if (!upiId) {
        req.flash("error", "Please provide your UPI ID.");
        return res.redirect("/payment");
      }
      if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
        req.flash("error", "Invalid UPI ID (e.g., yourname@upi).");
        return res.redirect("/payment");
      }
      paymentDetails.upiId = upiId;
    } else if (paymentMethod === "NetBanking") {
      const { bank } = req.body;
      if (!bank) {
        req.flash("error", "Please select a bank.");
        return res.redirect("/payment");
      }
      paymentDetails.bank = bank;
    } else {
      req.flash("error", "Invalid payment method.");
      return res.redirect("/payment");
    }

    console.log(`Simulating ${paymentMethod} payment:`, paymentDetails);

    const total = req.session.cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const Order = mongoose.model('Order');
    const order = new Order({
      userId: req.user._id,
      items: req.session.cart,
      total: total,
      status: "Pending",
      createdAt: new Date(),
      paymentDetails: paymentDetails,
    });

    await order.save();
    req.session.cart = [];
    await req.session.save();

    req.flash("success", "Payment successful! Order placed.");
    res.redirect("/success"); // Redirect to success page instead of /client
  } catch (error) {
    console.error("Error during payment confirmation:", error);
    req.flash("error", "Payment failed. Please try again.");
    res.redirect("/payment");
  }
});

// GET /admin/audit-logs - View all audit logs (admin only)
router.get("/admin/audit-logs", ensureAdmin, async (req, res) => {
  try {
    console.log("Fetching audit logs from database...");
    const auditLogs = await mongoose.connection.db.collection("auditLogs").find().sort({ timestamp: -1 }).toArray();
    console.log(`Number of audit logs fetched: ${auditLogs.length}`);
    console.log("Audit logs:", auditLogs);
    res.render("audit-logs", {
      auditLogs,
      user: req.user,
      title: "Audit Logs - UdupiTHINDI",
      messages: req.flash()
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    req.flash("error", "Failed to load audit logs.");
    res.render("audit-logs", {
      auditLogs: [],
      user: req.user,
      title: "Audit Logs - UdupiTHINDI",
      messages: req.flash()
    });
  }
});

// GET /admin/audit-logs/filter/:operation - Filter logs by operation type (using insertAuditLogs view from 04:01 PM IST)
router.get("/admin/audit-logs/filter/:operation", ensureAdmin, async (req, res) => {
  try {
    const operation = req.params.operation.toUpperCase();
    if (!["INSERT", "UPDATE", "DELETE"].includes(operation)) {
      req.flash("error", "Invalid operation type.");
      return res.redirect("/admin/audit-logs");
    }

    let auditLogs;
    if (operation === "INSERT") {
      auditLogs = await mongoose.connection.db.collection("insertAuditLogs").find().toArray();
    } else {
      auditLogs = await mongoose.connection.db.collection("auditLogs")
        .find({ operation })
        .sort({ timestamp: -1 })
        .toArray();
    }

    res.render("audit-logs", {
      auditLogs,
      user: req.user,
      title: `Audit Logs (${operation}) - UdupiTHINDI`,
      messages: req.flash()
    });
  } catch (error) {
    console.error("Error filtering audit logs:", error);
    req.flash("error", "Failed to filter audit logs.");
    res.redirect("/admin/audit-logs");
  }
});

// POST /admin/audit-logs/clear-old - Clear logs older than a specified number of days
router.post("/admin/audit-logs/clear-old", ensureAdmin, async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await mongoose.connection.db.collection("auditLogs").deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    req.flash("success", `Cleared ${result.deletedCount} old audit logs.`);
    res.redirect("/admin/audit-logs");
  } catch (error) {
    console.error("Error clearing old audit logs:", error);
    req.flash("error", "Failed to clear old audit logs.");
    res.redirect("/admin/audit-logs");
  }
});

// POST /admin/audit-logs/date-range - Filter logs by date range
router.post("/admin/audit-logs/date-range", ensureAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      req.flash("error", "Please provide both start and end dates.");
      return res.redirect("/admin/audit-logs");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      req.flash("error", "Invalid date range.");
      return res.redirect("/admin/audit-logs");
    }

    const auditLogs = await mongoose.connection.db.collection("auditLogs")
      .find({
        timestamp: { $gte: start, $lte: end }
      })
      .sort({ timestamp: -1 })
      .toArray();

    res.render("audit-logs", {
      auditLogs,
      user: req.user,
      title: `Audit Logs (${startDate} to ${endDate}) - UdupiTHINDI`,
      messages: req.flash()
    });
  } catch (error) {
    console.error("Error filtering audit logs by date range:", error);
    req.flash("error", "Failed to filter audit logs by date range.");
    res.redirect("/admin/audit-logs");
  }
});

// POST /admin/audit-logs/search-user - Search logs by userId
router.post("/admin/audit-logs/search-user", ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      req.flash("error", "Please provide a user ID.");
      return res.redirect("/admin/audit-logs");
    }

    const auditLogs = await mongoose.connection.db.collection("auditLogs")
      .find({ "document.userId": userId })
      .sort({ timestamp: -1 })
      .toArray();

    res.render("audit-logs", {
      auditLogs,
      user: req.user,
      title: `Audit Logs for User ${userId} - UdupiTHINDI`,
      messages: req.flash()
    });
  } catch (error) {
    console.error("Error searching audit logs by user:", error);
    req.flash("error", "Failed to search audit logs by user.");
    res.redirect("/admin/audit-logs");
  }
});

// GET /admin/audit-logs/export - Export all audit logs as JSON
router.get("/admin/audit-logs/export", ensureAdmin, async (req, res) => {
  try {
    const auditLogs = await mongoose.connection.db.collection("auditLogs").find().sort({ timestamp: -1 }).toArray();
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(auditLogs, null, 2));
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    req.flash("error", "Failed to export audit logs.");
    res.redirect("/admin/audit-logs");
  }
});

// POST /admin/audit-logs/delete/:id - Delete a specific audit log by ID
router.post("/admin/audit-logs/delete/:id", ensureAdmin, async (req, res) => {
  try {
    const logId = req.params.id;
    const result = await mongoose.connection.db.collection("auditLogs").deleteOne({ _id: new mongoose.Types.ObjectId(logId) });

    if (result.deletedCount === 0) {
      req.flash("error", "Audit log not found.");
    } else {
      req.flash("success", "Audit log deleted successfully.");
    }
    res.redirect("/admin/audit-logs");
  } catch (error) {
    console.error("Error deleting audit log:", error);
    req.flash("error", "Failed to delete audit log.");
    res.redirect("/admin/audit-logs");
  }
});

module.exports = router;