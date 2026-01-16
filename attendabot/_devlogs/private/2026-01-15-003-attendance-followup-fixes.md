# 2026-01-15-003: Attendance Channel Follow-up Fixes

## Summary

Fixed several issues discovered after deploying attendance channel support: per-channel backfill logic, deploy script handling of force pushes, and display name preservation during backfill.

## Problem 1: Global Backfill Check

The original backfill checked if the messages table was empty globally. With EOD messages already in the database, attendance channel would never get backfilled.

### Fix

Added `getMessageCountByChannel()` and updated backfill to check per-channel:

```typescript
// db.ts
export function getMessageCountByChannel(channelId: string): number {
  const db = getDatabase();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM messages WHERE channel_id = ?");
  const result = stmt.get(channelId) as { count: number };
  return result.count;
}

// discord.ts
async function backfillMonitoredChannels(discordClient: Client): Promise<void> {
  for (const channelId of MONITORED_CHANNEL_IDS) {
    const count = getMessageCountByChannel(channelId);
    if (count > 0) {
      console.log(`Skipping backfill for channel ${channelId}, ${count} messages already in database`);
      continue;
    }
    await backfillChannelMessages(discordClient, channelId);
  }
}
```

## Problem 2: Deploy Script Git Pull Failure

After a force push (amending a commit), the server's `git pull` failed with "divergent branches" error.

### Fix

Changed from `git pull` to `git fetch + reset`:

```bash
git fetch origin
git reset --hard origin/main
```

This always syncs to remote state regardless of local history.

## Problem 3: Backfill Wiping Display Names

Historical message fetches don't include `message.member` data, so backfill was calling `upsertUser(id, null, username)` which overwrote synced display names with null.

### Fix

Updated upsert to use COALESCE:

```sql
ON CONFLICT(author_id) DO UPDATE SET
  display_name = COALESCE(excluded.display_name, display_name),
  username = excluded.username,
  updated_at = CURRENT_TIMESTAMP
```

This keeps the existing display_name if the new value is null.

## Files Modified

- `backend/src/services/db.ts` - Added `getMessageCountByChannel()`, fixed upsert with COALESCE
- `backend/src/services/discord.ts` - Per-channel backfill logic
- `update-bot.sh` - Git fetch + reset instead of pull

## Results

- Attendance channel successfully backfilled ~450 messages
- Display names preserved after backfill
- Deploy script handles force pushes gracefully
