//using redis to make a custom middleware for rate limiting
import { redisClient } from "../utils/redis.js";

export const rateLimiter = ({
  keyPrefix,
  limit,
  windowsize,
  identifier = "ip",
}) => {
  return async (req, res, next) => {
    try {
      let id;
      if (identifier === "ip") {
        id = req.ip;
      }
      if (identifier === "email") {
        id = req.body.email;
      }
      if (identifier === "userId") {
        if (!req.user) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        id = req.user.userId;
      }
      if (!id) {
        return res.status(400).json({ message: "Invalid identifier" });
      }
      const rediskey = `rate:${keyPrefix}:${id}`;
      const count = await redisClient.incr(rediskey);
      if (count === 1) {
        await redisClient.expire(rediskey, windowsize);
      }
      if (count > limit) {
        return res.status(429).json({ message: "Too many requests" });
      }
      next();
    } catch (error) {
      console.log(error);
      next();
    }
  };
};
