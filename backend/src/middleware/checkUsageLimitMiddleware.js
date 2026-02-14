import TenantSubscription from "../models/TenantSubscriptionSchema";
import Project from "../models/ProjectSchema";

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
    if (type === "project") {
      const projectCount = await Project.countDocuments({ tenantId });
      if (projectCount >= plan.limits.maxProjects) {
        return res.status(403).json({
          message: "Project limit reached for your plan. Please upgrade.",
        });
      }
    }
    if (type === "USER") {
      const userCount = await User.countDocuments({ tenantId });
      if (userCount >= plan.limits.maxUsers) {
        return res
          .status(403)
          .json({
            message: "User limit reached for your plan. Please upgrade.",
          });
      }
    }
    next();
  };
};
