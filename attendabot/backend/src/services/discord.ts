/**
 * @fileoverview Discord client service for bot initialization, message
 * fetching, and user data synchronization.
 */

import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
} from "discord.js";
import dotenv from "dotenv";
import { logMessage, getMessageCountByChannel, getAllUsers, upsertUser } from "./db";
import { MONITORED_CHANNEL_IDS } from "../bot/constants";

dotenv.config();

let client: Client | null = null;
let isReady = false;
let readyPromise: Promise<void> | null = null;

/** Returns the singleton Discord client, creating it if needed. */
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

/** Returns whether the Discord client is connected and ready. */
export function isDiscordReady(): boolean {
  return isReady;
}

/**
 * Sends a direct message to a user.
 * @param userId - The Discord user ID to send the message to.
 * @param message - The message content to send.
 * @returns True if the message was sent successfully, false otherwise.
 */
export async function sendDirectMessage(userId: string, message: string): Promise<boolean> {
  const discordClient = getDiscordClient();
  if (!isReady) return false;

  try {
    const user = await discordClient.users.fetch(userId);
    await user.send(message);
    return true;
  } catch (error) {
    console.error(`Failed to send DM to user ${userId}:`, error);
    return false;
  }
}

/** Initializes and logs in the Discord client, setting up event listeners. */
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

      // Register messageCreate listener for monitored channels
      discordClient.on("messageCreate", (message) => {
        if (!MONITORED_CHANNEL_IDS.includes(message.channelId)) return;
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
          console.log(`Logged message from ${message.author.username} in #${channel.name}`);
        } catch (error) {
          console.error("Failed to log message:", error);
        }
      });

      // Run backfill after ready
      backfillMonitoredChannels(discordClient).catch((error) => {
        console.error("Failed to backfill monitored channels", error);
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

/** Fetches a text channel by ID, throwing if not found or not a text channel. */
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

/**
 * Fetches all messages from a channel since a given date.
 * @param channel - The text channel to fetch from.
 * @param since - Only fetch messages after this date.
 */
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

/**
 * Backfills monitored channels that have no messages in the database.
 * Checks each channel individually so new channels get backfilled.
 */
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

/**
 * Backfills messages from a specific channel.
 * @param discordClient - The Discord client instance.
 * @param channelId - The channel ID to backfill from.
 */
async function backfillChannelMessages(
  discordClient: Client,
  channelId: string
): Promise<void> {
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.error(`Could not fetch channel ${channelId} for backfill`);
    return;
  }

  const textChannel = channel as TextChannel;
  console.log(`Starting backfill for #${textChannel.name}...`);

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
    console.log(`Backfill progress for #${textChannel.name}: ${insertedCount} messages...`);
  }

  console.log(`Backfilled ${insertedCount} messages from #${textChannel.name}`);
}

/** Syncs display names from Discord guild members to the database. */
export async function syncUserDisplayNames(): Promise<number> {
  const discordClient = getDiscordClient();

  if (!isReady) {
    throw new Error(
      "Discord client is not ready. Call initializeDiscord() first."
    );
  }

  // Get the guild from the first monitored channel
  const channel = await discordClient.channels.fetch(MONITORED_CHANNEL_IDS[0]);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("Could not fetch channel to get guild");
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
