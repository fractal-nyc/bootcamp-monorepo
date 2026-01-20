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

  // Seed default cohorts if they don't exist
  seedDefaultCohorts();

  console.log("Database tables initialized");
}

/** Seeds default cohorts (Fa2025, Sp2026) if they don't already exist. */
function seedDefaultCohorts(): void {
  if (!db) return;
  const stmt = db.prepare(`INSERT OR IGNORE INTO cohorts (name) VALUES (?)`);
  stmt.run("Fa2025");
  stmt.run("Sp2026");
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
    INSERT OR IGNORE INTO messages (discord_message_id, channel_id, author_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
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
  created_at: string;
}

/** Retrieves all cohorts from the database, ordered by name. */
export function getCohorts(): CohortRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT id, name, created_at FROM cohorts ORDER BY name ASC`);
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
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    input.name ?? existing.name,
    input.discordUserId !== undefined ? input.discordUserId : existing.discord_user_id,
    input.cohortId ?? existing.cohort_id,
    input.status ?? existing.status,
    input.currentInternship !== undefined ? input.currentInternship : existing.current_internship,
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

/** An instructor note record from the database. */
export interface InstructorNoteRecord {
  id: number;
  student_id: number;
  author: string;
  content: string;
  created_at: string;
}

/** Creates an instructor note for a student. */
export function createInstructorNote(
  studentId: number,
  author: string,
  content: string
): InstructorNoteRecord {
  const db = getDatabase();
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
  };
}

/** A feed item that can be either an EOD message or an instructor note. */
export interface FeedItem {
  type: "eod" | "note";
  id: string;
  content: string;
  author: string;
  created_at: string;
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
      created_at
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
        m.created_at
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
