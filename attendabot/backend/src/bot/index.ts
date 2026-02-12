/**
 * @fileoverview Bot scheduler that manages cron jobs for attendance and
 * EOD reminders, verification, and PR leaderboard tracking.
 */

import cron from "node-cron";
import {
  ATTENDANCE_CHANNEL_ID,
  ATTENDANCE_REMINDER_CRON,
  ATTENDANCE_VERIFICATION_CRON,
  BOT_TEST_CHANNEL_ID,
  CRON_TIMEZONE,
  CURRENT_COHORT_ROLE_ID,
  DAILY_BRIEFING_CHANNEL_ID,
  DAILY_BRIEFING_CRON,
  EOD_CHANNEL_ID,
  EOD_REMINDER_CRON,
  EOD_VERIFICATION_CRON,
  MIDDAY_PR_REMINDER_CRON,
  MIDDAY_PR_VERIFICATION_CRON,
  DB_BACKUP_CRON,
} from "./constants";
import {
  getTomorrowsAssignment,
  formatAssignmentForDiscord,
} from "./curriculum";
import {
  fetchTextChannel,
  fetchMessagesSince,
  sendDirectMessage,
  sendChannelMessage,
  splitMessage,
} from "../services/discord";
import {
  incrementMessagesSent,
  incrementRemindersTriggered,
  incrementVerificationsRun,
  incrementErrors,
} from "../services/stats";
import {
  getMessagesByChannelAndDateRange,
  getStudentsByLastCheckIn,
  getActiveStudentsWithDiscord,
  getDefaultCohortId,
  getCohortSentiment,
  saveCohortSentiment,
  isFeatureFlagEnabled,
} from "../services/db";
import { isLLMConfigured, generateCohortSentiment } from "../services/llm";
import { backupDatabaseToS3 } from "../services/s3backup";

/**
 * Fetches active cohort students from the DB and returns their Discord user IDs
 * and a user ID to name mapping. Called at cron execution time for fresh data.
 */
function getCurrentCohortUsers(): {
  userIds: string[];
  nameMap: Map<string, string>;
} {
  const cohortId = getDefaultCohortId();
  if (!cohortId) {
    return { userIds: [], nameMap: new Map() };
  }
  const students = getActiveStudentsWithDiscord(cohortId);
  const userIds = students.map((s) => s.discord_user_id!);
  const nameMap = new Map<string, string>(
    students.map((s) => [s.discord_user_id!, s.name]),
  );
  return { userIds, nameMap };
}

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
    "EOD verification",
  );

  scheduleTask(
    ATTENDANCE_REMINDER_CRON,
    () => sendAttendanceReminder(),
    "Attendance reminder",
  );

  scheduleTask(
    ATTENDANCE_VERIFICATION_CRON,
    () => verifyAttendancePost(),
    "Attendance verification",
  );

  scheduleTask(
    DAILY_BRIEFING_CRON,
    () => sendDailyBriefing(),
    "Daily briefing",
  );

  scheduleTask(
    MIDDAY_PR_REMINDER_CRON,
    () => sendMiddayPrReminder(),
    "Midday PR reminder",
  );

  scheduleTask(
    MIDDAY_PR_VERIFICATION_CRON,
    () => verifyMiddayPrPost(),
    "Midday PR verification",
  );

  scheduleTask(
    DB_BACKUP_CRON,
    () => backupDatabaseToS3(),
    "Database backup to S3",
  );
}

async function sendAttendanceReminder(): Promise<void> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping attendance reminder.",
    );
    return;
  }

  await sendReminder(
    ATTENDANCE_CHANNEL_ID,
    `Good morning ${roleMention(
      CURRENT_COHORT_ROLE_ID,
    )}, please check in for ${getCurrentMonthDay()} if you haven't already.`,
  );
  incrementRemindersTriggered();
}

/**
 * Builds the EOD reminder message content.
 * Exported for testing.
 */
