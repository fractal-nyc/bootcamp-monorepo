/**
 * @fileoverview BetterAuth configuration for Discord OAuth login.
 * Runs alongside the existing JWT-based auth system.
 */

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/** Parses the DISCORD_ALLOWED_USER_IDS env var into a Set of allowed Discord user IDs. */
function getAllowedDiscordUserIds(): Set<string> {
  const raw = process.env.DISCORD_ALLOWED_USER_IDS || "";
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

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
    "http://localhost:3001",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  databaseHooks: {
    account: {
      create: {
        before: async (account) => {
          if (account.providerId === "discord") {
            const allowed = getAllowedDiscordUserIds();
            if (allowed.size > 0 && !allowed.has(account.accountId)) {
              throw new APIError("FORBIDDEN", {
                message:
                  "Your Discord account is not authorized to access this application.",
              });
            }
          }
          return { data: account };
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Check if this user's Discord account is on the allowlist
          const allowed = getAllowedDiscordUserIds();
          if (allowed.size === 0) return { data: session };

          const db = getAuthDatabase();
          const account = db
            .prepare(
              `SELECT "accountId" FROM "account" WHERE "userId" = ? AND "providerId" = 'discord'`,
            )
            .get(session.userId) as { accountId: string } | undefined;

          if (account && !allowed.has(account.accountId)) {
            throw new APIError("FORBIDDEN", {
              message:
                "Your Discord account is not authorized to access this application.",
            });
          }
          return { data: session };
        },
      },
    },
  },
});
