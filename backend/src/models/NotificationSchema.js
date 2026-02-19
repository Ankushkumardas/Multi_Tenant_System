import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: { type: String },
    type: {
      type: String,
      enum: [
        "SYSTEM",
        "MESSAGE",
        "BILLING",
        "USER",
        "AUTH",
        "MENTION",
        "INVITE",
        "SECURITY",
        "PROJECT",
        "TASK",
        "CHAT",
        "INFO",
      ],
    },
    message: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });

export default mongoose.model("Notification", NotificationSchema);

// 🔍 Used for

// Real-time alerts

// Notification center

// Email fallback
