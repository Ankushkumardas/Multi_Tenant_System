# 🏗️ FRONTEND ARCHITECTURE — Multi-Tenant SaaS

> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + TanStack Query + Zustand + React Router DOM v7 + Axios + Socket.io-client

---

## 📦 INSTALLED / TO INSTALL

```json
// Already installed (in package.json)
"react"              → UI
"react-dom"          → DOM renderer
"react-router-dom"   → Client-side routing (v7)
"tailwindcss"        → Styling
"zustand"            → Client state
"react-icons"        → Icon library
"typescript"         → Type safety

// Need to install
"axios"              → HTTP client (with interceptors for auto token refresh)
"@tanstack/react-query"   → Server state management
"socket.io-client"   → Real-time WebSocket
"@tanstack/react-query-devtools"  → Dev tooling
```

### Install Command:

```bash
npm install axios @tanstack/react-query socket.io-client
npm install -D @tanstack/react-query-devtools
```

---

## 📁 FOLDER STRUCTURE (`/src`)

```
/src
  /assets                  ← Static images, logos, icons

  /components              ← Reusable UI components
    /ui                    ← Base-level (Button, Input, Badge, Modal, Spinner)
    /layout                ← Sidebar, Topbar, PageWrapper
    /task                  ← TaskCard, TaskModal, TaskComments
    /kanban                ← KanbanBoard, KanbanColumn, KanbanCard
    /chat                  ← ChatSidebar, MessageBubble, ChatInput, ThreadPanel
    /notifications         ← NotificationBell, NotificationItem, NotificationDropdown
    /activity              ← ActivityItem, ActivityFeed
    /audit                 ← AuditLogRow, AuditStats
    /project               ← ProjectCard, ProjectForm, MemberRow
    /subscription          ← PlanCard, PlanBadge, UsageMeter

  /pages                   ← One file per route
    /auth
      Login.tsx
      Register.tsx
      VerifyEmail.tsx
      ForgotPassword.tsx
      ResetPassword.tsx
      AcceptInvite.tsx
    /dashboard
      Dashboard.tsx
    /projects
      ProjectList.tsx
      ProjectBoard.tsx       ← Kanban board
      ProjectTasks.tsx       ← Task list view
      ProjectMembers.tsx
      ProjectSettings.tsx
    /chat
      ChatLayout.tsx         ← Shell with sidebar
      ChatRoom.tsx           ← Active room
    /notifications
      NotificationsPage.tsx
    /activity
      ActivityPage.tsx
    /settings
      Profile.tsx
      Sessions.tsx
      Subscription.tsx
      TeamManagement.tsx
      AuditLogs.tsx
    NotFound.tsx
    Suspended.tsx

  /store                   ← Zustand stores
    authStore.ts
    uiStore.ts
    chatStore.ts

  /hooks                   ← Custom hooks
    useAuth.ts
    useSocket.ts
    useNotifications.ts
    useProject.ts
    useKanban.ts
    useChat.ts

  /lib                     ← Config and shared logic
    axios.ts               ← Axios instance + interceptors
    queryClient.ts         ← TanStack Query client
    socket.ts              ← Socket.io-client instance management

  /types                   ← All TypeScript interfaces/types
    user.types.ts
    tenant.types.ts
    project.types.ts
    task.types.ts
    chat.types.ts
    notification.types.ts
    subscription.types.ts
    activity.types.ts
    audit.types.ts

  /utils                   ← Helper functions
    formatDate.ts
    roleGuard.ts            ← Check if user has required role
    featureGate.ts          ← Check if plan has required feature
    cn.ts                   ← Class name merge helper (like clsx)

  /router                  ← All routing logic
    AppRouter.tsx           ← Root router
    ProtectedRoute.tsx      ← Auth guard
    TenantRoute.tsx         ← Slug-scoped guard
    RoleRoute.tsx           ← Role-based guard

  App.tsx                  ← Root component (providers wrapping)
  main.tsx                 ← Entry point
  index.css                ← Global Tailwind styles
```

---

## 🗺️ COMPLETE ROUTE MAP (React Router DOM v7)