export function buildEodMessage(): string {
  let message: string;

  if (!CURRENT_COHORT_ROLE_ID) {
    message = `Friendly reminder for those who celebrate to post your ${getCurrentMonthDay()} EOD update.`;
  } else {
    message =
      `${roleMention(
        CURRENT_COHORT_ROLE_ID,
      )} reminder to post your EOD update for ${getCurrentMonthDay()} when you're done working.\n` +
      `Your EOD must include sections for **Wins** and **Blockers** along with links to your **PRs**.\n` +
      `Also, please provide:\n` +
      `- Anonymous feedback: https://forms.gle/SgzMsfX29CF5noZ1A\n` +
      `- Flow check: https://forms.gle/TE9NNsXhhQVfayo96.`;
  }

  // Add tomorrow's assignment if available and feature flag is enabled
  if (isFeatureFlagEnabled("eod_next_day_content")) {
    const assignment = getTomorrowsAssignment();
    if (assignment) {
      message += `\n\n${formatAssignmentForDiscord(assignment)}`;
    }
  }

  return message;
}

async function sendEodReminder(): Promise<void> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Sending EOD reminder without role mention.",
    );
  }

  const message = buildEodMessage();
  await sendReminder(EOD_CHANNEL_ID, message);
  incrementRemindersTriggered();
}

async function verifyAttendancePost(): Promise<string[]> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping attendance verification.",
    );
    return [];
  }

  const dmedUsers = await verifyPosts(ATTENDANCE_CHANNEL_ID, "attendance");
  incrementVerificationsRun();
  return dmedUsers;
}

async function verifyEodPost(): Promise<string[]> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping EOD verification.",
    );
    return [];
  }

  const dmedUsers = await verifyPosts(EOD_CHANNEL_ID, "EOD");
  incrementVerificationsRun();
  return dmedUsers;
}

async function sendMiddayPrReminder(): Promise<void> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping midday PR reminder.",
    );
    return;
  }

  await sendReminder(
    EOD_CHANNEL_ID,
    `${roleMention(CURRENT_COHORT_ROLE_ID)} please post your first PR of the day by 2 PM for ${getCurrentMonthDay()}.`,
  );
  incrementRemindersTriggered();
}

async function verifyMiddayPrPost(): Promise<string[]> {
  if (!CURRENT_COHORT_ROLE_ID) {
    console.log(
      "CURRENT_COHORT_ROLE_ID is not set. Skipping midday PR verification.",
    );
    return [];
  }

  const { userIds, nameMap } = getCurrentCohortUsers();
  if (userIds.length === 0) {
    console.log(
      "No active students with Discord IDs. Skipping midday PR verification.",
    );
    return [];
  }

  const channel = await fetchTextChannel(EOD_CHANNEL_ID);

  // Get TODAY's messages since 8 AM ET (exclude late-night PRs)
  const now = new Date();
  const etFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [month, day, year] = etFormatter.format(now).split("/");
  const eightAmET = new Date(`${year}-${month}-${day}T08:00:00-05:00`);

  const messages = await fetchMessagesSince(channel, eightAmET);

  // Find users who posted at least one PR
  const usersWithPr = new Set<string>();
  for (const message of messages) {
    if (userIds.includes(message.author.id)) {
      if (countPrsInMessage(message.content) > 0) {
        usersWithPr.add(message.author.id);
      }
    }
  }

  // DM users without any PR
  const missingUsers = userIds.filter((id) => !usersWithPr.has(id));
  const dateStr = `${year}-${month}-${day}`;
  const dmedUserNames: string[] = [];

  for (const userId of missingUsers) {
    const sent = await sendDirectMessage(
      userId,
      `Could not find a midday PR from you for ${dateStr} in the EOD channel. Please post one ASAP.`,
    );
    if (sent) {
      dmedUserNames.push(nameMap.get(userId) ?? `<@${userId}>`);
    }
    incrementMessagesSent();
  }

  incrementVerificationsRun();
  return dmedUserNames;
}

