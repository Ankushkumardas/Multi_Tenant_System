import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },

    // subscriptionPlan: {
    //   type: String,
    //   enum: ["FREE", "PRO", "ENTERPRISE"],
    //   default: "FREE",
    // },

    // subscriptionStatus: {
    //   type: String,
    //   enum: ["ACTIVE", "PAUSED", "CANCELLED"],
    //   default: "ACTIVE",
    // },
    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TenantSubscription",
    },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Tenant", TenantSchema);

// Field Explanation\
// Field	            Why it exists	                Used where
// name	                Company name	                Dashboard, UI
// slug	                URL-friendly identifier	    app.com/acme
// subscriptionPlan	    Quick plan lookup	            Feature gating
// subscriptionStatus	    Billing state	                Block access
// isSuspended	        Super admin control	            Hard stop tenant
// createdAt	            Analytics	                    Admin dashboard
// updatedAt	            Tracking	                    Logs

// 👉 Every request checks isSuspended
