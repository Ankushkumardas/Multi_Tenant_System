import Plan from "../models/PlanSchema.js";
import TenantSubscription from "../models/TenantSubscriptionSchema.js";
import Tenant from "../models/TenantSchema.js";
import User from "../models/UserSchema.js";
import { createNotification } from "../service/notification.js";
import { redisClient } from "../utils/redis.js";

// helper to compute end date based on billing cycle
const computeEndDate = (billingCycle = "MONTHLY") => {
  const now = Date.now();
  switch (billingCycle) {
    case "YEARLY":
      return new Date(now + 365 * 24 * 60 * 60 * 1000);
    case "QUARTERLY":
      return new Date(now + 90 * 24 * 60 * 60 * 1000);
    case "HALF_YEARLY":
      return new Date(now + 182 * 24 * 60 * 60 * 1000);
    case "MONTHLY":
    default:
      return new Date(now + 30 * 24 * 60 * 60 * 1000);
  }
};

//to upgrade or downgrade the plan
export const ChangePlan = async (req, res) => {
  // tenant is already validated in checkTenant middleware
  const tenantId = req.user?.tenantId || req.tenant?._id;
  const { newplan } = req.body;
  try {
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant not resolved" });
    }

    const subscription = await TenantSubscription.findOne({
      tenantId,
      status: "ACTIVE",
    }).populate("planId");
    if (!subscription) {
      return res.status(404).json({ message: "Active subscription not found" });
    }
    const plan = await Plan.findOne({ name: newplan.toUpperCase() });
    if (!plan) {
      return res
        .status(404)
        .json({ message: "No new plan or Invalid plan selected" });
    }
    if (subscription.planId.name === plan.name) {
      return res.status(400).json({ message: "You are already on this plan" });
    }
    //determine if newplan is upgrade or downgrade
    const isupgrade = plan.price > subscription.planId.price;
    //update teh tenant subcription data with teh new plan
    subscription.planId = plan._id;
    subscription.status = "ACTIVE";
    subscription.startDate = new Date();
    subscription.endDate = computeEndDate(subscription.billingCycle);
    //update history
    subscription.history.push({
      planId: plan._id,
      startDate: new Date(),
      endDate: subscription.endDate,
      action: isupgrade ? "UPGRADED" : "DOWNGRADED",
    });
    await subscription.save();
    return res.status(200).json({
      message: `Plan ${isupgrade ? "UPGRADED" : "DOWNGRADED"} successfully`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//get subscription history of an particur tenant
export const getSubscriptionHistory = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const subscription = await TenantSubscription.findOne({
      tenantId,
    }).populate("history.planId").populate("planId");
    if (!subscription) {
      return res.status(404).json({ message: "No subscription history found" });
    }
    return res.status(200).json({ subscription });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//auto renew and subcription expirey alert using cron jobs "node-cron"
//Subscription Expiry Checker-->
export const SubscriptionExpiryReminder = async (req, res) => {
  try {
    const activeSubscriptions = await TenantSubscription.find({
      status: "ACTIVE",
    });
    const today = new Date();
    for (const sub of activeSubscriptions) {
      const endDate = new Date(sub.endDate);
      const diffTime = endDate - today;
      const daysleft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // send reminder in the last 5 days of the subscription
      if (daysleft <= 5 && daysleft > 0) {
        const redisKey = `subscription:reminder:${sub._id}:${daysleft}`;
        const isSent = await redisClient.get(redisKey);
        if (isSent) continue;
        const tenant = await Tenant.findById(sub.tenantId);
        if (!tenant) continue;
        const owner = await User.findOne({
          tenantId: sub.tenantId,
          role: "OWNER",
        });
        if (!owner) continue;
        //last 5 days reminder condition
        await createNotification(req, {
          tenantId: sub.tenantId,
          userId: owner._id,
          title: "Subscription Expiry reminder",
          type: "INFO",
          message: `Your subscription will expire in ${daysleft} days`,
        });
        await redisClient.set(redisKey, "sent", "EX", 86400);
      }

      // handle expiry only when the subscription has actually ended
      if (daysleft <= 0) {
        if (sub.autoRenew) {
          // extend the subscription
          sub.startDate = new Date();
          sub.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          sub.history.push({
            planId: sub.planId,
            startDate: sub.startDate,
            endDate: sub.endDate,
            changedAt: new Date(),
            action: "RENEWED",
          });
          await sub.save();

          // send notification
          const tenant = await Tenant.findById(sub.tenantId);
          if (!tenant) continue;
          const owner = await User.findOne({
            tenantId: sub.tenantId,
            role: "OWNER",
          });
          if (!owner) continue;
          await createNotification(req, {
            tenantId: sub.tenantId,
            userId: owner._id,
            title: "Subscription Renewed",
            type: "INFO",
            message: `Your subscription has been renewed successfully`,
          });
        } else {
          // auto renew is disabled -> mark as expired and suspend tenant
          sub.status = "EXPIRED";
          await sub.save();
          const tenant = await Tenant.findById(sub.tenantId);
          if (tenant) {
            tenant.isSuspended = true;
            await tenant.save();
          }
          const owner = await User.findOne({
            tenantId: sub.tenantId,
            role: "OWNER",
          });
          if (owner) {
            await createNotification(req, {
              tenantId: sub.tenantId,
              userId: owner._id,
              title: "Subscription Expired",
              type: "INFO",
              message: `Your subscription has expired`,
            });
          }
        }
      }
    }
    return res
      .status(200)
      .json({ message: "Subscription expiry reminder sent successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//toggleautorenew subscription
export const toggleAutoRenew = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const subscription = await TenantSubscription.findOne({ tenantId });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    subscription.autoRenew = !subscription.autoRenew;
    subscription.save();
    return res.status(200).json({
      message: `Auto renew toggled successfully ${subscription.autoRenew}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//renew subscriptton in teh renew tab

export const renewSubscription = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const subscription = await TenantSubscription.findOne({ tenantId });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    subscription.status = "ACTIVE";
    subscription.startDate = new Date();
    subscription.endDate = computeEndDate(subscription.billingCycle);
    subscription.history.push({
      planId: subscription.planId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      action: "RENEWED",
    });
    await subscription.save();
    await Tenant.findByIdAndUpdate(tenantId, { isSuspended: false });
    return res
      .status(200)
      .json({ message: "Subscription renewed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update billing cycle (MONTHLY / YEARLY)
export const updateBillingCycle = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { billingCycle } = req.body;

    if (!["MONTHLY", "YEARLY", "QUARTERLY", "HALF_YEARLY"].includes(billingCycle)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid billing cycle. Use MONTHLY, QUARTERLY, HALF_YEARLY or YEARLY.",
        });
    }

    const subscription = await TenantSubscription.findOne({
      tenantId,
      status: "ACTIVE",
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.billingCycle = billingCycle;
    subscription.startDate = new Date();
    subscription.endDate = computeEndDate(billingCycle);
    subscription.history.push({
      planId: subscription.planId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      changedAt: new Date(),
      action: "BILLING_CYCLE_CHANGED",
    });

    await subscription.save();

    return res.status(200).json({
      message: "Billing cycle updated successfully",
      subscription,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new plan
export const createPlan = async (req, res) => {
  try {
    const { name, price, limits, features } = req.body;
    const plan = new Plan({ name, price, limits, features });
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error creating plan", error });
  }
};

// Get all plans
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error.message, error.stack);
    res.status(500).json({ message: "Error fetching plans", error: error.message });
  }
};

// Update a plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const plan = await Plan.findByIdAndUpdate(id, updates, { new: true });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error updating plan", error });
  }
};

// Delete a plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting plan", error });
  }
};

// Create a new subscription
export const createSubscription = async (req, res) => {
  try {
    const { tenantId, planId, startDate, endDate } = req.body;
    const subscription = new TenantSubscription({
      tenantId,
      planId,
      startDate,
      endDate,
    });
    await subscription.save();
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Error creating subscription", error });
  }
};

// Get all subscriptions
export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await TenantSubscription.find().populate("planId");
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subscriptions", error });
  }
};

// Update a subscription
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const subscription = await TenantSubscription.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!subscription)
      return res.status(404).json({ message: "Subscription not found" });
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Error updating subscription", error });
  }
};

// Delete a subscription
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await TenantSubscription.findByIdAndDelete(id);
    if (!subscription)
      return res.status(404).json({ message: "Subscription not found" });
    res.status(200).json({ message: "Subscription deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subscription", error });
  }
};
