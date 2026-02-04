# Attendabot

Discord bot for bootcamp attendance/EOD tracking with React admin dashboard.

## Commands

```bash
# Development (run in separate terminals)
cd backend && bun run dev      # API server (port 3001)
cd frontend && bun run dev     # Vite dev server (port 5173)

# Testing
cd backend && bun run test         # Run all tests
cd backend && bun run test src/test/services/db.test.ts  # Single file

# Production
./update-bot.sh                # Deploy to EC2 via SSM (pulls, builds, restarts pm2)
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
| `frontend/src/api/`        | API client with cookie-based auth           |
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
| `observers`         | Instructors synced from Discord role     |
| `feature_requests`  | Feature requests with priority/status    |
| `feature_flags`     | Boolean feature toggles                 |

## Authentication

Authentication is handled entirely by **BetterAuth** with Discord OAuth. There is no JWT or password-based login. Session cookies are used for both REST API requests and WebSocket upgrade requests. The `authenticateToken` middleware in `api/middleware/auth.ts` verifies BetterAuth sessions.

## Environment Variables

```bash
DISCORD_TOKEN=         # Discord bot token
GEMINI_API_KEY=        # Google Gemini API (optional, for AI features)
BETTER_AUTH_SECRET=    # BetterAuth session signing secret
BETTER_AUTH_URL=       # Base URL for BetterAuth (e.g., https://attendabot.example.com)
DISCORD_CLIENT_ID=     # Discord OAuth app client ID
DISCORD_CLIENT_SECRET= # Discord OAuth app client secret
```

## Deployment

Deployment uses **AWS SSM Session Manager** (no SSH keys needed) and **AWS Secrets Manager** for environment variables.

### Manual deploy

```bash
./update-bot.sh
```

This sends an SSM command to the EC2 instance that pulls the latest code, fetches secrets from Secrets Manager, builds, and restarts PM2. Requires AWS CLI configured with deployer credentials (see below).

### CI/CD (automatic)

Pushing to `main` with changes in `attendabot/` triggers the GitHub Actions workflow (`.github/workflows/deploy-attendabot.yml`), which runs the same SSM deploy process using OIDC-based AWS authentication.

### Updating environment variables

Env vars live in AWS Secrets Manager under the secret `attendabot/env`. To update:

```bash
# View current values
aws secretsmanager get-secret-value --secret-id attendabot/env --query SecretString --output text | python3 -m json.tool
```

The `.env` file on the EC2 instance is regenerated from Secrets Manager on every deploy. Manual edits to the file on the instance will be overwritten.

### Onboarding a new developer

1. An admin creates an IAM user and adds them to the `attendabot-deployers` group
2. The dev installs [AWS CLI](https://aws.amazon.com/cli/) and runs `aws configure` with their credentials (region: `us-east-1`)
3. They can now run `./update-bot.sh` to deploy

See `_devlogs/private/aws-setup.md` for full IAM policy details and setup instructions.

## Bot Cron Schedule (America/New_York)

| Time     | Job                                            |
| -------- | ---------------------------------------------- |
| 8:00 AM  | Daily briefing to instructors                  |
| 9:45 AM  | Attendance reminder                            |
| 10:00 AM | Attendance verification (DMs late users)       |
| 1:45 PM  | Midday PR reminder                             |
| 2:00 PM  | Midday PR verification                         |
| 5:00 PM  | EOD reminder + tomorrow's assignment (Mon-Sat) |
| 11:59 PM | EOD verification + PR leaderboard              |

## Testing

- **Framework**: Vitest (runs via `bun run test`, NOT `bun test`)
- **Location**: `backend/src/test/`
- **Utilities**: `test/utils/testUtils.ts` - fixtures, db factory
- **Pattern**: Direct DB testing, mocked external services
- Always use `bun run test` to invoke vitest via the package.json script. `bun test` invokes Bun's built-in test runner which lacks full vitest API support (`vi.mock`, `vi.mocked`) and has different native module resolution.

When adding new features or changing existing behavior, add appropriate tests where needed.

## Workflow

Before starting non-trivial changes, enter plan mode and ask the user clarifying questions about requirements, edge cases, and preferred approach. Get explicit confirmation on the plan before writing any code.

After finishing work, run `bun run build` in the `frontend` and `backend` directories to make sure everything builds with no errors. Run `bun run test` in the `backend` directory to make sure all tests pass.

## Style Guide

- Use `bun` instead of `npm` or `npx`.
- Follow [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- Add JSDoc comments to exported functions
- Use descriptive variable names

## Gotchas

- **IMPORTANT**: The bot uses `USER_ID_TO_NAME_MAP` in `bot/constants.ts` to track current cohort members. Update this when cohort changes.
- **IMPORTANT**: Use `bun run test` (vitest) not `bun test` (Bun's built-in runner). Use `bun run build` (tsc) not `bun build` (Bun's bundler). The `bun <cmd>` and `bun run <cmd>` forms are different tools.
- Frontend dev server proxies `/api/*` to backend - no CORS issues in dev
- Database file is at `backend/db/attendabot.db` - not in src/
- Cron jobs only run if `CURRENT_COHORT_ROLE_ID` is set in constants
- Backend build uses `tsc` (TypeScript compiler), not `bun build`. Bundling would break `__dirname` path resolution, `better-sqlite3` native module, and frontend static file serving.
- Test files are excluded from `tsconfig.json` (`src/test/**/*` in `exclude`). This prevents `tsc` from trying to compile test files into `dist/` and avoids stale test JS causing issues.