```tsx
// AppRouter.tsx structure

<BrowserRouter>
  <Routes>
    {/* ─── PUBLIC AUTH ROUTES ─── */}
    <Route path="/" element={<Navigate to="/login" />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/accept-invite" element={<AcceptInvite />} />{" "}
    {/* ?token=xxx */}
    {/* ─── TENANT-SCOPED PROTECTED ROUTES ─── */}
    <Route element={<ProtectedRoute />}>
      <Route path="/:slug" element={<TenantRoute />}>
        {/* Dashboard */}
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Projects */}
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:projectId">
          <Route path="board" element={<ProjectBoard />} />
          <Route path="tasks" element={<ProjectTasks />} />
          <Route path="members" element={<ProjectMembers />} />
          <Route path="settings" element={<ProjectSettings />} />
        </Route>

        {/* Chat (plan-gated) */}
        <Route path="chat" element={<ChatLayout />}>
          <Route index element={<NoChatSelected />} />
          <Route path=":roomId" element={<ChatRoom />} />
        </Route>

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Activity */}
        <Route path="activity" element={<ActivityPage />} />

        {/* Settings */}
        <Route path="settings">
          <Route path="profile" element={<Profile />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="subscription" element={<Subscription />} />
          {/* Role-guarded: OWNER / ADMIN only */}
          <Route element={<RoleRoute allowedRoles={["OWNER", "ADMIN"]} />}>
            <Route path="team" element={<TeamManagement />} />
            <Route path="audit" element={<AuditLogs />} />
          </Route>
        </Route>
      </Route>
    </Route>
    {/* ─── SPECIAL PAGES ─── */}
    <Route path="/suspended" element={<Suspended />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

---

## 🔐 AUTH PAGES & FLOW

### Routes

| Route                      | Page                       | Backend API                         |
| -------------------------- | -------------------------- | ----------------------------------- |
| `/login`                   | Login form                 | `POST /api/auth/login`              |
| `/register`                | Owner signup               | `POST /api/auth/register-owner`     |
| `/verify-email`            | OTP / link handler         | `POST /api/auth/verify-owner-email` |
| `/forgot-password`         | Email input                | `POST /api/auth/forgot-password`    |
| `/reset-password`          | New password form          | `POST /api/auth/reset-password`     |
| `/accept-invite?token=xxx` | Set password & join tenant | `POST /api/auth/accept-invite`      |

### Cookie-Based Auth Flow

```
1. User logs in → backend sets httpOnly cookie (refreshToken)
2. Backend returns: { user, tenant, accessToken }
3. Frontend: store user + tenant in Zustand authStore
4. Store accessToken in memory (NOT localStorage)
5. Axios interceptor: on 401 → call /api/auth/refresh → retry original request
6. On app load: call GET /api/:slug/user/profile
   → Success: hydrate authStore
   → 401: redirect to /login
```

---

## 🧠 STATE MANAGEMENT

### Zustand Store 1 — `authStore.ts`

```ts
interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setUser: (user: User) => void;
  setTenant: (tenant: Tenant) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}
```

### Zustand Store 2 — `uiStore.ts`

```ts
interface UIStore {
  isSidebarOpen: boolean;
  activeModal:
    | "createProject"
    | "createTask"
    | "inviteMember"
    | "confirmDelete"
    | null;
  modalData: Record<string, unknown> | null;

  toggleSidebar: () => void;
  openModal: (
    modal: UIStore["activeModal"],
    data?: Record<string, unknown>,
  ) => void;
  closeModal: () => void;
}
```

### Zustand Store 3 — `chatStore.ts`

```ts
interface ChatStore {
  activeRoomId: string | null;
  typingUsers: Record<string, string[]>; // roomId → userId[]
  onlineUsers: Set<string>; // userIds online
  socket: Socket | null;

  setActiveRoom: (roomId: string | null) => void;
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
  setSocket: (socket: Socket) => void;
}
```

---

## 🔌 LIB CONFIGURATION

### `lib/axios.ts`

```ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:5000
  withCredentials: true, // sends httpOnly cookie automatically
});

// Auto-inject accessToken
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    const res = await api.post("/api/auth/refresh");
    useAuthStore.getState().setAccessToken(res.data.accessToken);
    return api.request(error.config);
  }
  return Promise.reject(error);
});

export default api;
```

### `lib/socket.ts`

```ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (accessToken: string): Socket => {
  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token: accessToken }, // backend reads: socket.handshake.auth.token
    withCredentials: true,
  });
  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => socket?.disconnect();
