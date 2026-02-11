import Plan from "../models/PlanSchema";
import TenantSubscription from "../models/TenantSubscriptionSchema";

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
    return res.status(200).json({ message: "Plan upgraded successfully" });
  } catch (error) {}
};

//auto renew and subcription expirey alert using cron jobs "node-cron"
