import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
} from "discord.js";
import cron from "node-cron";
import dotenv from "dotenv";
import { userIdToNameMap } from "./constants";

dotenv.config();

// Validate environment.
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

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Main entry point into the app.
discordClient.once("clientReady", () => {
  console.log(`Logged in as ${discordClient.user?.tag ?? "unknown user"}`);
  scheduleJobs();
});

discordClient.login(DISCORD_TOKEN).catch((error) => {
  console.error("Failed to login to Discord:", error);
  process.exit(1);
});

function scheduleJobs(): void {
  scheduleTask(
    process.env.EOD_REMINDER_CRON ?? "0 19 * * *",
    () => sendEodReminder(),
    "EOD reminder"
  );

  scheduleTask(
    process.env.EOD_VERIFICATION_CRON ?? "59 23 * * *",
    () => verifyEodPost(),
    "EOD verification"
  );

  scheduleTask(
    process.env.ATTENDANCE_REMINDER_CRON ?? "0 9 * * *",
    () => sendAttendanceReminder(),
    "Attendance reminder"
  );

  scheduleTask(
    process.env.ATTENDANCE_VERIFICATION_CRON ?? "15 9 * * *",
    () => verifyAttendancePost(),
    "Attendance verification"
  );
}

async function sendAttendanceReminder(): Promise<void> {
  sendReminder(
    ATTENDANCE_CHANNEL_ID,
    `Good morning ${roleMention(
      process.env.CURRENT_COHORT_ROLE_ID!
    )}, please check in for ${getCurrentMonthDay()}.`
  );
}

async function sendEodReminder(): Promise<void> {
  sendReminder(
    EOD_CHANNEL_ID,
    `${roleMention(
      process.env.CURRENT_COHORT_ROLE_ID!
    )} please post your EOD update for ${getCurrentMonthDay()} when you're done working for the day.`
  );
}

async function verifyAttendancePost(): Promise<void> {
  verifyPosts(ATTENDANCE_CHANNEL_ID, "attendance");
}

async function verifyEodPost(): Promise<void> {
  verifyPosts(EOD_CHANNEL_ID, "EOD");
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
  const since = new Date(Date.now() - 8 * 60 * 60 * 1000);
  const messages = await fetchMessagesSince(channel, since);

  const usersWhoPosted = new Set<string>();
  const userPullRequestCounts = new Map<string, number>();

  for (const message of messages) {
    const authorId = message.author.id;
    if (USER_IDS.includes(authorId)) {
      usersWhoPosted.add(message.author.id);

      const prCount = countPrsInMessage(message.content);

      userPullRequestCounts.set(
        authorId,
        (userPullRequestCounts.get(message.author.id) ?? 0) + prCount
      );
    }
  }

  if (channelId == EOD_CHANNEL_ID) {
    const prCountStrings: string[] = [];
    for (const [userId, count] of userPullRequestCounts.entries()) {
      const userName = userIdToNameMap.get(userId) ?? "Unknown User";
      prCountStrings.push(`${userName}: ${count}`);
    }

    prCountStrings.sort((a, b) => {
      const countA = parseInt(a.split(": ")[1], 10);
      const countB = parseInt(b.split(": ")[1], 10);
      return countB - countA;
    });

    const prCountString =
      `PR Leaderboard for ${getCurrentMonthDay()}:\n` +
      prCountStrings.join("\n");
    await channel.send({
      content: prCountString,
    });
  }

  const missingUsers = USER_IDS.filter((id) => !usersWhoPosted.has(id));

  if (missingUsers.length === 0) {
    console.log(
      `All users completed their ${label} posts in #${channel.name}.`
    );
  } else {
    const mentionList = missingUsers.map((id) => `<@${id}>`).join(", ");
    await channel.send({
      content: `The following engineers still need to post their ${label} update for ${getCurrentMonthDay()}: ${mentionList}`,
    });
    console.warn(
      `Missing ${label} updates from ${missingUsers.length} users in #${
        channel.name
      }: ${missingUsers.join(", ")}`
    );
  }
}

async function fetchTextChannel(channelId: string): Promise<TextChannel> {
  const channel = await discordClient.channels.fetch(channelId);

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

export function countPrsInMessage(messageContent: string): number {
  const re = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;
  return (messageContent.match(re) || []).length;
}
