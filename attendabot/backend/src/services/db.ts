/**
 * @fileoverview SQLite database service for storing messages, users,
 * channels, and activity logs.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

/** Returns the singleton database instance, initializing it if needed. */
export function getDatabase(): Database.Database {
  if (!db) {
    const dbDir = path.join(__dirname, "../../db");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, "attendabot.db");
    db = new Database(dbPath);
    db.pragma("foreign_keys = ON");
    initializeTables();
  }
  return db;
}

function initializeTables(): void {
  if (!db) return;

  // Channels table (must be created before messages for FK)
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      channel_id TEXT PRIMARY KEY,
      channel_name TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table (must be created before messages for FK)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      author_id TEXT PRIMARY KEY,
      display_name TEXT,
      username TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages log table with foreign keys
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

  // Bot activity log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cohorts table (Fa2025, Sp2026, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cohorts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Students table (linked optionally to Discord users, belongs to one cohort)
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      discord_user_id TEXT REFERENCES users(author_id),
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated', 'withdrawn')),
      current_internship TEXT,
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

  // Indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_instructor_notes_student ON instructor_notes(student_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_students_cohort ON students(cohort_id)`);

  // Student AI summaries cache
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

  // Cohort sentiment cache
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

  // Feature requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feature_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      author TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'done')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Feature flags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      key TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Observers table (instructors who observe students)
  db.exec(`
    CREATE TABLE IF NOT EXISTS observers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_user_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      username TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add observer_id column to students if it doesn't exist
  const studentColumns = db.pragma("table_info(students)") as Array<{ name: string }>;
  if (!studentColumns.some((col) => col.name === "observer_id")) {
    db.exec(`ALTER TABLE students ADD COLUMN observer_id INTEGER REFERENCES observers(id)`);
  }

  // Add profile_image column to students if it doesn't exist
  const studentCols2 = db.pragma("table_info(students)") as Array<{ name: string }>;
  if (!studentCols2.some((col) => col.name === "profile_image")) {
    db.exec(`ALTER TABLE students ADD COLUMN profile_image TEXT`);
  }

  // Add date columns to cohorts if they don't exist
  const cohortCols = db.pragma("table_info(cohorts)") as Array<{ name: string }>;
  if (!cohortCols.some((col) => col.name === "start_date")) {
    db.exec(`ALTER TABLE cohorts ADD COLUMN start_date TEXT`);
    db.exec(`ALTER TABLE cohorts ADD COLUMN end_date TEXT`);
    db.exec(`ALTER TABLE cohorts ADD COLUMN break_start TEXT`);
    db.exec(`ALTER TABLE cohorts ADD COLUMN break_end TEXT`);
  }

  // Add updated_at column to instructor_notes if it doesn't exist
  const noteCols = db.pragma("table_info(instructor_notes)") as Array<{ name: string }>;
  if (!noteCols.some((col) => col.name === "updated_at")) {
    db.exec(`ALTER TABLE instructor_notes ADD COLUMN updated_at TEXT`);
  }

  // Seed default cohorts if they don't exist
  seedDefaultCohorts();

  // Seed default feature flags
  seedDefaultFeatureFlags();

  console.log("Database tables initialized");
}

/** Seeds default feature flags if they don't already exist. */
function seedDefaultFeatureFlags(): void {
  if (!db) return;
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO feature_flags (key, enabled, description) VALUES (?, ?, ?)`
  );
  stmt.run(
    "eod_next_day_content",
    1,
    "Include next day's assignment in the EOD reminder message"
  );
  // Clean up obsolete flags
  db.prepare(`DELETE FROM feature_flags WHERE key = ?`).run("password_login_enabled");
}

/** Seeds default cohorts (Fa2025, Sp2026) if they don't already exist. */
function seedDefaultCohorts(): void {
  if (!db) return;
  const stmt = db.prepare(`INSERT OR IGNORE INTO cohorts (name) VALUES (?)`);
  stmt.run("Fa2025");
  stmt.run("Sp2026");

  // Set Sp2026 dates if not already set
  db.prepare(`
    UPDATE cohorts SET start_date='2026-02-02', end_date='2026-05-02',
      break_start='2026-03-15', break_end='2026-03-22'
    WHERE name='Sp2026' AND start_date IS NULL
  `).run();
}

