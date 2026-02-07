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

  billingCycle: {
    type: String,
    enum: ["MONTHLY", "YEARLY"],
    default: "MONTHLY",
  },
  history: {
    type: Array,
    default: [],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("TenantSubscription", TenantSubscriptionSchema);