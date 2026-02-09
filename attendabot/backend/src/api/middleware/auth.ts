/**
 * @fileoverview Authentication middleware for the admin API.
 * Supports two auth methods:
 *   1. API key via `x-api-key` header (for external/programmatic access)
 *   2. BetterAuth session cookie (for the admin dashboard)
 */

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, getUserRole, getAuthDatabase } from "../../auth";
import { validateApiKey } from "../../services/apiKeys";

/** Express Request extended with authenticated user data. */
export interface AuthRequest extends Request {
  user?: {
    authenticated: boolean;
    username: string;
    role: "instructor" | "student";
    discordAccountId?: string;
  };
}

/**
 * Express middleware that authenticates via API key or BetterAuth session.
 * Checks `x-api-key` header first; falls back to session cookie.
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  // Skip if already authenticated (e.g., by mount-level middleware)
  if (req.user?.authenticated) {
    return next();
  }

  // Check for API key first
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey === "string" && apiKey.length > 0) {
    if (validateApiKey(apiKey)) {
      req.user = { authenticated: true, username: "api-key", role: "instructor" };
      return next();
    }
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  // Fall back to BetterAuth session cookie
  auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  }).then((session) => {
    if (session?.user) {
      const username = session.user.name || session.user.email || "Discord User";

      // Look up Discord account to determine role
      const authDb = getAuthDatabase();
      const account = authDb
        .prepare(
          `SELECT "accountId" FROM "account" WHERE "userId" = ? AND "providerId" = 'discord'`,
        )
        .get(session.user.id) as { accountId: string } | undefined;

      const discordAccountId = account?.accountId;
      const role = discordAccountId ? (getUserRole(discordAccountId) ?? "instructor") : "instructor";

      req.user = {
        authenticated: true,
        username,
        role,
        discordAccountId,
      };
      next();
    } else {
      res.status(401).json({ error: "Authentication required" });
    }
  }).catch(() => {
    res.status(401).json({ error: "Authentication required" });
  });
}
