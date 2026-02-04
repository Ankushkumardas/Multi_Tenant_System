import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        default: null, // SUPER_ADMIN
    },

    name: { type: String, required: true },
    email: { type: String, required: true },

    passwordHash: { type: String, required: true },

    role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER", "VIEWER"],
        default: "USER",
    },

    isEmailVerified: { type: Boolean, default: false },

    status: {
        type: String,
        enum: ["ACTIVE", "INVITED", "SUSPENDED"],
        default: "ACTIVE",
    },

    refreshToken: { type: String },   // 🔐 cookie-based session
    userAgent: { type: String },      // device/browser info
    lastLoginAt: { type: Date },
}, { timestamps: true });

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.model("User", UserSchema);


// 🔍 Field-by-field explanation
// Field	        Why it exists	Used for
// tenantId	        Why it exists	        Used for
// email	            Login identity	        Auth
// passwordHash	    Encrypted password	    Auth
// role	            RBAC	                Authorization
// isEmailVerified	Security	            Login gate
// status	            Soft disable user	    Admin control
// refreshToken	    Persistent login	    Cookie session
// userAgent	        Device tracking	        Session safety
// lastLoginAt	        Analytics	            Security
// timestamps	        Auditing	            Logs
// 🔐 Refresh Token Flow

// Stored hashed

// Sent via HTTP-only cookie

// Rotated on every refresh

// If stolen → revoke user session