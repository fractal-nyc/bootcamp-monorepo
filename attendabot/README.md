# Discord Daily Automation Bot

This project provides a simple Discord bot written in TypeScript that automates four daily workflows for a team of 21 members:

1. Send a reminder message to the `#eod` channel encouraging everyone to post their end-of-day update.
2. Verify that all 21 members have posted in the `#eod` channel within the past 24 hours.
3. Send a 9:00 AM reminder message in the `#attendance` channel to prompt people to check in.
4. At 9:05 AM, verify that all 21 members have posted in the `#attendance` channel within the past 24 hours.

The schedules are implemented with cron expressions via [`node-cron`](https://github.com/node-cron/node-cron). Default times can be overridden through environment variables.

## Prerequisites

- Node.js 18+
- A Discord bot token with access to the target guild
- IDs for the `#eod` and `#attendance` text channels
- A comma-separated list of the 21 user IDs that should be tracked

## Configuration

Create a `.env` file using `.env.example` as a template:

```env
DISCORD_TOKEN=your-bot-token
EOD_CHANNEL_ID=eod-channel-id
ATTENDANCE_CHANNEL_ID=attendance-channel-id
USER_IDS=user-id-1,user-id-2,...,user-id-21
EOD_REMINDER_CRON=0 17 * * *
EOD_VERIFICATION_CRON=5 17 * * *
ATTENDANCE_REMINDER_CRON=0 9 * * *
ATTENDANCE_VERIFICATION_CRON=5 9 * * *
CRON_TIMEZONE=America/Los_Angeles
```

Cron expressions default to 5 PM/5:05 PM for end-of-day reminders and 9 AM/9:05 AM for attendance. Adjust them as needed (for example, to account for timezone differences) and optionally specify `CRON_TIMEZONE` to force scheduling in a specific timezone. The bot requires the `Guilds`, `GuildMessages`, and `MessageContent` intents to fetch messages from the configured channels.

## Installation

Install dependencies and build the project:

```bash
npm install
npm run build
```

> **Note:** If you are working in an offline or restricted network environment, dependency installation may fail. Ensure your environment can reach `registry.npmjs.org` or provide an offline mirror.

## Usage

1. Compile the TypeScript source:
   ```bash
   npm run build
   ```
2. Start the bot:
   ```bash
   npm start
   ```

During startup the bot logs in, schedules the cron jobs, and then runs each automation at its scheduled time. Verification jobs post a summary message in the relevant channel and mention any users who have not completed their update in the last 24 hours.

For development, you can run the bot directly with `ts-node`:

```bash
npm run dev
```

## Project Structure

- `src/index.ts`: Main bot implementation, cron scheduling, and verification logic.
- `.env.example`: Sample environment configuration.
- `tsconfig.json`: TypeScript compiler configuration.

## License

ISC
