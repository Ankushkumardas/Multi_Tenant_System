import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";
import Tenant from "../models/TenantSchema.js";
//authentication middlware for use which will pass the usedId ,tenantId,and role of teh user and under which tenant the user is
export const authenticate = async (req, res, next) => {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "User not active" });
    }

    req.user = {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized for this role" });
    }
    next();
  };
};

export const requirePlan = (...plans) => {
  return async (req, res, next) => {
    const tenant = await Tenant.findById(req.user.tenantId).populate({
      path: "currentSubscription",
      populate: { path: "planId" },
    });

    if (!tenant || !tenant.currentSubscription) {
      return res.status(403).json({ message: "No active subscription found" });
    }

    const planName = tenant.currentSubscription.planId.name;

    if (!plans.includes(planName))
      return res.status(403).json({ message: "Upgrade plan" });
    next();
  };
};

export const requirePlanStatus = (...status) => {
  return async (req, res, next) => {
    const tenant = await Tenant.findById(req.user.tenantId).populate(
      "currentSubscription",
    );

    if (!tenant || !tenant.currentSubscription) {
      return res.status(403).json({ message: "No subscription found" });
    }

    if (!status.includes(tenant.currentSubscription.status))
      return res.status(403).json({ message: "Upgrade plan" });
    next();
  };
};
