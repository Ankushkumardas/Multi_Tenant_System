import crypto from "crypto";

export const generateSessionId = (req) => {
  const ua = req.headers["user-agent"] || "unknown";
  const ip = req.ip || "0.0.0.0";
  return crypto
    .createHash("sha256")
    .update(ua + ip)
    .digest("hex");
};
