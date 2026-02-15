import Task from "../models/TaskSchema.js";

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
    res
      .status(201)
      .json({ success: true, task, message: "Task Created Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
