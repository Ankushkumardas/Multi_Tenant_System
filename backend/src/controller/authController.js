import User from "../models/UserSchema.js";
import {
  comparePassword,
  generateTokens,
  hashpassword,
} from "../service/tokenService.js";
import Tenant from "../models/TenantSchema.js";
import Plan from "../models/PlanSchema.js";
import TenantSubscription from "../models/TenantSubscriptionSchema.js";
import { slugify } from "../service/slugify.js";
import crypto from "crypto";
import { sendMail } from "../service/mail.js";
import Email from "../models/EmailSchema.js";
import Invite from "../models/InviteSchema.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { refreshTokenOptions } from "../utils/cookie.js";
import { redisClient } from "../utils/redis.js";

export const registerOwner = async (req, res) => {
  try {
    const { name, email, password, companyName, plan } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashpassword(password);

    const newUser = new User({ name, email, password: hashedPassword });

    const requestedPlanName = plan ? plan.toUpperCase() : "FREE";
    if (!["FREE", "PRO", "ENTERPRISE"].includes(requestedPlanName)) {
      return res.status(400).json({
        message: "Invalid plan selected. Choose FREE, PRO, or ENTERPRISE.",
      });
    }

    const tenant = await Tenant.create({
      name: companyName,
      slug: slugify(companyName),
      subscriptionPlan: requestedPlanName,
      subscriptionStatus: "ACTIVE",
    });

    let selectedPlan = await Plan.findOne({ name: requestedPlanName });

    if (!selectedPlan) {
      const plansToSeed = [
        {
          name: "FREE",
          price: 0,
          limits: { maxUsers: 10, maxProjects: 2 },
          features: {
            chat: true,
            analytics: false,
            notifications: true,
            kanban: true,
            groupChat: false,
            fileSharing: false,
            reminder: false,
            auditlogs: true,
            emailNotification: true,
            integrations: false,
          },
        },
        {
          name: "PRO",
          price: 29,
          limits: { maxUsers: 50, maxProjects: 20 },
          features: {
            chat: true,
            analytics: true,
            notifications: true,
            kanban: true,
            groupChat: true,
            fileSharing: true,
            reminder: true,
            auditlogs: true,
            emailNotification: true,
            integrations: true,
          },
        },
        {
          name: "ENTERPRISE",
          price: 99,
          limits: { maxUsers: 1000, maxProjects: 100 },
          features: {
            chat: true,
            analytics: true,
            notifications: true,
            kanban: true,
            groupChat: true,
            fileSharing: true,
            reminder: true,
            auditlogs: true,
            emailNotification: true,
            integrations: true,
          },
        },
      ];

      for (const p of plansToSeed) {
        await Plan.findOneAndUpdate({ name: p.name }, p, {
          upsert: true,
          new: true,
        });
      }

      selectedPlan = await Plan.findOne({ name: requestedPlanName });
    }

    if (!selectedPlan) throw new Error("Failed to initialize plans.");

    const subscription = new TenantSubscription({
      tenantId: tenant._id,
      planId: selectedPlan._id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //30 days default
      history: [
        {
          planId: selectedPlan._id,
          status: "ACTIVE",
          billingCycle: "MONTHLY",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          price: selectedPlan.price,
        },
      ],
    });

    newUser.tenantId = tenant._id;
    newUser.role = "OWNER";
    const verifyemail = await Email.findOne({ userId: newUser._id });
    if (verifyemail) {
      return res.status(400).json({ message: "Email already verified" });
    }
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerification = new Email({
      userId: newUser._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await Promise.all([
      emailVerification.save(),
      sendMail({
        to: email,
        subject: "Verify your email",
        text: `Click on the link to verify your email: http://localhost:3000/api/v1/auth/verify-email/${verificationToken}`,
        html: `<a href="http://localhost:3000/api/v1/auth/verify-email/${verificationToken}">Verify Email</a>`,
      }),
      newUser.save(),
      subscription.save(),
    ]);

    res.status(201).json({
      message: "Tenant and owner created successfully",
      user: newUser,
      tenant: tenant,
      subscription: subscription,
      plan: selectedPlan,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyOwnerEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const emailVerification = await Email.findOne({ token });

    if (!emailVerification) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    if (emailVerification.expiresAt < new Date()) {
      await Email.deleteOne({ _id: emailVerification._id });
      return res.status(400).json({
        message: "Verification token has expired request for new token",
      });
    }

    const user = await User.findById(emailVerification.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isEmailVerified = true;

    await Promise.all([
      user.save(),
      Email.deleteOne({ _id: emailVerification._id }),
    ]);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerification = new Email({
      userId: user._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await Promise.all([
      emailVerification.save(),
      sendMail({
        to: email,
        subject: "Verify your email",
        text: `Click on the link to verify your email: http://localhost:3000/api/v1/auth/verify-email/${verificationToken}`,
        html: `<a href="http://localhost:3000/api/v1/auth/verify-email/${verificationToken}">Verify Email</a>`,
      }),
    ]);
    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Resend Verification Email Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const sendInvite = async (req, res) => {
  const { email, role } = req.body;
  const { tenantId, userId } = req.user;

  const subscription = await TenantSubscription.findOne({
    tenantId,
    status: "ACTIVE",
  }).populate("planId");

  if (!subscription) {
    return res.status(403).json({ message: "No active subscription" });
  }
  const plan = subscription.planId;

  const userCount = await User.countDocuments({
    tenantId,
    status: { $ne: "SUSPENDED" },
  });

  //plan limti check
  if (plan?.limits?.maxUsers && userCount >= plan?.limits?.maxUsers) {
    return res.status(403).json({ message: "Max users limit reached" });
  }
  // 3. Existing user check
  const existingUser = await User.findOne({ tenantId, email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User already exists in the tenant" });
  }
  //pending invite request user has not accepted
  const pendingInvite = await Invite.findOne({
    tenantId,
    email,
    isUsed: false,
    expiresAt: { $gt: Date.now() },
  });

  if (pendingInvite) {
    return res
      .status(400)
      .json({ message: "Invite already sent to this email" });
  }
  // 4. Create INVITED user
  const invitedUser = await User.create({
    tenantId,
    email,
    role,
    status: "INVITED",
    isEmailVerified: false,
  });

  // 5. Create invite token
  const token = crypto.randomBytes(32).toString("hex");

  await Invite.create({
    tenantId,
    userId: invitedUser._id,
    token,
    invitedBy: userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const tenant = await Tenant.findById(tenantId);
  // 6. Send email
  await sendMail({
    to: email,
    subject: "You have been invited to join our tenant",
    text: `Click on the link to join our tenant: http://localhost:3000/api/v1/auth/invite-mail/${token}`,
    html: `<a href="http://localhost:3000/api/v1/auth/invite-mail/${token}">Join Tenant:${tenant.name}</a>`,
  });

  return res.json({ message: "Invite sent successfully" });
};

export const acceptInvite = async (req, res) => {
  const { name, password } = req.body;
  const { token } = req.params || req.query;
  const invite = await Invite.findOne({
    token,
    isUsed: false,
  });

  if (!invite) {
    return res.status(400).json({
      message: "Invalid or already used invite",
    });
  }

  if (invite.expiresAt < Date.now()) {
    return res.status(400).json({
      message: "Invite expired",
    });
  }

  const tenant = await Tenant.findById(invite.tenantId);
  if (!tenant || tenant.isSuspended) {
    return res.status(403).json({
      message: "Tenant unavailable",
    });
  }

  const user = await User.findById(invite.userId);

  if (!user || user.status !== "INVITED") {
    return res.status(400).json({
      message: "Invite already processed",
    });
  }

  const subscription = await TenantSubscription.findOne({
    tenantId: tenant._id,
    status: "ACTIVE",
  }).populate("planId");

  if (!subscription) {
    return res.status(403).json({
      message: "No active subscription",
    });
  }

  const plan = subscription.planId;

  const activeUserCount = await User.countDocuments({
    tenantId: tenant._id,
    status: { $ne: "SUSPENDED" },
  });

  if (plan.limits?.maxUsers && activeUserCount > plan.limits.maxUsers) {
    return res.status(403).json({
      message: "User limit exceeded. Contact admin.",
    });
  }

  user.name = name;
  user.password = hashpassword(password);
  user.status = "ACTIVE";
  user.isEmailVerified = true;

  await user.save();

  invite.isUsed = true;
  await invite.save();

  return res.status(200).json({
    message: "Invitation accepted successfully",
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const sessionId = generateSessionId(req);
    const { accessToken, refreshToken } = generateTokens(user);
    //usingredis for cache on teh bais of Owner and other role of user
    await redisClient.set(
      `refreshToken:user:${user._id}:${sessionId}`,
      refreshToken,
      "EX",
      60 * 60 * 24 * 7,
    ); //7days

    //  Track sessions per user
    await redisClient.sadd(`sessions:user:${user._id}`, sessionId);
    //  DB fallback (last session only)
    user.refreshToken = refreshToken;
    user.userAgent = req.headers["user-agent"];
    user.lastLoginAt = Date.now();
    await user.save();
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);

    return res
      .status(200)
      .json({ message: "Login successful", user, accessToken });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }
    // 1️⃣ Verify JWT signature
    const decoded = verifyRefreshToken(incomingRefreshToken);
    const userId = decoded.userId;
    const sessionId = generateSessionId(req);
    // 2️⃣ Redis FIRST
    const redisToken = await redisClient.get(
      `refreshToken:user:${userId}:${sessionId}`,
    );
    if (!redisToken) {
      // 3️⃣ DB FALLBACK
      const user = await User.findById(userId);
      if (!user || user.refreshToken !== incomingRefreshToken) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Restore Redis if DB matches
      await redisClient.set(
        `refreshToken:user:${userId}:${sessionId}`,
        incomingRefreshToken,
        "EX",
        7 * 24 * 60 * 60,
      );
    }
    // 4️⃣ Rotate tokens
    const user = await User.findById(userId);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // 5️⃣ Update Redis
    await redisClient.set(
      `refreshToken:user:${userId}:${sessionId}`,
      newRefreshToken,
      "EX",
      7 * 24 * 60 * 60,
    );

    // 6️⃣ Update DB fallback
    user.refreshToken = newRefreshToken;
    await user.save();

    // 7️⃣ Update cookie
    res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);

    return res.status(200).json({
      message: "Token refreshed",
      accessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = generateSessionId(req);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    await redisClient.del(`refreshToken:user:${userId}:${sessionId}`);
    await redisClient.srem(`sessions:user:${userId}`, sessionId);
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId, role, status } = req.body;
    const { tenantId, userId: ownerId } = req.user;
    if (ownerId === userId) {
      return res.status(403).json({ message: "Owner can't update their role" });
    }
    const user = await User.findById({ ownerId });
    if (user.role !== "OWNER") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update user role" });
    }
    if (role === "OWNER") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update user role" });
    }
    const updateUser = await User.findById({ userId, tenantId });
    if (!updateUser) {
      return res.status(404).json({ message: "User not found" });
    }

    updateUser.role = role;
    updateUser.status = status;
    await updateUser.save();
    return res
      .status(200)
      .json({ message: "User role updated successfully", updateUser });
  } catch (error) {
    console.error("Update User Role Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { userId, tenantId } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "User is not active" });
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, tenantId });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
      user.isEmailVerified = false;
      const token = crypto.randomBytes(32).toString("hex");
      const emailVerification = new Email({
        userId: user._id,
        token: token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      await emailVerification.save();
      await sendMail({
        to: email,
        subject: "Email Verification",
        text: `Click on the link to verify your updated email: http://localhost:3000/api/v1/auth/verify-email/${token}`,
        html: `<a href="http://localhost:3000/api/v1/auth/verify-email/${token}">Verify Email</a>`,
      });
    }
    user.name = name;
    await user.save();
    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update Profile Data Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const changePasword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    user.password = hashpassword(newPassword);
    await user.save();
    return res
      .status(200)
      .json({ message: "Password changed successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const emailVerification = new Email({
      userId: user._id,
      token: token,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await emailVerification.save();
    await sendMail({
      to: email,
      subject: "Forgot Password",
      text: `Click on the link to reset your password: http://localhost:3000/api/v1/auth/reset-password/${token}`,
      html: `<a href="http://localhost:3000/api/v1/auth/reset-password/${token}">Reset Password</a>`,
    });
    return res
      .status(200)
      .json({ message: "Forgot password email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const emailVerification = await Email.findOne({ token });
    if (!emailVerification) {
      return res.status(404).json({ message: "Invalid token" });
    }
    if (emailVerification.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token expired" });
    }
    const user = await User.findById(emailVerification.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = hashpassword(password);
    await user.save();
    await emailVerification.remove();
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const cacheuser = await redisClient.get(`user:profile:${userId}`);
    if (cacheuser) {
      return res.status(200).json({
        message: "Profile fetched successfully from redis",
        user: JSON.parse(cacheuser),
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await redisClient.set(
      `user:profile:${userId}`,
      JSON.stringify(user),
      "EX",
      3600,
    );
    return res
      .status(200)
      .json({ message: "Profile fetched successfully", user: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forceLogoutuser = async (req, res) => {
  try {
    const { userId } = req.params; // Changed from body to params to match route
    const { tenantId } = req.user;
    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //first will get all teh active sessiosn of that partivcular user whch we where been tracking whle login
    const sessions = await redisClient.smembers(`sessions:user:${userId}`);
    for (const sessionId of sessions) {
      await redisClient.del(`refreshToken:user:${userId}:${sessionId}`);
    }
    await redisClient.del(`sessions:user:${userId}`);
    //fallback with DB
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
