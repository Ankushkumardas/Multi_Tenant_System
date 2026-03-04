import mongoose from "mongoose";
import Project from "../models/ProjectSchema.js";
import { eventBus } from "../service/EventBus.js";
import User from "../models/UserSchema.js";
import ProjectMember from "../models/projectMembersSchema.js";
import ChatRoom from "../models/ChatRoomSchema.js";
import ChatParticipant from "../models/ChatUserSchema.js";
import Section from "../models/SectionSchema.js";
import Task from "../models/TaskSchema.js";
import { saveAuditLog, saveActivityLog } from "../service/auditLogger.js";

export const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;
    const owner = req.user.userId;
    const user = await User.findOne({ _id: owner });
    const tenantId = user.tenantId;
    const project = await Project.create({
      name,
      description,
      ownerId: owner,
      tenantId,
      startDate,
      endDate,
      status,
    });

    // Create Default Sections
    const defaultSections = [
      { name: "Todo", order: 1 },
      { name: "In Progress", order: 2 },
      { name: "Review", order: 3 },
      { name: "Done", order: 4 },
    ];

    await Section.insertMany(
      defaultSections.map((section) => ({
        ...section,
        projectId: project._id,
        tenantId,
      })),
    );

    //by default we will create a respective project chat room
    const chatRoom = await ChatRoom.create({
      name: `${project.name} - General`,
      type: "PROJECT",
      projectId: project._id,
      tenantId: user.tenantId,
      createdBy: owner,
    });

    // Create Project Member for Owner
    await ProjectMember.create({
      tenantId: user.tenantId,
      projectId: project._id,
      userId: owner,
      role: "OWNER",
    });

    // Add Owner to Chat Participants
    await ChatParticipant.create({
      chatRoomId: chatRoom._id,
      userId: owner,
    });
    eventBus.emit("PROJECT_CREATED", {
      userId: owner,
      projectId: project._id,
      tenantId: user.tenantId,
    });
    saveAuditLog({
      tenantId: user.tenantId,
      actorUserId: owner,
      action: "PROJECT_CREATED",
      metadata: { projectId: project._id, name },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId: user.tenantId,
      userId: owner,
      actionType: "PROJECT_CREATED",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
      details: { name },
    });
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const { userId, tenantId, role } = req.user;

    let projectIds;

    if (role === "OWNER" || role === "ADMIN") {
      const projects = await Project.find({ tenantId });
      projectIds = projects.map((p) => p._id);
    } else {
      const memberships = await ProjectMember.find({ userId, tenantId });
      projectIds = memberships.map((m) => m.projectId);
    }

    const projectsWithStats = await Project.aggregate([
      {
        $match: {
          _id: { $in: projectIds },
          tenantId: new mongoose.Types.ObjectId(tenantId),
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "projectId",
          as: "tasks",
        },
      },
      {
        $lookup: {
          from: "projectmembers",
          localField: "_id",
          foreignField: "projectId",
          as: "members",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          ownerId: 1,
          tenantId: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          totalTasks: { $size: "$tasks" },
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "DONE"] },
              },
            },
          },
          membersCount: { $size: "$members" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({
      message: "Projects fetched successfully",
      projects: projectsWithStats,
    });
  } catch (error) {
    console.error("GetMyProjects Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const archiveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByIdAndUpdate(
      projectId,
      { status: "ARCHIVED" },
      { new: true },
    );
    eventBus.emit("PROJECT_ARCHIVED", {
      userId: req.user.userId,
      projectId: project._id,
      tenantId: req.user.tenantId,
    });
    saveAuditLog({
      tenantId: req.user.tenantId,
      actorUserId: req.user.userId,
      action: "PROJECT_ARCHIVED",
      metadata: { projectId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      actionType: "PROJECT_ARCHIVED",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
    });
    res.status(200).json({ message: "Project archived successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggelArchiver = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId, userId } = req.user;

    const project = await Project.findOne({ _id: projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.status = project.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    await project.save();

    eventBus.emit(`PROJECT_${project.status}`, {
      userId,
      projectId: project._id,
      tenantId,
    });

    saveAuditLog({
      tenantId,
      actorUserId: userId,
      action: `PROJECT_${project.status}`,
      metadata: { projectId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    saveActivityLog({
      tenantId,
      userId,
      actionType: `PROJECT_${project.status}`,
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
    });

    res.status(200).json({ message: "Project toggled successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    // Verify first that the project belongs to the tenant
    const project = await Project.findOne({ _id: projectId, tenantId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project fetched successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, startDate, endDate, status } = req.body;
    const { tenantId } = req.user;

    const project = await Project.findOneAndUpdate(
      { _id: projectId, tenantId },
      { name, description, startDate, endDate, status },
      { new: true },
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    eventBus.emit("PROJECT_UPDATED", {
      userId: req.user.userId,
      projectId: project._id,
      tenantId,
    });

    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "PROJECT_UPDATED",
      metadata: { projectId, name, description, status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "PROJECT_UPDATED",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
      details: { name, description, status },
    });

    res.status(200).json({ message: "Project updated successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, tenantId } = req.user;

    const project = await Project.findOneAndDelete({
      _id: projectId,
      tenantId: tenantId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Optional: Only allow deleting if not archived (logic from original code)
    // Note: findOneAndDelete already removed it, so this check is a bit late.
    // Better to find, check, then delete.

    eventBus.emit("PROJECT_DELETED", {
      userId,
      projectId: project._id,
      tenantId,
    });

    saveAuditLog({
      tenantId,
      actorUserId: userId,
      action: "PROJECT_DELETED",
      metadata: { projectId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    saveActivityLog({
      tenantId,
      userId,
      actionType: "PROJECT_DELETED",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
    });

    res.status(200).json({ message: "Project deleted successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMemberToProject = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { projectId } = req.params;
    const { userId, email } = req.body;

    const project = await Project.findOne({ _id: projectId, tenantId });
    if (!project) {
      console.log(
        `[AddMember] Project not found: ${projectId} for tenant ${tenantId}`,
      );
      return res
        .status(404)
        .json({ message: "Project not found or access denied" });
    }

    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email, tenantId });
    }

    if (!targetUser) {
      return res.status(400).json({
        message: "User not found. Please invite them to the workspace first.",
      });
    }

    if (targetUser.tenantId.toString() !== tenantId.toString()) {
      return res
        .status(403)
        .json({ message: "User is not in the same tenant" });
    }

    //check if user is already a member
    const existingMember = await ProjectMember.findOne({
      tenantId,
      projectId,
      userId: targetUser._id,
    });
    if (existingMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const projectMember = await ProjectMember.create({
      tenantId,
      projectId,
      userId: targetUser._id,
      role: targetUser.role,
    });

    // Add to Default Project Chat Room
    const chatRoom = await ChatRoom.findOne({
      projectId: project._id,
      type: "PROJECT",
      tenantId: tenantId,
    });
    if (chatRoom) {
      // Check if already a participant to avoid duplicates (though index handles unique)
      const existingParticipant = await ChatParticipant.findOne({
        chatRoomId: chatRoom._id,
        userId: targetUser._id,
      });
      if (!existingParticipant) {
        await ChatParticipant.create({
          chatRoomId: chatRoom._id,
          userId: targetUser._id,
        });
      }
    }
    eventBus.emit("MEMBER_ADDED", {
      userId: req.user.userId,
      projectId: project._id,
      tenantId,
    });
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "MEMBER_ADDED",
      metadata: { projectId, userId: targetUser._id },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "MEMBER_ADDED",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
      details: { addedUserId: targetUser._id },
    });
    res
      .status(200)
      .json({ message: "Member added successfully", projectMember });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeMemberFromProject = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { projectId } = req.params;
    const { userId } = req.body;
    const project = await Project.findOne({
      _id: projectId,
      tenantId: tenantId,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.tenantId.toString() !== tenantId.toString()) {
      return res
        .status(403)
        .json({ message: "User is not in the same tenant" });
    }
    //check if user is already a member
    const existingMember = await ProjectMember.findOne({
      tenantId,
      projectId,
      userId,
    });
    if (!existingMember) {
      return res.status(400).json({ message: "User is not a member" });
    }
    const projectMember = await ProjectMember.findByIdAndDelete({
      _id: existingMember._id,
      tenantId,
      projectId,
      userId,
    });

    // Remove from Default Project Chat Room
    const chatRoom = await ChatRoom.findOne({
      projectId: project._id,
      type: "PROJECT",
      tenantId: tenantId,
    });
    if (chatRoom) {
      await ChatParticipant.findOneAndDelete({
        chatRoomId: chatRoom._id,
        userId: userId,
      });
    }
    eventBus.emit("MEMBER_REMOVED", {
      userId: req.user.userId,
      projectId: project._id,
      tenantId,
    });
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "MEMBER_REMOVED",
      metadata: { projectId, userId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "MEMBER_REMOVED",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
      details: { removedUserId: userId },
    });
    res
      .status(200)
      .json({ message: "Member removed successfully", projectMember });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectMembers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { projectId } = req.params;
    const project = await Project.findOne({
      _id: projectId,
      tenantId: tenantId,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const projectMembers = await ProjectMember.find({
      tenantId,
      projectId,
    }).populate("userId", "name email role");
    res.status(200).json({
      message: "Project members fetched successfully",
      projectMembers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateprojectMemberRole = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { projectId } = req.params;
    const { userId, role } = req.body;
    const project = await Project.findOne({
      _id: projectId,
      tenantId: tenantId,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.tenantId.toString() !== tenantId.toString()) {
      return res
        .status(403)
        .json({ message: "User is not in the same tenant" });
    }
    //check if user is already a member
    const existingMember = await ProjectMember.findOne({
      tenantId,
      projectId,
      userId,
    });
    if (!existingMember) {
      return res.status(400).json({ message: "User is not a member" });
    }
    const projectMember = await ProjectMember.findOneAndUpdate(
      { _id: existingMember._id, tenantId, projectId, userId },
      { role },
      { new: true },
    );
    eventBus.emit("MEMBER_ROLE_UPDATED", {
      userId: req.user.userId,
      projectId: project._id,
      tenantId,
    });
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "MEMBER_ROLE_UPDATED",
      metadata: { projectId, userId, role },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "MEMBER_ROLE_UPDATED",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
      details: { targetUserId: userId, role },
    });
    res
      .status(200)
      .json({ message: "Member role updated successfully", projectMember });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const Leaveproject = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { projectId } = req.params;
    const project = await Project.findOne({
      _id: projectId,
      tenantId: tenantId,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const projectMembers = await ProjectMember.findOne({
      tenantId,
      projectId,
      userId: req.user.userId,
    });
    if (!projectMembers) {
      return res.status(400).json({ message: "User is not a member" });
    }
    if (projectMembers.role === "OWNER") {
      return res
        .status(400)
        .json({ message: "Owner cannot leave the project" });
    }
    await ProjectMember.findByIdAndDelete({
      _id: projectMembers._id,
      tenantId,
      projectId,
      userId: req.user.userId,
    });

    // Remove from Default Project Chat Room
    const chatRoom = await ChatRoom.findOne({
      projectId: project._id,
      type: "PROJECT",
      tenantId: tenantId,
    });
    if (chatRoom) {
      await ChatParticipant.findOneAndDelete({
        chatRoomId: chatRoom._id,
        userId: req.user.userId,
      });
    }
    eventBus.emit("MEMBER_REMOVED", {
      userId: req.user.userId,
      projectId: project._id,
      tenantId,
    });
    saveAuditLog({
      tenantId,
      actorUserId: req.user.userId,
      action: "PROJECT_LEFT",
      metadata: { projectId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    saveActivityLog({
      tenantId,
      userId: req.user.userId,
      actionType: "PROJECT_LEFT",
      entityId: project._id,
      entityType: "Project",
      projectId: project._id,
    });
    res
      .status(200)
      .json({ message: "Member removed successfully", projectMembers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Project Stats ─────────────────────────────────────────────────────────────
export const getProjectStats = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    const project = await Project.findOne({
      _id: projectId,
      tenantId,
    }).populate("ownerId", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });

    // members with user details
    const membersRaw = await ProjectMember.find({
      projectId,
      tenantId,
    }).populate("userId", "name email role");

    // tasks
    const tasks = await Task.find({ projectId, tenantId });

    // status breakdown
    const statusCounts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    let overdue = 0;
    const now = new Date();

    for (const t of tasks) {
      if (t.status) statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      if (t.priority)
        priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE")
        overdue++;
    }

    // role breakdown
    const roleCounts = {};
    for (const m of membersRaw) {
      const r = m.role || "USER";
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }

    // sections
    const sections = await Section.find({ projectId, tenantId });

    return res.status(200).json({
      project,
      stats: {
        totalTasks: tasks.length,
        totalMembers: membersRaw.length,
        totalSections: sections.length,
        overdueTasks: overdue,
        statusCounts,
        priorityCounts,
        roleCounts,
      },
      members: membersRaw,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
