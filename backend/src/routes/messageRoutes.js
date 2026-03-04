import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  editMessage,
  deleteMessageFor,
  pinMessage,
  unpinMessage,
  searchMessage,
  replyMessage,
  getThreadMessage,
} from "../controller/messageControllers.js";

import { checkTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(checkTenant);

router.get("/search", searchMessage);
router.put("/:messageId", editMessage);
router.delete("/:messageId", deleteMessageFor);
router.put("/:messageId/pin", pinMessage);
router.put("/:messageId/unpin", unpinMessage);
router.post("/:messageId/reply", replyMessage);
router.get("/:messageId/thread", getThreadMessage);

export default router;
