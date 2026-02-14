import Project from "../models/ProjectSchema.js";
import { eventBus } from "../service/EventBus.js";

export const craeteProject = async (req, res) => {
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

export const getMyProject = async (req, res) => {
  try {
    const owner = req.user.userId;
    const projects = await Project.find({ ownerId: owner });
    res
      .status(200)
      .json({ message: "Projects fetched successfully", projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
