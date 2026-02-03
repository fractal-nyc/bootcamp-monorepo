/**
 * @fileoverview Authentication routes for admin login.
 * Supports multi-user login with username and password.
 */

import { Router, Request, Response } from "express";
import {
  generateToken,
  verifyCredentials,
  getValidUsernames,
  verifyPassword,
} from "../middleware/auth";
import { isFeatureFlagEnabled } from "../../services/db";

/** Router for authentication endpoints. */
export const authRouter = Router();

/** POST /api/auth/login - Authenticate with username and password. */
authRouter.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }

  if (!username) {
    res.status(400).json({ error: "Username required" });
    return;
  }

  if (!verifyCredentials(username, password)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const token = generateToken(username);
  res.json({ token, username });
  return;
});

/** GET /api/auth/usernames - Get list of valid usernames for login dropdown. */
authRouter.get("/usernames", (_req: Request, res: Response) => {
  const usernames = getValidUsernames();
  res.json({ usernames });
});

/** GET /api/auth/login-config - Get public login page configuration. */
authRouter.get("/login-config", (_req: Request, res: Response) => {
  res.json({
    passwordLoginEnabled: isFeatureFlagEnabled("password_login_enabled"),
  });
});
