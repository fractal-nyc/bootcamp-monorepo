import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(__dirname, "../../db/attendabot.db");
    db = new Database(dbPath);
    initializeTables();
  }
  return db;
}

function initializeTables(): void {
  if (!db) return;

  // Messages log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_message_id TEXT UNIQUE,
      channel_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT,
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
  author_id: string;
  author_name: string | null;
  content: string | null;
  created_at: string;
}

export function logMessage(message: MessageRecord): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO messages (discord_message_id, channel_id, author_id, author_name, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    message.discord_message_id,
    message.channel_id,
    message.author_id,
    message.author_name,
    message.content,
    message.created_at
  );
}

export function getRecentMessages(channelId: string, limit: number = 50): MessageRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT discord_message_id, channel_id, author_id, author_name, content, created_at
    FROM messages
    WHERE channel_id = ?
    ORDER BY created_at DESC
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

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
