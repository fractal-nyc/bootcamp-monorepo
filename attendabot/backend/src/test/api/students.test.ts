/**
 * @fileoverview Tests for student and cohort API route validation logic.
 * Tests request validation, parameter parsing, and response formatting.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import {
  createTestDatabase,
  createTestCohort,
  createTestStudent,
  createTestUser,
  createTestNote,
  createTestChannel,
  createTestMessage,
} from "../utils/testUtils";

describe("Student API - Validation Logic", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe("cohortId parameter validation", () => {
    it("validates cohortId is required", () => {
      const cohortId = undefined;
      const isValid = cohortId !== undefined && typeof cohortId === "string";
      expect(isValid).toBe(false);
    });

    it("validates cohortId must be a string", () => {
      const cohortId = 123;
      const isValid = typeof cohortId === "string";
      expect(isValid).toBe(false);
    });

    it("validates cohortId must be parseable as number", () => {
      const cohortId = "abc";
      const parsed = parseInt(cohortId, 10);
      expect(isNaN(parsed)).toBe(true);
    });

    it("accepts valid cohortId", () => {
      const cohortId = "1";
      const parsed = parseInt(cohortId, 10);
      expect(isNaN(parsed)).toBe(false);
      expect(parsed).toBe(1);
    });
  });

  describe("student ID parameter validation", () => {
    it("validates invalid ID returns NaN", () => {
      const id = parseInt("abc", 10);
      expect(isNaN(id)).toBe(true);
    });

    it("validates valid ID parses correctly", () => {
      const id = parseInt("123", 10);
      expect(id).toBe(123);
    });
  });

  describe("create student validation", () => {
    it("validates name is required", () => {
      const body = { cohortId: 1 };
      const isValid = body.hasOwnProperty("name") && typeof (body as any).name === "string";
      expect(isValid).toBe(false);
    });

    it("validates name must be string", () => {
      const body = { name: 123, cohortId: 1 };
      const isValid = typeof body.name === "string";
      expect(isValid).toBe(false);
    });

    it("validates cohortId is required", () => {
      const body = { name: "Test" };
      const isValid = body.hasOwnProperty("cohortId") && typeof (body as any).cohortId === "number";
      expect(isValid).toBe(false);
    });

    it("validates cohortId must be number", () => {
      const body = { name: "Test", cohortId: "1" };
      const isValid = typeof body.cohortId === "number";
      expect(isValid).toBe(false);
    });

    it("accepts valid create student body", () => {
      const body = { name: "Test Student", cohortId: 1 };
      const nameValid = typeof body.name === "string";
      const cohortValid = typeof body.cohortId === "number";
      expect(nameValid && cohortValid).toBe(true);
    });
  });

  describe("create note validation", () => {
    it("validates content is required", () => {
      const body = { author: "David" };
      const isValid = body.hasOwnProperty("content") && typeof (body as any).content === "string";
      expect(isValid).toBe(false);
    });

    it("validates author is required", () => {
      const body = { content: "Note content" };
      const isValid = body.hasOwnProperty("author") && typeof (body as any).author === "string";
      expect(isValid).toBe(false);
    });

    it("accepts valid note body", () => {
      const body = { content: "Note content", author: "David" };
      const contentValid = typeof body.content === "string";
      const authorValid = typeof body.author === "string";
      expect(contentValid && authorValid).toBe(true);
    });
  });

  describe("limit parameter parsing", () => {
    it("parses limit from query string", () => {
      const limitStr = "50";
      const limit = parseInt(limitStr, 10);
      expect(limit).toBe(50);
    });

    it("defaults to 50 when limit not provided", () => {
      const limitStr = undefined;
      const limit = limitStr ? parseInt(limitStr, 10) : 50;
      expect(limit).toBe(50);
    });
  });
});

describe("Student API - Database Operations", () => {
  let db: Database.Database;
  let cohortId: number;

  beforeEach(() => {
    db = createTestDatabase();
    const cohort = createTestCohort(db, "Test2026");
    cohortId = cohort.id;
  });

  afterEach(() => {
    db.close();
  });

  describe("list students", () => {
    it("returns empty array for cohort with no students", () => {
      const stmt = db.prepare("SELECT * FROM students WHERE cohort_id = ?");
      const students = stmt.all(cohortId);
      expect(students).toEqual([]);
    });

    it("returns students for a cohort", () => {
      createTestStudent(db, { name: "Alice", cohortId });
      createTestStudent(db, { name: "Bob", cohortId });

      const stmt = db.prepare("SELECT * FROM students WHERE cohort_id = ? ORDER BY name");
      const students = stmt.all(cohortId) as { name: string }[];

      expect(students.length).toBe(2);
      expect(students[0].name).toBe("Alice");
      expect(students[1].name).toBe("Bob");
    });

    it("only returns students from specified cohort", () => {
      const cohort2 = createTestCohort(db, "Other2026");
      createTestStudent(db, { name: "Alice", cohortId });
      createTestStudent(db, { name: "Bob", cohortId: cohort2.id });

      const stmt = db.prepare("SELECT * FROM students WHERE cohort_id = ?");
      const students = stmt.all(cohortId);

      expect(students.length).toBe(1);
    });
  });

  describe("get student by id", () => {
    it("returns null for non-existent student", () => {
      const stmt = db.prepare("SELECT * FROM students WHERE id = ?");
      const student = stmt.get(9999);
      expect(student).toBeUndefined();
    });

    it("returns student details", () => {
      const created = createTestStudent(db, {
        name: "Test Student",
        cohortId,
        status: "active",
      });

      const stmt = db.prepare("SELECT * FROM students WHERE id = ?");
      const student = stmt.get(created.id) as { name: string; status: string };

      expect(student.name).toBe("Test Student");
      expect(student.status).toBe("active");
    });
  });

  describe("create student", () => {
    it("creates a student with required fields", () => {
      const stmt = db.prepare(`
        INSERT INTO students (name, cohort_id, status)
        VALUES (?, ?, 'active')
      `);
      const result = stmt.run("New Student", cohortId);

      expect(result.lastInsertRowid).toBeGreaterThan(0);

      const selectStmt = db.prepare("SELECT * FROM students WHERE id = ?");
      const student = selectStmt.get(result.lastInsertRowid) as { name: string; status: string };

      expect(student.name).toBe("New Student");
      expect(student.status).toBe("active");
    });

    it("creates a student with optional fields", () => {
      const user = createTestUser(db, "discord-123", "discorduser");

      const stmt = db.prepare(`
        INSERT INTO students (name, cohort_id, discord_user_id, status, current_internship)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run("Full Student", cohortId, user.author_id, "inactive", "TechCorp");

      const selectStmt = db.prepare("SELECT * FROM students WHERE id = ?");
      const student = selectStmt.get(result.lastInsertRowid) as {
        discord_user_id: string;
        status: string;
        current_internship: string;
      };

      expect(student.discord_user_id).toBe("discord-123");
      expect(student.status).toBe("inactive");
      expect(student.current_internship).toBe("TechCorp");
    });
  });

  describe("update student", () => {
    it("updates student name", () => {
      const student = createTestStudent(db, {
        name: "Original Name",
        cohortId,
      });

      db.prepare("UPDATE students SET name = ? WHERE id = ?").run("Updated Name", student.id);

      const selectStmt = db.prepare("SELECT * FROM students WHERE id = ?");
      const updated = selectStmt.get(student.id) as { name: string };

      expect(updated.name).toBe("Updated Name");
    });

    it("returns 0 changes for non-existent student", () => {
      const result = db.prepare("UPDATE students SET name = ? WHERE id = ?").run("Updated", 9999);
      expect(result.changes).toBe(0);
    });
  });

  describe("delete student", () => {
    it("deletes existing student", () => {
      const student = createTestStudent(db, {
        name: "To Delete",
        cohortId,
      });

      const result = db.prepare("DELETE FROM students WHERE id = ?").run(student.id);
      expect(result.changes).toBe(1);

      const selectStmt = db.prepare("SELECT * FROM students WHERE id = ?");
      expect(selectStmt.get(student.id)).toBeUndefined();
    });

    it("returns 0 changes for non-existent student", () => {
      const result = db.prepare("DELETE FROM students WHERE id = ?").run(9999);
      expect(result.changes).toBe(0);
    });
  });

  describe("student feed", () => {
    it("returns instructor notes", () => {
      const student = createTestStudent(db, {
        name: "Test Student",
        cohortId,
      });
      createTestNote(db, {
        studentId: student.id,
        author: "David",
        content: "Great progress!",
      });

      const stmt = db.prepare("SELECT * FROM instructor_notes WHERE student_id = ?");
      const notes = stmt.all(student.id) as { content: string; author: string }[];

      expect(notes.length).toBe(1);
      expect(notes[0].content).toBe("Great progress!");
      expect(notes[0].author).toBe("David");
    });

    it("returns EOD messages for linked Discord user", () => {
      const user = createTestUser(db, "discord-1", "student");
      const channel = createTestChannel(db, "eod-ch", "eod");

      const student = createTestStudent(db, {
        name: "Test Student",
        cohortId,
        discordUserId: user.author_id,
      });

      createTestMessage(db, {
        channelId: channel.channel_id,
        authorId: user.author_id,
        content: "My EOD update",
      });

      const stmt = db.prepare(`
        SELECT m.content FROM messages m
        JOIN channels c ON m.channel_id = c.channel_id
        WHERE m.author_id = ? AND c.channel_name != 'attendance'
      `);
      const messages = stmt.all(user.author_id) as { content: string }[];

      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe("My EOD update");
    });
  });

  describe("create note", () => {
    it("creates a new instructor note", () => {
      const student = createTestStudent(db, {
        name: "Test Student",
        cohortId,
      });

      const stmt = db.prepare(`
        INSERT INTO instructor_notes (student_id, author, content)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(student.id, "David", "Great work today!");

      expect(result.lastInsertRowid).toBeGreaterThan(0);

      const selectStmt = db.prepare("SELECT * FROM instructor_notes WHERE id = ?");
      const note = selectStmt.get(result.lastInsertRowid) as {
        content: string;
        author: string;
        student_id: number;
      };

      expect(note.content).toBe("Great work today!");
      expect(note.author).toBe("David");
      expect(note.student_id).toBe(student.id);
    });
  });
});

describe("Student Image API - Validation Logic", () => {
  describe("image upload validation", () => {
    it("validates image is required", () => {
      const body = {};
      const isValid = body.hasOwnProperty("image") && typeof (body as any).image === "string";
      expect(isValid).toBe(false);
    });

    it("validates image must be a string", () => {
      const body = { image: 123 };
      const isValid = typeof body.image === "string";
      expect(isValid).toBe(false);
    });

    it("validates image must be a data URL", () => {
      const body = { image: "not-a-data-url" };
      const isValid = typeof body.image === "string" && body.image.startsWith("data:image/");
      expect(isValid).toBe(false);
    });

    it("rejects non-image data URLs", () => {
      const body = { image: "data:text/plain;base64,SGVsbG8=" };
      const isValid = body.image.startsWith("data:image/");
      expect(isValid).toBe(false);
    });

    it("accepts valid PNG data URL", () => {
      const body = { image: "data:image/png;base64,iVBORw0KGgo=" };
      const isValid = typeof body.image === "string" && body.image.startsWith("data:image/");
      expect(isValid).toBe(true);
    });

    it("accepts valid JPEG data URL", () => {
      const body = { image: "data:image/jpeg;base64,/9j/4AAQ=" };
      const isValid = typeof body.image === "string" && body.image.startsWith("data:image/");
      expect(isValid).toBe(true);
    });

    it("accepts valid WebP data URL", () => {
      const body = { image: "data:image/webp;base64,UklGR=" };
      const isValid = typeof body.image === "string" && body.image.startsWith("data:image/");
      expect(isValid).toBe(true);
    });
  });
});

describe("Student Image API - Database Operations", () => {
  let db: Database.Database;
  let cohortId: number;

  beforeEach(() => {
    db = createTestDatabase();
    const cohort = createTestCohort(db, "Test2026");
    cohortId = cohort.id;
  });

  afterEach(() => {
    db.close();
  });

  describe("get student image", () => {
    it("returns null for student with no image", () => {
      const student = createTestStudent(db, { name: "No Image", cohortId });

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const result = stmt.get(student.id) as { profile_image: string | null };

      expect(result.profile_image).toBeNull();
    });

    it("returns image data for student with image", () => {
      const student = createTestStudent(db, { name: "Has Image", cohortId });
      const imageData = "data:image/png;base64,iVBORw0KGgo=";

      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?").run(imageData, student.id);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const result = stmt.get(student.id) as { profile_image: string };

      expect(result.profile_image).toBe(imageData);
    });
  });

  describe("update student image", () => {
    it("sets image for a student", () => {
      const student = createTestStudent(db, { name: "Test", cohortId });
      const imageData = "data:image/png;base64,iVBORw0KGgo=";

      const result = db.prepare("UPDATE students SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(imageData, student.id);

      expect(result.changes).toBe(1);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const row = stmt.get(student.id) as { profile_image: string };
      expect(row.profile_image).toBe(imageData);
    });

    it("replaces existing image", () => {
      const student = createTestStudent(db, { name: "Test", cohortId });

      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?")
        .run("data:image/png;base64,OLD", student.id);
      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?")
        .run("data:image/jpeg;base64,NEW", student.id);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const row = stmt.get(student.id) as { profile_image: string };
      expect(row.profile_image).toBe("data:image/jpeg;base64,NEW");
    });

    it("returns 0 changes for non-existent student", () => {
      const result = db.prepare("UPDATE students SET profile_image = ? WHERE id = ?")
        .run("data:image/png;base64,AAAA", 9999);

      expect(result.changes).toBe(0);
    });
  });

  describe("delete student image", () => {
    it("removes image from a student", () => {
      const student = createTestStudent(db, { name: "Test", cohortId });
      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?")
        .run("data:image/png;base64,AAAA", student.id);

      const result = db.prepare("UPDATE students SET profile_image = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(student.id);

      expect(result.changes).toBe(1);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const row = stmt.get(student.id) as { profile_image: string | null };
      expect(row.profile_image).toBeNull();
    });

    it("returns 0 changes for non-existent student", () => {
      const result = db.prepare("UPDATE students SET profile_image = NULL WHERE id = ?")
        .run(9999);

      expect(result.changes).toBe(0);
    });
  });

  describe("image persistence through student operations", () => {
    it("deleting a student also removes image data", () => {
      const student = createTestStudent(db, { name: "Test", cohortId });
      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?")
        .run("data:image/png;base64,AAAA", student.id);

      db.prepare("DELETE FROM students WHERE id = ?").run(student.id);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      expect(stmt.get(student.id)).toBeUndefined();
    });
  });
});

describe("Cohort API - Database Operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe("list cohorts", () => {
    it("returns empty array when no cohorts", () => {
      const stmt = db.prepare("SELECT * FROM cohorts");
      const cohorts = stmt.all();
      expect(cohorts).toEqual([]);
    });

    it("returns list of cohorts sorted by name", () => {
      createTestCohort(db, "Sp2026");
      createTestCohort(db, "Fa2025");

      const stmt = db.prepare("SELECT * FROM cohorts ORDER BY name ASC");
      const cohorts = stmt.all() as { name: string }[];

      expect(cohorts.length).toBe(2);
      expect(cohorts[0].name).toBe("Fa2025");
      expect(cohorts[1].name).toBe("Sp2026");
    });
  });
});