/** A message record from the database with joined channel and user data. */
export interface MessageRecord {
  discord_message_id: string;
  channel_id: string;
  channel_name: string;
  author_id: string;
  display_name: string | null;
  username: string;
  content: string | null;
  created_at: string;
}

/** Inserts or updates a channel record. */
export function upsertChannel(channelId: string, channelName: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO channels (channel_id, channel_name, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(channel_id) DO UPDATE SET
      channel_name = excluded.channel_name,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(channelId, channelName);
}

/** Inserts or updates a user record. Only overwrites display_name if new value is non-null. */
export function upsertUser(authorId: string, displayName: string | null, username: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (author_id, display_name, username, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(author_id) DO UPDATE SET
      display_name = COALESCE(excluded.display_name, display_name),
      username = excluded.username,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(authorId, displayName, username);
}

/** Returns the total count of messages in the database. */
export function getMessageCount(): number {
  const db = getDatabase();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM messages");
  const result = stmt.get() as { count: number };
  return result.count;
}

/** Returns the count of messages for a specific channel. */
export function getMessageCountByChannel(channelId: string): number {
  const db = getDatabase();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM messages WHERE channel_id = ?");
  const result = stmt.get(channelId) as { count: number };
  return result.count;
}

/** Logs a Discord message to the database, upserting channel and user first. */
export function logMessage(message: MessageRecord): void {
  const db = getDatabase();

  // Upsert channel and user first (required for FK constraints)
  upsertChannel(message.channel_id, message.channel_name);
  upsertUser(message.author_id, message.display_name, message.username);

  const stmt = db.prepare(`
    INSERT INTO messages (discord_message_id, channel_id, author_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(discord_message_id) DO UPDATE SET
      content = excluded.content
  `);
  stmt.run(
    message.discord_message_id,
    message.channel_id,
    message.author_id,
    message.content,
    message.created_at
  );
}

/** Retrieves recent messages from a channel, ordered by newest first. */
export function getRecentMessages(channelId: string, limit: number = 50): MessageRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      m.discord_message_id,
      m.channel_id,
      c.channel_name,
      m.author_id,
      u.display_name,
      u.username,
      m.content,
      m.created_at
    FROM messages m
    JOIN channels c ON m.channel_id = c.channel_id
    JOIN users u ON m.author_id = u.author_id
    WHERE m.channel_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `);
  return stmt.all(channelId, limit) as MessageRecord[];
}

/** Logs a bot activity event to the activity_log table. */
export function logActivity(eventType: string, details?: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO activity_log (event_type, details)
    VALUES (?, ?)
  `);
  stmt.run(eventType, details ?? null);
}

/** Retrieves recent activity log entries, ordered by newest first. */
export function getRecentActivity(limit: number = 100): Array<{ event_type: string; details: string | null; created_at: string }> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT event_type, details, created_at
    FROM activity_log
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit) as Array<{ event_type: string; details: string | null; created_at: string }>;
}

/** A user record from the database. */
export interface UserRecord {
  author_id: string;
  display_name: string | null;
  username: string;
}

