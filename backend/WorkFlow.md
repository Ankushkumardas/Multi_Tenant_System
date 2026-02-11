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




<!-- for invite member -->
Owner sends invite → User clicks link →Validate token->Register/Login →Verify email → Join tenant → Login


for monitering in server we will user redis-cli moniter package and use it to debug redis

and for seession management we will use redis and also user-agent and ip address to prevent session hijacking---> for session maanging we are using a middleware fucntion session.js and using it --->What is this function trying to do?

It is trying to:

Generate a session identifier based on the
user's device (browser) and IP address.

So the idea is:

Same device + same IP → same sessionId

Different device/IP → different sessionId
What Redis is Doing Internally

After 3 logins:

Redis memory:

refresh:user:123:a1 → token
refresh:user:123:b2 → token
refresh:user:123:c3 → token

sessions:user:123 = { a1, b2, c3 }


This enables:

Feature	Possible
Multi-device login	✅
Logout one device	✅
Logout all devices	✅
Show sessions	✅
Kill stolen token	✅



Notification system structure hwy we y=use redis and websocket when we have mongodb__>
If we already have MongoDB schema for notifications, why do we need Redis and WebSockets?

🧠 First Understand the Roles

Think of them like this:

Tool	Job
MongoDB	Storage (database)
WebSocket	Real-time delivery
Redis	Fast middle layer (speed + scaling)

They are NOT replacing each other.
They are solving different problems.

1️⃣ Why MongoDB Alone Is Not Enough

MongoDB stores notifications.

Example:

await Notification.create({...})


That means the notification is saved.

But here is the problem:

👉 MongoDB does NOT push data to the frontend.

It only stores data.

If you save a notification in MongoDB:

The user will NOT automatically see it.

The frontend must refresh or poll the API.

That causes delay.

So MongoDB = Storage only.

2️⃣ Why We Use WebSocket

WebSocket solves this:

“How do we instantly tell the user something happened?”

Example:

User receives message

User gets login alert

Task assigned

Instead of refreshing page, WebSocket does:

io.to(userId).emit("newNotification", notification)


Now user sees notification instantly 🔔

So:

MongoDB = stores it
WebSocket = sends it instantly

3️⃣ Then Why Redis?

Now imagine:

You scale your app.

You have:

Server 1

Server 2

Server 3

User is connected to Server 1
Notification was created in Server 2

How does Server 1 know about it?

👉 This is where Redis comes.

Redis works as a message broker between servers.

Flow:

Server 2:

Save in MongoDB
Publish to Redis


Server 1:

Subscribed to Redis
Receives message
Emits via WebSocket


Without Redis:

Notifications break in multi-server setup.

🔥 Simple Real Life Example

Imagine:

📦 MongoDB = Warehouse (stores parcels)
📞 WebSocket = Delivery boy (instantly delivers parcel)
📡 Redis = Radio system between warehouses

If you only have warehouse:
→ Parcel is stored but nobody knows.

If you only have delivery boy:
→ No place to store parcel history.

If you scale warehouses:
→ You need radio (Redis) to coordinate.

4️⃣ What If We Use Only MongoDB?

You could do polling:

Frontend every 5 seconds:

GET /notifications


Problems:

Slow

Wasteful

Not real-time

High server load

WebSocket solves this.

5️⃣ Do You ALWAYS Need Redis?

No.

If:

You have only 1 server

Small app

No scaling

You can use:
MongoDB + WebSocket only.

Redis becomes important when:

Multi-server

High traffic

Pub/Sub architecture

Caching unread count

🎯 So Final Answer

We use:

MongoDB → Permanent storage
WebSocket → Instant delivery
Redis → Scaling + performance + multi-server sync

They do different jobs.