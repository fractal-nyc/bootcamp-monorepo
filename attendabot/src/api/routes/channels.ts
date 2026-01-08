import { Router, Response } from "express";
import { ChannelType } from "discord.js";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { getDiscordClient, isDiscordReady } from "../../services/discord";

export const channelsRouter = Router();

channelsRouter.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!isDiscordReady()) {
    res.status(503).json({ error: "Discord client not ready" });
    return;
  }

  try {
    const client = getDiscordClient();
    const channels: Array<{ id: string; name: string; guildName: string }> = [];

    for (const guild of client.guilds.cache.values()) {
      for (const channel of guild.channels.cache.values()) {
        if (channel.type === ChannelType.GuildText) {
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
