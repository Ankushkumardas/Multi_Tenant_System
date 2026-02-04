import mongoose from "mongoose";

const EmailSchema = new mongoose.Schema({
     userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true },
    expiresAt: Date,
    isUsed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Email", EmailSchema);

//  Why separate schema?

// Token rotation

// Expiry handling

// Auditability