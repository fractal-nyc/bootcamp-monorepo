# 2026-01-12-003: Sync Display Names Feature

## Summary

Added ability to sync user display names from Discord guild members, so the user dropdown shows both display name and username (e.g., "John Doe (johndoe123)").

## Problem

The user dropdown in the User EOD Messages panel was only showing usernames because the `display_name` field was null for most users. This happened because when messages were backfilled from Discord history, the `message.member` property (which contains display names) is often null.

## What We Did

### 1. Discord Client Changes (`backend/src/services/discord.ts`)

Added `GuildMembers` intent:

```typescript
export function getDiscordClient(): Client {
  if (!client) {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,  // Added
      ],
    });
  }
  return client;
}
```

Added sync function:

```typescript
export async function syncUserDisplayNames(): Promise<number> {
  const discordClient = getDiscordClient();

  if (!isReady) {
    throw new Error("Discord client is not ready. Call initializeDiscord() first.");
  }

  // Get the guild from the EOD channel
  const channel = await discordClient.channels.fetch(EOD_CHANNEL_ID);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("Could not fetch EOD channel to get guild");
  }

  const guild = (channel as TextChannel).guild;

  // Fetch all guild members
  console.log("Fetching guild members to sync display names...");
  const members = await guild.members.fetch();

  // Get all users from our database
  const dbUsers = getAllUsers();
  let updatedCount = 0;

  for (const dbUser of dbUsers) {
    const member = members.get(dbUser.author_id);
    if (member) {
      const displayName = member.displayName;
      // Only update if display name is different or was null
      if (displayName && displayName !== dbUser.display_name) {
        upsertUser(dbUser.author_id, displayName, member.user.username);
        updatedCount++;
        console.log(`Updated display name for ${member.user.username}: ${displayName}`);
      }
    }
  }

  console.log(`Synced display names for ${updatedCount} users`);
  return updatedCount;
}
```

### 2. Backend API (`backend/src/api/routes/users.ts`)

Added sync endpoint:

```typescript
import { syncUserDisplayNames } from "../../services/discord";

// Sync display names from Discord
usersRouter.post(
  "/sync-display-names",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const updatedCount = await syncUserDisplayNames();
      res.json({ success: true, updatedCount });
    } catch (error) {
      console.error("Error syncing display names:", error);
      res.status(500).json({ error: "Failed to sync display names" });
    }
  }
);
```

### 3. Frontend API Client (`frontend/src/api/client.ts`)

```typescript
export async function syncDisplayNames(): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/sync-display-names`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Sync failed" };
    }
    const data = await res.json();
    return { success: true, updatedCount: data.updatedCount };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error" };
  }
}
```

### 4. Frontend Component (`frontend/src/components/UserMessages.tsx`)

Added syncing state and handler:

```typescript
const [syncing, setSyncing] = useState(false);

const handleSyncDisplayNames = async () => {
  setSyncing(true);
  setError(null);
  const result = await syncDisplayNames();
  if (result.success) {
    // Refresh the users list to show updated display names
    const data = await getUsers();
    setUsers(data);
  } else {
    setError(result.error || "Failed to sync display names");
  }
  setSyncing(false);
};
```

Added button in JSX:

```tsx
<button onClick={handleSyncDisplayNames} disabled={syncing}>
  {syncing ? "Syncing..." : "Sync Names"}
</button>
```

## Design Decisions

1. **Manual sync only**: Initially considered auto-syncing on startup, but decided against it to avoid unnecessary API calls on every restart
2. **GuildMembers intent**: Required privileged intent - must be enabled in Discord Developer Portal
3. **Upsert pattern**: Updates both display_name and username in case either changed

## Requirements

The Discord bot must have **Server Members Intent** enabled in the Discord Developer Portal under Bot > Privileged Gateway Intents.

## Results

- Clicking "Sync Names" populates display names for all users in the database
- Dropdown now shows "Display Name (username)" format
- Deployed and verified on production at http://54.87.34.182:3001/
