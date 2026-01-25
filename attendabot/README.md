# Attendabot

Discord bot for bootcamp attendance and EOD tracking, with a React admin dashboard for instructors.

## Features

- **Attendance tracking**: Morning reminders and verification with DMs to late students
- **EOD updates**: Evening reminders with PR leaderboard and assignment previews
- **Daily briefings**: AI-generated cohort summaries sent to instructors
- **Admin dashboard**: Web UI for managing students, viewing messages, and generating AI summaries
- **PR tracking**: Midday PR checks and end-of-day leaderboards

## Quick Start

```bash
# Install dependencies
cd backend && bun install
cd ../frontend && bun install

# Configure environment
cp .env.example .env
# Edit .env with your Discord token, JWT secret, etc.

# Run development servers (in separate terminals)
cd backend && bun run dev    # API + bot on port 3001
cd frontend && bun run dev   # Vite on port 5173

# Visit http://localhost:5173
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Admin    │────▶│  Express API    │────▶│     SQLite      │
│  (Vite :5173)   │     │    (:3001)      │     │  (attendabot.db)│
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
           ┌─────────────────┐      ┌─────────────────┐
           │  Discord Bot    │      │   Gemini LLM    │
           │  (cron jobs)    │      │   (summaries)   │
           └─────────────────┘      └─────────────────┘
```

## Project Structure

```
attendabot/
├── backend/              # Express API + Discord bot
│   ├── src/
│   │   ├── api/          # REST routes, middleware, WebSocket
│   │   ├── bot/          # Cron scheduler, curriculum
│   │   └── services/     # DB, Discord, LLM, logging
│   └── db/               # SQLite database file
├── frontend/             # React admin dashboard
│   └── src/
│       ├── components/   # UI components
│       ├── api/          # API client
│       └── hooks/        # Custom hooks
├── _devlogs/             # Development notes
├── CLAUDE.md             # Developer documentation
└── update-bot.sh         # Production deployment script
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord bot token |
| `JWT_SECRET` | Secret for admin panel authentication |
| `ADMIN_PASSWORD` | Admin login password |
| `GEMINI_API_KEY` | Google Gemini API key (optional, for AI features) |
| `CURRENT_COHORT_ID` | Active cohort ID for daily briefings |
| `EC2_HOST` | Production server IP for deployment |

See `.env.example` for all options.

## Bot Schedule (America/New_York)

| Time | Action |
|------|--------|
| 8:00 AM | Daily briefing to instructors |
| 9:45 AM | Attendance reminder |
| 10:00 AM | Attendance verification (DMs late users) |
| 12:45 PM | Midday PR reminder |
| 1:00 PM | Midday PR verification |
| 5:00 PM | EOD reminder + next day's assignment (Mon-Sat) |
| 11:59 PM | EOD verification + PR leaderboard |

## Testing

```bash
cd backend && bun test          # Run all 148 tests
cd backend && bun test <file>   # Run specific test file
```

## Deployment

```bash
./update-bot.sh   # Pulls latest, builds, restarts pm2 on EC2
```

## Documentation

- `CLAUDE.md` - Project overview and commands
- `backend/CLAUDE.md` - Backend architecture and API reference
- `frontend/CLAUDE.md` - Frontend components and patterns

## License

ISC
