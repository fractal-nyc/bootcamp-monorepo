# Backend

Express API server + Discord bot + SQLite database.

## Commands

```bash
bun run dev          # Start dev server with ts-node (port 3001)
bun run build        # Compile TypeScript to dist/
bun run start        # Run compiled JS (production)
bun test             # Run all tests
bun test <path>      # Run specific test file
```

## Directory Structure

```
src/
├── index.ts              # Entry point - initializes Discord client, bot, API
├── api/
│   ├── index.ts          # Express app setup, route mounting, static serving
│   ├── websocket.ts      # WebSocket server for real-time log streaming
│   ├── middleware/
│   │   ├── auth.ts       # JWT authentication (generateToken, verifyCredentials, authenticateToken)
│   │   └── cache.ts      # Response caching middleware
│   └── routes/
│       ├── auth.ts       # POST /login
│       ├── students.ts   # CRUD for students, cohorts, notes
│       ├── messages.ts   # GET messages with filters
│       ├── channels.ts   # GET channels
│       ├── users.ts      # GET users
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

All routes prefixed with `/api/`. Auth required unless noted.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login (no auth required) |
| GET | `/students` | List all students |
| GET | `/students/:id` | Get student by ID |
| POST | `/students` | Create student |
| PUT | `/students/:id` | Update student |
| DELETE | `/students/:id` | Delete student |
| GET | `/students/:id/notes` | Get student notes |
| POST | `/students/:id/notes` | Add note to student |
| GET | `/cohorts` | List cohorts |
| POST | `/cohorts` | Create cohort |
| GET | `/messages` | Query messages (filters: channel, author, date range) |
| GET | `/channels` | List Discord channels |
| GET | `/users` | List Discord users |
| GET | `/llm/student/:id/summary` | Generate AI summary for student |
| GET | `/llm/cohort/:id/sentiment` | Get cohort sentiment analysis |
| GET | `/status` | Health check + stats |
| GET | `/status/stats` | Detailed statistics |

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
students (id PK, name, discord_user_id FK?, cohort_id FK, status, current_internship, timestamps)
instructor_notes (id PK, student_id FK CASCADE, author, content, created_at)

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
```

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
- **Framework**: Vitest
- **DB Strategy**: In-memory SQLite via `testUtils.ts`
- **Mocking**: Use `vi.mock()` for Discord/LLM services

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

## Gotchas

- Database singleton in `services/db.ts` - tests must use `createTestDatabase()` for isolation
- `discord.ts` exports a lazy-initialized client - don't import at module level in tests
- LLM calls are rate-limited by Gemini - summaries/sentiments are cached in DB by date
- WebSocket broadcasts all log messages - useful for admin panel real-time logs
