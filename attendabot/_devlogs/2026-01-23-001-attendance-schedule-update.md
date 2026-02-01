# 2026-01-23-001: Attendance Schedule Update

## Summary

Updated attendance cron job times: reminder moved from 9:00 AM to 9:45 AM, verification moved from 9:15 AM to 10:00 AM. Also improved the Scheduled Jobs display in the admin panel with human-readable times and chronological ordering.

## What We Did

### 1. Updated Attendance Cron Times
- Changed `ATTENDANCE_REMINDER_CRON` from `"0 9 * * *"` (9:00 AM) to `"45 9 * * *"` (9:45 AM)
- Changed `ATTENDANCE_VERIFICATION_CRON` from `"15 9 * * *"` (9:15 AM) to `"0 10 * * *"` (10:00 AM)
- Updated comments to reflect new times

### 2. Reordered Scheduled Jobs Display
- Changed the `scheduledJobs` array in status endpoint to display jobs chronologically:
  1. Daily Briefing (8:00 AM)
  2. Attendance Reminder (9:45 AM)
  3. Attendance Verification (10:00 AM)
  4. EOD Reminder (5:00 PM)
  5. EOD Verification (11:59 PM)

### 3. Improved Time Display in Admin Panel
- Added `cronToTime()` helper function to convert cron expressions to 12-hour format
- Added new "Time" column showing human-readable times like "9:45 AM ET"
- Replaced "America/New_York" timezone display with simple "ET" suffix

## Files Modified
- `backend/src/bot/constants.ts` - Updated cron expressions and comments
- `backend/src/api/routes/status.ts` - Reordered scheduledJobs array
- `frontend/src/components/StatusPanel.tsx` - Added cronToTime helper and Time column

---
*See `devlogs/private/` for version with deployment details (gitignored)*
