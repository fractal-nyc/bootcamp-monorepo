/**
 * @fileoverview API routes for feature flag management.
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { getFeatureFlags, updateFeatureFlag } from "../../services/db";

/** Router for feature flag endpoints. */
export const featureFlagsRouter = Router();

// All routes require authentication
featureFlagsRouter.use(authenticateToken);

/** GET /api/feature-flags - List all feature flags */
featureFlagsRouter.get("/", (_req: AuthRequest, res: Response) => {
  try {
    const flags = getFeatureFlags();
    res.json({ featureFlags: flags });
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    res.status(500).json({ error: "Failed to fetch feature flags" });
  }
});

/** PUT /api/feature-flags/:key - Toggle a feature flag */
featureFlagsRouter.put("/:key", (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      res.status(400).json({ error: "enabled must be a boolean" });
      return;
    }

    const flag = updateFeatureFlag(key, enabled);
    if (!flag) {
      res.status(404).json({ error: "Feature flag not found" });
      return;
    }

    res.json({ featureFlag: flag });
  } catch (error) {
    console.error("Error updating feature flag:", error);
    res.status(500).json({ error: "Failed to update feature flag" });
  }
});