```

### `lib/queryClient.ts`

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});
```

### `.env` file

```bash
VITE_API_URL=http://localhost:5000
```

---

## 🏠 DASHBOARD PAGE

**Route:** `/:slug/dashboard`

| Widget                            | Data Source                                   | Condition             |
| --------------------------------- | --------------------------------------------- | --------------------- |
| Active projects count             | `GET /api/:slug/projects`                     | All                   |
| My assigned tasks                 | `GET /api/:slug/projects/:id/tasks/:id`       | All                   |
| Unread notifications badge        | `GET /api/:slug/notification/unread-count`    | Plan: `notifications` |
| Subscription status/expiry banner | `GET /api/:slug/subscription/expiry-reminder` | All                   |
| Recent activity timeline          | `GET /api/:slug/activity`                     | All                   |
| Quick create (project, task)      | Local UI + mutations                          | OWNER/ADMIN           |

---

## 📁 PROJECTS PAGES

### Project List `/:slug/projects`

- Cards grid layout, each showing name, member count, archived badge
- **Create Project** button → only `OWNER` (enforced backend + hidden in UI)
- Archive toggle → `OWNER` / `ADMIN`
- Plan limit bar: `currentProjects / plan.limits.maxProjects`

### Kanban Board `/:slug/projects/:id/board`

The most complex page — drag-and-drop columns.

| UI Action                   | Backend API                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| Load board                  | `GET /api/:slug/projects/:id/board`                                |
| Create column               | `POST /api/:slug/projects/:id/sections`                            |
| Rename column               | `PUT /api/:slug/projects/:id/sections/:sectionId`                  |
| Delete column               | `DELETE /api/:slug/projects/:id/sections/:sectionId`               |
| Reorder columns (drag)      | `PUT /api/:slug/projects/:id/sections/order`                       |
| Create task card            | `POST /api/:slug/projects/:id/tasks`                               |
| Move task between columns   | `PUT /api/:slug/projects/:id/tasks/:taskId/status`                 |
| Reorder tasks within column | `PUT /api/:slug/projects/:id/tasks/:taskId` (update `order` field) |
| Open task → Task Modal      | Component overlay                                                  |

**Plan Gate:** Feature `kanban` must be `true`. Show upgrade prompt if not.

### Task Modal (Shared Overlay Component)

Slide-in from the right when a task card is clicked.

| Section                  | API Called                                     |
| ------------------------ | ---------------------------------------------- |
| Edit title / description | `PUT .../tasks/:taskId`                        |
| Status dropdown          | `PUT .../tasks/:taskId/status`                 |
| Priority selector        | `PUT .../tasks/:taskId/priority`               |
| Due date picker          | `PUT .../tasks/:taskId/due-date`               |
| Assignees multi-select   | `POST .../tasks/:taskId/assign`                |
| Comments section list    | `GET .../tasks/:taskId/comments`               |
| Post comment             | `POST .../tasks/:taskId/comments`              |
| Edit comment             | `PUT .../tasks/:taskId/comments/:commentId`    |
| Delete comment           | `DELETE .../tasks/:taskId/comments/:commentId` |

### Task List View `/:slug/projects/:id/tasks`

- Flat list grouped by status column
- Quick inline edit: priority, due date
- Filter bar: Status / Priority / Assignee

### Project Members `/:slug/projects/:id/members`

| Action        | API                                    | Role        |
| ------------- | -------------------------------------- | ----------- |
| View list     | `GET /projects/:id/members`            | All         |
| Add member    | `POST /projects/:id/add-member`        | OWNER/ADMIN |
| Remove member | `DELETE /projects/:id/remove-member`   | OWNER/ADMIN |
| Update role   | `PUT /projects/:id/update-member-role` | OWNER/ADMIN |
| Leave project | `POST /projects/:id/leave`             | Any member  |

### Project Settings `/:slug/projects/:id/settings`

- Edit name/description → `PUT /api/:slug/projects/:id`
- Delete → `DELETE` (OWNER only, with confirm dialog)
- Archive/Unarchive → `POST /api/:slug/projects/:id/toggle-archive`

---

## 💬 CHAT PAGES

**Plan Gate:** Feature `chat === true`

### Chat Layout `/:slug/chat`

- Left sidebar → list of rooms (`GET /api/:slug/chat`)
- DM vs Group room type displayed differently
- Unread badge per room
- Create room button

