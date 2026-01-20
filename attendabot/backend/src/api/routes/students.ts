/**
 * @fileoverview API routes for student and cohort management.
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  getCohorts,
  getStudentsByCohort,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFeed,
  createInstructorNote,
} from "../../services/db";

/** Router for student endpoints. */
export const studentsRouter = Router();

/** Router for cohort endpoints. */
export const cohortsRouter = Router();

// All routes require authentication
studentsRouter.use(authenticateToken);
cohortsRouter.use(authenticateToken);

/** GET /api/cohorts - List all cohorts */
cohortsRouter.get("/", (_req: AuthRequest, res: Response) => {
  try {
    const cohorts = getCohorts();
    res.json({ cohorts });
  } catch (error) {
    console.error("Error fetching cohorts:", error);
    res.status(500).json({ error: "Failed to fetch cohorts" });
  }
});

/** GET /api/students?cohortId=X - List students in a cohort */
studentsRouter.get("/", (req: AuthRequest, res: Response) => {
  try {
    const cohortId = req.query.cohortId;
    if (!cohortId || typeof cohortId !== "string") {
      res.status(400).json({ error: "cohortId query parameter is required" });
      return;
    }

    const cohortIdNum = parseInt(cohortId, 10);
    if (isNaN(cohortIdNum)) {
      res.status(400).json({ error: "cohortId must be a number" });
      return;
    }

    const students = getStudentsByCohort(cohortIdNum);
    res.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

/** GET /api/students/:id - Get student details */
studentsRouter.get("/:id", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    const student = getStudent(id);
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json({ student });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

/** POST /api/students - Create a new student */
studentsRouter.post("/", (req: AuthRequest, res: Response) => {
  try {
    const { name, cohortId, discordUserId, status, currentInternship } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "name is required" });
      return;
    }

    if (!cohortId || typeof cohortId !== "number") {
      res.status(400).json({ error: "cohortId is required and must be a number" });
      return;
    }

    const student = createStudent({
      name,
      cohortId,
      discordUserId,
      status,
      currentInternship,
    });

    res.status(201).json({ student });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
});

/** PUT /api/students/:id - Update a student */
studentsRouter.put("/:id", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    const { name, discordUserId, cohortId, status, currentInternship } = req.body;

    const student = updateStudent(id, {
      name,
      discordUserId,
      cohortId,
      status,
      currentInternship,
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json({ student });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

/** DELETE /api/students/:id - Delete a student */
studentsRouter.delete("/:id", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    const deleted = deleteStudent(id);
    if (!deleted) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

/** GET /api/students/:id/feed - Get interleaved EODs + notes for a student */
studentsRouter.get("/:id/feed", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const feed = getStudentFeed(id, limit);
    res.json({ feed });
  } catch (error) {
    console.error("Error fetching student feed:", error);
    res.status(500).json({ error: "Failed to fetch student feed" });
  }
});

/** POST /api/students/:id/notes - Add an instructor note */
studentsRouter.post("/:id/notes", (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    const { content, author } = req.body;

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "content is required" });
      return;
    }

    if (!author || typeof author !== "string") {
      res.status(400).json({ error: "author is required" });
      return;
    }

    // Verify student exists
    const student = getStudent(id);
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const note = createInstructorNote(id, author, content);
    res.status(201).json({ note });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});
