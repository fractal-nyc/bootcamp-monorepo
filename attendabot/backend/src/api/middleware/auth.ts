/**
 * @fileoverview Authentication middleware for the admin API.
 * Supports two auth methods:
 *   1. API key via `x-api-key` header (for external/programmatic access)
 *   2. BetterAuth session cookie (for the admin dashboard)
 */

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth";
import { validateApiKey } from "../../services/apiKeys";

/** Express Request extended with authenticated user data. */
export interface AuthRequest extends Request {
  user?: { authenticated: boolean; username: string };
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
  // Check for API key first
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey === "string" && apiKey.length > 0) {
    if (validateApiKey(apiKey)) {
      req.user = { authenticated: true, username: "api-key" };
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
      req.user = {
        authenticated: true,
        username: session.user.name || session.user.email || "Discord User",
      };
      next();
    } else {
      res.status(401).json({ error: "Authentication required" });
    }
  }).catch(() => {
    res.status(401).json({ error: "Authentication required" });
  });
}
