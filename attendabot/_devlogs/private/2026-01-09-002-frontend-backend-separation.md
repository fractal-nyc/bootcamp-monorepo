# 2026-01-09-002: Frontend/Backend Server Separation

## Summary

Separated frontend and backend servers for cleaner development workflow. Backend API now runs independently on port 3001, frontend dev server on port 5173 with proxy to API.

## What We Did

### 1. Configured Vite Proxy

- Added proxy config to `vite.config.ts`
- `/api` requests from frontend dev server now forward to `localhost:3001`

### 2. Made Static Serving Production-Only

- Backend no longer serves static frontend files in development
- Static file serving only activates when `NODE_ENV=production`

### 3. Added Dev Scripts

- `dev:frontend` - Run frontend dev server separately
- `dev:all` - Run both servers concurrently
- Added `concurrently` as dev dependency

## Files Modified

- `src/frontend/vite.config.ts` - Added server proxy config
- `src/api/index.ts` - Conditional static file serving
- `package.json` - New scripts and concurrently dep

## Development Workflow

```bash
# Run both servers
bun run dev:all

# Or separately:
bun run dev          # Backend API on :3001
bun run dev:frontend # Frontend on :5173
```

## Deployment Notes

Production deployment unchanged - backend still serves static files when `NODE_ENV=production`:

```bash
ssh attendabot
cd ~/attendabot && ./update-bot.sh
```

Make sure production environment has `NODE_ENV=production` set so static serving is enabled.

`attendabot/update-bot.sh` now exports `NODE_ENV=production` (if unset) before restarting PM2, so the Express API on port `${API_PORT:-3001}` serves the built frontend. The Vite dev server on port 5173 remains a local-only workflow.
