# 2026-01-12-001: EOD Message Logging with SQLite Persistence

## Summary

Added real-time logging of #eod channel messages to a SQLite database, with automatic backfill of historical messages on first run.

## What We Did

### 1. Database Schema Updates

- Added `channels` table (channel_id, channel_name, updated_at)
- Added `users` table (author_id, display_name, username, updated_at)
- Updated `messages` table with foreign key constraints to channels and users
- Enabled FK enforcement with `PRAGMA foreign_keys = ON`

### 2. Real-time Message Logging

- Added `messageCreate` event listener in Discord client
- Filters for EOD channel only, skips bot messages
- Upserts channel and user data before inserting message (FK compliance)

### 3. Conditional Backfill

- On startup, checks if messages table is empty
- If empty, fetches all historical messages from EOD channel (paginated)
- Skips backfill if data already exists (fast restarts)

## Database Schema

```
channels: channel_id (PK), channel_name, updated_at
users: author_id (PK), display_name, username, updated_at
messages: discord_message_id (PK), channel_id (FK), author_id (FK), content, created_at, logged_at
```

## Files Modified

- `backend/src/services/db.ts` - New tables, upsert functions, FK enforcement
- `backend/src/services/discord.ts` - messageCreate listener, backfill function

## Results

- 2715 historical messages backfilled
- 50 users recorded
- Real-time logging active for new messages

## Commit

`c394d4c` - Add real-time EOD message logging with SQLite persistence
