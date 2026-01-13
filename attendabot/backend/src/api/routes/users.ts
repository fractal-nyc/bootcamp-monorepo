/**
 * @fileoverview Routes for user data and message history.
 */

import { Router, Response } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { getAllUsers, getMessagesByUser } from "../../services/db";
import { syncUserDisplayNames } from "../../services/discord";

/** Router for user-related endpoints. */
export const usersRouter = Router();
usersRouter.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const users = getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// Get messages for a specific user
usersRouter.get(
  "/:userId/messages",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const channelId = req.query.channelId as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    try {
      const messages = getMessagesByUser(userId, channelId, limit);

      res.json({
        userId,
        channelId: channelId || null,
        messages: messages.map((msg) => ({
          id: msg.discord_message_id,
          channelId: msg.channel_id,
          channelName: msg.channel_name,
          author: {
            id: msg.author_id,
            username: msg.username,
            displayName: msg.display_name,
          },
          content: msg.content,
          createdAt: msg.created_at,
        })),
      });
    } catch (error) {
      console.error(`Error fetching messages for user ${userId}:`, error);
      res.status(500).json({ error: "Failed to fetch user messages" });
    }
  }
);

// Sync display names from Discord
usersRouter.post(
  "/sync-display-names",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const updatedCount = await syncUserDisplayNames();
      res.json({ success: true, updatedCount });
    } catch (error) {
      console.error("Error syncing display names:", error);
      res.status(500).json({ error: "Failed to sync display names" });
    }
  }
);