/** Retrieves all users from the database, ordered by display name (or username if no display name). */
export function getAllUsers(): UserRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT author_id, display_name, username
    FROM users
    ORDER BY COALESCE(display_name, username) COLLATE NOCASE ASC
  `);
  return stmt.all() as UserRecord[];
}

/** Retrieves recent messages from a channel within a specified number of days. */
export function getRecentChannelMessages(channelId: string, daysBack: number = 7, limit: number = 500): MessageRecord[] {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffIso = cutoffDate.toISOString();

  const stmt = db.prepare(`
    SELECT
      m.discord_message_id,
      m.channel_id,
      c.channel_name,
      m.author_id,
      u.display_name,
      u.username,
      m.content,
      m.created_at
    FROM messages m
    JOIN channels c ON m.channel_id = c.channel_id
    JOIN users u ON m.author_id = u.author_id
    WHERE m.channel_id = ? AND m.created_at >= ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `);
  return stmt.all(channelId, cutoffIso, limit) as MessageRecord[];
}

/** Retrieves messages by a specific user, optionally filtered by channel. */
export function getMessagesByUser(authorId: string, channelId?: string, limit: number = 100): MessageRecord[] {
  const db = getDatabase();

  if (channelId) {
    const stmt = db.prepare(`
      SELECT
        m.discord_message_id,
        m.channel_id,
        c.channel_name,
        m.author_id,
        u.display_name,
        u.username,
        m.content,
        m.created_at
      FROM messages m
      JOIN channels c ON m.channel_id = c.channel_id
      JOIN users u ON m.author_id = u.author_id
      WHERE m.author_id = ? AND m.channel_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    return stmt.all(authorId, channelId, limit) as MessageRecord[];
  }

  const stmt = db.prepare(`
    SELECT
      m.discord_message_id,
      m.channel_id,
      c.channel_name,
      m.author_id,
      u.display_name,
      u.username,
      m.content,
      m.created_at
    FROM messages m
    JOIN channels c ON m.channel_id = c.channel_id
    JOIN users u ON m.author_id = u.author_id
    WHERE m.author_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `);
  return stmt.all(authorId, limit) as MessageRecord[];
}

/** Closes the database connection. */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================================================
// Cohort, Student, and Instructor Notes functions
// ============================================================================

/** A cohort record from the database. */
export interface CohortRecord {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  break_start: string | null;
  break_end: string | null;
  created_at: string;
}

/** Retrieves all cohorts from the database, ordered by name. */
export function getCohorts(): CohortRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT id, name, start_date, end_date, break_start, break_end, created_at FROM cohorts ORDER BY name ASC`);
  return stmt.all() as CohortRecord[];
}

/** Creates a new cohort and returns the created record. */
export function createCohort(name: string): CohortRecord {
  const db = getDatabase();
  const stmt = db.prepare(`INSERT INTO cohorts (name) VALUES (?)`);
  const result = stmt.run(name);
  return {
    id: result.lastInsertRowid as number,
    name,
    start_date: null,
    end_date: null,
    break_start: null,
    break_end: null,
    created_at: new Date().toISOString(),
  };
}

/** A student record from the database with computed lastCheckIn. */
export interface StudentRecord {
  id: number;
  name: string;
  discord_user_id: string | null;
  discord_handle: string | null;
  cohort_id: number;
  status: "active" | "inactive" | "graduated" | "withdrawn";
  current_internship: string | null;
  observer_id: number | null;
  last_check_in: string | null;
  created_at: string;
  updated_at: string;
}

/** Retrieves students for a given cohort, with computed lastCheckIn from instructor notes. */
export function getStudentsByCohort(cohortId: number): StudentRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.discord_user_id,
      u.username as discord_handle,
      s.cohort_id,
      s.status,
      s.current_internship,
      s.observer_id,
      MAX(n.created_at) as last_check_in,
      s.created_at,
      s.updated_at
    FROM students s
    LEFT JOIN users u ON s.discord_user_id = u.author_id
    LEFT JOIN instructor_notes n ON s.id = n.student_id
    WHERE s.cohort_id = ?
    GROUP BY s.id
    ORDER BY s.name ASC
  `);
  return stmt.all(cohortId) as StudentRecord[];
}

