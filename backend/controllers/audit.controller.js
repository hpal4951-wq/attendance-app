import AuditLog from "../models/auditLog.model.js";

const serverError = (res, error) => {
  console.error("audit.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again.", error: error.message });
};

export const getAuditLogs = async (req, res) => {
  try {
    const { action, user, date, page = 1, limit = 20 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (date) query.createdAt = { $gte: new Date(`${date}T00:00:00Z`), $lte: new Date(`${date}T23:59:59Z`) };
    if (user) query.user = user;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate({ path: "user", select: "name phone role" })
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
      pagination: { page: p, limit: l, total, pages: Math.max(1, Math.ceil(total / l)) },
    });
  } catch (e) { return serverError(res, e); }
};