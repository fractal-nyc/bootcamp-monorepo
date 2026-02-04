# 2026-02-04-001: Remove JWT Authentication

## Summary

Removed all JWT-based authentication from the attendabot admin panel, consolidating on BetterAuth (Discord OAuth) session cookies as the sole auth method. The password login form has been removed — login is now Discord-only.

## What We Did

### Backend

1. **Simplified `auth.ts` middleware** — removed `jwt` import, `getJwtSecret()`, `generateToken()`, `verifyCredentials()`, `verifyPassword()`, `getValidUsernames()`, and all instructor password logic. `authenticateToken()` now only verifies BetterAuth session cookies.
2. **Cleaned up `auth.ts` routes** — removed `POST /login` (JWT token issuance) and `GET /usernames` (password login dropdown) endpoints. Only `GET /login-config` remains.
3. **Simplified `websocket.ts`** — removed JWT token extraction/verification from WebSocket upgrade handler. Now authenticates exclusively via BetterAuth session cookies on the upgrade request.

### Frontend

1. **Stripped JWT from `client.ts`** — removed `getToken()`, `setToken()`, `clearToken()`, `isLoggedIn()`, `verifySession()`, `login()`, `getUsernames()`, `getLoginConfig()`. Renamed `clearToken()` to `clearSession()`. `fetchWithAuth()` now sends `credentials: "include"` instead of Bearer headers.
2. **Simplified `useWebSocket` hook** — removed `token` parameter entirely. Always connects without token query param; cookies are sent automatically with the upgrade request.
3. **Simplified `ServerLogs`** — removed `getToken` import, calls `useWebSocket()` with no args.
4. **Discord-only `Login` component** — removed password form, username dropdown, and related state. Only the Discord OAuth button remains.
5. **Simplified `App.tsx`** — removed all JWT session checks (`isLoggedIn`, `verifySession`, `getUsername`). Auth state is determined solely by BetterAuth `getSession()`.

### Tests

Rewrote `auth.test.ts` from 21 JWT-focused tests down to 4 BetterAuth session tests covering: no session (401), valid session, email fallback for username, and error handling.

## Files Modified
- `backend/src/api/middleware/auth.ts` - BetterAuth-only middleware
- `backend/src/api/routes/auth.ts` - Removed login/usernames endpoints
- `backend/src/api/websocket.ts` - Cookie-only WebSocket auth
- `backend/src/test/api/auth.test.ts` - BetterAuth session tests
- `frontend/src/api/client.ts` - Removed JWT storage/retrieval, cookie-based fetch
- `frontend/src/hooks/useWebSocket.ts` - No token parameter
- `frontend/src/components/ServerLogs.tsx` - Removed token usage
- `frontend/src/components/Login.tsx` - Discord-only login
- `frontend/src/App.tsx` - BetterAuth-only session management
