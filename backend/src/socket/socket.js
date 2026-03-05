import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";
import ChatParticipant from "../models/ChatUserSchema.js";
import { registerChatHandler } from "./chatHandler.js";
import { registerOnlineUsersHandler } from "./onlineUsers.js";
import { registerTypingHandler } from "./typingHandler.js";

let io;
export const setupSocket = (server, app) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:5175",
        "http://localhost:5176",
        process.env.FRONTEND_URL,
      ],
      credentials: true,
    },
  });

  //auth middlware fro socket connection with token from frontend to verify the identity of teh logged in user
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("In socket connection Unauthorized"));
      }
      const decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decode.userId.toString());
      if (!user) {
        return next(new Error("In socket connection Unauthorized"));
      }
      socket.userId = user._id;
      socket.tenantId = user.tenantId;
      socket.userRole = user.role;
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error("In socket connection Unauthorized"));
    }
  });

  //socket connection
  io.on("connection", async (socket) => {
    const userId = socket.userId;
    socket.join(userId.toString());
    console.log("User connected:", userId.toString());

    const memberships = await ChatParticipant.find({ userId: userId });
    memberships.forEach((membership) => {
      socket.join(membership.chatRoomId.toString());
    });

    //register handlers
    registerChatHandler(io, socket);
    registerOnlineUsersHandler(io, socket);
    registerTypingHandler(io, socket);
    //
    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
    });
  });

  // Make io globally available like set and get in redis setting under "req" key valye pair
  app.set("io", io);

  return io;
};