/** Retrieves a single student by ID with computed lastCheckIn. */
export function getStudent(id: number): StudentRecord | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.discord_user_id,
      u.username as discord_handle,
      s.cohort_id,
      s.status,
      s.current_internship,
      s.observer_id,
      MAX(n.created_at) as last_check_in,
      s.created_at,
      s.updated_at
    FROM students s
    LEFT JOIN users u ON s.discord_user_id = u.author_id
    LEFT JOIN instructor_notes n ON s.id = n.student_id
    WHERE s.id = ?
    GROUP BY s.id
  `);
  return (stmt.get(id) as StudentRecord) || null;
}

/** Input for creating a new student. */
export interface CreateStudentInput {
  name: string;
  cohortId: number;
  discordUserId?: string;
  status?: "active" | "inactive" | "graduated" | "withdrawn";
  currentInternship?: string;
}

/** Creates a new student and returns the created record. */
export function createStudent(input: CreateStudentInput): StudentRecord {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO students (name, discord_user_id, cohort_id, status, current_internship)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.name,
    input.discordUserId ?? null,
    input.cohortId,
    input.status ?? "active",
    input.currentInternship ?? null
  );
  return getStudent(result.lastInsertRowid as number)!;
}

/** Input for updating a student. */
export interface UpdateStudentInput {
  name?: string;
  discordUserId?: string | null;
  cohortId?: number;
  status?: "active" | "inactive" | "graduated" | "withdrawn";
  currentInternship?: string | null;
  observerId?: number | null;
}

/** Updates a student and returns the updated record. */
export function updateStudent(id: number, input: UpdateStudentInput): StudentRecord | null {
  const db = getDatabase();
  const existing = getStudent(id);
  if (!existing) return null;

  const stmt = db.prepare(`
    UPDATE students SET
      name = ?,
      discord_user_id = ?,
      cohort_id = ?,
      status = ?,
      current_internship = ?,
      observer_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    input.name ?? existing.name,
    input.discordUserId !== undefined ? input.discordUserId : existing.discord_user_id,
    input.cohortId ?? existing.cohort_id,
    input.status ?? existing.status,
    input.currentInternship !== undefined ? input.currentInternship : existing.current_internship,
    input.observerId !== undefined ? input.observerId : existing.observer_id,
    id
  );
  return getStudent(id);
}

