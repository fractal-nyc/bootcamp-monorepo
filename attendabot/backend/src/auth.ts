/**
 * @fileoverview BetterAuth configuration for Discord OAuth login.
 * Runs alongside the existing JWT-based auth system.
 */

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/** Returns the BetterAuth database instance and ensures auth tables exist. */
function getAuthDatabase(): Database.Database {
  const dbDir = path.join(__dirname, "../db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, "attendabot.db");
  const db = new Database(dbPath);

  // Create BetterAuth tables if they don't exist
  db.exec(`
    create table if not exists "user" (
      "id" text not null primary key,
      "name" text not null,
      "email" text not null unique,
      "emailVerified" integer not null,
      "image" text,
      "createdAt" date not null,
      "updatedAt" date not null
    );

    create table if not exists "session" (
      "id" text not null primary key,
      "expiresAt" date not null,
      "token" text not null unique,
      "createdAt" date not null,
      "updatedAt" date not null,
      "ipAddress" text,
      "userAgent" text,
      "userId" text not null references "user" ("id") on delete cascade
    );

    create table if not exists "account" (
      "id" text not null primary key,
      "accountId" text not null,
      "providerId" text not null,
      "userId" text not null references "user" ("id") on delete cascade,
      "accessToken" text,
      "refreshToken" text,
      "idToken" text,
      "accessTokenExpiresAt" date,
      "refreshTokenExpiresAt" date,
      "scope" text,
      "password" text,
      "createdAt" date not null,
      "updatedAt" date not null
    );

    create table if not exists "verification" (
      "id" text not null primary key,
      "identifier" text not null,
      "value" text not null,
      "expiresAt" date not null,
      "createdAt" date not null,
      "updatedAt" date not null
    );
  `);

  // Create indexes if they don't exist
  db.exec(`
    create index if not exists "session_userId_idx" on "session" ("userId");
    create index if not exists "account_userId_idx" on "account" ("userId");
    create index if not exists "verification_identifier_idx" on "verification" ("identifier");
  `);

  return db;
}

export const auth = betterAuth({
  database: getAuthDatabase(),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  basePath: "/api/auth/better",
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [
    "http://localhost:5173",
    process.env.BETTER_AUTH_URL || "http://localhost:3001",
  ],
});
