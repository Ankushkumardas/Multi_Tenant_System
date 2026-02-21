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
  removePartcipant,
} from "../controller/chatController.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/", getUserRooms);
router.post("/", createRoom);
router.get("/:roomId", getRoomDetails);
router.put("/:roomId", UpdateRoom);
router.delete("/:roomId", DeleteRoom);
router.post("/:roomId/leave", LeaveRoom);
router.post("/participant", addParticipant);
router.delete("/participant", removePartcipant);

export default router;
