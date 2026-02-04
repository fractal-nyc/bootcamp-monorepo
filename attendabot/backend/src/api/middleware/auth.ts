/**
 * @fileoverview Authentication middleware for the admin API.
 * Uses BetterAuth (Discord OAuth) session cookies for authentication.
 */

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth";

/** Express Request extended with authenticated user data. */
export interface AuthRequest extends Request {
  user?: { authenticated: boolean; username: string };
}

/** Express middleware that validates a BetterAuth session cookie. */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
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
