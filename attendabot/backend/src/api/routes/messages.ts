/**
 * @fileoverview Routes for fetching messages from Discord channels.
 */

import { Router, Response } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import {
  fetchTextChannel,
  fetchMessagesSince,
  isDiscordReady,
} from "../../services/discord";
import { getRecentChannelMessages } from "../../services/db";

/** Router for message fetching endpoints. */
export const messagesRouter = Router();

messagesRouter.get(
  "/:channelId",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { channelId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const source = (req.query.source as string) || "db";

    // Fetch from database by default
    if (source === "db") {
      try {
        const messages = getRecentChannelMessages(channelId, 7, limit);
        const channelName = messages[0]?.channel_name || channelId;

        const formattedMessages = messages.map((msg) => ({
          id: msg.discord_message_id,
          channelId,
          channelName,
          author: {
            id: msg.author_id,
            username: msg.username,
            displayName: msg.display_name,
          },
          content: msg.content,
          createdAt: msg.created_at,
        }));

        res.json({
          channelId,
          channelName,
          messages: formattedMessages,
        });
        return;
      } catch (error) {
        console.error(`Error fetching messages from db for channel ${channelId}:`, error);
        res.status(500).json({ error: "Failed to fetch messages from database" });
        return;
      }
    }

    // Fetch from Discord if source=discord
    if (!isDiscordReady()) {
      res.status(503).json({ error: "Discord client not ready" });
      return;
    }

    try {
      const channel = await fetchTextChannel(channelId);

      // Fetch messages from last week by default
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const messages = await fetchMessagesSince(channel, since);

      // Limit and format messages
      const formattedMessages = messages.slice(0, limit).map((msg) => ({
        id: msg.id,
        channelId,
        channelName: channel.name,
        author: {
          id: msg.author.id,
          username: msg.author.username,
          displayName: msg.author.displayName,
          avatar: msg.author.avatarURL(),
        },
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        attachments: msg.attachments.map((a) => ({
          name: a.name,
          url: a.url,
        })),
      }));

      res.json({
        channelId,
        channelName: channel.name,
        messages: formattedMessages,
      });
    } catch (error) {
      console.error(`Error fetching messages for channel ${channelId}:`, error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);
