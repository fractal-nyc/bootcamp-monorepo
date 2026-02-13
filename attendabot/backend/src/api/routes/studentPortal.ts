/**
 * @fileoverview Student portal API routes. Provides students with read-only
 * access to their own EOD messages and daily stats.
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { getMessagesByUser, getMessagesByChannelAndDateRange } from "../../services/db";
import { EOD_CHANNEL_ID, ATTENDANCE_CHANNEL_ID } from "../../bot/constants";
import { extractPrUrls, isValidEodMessage } from "../../bot/index";

export const studentPortalRouter = Router();

/**
 * Middleware that resolves the target student's Discord ID.
 * - Students: uses their own discordAccountId.
 * - Instructors: uses the `studentDiscordId` query parameter to impersonate.
 * Stores the resolved ID in `res.locals.studentDiscordId`.
 */
function requireStudentAccess(req: AuthRequest, res: Response, next: () => void): void {
  if (req.user?.role === "student") {
    if (!req.user.discordAccountId) {
      res.status(403).json({ error: "No Discord account linked" });
      return;
    }
    res.locals.studentDiscordId = req.user.discordAccountId;
    next();
    return;
  }
  if (req.user?.role === "instructor") {
    const studentDiscordId = req.query.studentDiscordId as string | undefined;
    if (!studentDiscordId) {
      res.status(400).json({ error: "studentDiscordId query parameter required for instructor impersonation" });
      return;
    }
    res.locals.studentDiscordId = studentDiscordId;
    next();
    return;
  }
  res.status(403).json({ error: "Student or instructor access required" });
}

/**
 * GET /api/student-portal/eods?limit=100
 * Returns the student's own EOD messages sorted by date DESC.
 */
studentPortalRouter.get(
  "/eods",
  authenticateToken,
  requireStudentAccess,
  (req: AuthRequest, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const discordId = res.locals.studentDiscordId as string;

    const messages = getMessagesByUser(discordId, EOD_CHANNEL_ID, limit);
    res.json({
      messages: messages.map((m) => ({
        id: m.discord_message_id,
        content: m.content,
        createdAt: m.created_at,
        channelName: m.channel_name,
      })),
    });
  },
);

/** Daily stats for the student portal. */
interface DailyStats {
  date: string;
  attendancePosted: boolean;
  attendanceOnTime: boolean;
  middayPrPosted: boolean;
  middayPrCount: number;
  eodPosted: boolean;
  totalPrCount: number;
}

/**
 * GET /api/student-portal/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Computes daily stats for the authenticated student over the given date range.
 */
studentPortalRouter.get(
  "/stats",
  authenticateToken,
  requireStudentAccess,
  (req: AuthRequest, res: Response) => {
    const discordId = res.locals.studentDiscordId as string;

    // Default: last 30 days
    const endDate = (req.query.endDate as string) || new Date().toISOString().split("T")[0];
    const startDefault = new Date();
    startDefault.setDate(startDefault.getDate() - 30);
    const startDate = (req.query.startDate as string) || startDefault.toISOString().split("T")[0];

    const days: DailyStats[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      // Create date boundaries in ET (UTC-5)
      const dayStart = new Date(`${dateStr}T00:00:00-05:00`).toISOString();
      const dayEnd = new Date(`${dateStr}T23:59:59-05:00`).toISOString();
      const tenAm = new Date(`${dateStr}T10:00:00-05:00`).toISOString();
      const twoPm = new Date(`${dateStr}T14:00:00-05:00`).toISOString();

      // Get messages for this day
      const attendanceMessages = getMessagesByChannelAndDateRange("attendance", dayStart, dayEnd);
      const eodMessages = getMessagesByChannelAndDateRange("eod", dayStart, dayEnd);

      // Filter to this student's messages
      const myAttendance = attendanceMessages.filter((m) => m.author_id === discordId);
      const myEod = eodMessages.filter((m) => m.author_id === discordId);

      // Attendance
      const attendancePosted = myAttendance.length > 0;
      const attendanceOnTime = attendancePosted && myAttendance[0].created_at < tenAm;

      // Midday PR (unique PR links before 2 PM)
      const middayPrUrls = new Set<string>();
      for (const m of myEod.filter((m) => m.created_at < twoPm)) {
        for (const url of extractPrUrls(m.content ?? "")) {
          middayPrUrls.add(url);
        }
      }
      const middayPrPosted = middayPrUrls.size > 0;
      const middayPrCount = middayPrUrls.size;

      // EOD
      const eodPosted = myEod.some((m) => isValidEodMessage(m.content ?? ""));

      // Total unique PR count
      const allPrUrls = new Set<string>();
      for (const m of myEod) {
        for (const url of extractPrUrls(m.content ?? "")) {
          allPrUrls.add(url);
        }
      }

      days.push({
        date: dateStr,
        attendancePosted,
        attendanceOnTime,
        middayPrPosted,
        middayPrCount,
        eodPosted,
        totalPrCount: allPrUrls.size,
      });

      current.setDate(current.getDate() + 1);
    }

    // Sort by date DESC
    days.sort((a, b) => b.date.localeCompare(a.date));

    res.json({ days });
  },
);
