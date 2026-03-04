import Message from "../models/MessageSchema.js";

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const { tenantId } = req.user;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { content: content, isEdited: true },
      { new: true },
    );
    res.status(200).json({ message: "Message edited", message });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//soft deet for one user in deleetdFor
export const deleteMessageFor = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Message.findByIdAndUpdate(messageId, {
      $push: { deletedFor: req.user.userId },
    });
    res.status(200).json({ message: "Message deleted for you" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Message.findByIdAndUpdate(messageId, {
      $set: { isPinned: true },
    });
    res.status(200).json({ message: "Message pinned" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Message.findByIdAndUpdate(messageId, {
      $set: { isPinned: false },
    });
    res.status(200).json({ message: "Message unpinned" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchMessage = async (req, res) => {
  try {
    const { query } = req.query;
    const { tenantId } = req.user;
    const messages = await Message.find({
      tenantId: tenantId,
      content: { $regex: query, $options: "i" },
    }).populate("senderId", "name email");
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
//thread reply or forward message
export const replyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
      return res.status(404).json({ message: "Message not found" });
    }
    const message = await Message.create({
      tenantId: req.user.tenantId,
      chatRoomId: parentMessage.chatRoomId,
      content: content,
      senderId: req.user.userId,
      readBy: [req.user.userId],
      deletedFor: [],
      parentMessageId: messageId,
    });
    res.status(200).json({ message: "Message replied", message });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getThreadMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const replies = await Message.find({ parentMessageId: messageId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email");
    res.status(200).json({ replies });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//@username fucntionality
