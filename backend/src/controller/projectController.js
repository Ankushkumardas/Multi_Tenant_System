import Project from "../models/ProjectSchema.js";
import { eventBus } from "../service/EventBus.js";
import User from "../models/UserSchema.js";

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
    res.status(200).json({ message: "Project archived successfully", project });
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
