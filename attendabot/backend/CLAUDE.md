# Backend

Express API server + Discord bot + SQLite database.

## Commands

```bash
bun run dev          # Start dev server with ts-node (port 3001)
bun run build        # Compile TypeScript to dist/
bun run start        # Run compiled JS (production)
bun run test             # Run all tests
bun run test <path>      # Run specific test file
```

## Directory Structure

```
src/
├── index.ts              # Entry point - initializes Discord client, bot, API
├── api/
│   ├── index.ts          # Express app setup, route mounting, static serving
│   ├── websocket.ts      # WebSocket server for real-time log streaming
│   ├── middleware/
│   │   ├── auth.ts       # BetterAuth session middleware (authenticateToken)
│   │   └── cache.ts      # Response caching middleware
│   └── routes/
│       ├── students.ts   # CRUD for students, cohorts, notes
│       ├── messages.ts   # GET messages with filters
│       ├── channels.ts   # GET channels
│       ├── users.ts      # GET users
│       ├── observers.ts  # GET/sync observers from Discord @instructors role
│       ├── featureRequests.ts  # CRUD for feature requests
│       ├── featureFlags.ts     # GET/PUT feature flags
│       ├── llm.ts        # AI summaries and sentiment
│       ├── status.ts     # Health check, stats
│       └── testing.ts    # Test utilities (dev only)
├── bot/
│   ├── index.ts          # Cron job scheduler (7 jobs)
│   ├── constants.ts      # Channel IDs, user maps, cron expressions
│   └── curriculum.ts     # Daily assignment lookup from JSON
└── services/
    ├── db.ts             # SQLite database (better-sqlite3)
    ├── discord.ts        # Discord.js client wrapper
    ├── llm.ts            # Gemini API integration
    ├── stats.ts          # Metrics tracking
    └── logger.ts         # Structured logging with WebSocket broadcast
```

## API Routes

All routes prefixed with `/api/`. Auth required (BetterAuth session cookie) unless noted.

BetterAuth OAuth routes are mounted at `/api/auth/better/*` (handled by BetterAuth directly, not Express routes).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List all students |
| GET | `/students/:id` | Get student by ID |
| POST | `/students` | Create student |
| PUT | `/students/:id` | Update student (includes observerId) |
| DELETE | `/students/:id` | Delete student |
| GET | `/students/:id/feed` | Get interleaved EOD + notes feed |
| POST | `/students/:id/notes` | Add note to student |
| DELETE | `/students/:id/notes/:noteId` | Delete instructor note |
| GET | `/cohorts` | List cohorts |
| POST | `/cohorts` | Create cohort |
| GET | `/observers` | List observers (instructors) |
| POST | `/observers/sync` | Sync observers from Discord @instructors role |
| GET | `/feature-requests` | List feature requests |
| POST | `/feature-requests` | Create feature request |
| PUT | `/feature-requests/:id` | Update feature request |
| DELETE | `/feature-requests/:id` | Delete feature request |
| GET | `/feature-flags` | List feature flags |
| PUT | `/feature-flags/:key` | Toggle feature flag |
| GET | `/messages` | Query messages (filters: channel, author, date range) |
| GET | `/channels` | List Discord channels |
| GET | `/users` | List Discord users |
| GET | `/llm/student/:id/summary/:date` | Generate AI summary for student |
| GET | `/status` | Health check + stats |

## Database Schema

```sql
-- Core Discord data
channels (channel_id PK, channel_name, updated_at)
users (author_id PK, display_name, username, updated_at)
messages (id PK, discord_message_id UNIQUE, channel_id FK, author_id FK, content, created_at)

-- Bot tracking
activity_log (id PK, event_type, details, created_at)

-- Student management
cohorts (id PK, name UNIQUE, created_at)
students (id PK, name, discord_user_id FK?, cohort_id FK, status, current_internship, observer_id FK?, timestamps)
instructor_notes (id PK, student_id FK CASCADE, author, content, created_at)
observers (id PK, discord_user_id UNIQUE, display_name, username, timestamps)

-- Feature management
feature_requests (id PK, title, description, priority, author, status, created_at)
feature_flags (key PK, enabled, description, updated_at)

-- AI caching
student_summaries (id PK, student_id FK CASCADE, date, summary, UNIQUE(student_id, date))
cohort_sentiments (id PK, cohort_id FK CASCADE, date, sentiment, UNIQUE(cohort_id, date))
```

