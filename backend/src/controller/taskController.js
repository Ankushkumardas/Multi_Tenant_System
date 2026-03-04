import Task from "../models/TaskSchema.js";
import mongoose from "mongoose";
import { saveAuditLog, saveActivityLog } from "../service/auditLogger.js";
import { createNotification } from "../service/notification.js";

export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      sectionId,
    } = req.body;
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;
    const task = await Task.create({
      tenantId,
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      sectionId,
      createdBy,
    });
    const meta = { taskId: task._id, title, projectId };
    saveAuditLog({
      tenantId,
      actorUserId: createdBy,
      action: "TASK_CREATED",
      metadata: meta,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: createdBy,
      actionType: "TASK_CREATED",
      entityId: task._id,
      entityType: "Task",
      projectId,
      details: meta,
    });
    res
      .status(201)
      .json({ success: true, task, message: "Task Created Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const tasks = await Task.find({ projectId, tenantId })
      .sort({ createdAt: -1 })
      .populate("assignedTo createdBy sectionId");
    if (!tasks) {
      return res
        .status(404)
        .json({ success: false, message: "Tasks not found" });
    }
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      sectionId,
    } = req.body;
    const tenantId = req.user.tenantId;
    const task = await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { title, description, status, priority, dueDate, assignedTo, sectionId },
      { new: true },
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    const meta = { taskId, changes: req.body };
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TASK_UPDATED",
      metadata: meta,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "TASK_UPDATED",
      entityId: taskId,
      entityType: "Task",
      projectId: task.projectId,
      details: meta,
    });
    res
      .status(200)
      .json({ success: true, task, message: "Task Updated Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const tenantId = req.user.tenantId;
    const task = await Task.findOneAndDelete({ _id: taskId, tenantId });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TASK_DELETED",
      metadata: { taskId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "TASK_DELETED",
      entityId: taskId,
      entityType: "Task",
      projectId: task.projectId,
      details: { taskId },
    });
    res
      .status(200)
      .json({ success: true, task, message: "Task Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSingleTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const tenantId = req.user.tenantId;
    const task = await Task.findOne({ _id: taskId, tenantId }).populate(
      "assignedTo createdBy sectionId",
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//for drag and drop
export const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { sectionId } = req.body;
    const tenantId = req.user.tenantId;
    const task = await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { sectionId },
      { new: true },
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TASK_MOVED",
      metadata: { taskId, sectionId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "TASK_MOVED",
      entityId: taskId,
      entityType: "Task",
      projectId: task.projectId,
      details: { sectionId },
    });
    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignedTo } = req.body;
    const tenantId = req.user.tenantId;
    const task = await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { assignedTo },
      { new: true },
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // notify to newly assigned members (in parallel for performance)
    if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
      Promise.all(
        assignedTo.map((assignedUserId) =>
          createNotification(req, {
            tenantId,
            userId: assignedUserId,
            title: "New Task Assignment",
            type: "ASSIGN_TASK",
            message: `${req.user.name} assigned you a task`,
          }).catch((err) =>
            console.error(
              `Notification failed for user ${assignedUserId}:`,
              err.message,
            ),
          ),
        ),
      );
    }
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TASK_ASSIGNED",
      metadata: { taskId, assignedTo },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "TASK_ASSIGNED",
      entityId: taskId,
      entityType: "Task",
      projectId: task.projectId,
      details: { assignedTo },
    });
    res
      .status(200)
      .json({ success: true, task, message: "Task Assigned Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;
    const task = await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { status },
      { new: true },
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TASK_STATUS_CHANGED",
      metadata: { taskId, status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "TASK_STATUS_CHANGED",
      entityId: taskId,
      entityType: "Task",
      projectId: task.projectId,
      details: { status },
    });
    res.status(200).json({
      success: true,
      task,
      message: "Task Status Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskPriority = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { priority } = req.body;
    const tenantId = req.user.tenantId;
    const task = await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { priority },
      { new: true },
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TASK_PRIORITY_CHANGED",
      metadata: { taskId, priority },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "TASK_PRIORITY_CHANGED",
      entityId: taskId,
      entityType: "Task",
      projectId: task.projectId,
      details: { priority },
    });
    res.status(200).json({
      success: true,
      task,
      message: "Task Priority Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskDueDate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dueDate } = req.body;
    const tenantId = req.user.tenantId;
    const task = await Task.findOneAndUpdate(
      { _id: taskId, tenantId },
      { dueDate },
      { new: true },
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "TASK_DUEDATE_CHANGED",
      metadata: { taskId, dueDate },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "TASK_DUEDATE_CHANGED",
      entityId: taskId,
      entityType: "Task",
      projectId: task.projectId,
      details: { dueDate },
    });
    res.status(200).json({
      success: true,
      task,
      message: "Task Due Date Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const now = new Date().toISOString();

    const [totalProjects, totalTasks, assignedTasks, doneTasks, pendingTasks] =
      await Promise.all([
        mongoose.model("Project").countDocuments({ tenantId }),
        Task.countDocuments({ tenantId }),
        Task.countDocuments({ tenantId, assignedTo: userId }),
        Task.countDocuments({ tenantId, status: "DONE" }),
        Task.countDocuments({
          tenantId,
          status: { $in: ["TODO", "IN_PROGRESS", "REVIEW"] },
        }),
      ]);

    const overdueTasks = await Task.countDocuments({
      tenantId,
      status: { $ne: "DONE" },
      dueDate: { $lt: now },
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        assignedTasks,
        doneTasks,
        pendingTasks,
        overdueTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignedTasks = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const tasks = await Task.find({ tenantId, assignedTo: userId })
      .populate("projectId", "name")
      .sort({ dueDate: 1 })
      .limit(10);

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
