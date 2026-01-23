/**
 * @fileoverview Cache control middleware for API routes.
 */

import { Request, Response, NextFunction } from "express";

/**
 * Middleware that disables browser caching for responses.
 * Use on routes that return dynamic data that should always be fresh.
 */
export function noCache(_req: Request, res: Response, next: NextFunction): void {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
}
