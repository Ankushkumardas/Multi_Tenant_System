import { redisClient } from "../utils/redis.js";
import Notification from "../models/NotificationSchema.js";

export const createNotification = async (
  req,
  { tenantId, userId, title, type, message },
) => {
  const io = req.app.get("io");
  //save in mibgodb
  const notification = await Notification.create({
    tenantId,
    userId,
    title,
    type,
    message,
  });
  // 2️⃣ Increase unread count in Redis
  await redisClient.incr(`notification:unread:${userId}`);

  //get updated count
  const unreadCount = await redisClient.get(`notification:unread:${userId}`);

  //emit to user
  io.to(userId.toString()).emit("newnotification", {
    notification,
    unreadCount,
  });
  return notification;
};
