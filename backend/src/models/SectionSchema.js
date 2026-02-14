// models/Section.js
import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    name: { type: String, required: true },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sectionSchema.index({ tenantId: 1, projectId: 1 });

export default mongoose.model("Section", sectionSchema);
