import Tenant from "../models/TenantSchema.js";

export const checkTenant = async (req, res, next) => {
    //this check is for role super admin as he will have access too all if his role is set to "SUPER_ADMIN" only and will have many authoriztiion to do over teh tenannt and its subscriptions and features and plan to kill and start and and chck stats
    if (!req.user.tenantId) return next();

    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    if (tenant.isSuspended) {
        return res.status(403).json({ message: "Tenant suspended" });
    }

    req.tenant = tenant;
    next();
};
