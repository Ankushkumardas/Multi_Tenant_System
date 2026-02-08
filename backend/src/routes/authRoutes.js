import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import {
  registerOwner,
  resendVerificationEmail,
  sendInvite,
  verifyOwnerEmail,
  login,
  refreshToken,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePasword,
  acceptInvite,
  updateUserRole,
  updateProfileData,
  forceLogoutuser,
  getActiveSessions,
} from "../controller/authController.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

router.post("/register-owner", registerOwner);
router.post("/verify-owner-email", verifyOwnerEmail);
router.post(
  "/resend-verification-email",
  rateLimiter({
    keyPrefix: "resend-verify",
    limit: 3,
    windowsize: 60,
    identifier: "email",
  }),
  resendVerificationEmail,
);
router.post(
  "/send-invite",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN"]),
  sendInvite,
);
router.post("/accept-invite", authenticate, checkTenant, acceptInvite);
router.get("/profile", authenticate, checkTenant, getProfile);
router.post(
  "/login",
  rateLimiter({
    keyPrefix: "login",
    limit: 5,
    windowsize: 60,
    identifier: "email",
  }),
  login,
);
router.post(
  "/refresh",
  rateLimiter({
    keyPrefix: "refresh",
    limit: 5,
    windowsize: 60,
    identifier: "userId",
  }),
  refreshToken,
);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  rateLimiter({
    keyPrefix: "forgot-password",
    limit: 3,
    windowsize: 60,
    identifier: "email",
  }),
  forgotPassword,
);
router.post(
  "/reset-password",
  rateLimiter({
    keyPrefix: "reset-password",
    limit: 3,
    windowsize: 60,
    identifier: "email",
  }),
  authenticate,
  checkTenant,
  resetPassword,
);
router.post(
  "/change-password",
  rateLimiter({
    keyPrefix: "change-password",
    limit: 3,
    windowsize: 60,
    identifier: "userId",
  }),
  authenticate,
  checkTenant,
  changePasword,
);
router.put(
  "/update-role",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN"]),
  updateUserRole,
);
router.put("/update-profile", authenticate, checkTenant, updateProfileData);
router.post(
  "/admin/force-logout/:userId",
  authenticate,
  authorize(["OWNER", "ADMIN"]),
  checkTenant,
  forceLogoutuser,
);
router.get("/sessions", authenticate, checkTenant, getActiveSessions);

export default router;
