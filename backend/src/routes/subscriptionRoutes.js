import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getSubscriptionHistory,
  renewSubscription,
  SubscriptionExpiryReminder,
} from "../controller/subscriptionController";
import { ChangePlan } from "../controller/subscriptionController";
import { toggleAutoRenew } from "../controller/subscriptionController";

const router = express.Router();

router.get("/history", authMiddleware, getSubscriptionHistory);
router.post("/change-plan", authMiddleware, ChangePlan);
router.post("/toggle-auto-renew", authMiddleware, toggleAutoRenew);
router.get("/expiry-reminder", authMiddleware, SubscriptionExpiryReminder);
// Allow Renewal Route Even If Suspended
router.post("/renew", authMiddleware, renewSubscription);
export default router;
