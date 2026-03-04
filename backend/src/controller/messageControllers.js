import Message from "../models/MessageSchema.js";

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const message = await Message.findOneAndUpdate(
      { _id: messageId, senderId: req.user.userId },
      { content: content, isEdited: true },
      { new: true },
    ).populate("senderId", "name email");

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found or unauthorized" });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(message.chatRoomId.toString()).emit("messageUpdated", message);
    }

    res.status(200).json({ message: "Message edited", message });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findOne({
      _id: messageId,
      senderId: req.user.userId,
    });

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found or unauthorized" });
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get("io");
    if (io) {
      io.to(message.chatRoomId.toString()).emit("messageDeleted", {
        messageId,
        chatRoomId: message.chatRoomId,
      });
    }

    res.status(200).json({ message: "Message deleted for everyone" });
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

    const populatedMessage = await Message.findById(message._id).populate(
      "senderId",
      "name email",
    );
    const io = req.app.get("io");
    if (io) {
      io.to(parentMessage.chatRoomId.toString()).emit(
        "newMessage",
        populatedMessage,
      );
    }

    res
      .status(200)
      .json({ message: "Message replied", message: populatedMessage });
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

export const forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { targetRoomId } = req.body;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: "Original message not found" });
    }

    const newMessage = await Message.create({
      tenantId: req.user.tenantId,
      chatRoomId: targetRoomId,
      senderId: req.user.userId,
      content: originalMessage.content,
      isForwarded: true,
      forwardedFrom: originalMessage.senderId,
      readBy: [req.user.userId],
    });

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "name email",
    );
    const io = req.app.get("io");
    if (io) {
      io.to(targetRoomId.toString()).emit("newMessage", populatedMessage);
    }

    res
      .status(201)
      .json({ message: "Message forwarded", newMessage: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//@username fucntionality
