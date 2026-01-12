# Dev tooling

- Use `bun` instead of `npm` where possible.

# Project structure

- `backend/` - Express API server and Discord bot (port 3001)
- `frontend/` - React/Vite admin panel
- `.env` - Environment variables (at project root, shared by backend)

# Development

- Backend: `cd backend && bun run dev`
- Frontend: `cd frontend && bun run dev`
- Run both in separate terminals
- Visit http://localhost:5173 for admin panel (Vite proxies API to backend)

# Production

- Deploy with `./update-bot.sh`
- Backend serves frontend static files on port 3001
