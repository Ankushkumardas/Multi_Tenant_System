export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, mentions } = req.body;
    const tenantId = req.tenantId;
    const userId = req.userId;
    const comment = await TaskComment.create({
      taskId,
      tenantId,
      userId,
      message,
      mentions,
    });
    //notify mentions user swith notification
    for (const userId of mentions) {
      await createNotification(req, {
        type: "COMMENT",
        targetId: taskId,
        targetType: "TASK",
        message: `${req.user.name} mentioned you in a comment`,
        userId: userId,
      });
    }
    res.status(201).json({ message: "Comment created successfully", comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const tenantId = req.user.tenantId;
    const comments = await TaskComment.find({ taskId, tenantId }).populate(
      "userId",
      "name email",
    );
    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const tenantId = req.user.tenantId;
    const comment = await TaskComment.findOneAndDelete({
      _id: commentId,
      taskId,
      tenantId,
    });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const { message, mentions } = req.body;
    const tenantId = req.user.tenantId;
    const comment = await TaskComment.findOneAndUpdate(
      { _id: commentId, taskId, tenantId },
      { message, mentions },
      { new: true },
    );
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment updated successfully", comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
