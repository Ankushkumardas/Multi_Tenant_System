import Tenant from "../models/TenantSchema.js";
import { saveAuditLog } from "../service/auditLogger.js";

export const getTenantSettings = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }
    res.status(200).json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTenantSettings = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { name } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { name },
      { new: true },
    );

    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TENANT_UPDATED",
      metadata: { name },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res
      .status(200)
      .json({ success: true, tenant, message: "Tenant updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
