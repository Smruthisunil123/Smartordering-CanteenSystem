const mongoose = require("mongoose");
const crypto = require("crypto");

const dbSchema = require('../config/dbSchema');
const Item = dbSchema.Item;

module.exports = {
  // GET all the items sorted by date
  getItems: async (req, res) => {
    try {
      const dateObj = new Date();
      const month = dateObj.getUTCMonth() + 1;
      const day = dateObj.getUTCDate();
      const year = dateObj.getUTCFullYear();
      const currDate = `${year}-${month}-${day}`;

      console.log(currDate);

      const docs = await Item.find({ _id: currDate });

      if (docs.length === 0) {
        res.render("itemsCart", { items: [] });
      } else {
        const items = docs[0].items;
        console.log(items);
        res.render("itemsCart", { items: items });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },

  getItemsOnDate: async (req, res) => {
    try {
      const docs = await Item.find({ _id: req.params.date });
      res.render("itemsCart", { items: docs.length ? docs[0].items : [] });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },

  postItems: async (req, res) => {
    const { itemId, date, func, name, price, type, available, menu } = req.body;

    try {
      const dateObj = new Date();
      const month = dateObj.getUTCMonth() + 1;
      const day = dateObj.getUTCDate();
      const year = dateObj.getUTCFullYear();
      const currDate = `${day}-${month}-${year}`;

      if (func === "addItem") {
        const doc = await Item.findById(date);
        if (!doc) {
          const newItem = new Item({ _id: date, items: [] });
          await newItem.save();
        }

        const itemToBeAdded = {
          itemId: crypto.randomBytes(6).toString("hex"),
          type,
          name,
          menu,
          price,
          available,
          lastUpdated: dateObj,
          filename: "1665893609061-by-undefined-images.jpeg"
        };

        const updated = await Item.findByIdAndUpdate(
          date,
          { $push: { items: itemToBeAdded } },
          { new: true, upsert: true }
        );

        console.log(updated);
      }

      if (func === "updateItem") {
        const updated = await Item.updateOne(
          { _id: date, "items.itemId": itemId },
          {
            $set: {
              "items.$.name": name,
              "items.$.price": price,
              "items.$.type": type,
              "items.$.menu": menu,
              "items.$.available": available,
              "items.$.lastUpdated": new Date()
            }
          }
        );
        console.log(updated);
      }

      if (func === "removeItem") {
        // TODO: Implement remove functionality
      }

      res.send({
        success: "true",
        message: "post request handled successfully"
      });

    } catch (err) {
      console.error(err);
      res.status(500).send({ success: "false", message: err.message });
    }
  },
};
