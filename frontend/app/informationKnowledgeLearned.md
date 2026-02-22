An Interceptor is like a middleman.

It intercepts:

🔵 Request BEFORE it is sent to the server

🔴 Response BEFORE it reaches your React component

Think of it like:

React → Interceptor → Server → Interceptor → React

Without interceptors:

You must manually attach token in every API call

You must handle 401 errors in every API call

You repeat code everywhere ❌

With interceptors:

Automatically attach JWT token

Automatically refresh token

Automatically redirect on logout

Global error handling

Cleaner code ✅

Two Types of Interceptors
🔵 1. Request Interceptor

Runs before request goes to server.

Used for:

Attach JWT token

Add headers

Add tenantId

Add user info

🔴 2. Response Interceptor

Runs before response reaches component.

Used for:

Handle 401 Unauthorized

Auto refresh token

Global error handling

Redirect to login