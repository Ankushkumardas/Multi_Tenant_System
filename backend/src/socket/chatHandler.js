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
    const mentionedUsers = await User.find({ username: { $in: mentions } });
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
      createNotification({
        userId: m._id,
        type: "MENTION",
        message: `${user.username} mentioned you in ${chatRoomId}`,
        tenantId: tenantId,
      });
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
