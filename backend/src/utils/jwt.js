import jwt from "jsonwebtoken";

// JWT signing options (only JWT-valid fields — NOT cookie options)
const accessTokenSignOptions = { expiresIn: "15m" };
const refreshTokenSignOptions = { expiresIn: "7d" };

export const signAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    accessTokenSignOptions,
  );
};

export const signRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    refreshTokenSignOptions,
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
