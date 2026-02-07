import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkTenant } from '../middleware/tenantMiddleware.js';
import {  registerOwner, resendVerificationEmail, sendInvite, verifyOwnerEmail } from '../controller/authController.js';

const router = express.Router();


router.post("/register-owner", registerOwner)
router.post("/verify-owner-email", verifyOwnerEmail)
router.post("/resend-verification-email", resendVerificationEmail)
router.post("/send-invite", authenticate, checkTenant, sendInvite)
export default router;