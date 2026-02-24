import cron from "node-cron";
import { SubscriptionExpiryReminder } from "../controller/subscriptionController.js";

// → Every day at 9:00 AM
export const scheduleCronJobs = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("Running cron job for subscription expiry reminder");
    await SubscriptionExpiryReminder();
  });
};
