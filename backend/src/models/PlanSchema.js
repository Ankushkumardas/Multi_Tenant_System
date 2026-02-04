import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ["FREE", "PRO", "ENTERPRISE"],
        unique: true,
    },

    price: Number,

    limits: {
        maxUsers: Number,
        maxProjects: Number,
    },

    features: {
        chat: Boolean,
        analytics: Boolean,
        notifications: Boolean,
        kanban: Boolean,
    },
}, { timestamps: true });

export default mongoose.model("Plan", PlanSchema);


// 🔍 Why this exists
// Field	        Purpose
// limits	        Enforce usage caps
// features	        Feature gating
// price	            Billing
// name	            Lookup