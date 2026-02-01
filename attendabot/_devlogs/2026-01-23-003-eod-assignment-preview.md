# 2026-01-23-003: EOD Assignment Preview

## Summary

Enhanced the 5 PM EOD reminder to include tomorrow's curriculum assignment with a GitHub link. The cron now skips Sundays, and Saturday's message shows Monday's assignment. Added cohort configuration for SP2026 and a testing panel to preview EOD messages.

## What We Did

### 1. Cohort Configuration
- Added `CohortConfig` interface with start date, break week, and total weeks
- Configured SP2026 cohort starting Feb 2, 2026 with week 5 as break week
- EOD cron now runs Mon-Sat only (`0 17 * * 1-6`)

### 2. Curriculum Module
- Created `curriculum.ts` with mock assignment data for weeks 1-13
- Real titles for weeks 1-3 (Simple Game, Auth Basics, Group Project)
- Functions: `getCurriculumPosition()`, `getNextWorkingDay()`, `getTomorrowsAssignment()`, `formatAssignmentForDiscord()`

### 3. EOD Reminder Enhancement
- Tomorrow's assignment appended to EOD message when available
- Saturday EOD shows Monday's assignment (skips Sunday)
- No assignment shown during break week or outside cohort dates

### 4. Testing Panel
- Added "EOD Assignment Preview" section to Testing tab
- Date picker to simulate any EOD cron run date
- Shows full preview including role mention and assignment
- Sends test DM to David

## Files Modified
- `backend/src/bot/constants.ts` - Cohort config, updated EOD cron
- `backend/src/bot/curriculum.ts` - New file with curriculum functions
- `backend/src/bot/index.ts` - Updated `sendEodReminder()`
- `backend/src/api/routes/testing.ts` - Added `/eod-preview` endpoint
- `frontend/src/api/client.ts` - Added `sendTestEodPreview()`
- `frontend/src/components/TestingPanel.tsx` - Added EOD preview section
- `frontend/src/App.css` - Added preview-box styling
- `backend/src/test/bot/curriculum.test.ts` - New test file (13 tests)

---
*See `devlogs/private/` for version with deployment details (gitignored)*
