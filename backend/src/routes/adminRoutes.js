import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import {
  sendInvite,
  updateUserRole,
  forceLogoutuser,
  getTenantUsers,
  revokeInvite,
  resendInvite,
} from "../controller/authController.js";
import {
  getTenantSettings,
  updateTenantSettings,
} from "../controller/tenantController.js";

const router = express.Router({ mergeParams: true });

router.get(
  "/settings",
  authenticate,
  checkTenant,
  authorize("OWNER", "ADMIN"),
  getTenantSettings,
);
router.put(
  "/settings",
  authenticate,
  checkTenant,
  authorize("OWNER", "ADMIN"),
  updateTenantSettings,
);

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

router.post(
  "/resend-invite/:inviteId",
  authenticate,
  checkTenant,
  authorize("OWNER", "ADMIN"),
  resendInvite,
);

export default router;
