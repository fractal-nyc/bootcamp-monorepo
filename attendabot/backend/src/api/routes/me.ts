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
    cohortId?: number;
    cohortStartDate?: string;
    cohortEndDate?: string;
  } = {
    role: user.role,
    name: user.username,
    discordAccountId: user.discordAccountId,
  };

  // If student, look up student record and cohort dates
  if (user.role === "student" && user.discordAccountId) {
    const db = getDatabase();
    const student = db
      .prepare(`
        SELECT s.id, s.name, s.cohort_id, c.start_date, c.end_date
        FROM students s
        JOIN cohorts c ON s.cohort_id = c.id
        WHERE s.discord_user_id = ?
      `)
      .get(user.discordAccountId) as { id: number; name: string; cohort_id: number; start_date: string | null; end_date: string | null } | undefined;
    if (student) {
      result.studentId = student.id;
      result.studentName = student.name;
      result.cohortId = student.cohort_id;
      if (student.start_date) result.cohortStartDate = student.start_date;
      if (student.end_date) result.cohortEndDate = student.end_date;
    }
  }

  res.json(result);
});
