# 2026-01-11-001: Project Restructure - Separate Frontend/Backend Directories

## Summary

Restructured the attendabot project from a nested structure (frontend inside `src/frontend/`) to a parallel sibling structure with `frontend/` and `backend/` as independent top-level directories. Each is now a self-contained Node project that builds separately.

## What We Did

### 1. Directory Restructure

- Moved `src/index.ts`, `src/api/`, `src/bot/`, `src/services/`, `src/test/` to `backend/src/`
- Moved `src/frontend/` to `frontend/`
- Moved `tsconfig.json` to `backend/`
- Created new `backend/package.json` with backend-only dependencies

### 2. Path Updates

- Updated `dotenv.config()` in `backend/src/index.ts` to load `.env` from project root (`../../.env`)
- Updated static file path in `backend/src/api/index.ts` to `../../../frontend/dist`

### 3. Deployment Script Updates

- Updated `update-bot.sh` to navigate into `backend/` and `frontend/` separately
- Added `--cwd ~/bootcamp-monorepo/attendabot/backend` to pm2 restart command

### 4. Cleanup

- Removed root `package.json`, `package-lock.json`, `bun.lock`
- Removed root `node_modules/` and `dist/`

## Final Structure

```
attendabot/
├── .env
├── .env.example
├── CLAUDE.md
├── README.md
├── update-bot.sh
├── devlogs/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── bun.lock
│   ├── node_modules/
│   ├── dist/
│   └── src/
│       ├── index.ts
│       ├── api/
│       ├── bot/
│       ├── services/
│       └── test/
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── bun.lock
    ├── node_modules/
    ├── dist/
    └── src/
```

## Files Modified

- `backend/src/index.ts` - Added path import, updated dotenv.config() path
- `backend/src/api/index.ts` - Updated frontendPath to `../../../frontend/dist`
- `backend/tsconfig.json` - Removed frontend from exclude
- `update-bot.sh` - Updated cd paths for new structure
- `CLAUDE.md` - Documented new structure

## Development Workflow

```bash
# Backend (in one terminal)
cd backend && bun run dev    # API on :3001

# Frontend (in another terminal)
cd frontend && bun run dev   # Vite on :5173
```

Visit http://localhost:5173 for admin panel (Vite proxies /api to backend).

## Deployment

Deployment tested successfully to EC2 at 54.87.34.182:

```bash
./update-bot.sh
```

- Backend builds in `backend/`
- Frontend builds in `frontend/`
- pm2 restarts `attendabot` with cwd set to backend directory
- Admin panel accessible at http://54.87.34.182:3001

## Commit

`91bf4c4` - Restructure attendabot into separate frontend/ and backend/ directories
