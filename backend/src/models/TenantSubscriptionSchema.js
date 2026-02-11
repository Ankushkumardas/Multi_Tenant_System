const TenantSubscriptionSchema = new mongoose.Schema(
  {
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

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    autoRenew: {
      type: Boolean,
      default: true,
    },

    cancelledAt: Date,

    paymentProvider: {
      type: String,
      enum: ["MANUAL", "STRIPE", "RAZORPAY"],
      default: "MANUAL",
    },

    history: [
      {
        planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
        startDate: Date,
        endDate: Date,
        changedAt: Date,
        action: {
          type: String,
          enum: ["CREATED", "UPGRADED", "DOWNGRADED", "RENEWED"],
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("TenantSubscription", TenantSubscriptionSchema);
