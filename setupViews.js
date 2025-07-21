const mongoose = require('mongoose');

async function setupViews() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection is not established.");
    }

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    const userOrdersViewPipeline = [
      { $project: {
        _id: 1,
        items: 1,
        total: 1,
        status: 1,
        createdAt: 1
      }}
    ];

    if (!collectionNames.includes("userOrdersView")) {
      console.log("Creating userOrdersView...");
      await db.createCollection("userOrdersView", {
        viewOn: "orders",
        pipeline: userOrdersViewPipeline
      });
      console.log("userOrdersView created successfully.");
    } else {
      console.log("userOrdersView already exists. Updating...");
      await db.command({
        collMod: "userOrdersView",
        viewOn: "orders",
        pipeline: userOrdersViewPipeline
      });
      console.log("userOrdersView updated successfully.");
    }

    const insertAuditLogsPipeline = [
      { $match: { operation: "INSERT" } },
      { $sort: { timestamp: -1 } },
      { $project: {
        _id: 0,
        operation: 1,
        documentKey: 1,
        updateDescription: 1,
        timestamp: 1
      }}
    ];

    if (!collectionNames.includes("insertAuditLogs")) {
      console.log("Creating insertAuditLogs view...");
      await db.createCollection("insertAuditLogs", {
        viewOn: "auditLogs",
        pipeline: insertAuditLogsPipeline
      });
      console.log("insertAuditLogs created successfully.");
    } else {
      console.log("insertAuditLogs already exists. Updating...");
      await db.command({
        collMod: "insertAuditLogs",
        viewOn: "auditLogs",
        pipeline: insertAuditLogsPipeline
      });
      console.log("insertAuditLogs updated successfully.");
    }
  } catch (error) {
    console.error("Error setting up views:", error);
    throw error;
  }
}

module.exports = setupViews;