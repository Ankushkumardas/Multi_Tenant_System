import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import {
  registerOwner,
  resendVerificationEmail,
  verifyOwnerEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  acceptInvite,
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

router.post("/accept-invite", acceptInvite);

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
    identifier: "ip",
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

export default router;
