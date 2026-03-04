import ChatParticpant from "../models/ChatUserSchema.js";
import ChatRoom from "../models/ChatRoomSchema.js";
import Message from "../models/MessageSchema.js";

//when user sees teh sidebar for all teh rooms group san conversations he has with other users
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

//get singke room details
export const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const rooms = await ChatRoom.find({
      _id: roomId,
      tenantId: req.user.tenantId,
    });
    const participants = await ChatParticpant({ chatRoomId: roomId }).populate(
      "userId",
    );
    res.status(200).json({ message: "Room details", rooms, participants });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//update room
export const UpdateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findByIdAndUpdate({ _id: roomId }, req.body, {
      new: true,
    });
    res.status(200).json({ message: "Room updated", room });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//delete room
export const DeleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findByIdAndDelete({
      _id: roomId,
      tenantId: req.user.tenantId,
    });
    await ChatParticpant.deleteMany({
      chatRoomId: roomId,
    });
    await Message.deleteMany({
      chatRoomId: roomId,
    });
    res.status(200).json({ message: "Room deleted", room });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//leave room
export const LeaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findByIdAndDelete({
      _id: roomId,
      tenantId: req.user.tenantId,
    });
    const participant = await ChatParticpant.deleteOne({
      chatRoomId: roomId,
      userId: req.user.userId,
    });
    res.status(200).json({ message: "User Left Room", room, participant });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//add participant
export const addParticipant = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const participant = await ChatParticpant.create({
      chatRoomId: roomId,
      userId: userId,
    });
    res.status(200).json({ message: "Participant added", participant });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//romeve particpant
export const removePartcipant = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const participant = await ChatParticpant.deleteOne({
      chatRoomId: roomId,
      userId: userId,
    });
    res.status(200).json({ message: "Participant removed", participant });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createRoom = async (req, res) => {
  const { name, participants, type, projectId } = req.body;
  try {
    const room = await ChatRoom.create({
      name,
      tenantId: req.user.tenantId,
      type,
      projectId,
    });

    const uniqueParticipantIds = [
      ...new Set([...participants, req.user.userId.toString()]),
    ];
    await ChatParticpant.insertMany(
      uniqueParticipantIds.map((pid) => ({
        chatRoomId: room._id,
        userId: pid,
      })),
    );
    res.status(200).json({ message: "Room created", room });
  } catch (error) {
    console.error("Create Room Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({
      chatRoomId: roomId,
      tenantId: req.user.tenantId,
      deletedFor: { $ne: req.user.userId },
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email");

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
