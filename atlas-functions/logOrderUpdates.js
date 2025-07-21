exports = function(changeEvent) {
  const { fullDocument, operationType } = changeEvent;
  const mongodb = context.services.get("mongodb-atlas");
  const auditCollection = mongodb.db("canteenDB").collection("auditLogs");
  auditCollection.insertOne({
    operation: operationType,
    document: fullDocument,
    timestamp: new Date()
  });
};