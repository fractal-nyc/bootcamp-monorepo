# 2026-01-19-001: View All Channel Messages Without User Filter

## Summary

Updated the User Messages panel to show all recent messages from a channel when no user is selected, making it easier to review channel activity at a glance.

## Problem

After adding support for #attendance and #eod channel viewing, there was no way to see ALL recent messages from a channel without selecting a specific user. This made it hard to quickly review channel activity.

## What We Did

### 1. Database Query (`backend/src/services/db.ts`)

Added function to fetch recent channel messages by date:

```typescript
export function getRecentChannelMessages(
  channelId: string,
  daysBack: number = 7,
  limit: number = 500
): MessageRecord[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffIso = cutoffDate.toISOString();

  const stmt = db.prepare(`
    SELECT m.*, c.channel_name, u.display_name, u.username
    FROM messages m
    JOIN channels c ON m.channel_id = c.channel_id
    JOIN users u ON m.author_id = u.author_id
    WHERE m.channel_id = ? AND m.created_at >= ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `);
  return stmt.all(channelId, cutoffIso, limit);
}
```

### 2. Messages Endpoint (`backend/src/api/routes/messages.ts`)

Added `source` query parameter to choose between database and Discord API:

```typescript
const source = (req.query.source as string) || "db";

if (source === "db") {
  const messages = getRecentChannelMessages(channelId, 7, limit);
  // Format and return from database
} else {
  // Fetch from Discord API (existing behavior)
}
```

Defaults to `db` for faster response times.

### 3. Unified Message Interface (`frontend/src/api/client.ts`)

Consolidated two interfaces into one:

```typescript
export interface Message {
  id: string;
  channelId: string;
  channelName: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar?: string | null;
  };
  content: string;
  createdAt: string;
  attachments?: Array<{ name: string; url: string }>;
}
```

Removed the separate `UserMessage` interface.

### 4. UserMessages Component (`frontend/src/components/UserMessages.tsx`)

Updated to handle channel-only mode:

```typescript
useEffect(() => {
  if (!selectedUser && !selectedChannel) {
    setMessages([]);
    return;
  }

  if (selectedUser) {
    // Fetch user messages (existing behavior)
    const data = await getUserMessages(selectedUser, selectedChannel || undefined);
  } else {
    // No user selected - fetch all channel messages
    const data = await getMessages(selectedChannel, 100);
  }
}, [selectedUser, selectedChannel, users]);
```

Shows author name when viewing all channel messages:

```tsx
{!selectedUser && (
  <span className="author">{msg.author.displayName || msg.author.username}</span>
)}
```

## Design Decisions

1. **Default to database**: DB queries are much faster than Discord API calls, so we default to `source=db`
2. **7-day window**: Reasonable default for "recent" messages without overwhelming the UI
3. **Unified interface**: Reduces code duplication and ensures consistent data handling
4. **Keep Discord option**: `source=discord` still available for live data when needed

## Results

- Select just a channel (no user) to see all messages from last 7 days
- Author names shown in channel-only view
- Much faster loading with database-first approach
- Cleaner codebase with unified Message type
