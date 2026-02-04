/**
 * @fileoverview Routes for browsing SQLite database tables and downloading the DB file.
 */

import { Router, Response } from "express";
import path from "path";
import { getDatabase } from "../../services/db";
import { AuthRequest, authenticateToken } from "../middleware/auth";

/** Router for database inspection endpoints. */
export const databaseRouter = Router();

/** GET / — list all user-defined tables. */
databaseRouter.get("/tables", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[];
    res.json({ tables: tables.map((t) => t.name) });
  } catch (err) {
    console.error("Failed to list tables:", err);
    res.status(500).json({ error: "Failed to list tables" });
  }
});

/** GET /tables/:name — returns column info and rows (with optional limit/offset). */
databaseRouter.get("/tables/:name", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const tableName = req.params.name;

    // Validate table name exists to prevent SQL injection
    const exists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(tableName) as { name: string } | undefined;

    if (!exists) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    // Get column info
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all() as {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }[];

    // Get total row count
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as { count: number };

    // Get rows
    const rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`).all(limit, offset);

    res.json({
      table: tableName,
      columns: columns.map((c) => ({ name: c.name, type: c.type, pk: c.pk === 1 })),
      rows,
      totalRows: countRow.count,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Failed to query table:", err);
    res.status(500).json({ error: "Failed to query table" });
  }
});

/** GET /download — download the raw SQLite file. */
databaseRouter.get("/download", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const dbPath = path.join(__dirname, "../../../db/attendabot.db");
    res.download(dbPath, "attendabot.db");
  } catch (err) {
    console.error("Failed to download database:", err);
    res.status(500).json({ error: "Failed to download database" });
  }
});
