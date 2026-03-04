import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
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
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import jwt from "jsonwebtoken";
import User from "./models/UserSchema.js";
import ChatParticpant from "./models/ChatUserSchema.js";
import activityRoutes from "./routes/activityRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import { setupSocket } from "./socket/socket.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);

//connectiing socket.io
setupSocket(server, app);
//routes

app.use("/api/auth", authRoutes);

// Example URL: /api/:slug/admin/projects
app.use("/api/:slug/admin", adminRoutes);
app.use("/api/:slug/user", userRoutes);
app.use("/api/:slug/notification", notificationRoutes);
app.use("/api/:slug/subscription", subscriptionRoutes);
app.use("/api/:slug/projects", projectRoutes);
app.use("/api/:slug/chat", chatRoutes);
app.use("/api/:slug/messages", messageRoutes);
app.use("/api/:slug/activity", activityRoutes);
app.use("/api/:slug/audit", auditRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/app/dist")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "../../frontend/app/dist", "index.html"),
    );
  });
}

connectRedis();
connectDB();
scheduleCronJobs();
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
