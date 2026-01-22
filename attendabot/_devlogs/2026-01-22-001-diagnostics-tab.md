# 2026-01-22-001: Diagnostics Tab with Real-Time Server Logs

## Summary

Added a new Diagnostics tab to the admin panel with real-time server log streaming via WebSocket. Moved Bot Status from Messages tab to Diagnostics. Also fixed browser caching issues and changed Message Feed to fetch from Discord by default.

## What We Did

### 1. Backend Logger Service
- Created `backend/src/services/logger.ts` with console interception
- Maintains 500-entry ring buffer for recent logs
- Provides subscribe/broadcast mechanism for real-time streaming
- Sends last 100 logs to new WebSocket clients

### 2. WebSocket Server
- Created `backend/src/api/websocket.ts` for real-time log streaming
- Handles `/ws/logs` path with JWT authentication via query param
- Attaches to existing HTTP server (no separate port needed)
- Auto-cleanup on client disconnect

### 3. Frontend WebSocket Hook
- Created `frontend/src/hooks/useWebSocket.ts` for connection management
- Auto-reconnect with exponential backoff (up to 5 attempts)
- Connection status tracking (connecting/connected/disconnected/error)

### 4. Server Logs Component
- Created `frontend/src/components/ServerLogs.tsx` with real-time log viewer
- Log level filtering (all/info/warn/error)
- Auto-scroll toggle
- Color-coded log levels
- Clear logs button

### 5. Diagnostics Panel
- Created `frontend/src/components/DiagnosticsPanel.tsx` container
- Moved StatusPanel from Messages tab to Diagnostics tab
- Added new "Diagnostics" tab button to navigation

### 6. Bug Fixes
- Fixed JWT_SECRET timing issue in websocket.ts (read at runtime, not module load)
- Added `Cache-Control: no-store` headers to messages endpoint
- Refactored cache middleware into reusable `noCache` helper
- Changed Message Feed to fetch from Discord by default instead of database

## Files Created
- `backend/src/services/logger.ts` - Log capture service
- `backend/src/api/websocket.ts` - WebSocket server
- `backend/src/api/middleware/cache.ts` - Shared cache control middleware
- `frontend/src/hooks/useWebSocket.ts` - WebSocket connection hook
- `frontend/src/components/ServerLogs.tsx` - Log viewer component
- `frontend/src/components/DiagnosticsPanel.tsx` - Tab container

## Files Modified
- `backend/package.json` - Added `ws` and `@types/ws` dependencies
- `backend/src/index.ts` - Initialize logger early in startup
- `backend/src/api/index.ts` - HTTP server wrapper, WebSocket initialization
- `backend/src/api/routes/messages.ts` - Added noCache middleware
- `backend/src/api/routes/llm.ts` - Refactored to use shared noCache middleware
- `frontend/vite.config.ts` - Added WebSocket proxy for `/ws` path
- `frontend/src/api/client.ts` - Exported getToken, changed getMessages default to Discord
- `frontend/src/App.tsx` - Added Diagnostics tab, moved StatusPanel
- `frontend/src/App.css` - Styles for ServerLogs component

---
*See `devlogs/private/` for version with deployment details (gitignored)*
