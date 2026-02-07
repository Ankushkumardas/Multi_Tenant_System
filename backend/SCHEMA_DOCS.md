# Backend Schema Documentation

This document explains the data models, their fields, and how they relate to each other in the Multi-Tenant System.

## 1. User (`UserSchema`)
Represents a person accessing the system.
- **`tenantId`**: Links the user to a specific company/tenant. if `null`, they might be a Super Admin.
- **`name`, `email`, `password`**: Basic identity fields.
- **`role`**: Permissions level (`OWNER`, `ADMIN`, `USER`, etc.).
- **`status`**: Account state (`ACTIVE`, `INVITED`, `SUSPENDED`).
- **`refreshToken`**: For secure session management via cookies.

## 2. Tenant (`TenantSchema`)
Represents a Company or Organization.
- **`name`**: The display name of the company.
- **`slug`**: A unique, URL-friendly identifier (e.g., `acme-corp`).
- **`subscriptionPlan`**: A quick reference string (`FREE`, `PRO`, `ENTERPRISE`) for frontend checks.
- **`subscriptionStatus`**: Billing state (`ACTIVE`, `PAUSED`, `CANCELLED`).
- **`isSuspended`**: Master switch to disable the entire company access.

## 3. Plan (`PlanSchema`)
Defines the capabilities and limits of a subscription tier.
- **`name`**: Unique identifier (`FREE`, `PRO`, `ENTERPRISE`).
- **`price`**: Cost of the plan.
- **`limits`**: Enforcement caps.
    - `maxUsers`: How many users can be added.
    - `maxProjects`: How many projects can be created.
- **`features`**: Boolean flags for capabilities.
    - `chat`, `analytics`, `notifications`, `kanban`.

## 4. TenantSubscription (`TenantSubscriptionSchema`)
The receipt or "active contract" linking a Tenant to a Plan.
- **`tenantId`**: Who is subscribed.
- **`planId`**: What plan they are on.
- **`status`**: State of this specific term (`ACTIVE`, `EXPIRED`).
- **`startDate`** & **`endDate`**: The valid period of the subscription.
- **`billingCycle`**: `MONTHLY` or `YEARLY`.

---

## 🔗 Relationships (How they link)

1. **User belongs to Tenant**: `User.tenantId` matches `Tenant._id`.
2. **Tenant has a Subscription**: `TenantSubscription.tenantId` matches `Tenant._id`.
3. **Subscription points to Plan**: `TenantSubscription.planId` matches `Plan._id`.
4. **Tenant mirrors Plan Name**: `Tenant.subscriptionPlan` is a string copy of `Plan.name` for fast access without always populating the full subscription.

## 🚀 Registration Flow
1. User provides details + optional `plan` name (defaults to FREE).
2. Code checks if the User already exists.
3. Code creates a `Tenant` with the given company name.
4. Code looks up the `Plan` document. If missing, it auto-creates default plans.
5. Code creates a `TenantSubscription` linking the new Tenant and the Plan, valid for 30 days.
6. Code updates the `User` to set `tenantId` and `role="OWNER"`.
