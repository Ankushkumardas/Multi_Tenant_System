import ActivityLog from "../models/ActivityLogSchema.js";
import mongoose from "mongoose";

export const getTenantActitvity = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  try {
    const { tenantId } = req.user;
    const activities = await ActivityLog.find({ tenantId })
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("userId");
    res.status(200).json({ activities });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const activity = await ActivityLog.find({
      projectId: projectId,
      tenantId: req.user.tenantId,
    }).sort({ createdAt: -1 });
    res.status(200).json({ activity });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const UserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const activity = await ActivityLog.find({
      userId: userId,
      tenantId: req.user.tenantId,
    }).sort({ createdAt: -1 });
    res.status(200).json({ activity });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTaskActivity = async (req, res) => {
  try {
    const { taskId } = req.params;
    const activity = await ActivityLog.find({
      entityId: taskId,
      entityType: "Task",
      tenantId: req.user.tenantId,
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ activity });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getActivityStats = async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(req.user.tenantId) } },
      { $group: { _id: "$actionType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ stats });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Task Activity Chart ────────────────────────────────────────────────────────
// Returns per-day counts for the last N days, broken down by task-related actionTypes
export const getTaskActivityChart = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const days = parseInt(req.query.days) || 14;

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const TASK_ACTIONS = [
      "TASK_CREATED",
      "TASK_UPDATED",
      "TASK_DELETED",
      "TASK_ASSIGNED",
      "TASK_STATUS_CHANGED",
      "TASK_PRIORITY_CHANGED",
      "TASK_DUE_DATE_CHANGED",
    ];

    // daily breakdown per actionType
    const raw = await ActivityLog.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          actionType: { $in: TASK_ACTIONS },
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            actionType: "$actionType",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // totals per actionType
    const totals = await ActivityLog.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          actionType: { $in: TASK_ACTIONS },
        },
      },
      { $group: { _id: "$actionType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ daily: raw, totals });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
