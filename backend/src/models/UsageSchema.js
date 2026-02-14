// models/Usage.js
import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    totalProjects: { type: Number, default: 0 },
    totalUsersInvited: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },

    currentPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Usage", usageSchema);
