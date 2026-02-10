/**
 * @fileoverview API routes for observer (instructor) management.
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { getObservers } from "../../services/db";
import { syncObserversFromDiscord } from "../../services/discord";

/** Router for observer endpoints. */
export const observersRouter = Router();

observersRouter.use(authenticateToken);

/** GET /api/observers - List all observers */
observersRouter.get("/", (_req: AuthRequest, res: Response) => {
  try {
    const observers = getObservers();
    res.json({ observers });
  } catch (error) {
    console.error("Error fetching observers:", error);
    res.status(500).json({ error: "Failed to fetch observers" });
  }
});

/** POST /api/observers/sync - Sync observers from Discord @instructors role */
observersRouter.post("/sync", async (_req: AuthRequest, res: Response) => {
  try {
    const observers = await syncObserversFromDiscord();
    res.json({ observers, synced: observers.length });
  } catch (error) {
    console.error("Error syncing observers:", error);
    res.status(500).json({ error: "Failed to sync observers from Discord" });
  }
});
