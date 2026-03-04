import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import {
  getTenantAuditLogs,
  getAuditStats,
  getAuditByUser,
} from "../controller/auditController.js";

import { checkTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router({ mergeParams: true });

// All audit routes require authentication and must be OWNER or ADMIN
router.use(authenticate);
router.use(checkTenant);
router.use(authorize("OWNER", "ADMIN"));

router.get("/", getTenantAuditLogs);
router.get("/stats", getAuditStats);
router.get("/user/:userId", getAuditByUser);

export default router;
