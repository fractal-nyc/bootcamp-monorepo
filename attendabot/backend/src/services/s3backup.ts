/**
 * @fileoverview Service for backing up the SQLite database to S3.
 * Used by the nightly backup cron job.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(__dirname, "../../db/attendabot.db");

/** Uploads the SQLite database to S3 with a date-stamped key. */
export async function backupDatabaseToS3(): Promise<void> {
  const bucket = process.env.S3_BACKUP_BUCKET;
  if (!bucket) {
    console.warn("S3_BACKUP_BUCKET not set — skipping database backup");
    return;
  }

  const region = process.env.AWS_REGION || "us-east-1";
  const client = new S3Client({ region });

  // Copy the DB to a temp file to avoid reading while SQLite may be writing
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const tmpPath = `${DB_PATH}.backup-${timestamp}`;

  try {
    fs.copyFileSync(DB_PATH, tmpPath);

    const key = `backups/attendabot-${timestamp}.db`;
    const body = fs.readFileSync(tmpPath);
    const sizeMB = (body.length / (1024 * 1024)).toFixed(2);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "application/x-sqlite3",
      }),
    );

    console.log(`Database backed up to s3://${bucket}/${key} (${sizeMB} MB)`);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }
}
