
export type ObjectId = string;

export type ISODateString = string;

export interface Timestamps {
    createdAt?: ISODateString;
    updatedAt?: ISODateString;
}

export type UserRole =
    | "SUPER_ADMIN"
    | "OWNER"
    | "ADMIN"
    | "MANAGER"
    | "USER"
    | "VIEWER";

export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type BillingCycle = "MONTHLY" | "YEARLY";

export type PaymentProvider = "MANUAL" | "STRIPE" | "RAZORPAY";

export type SubscriptionAction =
    | "CREATED"
    | "UPGRADED"
    | "DOWNGRADED"
    | "RENEWED";

export type PlanName = "FREE" | "PRO" | "ENTERPRISE";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "REVIEW";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type NotificationType =
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

export type ChatRoomType = "PROJECT" | "GROUP" | "DIRECT";

export type InviteRole = "ADMIN" | "MANAGER" | "USER" | "VIEWER";

// ─────────────────────────────────────────────
// 🔹 USER
// ─────────────────────────────────────────────

export interface User extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | null; // null for SUPER_ADMIN
    name: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
    status: UserStatus;
    userAgent?: string;
    lastLoginAt?: ISODateString;
}

// ─────────────────────────────────────────────
// 🔹 TENANT
// ─────────────────────────────────────────────

export interface Tenant extends Timestamps {
    _id: ObjectId;
    name: string;
    slug: string;
    currentSubscription?: ObjectId | TenantSubscription; // populated or raw ref
    isSuspended: boolean;
}

// ─────────────────────────────────────────────
// 🔹 PLAN
// ─────────────────────────────────────────────

export interface PlanLimits {
    maxUsers?: number;
    maxProjects?: number;
}

export interface PlanFeatures {
    chat?: boolean;
    analytics?: boolean;
    notifications?: boolean;
    kanban?: boolean;
}

export interface Plan extends Timestamps {
    _id: ObjectId;
    name: PlanName;
    price: number;
    limits: PlanLimits;
    features: PlanFeatures;
    isActive: boolean;
}

// ─────────────────────────────────────────────
// 🔹 TENANT SUBSCRIPTION
// ─────────────────────────────────────────────

export interface SubscriptionHistoryEntry {
    planId: ObjectId | Plan; // populated or raw ref
    startDate?: ISODateString;
    endDate?: ISODateString;
    changedAt?: ISODateString;
    action?: SubscriptionAction;
}

export interface TenantSubscription extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    planId: ObjectId | Plan;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate: ISODateString;
    endDate: ISODateString;
    autoRenew: boolean;
    cancelledAt?: ISODateString;
    paymentProvider: PaymentProvider;
    history: SubscriptionHistoryEntry[];
}

// ─────────────────────────────────────────────
// 🔹 USAGE
// ─────────────────────────────────────────────

export interface Usage extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    totalProjects: number;
    totalUsersInvited: number;
    totalTasks: number;
    currentPlanId?: ObjectId | Plan;
}

// ─────────────────────────────────────────────
// 🔹 PROJECT
// ─────────────────────────────────────────────

export interface Project extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    name: string;
    ownerId: ObjectId | User;
    description?: string;
    status: ProjectStatus;
}

// ─────────────────────────────────────────────
// 🔹 PROJECT MEMBER
// ─────────────────────────────────────────────

export interface ProjectMember extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    projectId: ObjectId | Project;
    userId: ObjectId | User;
    role: UserRole;
}

// ─────────────────────────────────────────────
// 🔹 SECTION (Kanban Column)
// ─────────────────────────────────────────────

export interface Section extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    name: string;
    projectId: ObjectId | Project;
    order: number;
}

// ─────────────────────────────────────────────
// 🔹 TASK
// ─────────────────────────────────────────────

export interface Task extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    order: number;
    dueDate?: ISODateString;
    sectionId?: ObjectId | Section;
    projectId: ObjectId | Project;
    assignedTo: Array<ObjectId | User>;
    createdBy: ObjectId | User;
}

// ─────────────────────────────────────────────
// 🔹 TASK COMMENT
// ─────────────────────────────────────────────

export interface TaskComment extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    taskId: ObjectId | Task;
    userId: ObjectId | User;
    mentions: Array<ObjectId | User>;
    message: string;
}

// ─────────────────────────────────────────────
// 🔹 NOTIFICATION
// ─────────────────────────────────────────────

export interface Notification extends Timestamps {
    _id: ObjectId;
    tenantId?: ObjectId | Tenant;
    userId?: ObjectId | User;
    title?: string;
    type?: NotificationType;
    message?: string;
    isRead: boolean;
}

// ─────────────────────────────────────────────
// 🔹 ACTIVITY LOG
// ─────────────────────────────────────────────

export interface ActivityLog extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    userId: ObjectId | User;
    actionType: string;
    entityId?: ObjectId;
    entityType?: string;
    details?: Record<string, unknown>;
    projectId?: ObjectId | Project;
}

// ─────────────────────────────────────────────
// 🔹 AUDIT LOG
// ─────────────────────────────────────────────

export interface AuditLog extends Timestamps {
    _id: ObjectId;
    tenantId?: ObjectId | Tenant;
    actorUserId?: ObjectId | User;
    action?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

// ─────────────────────────────────────────────
// 🔹 INVITE
// ─────────────────────────────────────────────

export interface Invite extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    email: string;
    role: InviteRole;
    token: string;
    expiresAt: ISODateString;
    isUsed: boolean;
    invitedBy?: ObjectId | User;
}

// ─────────────────────────────────────────────
// 🔹 CHAT ROOM
// ─────────────────────────────────────────────

export interface ChatRoom extends Timestamps {
    _id: ObjectId;
    projectId?: ObjectId | Project;
    tenantId: ObjectId | Tenant;
    name?: string;
    type: ChatRoomType;
    createdBy?: ObjectId | User;
}

// ─────────────────────────────────────────────
// 🔹 CHAT PARTICIPANT
// ─────────────────────────────────────────────

export interface ChatParticipant extends Timestamps {
    _id: ObjectId;
    chatRoomId: ObjectId | ChatRoom;
    userId: ObjectId | User;
}

// ─────────────────────────────────────────────
// 🔹 MESSAGE
// ─────────────────────────────────────────────

export interface Message extends Timestamps {
    _id: ObjectId;
    tenantId: ObjectId | Tenant;
    chatRoomId: ObjectId | ChatRoom;
    senderId: ObjectId | User;
    readBy: Array<ObjectId | User>;
    deletedFor: Array<ObjectId | User>;
    content: string;
    isEdited: boolean;
    isPinned: boolean;
    parentMessageId?: ObjectId | Message | null;
    replyTo?: ObjectId | Message | null;
    mentions: Array<ObjectId | User>;
}

// ─────────────────────────────────────────────
// 🔹 EMAIL VERIFICATION TOKEN
// ─────────────────────────────────────────────

export interface EmailVerificationToken extends Timestamps {
    _id: ObjectId;
    userId: ObjectId | User;
    token: string;
    expiresAt?: ISODateString;
    isUsed: boolean;
}

// ─────────────────────────────────────────────
// 🔹 API RESPONSE WRAPPERS
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// ─────────────────────────────────────────────
// 🔹 AUTH TYPES
// ─────────────────────────────────────────────

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    tenantName?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    tenant?: Tenant;
}

// ─────────────────────────────────────────────
// 🔹 KANBAN BOARD TYPES (frontend convenience)
// ─────────────────────────────────────────────

export interface KanbanSection extends Section {
    tasks: Task[];
}

export interface KanbanBoard {
    projectId: ObjectId;
    sections: KanbanSection[];
}