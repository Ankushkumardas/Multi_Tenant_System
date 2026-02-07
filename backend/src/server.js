import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from 'socket.io';
import { connectDB } from "./utils/database.js";
import authRoutes from "./routes/authRoutes.js";
import { connectRedis } from "./utils/redis.js";
dotenv.config();

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("User disconnected");
    })
})

app.get("/", (req, res) => {
    res.send({ message: "Hello World!", status: "OK" });
})
app.use("/api/v1/auth", authRoutes)

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    connectDB();
    connectRedis();
});