/**
 * @fileoverview Routes for testing bot features like daily briefings.
 */

import { Router, Response } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { generateDailyBriefing } from "../../bot";
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
    const briefing = generateDailyBriefing(cohortId, simulatedDate);

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
