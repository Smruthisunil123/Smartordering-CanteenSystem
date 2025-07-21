router.get("/admin/audit-logs", ensureAdmin, async (req, res) => {
  try {
    const auditLogs = await mongoose.connection.db.collection("auditLogs").find().sort({ timestamp: -1 }).toArray();
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