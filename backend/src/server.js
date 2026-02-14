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
    origin: "http://localhost:5173",
    credentials: true,
  },
});
// Make io globally available like set and get in redis setting under "req" key valye pair
app.set("io", io);

//socket io connect from backend
io.on("connection", (socket) => {
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
connectRedis();
connectDB();
scheduleCronJobs();
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
