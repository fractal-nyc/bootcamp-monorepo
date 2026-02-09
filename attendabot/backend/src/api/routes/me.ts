/**
 * @fileoverview Route for fetching the current user's identity and role.
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { getDatabase } from "../../services/db";

export const meRouter = Router();

/** GET /api/auth/me — Returns the current user's role, name, and identity info. */
meRouter.get("/", authenticateToken, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result: {
    role: string;
    name: string;
    discordAccountId?: string;
    studentId?: number;
    studentName?: string;
  } = {
    role: user.role,
    name: user.username,
    discordAccountId: user.discordAccountId,
  };

  // If student, look up student record by discord_user_id
  if (user.role === "student" && user.discordAccountId) {
    const db = getDatabase();
    const student = db
      .prepare(`SELECT id, name FROM students WHERE discord_user_id = ?`)
      .get(user.discordAccountId) as { id: number; name: string } | undefined;
    if (student) {
      result.studentId = student.id;
      result.studentName = student.name;
    }
  }

  res.json(result);
});
