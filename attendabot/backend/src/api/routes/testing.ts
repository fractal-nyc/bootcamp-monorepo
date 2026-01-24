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
import { CURRENT_COHORT_ROLE_ID } from "../../bot/constants";
import { sendDirectMessage } from "../../services/discord";

/** Router for testing endpoints. */
export const testingRouter = Router();

/**
 * POST /api/testing/briefing
 * Generates a test briefing and sends it as a DM to David.
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

    // Get David's user ID from env
    const davidUserId = process.env.DAVID_USER_ID;
    if (!davidUserId) {
      res.status(500).json({ error: "DAVID_USER_ID not configured in environment" });
      return;
    }

    // Send DM to David
    const testMessage = `**[TEST BRIEFING]**\nSimulated date: ${simulatedDate}\n\n${briefing}`;
    const sent = await sendDirectMessage(davidUserId, testMessage);

    if (!sent) {
      res.status(500).json({ error: "Failed to send DM to David" });
      return;
    }

    res.json({ message: "Test briefing sent to David via DM" });
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

      // Get David's user ID from env
      const davidUserId = process.env.DAVID_USER_ID;
      if (!davidUserId) {
        res.json({
          success: true,
          message: "DAVID_USER_ID not configured - preview only",
          preview: eodMessage,
        });
        return;
      }

      // Send DM to David for testing
      const testMessage = `**[EOD Preview Test]**\nSimulated date: ${simulatedDate}\n\n${eodMessage}`;
      const sent = await sendDirectMessage(davidUserId, testMessage);

      if (!sent) {
        res.json({
          success: true,
          message: "Failed to send DM to David - preview only",
          preview: eodMessage,
        });
        return;
      }

      res.json({
        success: true,
        message: "Preview sent to David via DM",
        preview: eodMessage,
      });
    } catch (error) {
      console.error("Error generating EOD preview:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
