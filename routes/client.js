const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const db = require('../config/db'); // Adjust path as needed

// Route to add an item to the cart (used by views/items.ejs)
router.post('/cart/add', async (req, res) => {
  try {
    console.log("Request body:", req.body); // Debug the entire request body
    const { itemId } = req.body;
    console.log("Received itemId:", itemId); // Debug log

    if (!itemId) {
      console.log("No itemId received");
      return res.status(400).json({ error: 'No itemId provided' });
    }

    // Validate the itemId as a MongoDB ObjectId
    if (!ObjectId.isValid(itemId)) {
      console.log("Invalid itemId format:", itemId);
      return res.status(400).json({ error: 'Invalid itemId format' });
    }

    // Check if the item exists in the database
    const itemsCollection = db.collection('items');
    const item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
    if (!item) {
      console.log(`Item with ID ${itemId} not found in database`);
      return res.status(404).json({ error: `Item with ID ${itemId} not found` });
    }

    // Add to cart (store in session)
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

    res.status(200).json({ success: true, message: 'Item added to cart', cart: req.session.cart });
  } catch (error) {
    console.error("Error in /cart/add:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to update the quantity of an item in the cart (used by views/items.ejs)
router.post('/cart/update', async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { itemId, quantity } = req.body;
    console.log("Updating itemId:", itemId, "to quantity:", quantity);

    if (!itemId) {
      console.log("No itemId received");
      return res.status(400).json({ error: 'No itemId provided' });
    }

    if (!ObjectId.isValid(itemId)) {
      console.log("Invalid itemId format:", itemId);
      return res.status(400).json({ error: 'Invalid itemId format' });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      console.log("Invalid quantity:", quantity);
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (!req.session.cart) {
      req.session.cart = [];
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItem = req.session.cart.find(i => i.itemId === itemId);
    if (!cartItem) {
      console.log(`Item with ID ${itemId} not found in cart`);
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity === 0) {
      // Remove the item if quantity is 0
      req.session.cart = req.session.cart.filter(i => i.itemId !== itemId);
    } else {
      cartItem.quantity = quantity;
    }

    res.status(200).json({ success: true, message: 'Cart updated', cart: req.session.cart });
  } catch (error) {
    console.error("Error in /cart/update:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to remove an item from the cart (used by views/items.ejs)
router.post('/cart/remove', async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { itemId } = req.body;
    console.log("Removing itemId:", itemId);

    if (!itemId) {
      console.log("No itemId received");
      return res.status(400).json({ error: 'No itemId provided' });
    }

    if (!ObjectId.isValid(itemId)) {
      console.log("Invalid itemId format:", itemId);
      return res.status(400).json({ error: 'Invalid itemId format' });
    }

    if (!req.session.cart) {
      req.session.cart = [];
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItemIndex = req.session.cart.findIndex(i => i.itemId === itemId);
    if (cartItemIndex === -1) {
      console.log(`Item with ID ${itemId} not found in cart`);
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    req.session.cart.splice(cartItemIndex, 1);
    res.status(200).json({ success: true, message: 'Item removed from cart', cart: req.session.cart });
  } catch (error) {
    console.error("Error in /cart/remove:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to handle checkout (used by views/cart.ejs)
router.post('/checkout', async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { StringData } = req.body;
    if (!StringData) {
      console.log("No cart data received");
      return res.status(400).json({ error: 'No cart data provided' });
    }

    const { arr } = JSON.parse(StringData);
    if (!arr || arr.length === 0) {
      console.log("Cart is empty");
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const itemsCollection = db.collection('items');
    for (const item of arr) {
      const itemId = item.id;
      console.log("Processing itemId:", itemId);

      if (!itemId) {
        console.log("Invalid itemId:", itemId);
        return res.status(400).json({ error: 'Invalid ID cannot be added to cart' });
      }

      const itemDoc = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
      if (!itemDoc) {
        console.log(`Item with ID ${itemId} not found in database`);
        return res.status(404).json({ error: `Item with ID ${itemId} not found` });
      }
    }

    /// GET /admin/audit-logs - View all audit logs (admin only)
router.get("/admin/audit-logs", ensureAdmin, async (req, res) => {
  try {
    const auditLogs = await Order.db.collection("auditLogs").find().sort({ timestamp: -1 }).toArray();
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

// POST /admin/audit-logs/clear-old - Clear logs older than a specified number of days
router.post("/admin/audit-logs/clear-old", ensureAdmin, async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 30; // Default to 30 days if not specified
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await Order.db.collection("auditLogs").deleteMany({
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

// GET /admin/audit-logs/filter/:operation - Filter logs by operation type (INSERT, UPDATE, DELETE)
router.get("/admin/audit-logs/filter/:operation", ensureAdmin, async (req, res) => {
  try {
    const operation = req.params.operation.toUpperCase();
    if (!["INSERT", "UPDATE", "DELETE"].includes(operation)) {
      req.flash("error", "Invalid operation type.");
      return res.redirect("/admin/audit-logs");
    }

    const auditLogs = await Order.db.collection("auditLogs")
      .find({ operation })
      .sort({ timestamp: -1 })
      .toArray();

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
    // Process the cart (e.g., save to database, redirect to payment)
    res.redirect('/client'); // Redirect to "Your Orders" page
  } catch (error) {
    console.error("Error in /checkout:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;