/** Deletes a student by ID. Returns true if deleted, false if not found. */
export function deleteStudent(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM students WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

/** Retrieves a student's profile image (base64 data URL). */
export function getStudentImage(id: number): string | null {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT profile_image FROM students WHERE id = ?`);
  const result = stmt.get(id) as { profile_image: string | null } | undefined;
  return result?.profile_image ?? null;
}

/** Updates a student's profile image. Returns true if the student exists. */
export function updateStudentImage(id: number, base64Data: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`UPDATE students SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  const result = stmt.run(base64Data, id);
  return result.changes > 0;
}

/** Removes a student's profile image. Returns true if the student exists. */
export function deleteStudentImage(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`UPDATE students SET profile_image = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

/** An instructor note record from the database. */
export interface InstructorNoteRecord {
  id: number;
  student_id: number;
  author: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

/** Creates an instructor note for a student. If createdAt is provided, uses that timestamp instead of auto-generating. */
export function createInstructorNote(
  studentId: number,
  author: string,
  content: string,
  createdAt?: string
): InstructorNoteRecord {
  const db = getDatabase();
  if (createdAt) {
    const stmt = db.prepare(`
      INSERT INTO instructor_notes (student_id, author, content, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(studentId, author, content, createdAt);
    return {
      id: result.lastInsertRowid as number,
      student_id: studentId,
      author,
      content,
      created_at: createdAt,
      updated_at: null,
    };
  }
  const stmt = db.prepare(`
    INSERT INTO instructor_notes (student_id, author, content)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(studentId, author, content);
  return {
    id: result.lastInsertRowid as number,
    student_id: studentId,
    author,
    content,
    created_at: new Date().toISOString(),
    updated_at: null,
  };
}

/** Deletes an instructor note by ID. Returns true if deleted, false if not found. */
export function deleteInstructorNote(noteId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM instructor_notes WHERE id = ?`);
  const result = stmt.run(noteId);
  return result.changes > 0;
}

/** Updates an instructor note's content and/or timestamp. Sets updated_at to current time. */
export function updateInstructorNote(
  noteId: number,
  updates: { content?: string; createdAt?: string }
): InstructorNoteRecord | null {
  const db = getDatabase();
  const existing = db.prepare(`SELECT * FROM instructor_notes WHERE id = ?`).get(noteId) as InstructorNoteRecord | undefined;
  if (!existing) return null;

  const stmt = db.prepare(`
    UPDATE instructor_notes SET
      content = ?,
      created_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    updates.content ?? existing.content,
    updates.createdAt ?? existing.created_at,
    noteId
  );

  return db.prepare(`SELECT * FROM instructor_notes WHERE id = ?`).get(noteId) as InstructorNoteRecord;
}

/** A feed item that can be either an EOD message or an instructor note. */
export interface FeedItem {
  type: "eod" | "note";
  id: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * Gets an interleaved feed of EOD messages and instructor notes for a student.
 * EOD messages are pulled from the messages table if the student has a discord_user_id.
 * Results are sorted by created_at DESC.
 */
export function getStudentFeed(studentId: number, limit: number = 50): FeedItem[] {
  const db = getDatabase();
  const student = getStudent(studentId);
  if (!student) return [];

  // Get instructor notes
  const notesStmt = db.prepare(`
    SELECT
      'note' as type,
      'note_' || id as id,
      content,
      author,
      created_at,
      updated_at
    FROM instructor_notes
    WHERE student_id = ?
  `);
  const notes = notesStmt.all(studentId) as FeedItem[];

  // Get EOD messages if student is linked to a Discord user
  // Excludes messages from the #attendance channel
  let messages: FeedItem[] = [];
  if (student.discord_user_id) {
    const messagesStmt = db.prepare(`
      SELECT
        'eod' as type,
        'eod_' || m.discord_message_id as id,
        m.content,
        u.username as author,
        m.created_at,
        NULL as updated_at
      FROM messages m
      JOIN users u ON m.author_id = u.author_id
      JOIN channels c ON m.channel_id = c.channel_id
      WHERE m.author_id = ?
        AND c.channel_name != 'attendance'
    `);
    messages = messagesStmt.all(student.discord_user_id) as FeedItem[];
  }

  // Combine and sort by created_at DESC
  const combined = [...notes, ...messages];
  combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return combined.slice(0, limit);
}

// ============================================================================
// Daily Briefing queries
// ============================================================================

/** A message record with timestamp for daily briefing. */
export interface BriefingMessageRecord {
  author_id: string;
  content: string;
  created_at: string;
}

/**
 * Gets messages from a specific channel for a specific date range.
 * @param channelName - The channel name to query (e.g., "attendance", "eod")
 * @param startDate - Start of the date range (inclusive)
 * @param endDate - End of the date range (exclusive)
 */
export function getMessagesByChannelAndDateRange(
  channelName: string,
  startDate: string,
  endDate: string
): BriefingMessageRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT m.author_id, m.content, m.created_at
    FROM messages m
    JOIN channels c ON m.channel_id = c.channel_id
    WHERE c.channel_name = ?
      AND m.created_at >= ?
      AND m.created_at < ?
    ORDER BY m.created_at ASC
  `);
  return stmt.all(channelName, startDate, endDate) as BriefingMessageRecord[];
}

/**
 * Gets all students in a cohort with their last check-in time, sorted by last check-in (oldest first).
 * Students with no check-ins appear first (NULL sorts first).
 */
export function getStudentsByLastCheckIn(cohortId: number): StudentRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.discord_user_id,
      u.username as discord_handle,
      s.cohort_id,
      s.status,
      s.current_internship,
      s.observer_id,
      MAX(n.created_at) as last_check_in,
      s.created_at,
      s.updated_at
    FROM students s
    LEFT JOIN users u ON s.discord_user_id = u.author_id
    LEFT JOIN instructor_notes n ON s.id = n.student_id
    WHERE s.cohort_id = ?
    GROUP BY s.id
    ORDER BY last_check_in ASC NULLS FIRST
  `);
  return stmt.all(cohortId) as StudentRecord[];
}

/**
 * Gets all active students in a cohort that have a linked Discord user ID.
 */
export function getActiveStudentsWithDiscord(cohortId: number): StudentRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.discord_user_id,
      u.username as discord_handle,
      s.cohort_id,
      s.status,
      s.current_internship,
      s.observer_id,
      MAX(n.created_at) as last_check_in,
      s.created_at,
      s.updated_at
    FROM students s
    LEFT JOIN users u ON s.discord_user_id = u.author_id
    LEFT JOIN instructor_notes n ON s.id = n.student_id
    WHERE s.cohort_id = ? AND s.status = 'active' AND s.discord_user_id IS NOT NULL
    GROUP BY s.id
    ORDER BY s.name ASC
  `);
  return stmt.all(cohortId) as StudentRecord[];
}

