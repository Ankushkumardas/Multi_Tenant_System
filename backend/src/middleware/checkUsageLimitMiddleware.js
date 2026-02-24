import TenantSubscription from "../models/TenantSubscriptionSchema.js";
import Project from "../models/ProjectSchema.js";

export const CheckUsageLimit = (type) => {
  return async (req, res, next) => {
    const { tenantId } = req.user;
    const tenantSubscription = await TenantSubscription.findOne({
      tenantId,
      status: "ACTIVE",
    }).populate("planId");
    if (!tenantSubscription) {
      return res.status(403).json({ message: "No active subscription" });
    }
    const plan = tenantSubscription.planId;
    if (!plan || !plan.limits) {
      console.error(
        `[UsageLimit] Plan or limits missing for tenant ${tenantId}`,
      );
      return res
        .status(403)
        .json({ message: "Subscription plan limits not configured" });
    }

    if (type === "project") {
      const projectCount = await Project.countDocuments({ tenantId });
      console.log(
        `[UsageLimit] Tenant ${tenantId} project count: ${projectCount}, Limit: ${plan.limits.maxProjects}`,
      );
      if (projectCount >= plan.limits.maxProjects) {
        return res.status(403).json({
          message: `Project limit reached (${plan.limits.maxProjects}). Please upgrade your plan.`,
        });
      }
    }
    if (type === "user") {
      const userCount = await User.countDocuments({ tenantId });
      if (userCount >= plan.limits.maxUsers) {
        return res.status(403).json({
          message: "User limit reached for your plan. Please upgrade.",
        });
      }
    }
    next();
  };
};
