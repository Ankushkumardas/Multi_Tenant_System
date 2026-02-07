import Tenant from "../models/TenantSchema.js";

export const checkTenant = async (req, res, next) => {
    if (!req.user.tenantId) return next();

    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    if (tenant.isSuspended) {
        return res.status(403).json({ message: "Tenant suspended" });
    }

    if(tenant.subscriptionStatus==="CANCELLED"){
        return res.status(403).json({ message: "Tenant subscription cancelled" });
    }
    req.tenant = tenant;
    next();
};
