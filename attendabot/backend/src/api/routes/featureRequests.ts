/**
 * @fileoverview API routes for feature request management.
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  getFeatureRequests,
  getFeatureRequest,
  createFeatureRequest,
  updateFeatureRequest,
  deleteFeatureRequest,
} from "../../services/db";

/** Router for feature request endpoints. */
export const featureRequestsRouter = Router();

// All routes require authentication
featureRequestsRouter.use(authenticateToken);

/** GET /api/feature-requests - List all feature requests */
featureRequestsRouter.get("/", (_req: AuthRequest, res: Response) => {
  try {
    const featureRequests = getFeatureRequests();
    res.json({ featureRequests });
  } catch (error) {
    console.error("Error fetching feature requests:", error);
    res.status(500).json({ error: "Failed to fetch feature requests" });
  }
});

/** GET /api/feature-requests/:id - Get a single feature request */
featureRequestsRouter.get("/:id", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid feature request ID" });
      return;
    }

    const featureRequest = getFeatureRequest(id);
    if (!featureRequest) {
      res.status(404).json({ error: "Feature request not found" });
      return;
    }

    res.json({ featureRequest });
  } catch (error) {
    console.error("Error fetching feature request:", error);
    res.status(500).json({ error: "Failed to fetch feature request" });
  }
});

/** POST /api/feature-requests - Create a new feature request */
featureRequestsRouter.post("/", (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, author } = req.body;

    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "title is required" });
      return;
    }

    if (!description || typeof description !== "string") {
      res.status(400).json({ error: "description is required" });
      return;
    }

    if (!author || typeof author !== "string") {
      res.status(400).json({ error: "author is required" });
      return;
    }

    const featureRequest = createFeatureRequest({
      title,
      description,
      priority: typeof priority === "number" ? priority : 0,
      author,
    });

    res.status(201).json({ featureRequest });
  } catch (error) {
    console.error("Error creating feature request:", error);
    res.status(500).json({ error: "Failed to create feature request" });
  }
});

/** PUT /api/feature-requests/:id - Update a feature request */
featureRequestsRouter.put("/:id", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid feature request ID" });
      return;
    }

    const { title, description, priority, status } = req.body;

    const featureRequest = updateFeatureRequest(id, {
      title,
      description,
      priority,
      status,
    });

    if (!featureRequest) {
      res.status(404).json({ error: "Feature request not found" });
      return;
    }

    res.json({ featureRequest });
  } catch (error) {
    console.error("Error updating feature request:", error);
    res.status(500).json({ error: "Failed to update feature request" });
  }
});

/** DELETE /api/feature-requests/:id - Delete a feature request */
featureRequestsRouter.delete("/:id", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid feature request ID" });
      return;
    }

    const deleted = deleteFeatureRequest(id);
    if (!deleted) {
      res.status(404).json({ error: "Feature request not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting feature request:", error);
    res.status(500).json({ error: "Failed to delete feature request" });
  }
});
