/**
 * @fileoverview Middleware that restricts access to instructor-role users only.
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/** Middleware that checks if the authenticated user has the "instructor" role. Returns 403 if not. */
export function requireInstructor(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "instructor") {
    res.status(403).json({ error: "Instructor access required" });
    return;
  }
  next();
}
