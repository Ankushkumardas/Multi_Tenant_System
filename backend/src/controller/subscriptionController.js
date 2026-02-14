import Plan from "../models/PlanSchema";
import TenantSubscription from "../models/TenantSubscriptionSchema";
import Tenant from "../models/TenantSchema";
import User from "../models/UserSchema";
import { createNotification } from "../service/notification";
import { redisClient } from "../utils/redis";

//to upgrade or downgrade the plan
export const ChangePlan = async (req, res) => {
  const { tenantId } = req.tenant;
  const { newplan } = req.body;
  try {
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
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    //update history
    subscription.history.push({
      planId: plan._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      action: isupgrade ? "UPGRADED" : "DOWNGRADED",
    });
    subscription.save();
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
    }).populate("history.planId");
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
      //handle expiry if auto renew is enabled
      if (daysleft <= 0) {
        if (sub.autoRenew) {
          //extend the subscription
          sub.startDate = new Date();
          sub.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          sub.history.push({
            planId: sub.planId,
            startDate: sub.startDate,
            endDate: sub.endDate,
            chanegedAT: new Date(),
            action: "RENEWED",
          });
          await sub.save();
          //send notification
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
        }
      }
      //handle if autorenew is false mark expired
      else {
        sub.status = "EXPIRED";
        await sub.save();
        const tenant = await Tenant.findById(sub.tenantId);
        tenant.isSuspended = true;
        await tenant.save();
        const owner = await User.findOne({
          tenantId: sub.tenantId,
          role: "OWNER",
        });
        await createNotification(req, {
          tenantId: sub.tenantId,
          userId: owner._id,
          title: "Subscription Expired",
          type: "INFO",
          message: `Your subscription has expired`,
        });
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
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
