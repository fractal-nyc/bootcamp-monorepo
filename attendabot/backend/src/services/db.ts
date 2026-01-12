import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

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

export function upsertUser(authorId: string, displayName: string | null, username: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (author_id, display_name, username, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(author_id) DO UPDATE SET
      display_name = excluded.display_name,
      username = excluded.username,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(authorId, displayName, username);
}

export function getMessageCount(): number {
  const db = getDatabase();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM messages");
  const result = stmt.get() as { count: number };
  return result.count;
}

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

export function logActivity(eventType: string, details?: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO activity_log (event_type, details)
    VALUES (?, ?)
  `);
  stmt.run(eventType, details ?? null);
}

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

export interface UserRecord {
  author_id: string;
  display_name: string | null;
  username: string;
}

export function getAllUsers(): UserRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT author_id, display_name, username
    FROM users
    ORDER BY username ASC
  `);
  return stmt.all() as UserRecord[];
}

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

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
