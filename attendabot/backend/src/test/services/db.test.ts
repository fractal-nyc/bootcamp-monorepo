/**
 * @fileoverview Tests for the database service (services/db.ts).
 * Tests core database functions directly using in-memory SQLite.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
  createTestDatabase,
  createTestChannel,
  createTestUser,
  createTestMessage,
  createTestCohort,
  createTestStudent,
  createTestNote,
  createTestStudentSummary,
  createTestCohortSentiment,
  daysAgo,
} from "../utils/testUtils";

describe("Database Service - Direct Tests", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe("Channels", () => {
    it("creates a channel", () => {
      const channel = createTestChannel(db, "ch-1", "general");

      const stmt = db.prepare("SELECT * FROM channels WHERE channel_id = ?");
      const result = stmt.get("ch-1") as { channel_id: string; channel_name: string };

      expect(result).toBeDefined();
      expect(result.channel_name).toBe("general");
    });

    it("updates existing channel name with upsert pattern", () => {
      createTestChannel(db, "ch-1", "old-name");

      // Upsert pattern
      const upsertStmt = db.prepare(`
        INSERT INTO channels (channel_id, channel_name, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(channel_id) DO UPDATE SET
          channel_name = excluded.channel_name,
          updated_at = CURRENT_TIMESTAMP
      `);
      upsertStmt.run("ch-1", "new-name");

      const stmt = db.prepare("SELECT * FROM channels WHERE channel_id = ?");
      const result = stmt.get("ch-1") as { channel_name: string };

      expect(result.channel_name).toBe("new-name");
    });
  });

  describe("Users", () => {
    it("creates a user", () => {
      const user = createTestUser(db, "user-1", "testuser", "Display Name");

      const stmt = db.prepare("SELECT * FROM users WHERE author_id = ?");
      const result = stmt.get("user-1") as { username: string; display_name: string };

      expect(result.username).toBe("testuser");
      expect(result.display_name).toBe("Display Name");
    });

    it("preserves display_name when updating with null", () => {
      createTestUser(db, "user-1", "olduser", "Original Name");

      // Upsert that preserves display_name if new value is null
      const upsertStmt = db.prepare(`
        INSERT INTO users (author_id, display_name, username, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(author_id) DO UPDATE SET
          display_name = COALESCE(excluded.display_name, display_name),
          username = excluded.username,
          updated_at = CURRENT_TIMESTAMP
      `);
      upsertStmt.run("user-1", null, "newuser");

      const stmt = db.prepare("SELECT * FROM users WHERE author_id = ?");
      const result = stmt.get("user-1") as { username: string; display_name: string };

      expect(result.username).toBe("newuser");
      expect(result.display_name).toBe("Original Name");
    });
  });

  describe("Messages", () => {
    it("creates a message with FK constraints", () => {
      const channel = createTestChannel(db);
      const user = createTestUser(db);

      const msg = createTestMessage(db, {
        discordMessageId: "msg-1",
        channelId: channel.channel_id,
        authorId: user.author_id,
        content: "Hello world",
      });

      const stmt = db.prepare("SELECT COUNT(*) as count FROM messages");
      const result = stmt.get() as { count: number };

      expect(result.count).toBe(1);
    });

    it("ignores duplicate discord_message_id", () => {
      const channel = createTestChannel(db);
      const user = createTestUser(db);

      createTestMessage(db, {
        discordMessageId: "msg-1",
        channelId: channel.channel_id,
        authorId: user.author_id,
      });

      // Try to insert duplicate - should be ignored
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO messages (discord_message_id, channel_id, author_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run("msg-1", channel.channel_id, user.author_id, "Duplicate", new Date().toISOString());

      const countStmt = db.prepare("SELECT COUNT(*) as count FROM messages");
      const result = countStmt.get() as { count: number };

      expect(result.count).toBe(1);
    });

    it("retrieves messages ordered by newest first", () => {
      const channel = createTestChannel(db);
      const user = createTestUser(db);

      createTestMessage(db, {
        discordMessageId: "msg-1",
        channelId: channel.channel_id,
        authorId: user.author_id,
        createdAt: "2024-01-01T10:00:00Z",
      });
      createTestMessage(db, {
        discordMessageId: "msg-2",
        channelId: channel.channel_id,
        authorId: user.author_id,
        createdAt: "2024-01-01T12:00:00Z",
      });

      const stmt = db.prepare(`
        SELECT discord_message_id FROM messages
        WHERE channel_id = ?
        ORDER BY created_at DESC
      `);
      const results = stmt.all(channel.channel_id) as { discord_message_id: string }[];

      expect(results.length).toBe(2);
      expect(results[0].discord_message_id).toBe("msg-2");
      expect(results[1].discord_message_id).toBe("msg-1");
    });

    it("retrieves messages by user with channel filter", () => {
      const ch1 = createTestChannel(db, "ch-1", "channel-1");
      const ch2 = createTestChannel(db, "ch-2", "channel-2");
      const user = createTestUser(db, "user-1", "user1");

      createTestMessage(db, { channelId: ch1.channel_id, authorId: user.author_id });
      createTestMessage(db, { channelId: ch2.channel_id, authorId: user.author_id });

      const stmt = db.prepare(`
        SELECT * FROM messages
        WHERE author_id = ? AND channel_id = ?
      `);
      const results = stmt.all("user-1", "ch-1");

      expect(results.length).toBe(1);
    });

    it("retrieves messages within date range", () => {
      const channel = createTestChannel(db, "ch-1", "eod");
      const user = createTestUser(db);

      createTestMessage(db, {
        discordMessageId: "inside",
        channelId: channel.channel_id,
        authorId: user.author_id,
        createdAt: "2024-01-15T12:00:00Z",
      });
      createTestMessage(db, {
        discordMessageId: "before",
        channelId: channel.channel_id,
        authorId: user.author_id,
        createdAt: "2024-01-10T12:00:00Z",
      });
      createTestMessage(db, {
        discordMessageId: "after",
        channelId: channel.channel_id,
        authorId: user.author_id,
        createdAt: "2024-01-20T12:00:00Z",
      });

      const stmt = db.prepare(`
        SELECT discord_message_id FROM messages m
        JOIN channels c ON m.channel_id = c.channel_id
        WHERE c.channel_name = ?
          AND m.created_at >= ?
          AND m.created_at < ?
        ORDER BY m.created_at ASC
      `);
      const results = stmt.all("eod", "2024-01-14T00:00:00Z", "2024-01-16T00:00:00Z") as { discord_message_id: string }[];

      expect(results.length).toBe(1);
      expect(results[0].discord_message_id).toBe("inside");
    });
  });

  describe("Activity Log", () => {
    it("logs activity events", () => {
      const stmt = db.prepare(`
        INSERT INTO activity_log (event_type, details)
        VALUES (?, ?)
      `);
      stmt.run("TEST_EVENT", "Some details");

      const selectStmt = db.prepare("SELECT * FROM activity_log");
      const results = selectStmt.all() as { event_type: string; details: string }[];

      expect(results.length).toBe(1);
      expect(results[0].event_type).toBe("TEST_EVENT");
      expect(results[0].details).toBe("Some details");
    });

    it("handles null details", () => {
      const stmt = db.prepare(`
        INSERT INTO activity_log (event_type, details)
        VALUES (?, ?)
      `);
      stmt.run("NO_DETAILS", null);

      const selectStmt = db.prepare("SELECT * FROM activity_log");
      const results = selectStmt.all() as { details: string | null }[];

      expect(results[0].details).toBeNull();
    });
  });

  describe("Cohorts", () => {
    it("creates a cohort", () => {
      const cohort = createTestCohort(db, "Test2026");

      expect(cohort.id).toBeGreaterThan(0);
      expect(cohort.name).toBe("Test2026");
    });

    it("retrieves cohorts sorted by name", () => {
      createTestCohort(db, "Sp2026");
      createTestCohort(db, "Fa2025");

      const stmt = db.prepare("SELECT * FROM cohorts ORDER BY name ASC");
      const results = stmt.all() as { name: string }[];

      expect(results.length).toBe(2);
      expect(results[0].name).toBe("Fa2025");
      expect(results[1].name).toBe("Sp2026");
    });

    it("throws on duplicate cohort name", () => {
      createTestCohort(db, "Test2026");

      expect(() => {
        createTestCohort(db, "Test2026");
      }).toThrow();
    });
  });

  describe("Students", () => {
    let cohortId: number;

    beforeEach(() => {
      const cohort = createTestCohort(db);
      cohortId = cohort.id;
    });

    it("creates a student with required fields", () => {
      const student = createTestStudent(db, {
        name: "Test Student",
        cohortId,
      });

      expect(student.id).toBeGreaterThan(0);
      expect(student.name).toBe("Test Student");
      expect(student.status).toBe("active");
    });

    it("creates a student with optional fields", () => {
      const user = createTestUser(db, "discord-1", "duser");

      const student = createTestStudent(db, {
        name: "Full Student",
        cohortId,
        discordUserId: user.author_id,
        status: "inactive",
        currentInternship: "Tech Inc",
      });

      expect(student.discord_user_id).toBe("discord-1");
      expect(student.status).toBe("inactive");
    });

    it("retrieves students sorted by name", () => {
      createTestStudent(db, { name: "Zara", cohortId });
      createTestStudent(db, { name: "Alice", cohortId });

      const stmt = db.prepare(`
        SELECT * FROM students
        WHERE cohort_id = ?
        ORDER BY name ASC
      `);
      const results = stmt.all(cohortId) as { name: string }[];

      expect(results[0].name).toBe("Alice");
      expect(results[1].name).toBe("Zara");
    });

    it("updates student fields", () => {
      const student = createTestStudent(db, {
        name: "Original",
        cohortId,
        status: "active",
      });

      const updateStmt = db.prepare(`
        UPDATE students SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run("Updated", student.id);

      const selectStmt = db.prepare("SELECT * FROM students WHERE id = ?");
      const result = selectStmt.get(student.id) as { name: string; status: string };

      expect(result.name).toBe("Updated");
      expect(result.status).toBe("active"); // Unchanged
    });

    it("deletes a student", () => {
      const student = createTestStudent(db, { name: "To Delete", cohortId });

      const deleteStmt = db.prepare("DELETE FROM students WHERE id = ?");
      const result = deleteStmt.run(student.id);

      expect(result.changes).toBe(1);

      const selectStmt = db.prepare("SELECT * FROM students WHERE id = ?");
      expect(selectStmt.get(student.id)).toBeUndefined();
    });

    it("cascades delete to instructor notes", () => {
      const student = createTestStudent(db, { name: "Test", cohortId });
      createTestNote(db, { studentId: student.id });

      db.prepare("DELETE FROM students WHERE id = ?").run(student.id);

      const notesStmt = db.prepare("SELECT COUNT(*) as count FROM instructor_notes WHERE student_id = ?");
      const result = notesStmt.get(student.id) as { count: number };
      expect(result.count).toBe(0);
    });

    it("retrieves students by last check-in", () => {
      const s1 = createTestStudent(db, { name: "Recent", cohortId });
      const s2 = createTestStudent(db, { name: "Old", cohortId });

      createTestNote(db, { studentId: s1.id, createdAt: "2024-01-20T10:00:00Z" });
      createTestNote(db, { studentId: s2.id, createdAt: "2024-01-10T10:00:00Z" });

      const stmt = db.prepare(`
        SELECT s.name, MAX(n.created_at) as last_check_in
        FROM students s
        LEFT JOIN instructor_notes n ON s.id = n.student_id
        WHERE s.cohort_id = ?
        GROUP BY s.id
        ORDER BY last_check_in ASC NULLS FIRST
      `);
      const results = stmt.all(cohortId) as { name: string }[];

      expect(results[0].name).toBe("Old");
      expect(results[1].name).toBe("Recent");
    });

    it("gets active students with discord", () => {
      const user = createTestUser(db, "discord-1", "user1");
      createTestStudent(db, { name: "Active With Discord", cohortId, discordUserId: user.author_id, status: "active" });
      createTestStudent(db, { name: "Active No Discord", cohortId, status: "active" });
      createTestStudent(db, { name: "Inactive With Discord", cohortId, discordUserId: user.author_id, status: "inactive" });

      const stmt = db.prepare(`
        SELECT * FROM students
        WHERE cohort_id = ? AND status = 'active' AND discord_user_id IS NOT NULL
        ORDER BY name ASC
      `);
      const results = stmt.all(cohortId) as { name: string }[];

      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Active With Discord");
    });
  });

  describe("Student Profile Images", () => {
    let cohortId: number;
    let studentId: number;

    beforeEach(() => {
      const cohort = createTestCohort(db);
      cohortId = cohort.id;
      const student = createTestStudent(db, { name: "Image Test", cohortId });
      studentId = student.id;
    });

    it("returns null when no image is set", () => {
      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const result = stmt.get(studentId) as { profile_image: string | null };

      expect(result.profile_image).toBeNull();
    });

    it("stores a base64 image data URL", () => {
      const imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";

      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?").run(imageData, studentId);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const result = stmt.get(studentId) as { profile_image: string };

      expect(result.profile_image).toBe(imageData);
    });

    it("updates an existing image", () => {
      const original = "data:image/png;base64,AAAA";
      const updated = "data:image/jpeg;base64,BBBB";

      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?").run(original, studentId);
      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?").run(updated, studentId);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const result = stmt.get(studentId) as { profile_image: string };

      expect(result.profile_image).toBe(updated);
    });

    it("removes an image by setting to null", () => {
      const imageData = "data:image/png;base64,iVBORw0KGgo=";

      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?").run(imageData, studentId);
      db.prepare("UPDATE students SET profile_image = NULL WHERE id = ?").run(studentId);

      const stmt = db.prepare("SELECT profile_image FROM students WHERE id = ?");
      const result = stmt.get(studentId) as { profile_image: string | null };

      expect(result.profile_image).toBeNull();
    });

    it("returns 0 changes when updating non-existent student", () => {
      const result = db.prepare("UPDATE students SET profile_image = ? WHERE id = ?")
        .run("data:image/png;base64,AAAA", 9999);

      expect(result.changes).toBe(0);
    });

    it("does not include profile_image in standard student queries by default", () => {
      const imageData = "data:image/png;base64,LargeImageData";
      db.prepare("UPDATE students SET profile_image = ? WHERE id = ?").run(imageData, studentId);

      // Standard query pattern used by getStudentsByCohort excludes profile_image
      const stmt = db.prepare(`
        SELECT s.id, s.name, s.status, s.cohort_id
        FROM students s
        WHERE s.cohort_id = ?
      `);
      const results = stmt.all(cohortId) as Record<string, unknown>[];

      expect(results.length).toBe(1);
      expect(results[0]).not.toHaveProperty("profile_image");
    });
  });

  describe("Instructor Notes", () => {
    let cohortId: number;
    let studentId: number;

    beforeEach(() => {
      const cohort = createTestCohort(db);
      cohortId = cohort.id;
      const student = createTestStudent(db, { name: "Test", cohortId });
      studentId = student.id;
    });

    it("creates a note for a student", () => {
      const note = createTestNote(db, {
        studentId,
        author: "Instructor",
        content: "Great progress!",
      });

      expect(note.id).toBeGreaterThan(0);
      expect(note.content).toBe("Great progress!");
      expect(note.author).toBe("Instructor");
    });
  });

  describe("Student Feed", () => {
    let cohortId: number;
    let studentId: number;
    let discordUserId: string;

    beforeEach(() => {
      const cohort = createTestCohort(db);
      cohortId = cohort.id;

      const user = createTestUser(db, "discord-1", "student-user");
      discordUserId = user.author_id;

      const student = createTestStudent(db, {
        name: "Feed Test Student",
        cohortId,
        discordUserId,
      });
      studentId = student.id;
    });

    it("retrieves instructor notes for student", () => {
      createTestNote(db, { studentId, author: "David", content: "Note 1" });
      createTestNote(db, { studentId, author: "Paris", content: "Note 2" });

      const stmt = db.prepare(`
        SELECT * FROM instructor_notes WHERE student_id = ?
      `);
      const results = stmt.all(studentId);

      expect(results.length).toBe(2);
    });

    it("excludes attendance channel from feed", () => {
      const eodChannel = createTestChannel(db, "eod-ch", "eod");
      const attendanceChannel = createTestChannel(db, "att-ch", "attendance");

      createTestMessage(db, {
        channelId: eodChannel.channel_id,
        authorId: discordUserId,
        content: "EOD message",
      });
      createTestMessage(db, {
        channelId: attendanceChannel.channel_id,
        authorId: discordUserId,
        content: "Present!",
      });

      const stmt = db.prepare(`
        SELECT m.content FROM messages m
        JOIN channels c ON m.channel_id = c.channel_id
        WHERE m.author_id = ? AND c.channel_name != 'attendance'
      `);
      const results = stmt.all(discordUserId) as { content: string }[];

      expect(results.length).toBe(1);
      expect(results[0].content).toBe("EOD message");
    });
  });

  describe("Student Summaries Cache", () => {
    let studentId: number;

    beforeEach(() => {
      const cohort = createTestCohort(db);
      const student = createTestStudent(db, { name: "Test", cohortId: cohort.id });
      studentId = student.id;
    });

    it("saves and retrieves student summary", () => {
      createTestStudentSummary(db, {
        studentId,
        date: "2024-01-15",
        summary: "Test summary",
      });

      const stmt = db.prepare(`
        SELECT summary FROM student_summaries
        WHERE student_id = ? AND date = ?
      `);
      const result = stmt.get(studentId, "2024-01-15") as { summary: string };

      expect(result.summary).toBe("Test summary");
    });

    it("updates existing summary with upsert", () => {
      createTestStudentSummary(db, {
        studentId,
        date: "2024-01-15",
        summary: "Original",
      });

      const upsertStmt = db.prepare(`
        INSERT INTO student_summaries (student_id, date, summary)
        VALUES (?, ?, ?)
        ON CONFLICT(student_id, date) DO UPDATE SET
          summary = excluded.summary,
          created_at = CURRENT_TIMESTAMP
      `);
      upsertStmt.run(studentId, "2024-01-15", "Updated");

      const stmt = db.prepare("SELECT summary FROM student_summaries WHERE student_id = ? AND date = ?");
      const result = stmt.get(studentId, "2024-01-15") as { summary: string };

      expect(result.summary).toBe("Updated");
    });
  });

  describe("Cohort Sentiments Cache", () => {
    let cohortId: number;

    beforeEach(() => {
      const cohort = createTestCohort(db);
      cohortId = cohort.id;
    });

    it("saves and retrieves cohort sentiment", () => {
      createTestCohortSentiment(db, {
        cohortId,
        date: "2024-01-15",
        sentiment: "Overall positive mood",
      });

      const stmt = db.prepare(`
        SELECT sentiment FROM cohort_sentiments
        WHERE cohort_id = ? AND date = ?
      `);
      const result = stmt.get(cohortId, "2024-01-15") as { sentiment: string };

      expect(result.sentiment).toBe("Overall positive mood");
    });

    it("updates existing sentiment with upsert", () => {
      createTestCohortSentiment(db, {
        cohortId,
        date: "2024-01-15",
        sentiment: "Original",
      });

      const upsertStmt = db.prepare(`
        INSERT INTO cohort_sentiments (cohort_id, date, sentiment)
        VALUES (?, ?, ?)
        ON CONFLICT(cohort_id, date) DO UPDATE SET
          sentiment = excluded.sentiment,
          created_at = CURRENT_TIMESTAMP
      `);
      upsertStmt.run(cohortId, "2024-01-15", "Updated");

      const stmt = db.prepare("SELECT sentiment FROM cohort_sentiments WHERE cohort_id = ? AND date = ?");
      const result = stmt.get(cohortId, "2024-01-15") as { sentiment: string };

      expect(result.sentiment).toBe("Updated");
    });
  });

  describe("Foreign Key Constraints", () => {
    it("prevents message without valid channel", () => {
      const user = createTestUser(db);

      expect(() => {
        db.prepare(`
          INSERT INTO messages (discord_message_id, channel_id, author_id, content, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run("msg-1", "nonexistent-channel", user.author_id, "Test", new Date().toISOString());
      }).toThrow(/FOREIGN KEY/);
    });

    it("prevents message without valid user", () => {
      const channel = createTestChannel(db);

      expect(() => {
        db.prepare(`
          INSERT INTO messages (discord_message_id, channel_id, author_id, content, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run("msg-1", channel.channel_id, "nonexistent-user", "Test", new Date().toISOString());
      }).toThrow(/FOREIGN KEY/);
    });

    it("prevents student without valid cohort", () => {
      expect(() => {
        db.prepare(`
          INSERT INTO students (name, cohort_id, status)
          VALUES (?, ?, ?)
        `).run("Test", 9999, "active");
      }).toThrow(/FOREIGN KEY/);
    });
  });
});
