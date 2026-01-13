# 2026-01-12-001: EOD Message Logging with SQLite Persistence

## Summary

Added real-time logging of #eod channel messages to a SQLite database, with automatic backfill of historical messages on first run.

## What We Did

### 1. Database Schema Updates (`backend/src/services/db.ts`)

Added new tables before messages table (required for FK constraints):

```sql
CREATE TABLE IF NOT EXISTS channels (
  channel_id TEXT PRIMARY KEY,
  channel_name TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS users (
  author_id TEXT PRIMARY KEY,
  display_name TEXT,
  username TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_message_id TEXT UNIQUE,
  channel_id TEXT NOT NULL REFERENCES channels(channel_id),
  author_id TEXT NOT NULL REFERENCES users(author_id),
  content TEXT,
  created_at TEXT NOT NULL,
  logged_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

Added FK enforcement after opening database:
```typescript
db.pragma("foreign_keys = ON");
```

Added directory auto-creation:
```typescript
const dbDir = path.join(__dirname, "../../db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
```

New functions:
- `upsertChannel(channelId, channelName)` - INSERT OR REPLACE
- `upsertUser(authorId, displayName, username)` - INSERT OR REPLACE
- `getMessageCount()` - For conditional backfill check

Updated `logMessage()` to upsert channel/user first (FK compliance).

### 2. Real-time Message Logging (`backend/src/services/discord.ts`)

Added messageCreate listener inside the ready callback:

```typescript
discordClient.on("messageCreate", (message) => {
  if (message.channelId !== EOD_CHANNEL_ID) return;
  if (message.author.bot) return;

  try {
    const channel = message.channel as TextChannel;
    logMessage({
      discord_message_id: message.id,
      channel_id: message.channelId,
      channel_name: channel.name,
      author_id: message.author.id,
      display_name: message.member?.displayName || null,
      username: message.author.username,
      content: message.content,
      created_at: message.createdAt.toISOString(),
    });
    console.log(`Logged EOD message from ${message.author.username}`);
  } catch (error) {
    console.error("Failed to log message:", error);
  }
});
```

### 3. Conditional Backfill Function

```typescript
async function backfillEodMessages(discordClient: Client): Promise<void> {
  const count = getMessageCount();
  if (count > 0) {
    console.log(`Skipping backfill, ${count} messages already in database`);
    return;
  }

  console.log("Messages table empty, starting backfill...");
  // Paginated fetch of all messages from EOD channel
  // INSERT OR IGNORE handles any duplicates
}
```

Called after ready event with `.catch()` for error handling.

## Deployment Issue

After deployment, the admin panel returned "Cannot GET /". Root cause:

1. PM2 was pointing to old `attendabot/dist/` instead of `attendabot/backend/dist/`
2. After fixing the path, `NODE_ENV=production` was not set

Fix:
```bash
pm2 delete attendabot
NODE_ENV=production pm2 start ~/bootcamp-monorepo/attendabot/backend/dist/index.js \
  --name attendabot --cwd ~/bootcamp-monorepo/attendabot/backend
pm2 save
```

The `update-bot.sh` script handles this correctly, but manual PM2 commands need explicit NODE_ENV.

## Results

- Database: `backend/db/attendabot.db` (2.1 MB)
- 2715 messages backfilled from EOD channel
- 50 users recorded
- 1 channel (eod)
- Real-time logging active for new messages

## Querying the Database

```bash
# SSH to EC2
sqlite3 ~/bootcamp-monorepo/attendabot/backend/db/attendabot.db

# Example queries
SELECT COUNT(*) FROM messages;
SELECT username, display_name FROM users LIMIT 10;
SELECT username, substr(content, 1, 50), created_at
FROM messages m JOIN users u ON m.author_id = u.author_id
ORDER BY created_at DESC LIMIT 5;
```

## Commit

`c394d4c` - Add real-time EOD message logging with SQLite persistence
