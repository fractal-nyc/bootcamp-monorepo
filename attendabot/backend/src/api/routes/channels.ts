/**
 * @fileoverview Routes for listing Discord channels the bot can access.
 */

import { Router, Response } from "express";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { getDiscordClient, isDiscordReady } from "../../services/discord";

/** Router for channel listing endpoints. */
export const channelsRouter = Router();

channelsRouter.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!isDiscordReady()) {
    res.status(503).json({ error: "Discord client not ready" });
    return;
  }

  try {
    const client = getDiscordClient();
    const channels: Array<{ id: string; name: string; guildName: string }> = [];

    const botUser = client.user;

    for (const guild of client.guilds.cache.values()) {
      for (const channel of guild.channels.cache.values()) {
        if (channel.type === ChannelType.GuildText) {
          const permissions = botUser ? channel.permissionsFor(botUser) : null;
          const canView =
            permissions?.has(PermissionFlagsBits.ViewChannel) ?? false;
          const canReadHistory =
            permissions?.has(PermissionFlagsBits.ReadMessageHistory) ?? false;

          if (!canView || !canReadHistory) {
            continue;
          }

          channels.push({
            id: channel.id,
            name: channel.name,
            guildName: guild.name,
          });
        }
      }
    }

    // Sort by guild name, then channel name
    channels.sort((a, b) => {
      if (a.guildName !== b.guildName) {
        return a.guildName.localeCompare(b.guildName);
      }
      return a.name.localeCompare(b.name);
    });

    res.json({ channels });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});
