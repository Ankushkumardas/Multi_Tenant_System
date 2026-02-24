import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getSubscriptionHistory,
  renewSubscription,
  SubscriptionExpiryReminder,
  ChangePlan,
  toggleAutoRenew,
} from "../controller/subscriptionController.js";

import { checkTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/history", authenticate, checkTenant, getSubscriptionHistory);
router.post("/change-plan", authenticate, checkTenant, ChangePlan);
router.post("/toggle-auto-renew", authenticate, checkTenant, toggleAutoRenew);
router.get(
  "/expiry-reminder",
  authenticate,
  checkTenant,
  SubscriptionExpiryReminder,
);
// Allow Renewal Route Even If Suspended
router.post("/renew", authenticate, checkTenant, renewSubscription);
export default router;
