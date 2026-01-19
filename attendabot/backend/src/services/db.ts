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

  console.log("Database tables initialized");
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
