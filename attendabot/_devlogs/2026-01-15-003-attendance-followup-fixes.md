# 2026-01-15-003: Attendance Channel Follow-up Fixes

## Summary

Fixed several issues discovered after deploying attendance channel support: per-channel backfill logic, deploy script handling of force pushes, and display name preservation during backfill.

## Fixes

### 1. Per-Channel Backfill
Changed backfill to check message count per channel instead of globally, so new channels get backfilled even when other channels have existing data.

### 2. Deploy Script
Updated `update-bot.sh` to use `git fetch && git reset --hard origin/main` instead of `git pull` to handle force pushes gracefully.

### 3. Display Name Preservation
Fixed `upsertUser()` to only overwrite display_name if the new value is non-null. Prevents backfills (which have null display names) from wiping synced display names.

## Files Modified

- `backend/src/services/db.ts` - Added `getMessageCountByChannel()`, fixed upsert
- `backend/src/services/discord.ts` - Per-channel backfill logic
- `update-bot.sh` - Git reset instead of pull
