# Attendabot

Discord bot for bootcamp attendance/EOD tracking with React admin dashboard.

## Commands

```bash
# Development (run in separate terminals)
cd backend && bun run dev      # API server (port 3001)
cd frontend && bun run dev     # Vite dev server (port 5173)

# Testing
cd backend && bun test         # Run all 148 tests
cd backend && bun test src/test/services/db.test.ts  # Single file

# Production
./update-bot.sh                # Deploy to EC2 (pulls, builds, restarts pm2)
```

## Architecture

```
Browser (localhost:5173)
    │
    ├─ REST API ──→ Express (:3001) ──→ SQLite (backend/db/attendabot.db)
    │                    │
    └─ WebSocket ────────┴──→ Real-time logs

Discord Bot (cron jobs)
    │
    ├─ Discord.js ──→ Discord API (reminders, verifications, DMs)
    │
    └─ Gemini API ──→ Cohort sentiment analysis
```

## Directory Structure

| Directory                  | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `backend/src/api/`         | Express routes, middleware, WebSocket       |
| `backend/src/bot/`         | Cron scheduler, curriculum, constants       |
| `backend/src/services/`    | Core logic: db, discord, llm, stats, logger |
| `backend/src/test/`        | Vitest test suite                           |
| `frontend/src/components/` | React UI components                         |
| `frontend/src/api/`        | API client with JWT handling                |
| `frontend/src/hooks/`      | Custom hooks (useWebSocket)                 |

## Database Tables

| Table               | Purpose                                 |
| ------------------- | --------------------------------------- |
| `channels`          | Discord channel metadata                |
| `users`             | Discord user profiles                   |
| `messages`          | Logged Discord messages                 |
| `activity_log`      | Bot activity events                     |
| `cohorts`           | Student cohorts (Fa2025, Sp2026)        |
| `students`          | Student records linked to cohorts/users |
| `instructor_notes`  | Per-student notes (CASCADE on delete)   |
| `student_summaries` | Cached AI summaries by date             |
| `cohort_sentiments` | Cached cohort sentiment by date         |

## Environment Variables

```bash
DISCORD_TOKEN=         # Discord bot token
JWT_SECRET=            # Secret for admin panel JWT
ADMIN_PASSWORD=        # Admin login password
GEMINI_API_KEY=        # Google Gemini API (optional, for AI features)
CURRENT_COHORT_ID=     # Active cohort for daily briefings
EC2_HOST=              # Production server IP
```

## Bot Cron Schedule (America/New_York)

| Time     | Job                                            |
| -------- | ---------------------------------------------- |
| 8:00 AM  | Daily briefing to instructors                  |
| 9:45 AM  | Attendance reminder                            |
| 10:00 AM | Attendance verification (DMs late users)       |
| 12:45 PM | Midday PR reminder                             |
| 1:00 PM  | Midday PR verification                         |
| 5:00 PM  | EOD reminder + tomorrow's assignment (Mon-Sat) |
| 11:59 PM | EOD verification + PR leaderboard              |

## Testing

- **Framework**: Vitest with in-memory SQLite
- **Location**: `backend/src/test/`
- **Utilities**: `test/utils/testUtils.ts` - fixtures, db factory
- **Pattern**: Direct DB testing, mocked external services

When adding new features or changing existing behavior, add appropriate tests where needed.

## Workflow

Before starting non-trivial changes, enter plan mode and ask the user clarifying questions about requirements, edge cases, and preferred approach. Get explicit confirmation on the plan before writing any code.

After finishing work, run `bun run build` in the `frontend` and `backend` directories to make sure everything builds with no errors. Run `bun test` in the `backend` directory to make sure all tests pass.

## Style Guide

- Use `bun` instead of `npm` or `npx`.
- Follow [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- Add JSDoc comments to exported functions
- Use descriptive variable names

## Gotchas

- **IMPORTANT**: The bot uses `USER_ID_TO_NAME_MAP` in `bot/constants.ts` to track current cohort members. Update this when cohort changes.
- Frontend dev server proxies `/api/*` to backend - no CORS issues in dev
- Database file is at `backend/db/attendabot.db` - not in src/
- Cron jobs only run if `CURRENT_COHORT_ROLE_ID` is set in constants
