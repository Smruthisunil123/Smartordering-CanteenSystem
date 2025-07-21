const express = require('express');
const router = express.Router();
const Item = require('../models/item');  // your Mongoose Item model

router.post('/cart/add', async (req, res) => {
  const { itemId, quantity } = req.body;

  try {
    // Find the item by id
    const item = await Item.findById(itemId);
    if (!item) return res.json({ success: false, message: 'Item not found' });

    // Check availability
    if (item.available !== 'true' && item.available !== true) {
      return res.json({ success: false, message: 'Item not available' });
    }

    // Initialize cart in session if not present
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if item already exists in cart, update quantity
    const cartItemIndex = req.session.cart.findIndex(ci => ci.itemId === itemId);
    if (cartItemIndex > -1) {
      req.session.cart[cartItemIndex].quantity += quantity;
    } else {
      req.session.cart.push({
        itemId: item._id.toString(),
        name: item.name,
        price: item.price,
        quantity: quantity,
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
