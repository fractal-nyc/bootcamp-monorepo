/**
 * @fileoverview JWT authentication middleware and utilities for the admin API.
 * Supports multi-user authentication with predefined instructor accounts.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

/** Predefined instructor credentials from environment variables. */
const INSTRUCTORS: Record<string, string | undefined> = {
  David: process.env.INSTRUCTOR_DAVID_PASSWORD,
  Paris: process.env.INSTRUCTOR_PARIS_PASSWORD,
  Andrew: process.env.INSTRUCTOR_ANDREW_PASSWORD,
};

/** Express Request extended with authenticated user data. */
export interface AuthRequest extends Request {
  user?: { authenticated: boolean; username: string };
}

/** Express middleware that validates JWT from the Authorization header. */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { authenticated: boolean; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

/** Generates a signed JWT valid for 24 hours, including the username. */
export function generateToken(username: string): string {
  return jwt.sign({ authenticated: true, username }, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Verifies credentials for a given username and password.
 * Checks instructor-specific passwords first, then falls back to admin password.
 */
export function verifyCredentials(username: string, password: string): boolean {
  // Check if this is a known instructor with a configured password
  const instructorPassword = INSTRUCTORS[username];
  if (instructorPassword && password === instructorPassword) {
    return true;
  }

  // Fall back to admin password for backwards compatibility
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && password === adminPassword) {
    return true;
  }

  return false;
}

/** Returns the list of valid instructor usernames. */
export function getValidUsernames(): string[] {
  return Object.keys(INSTRUCTORS);
}

/** Checks if the provided password matches the admin password. (Legacy support) */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD not set in environment");
    return false;
  }
  return password === adminPassword;
}
