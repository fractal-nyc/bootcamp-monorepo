/**
 * @fileoverview Routes for bot status, stats, and scheduled job info.
 */

import { Router, Response } from "express";
import { getStats } from "../../services/stats";
import { isDiscordReady, getDiscordClient } from "../../services/discord";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import {
  EOD_REMINDER_CRON,
  EOD_VERIFICATION_CRON,
  ATTENDANCE_REMINDER_CRON,
  ATTENDANCE_VERIFICATION_CRON,
  DAILY_BRIEFING_CRON,
  MIDDAY_PR_REMINDER_CRON,
  MIDDAY_PR_VERIFICATION_CRON,
  CRON_TIMEZONE,
} from "../../bot/constants";

/** Router for status and stats endpoints. */
export const statusRouter = Router();

statusRouter.get("/", authenticateToken, (req: AuthRequest, res: Response) => {
  const stats = getStats();
  const discordReady = isDiscordReady();

  let botUsername: string | null = null;
  if (discordReady) {
    const client = getDiscordClient();
    botUsername = client.user?.tag ?? null;
  }

  const scheduledJobs = [
    { name: "Daily Briefing", cron: DAILY_BRIEFING_CRON, timezone: CRON_TIMEZONE },
    { name: "Attendance Reminder", cron: ATTENDANCE_REMINDER_CRON, timezone: CRON_TIMEZONE },
    { name: "Attendance Verification", cron: ATTENDANCE_VERIFICATION_CRON, timezone: CRON_TIMEZONE },
    { name: "Midday PR Reminder", cron: MIDDAY_PR_REMINDER_CRON, timezone: CRON_TIMEZONE },
    { name: "Midday PR Verification", cron: MIDDAY_PR_VERIFICATION_CRON, timezone: CRON_TIMEZONE },
    { name: "EOD Reminder", cron: EOD_REMINDER_CRON, timezone: CRON_TIMEZONE },
    { name: "EOD Verification", cron: EOD_VERIFICATION_CRON, timezone: CRON_TIMEZONE },
  ];

  res.json({
    discordConnected: discordReady,
    botUsername,
    stats: {
      startTime: stats.startTime.toISOString(),
      uptimeMs: stats.uptimeMs,
      messagesSent: stats.messagesSent,
      messagesReceived: stats.messagesReceived,
      remindersTriggered: stats.remindersTriggered,
      verificationsRun: stats.verificationsRun,
      errors: stats.errors,
    },
    scheduledJobs,
  });
});
