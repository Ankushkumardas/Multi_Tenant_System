import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getTenantActitvity,
  getProjectActivity,
  UserActivity,
  getActivityStats,
} from "../controller/activityController.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/", getTenantActitvity);
router.get("/project/:projectId", getProjectActivity);
router.get("/user/:userId", UserActivity);
router.get("/stats", getActivityStats);

export default router;
