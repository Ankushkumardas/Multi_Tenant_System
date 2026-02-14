import TenantSubscription from "../models/TenantSubscriptionSchema.js";

export const FeatureCheckValidationMiddleware = (...feature) => {
  return async (req, res, next) => {
    const tenantId = req.user.tenantId;
    const tenantSubscription = await TenantSubscription.findOne({
      tenantId,
      status: "ACTIVE",
    }).populate("planId");
    if (!tenantSubscription) {
      return res.status(403).json({ message: "No active subscription" });
    }
    const plan = tenantSubscription.planId;
    if (!plan.feature[feature]) {
      return res
        .status(403)
        .json({ message: `${feature} is not in your plan` });
    }
    next();
  };
};
