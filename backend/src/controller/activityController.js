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

export const getActivityStats = async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(req.user.tenantId) } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ stats });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
