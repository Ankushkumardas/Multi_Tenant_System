// models/ChatRoom.js
import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    name: { type: String },
    type: {
      type: String,
      enum: ["PROJECT", "GROUP", "DIRECT"],
      default: "PROJECT",
    },
    // isGroup: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

chatRoomSchema.index({ tenantId: 1 });

export default mongoose.model("ChatRoom", chatRoomSchema);
