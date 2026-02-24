//will work over the role permissions.js file only for only teh project and task part rest will be handled by the auth middleware
import { rolePermissions } from "../utils/rolePermissions.js";
import User from "../models/UserSchema.js";

export const checkPermissions = (...permission) => {
  return async (req, res, next) => {
    const requiredPermissions = permission.flat();
    const userrole = req.user.role;

    // Super-admin bypass
    if (userrole === "SUPER_ADMIN") return next();

    const allowedPermissions = rolePermissions[userrole];

    if (!allowedPermissions) {
      return res.status(403).json({ message: "Role permissions not defined" });
    }

    // Check if user has "ALL" or every required permission
    const hasAll = allowedPermissions.includes("ALL");
    const hasRequired = requiredPermissions.every((p) =>
      allowedPermissions.includes(p),
    );

    if (!hasAll && !hasRequired) {
      return res.status(403).json({
        message: "You have no permission to perform this action",
        required: requiredPermissions,
      });
    }

    next();
  };
};
