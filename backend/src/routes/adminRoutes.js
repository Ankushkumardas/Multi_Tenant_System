import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import {
  sendInvite,
  updateUserRole,
  forceLogoutuser,
  getTenantUsers,
  revokeInvite,
} from "../controller/authController.js";

const router = express.Router({ mergeParams: true });

router.post(
  "/send-invite",
  authenticate,
  checkTenant,
  authorize("OWNER", "ADMIN"),
  sendInvite,
);

router.put(
  "/update-role",
  authenticate,
  checkTenant,
  authorize("OWNER", "ADMIN"),
  updateUserRole,
);

router.post(
  "/force-logout/:userId",
  authenticate,
  authorize("OWNER", "ADMIN"),
  checkTenant,
  forceLogoutuser,
);

router.get("/get-users", authenticate, checkTenant, getTenantUsers);

router.post(
  "/revoke-invite/:inviteId",
  authenticate,
  checkTenant,
  authorize("OWNER", "ADMIN"),
  revokeInvite,
);

export default router;
