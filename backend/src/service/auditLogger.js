import Audit from "../models/AuditSchema.js";
import ActivityLog from "../models/ActivityLogSchema.js";

export const saveAuditLog = async ({
  tenantId,
  actorUserId,
  action,
  metadata = {},
  ipAddress,
  userAgent,
}) => {
  try {
    await Audit.create({
      tenantId,
      actorUserId,
      action,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

export const saveActivityLog = async ({
  tenantId,
  userId,
  actionType,
  entityId,
  entityType,
  projectId,
  details = {},
}) => {
  try {
    await ActivityLog.create({
      tenantId,
      userId,
      actionType,
      entityId,
      entityType,
      projectId,
      details,
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
};
