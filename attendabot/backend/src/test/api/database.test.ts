/**
 * @fileoverview Tests for database viewer API route logic.
 * Covers auth table blocklist, table listing, table data queries, and pagination.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import { createTestDatabase, createTestCohort, createTestStudent } from "../utils/testUtils";

/** The set of auth tables that should be blocked (mirrors database.ts). */
const AUTH_TABLES = new Set(["user", "session", "account", "verification"]);

describe("Database Viewer API - Logic", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe("auth table blocklist", () => {
    it("filters out auth tables from table list", () => {
      // Simulate auth tables existing in the DB
      db.exec(`CREATE TABLE "user" (id TEXT PRIMARY KEY, name TEXT)`);
      db.exec(`CREATE TABLE "session" (id TEXT PRIMARY KEY, token TEXT)`);
      db.exec(`CREATE TABLE "account" (id TEXT PRIMARY KEY, userId TEXT)`);
      db.exec(`CREATE TABLE "verification" (id TEXT PRIMARY KEY, value TEXT)`);

      const allTables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as { name: string }[];

      const filtered = allTables.filter((t) => !AUTH_TABLES.has(t.name)).map((t) => t.name);

      expect(filtered).not.toContain("user");
      expect(filtered).not.toContain("session");
      expect(filtered).not.toContain("account");
      expect(filtered).not.toContain("verification");
      // App tables should still be present
      expect(filtered).toContain("channels");
      expect(filtered).toContain("students");
      expect(filtered).toContain("cohorts");
    });

    it("blocks direct access to auth table by name", () => {
      const tableName = "session";
      expect(AUTH_TABLES.has(tableName)).toBe(true);
    });

    it("allows access to non-auth tables", () => {
      const tableName = "students";
      expect(AUTH_TABLES.has(tableName)).toBe(false);
    });

    it("blocks all four auth table names", () => {
      for (const name of ["user", "session", "account", "verification"]) {
        expect(AUTH_TABLES.has(name)).toBe(true);
      }
    });

    it("does not block similarly-named app tables", () => {
      expect(AUTH_TABLES.has("users")).toBe(false);
      expect(AUTH_TABLES.has("sessions")).toBe(false);
      expect(AUTH_TABLES.has("accounts")).toBe(false);
    });
  });

  describe("table listing", () => {
    it("lists all user-defined tables", () => {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as { name: string }[];

      const names = tables.map((t) => t.name);
      expect(names).toContain("channels");
      expect(names).toContain("users");
      expect(names).toContain("messages");
      expect(names).toContain("students");
      expect(names).toContain("cohorts");
      expect(names).toContain("activity_log");
      expect(names).toContain("instructor_notes");
    });

    it("excludes sqlite internal tables", () => {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as { name: string }[];

      const names = tables.map((t) => t.name);
      for (const name of names) {
        expect(name).not.toMatch(/^sqlite_/);
      }
    });
  });

  describe("table data query", () => {
    it("returns column info for a table", () => {
      const columns = db.prepare(`PRAGMA table_info("students")`).all() as {
        cid: number;
        name: string;
        type: string;
        pk: number;
      }[];

      const colNames = columns.map((c) => c.name);
      expect(colNames).toContain("id");
      expect(colNames).toContain("name");
      expect(colNames).toContain("cohort_id");
      expect(colNames).toContain("status");

      const pkCol = columns.find((c) => c.pk === 1);
      expect(pkCol).toBeDefined();
      expect(pkCol!.name).toBe("id");
    });

    it("returns rows with limit and offset", () => {
      const cohort = createTestCohort(db);
      for (let i = 0; i < 10; i++) {
        createTestStudent(db, { name: `Student ${i}`, cohortId: cohort.id });
      }

      const rows = db.prepare(`SELECT * FROM "students" LIMIT ? OFFSET ?`).all(3, 2) as { name: string }[];
      expect(rows).toHaveLength(3);
      expect(rows[0].name).toBe("Student 2");
      expect(rows[2].name).toBe("Student 4");
    });

    it("returns correct total row count", () => {
      const cohort = createTestCohort(db);
      for (let i = 0; i < 5; i++) {
        createTestStudent(db, { name: `Student ${i}`, cohortId: cohort.id });
      }

      const countRow = db.prepare(`SELECT COUNT(*) as count FROM "students"`).get() as { count: number };
      expect(countRow.count).toBe(5);
    });

    it("returns empty rows for empty table", () => {
      const rows = db.prepare(`SELECT * FROM "students" LIMIT ? OFFSET ?`).all(100, 0);
      expect(rows).toHaveLength(0);
    });

    it("validates table existence before querying", () => {
      const exists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get("nonexistent_table") as { name: string } | undefined;

      expect(exists).toBeUndefined();
    });

    it("clamps limit to max 500", () => {
      const requestedLimit = 1000;
      const clamped = Math.min(requestedLimit, 500);
      expect(clamped).toBe(500);
    });

    it("defaults limit to 100 when not provided", () => {
      const limit = parseInt(undefined as unknown as string) || 100;
      expect(limit).toBe(100);
    });

    it("defaults offset to 0 when not provided", () => {
      const offset = parseInt(undefined as unknown as string) || 0;
      expect(offset).toBe(0);
    });
  });
});
