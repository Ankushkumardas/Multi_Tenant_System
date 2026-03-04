import Audit from "../models/AuditSchema.js";
import mongoose from "mongoose";

export const getTenantAuditLogs = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 20, actorUserId, action } = req.query;

    console.log("Fetching audit logs:", { tenantId, page, limit, actorUserId, action });

    const filter = { tenantId };
    if (actorUserId) filter.actorUserId = actorUserId;
    if (action) filter.action = action;

    const logs = await Audit.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .populate("actorUserId", "name email");

    const total = await Audit.countDocuments(filter);

    res
      .status(200)
      .json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAuditStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    console.log("Fetching audit stats for tenant:", tenantId);

    const stats = await Audit.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ stats });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAuditByUser = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const logs = await Audit.find({ tenantId, actorUserId: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .populate("actorUserId", "name email");

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
