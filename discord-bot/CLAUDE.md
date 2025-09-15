# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `bun dev` - Start bot in development mode with auto-restart on file changes
- `bun start` - Start bot in production mode
- `bun register` - Register slash commands with Discord (run after adding/modifying commands)
- `bun type-check` - TypeScript type checking without emitting files
- `bun test` - Run tests with Vitest
- `bun test:ui` - Run tests with Vitest UI
- `bun test:run` - Run tests once without watch mode

### Docker Commands
- `bun run docker:build` - Build Docker image
- `bun run docker:run` - Run Docker container

## Architecture Overview

This is a Discord bot for Fractal Tech bootcamp built with TypeScript, Bun, and Discord.js v14. The architecture follows a modular design with clear separation of concerns:

### Core Files Structure
- `src/bot.ts` - Main bot entry point, handles Discord client setup, events, and graceful shutdown
- `src/commands.ts` - Complete slash command system including definitions, registration, and execution handlers
- `src/register-commands.ts` - Standalone script for registering commands without starting the full bot
- `src/cron.ts` - Scheduled message system using node-cron with timezone support
- `src/roles.ts` - Role management utilities with predefined role mappings

### Key Architectural Patterns

**Two-Phase Command System**: Discord's slash commands require separate registration (sending command definitions to Discord) and execution phases (handling interactions). The `commands.ts` file handles both phases with a clear separation.

**Cron Job Management**: The bot uses a configuration-driven approach for scheduled messages with:
- Timezone support (America/New_York)
- Role mention processing
- Per-job enable/disable flags
- Error handling and thresholds for hosting delays

**Role System**: Centralized role management in `roles.ts` with:
- Predefined role mappings (`instructor`, `su2025`)
- Flexible mention processing (names, IDs, or formatted mentions)
- Guild-based role resolution

### Environment Variables Required
- `BOT_TOKEN` - Discord bot token
- `CLIENT_ID` - Discord application client ID  
- `GUILD_ID` - Discord guild ID (optional, for faster dev command updates)

### Testing
Uses Vitest for testing. Run `bun test` for watch mode or `bun test:run` for single execution.

### Important Notes
- The bot requires guild and guild member intents
- Commands include comprehensive error handling with ephemeral error messages
- Always run `bun register` after modifying command definitions