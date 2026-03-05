// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE", "REVIEW", "BACKLOGS"],
      default: "TODO",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "LOW",
    },

    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        note: { type: String },
        subtasks: [
          {
            title: { type: String, required: true },
            isCompleted: { type: Boolean, default: false },
          },
        ],
      },
    ],

    order: { type: Number, default: 0 },

    dueDate: Date,

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

taskSchema.index({ tenantId: 1, projectId: 1 });
taskSchema.index({ tenantId: 1, assignedTo: 1 });

export default mongoose.model("Task", taskSchema);
