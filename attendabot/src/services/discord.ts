import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
} from "discord.js";
import dotenv from "dotenv";

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
      console.log(`Discord client logged in as ${discordClient.user?.tag ?? "unknown user"}`);
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

export async function fetchTextChannel(channelId: string): Promise<TextChannel> {
  const discordClient = getDiscordClient();

  if (!isReady) {
    throw new Error("Discord client is not ready. Call initializeDiscord() first.");
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
