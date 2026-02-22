FRONTEND ARCHITECTURE OVERVIEW

Your backend currently supports:

Auth (JWT)

Multi-tenant

Projects

Kanban

Tasks

Chat (real-time + threads + mentions)

Notifications

Activity logs

Audit logs

Role-based permissions

Redis scaling ready

So frontend must support:--->

Auth Flow
Tenant-aware dashboard
Project workspace
Kanban board
Task modal system
Real-time chat
Notifications panel
Activity feed
Admin audit panel
Role-based UI

STATE MANAGEMENT
Rule: Separate Server State & Client State
1️⃣ TanStack Query → Server State

Used for:

Projects

Tasks

Messages

Notifications

Activity logs

Audit logs

Anything fetched from backend.

2️⃣ Zustand → Client State

Used for:

Auth user

Current tenant

Selected project

Selected chat room

UI modals

Sidebar open/close

Typing state

Online users

Socket instance
