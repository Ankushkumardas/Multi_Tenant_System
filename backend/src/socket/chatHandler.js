import ChatParticpant from "../models/ChatUserSchema.js";
import Message from "../models/MessageSchema.js";
import { extractMentions } from "../utils/extractMentions.js";
import User from "../models/UserSchema.js";
import { createNotification } from "../service/notification.js";

export const registerChatHandler = async (io, socket) => {
  const userId = socket.userId;
  const tenantId = socket.tenantId;
  const userRole = socket.userRole;
  const user = socket.user;
  //join all chat rooms user belongs too
  const memberships = await ChatParticpant.find({ userId: userId });
  memberships.forEach((membership) => {
    socket.join(membership.chatRoomId.toString());
  });

  //send message
  socket.on("sendMessage", async (data) => {
    const { chatRoomId, content } = data;
    const mentions = extractMentions(content);
    const mentionedUsers = await User.find({ name: { $in: mentions } });
    const message = await Message.create({
      tenantId: tenantId,
      chatRoomId: chatRoomId,
      content: content,
      senderId: userId,
      readBy: [userId],
      deletedFor: [],
      mentions: mentionedUsers.map((u) => u._id),
    });
    io.to(chatRoomId).emit("newMessage", message);

    //notify user taht they are been mebtioned
    mentionedUsers.map((m) => {
      createNotification(io, {
        userId: m._id,
        type: "MENTION",
        message: `${user.name} mentioned you in ${chatRoomId}`,
        tenantId: tenantId,
      });
    });

    //notify all other participants in the room
    const otherParticipants = await ChatParticpant.find({
      chatRoomId: chatRoomId,
      userId: { $ne: userId },
    });

    otherParticipants.forEach((p) => {
      const isMentioned = mentionedUsers.some(
        (m) => m._id.toString() === p.userId.toString(),
      );
      if (!isMentioned) {
        createNotification(io, {
          userId: p.userId,
          type: "MESSAGE",
          message: `New message from ${user.name}`,
          tenantId: tenantId,
        });
      }
    });
  });

  //mark as read
  socket.on("markAsRead", async (data) => {
    const { chatRoomId } = data;
    await Message.updateMany(
      { chatRoomId: chatRoomId, readBy: { $ne: userId } },
      {
        $push: { readBy: userId },
      },
    );
    io.to(chatRoomId).emit("messageRead", { userId, chatRoomId });
  });
  //
};
