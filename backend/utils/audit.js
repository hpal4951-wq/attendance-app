import AuditLog from "../models/auditLog.model.js";

/**
 * Logs an audit event. Safe to call without awaiting in hot paths.
 */
export const logAudit = async ({ userId, action, entity, entityId, metadata = {}, req }) => {
  try {
    await AuditLog.create({
      user: userId || null,
      action,
      entity: entity || null,
      entityId: entityId ? String(entityId) : null,
      metadata: metadata || {},
      ipAddress: req?.ip || req?.socket?.remoteAddress || null,
      userAgent: req?.headers?.["user-agent"] || null,
    });
  } catch (error) {
    console.error("logAudit error:", error);
  }
};
