import { createClient } from "redis";

// const client = createClient();
const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => {
  console.error("Redis Error:", err);
});

export const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
    console.log("Redis connected");
  }
};

// ── Compatibility shim: expose v2/v3-style API over the v4/v5 client ────────
// redis v4+ renamed methods to camelCase and changed set() EX syntax.
// This wrapper keeps all existing controller code working without changes.
export const redisClient = {
  // ── String ops ──────────────────────────────────────────────────────────
  // Old: set(key, value, "EX", seconds)  →  New: set(key, value, { EX: seconds })
  set: (key, value, ...args) => {
    // args can be: [] | ["EX", seconds]
    if (args.length === 2 && (args[0] === "EX" || args[0] === "ex")) {
      return client.set(key, value, { EX: Number(args[1]) });
    }
    return client.set(key, value);
  },
  get: (key) => client.get(key),
  del: (...keys) => client.del(keys),
  incr: (key) => client.incr(key),
  decr: (key) => client.decr(key),
  expire: (key, secs) => client.expire(key, secs),

  // ── Set ops (old lowercase → new camelCase) ──────────────────────────────
  sadd: (key, ...members) => client.sAdd(key, members),
  srem: (key, ...members) => client.sRem(key, members),
  smembers: (key) => client.sMembers(key),

  // ── Expose the raw client if ever needed ────────────────────────────────
  raw: client,
};