## Bot Constants (bot/constants.ts)

**IMPORTANT**: Update these when changing cohorts:

```typescript
USER_ID_TO_NAME_MAP       // Map<discord_id, name> for current cohort
CURRENT_COHORT_ROLE_ID    // Discord role ID to mention
ATTENDANCE_CHANNEL_ID     // Where attendance is posted
EOD_CHANNEL_ID            // Where EOD updates are posted
DAILY_BRIEFING_CHANNEL_ID // Where daily briefings go (instructors)
INSTRUCTORS_ROLE_ID       // Discord @instructors role ID for observer sync
```

## Authentication

Authentication uses **BetterAuth** with Discord OAuth. There is no JWT or password-based login.

- **Middleware**: `authenticateToken` in `api/middleware/auth.ts` verifies BetterAuth session cookies
- **WebSocket**: `websocket.ts` verifies session cookies on the upgrade request via `auth.api.getSession()`
- **BetterAuth routes**: Mounted at `/api/auth/better/*` in `api/index.ts` via `toNodeHandler(auth)`

## Adding a New API Route

1. Create file in `src/api/routes/yourRoute.ts`:
   ```typescript
   import { Router } from "express";
   import { authenticateToken } from "../middleware/auth";

   export const yourRouter = Router();

   yourRouter.get("/", authenticateToken, (req, res) => {
     res.json({ data: "example" });
   });
   ```

2. Mount in `src/api/index.ts`:
   ```typescript
   import { yourRouter } from "./routes/yourRoute";
   app.use("/api/your-route", yourRouter);
   ```

## Adding a New Cron Job

1. Add cron expression to `bot/constants.ts`
2. Create handler function in `bot/index.ts`
3. Add to `scheduleJobs()` using `scheduleTask()`

## Testing

- **Location**: `src/test/`
- **Framework**: Vitest (always run via `bun run test`, never `bun test`)
- **DB Strategy**: In-memory SQLite via `testUtils.ts` using `better-sqlite3` (same as production)
- **Mocking**: Use `vi.mock()` for Discord/LLM services
- Test files are excluded from `tsconfig.json` to prevent stale compiled JS in `dist/`

```typescript
import { createTestDatabase, fixtures } from "../utils/testUtils";

describe("MyService", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
    // Insert test data using fixtures
  });
});
```

## Build

- `bun run build` runs `tsc` (TypeScript compiler) to emit CommonJS JS into `dist/`
- Do NOT use `bun build` — it's a bundler that would break `__dirname` paths, `better-sqlite3` native module, and frontend static serving
- Production runs on Node.js (`node dist/index.js` via PM2), not Bun
- `src/test/**/*` is excluded from tsconfig to keep test files out of `dist/`

## Gotchas

- Database singleton in `services/db.ts` - tests must use `createTestDatabase()` for isolation
- `discord.ts` exports a lazy-initialized client - don't import at module level in tests
- LLM calls are rate-limited by Gemini - summaries/sentiments are cached in DB by date
- WebSocket broadcasts all log messages - useful for admin panel real-time logs
- `bun run test` and `bun test` are different: the former runs vitest (correct), the latter runs Bun's built-in test runner (lacks `vi.mock`/`vi.mocked` support, different native module ABI)
- Three `__dirname`-relative paths exist in source: `.env` loading (`src/index.ts`), database location (`src/services/db.ts`), frontend static serving (`src/api/index.ts`). These depend on `tsc`'s directory-preserving output.
