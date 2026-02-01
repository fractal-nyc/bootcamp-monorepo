/**
 * @fileoverview Routes for testing bot features like daily briefings and EOD previews.
 */

import { Router, Response } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { generateDailyBriefing } from "../../bot";
import {
  getTomorrowsAssignment,
  formatAssignmentForDiscord,
} from "../../bot/curriculum";
import { CURRENT_COHORT_ROLE_ID, BOT_TEST_CHANNEL_ID } from "../../bot/constants";
import { sendChannelMessage } from "../../services/discord";

/** Router for testing endpoints. */
export const testingRouter = Router();

/**
 * POST /api/testing/briefing
 * Generates a test briefing and sends it to #bot-test channel.
 * Body: { cohortId: number, simulatedDate: string (YYYY-MM-DD) }
 */
testingRouter.post("/briefing", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { cohortId, simulatedDate } = req.body;

  if (!cohortId || typeof cohortId !== "number") {
    res.status(400).json({ error: "cohortId is required and must be a number" });
    return;
  }

  if (!simulatedDate || typeof simulatedDate !== "string") {
    res.status(400).json({ error: "simulatedDate is required and must be a string (YYYY-MM-DD)" });
    return;
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(simulatedDate)) {
    res.status(400).json({ error: "simulatedDate must be in YYYY-MM-DD format" });
    return;
  }

  try {
    // Generate the briefing
    const briefing = await generateDailyBriefing(cohortId, simulatedDate);

    if (!briefing) {
      res.status(400).json({ error: "No active students with Discord in this cohort" });
      return;
    }

    // Send to #bot-test channel
    const testMessage = `**[TEST BRIEFING]**\nSimulated date: ${simulatedDate}\n\n${briefing}`;
    const sent = await sendChannelMessage(BOT_TEST_CHANNEL_ID, testMessage);

    if (!sent) {
      res.status(500).json({ error: "Failed to send message to #bot-test" });
      return;
    }

    res.json({ message: "Test briefing sent to #bot-test" });
  } catch (error) {
    console.error("Error sending test briefing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/testing/eod-preview
 * Previews tomorrow's assignment message for a simulated date.
 * Body: { simulatedDate: string (YYYY-MM-DD) }
 */
testingRouter.post(
  "/eod-preview",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { simulatedDate } = req.body;

    if (!simulatedDate || typeof simulatedDate !== "string") {
      res.status(400).json({
        error: "simulatedDate is required and must be a string (YYYY-MM-DD)",
      });
      return;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(simulatedDate)) {
      res
        .status(400)
        .json({ error: "simulatedDate must be in YYYY-MM-DD format" });
      return;
    }

    try {
      // Create date at 5 PM ET for the simulated day
      const date = new Date(`${simulatedDate}T17:00:00-05:00`);

      // Format the date as MM/DD for the message
      const monthDay = date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
      });

      // Build the full EOD message like the actual cron does
      let eodMessage: string;
      if (!CURRENT_COHORT_ROLE_ID) {
        eodMessage = `Friendly reminder for those who celebrate to post your ${monthDay} EOD update.`;
      } else {
        eodMessage = `<@&${CURRENT_COHORT_ROLE_ID}> please post your EOD update for ${monthDay} when you're done working.`;
      }

      // Add tomorrow's assignment if available
      const assignment = getTomorrowsAssignment(date);
      if (assignment) {
        eodMessage += `\n\n${formatAssignmentForDiscord(assignment)}`;
      }

      // Send to #bot-test channel
      const testMessage = `**[EOD Preview Test]**\nSimulated date: ${simulatedDate}\n\n${eodMessage}`;
      const sent = await sendChannelMessage(BOT_TEST_CHANNEL_ID, testMessage);

      if (!sent) {
        res.json({
          success: true,
          message: "Failed to send message to #bot-test - preview only",
          preview: eodMessage,
        });
        return;
      }

      res.json({
        success: true,
        message: "Preview sent to #bot-test",
        preview: eodMessage,
      });
    } catch (error) {
      console.error("Error generating EOD preview:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
