import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
    },

    type: {
        type: String,
        enum: ["DIRECT", "GROUP"],
        default: "DIRECT",
    },

    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
},{ timestamps: true });

export default mongoose.model("ChatRoom", ChatRoomSchema);