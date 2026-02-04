# 2026-02-03-002: Observers Tab & Student Observer Assignment

## Summary

Added an Observers tab to the admin panel that syncs instructors from the Discord @instructors role, and added an Observer dropdown column to the Students table for assigning one observer per student.

## What We Did

### Backend

1. **New `observers` table** in SQLite with discord_user_id, display_name, username, and timestamps. Created via `initializeTables()` with `upsertObserver()`, `getObservers()`, and `getObserver()` DB functions.
2. **Added `observer_id` column** to the `students` table (nullable FK to observers). Migration handled inline via `ALTER TABLE` if column doesn't exist. All student queries updated to select `s.observer_id`.
3. **`INSTRUCTORS_ROLE_ID`** constant added to `bot/constants.ts` pointing to the @instructors Discord role (`1362774423391703180`).
4. **`syncObserversFromDiscord()`** function in `discord.ts` fetches guild members with the @instructors role and upserts them into the observers table.
5. **New `/api/observers` routes**: `GET /` to list observers, `POST /sync` to trigger Discord sync.
6. **`PUT /api/students/:id`** now accepts `observerId` to assign/unassign an observer.

### Frontend

1. **New `ObserversPanel` component** with a table showing synced observers and a "Sync from Discord" button.
2. **Observers tab** added between Students and Messages in the tab navigation.
3. **Observer dropdown column** added to `StudentTable` with sortable header. Each student row has a `<select>` to pick an observer or "None".
4. **`StudentCohortPanel`** fetches observers on mount and passes them to the table, handling observer changes via the existing `updateStudent` API.

## Files Modified
- `backend/src/services/db.ts` - observers table, observer_id column, CRUD functions
- `backend/src/bot/constants.ts` - INSTRUCTORS_ROLE_ID
- `backend/src/services/discord.ts` - syncObserversFromDiscord()
- `backend/src/api/routes/observers.ts` - New route file
- `backend/src/api/index.ts` - Mount observers router
- `backend/src/api/routes/students.ts` - observerId in PUT
- `frontend/src/api/client.ts` - Observer types and API functions, observerId on Student
- `frontend/src/components/ObserversPanel.tsx` - New component
- `frontend/src/components/StudentTable.tsx` - Observer column with dropdown
- `frontend/src/components/StudentCohortPanel.tsx` - Fetch observers, handle changes
- `frontend/src/App.tsx` - Observers tab
- `frontend/src/App.css` - observer-select styling
