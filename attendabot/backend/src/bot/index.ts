/**
 * @fileoverview Bot scheduler that manages cron jobs for attendance and
 * EOD reminders, verification, and PR leaderboard tracking.
 */

import cron from "node-cron";
import {
  ATTENDANCE_CHANNEL_ID,
  ATTENDANCE_REMINDER_CRON,
  ATTENDANCE_VERIFICATION_CRON,
  CRON_TIMEZONE,
  CURRENT_COHORT_ROLE_ID,
  EOD_CHANNEL_ID,
  EOD_REMINDER_CRON,
  EOD_VERIFICATION_CRON,
  USER_ID_TO_NAME_MAP,
} from "./constants";
import { fetchTextChannel, fetchMessagesSince, sendDirectMessage } from "../services/discord";
import {
  incrementMessagesSent,
  incrementRemindersTriggered,
  incrementVerificationsRun,
  incrementErrors,
} from "../services/stats";

const CURRENT_COHORT_USER_IDS = Array.from(USER_ID_TO_NAME_MAP.keys());

/** Validates that required channel IDs are configured. */
function validateConfig(): void {
  if (!EOD_CHANNEL_ID) {
    throw new Error("EOD_CHANNEL_ID is not set in constants.");
  }
  if (!ATTENDANCE_CHANNEL_ID) {
    throw new Error("ATTENDANCE_CHANNEL_ID is not set in constants.");
  }
}

/** Initializes the bot by validating config and scheduling all cron jobs. */
export function startBot(): void {
  validateConfig();
  scheduleJobs();
  console.log("Bot jobs scheduled");
}

/** Schedules all reminder and verification cron jobs. */
function scheduleJobs(): void {
  scheduleTask(EOD_REMINDER_CRON, () => sendEodReminder(), "EOD reminder");

  scheduleTask(
    EOD_VERIFICATION_CRON,
    () => verifyEodPost(),
    "EOD verification"
  );

  scheduleTask(
    ATTENDANCE_REMINDER_CRON,
    () => sendAttendanceReminder(),
    "Attendance reminder"
  );

  scheduleTask(
    ATTENDANCE_VERIFICATION_CRON,
    () => verifyAttendancePost(),
    "Attendance verification"
  );
}

async function sendAttendanceReminder(): Promise<void> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping attendance reminder."
    );
    return;
  }

  await sendReminder(
    ATTENDANCE_CHANNEL_ID,
    `Good morning ${roleMention(
      CURRENT_COHORT_ROLE_ID
    )}, please check in for ${getCurrentMonthDay()} if you haven't already.`
  );
  incrementRemindersTriggered();
}

async function sendEodReminder(): Promise<void> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Sending EOD reminder without role mention."
    );
    await sendReminder(
      EOD_CHANNEL_ID,
      `Friendly reminder for those who celebrate to post your ${getCurrentMonthDay()} EOD update.`
    );
    incrementRemindersTriggered();
    return;
  }

  await sendReminder(
    EOD_CHANNEL_ID,
    `${roleMention(
      CURRENT_COHORT_ROLE_ID
    )} please post your EOD update for ${getCurrentMonthDay()} when you're done working.`
  );
  incrementRemindersTriggered();
}

async function verifyAttendancePost(): Promise<void> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping attendance verification."
    );
    return;
  }

  await verifyPosts(ATTENDANCE_CHANNEL_ID, "attendance");
  incrementVerificationsRun();
}

async function verifyEodPost(): Promise<void> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping EOD verification."
    );
    return;
  }

  await verifyPosts(EOD_CHANNEL_ID, "EOD");
  incrementVerificationsRun();
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
          incrementErrors();
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
    incrementErrors();
  }
}

async function sendReminder(channelId: string, message: string): Promise<void> {
  console.log(`fetching text channel: ${channelId}`);
  const channel = await fetchTextChannel(channelId);
  console.log(`sending message: ${message}`);
  await channel.send({ content: message });
  console.log(`Sent reminder to #${channel.name}: ${message}`);
  incrementMessagesSent();
}

async function verifyPosts(channelId: string, label: string): Promise<void> {
  const channel = await fetchTextChannel(channelId);
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const messages = await fetchMessagesSince(channel, since);

  const usersWhoPosted = new Set<string>();
  const userPullRequestCounts = new Map<string, number>();

  for (const message of messages) {
    const authorId = message.author.id;
    if (CURRENT_COHORT_USER_IDS.includes(authorId)) {
      usersWhoPosted.add(message.author.id);

      const prCount = countPrsInMessage(message.content);

      userPullRequestCounts.set(
        authorId,
        (userPullRequestCounts.get(message.author.id) ?? 0) + prCount
      );
    }
  }

  if (channelId == EOD_CHANNEL_ID) {
    // Sort by PR count descending
    const sorted = Array.from(userPullRequestCounts.entries())
      .map(([userId, count]) => ({
        name: USER_ID_TO_NAME_MAP.get(userId) ?? "Unknown User",
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Get top 3 places (include ties)
    const top3: typeof sorted = [];
    let currentRank = 0;
    let lastCount = -1;

    for (const entry of sorted) {
      if (entry.count !== lastCount) {
        currentRank++;
        if (currentRank > 3) break;
        lastCount = entry.count;
      }
      top3.push(entry);
    }

    if (top3.length > 0) {
      const leaderboard = top3.map((e) => `${e.name}: ${e.count}`).join("\n");
      await channel.send({
        content: `PR Leaderboard for ${getCurrentMonthDay()} (Top 3):\n${leaderboard}`,
      });
      incrementMessagesSent();
    }
  }

  const missingUsers = CURRENT_COHORT_USER_IDS.filter((id) => !usersWhoPosted.has(id));

  if (missingUsers.length === 0) {
    console.log(`All users completed their ${label} posts in #${channel.name}.`);
  } else {
    // DM each late user individually
    let dmsSent = 0;
    for (const userId of missingUsers) {
      const sent = await sendDirectMessage(
        userId,
        `Reminder: You still need to post your ${label} update for ${getCurrentMonthDay()} in #${channel.name}.`
      );
      if (sent) {
        incrementMessagesSent();
        dmsSent++;
      }
    }
    console.log(`Sent ${label} reminder DMs to ${dmsSent}/${missingUsers.length} users`);
  }
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

/** Counts the number of GitHub pull request URLs in a message. */
export function countPrsInMessage(messageContent: string): number {
  const re = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;
  return (messageContent.match(re) || []).length;
}
