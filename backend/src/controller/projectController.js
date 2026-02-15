import Project from "../models/ProjectSchema.js";
import { eventBus } from "../service/EventBus.js";
import User from "../models/UserSchema.js";
import ProjectMember from "../models/projectMembersSchema.js";
import ChatRoom from "../models/ChatRoomSchema.js";
import ChatParticipant from "../models/ChatUserSchema.js";
import Section from "../models/SectionSchema.js";

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const owner = req.user.userId;
    const user = await User.findOne({ _id: owner }).populate("tenantId");
    const project = await Project.create({
      name,
      description,
      ownerId: owner,
      tenantId: user.tenantId,
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
        tenantId: user.tenantId,
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
    //emit event,
    eventBus.emit("PROJECT_CREATED", {
      userId: owner,
      projectId: project._id,
      tenantId: user.tenantId,
    });
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const owner = req.user.userId;
    const tenantId = req.user.tenantId;
    const projects = await Project.find({
      ownerId: owner,
      tenantId: tenantId,
      status: "ACTIVE",
    }).sort({ createdAt: -1 });
    res
      .status(200)
      .json({ message: "Projects fetched successfully", projects });
  } catch (error) {
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

    res.status(200).json({ message: "Project archived successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggelArchiver = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    project.status = project.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    await project.save();
    eventBus.emit(`PROJECT_${project.status}`, {
      userId: req.user.userId,
      projectId: project._id,
      tenantId: req.user.tenantId,
    });
    res.status(200).json({ message: "Project toggled successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const owner = req.user.userId;
    const tenantId = req.user.tenantId;
    const project = await Project.findOne({
      _id: projectId,
      ownerId: owner,
      tenantId: tenantId,
    });
    res.status(200).json({ message: "Project fetched successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    const owner = req.user.userId;
    const tenantId = req.user.tenantId;
    const project = await Project.findOneAndUpdate(
      { _id: projectId, ownerId: owner, tenantId: tenantId },
      { name, description },
      { new: true },
    );
    eventBus.emit("PROJECT_UPDATED", {
      userId: owner,
      projectId: project._id,
      tenantId: tenantId,
    });
    res.status(200).json({ message: "Project updated successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const owner = req.user.userId;
    const tenantId = req.user.tenantId;
    const project = await Project.findByIdAndDelete({
      _id: projectId,
      ownerId: owner,
      tenantId: tenantId,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.status === "ARCHIVED") {
      return res.status(403).json({
        message: "Archived project cannot be deleted",
      });
    }
    eventBus.emit("PROJECT_DELETED", {
      userId: owner,
      projectId: project._id,
      tenantId: tenantId,
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
    if (user.tenantId !== tenantId) {
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
    if (existingMember) {
      return res.status(400).json({ message: "User is already a member" });
    }
    const projectMember = await ProjectMember.create({
      tenantId,
      projectId,
      userId,
      role: user.role,
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
        userId: userId,
      });
      if (!existingParticipant) {
        await ChatParticipant.create({
          chatRoomId: chatRoom._id,
          userId: userId,
        });
      }
    }
    eventBus.emit("MEMBER_ADDED", {
      userId: req.user.userId,
      projectId: project._id,
      tenantId: tenantId,
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
    if (user.tenantId !== tenantId) {
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
      tenantId: tenantId,
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
    if (user.tenantId !== tenantId) {
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
      tenantId: tenantId,
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
      tenantId: tenantId,
    });
    res
      .status(200)
      .json({ message: "Member removed successfully", projectMembers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
