import Tenant from "../models/TenantSchema.js";

export const checkTenant = async (req, res, next) => {
  try {
    const slugFromUrl = req.params.slug;

    let tenant;

    if (slugFromUrl) {
      // Resolve tenant by slug from the URL
      tenant = await Tenant.findOne({ slug: slugFromUrl }).populate(
        "currentSubscription",
      );
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Security: ensure the slug in the URL matches the tenant in the JWT
      if (
        req.user.tenantId &&
        tenant._id.toString() !== req.user.tenantId.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Access denied: tenant mismatch" });
      }
    } else {
      // Fallback: resolve by tenantId from JWT (for routes without slug)
      if (!req.user.tenantId) return next();

      tenant = await Tenant.findById(req.user.tenantId).populate(
        "currentSubscription",
      );
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
    }

    if (tenant.isSuspended) {
      return res.status(403).json({ message: "Tenant suspended" });
    }

    if (
      tenant.currentSubscription &&
      tenant.currentSubscription.status === "CANCELLED"
    ) {
      return res.status(403).json({ message: "Tenant subscription cancelled" });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Tenant check failed", error: error.message });
  }
};
