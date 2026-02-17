import ChatParticpant from "../models/ChatUserSchema.js";
import ChatRoom from "../models/ChatRoomSchema.js";
import Message from "../models/MessageSchema.js";

export const getUserRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    const memberships = await ChatParticpant.find({ userId: userId });
    const roomIds = memberships.map((m) => m.chatRoomId);
    const rooms = await ChatRoom.find({ _id: { $in: roomIds } });
    res.status(200).json({ message: "User rooms", rooms });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const messages = await Message.find({ chatRoomId: chatRoomId })
      .sort({
        createdAt: -1,
      })
      .populate("senderId");
    res.status(200).json({ message: "User messages", messages });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
