/**
 * @fileoverview Tests for GET /api/auth/me route.
 * Verifies role, identity, and cohort date fields in the response.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import express from "express";
import request from "supertest";
import {
  createTestDatabase,
  createTestCohort,
  createTestStudent,
  createTestUser,
} from "../utils/testUtils";

// Mock authenticateToken to inject req.user directly
vi.mock("../../api/middleware/auth", () => ({
  authenticateToken: vi.fn((req: any, _res: any, next: any) => {
    // Test sets req.user before calling the route
    next();
  }),
}));

// Mock getDatabase to return our test DB
const mockGetDatabase = vi.fn();
vi.mock("../../services/db", () => ({
  getDatabase: () => mockGetDatabase(),
}));

import { meRouter } from "../../api/routes/me";

function createApp(user: { authenticated: boolean; username: string; role: "instructor" | "student"; discordAccountId?: string }) {
  const app = express();
  // Inject req.user before the route runs
  app.use((req: any, _res, next) => {
    req.user = user;
    next();
  });
  app.use("/api/auth/me", meRouter);
  return app;
}

describe("GET /api/auth/me", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
    mockGetDatabase.mockReturnValue(db);
  });

  afterEach(() => {
    db.close();
    vi.clearAllMocks();
  });

  it("returns role and name for an instructor", async () => {
    const app = createApp({
      authenticated: true,
      username: "InstructorUser",
      role: "instructor",
      discordAccountId: "discord-instructor",
    });

    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("instructor");
    expect(res.body.name).toBe("InstructorUser");
    expect(res.body).not.toHaveProperty("studentId");
    expect(res.body).not.toHaveProperty("cohortStartDate");
    expect(res.body).not.toHaveProperty("cohortEndDate");
  });

  it("returns student info with cohort dates when cohort has dates", async () => {
    const user = createTestUser(db, "discord-student", "studentuser");
    const cohort = createTestCohort(db, "Sp2026");
    db.prepare("UPDATE cohorts SET start_date = ?, end_date = ? WHERE id = ?")
      .run("2026-02-02", "2026-05-02", cohort.id);
    createTestStudent(db, {
      name: "Julian Wemmie",
      cohortId: cohort.id,
      discordUserId: user.author_id,
    });

    const app = createApp({
      authenticated: true,
      username: "studentuser",
      role: "student",
      discordAccountId: "discord-student",
    });

    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("student");
    expect(res.body.studentName).toBe("Julian Wemmie");
    expect(res.body.cohortId).toBe(cohort.id);
    expect(res.body.cohortStartDate).toBe("2026-02-02");
    expect(res.body.cohortEndDate).toBe("2026-05-02");
  });

  it("omits cohort dates when cohort has no dates set", async () => {
    const user = createTestUser(db, "discord-student2", "studentuser2");
    const cohort = createTestCohort(db, "Fa2025");
    // No dates set — columns are NULL by default
    createTestStudent(db, {
      name: "No Dates Student",
      cohortId: cohort.id,
      discordUserId: user.author_id,
    });

    const app = createApp({
      authenticated: true,
      username: "studentuser2",
      role: "student",
      discordAccountId: "discord-student2",
    });

    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("student");
    expect(res.body.studentId).toBeDefined();
    expect(res.body.studentName).toBe("No Dates Student");
    expect(res.body.cohortId).toBe(cohort.id);
    expect(res.body).not.toHaveProperty("cohortStartDate");
    expect(res.body).not.toHaveProperty("cohortEndDate");
  });
});