function scheduleTask(
  cronExpression: string,
  task: () => Promise<string[] | void>,
  description: string,
): void {
  try {
    cron.schedule(
      cronExpression,
      () => {
        const timestamp = new Date().toLocaleString("en-US", {
          timeZone: CRON_TIMEZONE,
        });
        sendChannelMessage(
          BOT_TEST_CHANNEL_ID,
          `⏰ **Cron running:** ${description} (${timestamp})`,
        ).catch(() => {});
        task()
          .then((dmedUsers) => {
            let message = `✅ **Cron completed:** ${description}`;
            if (dmedUsers && dmedUsers.length > 0) {
              message += `\n📬 **DM'd:** ${dmedUsers.join(", ")}`;
            }
            sendChannelMessage(BOT_TEST_CHANNEL_ID, message).catch(() => {});
          })
          .catch((error) => {
            console.error(`Error while running ${description} task:`, error);
            incrementErrors();
            sendChannelMessage(
              BOT_TEST_CHANNEL_ID,
              `❌ **Cron failed:** ${description} — ${error.message}`,
            ).catch(() => {});
          });
      },
      {
        timezone: CRON_TIMEZONE,
      },
    );

    console.log(
      `Scheduled ${description} job with cron expression: ${cronExpression}` +
        (CRON_TIMEZONE ? ` (timezone: ${CRON_TIMEZONE})` : ""),
    );
  } catch (error) {
    console.error(
      `Failed to schedule ${description} job (${cronExpression}):`,
      error,
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

async function verifyPosts(
  channelId: string,
  label: string,
): Promise<string[]> {
  const { userIds, nameMap } = getCurrentCohortUsers();
  if (userIds.length === 0) {
    console.log(
      `No active students with Discord IDs. Skipping ${label} verification.`,
    );
    return [];
  }

  const channel = await fetchTextChannel(channelId);
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const messages = await fetchMessagesSince(channel, since);

  const usersWhoPosted = new Set<string>();
  const userPullRequestCounts = new Map<string, number>();

  for (const message of messages) {
    const authorId = message.author.id;
    if (userIds.includes(authorId)) {
      usersWhoPosted.add(message.author.id);

      const prCount = countPrsInMessage(message.content);

      userPullRequestCounts.set(
        authorId,
        (userPullRequestCounts.get(message.author.id) ?? 0) + prCount,
      );
    }
  }

  if (channelId == EOD_CHANNEL_ID) {
    // Sort by PR count descending
    const sorted = Array.from(userPullRequestCounts.entries())
      .map(([userId, count]) => ({
        name: `<@${userId}>`,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const top3 = getTopLeaderboard(sorted);

    if (top3.length > 0) {
      const rankEmoji = ["🥇", "🥈", "🥉"];
      const leaderboard = top3
        .map((e) => `${rankEmoji[e.rank - 1]} ${e.name}: ${e.count}`)
        .join("\n");
      await channel.send({
        content: `PR Leaderboard for ${getCurrentMonthDay()}:\n${leaderboard}`,
      });
      incrementMessagesSent();
    }
  }

  const missingUsers = userIds.filter((id) => !usersWhoPosted.has(id));

  const dmedUserNames: string[] = [];

  if (missingUsers.length === 0) {
    console.log(
      `All users completed their ${label} posts in #${channel.name}.`,
    );
  } else {
    // DM each late user individually
    let dmsSent = 0;
    for (const userId of missingUsers) {
      const sent = await sendDirectMessage(
        userId,
        `Reminder: You still need to post your ${label} update for ${getCurrentMonthDay()} in #${channel.name}.`,
      );
      if (sent) {
        incrementMessagesSent();
        dmsSent++;
        dmedUserNames.push(nameMap.get(userId) ?? `<@${userId}>`);
      }
    }
    console.log(
      `Sent ${label} reminder DMs to ${dmsSent}/${missingUsers.length} users`,
    );
  }

  return dmedUserNames;
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

/**
 * Selects the top entries for the PR leaderboard from a pre-sorted (descending) list.
 * Includes ties for any included rank, but stops adding new ranks once 3+ people
 * are already included from higher ranks.
 * Always allows up to 3 distinct ranks if the cumulative count stays under 3.
 */
export function getTopLeaderboard(
  sorted: Array<{ name: string; count: number }>,
): Array<{ name: string; count: number; rank: number }> {
  const result: Array<{ name: string; count: number; rank: number }> = [];
  let currentRank = 0;
  let lastCount = -1;

  for (const entry of sorted) {
    if (entry.count !== lastCount) {
      currentRank++;
      if (currentRank > 3 || (currentRank > 1 && result.length >= 3)) break;
      lastCount = entry.count;
    }
    result.push({ ...entry, rank: currentRank });
  }

  return result;
}

/** Counts the number of GitHub pull request URLs in a message. */
export function countPrsInMessage(messageContent: string): number {
  const re = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;
  return (messageContent.match(re) || []).length;
}

/**
 * Checks whether a message qualifies as a valid EOD submission.
 * Must contain ("win" OR "block", case-insensitive) AND (a GitHub PR link OR "PRs", case-insensitive).
 */
export function isValidEodMessage(content: string): boolean {
  const lower = content.toLowerCase();
  const hasWinOrBlock = lower.includes("win") || lower.includes("block");
  const hasPrs = lower.includes("prs") || countPrsInMessage(content) > 0;
  return hasWinOrBlock && hasPrs;
}

// ============================================================================
// Daily Briefing
// ============================================================================

/**
 * Returns start/end ISO strings for the previous working day relative to the given date.
 * On Mondays (or simulated Mondays), looks back to Saturday instead of Sunday.
 * @param simulatedToday - Optional YYYY-MM-DD string representing "today". If not provided, uses actual today.
 */
export function getPreviousDayRangeET(simulatedToday?: string): {
  start: string;
  end: string;
} {
  let todayDate: Date;

  if (simulatedToday) {
    const [year, month, day] = simulatedToday.split("-").map(Number);
    todayDate = new Date(year, month - 1, day);
  } else {
    // Get today in ET
    const now = new Date();
    const etFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [month, day, year] = etFormatter.format(now).split("/");
    todayDate = new Date(Number(year), Number(month) - 1, Number(day));
  }

  // On Monday (day 1), look back to Saturday (2 days); otherwise look back 1 day
  const daysBack = todayDate.getDay() === 1 ? 2 : 1;
  const targetDate = new Date(todayDate);
  targetDate.setDate(targetDate.getDate() - daysBack);

  // Format as YYYY-MM-DD for consistent parsing
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");

  // Create UTC timestamps for midnight ET boundaries
  const startET = new Date(`${year}-${month}-${day}T00:00:00-05:00`);
  const endET = new Date(`${year}-${month}-${day}T23:59:59-05:00`);

  return { start: startET.toISOString(), end: endET.toISOString() };
}

/** Returns the ISO timestamp for 10 AM ET on a given date string (YYYY-MM-DD). */
function getTenAmET(dateStr: string): string {
  return new Date(`${dateStr}T10:00:00-05:00`).toISOString();
}

/** Returns the ISO timestamp for 8 AM ET on a given date string (YYYY-MM-DD). */
function getEightAmET(dateStr: string): string {
  return new Date(`${dateStr}T08:00:00-05:00`).toISOString();
}

/** Returns the ISO timestamp for 2 PM ET on a given date string (YYYY-MM-DD). */
function getTwoPmET(dateStr: string): string {
  return new Date(`${dateStr}T14:00:00-05:00`).toISOString();
}

/**
 * Generates the daily briefing content for a cohort.
 * @param cohortId - The cohort ID to generate the briefing for.
 * @param simulatedToday - Optional YYYY-MM-DD string representing "today" (the cron run date).
 * @returns The briefing message content, or null if no data.
 */
export async function generateDailyBriefing(
  cohortId: number,
  simulatedToday?: string,
): Promise<string | null> {
  const students = getActiveStudentsWithDiscord(cohortId);
  if (students.length === 0) {
    return null;
  }

  const { start, end } = getPreviousDayRangeET(simulatedToday);
  const previousDayStr = start.split("T")[0];
  const tenAm = getTenAmET(previousDayStr);
  const eightAm = getEightAmET(previousDayStr);
  const twoPm = getTwoPmET(previousDayStr);

  // Get messages from previous day
  const attendanceMessages = getMessagesByChannelAndDateRange(
    "attendance",
    start,
    end,
  );
  const eodMessages = getMessagesByChannelAndDateRange("eod", start, end);

  // Build sets for quick lookup
  const attendanceByUser = new Map<string, string>(); // discord_id -> first message timestamp
  for (const msg of attendanceMessages) {
    if (!attendanceByUser.has(msg.author_id)) {
      attendanceByUser.set(msg.author_id, msg.created_at);
    }
  }

  const eodPrsByUser = new Map<string, Set<string>>(); // discord_id -> unique PR URLs
  const prUrlRe = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;
  for (const msg of eodMessages) {
    const urls = (msg.content ?? "").match(prUrlRe) ?? [];
    if (urls.length > 0) {
      if (!eodPrsByUser.has(msg.author_id)) {
        eodPrsByUser.set(msg.author_id, new Set());
      }
      const userPrs = eodPrsByUser.get(msg.author_id)!;
      for (const url of urls) {
        userPrs.add(url);
      }
    }
  }
  const eodPrCountByUser = new Map<string, number>(
    [...eodPrsByUser.entries()].map(([id, prs]) => [id, prs.size]),
  );
  // A valid EOD must be posted between 2 PM and end of day, and contain "Wins", "Blockers", and "PRs"
  const eodPostedUsers = new Set(
    eodMessages
      .filter(
        (m) => m.created_at >= twoPm && isValidEodMessage(m.content ?? ""),
      )
      .map((m) => m.author_id),
  );

  // Track first PR time for each student (only PRs after 8 AM count)
  const firstPrTimeByUser = new Map<string, string>();
  for (const msg of eodMessages) {
    if (msg.created_at >= eightAm && countPrsInMessage(msg.content ?? "") > 0) {
      if (!firstPrTimeByUser.has(msg.author_id)) {
        firstPrTimeByUser.set(msg.author_id, msg.created_at);
      }
    }
  }

  // Categorize students
  const lateStudents: string[] = [];
  const absentStudents: string[] = [];
  const lateMiddayPrStudents: string[] = [];
  const goodPrStudents: string[] = [];
  const lowPrStudents: string[] = [];
  const noEodStudents: string[] = [];

  for (const student of students) {
    const discordId = student.discord_user_id!;

    // Check attendance
    const attendanceTime = attendanceByUser.get(discordId);
    if (!attendanceTime) {
      absentStudents.push(student.name);
    } else if (attendanceTime > tenAm) {
      lateStudents.push(student.name);
    }

    // Check late midday PR (no PR after 8 AM, or first PR was after 2 PM)
    const firstPrTime = firstPrTimeByUser.get(discordId);
    if (!firstPrTime || firstPrTime > twoPm) {
      lateMiddayPrStudents.push(student.name);
    }

    // Check EOD
    if (!eodPostedUsers.has(discordId)) {
      noEodStudents.push(student.name);
    } else {
      const prCount = eodPrCountByUser.get(discordId) ?? 0;
      if (prCount >= 3) {
        goodPrStudents.push(`${student.name} (${prCount} PRs)`);
      } else {
        lowPrStudents.push(`${student.name} (${prCount} PRs)`);
      }
    }
  }

  // Get students sorted by last check-in
  const studentsByCheckIn = getStudentsByLastCheckIn(cohortId);

  // Build briefing message
  const dateStr = new Date(start).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  let briefing = `**Daily Briefing for ${dateStr}**\n\n`;

  // Cohort sentiment (LLM-generated or cached)
  briefing += `**Cohort Sentiment:**\n`;
  let sentimentText = "Sentiment analysis not available.";
  if (isLLMConfigured()) {
    // Check for cached sentiment first
    const cached = getCohortSentiment(cohortId, previousDayStr);
    if (cached) {
      sentimentText = cached.sentiment;
    } else if (eodMessages.length > 0) {
      try {
        sentimentText = await generateCohortSentiment(eodMessages);
        saveCohortSentiment(cohortId, previousDayStr, sentimentText);
      } catch (error) {
        console.error("Error generating cohort sentiment:", error);
        sentimentText = "Unable to generate sentiment analysis.";
      }
    } else {
      sentimentText = "No EOD data available for sentiment analysis.";
    }
  } else {
    sentimentText = "LLM not configured for sentiment analysis.";
  }
  briefing += sentimentText;
  briefing += "\n\n";

  // Late students
  briefing += `**Late to Attendance (after 10 AM):**\n`;
  briefing += lateStudents.length > 0 ? lateStudents.join(", ") : "None";
  briefing += "\n\n";

  // Absent students
  briefing += `**Absent (no attendance):**\n`;
  briefing += absentStudents.length > 0 ? absentStudents.join(", ") : "None";
  briefing += "\n\n";

  // Late midday PR
  briefing += `**Late Midday PR (after 2 PM):**\n`;
  briefing +=
    lateMiddayPrStudents.length > 0 ? lateMiddayPrStudents.join(", ") : "None";
  briefing += "\n\n";

  // Good PR count (3+)
  briefing += `**3+ PRs in EOD:**\n`;
  briefing += goodPrStudents.length > 0 ? goodPrStudents.join(", ") : "None";
  briefing += "\n\n";

  // Low PR count
  briefing += `**Less than 3 PRs in EOD:**\n`;
  briefing += lowPrStudents.length > 0 ? lowPrStudents.join(", ") : "None";
  briefing += "\n\n";

  // No EOD
  briefing += `**No EOD submitted:**\n`;
  briefing += noEodStudents.length > 0 ? noEodStudents.join(", ") : "None";
  briefing += "\n\n";

  // Students by last check-in
  briefing += `**Students by Last Check-in (oldest first):**\n`;
  const checkInList = studentsByCheckIn
    .filter((s) => s.status === "active")
    .map((s) => {
      const checkIn = s.last_check_in
        ? new Date(s.last_check_in).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Never";
      return `• ${s.name}: ${checkIn}`;
    })
    .join("\n");
  briefing += checkInList || "No students";
  briefing += "\n\n";

  briefing += "Don't forget to record all your conversations!";

  return briefing;
}

/** Sends the daily briefing to the designated channel. */
async function sendDailyBriefing(): Promise<void> {
  const cohortId = getDefaultCohortId();
  if (!cohortId) {
    console.log("No cohort found. Skipping daily briefing.");
    return;
  }

  const briefing = await generateDailyBriefing(cohortId);
  if (!briefing) {
    console.log("No active students with Discord. Skipping daily briefing.");
    return;
  }

  // Send to channel, splitting into chunks if needed
  const channel = await fetchTextChannel(DAILY_BRIEFING_CHANNEL_ID);
  const chunks = splitMessage(briefing);
  for (const chunk of chunks) {
    await channel.send({ content: chunk });
  }
  incrementMessagesSent();
  console.log(`Sent daily briefing to #${channel.name} (${chunks.length} message(s))`);
}
