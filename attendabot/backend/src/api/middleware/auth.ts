/**
 * @fileoverview JWT authentication middleware and utilities for the admin API.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

/** Express Request extended with authenticated user data. */
export interface AuthRequest extends Request {
  user?: { authenticated: boolean };
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
    const decoded = jwt.verify(token, JWT_SECRET) as { authenticated: boolean };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

/** Generates a signed JWT valid for 24 hours. */
export function generateToken(): string {
  return jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: "24h" });
}

/** Checks if the provided password matches the admin password. */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD not set in environment");
    return false;
  }
  return password === adminPassword;
}
