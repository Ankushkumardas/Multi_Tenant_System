import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./utils/database.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { connectRedis } from "./utils/redis.js";
import notificationRoutes from "./routes/notificatioRoutes.js";
import { scheduleCronJobs } from "./service/cronjob.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import jwt from "jsonwebtoken";
import User from "./models/UserSchema.js";
dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});
//middleware for socket for vertify authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Unauthorized"));
  }
  const decode = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decode.userId);
  if (!user) {
    return next(new Error("Unauthorized"));
  }
  socket.userId = user._id;
  socket.tenantId = user.tenantId;
  socket.userRole = user.role;
  socket.user = user;
  next();
});
// Make io globally available like set and get in redis setting under "req" key valye pair
app.set("io", io);

//socket io connect from backend
io.on("connection", async (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(userId); // 👈 join room
  }
  console.log("User connected:", userId);

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
  });
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/projects", projectRoutes);
connectRedis();
connectDB();
scheduleCronJobs();
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