/** The database ID of the current active cohort. */
const CURRENT_COHORT_DATABASE_ID: number | null = 2;

/**
 * Gets the current cohort ID for the daily briefing.
 * Uses CURRENT_COHORT_DATABASE_ID, falling back to the first cohort in the database.
 */
export function getDefaultCohortId(): number | null {
  if (CURRENT_COHORT_DATABASE_ID != null) {
    return CURRENT_COHORT_DATABASE_ID;
  }

  // Fallback: return the first cohort
  const db = getDatabase();
  const stmt = db.prepare(`SELECT id FROM cohorts ORDER BY id ASC LIMIT 1`);
  const result = stmt.get() as { id: number } | undefined;
  return result?.id ?? null;
}

// ============================================================================
// LLM Summary/Sentiment Cache functions
// ============================================================================

/**
 * Gets a cached student summary for a specific date.
 * @param studentId - The student ID.
 * @param date - The date in YYYY-MM-DD format.
 * @returns The cached summary or null if not found.
 */
export function getStudentSummary(studentId: number, date: string): { summary: string; createdAt: string } | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT summary, created_at
    FROM student_summaries
    WHERE student_id = ? AND date = ?
  `);
  const result = stmt.get(studentId, date) as { summary: string; created_at: string } | undefined;
  return result ? { summary: result.summary, createdAt: result.created_at } : null;
}

/**
 * Saves a student summary for a specific date.
 * @param studentId - The student ID.
 * @param date - The date in YYYY-MM-DD format.
 * @param summary - The generated summary text.
 */
export function saveStudentSummary(studentId: number, date: string, summary: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO student_summaries (student_id, date, summary)
    VALUES (?, ?, ?)
    ON CONFLICT(student_id, date) DO UPDATE SET
      summary = excluded.summary,
      created_at = CURRENT_TIMESTAMP
  `);
  stmt.run(studentId, date, summary);
}

/**
 * Gets a cached cohort sentiment for a specific date.
 * @param cohortId - The cohort ID.
 * @param date - The date in YYYY-MM-DD format.
 * @returns The cached sentiment or null if not found.
 */
export function getCohortSentiment(cohortId: number, date: string): { sentiment: string; createdAt: string } | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT sentiment, created_at
    FROM cohort_sentiments
    WHERE cohort_id = ? AND date = ?
  `);
  const result = stmt.get(cohortId, date) as { sentiment: string; created_at: string } | undefined;
  return result ? { sentiment: result.sentiment, createdAt: result.created_at } : null;
}

/**
 * Saves a cohort sentiment for a specific date.
 * @param cohortId - The cohort ID.
 * @param date - The date in YYYY-MM-DD format.
 * @param sentiment - The generated sentiment text.
 */
export function saveCohortSentiment(cohortId: number, date: string, sentiment: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO cohort_sentiments (cohort_id, date, sentiment)
    VALUES (?, ?, ?)
    ON CONFLICT(cohort_id, date) DO UPDATE SET
      sentiment = excluded.sentiment,
      created_at = CURRENT_TIMESTAMP
  `);
  stmt.run(cohortId, date, sentiment);
}

// ============================================================================
// Feature Request functions
// ============================================================================

/** A feature request record from the database. */
export interface FeatureRequestRecord {
  id: number;
  title: string;
  description: string;
  priority: number;
  author: string;
  status: "new" | "in_progress" | "done";
  created_at: string;
}

/** Retrieves all feature requests, ordered by newest first. */
export function getFeatureRequests(): FeatureRequestRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT * FROM feature_requests ORDER BY created_at DESC`);
  return stmt.all() as FeatureRequestRecord[];
}

/** Retrieves a single feature request by ID. */
export function getFeatureRequest(id: number): FeatureRequestRecord | null {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT * FROM feature_requests WHERE id = ?`);
  return (stmt.get(id) as FeatureRequestRecord) || null;
}

/** Input for creating a new feature request. */
export interface CreateFeatureRequestInput {
  title: string;
  description: string;
  priority?: number;
  author: string;
}

