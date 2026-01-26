# 2026-01-26-002: Feature Requests Panel

## Summary

Added a "Feature Requests" section to the Configuration/Diagnostics tab. Logged-in users can create, view, filter, sort, edit, and delete feature requests — a lightweight internal tracker for the admin panel itself.

## What We Did

### Backend

1. **New `feature_requests` table** in SQLite with columns: id, title, description, priority, author, status (new/in_progress/done), created_at
2. **CRUD functions** in `services/db.ts`: `getFeatureRequests()`, `getFeatureRequest()`, `createFeatureRequest()`, `updateFeatureRequest()`, `deleteFeatureRequest()`
3. **REST API routes** (`api/routes/featureRequests.ts`) — 5 endpoints (GET list, GET single, POST, PUT, DELETE), all auth-protected
4. **Mounted** at `/api/feature-requests` in `api/index.ts`

### Frontend

1. **API client** (`api/client.ts`) — `FeatureRequest` interface and 4 fetch functions matching the backend endpoints
2. **FeatureRequestsPanel** — Main orchestrator component with:
   - Status filter pills (All / New / In Progress / Done)
   - Sort options (Priority desc, Newest, Title alpha)
   - Table view with clickable titles
   - Two-click delete confirmation (matching StudentTable pattern)
   - "New Request" button opens modal
3. **AddFeatureRequestModal** — Form with title (required), description (textarea, required), and priority (number, default 0). Author auto-filled from stored login username
4. **FeatureRequestDetail** — Sidebar detail view with:
   - Click-to-edit title and description
   - Inline status dropdown and priority input
   - Author, created date, and status badge display
   - Two-click delete button
5. **Integrated** into `DiagnosticsPanel.tsx` below StatusPanel and ServerLogs
6. **CSS styles** for filter pills, table, status badges, editable text, and edit row layout

## Files Modified
- `backend/src/services/db.ts` - New table + CRUD functions
- `backend/src/api/index.ts` - Mount feature requests router
- `frontend/src/api/client.ts` - FeatureRequest interface + API functions
- `frontend/src/components/DiagnosticsPanel.tsx` - Render FeatureRequestsPanel
- `frontend/src/App.css` - Feature request styles

## Files Created
- `backend/src/api/routes/featureRequests.ts` - REST API routes
- `frontend/src/components/FeatureRequestsPanel.tsx` - Main panel component
- `frontend/src/components/AddFeatureRequestModal.tsx` - Create modal
- `frontend/src/components/FeatureRequestDetail.tsx` - Sidebar detail view

---
*See `devlogs/private/` for version with deployment details (gitignored)*
