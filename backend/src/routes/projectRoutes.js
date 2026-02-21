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
import {
  assignTask,
  createTask,
  deleteTask,
  getSingleTask,
  updateTask,
  updateTaskDueDate,
  updateTaskPriority,
  updateTaskStatus,
} from "../controller/taskController.js";
import {
  createSection,
  deleteSection,
  getBoard,
  getProjectSections,
  updateSection,
  updateSectionOrder,
} from "../controller/kanbanSectionController.js";
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "../controller/taskCommentController.js";

const router = express.Router({ mergeParams: true });

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

router.put(
  "/:projectId/tasks/:taskId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["UPDATE_TASK"]),
  updateTask,
);

router.delete(
  "/:projectId/tasks/:taskId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["DELETE_TASK"]),
  deleteTask,
);

router.get(
  "/:projectId/tasks/:taskId",
  authenticate,
  checkTenant,
  checkPermissions(["READ_TASK"]),
  getSingleTask,
);

router.post(
  "/:projectId/tasks/:taskId/assign",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["ASSIGN_TASK"]),
  assignTask,
);

router.put(
  "/:projectId/tasks/:taskId/status",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["UPDATE_TASK_STATUS"]),
  updateTaskStatus,
);

router.put(
  "/:projectId/tasks/:taskId/priority",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["UPDATE_TASK_PRIORITY"]),
  updateTaskPriority,
);

router.put(
  "/:projectId/tasks/:taskId/due-date",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER"]),
  checkPermissions(["UPDATE_TASK_DUE_DATE"]),
  updateTaskDueDate,
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

router.get(
  "/:projectId/board",
  authenticate,
  checkTenant,
  checkPermissions(["READ_BOARD"]),
  getBoard,
);

//task commnest routes
router.post(
  "/:projectId/tasks/:taskId/comments",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER", "MEMBER", "USER", "VIEWER"]),
  checkPermissions(["CREATE_COMMENT"]),
  createComment,
);

router.get(
  "/:projectId/tasks/:taskId/comments",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER", "MEMBER", "USER", "VIEWER"]),
  checkPermissions(["READ_COMMENT"]),
  getComments,
);

router.delete(
  "/:projectId/tasks/:taskId/comments/:commentId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER", "MEMBER", "USER", "VIEWER"]),
  checkPermissions(["DELETE_COMMENT"]),
  deleteComment,
);

router.put(
  "/:projectId/tasks/:taskId/comments/:commentId",
  authenticate,
  checkTenant,
  authorize(["OWNER", "ADMIN", "MANAGER", "MEMBER", "USER", "VIEWER"]),
  checkPermissions(["UPDATE_COMMENT"]),
  updateComment,
);
export default router;
