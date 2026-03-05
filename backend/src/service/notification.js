import { redisClient } from "../utils/redis.js";
import Notification from "../models/NotificationSchema.js";

export const createNotification = async (
  reqOrIo,
  { tenantId, userId, title, type, message },
) => {
  const io = reqOrIo.app ? reqOrIo.app.get("io") : reqOrIo;

  // 1️⃣ Set default title if missing
  const finalTitle =
    title ||
    (type === "MENTION"
      ? "New Mention"
      : type === "MESSAGE"
        ? "New Message"
        : "System Notification");

  // 2️⃣ Save in MongoDB
  const notification = await Notification.create({
    tenantId,
    userId,
    title: finalTitle,
    type,
    message,
  });

  // 3️⃣ Increase unread count in Redis
  let unreadCount = 0;
  try {
    if (redisClient.raw && redisClient.raw.isOpen) {
      await redisClient.incr(`notification:unread:${userId}`);
      const count = await redisClient.get(`notification:unread:${userId}`);
      unreadCount = parseInt(count) || 0;
    }
  } catch (err) {
    console.warn("Redis notification count skip:", err.message);
  }

  // 4️⃣ Emit real-time update
  try {
    io.to(userId.toString()).emit("newnotification", {
      notification,
      unreadCount,
    });
  } catch (err) {
    console.error("Socket emission failed:", err.message);
  }

  return notification;
};
