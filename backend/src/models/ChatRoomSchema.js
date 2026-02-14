// models/ChatRoom.js
import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    name: { type: String },

    isGroup: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

chatRoomSchema.index({ tenantId: 1 });

export default mongoose.model("ChatRoom", chatRoomSchema);