### Active Chat Room `/:slug/chat/:roomId`

| Feature             | Method                                               |
| ------------------- | ---------------------------------------------------- |
| Load room info      | `GET /api/:slug/chat/:roomId`                        |
| Send message        | **Socket.emit** `chat:send`                          |
| Receive new message | **Socket.on** `chat:message`                         |
| Edit message        | `PUT /api/:slug/messages/:messageId`                 |
| Delete message      | `DELETE /api/:slug/messages/:messageId`              |
| Pin / Unpin         | `PUT /api/:slug/messages/:messageId/pin` or `/unpin` |
| Reply               | `POST /api/:slug/messages/:messageId/reply`          |
| View thread         | `GET /api/:slug/messages/:messageId/thread`          |
| Search messages     | `GET /api/:slug/messages/search?q=...`               |
| Typing indicator    | **Socket.emit** `chat:typing` / `chat:stopTyping`    |
| @mentions           | Filter project/room members locally                  |
| Manage participants | `POST/DELETE /api/:slug/chat/participant`            |

### Socket Events (Client ↔ Server)

```ts
// CLIENT → SERVER (emit)
socket.emit("chat:send", { roomId, content, mentions });
socket.emit("chat:typing", { roomId });
socket.emit("chat:stopTyping", { roomId });

// SERVER → CLIENT (listen)
socket.on("chat:message", (msg) => {
  /* append */
});
socket.on("chat:edited", (msg) => {
  /* update */
});
socket.on("chat:deleted", (msgId) => {
  /* remove */
});
socket.on("user:online", (userId) => {
  /* green dot */
});
socket.on("user:offline", (userId) => {
  /* grey dot */
});
socket.on("notification:new", (n) => {
  /* toast + badge */
});
```

---

## 🔔 NOTIFICATIONS

### Global Bell (in Topbar — always mounted)

- Unread count → `GET /api/:slug/notification/unread-count`
- Socket `notification:new` → auto-increment badge + toast
- Dropdown shows last 5 notifications
- Mark one read → `POST /api/:slug/notification/mark-as-read/:id`
- Mark all read → `POST /api/:slug/notification/mark-all-read`

### Notification Types (icon + color per type)

```
SYSTEM   → gray bell      AUTH     → red shield
MESSAGE  → blue chat      INVITE   → purple envelope
BILLING  → yellow card    SECURITY → red lock
MENTION  → green @        PROJECT  → blue folder
TASK     → orange check   CHAT     → teal bubble
INFO     → gray info
```

### Notifications Page `/:slug/notifications`

- Full paginated list → `GET /api/:slug/notification/all`
- Tab filter: All / Mentions / Tasks / Billing

---

## 📊 ACTIVITY FEED `/:slug/activity`

| Feature        | API                                          |
| -------------- | -------------------------------------------- |
| Tenant-wide    | `GET /api/:slug/activity/`                   |
| By project     | `GET /api/:slug/activity/project/:projectId` |
| By user        | `GET /api/:slug/activity/user/:userId`       |
| Stats (counts) | `GET /api/:slug/activity/stats`              |

---

## ⚙️ SETTINGS PAGES

### Profile `/:slug/settings/profile`

| Feature         | API                                    |
| --------------- | -------------------------------------- |
| View name/email | `GET /api/:slug/user/profile`          |
| Update profile  | `PUT /api/:slug/user/update-profile`   |
| Change password | `POST /api/:slug/user/change-password` |

### Sessions `/:slug/settings/sessions`

- All active sessions → `GET /api/:slug/user/sessions`
- Shows device, browser, last active
- Logout specific session button

### Subscription `/:slug/settings/subscription`

**Visible to:** `OWNER` only

| Feature                | API                                              |
| ---------------------- | ------------------------------------------------ |
| History + current plan | `GET /api/:slug/subscription/history`            |
| Change plan            | `POST /api/:slug/subscription/change-plan`       |
| Toggle auto-renew      | `POST /api/:slug/subscription/toggle-auto-renew` |
| Renew                  | `POST /api/:slug/subscription/renew`             |
| Expiry warning         | `GET /api/:slug/subscription/expiry-reminder`    |

**Plan UI:**

```
FREE        → Gray badge   → shows limits (maxUsers, maxProjects)
PRO         → Blue badge   → features unlocked
ENTERPRISE  → Gold badge   → all features
```

