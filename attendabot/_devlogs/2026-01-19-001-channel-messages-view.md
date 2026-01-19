# 2026-01-19-001: View All Channel Messages Without User Filter

## Summary

Updated the User Messages panel to show all recent messages from a channel when no user is selected, making it easier to review channel activity at a glance.

## What We Did

### 1. Backend: Database Query for Recent Channel Messages

- Added `getRecentChannelMessages()` function to fetch messages from a channel within the last N days
- Updated `/api/messages/:channelId` endpoint to support `source` query param (`db` or `discord`)
- Defaulted to `db` source for faster response times

### 2. Frontend: Unified Message Interface

- Consolidated `Message` and `UserMessage` interfaces into a single `Message` type
- Added `channelId` and `channelName` fields to all message responses for consistency

### 3. Frontend: Channel-Only View Mode

- Updated UserMessages component to fetch channel messages when no user is selected
- Shows author name in message header when viewing all channel messages
- Updated info text to show "(last 7 days)" when in channel-only mode

## Files Modified

- `backend/src/services/db.ts` - Added getRecentChannelMessages function
- `backend/src/api/routes/messages.ts` - Added source param, default to db
- `frontend/src/api/client.ts` - Unified Message interface, added source param
- `frontend/src/components/UserMessages.tsx` - Channel-only view mode

## Results

- Select a channel without a user to see all messages from last 7 days
- Faster loading by defaulting to database queries instead of Discord API
- Consistent message format across all endpoints
