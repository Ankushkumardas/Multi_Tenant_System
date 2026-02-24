import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import {
  sendInvite,
  updateUserRole,
  forceLogoutuser,
} from "../controller/authController.js";

const router = express.Router();

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

export default router;
