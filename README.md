# 🏢 Multi-Tenant SaaS Backend

A **production-ready, fully-featured multi-tenant backend** built with Node.js, Express, MongoDB, Redis, and Socket.IO. Each tenant (organization/company) is completely isolated, gets their own slug-based URL, and can manage their own team, projects, tasks, subscriptions, and real-time chat — all within a single backend.

---

## 📑 Table of Contents

- [✨ Features Overview](#-features-overview)
- [🏗️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🔐 Authentication & Users](#-authentication--users)
- [🏢 Multi-Tenancy](#-multi-tenancy)
- [📋 Project Management](#-project-management)
- [✅ Task Management](#-task-management)
- [🗂️ Kanban Board](#️-kanban-board)
- [💬 Real-Time Chat](#-real-time-chat)
- [🔔 Notifications](#-notifications)
- [💳 Subscription & Plans](#-subscription--plans)
- [📊 Activity & Audit Logs](#-activity--audit-logs)
- [🛡️ Middleware & Security](#️-middleware--security)
- [🗄️ Database Models](#️-database-models)
- [🌐 API Routes](#-api-routes)
- [⚙️ Environment Variables](#️-environment-variables)
- [🚀 Getting Started](#-getting-started)

---

## ✨ Features Overview

| Feature                   | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| 🏢 **Multi-Tenancy**      | Full tenant isolation — each org has its own slug in the URL         |
| 🔐 **JWT Auth**           | Access + Refresh tokens with HTTP-only cookie sessions               |
| 📧 **Email Verification** | Owners must verify email before accessing the system                 |
| 👥 **Team Invites**       | Invite members via email with role assignment                        |
| 📋 **Projects**           | Create, archive, manage members and roles per project                |
| ✅ **Tasks**              | Full task lifecycle: create, assign, update status/priority/due date |
| 🗂️ **Kanban Board**       | Drag & drop sections with persistent ordering                        |
| 💬 **Real-Time Chat**     | Socket.IO powered rooms, threads, pin, edit, delete messages         |
| 🔔 **Notifications**      | Real-time notifications with Redis-powered unread count              |
| 💳 **Subscriptions**      | FREE / PRO / ENTERPRISE plans with upgrade/downgrade and auto-renew  |
| 📊 **Activity Logs**      | Track all user & project actions with pagination                     |
| 🔒 **Audit Logs**         | Security-grade tamper audit trail for OWNER & ADMIN                  |
| ⏱️ **Rate Limiting**      | Redis-based custom rate limiter per route                            |
| 🔄 **Cron Jobs**          | Daily subscription expiry reminders and auto-renewal                 |
| 🛡️ **RBAC**               | Granular role-based access control per action                        |

---

## 🏗️ Tech Stack

| Layer                  | Technology                      |
| ---------------------- | ------------------------------- |
| **Runtime**            | Node.js                         |
| **Framework**          | Express.js                      |
| **Database**           | MongoDB + Mongoose              |
| **Cache / Rate Limit** | Redis (ioredis)                 |
| **Real-Time**          | Socket.IO                       |
| **Authentication**     | JWT (Access + Refresh Tokens)   |
| **Scheduling**         | node-cron                       |
| **Security**           | bcrypt, HTTP-only cookies, CORS |

---

## 📁 Project Structure

```
backend/
└── src/
    ├── controller/        # All business logic handlers
    │   ├── authController.js
    │   ├── projectController.js
    │   ├── taskController.js
    │   ├── kanbanSectionController.js
    │   ├── chatController.js
    │   ├── messageControllers.js
    │   ├── notificationController.js
    │   ├── subscriptionController.js
    │   ├── activityController.js
    │   ├── auditController.js
    │   └── taskCommentController.js
    │
    ├── middleware/        # Security, auth, and validation layers
    │   ├── authMiddleware.js
    │   ├── tenantMiddleware.js
    │   ├── checkPermissions.js
    │   ├── checkUsageLimitMiddleware.js
    │   ├── featureCheckValidationMiddleware.js
    │   └── ratelimiter.js
    │
    ├── models/            # Mongoose schemas (18 models)
    ├── routes/            # Express route definitions (10 route files)
    ├── service/           # Shared services (notifications, audit logger, cron)
    ├── socket/            # Socket.IO handlers (chat, typing, online users)
    ├── utils/             # Helpers (redis, database, cookies, permissions)
    └── server.js          # App entry point
```

---

## 🔐 Authentication & Users

A complete, secure authentication system built from scratch.

### How it works

1. **Owner registers** → A new tenant + free subscription is created automatically
2. **Email verification** → Owner must verify their email before logging in
3. **Login** → Issues an access token (JWT) + a refresh token stored in an HTTP-only cookie
4. **Refresh Token Rotation** → Every refresh generates a new pair — stolen tokens are automatically invalidated
5. **Invite Members** → Owner/Admin sends an invite link, member sets their password on first login

### User Roles

| Role          | Access Level                       |
| ------------- | ---------------------------------- |
| `SUPER_ADMIN` | Platform-wide control (no tenant)  |
| `OWNER`       | Full control over their tenant     |
| `ADMIN`       | Manage members, projects, settings |
| `MANAGER`     | Manage tasks and sections          |
| `USER`        | Create and update tasks            |
| `VIEWER`      | Read-only access                   |

### Auth Functions

| Function                  | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `registerOwner`           | Creates user + tenant + free plan subscription atomically        |
| `verifyOwnerEmail`        | Validates token from email link                                  |
| `resendVerificationEmail` | Resends verification (rate limited to 3/min)                     |
| `sendInvite`              | Sends invite email with role-specific link                       |
| `acceptInvite`            | Member accepts invite, sets their password                       |
| `login`                   | Validates credentials, issues JWT tokens (rate limited to 5/min) |
| `refreshToken`            | Rotates access + refresh tokens                                  |
| `logout`                  | Clears tokens from DB + cookie                                   |
| `forgotPassword`          | Sends reset link via email (rate limited)                        |
| `resetPassword`           | Sets new password with token                                     |
| `getProfile`              | Returns user + tenant info                                       |
| `updateProfileData`       | Updates name, avatar, etc.                                       |
| `changePasword`           | Change password (rate limited to 3/min)                          |
| `getActiveSessions`       | Lists all active sessions for the user                           |
| `forceLogoutuser`         | Admin can remotely terminate a user session                      |
| `updateUserRole`          | Change a member's role within the tenant                         |

---

## 🏢 Multi-Tenancy

Every organization is a **Tenant**. Each tenant is completely isolated — users, projects, messages, tasks, and subscriptions are all scoped to a tenant and **cannot leak across tenants**.

### Tenant Slug in URL

Every tenant-scoped API route includes the tenant's **slug** in the URL:

```
/api/:slug/projects
/api/:slug/user/profile
/api/:slug/chat
/api/:slug/subscription/history
```

This means you can see exactly **which organization** a request belongs to just from the URL.

### How Tenant Resolution Works

The `checkTenant` middleware:

1. Reads the `:slug` from the URL
2. Looks up the Tenant by slug from MongoDB
3. **Security check**: Ensures the slug in the URL matches the `tenantId` stored in the user's JWT — prevents cross-tenant attacks
4. Checks if tenant is suspended or subscription is cancelled
5. Attaches the tenant object to `req.tenant` for controllers to use

### Tenant Model

```
Tenant
  ├── name         → Company/org name
  ├── slug         → URL identifier (e.g., "acme-corp")
  ├── currentSubscription → Ref to active plan
  └── isSuspended  → Hard stop all access
```

---

## 📋 Project Management

Full project lifecycle management with member-level access control.

| Function                  | Description                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `createProject`           | Creates project + default Kanban sections (Todo, In Progress, Review, Done) + auto-creates a chat room for the project |
| `getMyProjects`           | Returns all projects the logged-in user is a member of                                                                 |
| `getProjectById`          | Get full details of a single project                                                                                   |
| `updateProject`           | Update project name, description                                                                                       |
| `archiveProject`          | Archive a project (soft-disable)                                                                                       |
| `toggelArchiver`          | Toggle archive state on/off                                                                                            |
| `deleteProject`           | Permanently delete project + all its tasks, sections, members                                                          |
| `addMemberToProject`      | Add a tenant user to a project with a specific role                                                                    |
| `removeMemberFromProject` | Remove a member from a project                                                                                         |
| `getProjectMembers`       | List all members and their roles                                                                                       |
| `updateprojectMemberRole` | Promote or demote a member's role in the project                                                                       |
| `Leaveproject`            | A member voluntarily leaves a project                                                                                  |

> 🛡️ Usage limit enforced: Creating a project checks the tenant's plan limit (`maxProjects`).

> 📊 Every project action is automatically logged to both the **Activity Log** and **Audit Log**.

---

## ✅ Task Management

Comprehensive task management tied to projects and Kanban sections.

| Function             | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `createTask`         | Create task with title, description, priority, due date, section |
| `updateTask`         | Update any task fields                                           |
| `deleteTask`         | Remove task permanently                                          |
| `getSingleTask`      | Get one task by ID                                               |
| `assignTask`         | Assign/unassign one or more team members to a task               |
| `updateTaskStatus`   | Change status: `TODO` → `IN_PROGRESS` → `REVIEW` → `DONE`        |
| `updateTaskPriority` | Set priority: `LOW`, `MEDIUM`, `HIGH`                            |
| `updateTaskDueDate`  | Update task deadline                                             |
| `moveTask`           | Drag-and-drop move task between sections                         |

### Task Fields

```
Task
  ├── title, description
  ├── status       → TODO | IN_PROGRESS | REVIEW | DONE
  ├── priority     → LOW | MEDIUM | HIGH
  ├── order        → Position in Kanban column
  ├── dueDate
  ├── sectionId    → Which Kanban column it belongs to
  ├── projectId
  ├── assignedTo[] → Array of assigned users
  └── createdBy
```

### Task Comments

| Function        | Description                  |
| --------------- | ---------------------------- |
| `createComment` | Add a comment to a task      |
| `getComments`   | List all comments on a task  |
| `updateComment` | Edit a comment (author only) |
| `deleteComment` | Delete a comment             |

---

## 🗂️ Kanban Board

A fully functional drag-and-drop Kanban system.

- Every new project automatically gets **4 default sections**: `Todo`, `In Progress`, `Review`, `Done`
- Users can create **custom sections** in addition to defaults
- **Column ordering is persisted** in the database — the board looks the same on every reload
- Tasks have an `order` field for position within a column

| Function             | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| `createSection`      | Add a new Kanban column to a project                                 |
| `getProjectSections` | Get all columns sorted by order                                      |
| `updateSection`      | Rename a column                                                      |
| `deleteSection`      | Remove a column                                                      |
| `updateSectionOrder` | Save the new order after drag-and-drop reordering of columns         |
| `getBoard`           | Returns the full board: all sections with their tasks grouped inside |

---

## 💬 Real-Time Chat

Socket.IO powered real-time messaging with rich message features.

### Chat Rooms

| Function           | Description                                    |
| ------------------ | ---------------------------------------------- |
| `createRoom`       | Create a group or DM chat room                 |
| `getUserRooms`     | Get all rooms a user belongs to (sidebar list) |
| `getRoomDetails`   | Get a room's details and participants          |
| `UpdateRoom`       | Rename or update room settings                 |
| `DeleteRoom`       | Delete room + all messages + all participants  |
| `LeaveRoom`        | User leaves a chat room                        |
| `addParticipant`   | Add a new person to a room                     |
| `removePartcipant` | Remove someone from a room                     |

### Messages

| Function           | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `editMessage`      | Edit a sent message (marks `isEdited: true`)             |
| `deleteMessageFor` | Soft delete — hides message only for the requesting user |
| `pinMessage`       | Pin a message in the room                                |
| `unpinMessage`     | Unpin a message                                          |
| `searchMessage`    | Search messages by text (regex, case-insensitive)        |
| `replyMessage`     | Reply to a message (creates a thread/parent link)        |
| `getThreadMessage` | Get all replies in a message thread                      |

### Socket Events

The Socket.IO server handles:

- 🔌 **Connection** with JWT authentication middleware
- 🏠 Auto-join to all rooms a user is a participant in
- 💬 **Real-time message sending** via `chatHandler`
- 👀 **Online user tracking** via `onlineUsers` handler
- ⌨️ **Typing indicators** via `typingHandler`

---

## 🔔 Notifications

Real-time notification system powered by **MongoDB + Redis + Socket.IO**.

| Feature              | Benefit                                             |
| -------------------- | --------------------------------------------------- |
| MongoDB storage      | Notifications persist across sessions               |
| Redis unread counter | Instant unread badge count without DB queries       |
| Socket.IO delivery   | Notifications appear instantly without page refresh |

| Function              | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `getAllNotifications` | Get all notifications for the logged-in user            |
| `getUnreadCount`      | Redis-first unread count (falls back to MongoDB)        |
| `markAsRead`          | Mark one notification as read, decrements Redis counter |
| `markAllAsRead`       | Mark all as read, resets Redis counter to 0             |

---

## 💳 Subscription & Plans

Full SaaS billing lifecycle management — without a payment gateway dependency.

### Available Plans

| Plan         | Description                                  |
| ------------ | -------------------------------------------- |
| `FREE`       | Basic access with limited users and projects |
| `PRO`        | Increased limits + features like analytics   |
| `ENTERPRISE` | Unlimited users, advanced features           |

### Subscription Features

| Function                     | Description                                                           |
| ---------------------------- | --------------------------------------------------------------------- |
| `ChangePlan`                 | Upgrade or downgrade plan — auto-detects direction and logs action    |
| `getSubscriptionHistory`     | Full history of plan changes (CREATED, UPGRADED, DOWNGRADED, RENEWED) |
| `toggleAutoRenew`            | Turn automatic renewal on/off                                         |
| `renewSubscription`          | Manually renew an expired subscription (also un-suspends the tenant)  |
| `SubscriptionExpiryReminder` | Checks all subscriptions and sends alerts                             |

### Auto-Renewal & Expiry (Cron Job — Runs Daily at 9 AM)

- ⏰ If **≤ 5 days** to expiry → sends a notification to the OWNER (with Redis dedup so it's only sent once per day)
- 🔄 If subscription **expired + autoRenew ON** → automatically extends by 30 days
- ❌ If subscription **expired + autoRenew OFF** → marks as `EXPIRED`, suspends the tenant

---

## 📊 Activity & Audit Logs

Two separate logging systems for different purposes.

### 📊 Activity Logs (What happened)

General tracking of user actions. Useful for dashboards and feeds.

| Function             | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `getTenantActitvity` | Paginated activity feed for the whole tenant               |
| `getProjectActivity` | Activity log for a specific project                        |
| `UserActivity`       | All actions performed by a specific user                   |
| `getActivityStats`   | Aggregated stats: how many times each action type occurred |

### 🔒 Audit Logs (Who did what — security grade)

Tamper-evident log for compliance. Only accessible by `OWNER` and `ADMIN`.

| Function             | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `getTenantAuditLogs` | Filterable paginated audit trail (by user, action, date) |
| `getAuditStats`      | Aggregated audit stats by action type                    |
| `getAuditByUser`     | All audit entries by a specific actor                    |

> Both logs are automatically written by project and task controllers using the `saveAuditLog` and `saveActivityLog` service functions.

---

## 🛡️ Middleware & Security

### Authentication (`authMiddleware.js`)

| Middleware               | What it does                                                            |
| ------------------------ | ----------------------------------------------------------------------- |
| `authenticate`           | Verifies JWT access token, attaches `req.user` (userId, tenantId, role) |
| `authorize(...roles)`    | Restricts route to specific roles (e.g., OWNER, ADMIN)                  |
| `requirePlan(...plans)`  | Blocks access if tenant is not on required plan                         |
| `requirePlanStatus(...)` | Checks subscription status (ACTIVE, EXPIRED, CANCELLED)                 |

### Tenant Isolation (`tenantMiddleware.js`)

- Resolves tenant from `:slug` in URL
- Security cross-check: slug in URL must match `tenantId` in JWT
- Checks `isSuspended` and subscription status

### Permission System (`checkPermissions.js`)

Fine-grained action permissions mapped to roles via `rolePermissions.js`:

> Examples: `CREATE_PROJECT`, `DELETE_TASK`, `ADD_MEMBER`, `READ_BOARD`, `CREATE_COMMENT`, etc.

### Usage Limit Guard (`checkUsageLimitMiddleware.js`)

Before creating a project or adding a user, checks if the tenant has hit their plan's `maxProjects` or `maxUsers` limit. Returns `403` with a friendly upgrade message if exceeded.

### Redis Rate Limiter (`ratelimiter.js`)

Custom middleware — configurable per route:

```js
rateLimiter({
  keyPrefix: "login", // unique key prefix
  limit: 5, // max requests
  windowsize: 60, // time window in seconds
  identifier: "email", // track by: "ip" | "email" | "userId"
});
```

Applied to: login (5/min), refresh (5/min), forgot-password (3/min), reset-password (3/min), resend-verification (3/min), change-password (3/min).

---

## 🗄️ Database Models

| Model                | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `User`               | Stores users with role, status, refresh token, session info  |
| `Tenant`             | Represents an organization with slug and subscription ref    |
| `Plan`               | Defines FREE / PRO / ENTERPRISE limits and features          |
| `TenantSubscription` | Active subscription + full history (upgrade/downgrade/renew) |
| `Project`            | Project scoped to a tenant                                   |
| `ProjectMember`      | Many-to-many: users in projects with roles                   |
| `Task`               | Tasks with status, priority, section, assignees, ordering    |
| `Section`            | Kanban columns with persistent order                         |
| `TaskComment`        | Comments on tasks                                            |
| `ChatRoom`           | Chat rooms (DM or group) scoped to tenant                    |
| `ChatParticipant`    | Users in chat rooms                                          |
| `Message`            | Messages with edit, pin, soft-delete, thread/reply support   |
| `Notification`       | Persistent notifications with read status                    |
| `ActivityLog`        | General action log per tenant/project/user                   |
| `Audit`              | Security-grade audit trail                                   |
| `Invite`             | Pending invite tokens for new members                        |
| `UsageSchema`        | Tracks tenant's resource usage                               |
| `EmailSchema`        | Email record tracking                                        |

---

## 🌐 API Routes

All tenant-scoped routes include the tenant's **slug** in the URL:

```
/api/:slug/<resource>
```

### 🔑 Auth Routes — `/api/auth` (Global, no slug)

| Method | Endpoint                              | Description                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| `POST` | `/api/auth/register-owner`            | Register a new tenant owner              |
| `POST` | `/api/auth/verify-owner-email`        | Verify email with token                  |
| `POST` | `/api/auth/resend-verification-email` | Resend verification (rate limited)       |
| `POST` | `/api/auth/login`                     | Login (rate limited)                     |
| `POST` | `/api/auth/refresh`                   | Refresh access token (rate limited)      |
| `POST` | `/api/auth/logout`                    | Logout and clear session                 |
| `POST` | `/api/auth/forgot-password`           | Send password reset email (rate limited) |
| `POST` | `/api/auth/reset-password`            | Reset password with token                |
| `POST` | `/api/auth/accept-invite`             | Accept a team invitation                 |

### 👤 User Routes — `/api/:slug/user`

| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| `GET`  | `/profile`         | Get own profile                |
| `PUT`  | `/update-profile`  | Update profile info            |
| `GET`  | `/sessions`        | View active sessions           |
| `POST` | `/change-password` | Change password (rate limited) |

### 📋 Project Routes — `/api/:slug/projects`

| Method   | Endpoint                         | Description             |
| -------- | -------------------------------- | ----------------------- |
| `POST`   | `/`                              | Create a project        |
| `GET`    | `/`                              | Get all my projects     |
| `GET`    | `/:projectId`                    | Get project by ID       |
| `PUT`    | `/:projectId`                    | Update project          |
| `DELETE` | `/:projectId`                    | Delete project          |
| `POST`   | `/:projectId/archive`            | Archive project         |
| `POST`   | `/:projectId/toggle-archive`     | Toggle archive state    |
| `POST`   | `/:projectId/add-member`         | Add member to project   |
| `DELETE` | `/:projectId/remove-member`      | Remove member           |
| `PUT`    | `/:projectId/update-member-role` | Update member's role    |
| `GET`    | `/:projectId/members`            | Get all project members |
| `POST`   | `/:projectId/leave`              | Leave a project         |

### ✅ Task Routes — `/api/:slug/projects/:projectId/tasks`

| Method   | Endpoint                       | Description          |
| -------- | ------------------------------ | -------------------- |
| `POST`   | `/`                            | Create task          |
| `PUT`    | `/:taskId`                     | Update task          |
| `DELETE` | `/:taskId`                     | Delete task          |
| `GET`    | `/:taskId`                     | Get single task      |
| `POST`   | `/:taskId/assign`              | Assign task to users |
| `PUT`    | `/:taskId/status`              | Update task status   |
| `PUT`    | `/:taskId/priority`            | Update task priority |
| `PUT`    | `/:taskId/due-date`            | Update task due date |
| `POST`   | `/:taskId/comments`            | Add comment          |
| `GET`    | `/:taskId/comments`            | Get comments         |
| `PUT`    | `/:taskId/comments/:commentId` | Update comment       |
| `DELETE` | `/:taskId/comments/:commentId` | Delete comment       |

### 🗂️ Kanban Section Routes — `/api/:slug/projects/:projectId/sections`

| Method   | Endpoint      | Description           |
| -------- | ------------- | --------------------- |
| `POST`   | `/`           | Create section        |
| `GET`    | `/`           | Get all sections      |
| `PUT`    | `/:sectionId` | Update section        |
| `DELETE` | `/:sectionId` | Delete section        |
| `PUT`    | `/order`      | Update section order  |
| `GET`    | `/../board`   | Get full Kanban board |

### 💬 Chat Routes — `/api/:slug/chat`

| Method   | Endpoint         | Description        |
| -------- | ---------------- | ------------------ |
| `GET`    | `/`              | Get user's rooms   |
| `POST`   | `/`              | Create room        |
| `GET`    | `/:roomId`       | Room details       |
| `PUT`    | `/:roomId`       | Update room        |
| `DELETE` | `/:roomId`       | Delete room        |
| `POST`   | `/:roomId/leave` | Leave room         |
| `POST`   | `/participant`   | Add participant    |
| `DELETE` | `/participant`   | Remove participant |

### 📨 Message Routes — `/api/:slug/messages`

| Method   | Endpoint             | Description          |
| -------- | -------------------- | -------------------- |
| `PUT`    | `/:messageId`        | Edit message         |
| `DELETE` | `/:messageId`        | Soft-delete for self |
| `PUT`    | `/:messageId/pin`    | Pin message          |
| `PUT`    | `/:messageId/unpin`  | Unpin message        |
| `POST`   | `/:messageId/reply`  | Reply to a message   |
| `GET`    | `/:messageId/thread` | Get message thread   |
| `GET`    | `/search`            | Search messages      |

### 🔔 Notification Routes — `/api/:slug/notification`

| Method | Endpoint            | Description                     |
| ------ | ------------------- | ------------------------------- |
| `GET`  | `/all`              | Get all notifications           |
| `GET`  | `/unread-count`     | Get unread count (Redis-cached) |
| `POST` | `/mark-as-read/:id` | Mark one as read                |
| `POST` | `/mark-all-read`    | Mark all as read                |

### 💳 Subscription Routes — `/api/:slug/subscription`

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| `GET`  | `/history`           | Get subscription history    |
| `POST` | `/change-plan`       | Upgrade or downgrade plan   |
| `POST` | `/toggle-auto-renew` | Toggle auto-renewal         |
| `GET`  | `/expiry-reminder`   | Check expiry status         |
| `POST` | `/renew`             | Manually renew subscription |

### 📊 Activity Routes — `/api/:slug/activity`

| Method | Endpoint              | Description                 |
| ------ | --------------------- | --------------------------- |
| `GET`  | `/`                   | Tenant-wide activity feed   |
| `GET`  | `/project/:projectId` | Project activity            |
| `GET`  | `/user/:userId`       | User activity               |
| `GET`  | `/stats`              | Activity stats (aggregated) |

### 🔒 Audit Routes — `/api/:slug/audit`

| Method | Endpoint        | Description                               |
| ------ | --------------- | ----------------------------------------- |
| `GET`  | `/`             | Tenant audit logs (filterable, paginated) |
| `GET`  | `/stats`        | Audit action stats                        |
| `GET`  | `/user/:userId` | Audit logs by user                        |

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/multi-tenant

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_SECRET=your_socket_secret

# Redis
REDIS_URL=redis://localhost:6379

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_app_password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI
- Redis running locally or a managed Redis URL

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/multi-tenant-system.git
cd multi-tenant-system/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# → Fill in your MongoDB, Redis, JWT, and Email values

# Start development server
npm run dev
```

### First Steps After Startup

1. **Register an Owner** — `POST /api/auth/register-owner`
2. **Verify Email** — Click the link sent to your email
3. **Login** — `POST /api/auth/login` — get your access token and tenant slug
4. **Use the slug in all further requests** — e.g., `GET /api/your-slug/projects`

---

## 🔒 Security Highlights

- ✅ Passwords hashed with **bcrypt**
- ✅ JWT access tokens expire quickly (short TTL)
- ✅ Refresh tokens are **rotated on every use** and stored hashed
- ✅ HTTP-only cookies prevent XSS token theft
- ✅ Cross-tenant access prevented by slug-JWT mismatch check
- ✅ Redis rate limiting on all sensitive endpoints
- ✅ Suspended/expired tenants are completely blocked at middleware level
- ✅ Plan usage limits enforced before resource creation

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use it for learning or building your own SaaS.

---

<div align="center">
  <p>Built with ❤️ using Node.js · Express · MongoDB · Redis · Socket.IO</p>
</div>
