import express from "express";
import { checkPermissions } from "../middleware/checkPermissions.js";
import {
  Leaveproject,
  addMemberToProject,
  archiveProject,
  createProject,
  deleteProject,
  getMyProjects,
  getProjectById,
  getProjectMembers,
  removeMemberFromProject,
  toggelArchiver,
  updateProject,
  updateprojectMemberRole,
} from "../controller/projectController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import { CheckUsageLimit } from "../middleware/checkUsageLimitMiddleware.js";
import { createTask } from "../controller/taskController.js";
import {
  createSection,
  deleteSection,
  getProjectSections,
  updateSection,
  updateSectionOrder,
} from "../controller/kanbanSectionController.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  checkTenant,
  authorize(["OWNER"]),
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
router.get("/:projectId", authenticate, checkTenant, getProjectById);

router.post(
  "/:projectId/archive",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN"]),
  archiveProject,
);

router.post(
  "/:projectId/toggle-archive",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN"]),
  toggelArchiver,
);

router.put(
  "/:projectId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN"]),
  checkPermissions(["UPDATE_PROJECT"]),
  updateProject,
);

router.delete(
  "/:projectId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN"]),
  checkPermissions(["DELETE_PROJECT"]),
  deleteProject,
);

//project memebr routes
router.post(
  "/:projectId/add-member",
  authenticate,
  checkTenant,
  checkPermissions(["ADD_MEMBER"]),
  addMemberToProject,
);

router.delete(
  "/:projectId/remove-member",
  authenticate,
  checkTenant,
  checkPermissions(["REMOVE_MEMBER"]),
  removeMemberFromProject,
);

router.post(
  "/:projectId/leave",
  authenticate,
  checkTenant,
  checkPermissions(["LEAVE_PROJECT"]),
  Leaveproject,
);

router.put(
  "/:projectId/update-member-role",
  authenticate,
  checkTenant,
  checkPermissions(["UPDATE_MEMBER_ROLE"]),
  updateprojectMemberRole,
);

router.get(
  "/:projectId/members",
  authenticate,
  checkTenant,
  checkPermissions(["READ_PROJECT"]),
  getProjectMembers,
);

//task routes
router.post(
  "/:projectId/tasks",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["CREATE_TASK"]),
  createTask,
);

//kanban section routes
router.post(
  "/:projectId/sections",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["CREATE_SECTION"]),
  createSection,
);

router.put(
  "/:projectId/sections/:sectionId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["UPDATE_SECTION"]),
  updateSection,
);

router.delete(
  "/:projectId/sections/:sectionId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["DELETE_SECTION"]),
  deleteSection,
);

router.put(
  "/:projectId/sections/order",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["UPDATE_SECTION_ORDER"]),
  updateSectionOrder,
);

router.get(
  "/:projectId/sections",
  authenticate,
  checkTenant,
  checkPermissions(["READ_SECTION"]),
  getProjectSections,
);
export default router;
