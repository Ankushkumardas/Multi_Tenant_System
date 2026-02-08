import { createClient } from "redis";
export const redisClient = createClient();

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Redis connected");
    }
};

