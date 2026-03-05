import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getUserRooms,
  getRoomDetails,
  createRoom,
  UpdateRoom,
  DeleteRoom,
  LeaveRoom,
  addParticipant,
  removeParticipant,
  getChatMessages,
  getOrCreateDM,
  markAsRead,
  markAllRead,
} from "../controller/chatController.js";

import { checkTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(checkTenant);

router.get("/", getUserRooms);
router.get("/rooms", getUserRooms);
router.post("/", createRoom);
router.get("/:roomId", getRoomDetails);
router.get("/:roomId/messages", getChatMessages);
router.put("/:roomId", UpdateRoom);
router.delete("/:roomId", DeleteRoom);
router.post("/:roomId/leave", LeaveRoom);
router.post("/participant", addParticipant);
router.post("/participant/remove", removeParticipant);
router.delete("/participant", removeParticipant); // Keep this for backward compatibility or direct deletes
router.post("/direct", getOrCreateDM);
router.post("/mark-all-read", markAllRead);
router.post("/:roomId/read", markAsRead);

export default router;
