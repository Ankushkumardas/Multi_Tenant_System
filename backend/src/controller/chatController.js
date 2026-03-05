import ChatParticipant from "../models/ChatUserSchema.js";
import ChatRoom from "../models/ChatRoomSchema.js";
import Message from "../models/MessageSchema.js";

//when user sees teh sidebar for all teh rooms group san conversations he has with other users
export const getUserRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    const memberships = await ChatParticipant.find({ userId: userId });
    const roomIds = memberships.map((m) => m.chatRoomId);
    const rooms = await ChatRoom.find({ _id: { $in: roomIds } }).lean();

    // Fetch unread counts and participants in bulk
    const [unreadCounts, allParticipants] = await Promise.all([
      Message.aggregate([
        {
          $match: {
            chatRoomId: { $in: roomIds },
            readBy: { $ne: userId },
            deletedFor: { $ne: userId },
          },
        },
        { $group: { _id: "$chatRoomId", count: { $sum: 1 } } },
      ]),
      ChatParticipant.find({ chatRoomId: { $in: roomIds } }).lean(),
    ]);

    const unreadMap = unreadCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const participantMap = allParticipants.reduce((acc, curr) => {
      const rid = curr.chatRoomId.toString();
      if (!acc[rid]) acc[rid] = [];
      acc[rid].push(curr.userId.toString());
      return acc;
    }, {});

    const roomsWithExtra = rooms.map((room) => ({
      ...room,
      unreadCount: unreadMap[room._id.toString()] || 0,
      participantIds: participantMap[room._id.toString()] || [],
    }));

    res.status(200).json({ message: "User rooms", rooms: roomsWithExtra });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    await Message.updateMany(
      { chatRoomId: roomId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    // Optional: emit a "readReceipt" event to other users in the room
    const io = req.app.get("io");
    if (io) {
      io.to(roomId).emit("messagesRead", { roomId, userId });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//get single room details
export const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findOne({
      _id: roomId,
      tenantId: req.user.tenantId,
    });
    const participants = await ChatParticipant.find({
      chatRoomId: roomId,
    }).populate("userId", "name email role profileImage");
    res.status(200).json({ message: "Room details", room, participants });
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
    await ChatParticipant.deleteMany({
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
    const participant = await ChatParticipant.deleteOne({
      chatRoomId: roomId,
      userId: req.user.userId,
    });
    res.status(200).json({ message: "User Left Room", participant });
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

    const existing = await ChatParticipant.findOne({
      chatRoomId: roomId,
      userId,
    });
    if (existing) {
      return res.status(400).json({ message: "User already in room" });
    }

    const participant = await ChatParticipant.create({
      chatRoomId: roomId,
      userId: userId,
    });
    res.status(200).json({ message: "Participant added", participant });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//remove participant
export const removeParticipant = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const participant = await ChatParticipant.deleteOne({
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
    await ChatParticipant.insertMany(
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

export const getOrCreateDM = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId;

    // Find all DIRECT rooms the current user is in
    const currentUserDirectMemberships = await ChatParticipant.find({
      userId: currentUserId,
    })
      .populate({
        path: "chatRoomId",
        match: { type: "DIRECT", tenantId: req.user.tenantId },
      })
      .lean();

    // Filter out memberships where the room didn't match the DIRECT type
    const directRoomIds = currentUserDirectMemberships
      .filter((m) => m.chatRoomId)
      .map((m) => m.chatRoomId._id);

    // Now find if the target user is in any of these DIRECT rooms
    const commonMembership = await ChatParticipant.findOne({
      userId: targetUserId,
      chatRoomId: { $in: directRoomIds },
    }).lean();

    if (commonMembership) {
      // Find the room object again since we only have the ID from membership if lean()
      const roomToReturn = await ChatRoom.findById(
        commonMembership.chatRoomId,
      ).lean();

      if (roomToReturn) {
        const participants = await ChatParticipant.find({
          chatRoomId: roomToReturn._id,
        }).lean();
        const participantIds = participants.map((p) => p.userId.toString());

        return res.status(200).json({
          room: {
            ...roomToReturn,
            participantIds,
          },
        });
      }
    }

    // If not found, create new DM room
    const targetUser = await (
      await import("../models/UserSchema.js")
    ).default.findById(targetUserId);
    const room = await ChatRoom.create({
      name: targetUser?.name || "Direct Message",
      tenantId: req.user.tenantId,
      type: "DIRECT",
      createdBy: currentUserId,
    });

    await ChatParticipant.insertMany([
      { chatRoomId: room._id, userId: currentUserId },
      { chatRoomId: room._id, userId: targetUserId },
    ]);

    res.status(200).json({
      room: {
        ...room.toObject(),
        participantIds: [currentUserId.toString(), targetUserId.toString()],
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Find all rooms for the user
    const memberships = await ChatParticipant.find({ userId: userId }).lean();
    const roomIds = memberships.map((m) => m.chatRoomId);

    await Message.updateMany(
      {
        chatRoomId: { $in: roomIds },
        tenantId: tenantId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      },
    );

    res.status(200).json({ message: "All messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
