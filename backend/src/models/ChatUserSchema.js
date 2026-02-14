// models/ChatParticipant.js
import mongoose from "mongoose";

const chatParticipantSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

chatParticipantSchema.index({ chatRoomId: 1, userId: 1 }, { unique: true });

export default mongoose.model("ChatParticipant", chatParticipantSchema);
