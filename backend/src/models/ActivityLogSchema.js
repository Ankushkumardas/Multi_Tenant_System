// models/ActivityLog.js
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    actionType: { type: String, required: true },

    entityId: mongoose.Schema.Types.ObjectId,
    entityType: String,
  },
  { timestamps: true }
);

activityLogSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