### Team Management `/:slug/settings/team`

**Visible to:** `OWNER`, `ADMIN`

| Feature              | API                                    |
| -------------------- | -------------------------------------- |
| Send invite to email | `POST /api/admin/send-invite`          |
| Update user role     | `PUT /api/admin/update-role`           |
| Force logout a user  | `POST /api/admin/force-logout/:userId` |

- Usage meter: `currentUsers / plan.limits.maxUsers`
- Pending invites list
- Suspended user indicators

### Audit Logs `/:slug/settings/audit`

**Visible to:** `OWNER`, `ADMIN` ONLY (backend enforces it too)

| Feature         | API                                 |
| --------------- | ----------------------------------- |
| All tenant logs | `GET /api/:slug/audit/`             |
| Stats summary   | `GET /api/:slug/audit/stats`        |
| Logs for a user | `GET /api/:slug/audit/user/:userId` |

- Date range filter
- User filter dropdown

---

## 🛡️ ROLE-BASED UI MATRIX

| Feature                 | OWNER | ADMIN | MANAGER | USER | VIEWER |
| ----------------------- | ----- | ----- | ------- | ---- | ------ |
| Create Project          | ✅    | ❌    | ❌      | ❌   | ❌     |
| Archive/Delete Project  | ✅    | ✅    | ❌      | ❌   | ❌     |
| Create/Edit/Delete Task | ✅    | ✅    | ✅      | ❌   | ❌     |
| Assign Task             | ✅    | ✅    | ✅      | ❌   | ❌     |
| Comment on Task         | ✅    | ✅    | ✅      | ✅   | ✅     |
| Create/Edit Sections    | ✅    | ✅    | ✅      | ❌   | ❌     |
| Send Team Invite        | ✅    | ✅    | ❌      | ❌   | ❌     |
| Update User Roles       | ✅    | ✅    | ❌      | ❌   | ❌     |
| View Audit Logs         | ✅    | ✅    | ❌      | ❌   | ❌     |
| Manage Subscription     | ✅    | ❌    | ❌      | ❌   | ❌     |
| Force Logout User       | ✅    | ✅    | ❌      | ❌   | ❌     |
| View Activity Feed      | ✅    | ✅    | ✅      | ✅   | ✅     |

---

## 🔑 TYPESCRIPT INTERFACES (Key Types)

```ts
// types/user.types.ts
type Role = "OWNER" | "ADMIN" | "MANAGER" | "USER" | "VIEWER" | "SUPER_ADMIN";
type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  isEmailVerified: boolean;
  tenantId: string;
  lastLoginAt: string;
  createdAt: string;
}

// types/tenant.types.ts
type SubscriptionPlan = "FREE" | "PRO" | "ENTERPRISE";
type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  isSuspended: boolean;
}

// types/task.types.ts
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  order: number;
  sectionId: string;
  projectId: string;
  assignedTo: User[];
  createdBy: User;
  createdAt: string;
}

// types/notification.types.ts
type NotificationType =
  | "SYSTEM"
  | "MESSAGE"
  | "BILLING"
  | "USER"
  | "AUTH"
  | "MENTION"
  | "INVITE"
  | "SECURITY"
  | "PROJECT"
  | "TASK"
  | "CHAT"
  | "INFO";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
```

---

## 📦 TANSTACK QUERY — KEY CONVENTIONS

```ts
// Keeps cache organized and predictable for invalidation

["projects", slug][("project", slug, projectId)][("board", slug, projectId)][ // GET /api/:slug/projects // GET /api/:slug/projects/:id // GET /api/:slug/projects/:id/board
  ("task", slug, projectId, taskId)
][("comments", slug, projectId, taskId)][("chat-rooms", slug)][ // GET /api/:slug/projects/:id/tasks/:taskId // GET .../tasks/:taskId/comments // GET /api/:slug/chat
  ("room", slug, roomId)
][("notifications", slug)][("unread-count", slug)][("activity", slug)][ // GET /api/:slug/chat/:roomId // GET /api/:slug/notification/all // GET /api/:slug/notification/unread-count // GET /api/:slug/activity
  ("activity-stats", slug)
][("audit", slug)][("subscription", slug)][("profile", slug)][ // GET /api/:slug/activity/stats // GET /api/:slug/audit // GET /api/:slug/subscription/history // GET /api/:slug/user/profile
  ("sessions", slug)
]; // GET /api/:slug/user/sessions
```

