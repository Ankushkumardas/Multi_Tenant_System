import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import {
  getProfile,
  updateProfileData,
  getActiveSessions,
  changePasword,
} from "../controller/authController.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

const router = express.Router({ mergeParams: true });

router.get("/profile", authenticate, checkTenant, getProfile);

router.put("/update-profile", authenticate, checkTenant, updateProfileData);

router.get("/sessions", authenticate, checkTenant, getActiveSessions);

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

export default router;
