import Message from "../models/MessageSchema.js";

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.boby;
    const { tenantId } = req.user.tenantId;
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
    const { tenantId } = req.user.tenantId;
    const messages = await Message.find({
      tenantId: tenantId,
      content: { $regex: query, $options: "i" },
    });
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
