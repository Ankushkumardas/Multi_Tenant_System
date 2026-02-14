// models/TaskComment.js
import mongoose from "mongoose";

const taskCommentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: { type: String, required: true },
  },
  { timestamps: true }
);

taskCommentSchema.index({ tenantId: 1, taskId: 1 });

export default mongoose.model("TaskComment", taskCommentSchema);
