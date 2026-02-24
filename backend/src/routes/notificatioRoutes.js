import express from "express";
import {
  markAsRead,
  getUnreadCount,
  markAllAsRead,
  getAllNotifications,
} from "../controller/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router({ mergeParams: true });

router.post("/mark-as-read/:id", authenticate, checkTenant, markAsRead);
router.get("/unread-count", authenticate, checkTenant, getUnreadCount);
router.post("/mark-all-read", authenticate, checkTenant, markAllAsRead);
router.get("/all", authenticate, checkTenant, getAllNotifications);
export default router;
