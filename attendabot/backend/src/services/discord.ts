import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
} from "discord.js";
import dotenv from "dotenv";
import { logMessage, getMessageCount, getAllUsers, upsertUser } from "./db";
import { EOD_CHANNEL_ID } from "../bot/constants";

dotenv.config();

// Singleton Discord client
let client: Client | null = null;
let isReady = false;
let readyPromise: Promise<void> | null = null;

export function getDiscordClient(): Client {
  if (!client) {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
      ],
    });
  }
  return client;
}

export function isDiscordReady(): boolean {
  return isReady;
}

export async function initializeDiscord(): Promise<Client> {
  const discordClient = getDiscordClient();

  if (isReady) {
    return discordClient;
  }

  if (readyPromise) {
    await readyPromise;
    return discordClient;
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error("DISCORD_TOKEN is not set in the environment.");
  }

  readyPromise = new Promise<void>((resolve, reject) => {
    discordClient.once("ready", () => {
      isReady = true;
      console.log(
        `Discord client logged in as ${
          discordClient.user?.tag ?? "unknown user"
        }`
      );

      // Send startup DM to David
      const davidUserId = process.env.DAVID_USER_ID;
      if (davidUserId) {
        discordClient.users
          .fetch(davidUserId)
          .then((user) => user.send("Attendabot is online!"))
          .then(() => console.log("Sent startup DM to David"))
          .catch((error) => console.error("Failed to send startup DM:", error));
      }

      // Register messageCreate listener for EOD channel logging
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

      // Run backfill after ready
      backfillEodMessages(discordClient).catch((error) => {
        console.error("Failed to backfill EOD messages", error);
      });

      resolve();
    });

    discordClient.login(token).catch((error) => {
      console.error("Failed to login to Discord:", error);
      reject(error);
    });
  });

  await readyPromise;
  return discordClient;
}

export async function fetchTextChannel(
  channelId: string
): Promise<TextChannel> {
  const discordClient = getDiscordClient();

  if (!isReady) {
    throw new Error(
      "Discord client is not ready. Call initializeDiscord() first."
    );
  }

  const channel = await discordClient.channels.fetch(channelId);

  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error(
      `Channel ${channelId} is not a text channel or could not be found.`
    );
  }

  return channel as TextChannel;
}

export async function fetchMessagesSince(
  channel: TextChannel,
  since: Date
): Promise<Message<true>[]> {
  const collected: Message<true>[] = [];
  let before: string | undefined;
  let shouldContinue = true;

  while (shouldContinue) {
    const options: { limit: number; before?: string } = { limit: 100 };
    if (before) {
      options.before = before;
    }

    const batch = await channel.messages.fetch(options);

    if (batch.size === 0) {
      break;
    }

    for (const message of batch.values()) {
      if (message.createdAt < since) {
        shouldContinue = false;
        break;
      }
      collected.push(message);
    }

    const lastMessage = batch.last();
    if (!lastMessage || lastMessage.createdAt < since) {
      break;
    }

    before = lastMessage.id;
  }

  return collected;
}

async function backfillEodMessages(discordClient: Client): Promise<void> {
  const count = getMessageCount();
  if (count > 0) {
    console.log(`Skipping backfill, ${count} messages already in database`);
    return;
  }

  console.log("Messages table empty, starting backfill...");

  const channel = await discordClient.channels.fetch(EOD_CHANNEL_ID);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.error("Could not fetch EOD channel for backfill");
    return;
  }

  const textChannel = channel as TextChannel;
  let insertedCount = 0;
  let before: string | undefined;

  // Fetch all messages from the channel (paginated)
  while (true) {
    const options: { limit: number; before?: string } = { limit: 100 };
    if (before) {
      options.before = before;
    }

    const batch = await textChannel.messages.fetch(options);
    if (batch.size === 0) {
      break;
    }

    for (const message of batch.values()) {
      if (message.author.bot) continue;

      try {
        logMessage({
          discord_message_id: message.id,
          channel_id: message.channelId,
          channel_name: textChannel.name,
          author_id: message.author.id,
          display_name: message.member?.displayName || null,
          username: message.author.username,
          content: message.content,
          created_at: message.createdAt.toISOString(),
        });
        insertedCount++;
      } catch (error) {
        console.error(`Failed to backfill message ${message.id}:`, error);
      }
    }

    const lastMessage = batch.last();
    if (!lastMessage) {
      break;
    }
    before = lastMessage.id;

    // Log progress every batch
    console.log(`Backfill progress: ${insertedCount} messages...`);
  }

  console.log(`Backfilled ${insertedCount} messages from EOD channel`);
}

export async function syncUserDisplayNames(): Promise<number> {
  const discordClient = getDiscordClient();

  if (!isReady) {
    throw new Error(
      "Discord client is not ready. Call initializeDiscord() first."
    );
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
        console.log(
          `Updated display name for ${member.user.username}: ${displayName}`
        );
      }
    }
  }

  console.log(`Synced display names for ${updatedCount} users`);
  return updatedCount;
}
