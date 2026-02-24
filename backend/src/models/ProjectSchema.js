import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    name: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: String,
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

projectSchema.index({ tenantId: 1 });

export default mongoose.model("Project", projectSchema);
