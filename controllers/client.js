const express = require("express");
const router = express.Router();
const { Order } = require('../config/dbSchema'); // Correct path: goes up one directory to config

router.post('/cart/add', async (req, res) => {
    try {
        // Parse the cartData from the request body
        const { cartData } = req.body;
        if (!cartData) {
            console.log("No cart data received");
            return res.status(400).json({ error: 'No cart data provided' });
        }

        // Parse the JSON string
        const { arr } = JSON.parse(cartData);
        if (!arr || arr.length === 0) {
            console.log("Cart is empty");
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate each item in the cart
        for (const item of arr) {
            const itemId = item.id;
            console.log("Received itemId:", itemId);

            if (!itemId || isNaN(itemId)) {
                return res.status(400).json({ error: 'Invalid ID cannot be added to cart' });
            }

            // Check if the item exists in the database
            const result = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
            if (result.length === 0) {
                return res.status(404).json({ error: `Item with ID ${itemId} not found` });
            }

            // Optionally: Add item to a cart table in the database
            // Example: await db.query('INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)', [req.user.id, itemId, item.q]);
        }

        // If all items are valid, proceed (e.g., save cart to database or redirect)
        res.status(200).json({ success: true, message: 'Cart updated successfully' });
    } catch (error) {
        console.error("Error in /cart/add:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;