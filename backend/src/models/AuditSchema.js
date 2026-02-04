import mongoose from "mongoose";

const AuditSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
    },

    actorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    action: String,
    metadata: Object,

}, { timestamps: true });

AuditSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model("Audit", AuditSchema);