/** Creates a new feature request and returns the created record. */
export function createFeatureRequest(input: CreateFeatureRequestInput): FeatureRequestRecord {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO feature_requests (title, description, priority, author)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(input.title, input.description, input.priority ?? 0, input.author);
  return getFeatureRequest(result.lastInsertRowid as number)!;
}

/** Input for updating a feature request. */
export interface UpdateFeatureRequestInput {
  title?: string;
  description?: string;
  priority?: number;
  status?: "new" | "in_progress" | "done";
}

/** Updates a feature request and returns the updated record. */
export function updateFeatureRequest(id: number, input: UpdateFeatureRequestInput): FeatureRequestRecord | null {
  const db = getDatabase();
  const existing = getFeatureRequest(id);
  if (!existing) return null;

  const stmt = db.prepare(`
    UPDATE feature_requests SET
      title = ?,
      description = ?,
      priority = ?,
      status = ?
    WHERE id = ?
  `);
  stmt.run(
    input.title ?? existing.title,
    input.description ?? existing.description,
    input.priority ?? existing.priority,
    input.status ?? existing.status,
    id
  );
  return getFeatureRequest(id);
}

/** Deletes a feature request by ID. Returns true if deleted, false if not found. */
export function deleteFeatureRequest(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM feature_requests WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============================================================================
// Feature Flags functions
// ============================================================================

/** A feature flag record from the database. */
export interface FeatureFlagRecord {
  key: string;
  enabled: boolean;
  description: string;
  updated_at: string;
}

/** Retrieves all feature flags. */
export function getFeatureFlags(): FeatureFlagRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT key, enabled, description, updated_at FROM feature_flags ORDER BY key ASC`);
  const rows = stmt.all() as Array<{ key: string; enabled: number; description: string; updated_at: string }>;
  return rows.map((r) => ({ ...r, enabled: r.enabled === 1 }));
}

/** Checks whether a specific feature flag is enabled. */
export function isFeatureFlagEnabled(key: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT enabled FROM feature_flags WHERE key = ?`);
  const row = stmt.get(key) as { enabled: number } | undefined;
  return row?.enabled === 1;
}

/** Updates a feature flag's enabled state. Returns the updated record or null if not found. */
export function updateFeatureFlag(key: string, enabled: boolean): FeatureFlagRecord | null {
  const db = getDatabase();
  const stmt = db.prepare(`UPDATE feature_flags SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`);
  const result = stmt.run(enabled ? 1 : 0, key);
  if (result.changes === 0) return null;
  const row = db.prepare(`SELECT key, enabled, description, updated_at FROM feature_flags WHERE key = ?`).get(key) as
    | { key: string; enabled: number; description: string; updated_at: string }
    | undefined;
  if (!row) return null;
  return { ...row, enabled: row.enabled === 1 };
}

// ============================================================================
// Observer functions
// ============================================================================

/** An observer record from the database. */
export interface ObserverRecord {
  id: number;
  discord_user_id: string;
  display_name: string | null;
  username: string;
  created_at: string;
  updated_at: string;
}

/** Retrieves all observers, ordered by display name. */
export function getObservers(): ObserverRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, discord_user_id, display_name, username, created_at, updated_at
    FROM observers
    ORDER BY COALESCE(display_name, username) COLLATE NOCASE ASC
  `);
  return stmt.all() as ObserverRecord[];
}

/** Retrieves a single observer by ID. */
export function getObserver(id: number): ObserverRecord | null {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT * FROM observers WHERE id = ?`);
  return (stmt.get(id) as ObserverRecord) || null;
}

/** Upserts an observer by Discord user ID. Returns the observer record. */
export function upsertObserver(
  discordUserId: string,
  displayName: string | null,
  username: string
): ObserverRecord {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO observers (discord_user_id, display_name, username, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(discord_user_id) DO UPDATE SET
      display_name = COALESCE(excluded.display_name, display_name),
      username = excluded.username,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(discordUserId, displayName, username);

  const row = db.prepare(`SELECT * FROM observers WHERE discord_user_id = ?`).get(discordUserId);
  return row as ObserverRecord;
}
