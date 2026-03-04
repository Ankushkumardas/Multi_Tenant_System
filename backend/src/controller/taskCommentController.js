import TaskComment from "../models/TaskCommentSchema.js";
import { createNotification } from "../service/notification.js";

export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, mentions = [], parentId = null } = req.body;
    const { tenantId, userId } = req.user;

    const comment = await TaskComment.create({
      taskId,
      tenantId,
      userId,
      message,
      mentions,
      parentId,
    });

    // Notify mentioned users
    if (mentions.length > 0) {
      for (const mentionUserId of mentions) {
        await createNotification(req, {
          tenantId,
          userId: mentionUserId,
          title: "New Mention",
          type: "COMMENT",
          message: `${req.user.name} mentioned you in a comment`,
        });
      }
    }

    // Populate user details before returning
    const populatedComment = await TaskComment.findById(comment._id).populate(
      "userId",
      "name email",
    );

    res
      .status(201)
      .json({
        message: "Comment created successfully",
        comment: populatedComment,
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId } = req.user;

    const comments = await TaskComment.find({ taskId, tenantId })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { tenantId, userId, role } = req.user;

    const comment = await TaskComment.findOne({ _id: commentId, tenantId });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only owner of the comment or Admin/Owner can delete it
    if (
      comment.userId.toString() !== userId.toString() &&
      !["OWNER", "ADMIN"].includes(role)
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this comment" });
    }

    await TaskComment.deleteOne({ _id: commentId });
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { message, mentions = [] } = req.body;
    const { tenantId, userId } = req.user;

    const comment = await TaskComment.findOneAndUpdate(
      { _id: commentId, userId, tenantId }, // Ensure user owns it
      { message, mentions },
      { new: true },
    ).populate("userId", "name email");

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comment not found or unauthorized" });
    }

    res.status(200).json({ message: "Comment updated successfully", comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
