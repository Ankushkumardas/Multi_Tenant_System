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
    const {
      name,
      industry,
      website,
      description,
      logoUrl,
      slug: newSlug,
    } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    // Handle slug change with uniqueness check
    if (newSlug && newSlug !== tenant.slug) {
      const existing = await Tenant.findOne({ slug: newSlug });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Workspace URL is already taken" });
      }
      tenant.slug = newSlug;
    }

    if (name) tenant.name = name;
    if (industry) tenant.industry = industry;
    if (website) tenant.website = website;
    if (description) tenant.description = description;
    if (logoUrl) tenant.logoUrl = logoUrl;

    await tenant.save();

    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TENANT_UPDATED",
      metadata: {
        name,
        industry,
        website,
        description,
        logoUrl,
        slug: newSlug,
      },
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
