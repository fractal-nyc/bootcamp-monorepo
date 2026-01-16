# 2026-01-15-002: Add #attendance Channel Logging & Viewing

## Summary

Added support for logging and viewing messages from the #attendance channel, generalizing the existing EOD-only implementation to handle multiple monitored channels.

## Problem

The existing implementation only logged messages from the #eod channel. We needed to also track #attendance messages to support future attendance reporting features.

## What We Did

### 1. Backend Constants (`backend/src/bot/constants.ts`)

Added monitored channels array:

```typescript
export const MONITORED_CHANNEL_IDS = [EOD_CHANNEL_ID, ATTENDANCE_CHANNEL_ID];
```

### 2. Discord Service (`backend/src/services/discord.ts`)

**Updated import:**
```typescript
import { MONITORED_CHANNEL_IDS } from "../bot/constants";
```

**Generalized message listener:**
```typescript
discordClient.on("messageCreate", (message) => {
  if (!MONITORED_CHANNEL_IDS.includes(message.channelId)) return;
  if (message.author.bot) return;
  // ... log message
  console.log(`Logged message from ${message.author.username} in #${channel.name}`);
});
```

**Generalized backfill:**
```typescript
async function backfillMonitoredChannels(discordClient: Client): Promise<void> {
  const count = getMessageCount();
  if (count > 0) {
    console.log(`Skipping backfill, ${count} messages already in database`);
    return;
  }

  console.log("Messages table empty, starting backfill for all monitored channels...");

  for (const channelId of MONITORED_CHANNEL_IDS) {
    await backfillChannelMessages(discordClient, channelId);
  }
}

async function backfillChannelMessages(
  discordClient: Client,
  channelId: string
): Promise<void> {
  // ... fetch and log all messages from the channel
}
```

### 3. Frontend API Client (`frontend/src/api/client.ts`)

Added optional channelId parameter:

```typescript
export async function getUserMessages(
  userId: string,
  channelId?: string,
  limit: number = 100
): Promise<UserMessagesResponse | null> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (channelId) {
    params.append("channelId", channelId);
  }
  const res = await fetchWithAuth(
    `${API_BASE}/users/${userId}/messages?${params.toString()}`
  );
  // ...
}
```

### 4. Frontend Component (`frontend/src/components/UserMessages.tsx`)

Added channel filter dropdown:

```typescript
const MONITORED_CHANNELS = [
  { id: "1336123201968935006", name: "eod" },
  { id: "1418329701658792046", name: "attendance" },
];

const [selectedChannel, setSelectedChannel] = useState<string>("");

// In JSX:
<select
  value={selectedChannel}
  onChange={(e) => setSelectedChannel(e.target.value)}
>
  <option value="">All channels</option>
  {MONITORED_CHANNELS.map((channel) => (
    <option key={channel.id} value={channel.id}>
      #{channel.name}
    </option>
  ))}
</select>
```

## Design Decisions

1. **Array-based channel config**: Using `MONITORED_CHANNEL_IDS` array makes it easy to add more channels in the future
2. **Hardcoded frontend channels**: For now, channel IDs are duplicated in frontend. Could add an API endpoint later if needed
3. **Database already multi-channel**: No schema changes needed - `messages.channel_id` already exists

## Future Work

For attendance reports:
- Add `attendance_records` table with `(author_id, date, status, check_in_time)`
- Parse status from message timestamp (before 9:15 AM = on-time, after = tardy)
- Add report endpoints: `/api/attendance/daily`, `/api/attendance/user/:userId`

## Results

- Messages from both #eod and #attendance are now logged
- Admin panel allows filtering messages by channel
- Deployed and verified on production