---

## 🔄 NAVIGATION LAYOUT

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR: Logo | Tenant Name | Search | 🔔 Bell | User Avatar    │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  SIDEBAR     │   PAGE CONTENT                                    │
│              │                                                   │
│  🏠 Dashboard│                                                   │
│  📁 Projects │                                                   │
│     └ List   │                                                   │
│  💬 Chat     │                                                   │
│     (gated)  │                                                   │
│  📊 Activity │                                                   │
│  ─────────── │                                                   │
│  ⚙ Settings  │                                                   │
│    Profile   │                                                   │
│    Sessions  │                                                   │
│    Subscript │                                                   │
│    Team*     │                                                   │
│    Audit*    │                                                   │
│  ─────────── │                                                   │
│  [Avatar]    │                                                   │
│  [Logout]    │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
  * = OWNER/ADMIN only
```

---

## 🚦 ROUTE GUARD COMPONENTS

### `ProtectedRoute.tsx`

```tsx
// Checks: is user authenticated?
// If not → redirect to /login
// On load: hydrates authStore from profile API
// Also checks: isSuspended → redirect /suspended
```

### `TenantRoute.tsx`

```tsx
// Reads :slug from URL
// Validates it matches tenant.slug in authStore
// Provides tenant context to all child pages
```

### `RoleRoute.tsx`

```tsx
// Props: allowedRoles: Role[]
// Checks: authStore.user.role is in allowedRoles
// If not → shows 403 / redirect to dashboard
```

### `FeatureGate.tsx` (Component)

```tsx
// Props: feature: "chat" | "kanban" | "analytics" | "notifications"
// Checks: tenant subscriptionPlan has this feature enabled
// If not → renders <UpgradePrompt /> instead of children
```

---

## 🗂️ `App.tsx` — Root Structure

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import AppRouter from "./router/AppRouter";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
```

---

## ✅ BUILD PRIORITY ORDER

```
PHASE 1 — Core Foundation
  [ ] Install: axios, @tanstack/react-query, socket.io-client
  [ ] Setup: lib/axios.ts, lib/queryClient.ts, lib/socket.ts
  [ ] Setup: .env (VITE_API_URL)
  [ ] Create: types/ directory (all TypeScript interfaces)
  [ ] Create: Zustand stores (authStore, uiStore, chatStore)
  [ ] Create: AppRouter with all routes
  [ ] Create: ProtectedRoute, TenantRoute, RoleRoute guards

PHASE 2 — Auth Pages
  [ ] Login.tsx
  [ ] Register.tsx
  [ ] VerifyEmail.tsx
  [ ] ForgotPassword.tsx + ResetPassword.tsx
  [ ] AcceptInvite.tsx

PHASE 3 — Base Layout
  [ ] Sidebar.tsx
  [ ] Topbar.tsx (with notification bell)
  [ ] Dashboard.tsx (widgets)

PHASE 4 — Projects & Kanban
  [ ] ProjectList.tsx
  [ ] ProjectBoard.tsx (Kanban drag-drop)
  [ ] TaskModal.tsx (shared overlay)
  [ ] ProjectTasks.tsx (list view)
  [ ] ProjectMembers.tsx + ProjectSettings.tsx

PHASE 5 — Real-Time Chat
  [ ] ChatLayout.tsx + ChatRoom.tsx
  [ ] Socket integration (connect on login)
  [ ] MessageBubble, Thread panel, Typing indicator

PHASE 6 — Notifications & Activity
  [ ] NotificationBell + dropdown (real-time)
  [ ] NotificationsPage.tsx
  [ ] ActivityPage.tsx

PHASE 7 — Settings & Admin
  [ ] Profile.tsx + Sessions.tsx
  [ ] Subscription.tsx (plan management)
  [ ] TeamManagement.tsx (invite, roles, force-logout)
  [ ] AuditLogs.tsx (OWNER/ADMIN gated)

PHASE 8 — Polish
  [ ] Loading skeletons for all data-fetching pages
  [ ] Error boundaries
  [ ] FeatureGate + UpgradePrompt components
  [ ] UsageMeter component
  [ ] Responsive mobile layout
  [ ] Toast notification system
```
