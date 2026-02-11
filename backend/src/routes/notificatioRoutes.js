import express from "express";
import {
  markAsRead,
  getUnreadCount,
  markAllAsRead,
  getAllNotifications,
} from "../controller/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/mark-as-read/:id", authenticate, markAsRead);
router.get("/unread-count", authenticate, getUnreadCount);
router.post("/mark-all-read", authenticate, markAllAsRead);
router.get("/all", authenticate, getAllNotifications);
export default router;
