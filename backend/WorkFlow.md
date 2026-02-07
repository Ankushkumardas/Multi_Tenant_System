Two Registration Flows
🔹 FLOW 1: Tenant Owner Registration (Creates Tenant)
User signs up as OWNER
→ Tenant is created
→ User becomes OWNER of tenant
→ Free plan auto-attached

🔹 FLOW 2: Member Registration (Joins Existing Tenant)
Owner invites user
→ User registers via invite link
→ Tenant already exists
→ Role = MEMBER / ADMIN

HOW THIS LOOKS IN BACKEND TERMS
1️⃣ OWNER REGISTRATION (FIRST USER)
API
POST /api/auth/register-owner

1. Create Tenant
2. Attach FREE plan
3. Create User with role = OWNER
4. Link user.tenantId = tenant._id
5. Send email verification

1. Validate input
2. Check email uniqueness
3. Create Tenant
4. Fetch FREE plan
5. Create TenantSubscription
6. Create OWNER user
7. Generate email verification
8. Send email


2️⃣ MEMBER REGISTRATION (INVITED USER)
API
POST /api/auth/register-member

1. Validate invite token
2. Fetch tenantId + role
3. Create user under tenant
4. role = MEMBER or ADMIN
5. Send verification email

1. Validate invite token
2. Check expiry
3. Check email not already registered
4. Create user with:
   - tenantId from invite
   - role from invite
5. Send verification email
6. Delete invite token



POST /api/auth/register-owner
POST /api/auth/register-invite
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/logout
POST /api/auth/refresh

const freePlan = await Plan.findOne({ name: "FREE" });
if (!freePlan) throw new Error("Free plan not configured");
