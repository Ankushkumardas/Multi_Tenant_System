import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getSubscriptionHistory,
  renewSubscription,
  SubscriptionExpiryReminder,
  ChangePlan,
  toggleAutoRenew,
  updateBillingCycle,
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  createSubscription,
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
} from "../controller/subscriptionController.js";

import { checkTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/history", authenticate, checkTenant, getSubscriptionHistory);
router.post("/change-plan", authenticate, checkTenant, ChangePlan);
router.post("/toggle-auto-renew", authenticate, checkTenant, toggleAutoRenew);
router.post(
  "/billing-cycle",
  authenticate,
  checkTenant,
  updateBillingCycle,
);
router.get(
  "/expiry-reminder",
  authenticate,
  checkTenant,
  SubscriptionExpiryReminder,
);
// Allow Renewal Route Even If Suspended
router.post("/renew", authenticate, checkTenant, renewSubscription);

// Add CRUD routes for plans
router.post("/plans", authenticate, checkTenant, createPlan);
router.get("/plans", authenticate, checkTenant, getPlans);
router.put("/plans/:id", authenticate, checkTenant, updatePlan);
router.delete("/plans/:id", authenticate, checkTenant, deletePlan);

// Add CRUD routes for subscriptions
router.post("/subscriptions", authenticate, checkTenant, createSubscription);
router.get("/subscriptions", authenticate, checkTenant, getSubscriptions);
router.put("/subscriptions/:id", authenticate, checkTenant, updateSubscription);
router.delete("/subscriptions/:id", authenticate, checkTenant, deleteSubscription);

export default router;
