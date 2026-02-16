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
    const task = await Task.findByIdAndUpdate(
      { _id: taskId, tenantId },
      { assignedTo },
      { new: true },
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    //notify to assined memeebrs
    for (const userId of assignedTo) {
      await createNotification(req, {
        type: "ASSIGN_TASK",
        targetId: taskId,
        targetType: "TASK",
        message: `${req.user.name} assigned you a task`,
        userId: userId,
      });
    }
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
    res.status(200).json({
      success: true,
      task,
      message: "Task Due Date Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
