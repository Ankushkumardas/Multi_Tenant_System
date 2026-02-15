//will work over the role permissions.js file only for only teh project and task part rest will be handled by the auth middleware
import { rolePermissions } from "../utils/rolePermissions.js";
import User from "../models/UserSchema.js";

export const checkPermissions = (...permission) => {
  return async (req, res, next) => {
    const { userId } = req.user;
    const userrole = req.user.role;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "user account is not active" });
    }
    const permissions = rolePermissions[userrole];
    if (!permissions) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!permissions.includes(permission)) {
      return res
        .status(403)
        .json({ message: "You have no permission to perform this action" });
    }
    if (permission.includes("All")) {
      return next();
    }
    next();
  };
};
