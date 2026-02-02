/**
 * @fileoverview JWT authentication middleware and utilities for the admin API.
 * Supports multi-user authentication with predefined instructor accounts.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/** Reads JWT secret from environment at call time. */
function getJwtSecret(): string {
  return process.env.JWT_SECRET || "default-secret-change-me";
}

/** Predefined instructor usernames. Passwords are read from env vars at call time. */
const INSTRUCTOR_NAMES = ["David", "Paris", "Andrew", "Liam"] as const;

/** Reads an instructor's password from the environment at call time. */
function getInstructorPassword(name: string): string | undefined {
  if (!(INSTRUCTOR_NAMES as readonly string[]).includes(name)) return undefined;
  return process.env[`INSTRUCTOR_${name.toUpperCase()}_PASSWORD`];
}

/** Express Request extended with authenticated user data. */
export interface AuthRequest extends Request {
  user?: { authenticated: boolean; username: string };
}

/** Express middleware that validates JWT from the Authorization header. */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      authenticated: boolean;
      username: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

/** Generates a signed JWT valid for 24 hours, including the username. */
export function generateToken(username: string): string {
  return jwt.sign({ authenticated: true, username }, getJwtSecret(), {
    expiresIn: "24h",
  });
}

/**
 * Verifies credentials for a given username and password.
 * Checks instructor-specific passwords first, then falls back to admin password.
 */
export function verifyCredentials(username: string, password: string): boolean {
  // Check if this is a known instructor with a configured password
  const instructorPassword = getInstructorPassword(username);
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
  return [...INSTRUCTOR_NAMES];
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
