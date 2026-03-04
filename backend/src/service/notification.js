import { redisClient } from "../utils/redis.js";
import Notification from "../models/NotificationSchema.js";

export const createNotification = async (
  reqOrIo,
  { tenantId, userId, title, type, message },
) => {
  const io = reqOrIo.app ? reqOrIo.app.get("io") : reqOrIo;
  //save in mibgodb
  const notification = await Notification.create({
    tenantId,
    userId,
    title,
    type,
    message,
  });
  // 2️⃣ Increase unread count in Redis (Resilient to Redis failures)
  let unreadCount = 0;
  try {
    if (redisClient.raw.isOpen) {
      await redisClient.incr(`notification:unread:${userId}`);
      const count = await redisClient.get(`notification:unread:${userId}`);
      unreadCount = parseInt(count) || 0;
    }
  } catch (err) {
    console.error("Redis notification error:", err.message);
  }

  // emit to user
  try {
    io.to(userId.toString()).emit("newnotification", {
      notification,
      unreadCount,
    });
  } catch (err) {
    console.error("Socket emission error:", err.message);
  }

  return notification;
};
