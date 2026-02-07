import { signAccessToken, signRefreshToken } from "../utils/jwt";
import bcrypt from "bcrypt";

//funciton to create access and refresh token while login 
export const generateTokens = (user) => {
    const payload = {
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role,
    };

    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
    };
};

export const hashpassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

export const comparePassword = (password, hash) => {
    return bcrypt.compareSync(password, hash);
};