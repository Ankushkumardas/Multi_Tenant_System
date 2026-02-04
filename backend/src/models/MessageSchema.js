import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
     tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: { type: String, required: true },
    isEdited: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model("Message", MessageSchema);