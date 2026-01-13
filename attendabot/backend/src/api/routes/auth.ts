/**
 * @fileoverview Authentication routes for admin login.
 */

import { Router, Request, Response } from "express";
import { generateToken, verifyPassword } from "../middleware/auth";

/** Router for authentication endpoints. */
export const authRouter = Router();

authRouter.post("/login", (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }

  if (!verifyPassword(password)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = generateToken();
  res.json({ token });
});
