import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getUserRooms } from "../controller/chatController.js";
const router = express.Router();

router.get("/", authenticate,getUserRooms);

export default router;