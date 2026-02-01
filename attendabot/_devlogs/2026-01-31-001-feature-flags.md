# 2026-01-31-001: Feature Flags System

## Summary

Added a feature flags system backed by SQLite with a toggle UI on the Configuration tab. The first flag controls whether the EOD reminder message includes the next day's assignment content. Flags are read at runtime so toggling takes effect on the next cron run without a restart.

## What We Did

### Backend

1. **New `feature_flags` table** in SQLite with columns: key (PK), enabled, description, updated_at
2. **Seed function** (`seedDefaultFeatureFlags`) auto-creates the `eod_next_day_content` flag (enabled by default, preserving existing behavior)
3. **DB functions** in `services/db.ts`: `getFeatureFlags()`, `isFeatureFlagEnabled()`, `updateFeatureFlag()`
4. **REST API routes** (`api/routes/featureFlags.ts`) — GET list and PUT toggle, both auth-protected
5. **Mounted** at `/api/feature-flags` in `api/index.ts`
6. **EOD reminder** (`bot/index.ts`) — Extracted `buildEodMessage()` as an exported function that checks `isFeatureFlagEnabled("eod_next_day_content")` before appending the next day's assignment

### Frontend

1. **API client** (`api/client.ts`) — `FeatureFlag` interface and `getFeatureFlags()` / `updateFeatureFlag()` functions
2. **FeatureFlagsPanel** — Displays all flags with name, description, and ON/OFF toggle button. Integrated into DiagnosticsPanel above ServerLogs
3. **CSS styles** for flag list items and toggle buttons (green for ON, grey for OFF)

### Testing

1. **`eodFeatureFlag.test.ts`** — 3 tests verifying:
   - Flag ON: next day assignment is included in the EOD message
   - Flag OFF: next day assignment is excluded from the EOD message
   - Base EOD reminder text is always present regardless of flag state

## Files Modified
- `backend/src/services/db.ts` - New table, seed function, and query functions
- `backend/src/api/index.ts` - Mount feature flags router
- `backend/src/bot/index.ts` - Extracted `buildEodMessage()`, added feature flag check
- `frontend/src/api/client.ts` - FeatureFlag interface + API functions
- `frontend/src/components/DiagnosticsPanel.tsx` - Render FeatureFlagsPanel
- `frontend/src/App.css` - Feature flag styles

## Files Created
- `backend/src/api/routes/featureFlags.ts` - REST API routes
- `backend/src/test/bot/eodFeatureFlag.test.ts` - Feature flag integration tests
- `frontend/src/components/FeatureFlagsPanel.tsx` - Toggle UI component
