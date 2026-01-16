# 2026-01-15-002: Add #attendance Channel Logging & Viewing

## Summary

Added support for logging and viewing messages from the #attendance channel, generalizing the existing EOD-only implementation to handle multiple monitored channels.

## What We Did

### 1. Backend Generalization

- Added `MONITORED_CHANNEL_IDS` array to `constants.ts`
- Updated Discord message listener to check against the array instead of hardcoded EOD channel
- Generalized backfill function to iterate through all monitored channels

### 2. Frontend Channel Filter

- Added channel filter dropdown to User Messages panel
- Users can now filter by "All channels", "#eod", or "#attendance"
- Updated labels to remove EOD-specific references

### 3. API Enhancement

- Added optional `channelId` parameter to `getUserMessages()` function

## Files Modified

- `backend/src/bot/constants.ts` - Added MONITORED_CHANNEL_IDS array
- `backend/src/services/discord.ts` - Generalized listener and backfill
- `frontend/src/api/client.ts` - Added channelId param to getUserMessages
- `frontend/src/components/UserMessages.tsx` - Added channel filter dropdown

## Results

- Messages from both #eod and #attendance are now logged
- Admin panel allows filtering messages by channel
- New attendance messages will be logged in real-time going forward
