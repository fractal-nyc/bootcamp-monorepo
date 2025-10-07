import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
} from "discord.js";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const EOD_CHANNEL_ID = process.env.EOD_CHANNEL_ID!;
const ATTENDANCE_CHANNEL_ID = process.env.ATTENDANCE_CHANNEL_ID!;
const USER_IDS = (process.env.USER_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);
const CRON_TIMEZONE = process.env.CRON_TIMEZONE;

if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is not set in the environment.");
}

if (!EOD_CHANNEL_ID) {
  throw new Error("EOD_CHANNEL_ID is not set in the environment.");
}

if (!ATTENDANCE_CHANNEL_ID) {
  throw new Error("ATTENDANCE_CHANNEL_ID is not set in the environment.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag ?? "unknown user"}`);
  scheduleJobs();
});

client.login(DISCORD_TOKEN).catch((error) => {
  console.error("Failed to login to Discord:", error);
  process.exit(1);
});

function scheduleJobs(): void {
  scheduleTask(
    process.env.EOD_REMINDER_CRON ?? "0 19 * * *",
    () =>
      sendReminder(
        EOD_CHANNEL_ID,
        `${roleMention(
          process.env.CURRENT_COHORT_ROLE_ID!
        )} please post your EOD update for ${getCurrentMonthDay()} when you're done working for the day.`
      ),
    "EOD reminder"
  );

  scheduleTask(
    process.env.EOD_VERIFICATION_CRON ?? "59 23 * * *",
    () => verifyPosts(EOD_CHANNEL_ID, "EOD"),
    "EOD verification"
  );

  scheduleTask(
    process.env.ATTENDANCE_REMINDER_CRON ?? "0 9 * * *",
    () =>
      sendReminder(
        ATTENDANCE_CHANNEL_ID,
        `Good morning ${roleMention(
          process.env.CURRENT_COHORT_ROLE_ID!
        )}, please check in for ${getCurrentMonthDay()}.`
      ),
    "Attendance reminder"
  );

  scheduleTask(
    process.env.ATTENDANCE_VERIFICATION_CRON ?? "15 9 * * *",
    () => verifyPosts(ATTENDANCE_CHANNEL_ID, "attendance"),
    "Attendance verification"
  );
}

function scheduleTask(
  cronExpression: string,
  task: () => Promise<void>,
  description: string
): void {
  try {
    cron.schedule(
      cronExpression,
      () => {
        task().catch((error) => {
          console.error(`Error while running ${description} task:`, error);
        });
      },
      {
        timezone: CRON_TIMEZONE,
      }
    );

    console.log(
      `Scheduled ${description} job with cron expression: ${cronExpression}` +
        (CRON_TIMEZONE ? ` (timezone: ${CRON_TIMEZONE})` : "")
    );
  } catch (error) {
    console.error(
      `Failed to schedule ${description} job (${cronExpression}):`,
      error
    );
  }
}

async function sendReminder(channelId: string, message: string): Promise<void> {
  const channel = await fetchTextChannel(channelId);
  await channel.send({ content: message });
  console.log(`Sent reminder to #${channel.name}: ${message}`);
}

async function verifyPosts(channelId: string, label: string): Promise<void> {
  const channel = await fetchTextChannel(channelId);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const messages = await fetchMessagesSince(channel, since);

  const usersWhoPosted = new Set<string>();
  for (const message of messages) {
    if (USER_IDS.includes(message.author.id)) {
      usersWhoPosted.add(message.author.id);
    }
  }

  const missingUsers = USER_IDS.filter((id) => !usersWhoPosted.has(id));

  if (missingUsers.length === 0) {
    console.log(
      `All users completed their ${label} posts in #${channel.name}.`
    );
  } else {
    const mentionList = missingUsers.map((id) => `<@${id}>`).join(", ");
    await channel.send({
      content: `The following users still need to complete their ${label} update: ${mentionList}`,
    });
    console.warn(
      `Missing ${label} updates from ${missingUsers.length} users in #${
        channel.name
      }: ${missingUsers.join(", ")}`
    );
  }
}

async function fetchTextChannel(channelId: string): Promise<TextChannel> {
  const channel = await client.channels.fetch(channelId);

  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error(
      `Channel ${channelId} is not a text channel or could not be found.`
    );
  }

  return channel as TextChannel;
}

async function fetchMessagesSince(
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

function getCurrentMonthDay(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
  });
}

function roleMention(roleId: string) {
  return `<@&${roleId}>`;
}
