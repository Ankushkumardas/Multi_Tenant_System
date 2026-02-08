# Multi-Tenant System

A comprehensive multi-tenant application with robust authentication, role-based access control (RBAC), and subscription management.

## 🚀 Features & Functionalities

### 🔐 Authentication & Security

- **Owner Registration**: Secure sign-up process that automatically creates a new Tenant organization.
- **Login System**: Secure login with JWT (JSON Web Tokens) access tokens.
- **Session Management**:
  - **Redis-backed Sessions**: High-performance session tracking.
  - **Refresh Tokens**: Secure token rotation with database fallback.
- **Password Management**:
  - **Forgot Password**: Secure email-based reset flow.
  - **Reset Password**: Token-based password recovery.
  - **Change Password**: Authenticated password update.
- **Email Verification**: Mandatory email verification for new accounts.
- **Force Logout**: Admins/Owners can force logout specific users (revokes refresh tokens and clears Redis sessions).

### 🏢 Multi-Tenancy Architecture

- **Tenant Isolation**: Strict data isolation ensures users access only their organization's data.
- **Dynamic Tenant Creation**: Automatically generates unique slugs for new organizations.
- **Subscription Management**:
  - **Plans**: Built-in support for **FREE**, **PRO**, and **ENTERPRISE** tiers.
  - **Status Tracking**: Handles **ACTIVE**, **CANCELLED**, and **SUSPENDED** states.
  - **Plan Limits**: Enforces usage limits (e.g., max users per plan).

### 👥 User Management & RBAC

- **Role-Based Access Control**:
  - **OWNER**: Full control over the tenant and billing.
  - **ADMIN**: Administrative privileges within the tenant.
  - **USER**: Standard access.
- **Invitation System**:
  - **Invite Users**: Owners/Admins can invite members via email.
  - **Accept Invite**: Secure token-based acceptance flow.
  - **Plan Enforcement**: Prevents inviting more users than the subscription plan allows.
- **Profile Management**: Users can update their profile information.

## 🛠️ Tech Stack

### Backend

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose ODM)
- **Caching & Sessions**: [Redis](https://redis.io/)
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: [Nodemailer](https://nodemailer.com/)

### Utils & Services

- **Token Service**: Handles JWT generation and hashing.
- **Mail Service**: Manages transactional emails.
- **Slugify**: Generates URL-friendly tenant slugs.

## 📂 Project Structure

```
backend/
├── src/
│   ├── controller/      # Business logic (Auth, Tenant, User operations)
│   ├── middleware/      # Auth & Tenant verification middleware
│   ├── models/          # Mongoose schemas (User, Tenant, Plans, etc.)
│   ├── routes/          # API endpoints
│   ├── service/         # Helper services (Email, Token, etc.)
│   ├── utils/           # DB connections, Redis client, etc.
│   └── server.js        # Entry point
```

## 🚦 Getting Started

1.  **Clone the repository**
2.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env` file with:
    - `PORT`
    - `MONGO_URI`
    - `REDIS_URL`
    - `JWT_ACCESS_SECRET`
    - `JWT_REFRESH_SECRET`
    - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
4.  **Run the Server**:
    ```bash
    npm run dev
    ```
