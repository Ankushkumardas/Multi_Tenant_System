import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { checkTenant } from '../middleware/tenantMiddleware.js';
import { registerOwner, resendVerificationEmail, sendInvite, verifyOwnerEmail, login, refreshToken, logout, getProfile, forgotPassword, resetPassword, changePasword, acceptInvite, updateUserRole, updateProfileData } from '../controller/authController.js';

const router = express.Router();

router.post("/register-owner", registerOwner)
router.post("/verify-owner-email", verifyOwnerEmail)
router.post("/resend-verification-email", resendVerificationEmail)
router.post("/send-invite", authenticate, checkTenant, authorize("OWNER"), sendInvite)
router.post("/accept-invite", authenticate, checkTenant, acceptInvite)
router.get("/profile", authenticate, checkTenant, getProfile)
router.post("/login", login)
router.post("/refresh", refreshToken)
router.post("/logout", logout)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", authenticate, checkTenant, resetPassword)
router.post("/change-password", authenticate, checkTenant, changePasword)
router.put("/update-role", authenticate, checkTenant, authorize("OWNER"), updateUserRole)
router.put("/update-profile", authenticate, checkTenant, updateProfileData)
export default router;