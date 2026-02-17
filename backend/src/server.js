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
import ChatParticpant from "./models/ChatUserSchema.js";
import { setupSocket } from "./socket/socket.js";
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

//connectiing socket.io
setupSocket(server);
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
