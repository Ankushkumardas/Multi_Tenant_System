import mongoose from "mongoose";

const TenantSubscriptionSchema = new mongoose.Schema({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },

    startDate: Date,
    endDate: Date,

}, { timestamps: true });

export default mongoose.model("TenantSubscription", TenantSubscriptionSchema);