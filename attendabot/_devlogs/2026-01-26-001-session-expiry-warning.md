# 2026-01-26-001: Session Expiry Warning Banner

## Summary

Added a UI banner that detects when the user's session is expired or invalid and prompts them to log out and log back in. Previously, users with stale tokens would see an empty dashboard with no indication of what was wrong.

## What We Did

### Problem

The admin panel checked for login by only looking at whether a JWT token existed in localStorage. If the token was expired or invalid (e.g., server restarted with a new JWT_SECRET), the app would render the dashboard but all API calls would silently fail, returning empty data. The user had no way to know they needed to re-authenticate.

### Solution

1. **Proactive session verification** (`verifySession()` in `api/client.ts`)
   - On page load, makes a lightweight call to `/api/status` with the stored token
   - If the backend returns 401/403, marks the session as invalid
   - Network errors are treated as "unknown" (not invalid) to avoid false positives

2. **Auth failure callback system** (`onAuthFailure()` in `api/client.ts`)
   - `fetchWithAuth` now invokes a registered callback when any API call gets a 401/403
   - App.tsx subscribes to this on mount, so mid-session token expiry is also caught

3. **Warning banner** (in `App.tsx`)
   - Red banner appears below the header when the session is invalid
   - Message: "Your session has expired or is invalid. Data may not load correctly. Please log out and log back in to fix this."
   - "log out and log back in" is a clickable link that triggers logout directly

## Files Modified
- `frontend/src/api/client.ts` - Added `verifySession()`, `onAuthFailure()`, updated `fetchWithAuth`
- `frontend/src/App.tsx` - Session validation on mount, warning banner rendering
- `frontend/src/App.css` - `.session-warning` and `.session-warning-btn` styles

---
*See `devlogs/private/` for version with deployment details (gitignored)*
