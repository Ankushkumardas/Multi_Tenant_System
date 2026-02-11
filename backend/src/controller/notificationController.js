//this controler code to make mark teh notificaton as read

// Why This Is Powerful
// Feature	                Mongo Only	  Mongo + Redis + Socket
// Save notifications	    ✅	            ✅
// Real-time update	        ❌	            ✅
// Fast unread count	    ❌	            ✅
// Scalable multi-server	❌	            ✅

import Notification from "../models/notificationModel.js";
import { redisClient } from "../utils/redis.js";

export const markAsRead = async (req, res) => {
  const { id } = req.params; //will get teh notofication id from url
  const userId = req.user.id; //will get teh user id from auth middleware
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      res.status(404).json({ message: "Not founf notification" });
    }
    //decrease unread count
    await redisClient.decr(`notification:unread:${userId}`);
    const unreadCount = await redisClient.get(`notification:unread:${userId}`);
    res.status(200).json({
      message: "Notification marked as read",
      unreadCount,
      notification,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  try {
    const unreadCount = await redisClient.get(`notification:unread:${userId}`);
    //if counts is not found is redis look in teh mongidb in fallback
    if (!unreadCount) {
      const count = await Notification.countDocuments({
        userId,
        isRead: false,
      });
      //thenset teh unread notifcation back to teh redis cache
      await redisClient.set(`notification:unread:${userId}`, count);
      return res.status(200).json({ unreadCount: count });
    }
    res.status(200).json({ unreadCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllNotifications = async (req, res) => {
  const { userId } = req.user;
  try {
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllAsRead = async (req, res) => {
  const { userId } = req.user;
  try {
    await Notification.updateMany({ userId }, { isRead: true });
    await redisClient.set(`notification:unread:${userId}`, 0);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};