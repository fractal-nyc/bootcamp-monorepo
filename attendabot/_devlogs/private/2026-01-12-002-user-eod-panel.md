# 2026-01-12-002: User EOD Messages Panel

## Summary

Added a new section to the admin panel to view all EOD messages for a selected user, with a dropdown selector and reverse chronological ordering.

## What We Did

### 1. Database Functions (`backend/src/services/db.ts`)

Added new query functions:

```typescript
export interface UserRecord {
  author_id: string;
  display_name: string | null;
  username: string;
}

export function getAllUsers(): UserRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT author_id, display_name, username
    FROM users
    ORDER BY username ASC
  `);
  return stmt.all() as UserRecord[];
}

export function getMessagesByUser(
  authorId: string,
  channelId?: string,
  limit: number = 100
): MessageRecord[] {
  const db = getDatabase();

  if (channelId) {
    const stmt = db.prepare(`
      SELECT m.discord_message_id, m.channel_id, c.channel_name,
             m.author_id, u.display_name, u.username, m.content, m.created_at
      FROM messages m
      JOIN channels c ON m.channel_id = c.channel_id
      JOIN users u ON m.author_id = u.author_id
      WHERE m.author_id = ? AND m.channel_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    return stmt.all(authorId, channelId, limit) as MessageRecord[];
  }

  const stmt = db.prepare(`
    SELECT m.discord_message_id, m.channel_id, c.channel_name,
           m.author_id, u.display_name, u.username, m.content, m.created_at
    FROM messages m
    JOIN channels c ON m.channel_id = c.channel_id
    JOIN users u ON m.author_id = u.author_id
    WHERE m.author_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `);
  return stmt.all(authorId, limit) as MessageRecord[];
}
```

### 2. API Routes (`backend/src/api/routes/users.ts`)

New file with two endpoints:

```typescript
import { Router, Response } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { getAllUsers, getMessagesByUser } from "../../services/db";

export const usersRouter = Router();

// GET /api/users - List all users
usersRouter.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const users = getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/:userId/messages - Get messages for a user
usersRouter.get("/:userId/messages", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const channelId = req.query.channelId as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

  try {
    const messages = getMessagesByUser(userId, channelId, limit);
    res.json({
      userId,
      channelId: channelId || null,
      messages: messages.map((msg) => ({
        id: msg.discord_message_id,
        channelId: msg.channel_id,
        channelName: msg.channel_name,
        author: {
          id: msg.author_id,
          username: msg.username,
          displayName: msg.display_name,
        },
        content: msg.content,
        createdAt: msg.created_at,
      })),
    });
  } catch (error) {
    console.error(`Error fetching messages for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to fetch user messages" });
  }
});
```

Registered in `backend/src/api/index.ts`:
```typescript
import { usersRouter } from "./routes/users";
app.use("/api/users", usersRouter);
```

### 3. Frontend API Client (`frontend/src/api/client.ts`)

Added types and functions:

```typescript
export interface User {
  author_id: string;
  display_name: string | null;
  username: string;
}

export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.users;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export interface UserMessage {
  id: string;
  channelId: string;
  channelName: string;
  author: { id: string; username: string; displayName: string | null };
  content: string;
  createdAt: string;
}

export interface UserMessagesResponse {
  userId: string;
  channelId: string | null;
  messages: UserMessage[];
}

export async function getUserMessages(
  userId: string,
  limit: number = 100
): Promise<UserMessagesResponse | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/messages?limit=${limit}`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
```

### 4. UserMessages Component (`frontend/src/components/UserMessages.tsx`)

New component similar to MessageFeed:
- Dropdown to select user (shows display_name and username)
- Fetches messages on user selection
- Displays channel name, timestamp, and content
- Supports URL detection and link rendering
- Loading states and error handling

### 5. Layout Changes

In `App.tsx`, added the new component:
```tsx
<main>
  <StatusPanel />
  <MessageFeed />
  <UserMessages />
</main>
```

In `App.css`, made it full-width:
```css
.user-messages {
  grid-column: span 2;
}
@media (max-width: 768px) {
  .user-messages {
    grid-column: span 1;
  }
}
```

## Design Decisions

1. **Optional channelId parameter**: Added for future extensibility if we want to filter by channel
2. **Full-width layout**: The user messages panel spans both columns since it contains more data
3. **Reverse chronological order**: Most recent messages first for easier review
4. **Limit cap at 500**: Prevents excessive data fetching

## Results

- User dropdown shows all 50+ users alphabetically
- Messages load correctly with proper formatting
- Deployed and verified on production at http://54.87.34.182:3001/
