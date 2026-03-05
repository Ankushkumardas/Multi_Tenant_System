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
import { createNotification } from "../service/notification.js";
import { generateSessionId } from "../utils/session.js";

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

    // 1️⃣ Create Tenant (without subscription details initially)
    const tenant = await Tenant.create({
      name: companyName,
      slug: slugify(companyName),
      // subscriptionPlan & subscriptionStatus removed from Schema
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
          isActive: true, // Added field
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
          isActive: true,
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
          isActive: true,
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

    // 2️⃣ Create Subscription
    const subscription = new TenantSubscription({
      tenantId: tenant._id,
      planId: selectedPlan._id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      autoRenew: true,
      paymentProvider: "MANUAL",
      history: [
        {
          planId: selectedPlan._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          changedAt: new Date(),
          action: "CREATED",
        },
      ],
    });

    await subscription.save();

    // 3️⃣ Link Subscription to Tenant
    tenant.currentSubscription = subscription._id;
    await tenant.save();

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
        subject: "Verify your email — FlowSpace",
        text: `Click this link to verify your email: ${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`,
        html: `<p>Hello ${name},</p><p>Click the button below to verify your email. This link expires in 10 minutes.</p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}" style="background:#111;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;margin-top:8px">Verify Email</a>`,
      }),
      newUser.save(),
    ]);

    res.status(201).json({
      message: "Tenant and owner created successfully",
      user: newUser,
      tenant: tenant,
      subscription: subscription,
      plan: selectedPlan,
      slug: tenant.slug,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyOwnerEmail = async (req, res) => {
  try {
    const { token } = req.body;

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
        subject: "Verify your email — FlowSpace",
        text: `Click this link to verify your email: ${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`,
        html: `<p>Click the button below to verify your email. This link expires in 10 minutes.</p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}" style="background:#111;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;margin-top:8px">Verify Email</a>`,
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
    email,
    role,
    token,
    invitedBy: userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const tenant = await Tenant.findById(tenantId);
  // 6. Send email
  await sendMail({
    to: email,
    subject: `Invitation to join ${tenant.name} on FlowSpace`,
    text: `Click on the link to join our workspace: ${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite?token=${token}`,
    html: `<p>You have been invited to join <b>${tenant.name}</b> on FlowSpace.</p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite?token=${token}" style="background:#111;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;margin-top:8px">Join Workspace</a>`,
  });

  return res.json({ message: "Invite sent successfully" });
};

export const acceptInvite = async (req, res) => {
  const { name, password } = req.body;
  const token = req.params.token || req.query.token;
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
  user.password = await hashpassword(password);
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
    //using redis to make session tracking for refresh token on teh basis of user id and session id
    await redisClient.set(
      `refreshToken:user:${user._id}:${sessionId}`,
      refreshToken,
      "EX",
      60 * 60 * 24 * 7,
    ); //7days

    // Store session metadata (IP, UA, etc.)
    await redisClient.set(
      `sessionMeta:user:${user._id}:${sessionId}`,
      JSON.stringify({
        ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "Unknown Device",
        loginAt: Date.now(),
      }),
      "EX",
      60 * 60 * 24 * 7,
    );

    //  Track sessions per user
    await redisClient.sadd(`sessions:user:${user._id}`, sessionId);
    //  DB fallback (last session only)
    user.refreshToken = refreshToken;
    user.userAgent = req.headers["user-agent"];
    user.lastLoginAt = Date.now();
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshTokenOptions);

    const tenant = await Tenant.findById(user.tenantId);

    return res
      .status(200)
      .json({ message: "Login successful", user, accessToken, tenant });
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
    const user = await User.findById(ownerId);
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
    const updateUser = await User.findById({ _id: userId, tenantId });
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
    const { name, email, phone, bio, profileImage, location, jobTitle } =
      req.body;
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
        text: `Click on the link to verify your updated email: ${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`,
        html: `<p>You updated your email. Click below to verify it.</p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}" style="background:#111;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;margin-top:8px">Verify Email</a>`,
      });
    }
    user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (location !== undefined) user.location = location;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    await user.save();

    // Update redis cache
    const tenant = await Tenant.findById(user.tenantId);
    await redisClient.set(
      `user:profile:${userId}`,
      JSON.stringify({ user, tenant }),
      "EX",
      3600,
    );

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
    user.password = await hashpassword(newPassword);
    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTenantSlug = async (req, res) => {
  try {
    const { newSlug, newName } = req.body;
    const { tenantId, userId } = req.user;

    const user = await User.findById(userId);
    if (user.role !== "OWNER") {
      return res
        .status(403)
        .json({ message: "Only owners can update workspace details" });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (newSlug && newSlug !== tenant.slug) {
      const existing = await Tenant.findOne({ slug: newSlug });
      if (existing) {
        return res.status(400).json({
          message: "Choose a different workspace URL, this one is taken",
        });
      }
      tenant.slug = newSlug;
    }

    if (newName) {
      tenant.name = newName;
    }

    await tenant.save();

    // Clear cache to reflect changes
    await redisClient.del(`user:profile:${userId}`);

    return res.status(200).json({
      message: "Workspace updated successfully",
      tenant,
    });
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
    user.password = await hashpassword(password);
    await user.save();
    await emailVerification.deleteOne();
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const cachedData = await redisClient.get(`user:profile:${userId}`);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        message: "Profile fetched successfully from redis",
        user: parsed.user,
        tenant: parsed.tenant,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const tenant = await Tenant.findById(user.tenantId);

    await redisClient.set(
      `user:profile:${userId}`,
      JSON.stringify({ user, tenant }),
      "EX",
      3600,
    );

    return res.status(200).json({
      message: "Profile fetched successfully",
      user: user,
      tenant: tenant,
    });
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

export const getActiveSessions = async (req, res) => {
  try {
    const { userId } = req.user;
    const sessions = await redisClient.smembers(`sessions:user:${userId}`);
    let data = [];
    const currentSessionId = generateSessionId(req);
    for (const session of sessions) {
      const [token, meta] = await Promise.all([
        redisClient.get(`refreshToken:user:${userId}:${session}`),
        redisClient.get(`sessionMeta:user:${userId}:${session}`),
      ]);

      if (token) {
        data.push({
          sessionId: session,
          active: true,
          isCurrent: session === currentSessionId,
          meta: meta
            ? JSON.parse(meta)
            : { ip: "Unknown", userAgent: "Unknown", loginAt: Date.now() },
        });
      }
    }

    // Sort by loginAt desc, but keep isCurrent at the top
    data.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return (b.meta?.loginAt || 0) - (a.meta?.loginAt || 0);
    });
    return res.status(200).json({
      message: "Active sessions fetched successfully for this user",
      sessions: data,
      totalSessions: data.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const users = await User.find({ tenantId }).select(
      "-password -refreshToken",
    );
    const invites = await Invite.find({
      tenantId,
      isUsed: false,
      expiresAt: { $gt: Date.now() },
    });
    return res.status(200).json({
      message: "Users fetched successfully",
      users,
      invites,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const revokeInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { tenantId } = req.user;
    const invite = await Invite.findOneAndDelete({
      _id: inviteId,
      tenantId,
      isUsed: false,
    });
    if (!invite) {
      return res
        .status(404)
        .json({ message: "Invite not found or already used." });
    }
    // Also remove the invited user record
    if (invite.userId) {
      await User.findByIdAndDelete(invite.userId);
    }
    return res.status(200).json({ message: "Invite revoked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { tenantId, userId } = req.user;

    const invite = await Invite.findOne({
      _id: inviteId,
      tenantId,
      isUsed: false,
    });
    if (!invite) {
      return res
        .status(404)
        .json({ message: "Invite not found or already accepted" });
    }

    // Refresh token and expiry
    const newToken = crypto.randomBytes(32).toString("hex");
    invite.token = newToken;
    invite.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    invite.invitedBy = userId;
    await invite.save();

    const tenant = await Tenant.findById(tenantId);

    await sendMail({
      to: invite.email,
      subject: `Resending: Invitation to join ${tenant.name} on FlowSpace`,
      text: `Click on the link to join our workspace: ${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite?token=${newToken}`,
      html: `<p>You have a pending invitation to join <b>${tenant.name}</b> on FlowSpace.</p>
             <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite?token=${newToken}" 
                style="background:#111;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;margin-top:8px">Join Workspace</a>`,
    });

    return res.status(200).json({ message: "Invitation resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Function to revoke a session
export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.user;

    await redisClient.del(`refreshToken:user:${userId}:${sessionId}`);
    await redisClient.del(`sessionMeta:user:${userId}:${sessionId}`);
    await redisClient.srem(`sessions:user:${userId}`, sessionId);

    return res.status(200).json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Error revoking session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const revokeOthersSessions = async (req, res) => {
  try {
    const { userId } = req.user;
    const currentSessionId = generateSessionId(req);
    const sessions = await redisClient.smembers(`sessions:user:${userId}`);

    for (const sessionId of sessions) {
      if (sessionId !== currentSessionId) {
        await redisClient.del(`refreshToken:user:${userId}:${sessionId}`);
        await redisClient.del(`sessionMeta:user:${userId}:${sessionId}`);
        await redisClient.srem(`sessions:user:${userId}`, sessionId);
      }
    }

    return res
      .status(200)
      .json({ message: "Other sessions revoked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
