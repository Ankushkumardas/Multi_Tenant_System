import express from "express";
import { checkPermissions } from "../middleware/checkPermissions";

const router = express.Router();

router.post("/", checkPermissions("CREATE_TASK"), createTask);

export default router;
