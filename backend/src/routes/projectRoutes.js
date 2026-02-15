import express from "express";
import { checkPermissions } from "../middleware/checkPermissions.js";
import {
  createProject,
  getMyProjects,
} from "../controller/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import { CheckUsageLimit } from "../middleware/checkUsageLimitMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  checkTenant,
  checkPermissions(["CREATE_PROJECT"]),
  CheckUsageLimit("project"),
  createProject,
);
router.get(
  "/",
  authenticate,
  checkTenant,
  checkPermissions(["READ_PROJECT"]),
  getMyProjects,
);

export default router;
