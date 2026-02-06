/**
 * @fileoverview Test utilities and fixtures for attendabot tests.
 * Provides in-memory database factory and test data generators.
 */

import Database from "better-sqlite3";

/**
 * Creates an in-memory SQLite database with the same schema as production.
 * Each call returns a fresh isolated database instance for test isolation.
 */
export function createTestDatabase(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  // Channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      channel_id TEXT PRIMARY KEY,
      channel_name TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      author_id TEXT PRIMARY KEY,
      display_name TEXT,
      username TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_message_id TEXT UNIQUE,
      channel_id TEXT NOT NULL REFERENCES channels(channel_id),
      author_id TEXT NOT NULL REFERENCES users(author_id),
      content TEXT,
      created_at TEXT NOT NULL,
      logged_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Activity log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cohorts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cohorts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      discord_user_id TEXT REFERENCES users(author_id),
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated', 'withdrawn')),
      current_internship TEXT,
      profile_image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Instructor notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS instructor_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_instructor_notes_student ON instructor_notes(student_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_students_cohort ON students(cohort_id)`);

  // Student summaries cache
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date)
    )
  `);

  // Cohort sentiments cache
  db.exec(`
    CREATE TABLE IF NOT EXISTS cohort_sentiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cohort_id, date)
    )
  `);

  return db;
}

/** Test fixture: creates a channel in the database. */
export function createTestChannel(
  db: Database.Database,
  channelId: string = "channel-123",
  channelName: string = "test-channel"
): { channel_id: string; channel_name: string } {
  const stmt = db.prepare(`
    INSERT INTO channels (channel_id, channel_name) VALUES (?, ?)
  `);
  stmt.run(channelId, channelName);
  return { channel_id: channelId, channel_name: channelName };
}

/** Test fixture: creates a user in the database. */
export function createTestUser(
  db: Database.Database,
  authorId: string = "user-123",
  username: string = "testuser",
  displayName: string | null = "Test User"
): { author_id: string; username: string; display_name: string | null } {
  const stmt = db.prepare(`
    INSERT INTO users (author_id, username, display_name) VALUES (?, ?, ?)
  `);
  stmt.run(authorId, username, displayName);
  return { author_id: authorId, username, display_name: displayName };
}

/** Test fixture: creates a message in the database. */
export function createTestMessage(
  db: Database.Database,
  options: {
    discordMessageId?: string;
    channelId: string;
    authorId: string;
    content?: string;
    createdAt?: string;
  }
): { discord_message_id: string; channel_id: string; author_id: string; content: string | null; created_at: string } {
  const messageId = options.discordMessageId ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdAt = options.createdAt ?? new Date().toISOString();
  const content = options.content ?? "Test message content";

  const stmt = db.prepare(`
    INSERT INTO messages (discord_message_id, channel_id, author_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(messageId, options.channelId, options.authorId, content, createdAt);

  return {
    discord_message_id: messageId,
    channel_id: options.channelId,
    author_id: options.authorId,
    content,
    created_at: createdAt,
  };
}

/** Test fixture: creates a cohort in the database. */
export function createTestCohort(
  db: Database.Database,
  name: string = "Test2026"
): { id: number; name: string } {
  const stmt = db.prepare(`INSERT INTO cohorts (name) VALUES (?)`);
  const result = stmt.run(name);
  return { id: result.lastInsertRowid as number, name };
}

/** Test fixture: creates a student in the database. */
export function createTestStudent(
  db: Database.Database,
  options: {
    name?: string;
    cohortId: number;
    discordUserId?: string | null;
    status?: "active" | "inactive" | "graduated" | "withdrawn";
    currentInternship?: string | null;
  }
): { id: number; name: string; cohort_id: number; discord_user_id: string | null; status: string } {
  const name = options.name ?? "Test Student";
  const status = options.status ?? "active";
  const discordUserId = options.discordUserId ?? null;
  const currentInternship = options.currentInternship ?? null;

  const stmt = db.prepare(`
    INSERT INTO students (name, cohort_id, discord_user_id, status, current_internship)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, options.cohortId, discordUserId, status, currentInternship);

  return {
    id: result.lastInsertRowid as number,
    name,
    cohort_id: options.cohortId,
    discord_user_id: discordUserId,
    status,
  };
}

/** Test fixture: creates an instructor note in the database. */
export function createTestNote(
  db: Database.Database,
  options: {
    studentId: number;
    author?: string;
    content?: string;
    createdAt?: string;
  }
): { id: number; student_id: number; author: string; content: string } {
  const author = options.author ?? "Test Instructor";
  const content = options.content ?? "Test note content";

  // If custom createdAt, we need to use a different approach
  if (options.createdAt) {
    const stmt = db.prepare(`
      INSERT INTO instructor_notes (student_id, author, content, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(options.studentId, author, content, options.createdAt);
    return {
      id: result.lastInsertRowid as number,
      student_id: options.studentId,
      author,
      content,
    };
  }

  const stmt = db.prepare(`
    INSERT INTO instructor_notes (student_id, author, content)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(options.studentId, author, content);

  return {
    id: result.lastInsertRowid as number,
    student_id: options.studentId,
    author,
    content,
  };
}

/** Test fixture: creates a student summary in the database. */
export function createTestStudentSummary(
  db: Database.Database,
  options: {
    studentId: number;
    date: string;
    summary: string;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO student_summaries (student_id, date, summary)
    VALUES (?, ?, ?)
  `);
  stmt.run(options.studentId, options.date, options.summary);
}

/** Test fixture: creates a cohort sentiment in the database. */
export function createTestCohortSentiment(
  db: Database.Database,
  options: {
    cohortId: number;
    date: string;
    sentiment: string;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO cohort_sentiments (cohort_id, date, sentiment)
    VALUES (?, ?, ?)
  `);
  stmt.run(options.cohortId, options.date, options.sentiment);
}

/** Generates a random ISO date string within the last N days. */
export function randomDateWithinDays(days: number): string {
  const now = Date.now();
  const offset = Math.floor(Math.random() * days * 24 * 60 * 60 * 1000);
  return new Date(now - offset).toISOString();
}

/** Generates a date string N days ago. */
export function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
