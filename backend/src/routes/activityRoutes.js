import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getTenantActitvity,
  getProjectActivity,
  UserActivity,
  getActivityStats,
  getTaskActivityChart,
} from "../controller/activityController.js";
import {
  getDashboardStats,
  getAssignedTasks,
} from "../controller/taskController.js";

import { checkTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(checkTenant);

router.get("/", getTenantActitvity);
router.get("/dashboard-stats", getDashboardStats);
router.get("/assigned-tasks", getAssignedTasks);
router.get("/project/:projectId", getProjectActivity);
router.get("/user/:userId", UserActivity);
router.get("/stats", getActivityStats);
router.get("/task-chart", getTaskActivityChart);

export default router;
