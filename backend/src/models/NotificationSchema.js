import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    type: {
        type: String,
        enum: ["SYSTEM", "MESSAGE", "BILLING"],
    },

    message: String,
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });

export default mongoose.model("Notification", NotificationSchema);

// 🔍 Used for

// Real-time alerts

// Notification center

// Email fallback